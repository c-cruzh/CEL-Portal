import { useState } from "react";
import {
  useGetMe,
  useListNotificationRecipients,
  useAddNotificationRecipient,
  useDeleteNotificationRecipient,
  useTestNotificationRecipients,
  useListNotificationLog,
  getListNotificationRecipientsQueryKey,
  getListNotificationLogQueryKey,
  ApiError,
  type NotificationLogEntry,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const PM_ROLE_IDS = ["pm_lead", "pm_cel"];

export default function Configuracion() {
  const { data: me, isLoading: isLoadingMe } = useGetMe();

  if (isLoadingMe) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const isPM = me?.roles?.some((r) => PM_ROLE_IDS.includes(r));

  if (!isPM) {
    return (
      <div className="max-w-xl mx-auto mt-12 text-center space-y-2">
        <h1 className="text-2xl font-semibold">Acceso restringido</h1>
        <p className="text-muted-foreground">
          Esta sección está disponible solo para los PM del piloto. Si necesitas
          modificar la configuración, contacta a un PM para que agregue tu rol.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          Ajustes administrativos del piloto, reservados a los PM.
        </p>
      </div>
      <NotificationRecipientsSection />
      <NotificationLogSection />
    </div>
  );
}

function NotificationRecipientsSection() {
  const { data, isLoading } = useListNotificationRecipients();
  const queryClient = useQueryClient();
  const addMutation = useAddNotificationRecipient();
  const deleteMutation = useDeleteNotificationRecipient();
  const testMutation = useTestNotificationRecipients();
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const handleTest = async () => {
    try {
      const result = await testMutation.mutateAsync();
      void invalidateLog();
      const variant =
        result.status === "sent"
          ? "default"
          : result.status === "no_provider"
            ? "default"
            : "destructive";
      const title =
        result.status === "sent"
          ? "Correo de prueba enviado"
          : result.status === "no_provider"
            ? "Proveedor de correo no configurado"
            : result.status === "no_recipients"
              ? "Sin destinatarios"
              : "No se pudo enviar";
      const countLine = `Destinatarios evaluados: ${result.recipientCount}`;
      toast({
        title,
        description: `${countLine}. ${result.message}`,
        variant,
      });
    } catch (err) {
      toast({
        title: "No se pudo enviar el correo de prueba",
        description:
          err instanceof ApiError
            ? err.data?.error || err.message
            : err instanceof Error
              ? err.message
              : "Error inesperado",
        variant: "destructive",
      });
    }
  };

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: getListNotificationRecipientsQueryKey(),
    });

  const invalidateLog = () =>
    queryClient.invalidateQueries({
      queryKey: getListNotificationLogQueryKey(),
    });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({
        title: "Correo inválido",
        description: "Ingresa una dirección de correo válida.",
        variant: "destructive",
      });
      return;
    }
    try {
      await addMutation.mutateAsync({ data: { email: trimmed } });
      setEmail("");
      await invalidate();
      toast({
        title: "Destinatario agregado",
        description: `${trimmed} recibirá los próximos avisos del equipo.`,
      });
    } catch (err) {
      toast({
        title: "No se pudo agregar",
        description:
          err instanceof ApiError
            ? err.data?.error || err.message
            : err instanceof Error
              ? err.message
              : "Error inesperado",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (recipientEmail: string) => {
    try {
      await deleteMutation.mutateAsync({ email: recipientEmail });
      await invalidate();
      toast({
        title: "Destinatario eliminado",
        description: `${recipientEmail} dejará de recibir avisos.`,
      });
    } catch (err) {
      toast({
        title: "No se pudo eliminar",
        description:
          err instanceof Error ? err.message : "Error inesperado",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Destinatarios fijos de avisos</CardTitle>
            <CardDescription>
              Estos correos siempre reciben las notificaciones del equipo (nuevos
              miembros, CV actualizados, cambios de roles), además de los miembros
              registrados que no hayan desactivado los avisos. La variable de
              entorno <code className="text-xs">TEAM_NOTIFICATION_RECIPIENTS</code>{" "}
              sigue vigente y se combina con esta lista.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={testMutation.isPending}
            className="shrink-0"
          >
            {testMutation.isPending ? "Enviando..." : "Enviar prueba"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          onSubmit={handleAdd}
          className="flex flex-col sm:flex-row gap-3 sm:items-end"
        >
          <div className="flex-1 space-y-2">
            <Label htmlFor="recipient-email">Agregar correo</Label>
            <Input
              id="recipient-email"
              type="email"
              placeholder="persona@cel.gob.sv"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
          </div>
          <Button type="submit" disabled={addMutation.isPending}>
            {addMutation.isPending ? "Agregando..." : "Agregar"}
          </Button>
        </form>

        <div className="border rounded-lg divide-y">
          {isLoading && (
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          )}
          {!isLoading && (!data || data.length === 0) && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No hay destinatarios fijos configurados. Solo los miembros
              registrados (con avisos activados) recibirán las notificaciones.
            </div>
          )}
          {!isLoading &&
            data?.map((r) => (
              <div
                key={r.email}
                className="p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{r.email}</p>
                  {r.addedBy && (
                    <p className="text-xs text-muted-foreground truncate">
                      Agregado por {r.addedBy}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="secondary" className="hidden sm:inline-flex">
                    Fijo
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(r.email)}
                    disabled={deleteMutation.isPending}
                  >
                    Quitar
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

const EVENT_LABELS: Record<string, string> = {
  member_joined: "Nuevo miembro",
  cv_uploaded: "CV actualizado",
  roles_changed: "Cambio de roles",
  test: "Correo de prueba",
};

const STATUS_LABELS: Record<string, string> = {
  sent: "Enviado",
  no_provider: "Sin proveedor",
  no_recipients: "Sin destinatarios",
  failed: "Falló",
};

function formatDateTime(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleString("es-SV", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function StatusBadge({ status }: { status: NotificationLogEntry["status"] }) {
  const label = STATUS_LABELS[status] ?? status;
  if (status === "failed") {
    return <Badge variant="destructive">{label}</Badge>;
  }
  if (status === "sent") {
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">
        {label}
      </Badge>
    );
  }
  return <Badge variant="secondary">{label}</Badge>;
}

function NotificationLogSection() {
  const { data, isLoading, refetch, isFetching } = useListNotificationLog({
    query: {
      queryKey: getListNotificationLogQueryKey(),
      refetchInterval: 30_000,
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Historial de avisos enviados</CardTitle>
            <CardDescription>
              Últimos intentos de envío (eventos reales y pruebas). Si un envío
              falla por una mala API key o un destinatario rebotado, aparece
              destacado aquí. Se muestran los 20 más recientes.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="shrink-0"
          >
            {isFetching ? "Actualizando..." : "Actualizar"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg divide-y">
          {isLoading && (
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          )}
          {!isLoading && (!data || data.length === 0) && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Todavía no hay envíos registrados. Envía un correo de prueba o
              espera al próximo evento del equipo.
            </div>
          )}
          {!isLoading &&
            data?.map((entry) => {
              const isFailed = entry.status === "failed";
              return (
                <div
                  key={entry.id}
                  className={`p-4 space-y-2 ${
                    isFailed ? "bg-destructive/5" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-sm">
                        {EVENT_LABELS[entry.eventKind] ?? entry.eventKind}
                      </span>
                      <StatusBadge status={entry.status} />
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDateTime(entry.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {entry.recipientCount} destinatario
                    {entry.recipientCount === 1 ? "" : "s"}
                    {entry.recipients.length > 0 && (
                      <>
                        {": "}
                        <span className="break-all">
                          {entry.recipients.slice(0, 5).join(", ")}
                          {entry.recipients.length > 5 &&
                            ` y ${entry.recipients.length - 5} más`}
                        </span>
                      </>
                    )}
                  </p>
                  {entry.triggeredBy && (
                    <p className="text-xs text-muted-foreground truncate">
                      Origen: {entry.triggeredBy}
                    </p>
                  )}
                  {entry.providerMessage && (
                    <p
                      className={`text-xs ${
                        isFailed
                          ? "text-destructive"
                          : "text-muted-foreground"
                      }`}
                    >
                      {entry.providerMessage}
                    </p>
                  )}
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}

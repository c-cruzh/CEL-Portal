import { useState } from "react";
import {
  useGetMe,
  useListNotificationRecipients,
  useAddNotificationRecipient,
  useDeleteNotificationRecipient,
  getListNotificationRecipientsQueryKey,
  ApiError,
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
    </div>
  );
}

function NotificationRecipientsSection() {
  const { data, isLoading } = useListNotificationRecipients();
  const queryClient = useQueryClient();
  const addMutation = useAddNotificationRecipient();
  const deleteMutation = useDeleteNotificationRecipient();
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: getListNotificationRecipientsQueryKey(),
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
        <CardTitle>Destinatarios fijos de avisos</CardTitle>
        <CardDescription>
          Estos correos siempre reciben las notificaciones del equipo (nuevos
          miembros, CV actualizados, cambios de roles), además de los miembros
          registrados que no hayan desactivado los avisos. La variable de
          entorno <code className="text-xs">TEAM_NOTIFICATION_RECIPIENTS</code>{" "}
          sigue vigente y se combina con esta lista.
        </CardDescription>
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

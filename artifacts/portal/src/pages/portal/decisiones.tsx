import { useMemo, useState } from "react";
import {
  useListDecisions,
  useCreateDecision,
  useUpdateDecision,
  useResolveDecision,
  useReopenDecision,
  useDeleteDecision,
  useListTeamMembers,
  useGetMe,
  getListDecisionsQueryKey,
  ApiError,
  type Decision,
  type DecisionInput,
  type DecisionUpdate,
  type Member,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ROLES, PHASES } from "@/lib/projectContent";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BatchImportDecisionsDialog } from "./BatchImportDecisionsDialog";

const PM_ROLE_IDS = ["pm_lead", "pm_cel"];
const NONE_VALUE = "__none__";

const STATUS_OPTIONS: Array<{ value: Decision["status"]; label: string }> = [
  { value: "open", label: "Abierta" },
  { value: "in_analysis", label: "En análisis" },
  { value: "resolved", label: "Resuelta" },
  { value: "cancelled", label: "Cancelada" },
];

const STATUS_LABEL: Record<Decision["status"], string> = {
  open: "Abierta",
  in_analysis: "En análisis",
  resolved: "Resuelta",
  cancelled: "Cancelada",
};

export function isDecisionOverdue(d: Decision): boolean {
  if (!d.dueDate) return false;
  if (d.status === "resolved" || d.status === "cancelled") return false;
  const due = new Date(d.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString("es-SV", { dateStyle: "medium" });
}

function StatusBadge({ status }: { status: Decision["status"] }) {
  if (status === "resolved") {
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">
        {STATUS_LABEL[status]}
      </Badge>
    );
  }
  if (status === "cancelled") {
    return <Badge variant="secondary">{STATUS_LABEL[status]}</Badge>;
  }
  if (status === "in_analysis") {
    return (
      <Badge className="bg-amber-500 hover:bg-amber-500 text-white">
        {STATUS_LABEL[status]}
      </Badge>
    );
  }
  return <Badge variant="outline">{STATUS_LABEL[status]}</Badge>;
}

export default function Decisiones() {
  const { data: me } = useGetMe();
  const { data: members } = useListTeamMembers();
  const { data: decisions, isLoading } = useListDecisions();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMut = useCreateDecision();
  const updateMut = useUpdateDecision();
  const resolveMut = useResolveDecision();
  const reopenMut = useReopenDecision();
  const deleteMut = useDeleteDecision();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [decidedByMeOnly, setDecidedByMeOnly] = useState<boolean>(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Decision | null>(null);
  const [resolving, setResolving] = useState<Decision | null>(null);
  const [batchOpen, setBatchOpen] = useState(false);

  const isPM = me?.roles?.some((r) => PM_ROLE_IDS.includes(r)) ?? false;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListDecisionsQueryKey() });

  const filtered = useMemo(() => {
    if (!decisions) return [];
    return decisions.filter((d) => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (ownerFilter !== "all") {
        if (ownerFilter.startsWith("role:")) {
          if (d.ownerRole !== ownerFilter.slice(5)) return false;
        } else if (ownerFilter.startsWith("user:")) {
          if (d.ownerUserId !== ownerFilter.slice(5)) return false;
        } else if (ownerFilter === "unassigned") {
          if (d.ownerUserId || d.ownerRole) return false;
        }
      }
      if (phaseFilter !== "all" && d.phase !== phaseFilter) return false;
      if (decidedByMeOnly) {
        if (!me?.id || d.decidedByUserId !== me.id) return false;
      }
      return true;
    });
  }, [decisions, statusFilter, ownerFilter, phaseFilter, decidedByMeOnly, me?.id]);

  const openCount =
    decisions?.filter(
      (d) => d.status === "open" || d.status === "in_analysis",
    ).length ?? 0;
  const overdueCount = decisions?.filter(isDecisionOverdue).length ?? 0;

  const handleErrorToast = (err: unknown, title: string) => {
    toast({
      title,
      description:
        err instanceof ApiError
          ? err.data?.error || err.message
          : err instanceof Error
            ? err.message
            : "Error inesperado",
      variant: "destructive",
    });
  };

  const handleCreate = async (input: DecisionInput) => {
    try {
      await createMut.mutateAsync({ data: input });
      await invalidate();
      setCreateOpen(false);
      toast({ title: "Decisión registrada" });
    } catch (err) {
      handleErrorToast(err, "No se pudo registrar la decisión");
    }
  };

  const handleUpdate = async (id: string, update: DecisionUpdate) => {
    try {
      await updateMut.mutateAsync({ id, data: update });
      await invalidate();
      setEditing(null);
      toast({ title: "Decisión actualizada" });
    } catch (err) {
      handleErrorToast(err, "No se pudo actualizar la decisión");
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "¿Eliminar esta decisión? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }
    try {
      await deleteMut.mutateAsync({ id });
      await invalidate();
      toast({ title: "Decisión eliminada" });
    } catch (err) {
      handleErrorToast(err, "No se pudo eliminar la decisión");
    }
  };

  const handleResolve = async (
    id: string,
    data: {
      decidedOutcome: string;
      decidedOptionId: string | null;
      decidedAt: string;
    },
  ) => {
    try {
      await resolveMut.mutateAsync({
        id,
        data: {
          decidedOutcome: data.decidedOutcome,
          decidedOptionId: data.decidedOptionId,
          decidedAt: data.decidedAt,
          resolution: data.decidedOutcome,
        },
      });
      await invalidate();
      setResolving(null);
      toast({ title: "Decisión marcada como resuelta" });
    } catch (err) {
      handleErrorToast(err, "No se pudo resolver la decisión");
    }
  };

  const handleReopen = async (id: string) => {
    if (
      !window.confirm(
        "¿Reabrir esta decisión? Se quitará la resolución registrada y la decisión volverá al tablero de pendientes.",
      )
    ) {
      return;
    }
    try {
      await reopenMut.mutateAsync({ id, data: { status: "open" } });
      await invalidate();
      toast({ title: "Decisión reabierta" });
    } catch (err) {
      handleErrorToast(err, "No se pudo reabrir la decisión");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Decisiones pendientes
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Registro de decisiones técnicas o de gobernanza que bloquean al
            piloto. Cada decisión tiene un dueño claro, fecha límite y queda
            documentada al resolverse.
          </p>
        </div>
        <div className="flex gap-2">
          {isPM && (
            <Button
              variant="outline"
              onClick={() => setBatchOpen(true)}
              data-testid="button-open-decisions-batch"
            >
              Importar lote
            </Button>
          )}
          <Button onClick={() => setCreateOpen(true)}>Nueva decisión</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{decisions?.length ?? 0}</CardTitle>
            <CardDescription>Decisiones totales</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{openCount}</CardTitle>
            <CardDescription>Abiertas o en análisis</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl text-destructive">
              {overdueCount}
            </CardTitle>
            <CardDescription>Vencidas sin resolver</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Dueño</Label>
              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="unassigned">Sin asignar</SelectItem>
                  {ROLES.map((r) => (
                    <SelectItem key={`role-${r.id}`} value={`role:${r.id}`}>
                      Rol: {r.label}
                    </SelectItem>
                  ))}
                  {members?.map((m) => (
                    <SelectItem key={`user-${m.id}`} value={`user:${m.id}`}>
                      {m.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fase</Label>
              <Select value={phaseFilter} onValueChange={setPhaseFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {PHASES.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.shortName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {me?.id && (
            <div className="mt-3 flex items-center gap-2">
              <input
                id="filter-decided-by-me"
                type="checkbox"
                className="h-4 w-4"
                checked={decidedByMeOnly}
                onChange={(e) => setDecidedByMeOnly(e.target.checked)}
                data-testid="checkbox-decided-by-me"
              />
              <Label
                htmlFor="filter-decided-by-me"
                className="text-xs cursor-pointer"
              >
                Decididas por mí
              </Label>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {isLoading && (
          <>
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
            No hay decisiones que coincidan con los filtros actuales.
          </div>
        )}
        {!isLoading &&
          filtered.map((d) => (
            <DecisionCard
              key={d.id}
              decision={d}
              members={members ?? []}
              currentUserId={me?.id ?? null}
              meRoles={me?.roles ?? []}
              isPM={isPM}
              onEdit={() => setEditing(d)}
              onResolve={() => setResolving(d)}
              onReopen={() => handleReopen(d.id)}
              onDelete={() => handleDelete(d.id)}
              reopenPending={reopenMut.isPending}
            />
          ))}
      </div>

      {createOpen && (
        <DecisionFormDialog
          mode="create"
          members={members ?? []}
          pending={createMut.isPending}
          onClose={() => setCreateOpen(false)}
          onSubmit={(input) => handleCreate(input as DecisionInput)}
        />
      )}

      {editing && (
        <DecisionFormDialog
          mode="edit"
          initial={editing}
          members={members ?? []}
          pending={updateMut.isPending}
          onClose={() => setEditing(null)}
          onSubmit={(update) =>
            handleUpdate(editing.id, update as DecisionUpdate)
          }
        />
      )}

      {resolving && (
        <ResolveDialog
          decision={resolving}
          pending={resolveMut.isPending}
          onClose={() => setResolving(null)}
          onSubmit={(data) => handleResolve(resolving.id, data)}
        />
      )}

      {batchOpen && (
        <BatchImportDecisionsDialog
          open={batchOpen}
          onClose={() => setBatchOpen(false)}
        />
      )}
    </div>
  );
}

function DecisionCard({
  decision: d,
  members,
  currentUserId,
  meRoles,
  isPM,
  onEdit,
  onResolve,
  onReopen,
  onDelete,
  reopenPending,
}: {
  decision: Decision;
  members: Member[];
  currentUserId: string | null;
  meRoles: string[];
  isPM: boolean;
  onEdit: () => void;
  onResolve: () => void;
  onReopen: () => void;
  onDelete: () => void;
  reopenPending: boolean;
}) {
  const overdue = isDecisionOverdue(d);
  const ownerName = d.ownerUserId
    ? members.find((m) => m.id === d.ownerUserId)?.displayName ??
      "Miembro asignado"
    : d.ownerRole
      ? ROLES.find((r) => r.id === d.ownerRole)?.label ?? d.ownerRole
      : "Sin asignar";
  const isOwnerByRole = !!d.ownerRole && meRoles.includes(d.ownerRole);
  const hasOwnerOrPmPermission =
    isPM ||
    (currentUserId !== null && d.ownerUserId === currentUserId) ||
    isOwnerByRole;
  const canResolve =
    d.status !== "resolved" &&
    d.status !== "cancelled" &&
    hasOwnerOrPmPermission;
  const canReopen =
    (d.status === "resolved" || d.status === "cancelled") &&
    hasOwnerOrPmPermission;

  return (
    <Card className={overdue ? "border-destructive/60" : undefined}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg">{d.title}</CardTitle>
              <StatusBadge status={d.status} />
              {overdue && <Badge variant="destructive">Vencida</Badge>}
              {d.phase && (
                <Badge variant="secondary">
                  {PHASES.find((p) => p.id === d.phase)?.shortName ?? d.phase}
                </Badge>
              )}
            </div>
            <CardDescription>
              Dueño: <span className="font-medium">{ownerName}</span> ·
              Solicitada el {formatDate(d.requestedAt)}
              {d.dueDate && (
                <>
                  {" "}
                  · Fecha límite{" "}
                  <span
                    className={
                      overdue ? "text-destructive font-medium" : "font-medium"
                    }
                  >
                    {formatDate(d.dueDate)}
                  </span>
                </>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {d.status !== "resolved" && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                Editar
              </Button>
            )}
            {canResolve && (
              <Button size="sm" onClick={onResolve}>
                Resolver
              </Button>
            )}
            {canReopen && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReopen}
                disabled={reopenPending}
              >
                Reabrir
              </Button>
            )}
            {(isPM ||
              (currentUserId !== null && d.createdBy === currentUserId)) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                Eliminar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      {(d.context || d.optionsConsidered || d.resolution) && (
        <CardContent className="space-y-3 text-sm">
          {d.context && (
            <div>
              <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">
                Contexto
              </p>
              <p className="whitespace-pre-wrap">{d.context}</p>
            </div>
          )}
          {d.optionsConsidered && (
            <div>
              <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">
                Opciones consideradas
              </p>
              <p className="whitespace-pre-wrap">{d.optionsConsidered}</p>
            </div>
          )}
          {(d.decidedOutcome || d.resolution) && (
            <div
              className="border-l-4 border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 pl-3 pr-3 py-2 rounded-r"
              data-testid={`decision-resolved-${d.id}`}
            >
              {(() => {
                const outcome = d.decidedOutcome ?? d.resolution ?? "";
                const decisorName = d.decidedByUserId
                  ? members.find((m) => m.id === d.decidedByUserId)
                      ?.displayName ?? "Miembro del equipo"
                  : null;
                const when = d.decidedAt ?? d.resolvedAt ?? null;
                const headerParts: string[] = [];
                if (decisorName)
                  headerParts.push(`Decidido por ${decisorName}`);
                if (when) headerParts.push(`el ${formatDate(when)}`);
                return (
                  <>
                    <p className="font-semibold text-sm text-emerald-800 dark:text-emerald-300 mb-1">
                      {headerParts.join(" ") || "Resolución registrada"}
                      {d.decidedOptionId && (
                        <>
                          {" · "}
                          <span className="italic">
                            Opción: {d.decidedOptionId}
                          </span>
                        </>
                      )}
                    </p>
                    <p className="whitespace-pre-wrap text-sm">{outcome}</p>
                  </>
                );
              })()}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function DecisionFormDialog({
  mode,
  initial,
  members,
  pending,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  initial?: Decision;
  members: Member[];
  pending: boolean;
  onClose: () => void;
  onSubmit: (data: DecisionInput | DecisionUpdate) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [context, setContext] = useState(initial?.context ?? "");
  const [options, setOptions] = useState(initial?.optionsConsidered ?? "");
  const [phase, setPhase] = useState<string>(initial?.phase ?? NONE_VALUE);
  const [ownerKind, setOwnerKind] = useState<"none" | "role" | "user">(
    initial?.ownerUserId ? "user" : initial?.ownerRole ? "role" : "none",
  );
  const [ownerRole, setOwnerRole] = useState<string>(initial?.ownerRole ?? "");
  const [ownerUserId, setOwnerUserId] = useState<string>(
    initial?.ownerUserId ?? "",
  );
  const [dueDate, setDueDate] = useState<string>(
    initial?.dueDate
      ? typeof initial.dueDate === "string"
        ? initial.dueDate.slice(0, 10)
        : new Date(initial.dueDate).toISOString().slice(0, 10)
      : "",
  );
  const [status, setStatus] = useState<Decision["status"]>(
    initial?.status ?? "open",
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const payload: DecisionInput | DecisionUpdate = {
      title: title.trim(),
      context,
      optionsConsidered: options,
      phase: phase === NONE_VALUE ? null : phase,
      ownerRole: ownerKind === "role" ? ownerRole || null : null,
      ownerUserId: ownerKind === "user" ? ownerUserId || null : null,
      dueDate: dueDate || null,
    };
    if (mode === "edit" && status !== "resolved") {
      (payload as DecisionUpdate).status = status as
        | "open"
        | "in_analysis"
        | "cancelled";
    }
    onSubmit(payload);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nueva decisión" : "Editar decisión"}
          </DialogTitle>
          <DialogDescription>
            Captura claramente qué hay que decidir, quién lo decide y para
            cuándo. Las decisiones disparan un aviso al equipo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="dec-title">Título *</Label>
            <Input
              id="dec-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={240}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dec-context">Contexto</Label>
            <Textarea
              id="dec-context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
              placeholder="¿Qué está en juego? ¿Qué supuestos importan?"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dec-options">Opciones consideradas</Label>
            <Textarea
              id="dec-options"
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              rows={3}
              placeholder={"Opción A: ...\nOpción B: ..."}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Fase</Label>
              <Select value={phase} onValueChange={setPhase}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Sin fase</SelectItem>
                  {PHASES.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.shortName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dec-due">Fecha límite</Label>
              <Input
                id="dec-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dueño</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                value={ownerKind}
                onValueChange={(v) => setOwnerKind(v as typeof ownerKind)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  <SelectItem value="role">Asignar a un rol</SelectItem>
                  <SelectItem value="user">Asignar a una persona</SelectItem>
                </SelectContent>
              </Select>
              {ownerKind === "role" && (
                <div className="sm:col-span-2">
                  <Select value={ownerRole} onValueChange={setOwnerRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {ownerKind === "user" && (
                <div className="sm:col-span-2">
                  <Select value={ownerUserId} onValueChange={setOwnerUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un miembro" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {mode === "edit" && initial?.status !== "resolved" && (
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as Decision["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Abierta</SelectItem>
                  <SelectItem value="in_analysis">En análisis</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Para marcar como Resuelta usa el botón "Resolver" en la tarjeta.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending
                ? "Guardando..."
                : mode === "create"
                  ? "Crear"
                  : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResolveDialog({
  decision,
  pending,
  onClose,
  onSubmit,
}: {
  decision: Decision;
  pending: boolean;
  onClose: () => void;
  onSubmit: (data: {
    decidedOutcome: string;
    decidedOptionId: string | null;
    decidedAt: string;
  }) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [decidedOutcome, setDecidedOutcome] = useState("");
  const [decidedOptionId, setDecidedOptionId] = useState<string>(NONE_VALUE);
  const [decidedAt, setDecidedAt] = useState<string>(today);

  const optionChoices = useMemo(() => {
    const raw = decision.optionsConsidered ?? "";
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const sepIdx = line.search(/[:—-]/);
        const label =
          sepIdx > 0 ? line.slice(0, sepIdx).trim() : line;
        return label;
      })
      .filter((label, idx, arr) => arr.indexOf(label) === idx);
  }, [decision.optionsConsidered]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!decidedOutcome.trim()) return;
    if (!decidedAt) return;
    onSubmit({
      decidedOutcome: decidedOutcome.trim(),
      decidedOptionId:
        decidedOptionId === NONE_VALUE ? null : decidedOptionId,
      decidedAt,
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolver decisión</DialogTitle>
          <DialogDescription>
            "{decision.title}" — describe la decisión tomada. El equipo recibirá
            un aviso con el resultado y quién decidió.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {optionChoices.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="decided-option">Opción elegida</Label>
              <Select
                value={decidedOptionId}
                onValueChange={setDecidedOptionId}
              >
                <SelectTrigger
                  id="decided-option"
                  data-testid="select-decided-option"
                >
                  <SelectValue placeholder="(sin opción específica)" />
                </SelectTrigger>
                <SelectContent>
                  {optionChoices.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                  <SelectItem value={NONE_VALUE}>
                    Otra (especificar abajo)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Opciones detectadas en el cuerpo de la decisión. Si la decisión
                final no encaja con ninguna, elige "Otra" y descríbela en el
                resultado.
              </p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="decided-outcome">Resultado *</Label>
            <Textarea
              id="decided-outcome"
              value={decidedOutcome}
              onChange={(e) => setDecidedOutcome(e.target.value)}
              rows={5}
              required
              maxLength={2000}
              placeholder="¿Qué se decidió y por qué?"
              data-testid="textarea-decided-outcome"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="decided-at">Fecha de la decisión *</Label>
            <Input
              id="decided-at"
              type="date"
              value={decidedAt}
              onChange={(e) => setDecidedAt(e.target.value)}
              required
              data-testid="input-decided-at"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={pending || !decidedOutcome.trim() || !decidedAt}
              data-testid="button-submit-resolve"
            >
              {pending ? "Guardando..." : "Marcar resuelta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useMemo, useState } from "react";
import {
  useGetProjectConfig,
  useListMilestones,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
  useGetMe,
  useGetCalendarFeedUrl,
  getGetCalendarFeedUrlUrl,
  getListMilestonesQueryKey,
  type Milestone,
  type MilestoneInput,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ROLES, PHASES } from "@/lib/projectContent";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";

const PM_ROLE_IDS = ["pm_lead", "pm_cel"];

type Kind = Milestone["kind"];

const KIND_META: Record<Kind, { label: string; color: string; dot: string }> = {
  phase_milestone: { label: "Hito de fase", color: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500" },
  deliverable: { label: "Entregable", color: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  weekly_session: { label: "Sesión semanal", color: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
  presentation: { label: "Presentación", color: "bg-purple-100 text-purple-800 border-purple-200", dot: "bg-purple-500" },
  workshop: { label: "Taller", color: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  decision: { label: "Decisión clave", color: "bg-rose-100 text-rose-800 border-rose-200", dot: "bg-rose-500" },
};

const ALL_KINDS = Object.keys(KIND_META) as Kind[];

function milestoneDate(m: Milestone, startDate: Date | null): Date | null {
  if (!startDate) return null;
  // weekOffset = 1 means first week starting on T0
  return addDays(startDate, (m.weekOffset - 1) * 7);
}

function roleLabel(id: string): string {
  return ROLES.find((r) => r.id === id)?.label ?? id;
}

function phaseLabel(id: string | null | undefined): string | null {
  if (!id) return null;
  return PHASES.find((p) => p.id === id)?.label ?? id;
}

export default function Calendario() {
  const { data: config, isLoading: loadingConfig } = useGetProjectConfig();
  const { data: milestones, isLoading: loadingMilestones } = useListMilestones();
  const { data: me } = useGetMe();
  const isPM = me?.roles?.some((r) => PM_ROLE_IDS.includes(r)) ?? false;

  const startDate = config?.startDate ? parseISO(config.startDate) : null;
  const [activeKinds, setActiveKinds] = useState<Kind[]>(ALL_KINDS);
  const [editing, setEditing] = useState<Milestone | "new" | null>(null);

  const toggleKind = (k: Kind) =>
    setActiveKinds((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  const visible = useMemo(
    () => (milestones ?? []).filter((m) => activeKinds.includes(m.kind as Kind)),
    [milestones, activeKinds],
  );

  if (loadingConfig || loadingMilestones) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Calendario del Piloto</h1>
          <p className="text-muted-foreground mt-1">
            Hitos y reuniones del proyecto. Modo {startDate ? "calendario" : "T0 + n semanas"}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportCalendarButtons />
          {isPM && (
            <Button onClick={() => setEditing("new")} data-testid="button-new-milestone">
              + Nuevo hito
            </Button>
          )}
        </div>
      </div>

      {!startDate && (
        <Card className="bg-muted/30 border-dashed border-border">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Aún no se ha definido la fecha de inicio (T0). Los hitos se muestran como{" "}
            <span className="font-medium text-foreground">"Semana N (T0+N)"</span>. Configura T0 en la
            pestaña Cronograma para ver fechas absolutas.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtrar por tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ALL_KINDS.map((k) => {
              const active = activeKinds.includes(k);
              const meta = KIND_META[k];
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggleKind(k)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-all ${
                    active ? meta.color : "bg-transparent text-muted-foreground border-border opacity-60"
                  }`}
                  data-testid={`filter-${k}`}
                >
                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="month">
        <TabsList>
          <TabsTrigger value="month" data-testid="tab-month">Vista mensual</TabsTrigger>
          <TabsTrigger value="list" data-testid="tab-list">Vista lista</TabsTrigger>
        </TabsList>
        <TabsContent value="month" className="mt-4">
          <MonthView
            milestones={visible}
            startDate={startDate}
            onSelect={(m) => setEditing(m)}
            isPM={isPM}
          />
        </TabsContent>
        <TabsContent value="list" className="mt-4">
          <ListView
            milestones={visible}
            startDate={startDate}
            onSelect={(m) => setEditing(m)}
          />
        </TabsContent>
      </Tabs>

      {editing && (
        <MilestoneDialog
          milestone={editing === "new" ? null : editing}
          isPM={isPM}
          startDate={startDate}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function MonthView({
  milestones,
  startDate,
  onSelect,
  isPM,
}: {
  milestones: Milestone[];
  startDate: Date | null;
  onSelect: (m: Milestone) => void;
  isPM: boolean;
}) {
  const initial = startDate ?? new Date();
  const [cursor, setCursor] = useState<Date>(startOfMonth(initial));

  if (!startDate) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          La vista mensual requiere una fecha T0 configurada. Consulta la pestaña{" "}
          <span className="font-medium text-foreground">Cronograma</span> para definirla. Mientras tanto,
          puedes usar la <span className="font-medium text-foreground">vista lista</span>.
        </CardContent>
      </Card>
    );
  }

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);

  const byDay = new Map<string, Milestone[]>();
  for (const m of milestones) {
    const d = milestoneDate(m, startDate);
    if (!d) continue;
    const key = format(d, "yyyy-MM-dd");
    const arr = byDay.get(key) ?? [];
    arr.push(m);
    byDay.set(key, arr);
  }

  const today = new Date();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base capitalize">
          {format(cursor, "LLLL yyyy", { locale: es })}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCursor(addMonths(cursor, -1))}>
            ←
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCursor(startOfMonth(startDate))}
          >
            T0
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(addMonths(cursor, 1))}>
            →
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-px text-xs text-muted-foreground mb-1">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
            <div key={d} className="px-2 py-1 font-medium">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-border rounded-md overflow-hidden">
          {days.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const items = byDay.get(key) ?? [];
            const inMonth = isSameMonth(d, cursor);
            const isToday = isSameDay(d, today);
            return (
              <div
                key={key}
                className={`bg-card min-h-[88px] p-1.5 ${inMonth ? "" : "opacity-50"}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[11px] font-medium ${
                      isToday
                        ? "bg-primary text-primary-foreground px-1.5 rounded-full"
                        : "text-foreground"
                    }`}
                  >
                    {format(d, "d")}
                  </span>
                </div>
                <div className="space-y-1">
                  {items.slice(0, 3).map((m) => {
                    const meta = KIND_META[m.kind as Kind];
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => onSelect(m)}
                        className={`block w-full text-left text-[10px] leading-tight px-1.5 py-1 rounded border truncate ${meta.color}`}
                        title={m.title}
                        data-testid={`event-${m.id}`}
                      >
                        {m.title}
                      </button>
                    );
                  })}
                  {items.length > 3 && (
                    <div className="text-[10px] text-muted-foreground px-1.5">
                      +{items.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {!isPM && (
          <p className="text-xs text-muted-foreground mt-3">
            Solo los PM del piloto pueden crear o editar hitos. El resto del equipo puede consultarlos.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ListView({
  milestones,
  startDate,
  onSelect,
}: {
  milestones: Milestone[];
  startDate: Date | null;
  onSelect: (m: Milestone) => void;
}) {
  const sorted = useMemo(
    () =>
      [...milestones].sort(
        (a, b) => a.weekOffset - b.weekOffset || a.title.localeCompare(b.title),
      ),
    [milestones],
  );

  const grouped = useMemo(() => {
    const map = new Map<number, Milestone[]>();
    for (const m of sorted) {
      const arr = map.get(m.weekOffset) ?? [];
      arr.push(m);
      map.set(m.weekOffset, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [sorted]);

  if (sorted.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground text-center">
          No hay hitos para los filtros seleccionados.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0 divide-y">
        {grouped.map(([week, items]) => {
          const date = startDate ? addWeeks(startDate, week - 1) : null;
          return (
            <div key={week} className="p-4">
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="font-semibold text-sm">
                  Semana {week}{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    (T0+{week - 1})
                  </span>
                </h3>
                {date && (
                  <span className="text-xs text-muted-foreground">
                    {format(date, "d 'de' MMMM, yyyy", { locale: es })}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {items.map((m) => {
                  const meta = KIND_META[m.kind as Kind];
                  const ph = phaseLabel(m.phaseId);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onSelect(m)}
                      className="w-full text-left rounded-md border border-border hover-elevate p-3 flex items-start gap-3"
                      data-testid={`list-event-${m.id}`}
                    >
                      <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${meta.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-sm">{m.title}</span>
                          <Badge variant="outline" className={`text-[10px] ${meta.color}`}>
                            {meta.label}
                          </Badge>
                          {ph && (
                            <Badge variant="secondary" className="text-[10px]">
                              {ph}
                            </Badge>
                          )}
                          {m.source === "system" && (
                            <Badge variant="outline" className="text-[10px]">
                              Auto
                            </Badge>
                          )}
                        </div>
                        {m.description && (
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {m.description}
                          </p>
                        )}
                        {m.ownersRoles.length > 0 && (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {m.ownersRoles.map(roleLabel).join(" · ")}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function MilestoneDialog({
  milestone,
  isPM,
  startDate,
  onClose,
}: {
  milestone: Milestone | null;
  isPM: boolean;
  startDate: Date | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateMilestone();
  const updateMutation = useUpdateMilestone();
  const deleteMutation = useDeleteMilestone();

  const isNew = milestone === null;
  const isSystem = milestone?.source === "system";
  const canEdit = isPM && !isSystem;

  const [title, setTitle] = useState(milestone?.title ?? "");
  const [description, setDescription] = useState(milestone?.description ?? "");
  const [kind, setKind] = useState<Kind>((milestone?.kind as Kind) ?? "decision");
  const [weekOffset, setWeekOffset] = useState<number>(milestone?.weekOffset ?? 1);
  const [phaseId, setPhaseId] = useState<string>(milestone?.phaseId ?? "none");
  const [ownersRoles, setOwnersRoles] = useState<string[]>(milestone?.ownersRoles ?? []);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListMilestonesQueryKey() });

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Falta el título", variant: "destructive" });
      return;
    }
    const body: MilestoneInput = {
      title: title.trim(),
      description: description.trim() ? description.trim() : null,
      kind,
      weekOffset,
      phaseId: phaseId === "none" ? null : phaseId,
      ownersRoles,
    };
    try {
      if (isNew) {
        await createMutation.mutateAsync({ data: body });
        toast({ title: "Hito creado" });
      } else {
        await updateMutation.mutateAsync({ id: milestone!.id, data: body });
        toast({ title: "Hito actualizado" });
      }
      await invalidate();
      onClose();
    } catch (err) {
      toast({
        title: "No se pudo guardar",
        description: err instanceof Error ? err.message : "Error inesperado",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!milestone) return;
    if (!confirm(`¿Eliminar "${milestone.title}"?`)) return;
    try {
      await deleteMutation.mutateAsync({ id: milestone.id });
      toast({ title: "Hito eliminado" });
      await invalidate();
      onClose();
    } catch (err) {
      toast({
        title: "No se pudo eliminar",
        description: err instanceof Error ? err.message : "Error inesperado",
        variant: "destructive",
      });
    }
  };

  const dateLabel = (() => {
    if (!startDate) return `Semana ${weekOffset} (T0+${weekOffset - 1})`;
    const d = addWeeks(startDate, weekOffset - 1);
    return format(d, "d 'de' MMMM, yyyy", { locale: es });
  })();

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? "Nuevo hito" : milestone!.title}</DialogTitle>
          <DialogDescription>
            {isSystem
              ? "Hito generado automáticamente. No es editable."
              : canEdit
                ? "Define un hito puntual del piloto, anclado a una semana relativa a T0."
                : "Vista de solo lectura."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="m-title">Título</Label>
            <Input
              id="m-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canEdit}
              data-testid="input-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="m-desc">Descripción</Label>
            <Textarea
              id="m-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={!canEdit}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as Kind)} disabled={!canEdit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_KINDS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {KIND_META[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-week">Semana (T0 + N-1)</Label>
              <Input
                id="m-week"
                type="number"
                min={1}
                max={60}
                value={weekOffset}
                onChange={(e) => setWeekOffset(Math.max(1, Number(e.target.value) || 1))}
                disabled={!canEdit}
              />
              <p className="text-[11px] text-muted-foreground">{dateLabel}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fase asociada</Label>
            <Select value={phaseId} onValueChange={setPhaseId} disabled={!canEdit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin fase</SelectItem>
                {PHASES.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Roles responsables</Label>
            <div className="max-h-40 overflow-y-auto border border-border rounded-md p-2 space-y-1">
              {ROLES.map((r) => {
                const checked = ownersRoles.includes(r.id);
                return (
                  <label
                    key={r.id}
                    className="flex items-start gap-2 text-xs cursor-pointer hover:bg-muted/40 px-1.5 py-1 rounded"
                  >
                    <Checkbox
                      checked={checked}
                      disabled={!canEdit}
                      onCheckedChange={(c) => {
                        setOwnersRoles((prev) =>
                          c ? [...prev, r.id] : prev.filter((x) => x !== r.id),
                        );
                      }}
                    />
                    <span>{r.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {canEdit && !isNew && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="mr-auto"
            >
              Eliminar
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            {canEdit ? "Cancelar" : "Cerrar"}
          </Button>
          {canEdit && (
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-milestone"
            >
              {isNew ? "Crear" : "Guardar"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExportCalendarButtons() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { data: feed, isLoading: loadingFeed } = useGetCalendarFeedUrl();

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(getGetCalendarFeedUrlUrl().replace(/feed-url$/, "export.ics"), {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "calendario-piloto-cel.ics";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Calendario descargado", description: "Ábrelo en Google Calendar u Outlook." });
    } catch (err) {
      toast({
        title: "No se pudo descargar el calendario",
        description: err instanceof Error ? err.message : "Error inesperado",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = async () => {
    if (!feed?.url) return;
    try {
      await navigator.clipboard.writeText(feed.url);
      toast({ title: "URL copiada", description: "Pégala en tu calendario para suscribirte." });
    } catch {
      toast({ title: "No se pudo copiar", variant: "destructive" });
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={handleDownload}
        disabled={downloading}
        data-testid="button-export-ics"
      >
        {downloading ? "Descargando…" : "Exportar (.ics)"}
      </Button>
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        data-testid="button-subscribe-ics"
      >
        Suscribirse
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Suscribirse al calendario</DialogTitle>
            <DialogDescription>
              Usa esta URL para suscribirte desde Google Calendar u Outlook. El feed
              se actualiza automáticamente cuando cambia T0 o algún hito.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="feed-url">URL de suscripción</Label>
              <div className="flex gap-2">
                <Input
                  id="feed-url"
                  readOnly
                  value={loadingFeed ? "Generando…" : (feed?.url ?? "")}
                  onFocus={(e) => e.currentTarget.select()}
                  data-testid="input-feed-url"
                />
                <Button onClick={handleCopy} disabled={!feed?.url} data-testid="button-copy-feed-url">
                  Copiar
                </Button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <span className="font-medium text-foreground">Google Calendar:</span>{" "}
                Otros calendarios → + → Desde URL.
              </p>
              <p>
                <span className="font-medium text-foreground">Outlook:</span> Agregar
                calendario → Suscribirse desde web.
              </p>
              <p>
                Cualquiera con esta URL puede ver los hitos del piloto, así que no la
                compartas fuera del equipo.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  useListKanbanColumns,
  useListKanbanCards,
  useCreateKanbanCard,
  useUpdateKanbanCard,
  useDeleteKanbanCard,
  useMoveKanbanCard,
  useGetMe,
  useListTeamMembers,
  getListKanbanCardsQueryKey,
  type KanbanCard,
  type KanbanColumn,
  type Member,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ROLES, PHASES } from "@/lib/projectContent";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar as CalendarIcon, Trash2, Pencil, Filter, Upload } from "lucide-react";
import { BatchImportKanbanCardsDialog } from "./BatchImportKanbanCardsDialog";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const PM_ROLE_IDS = ["pm_lead", "pm_cel"];

type Priority = "alta" | "media" | "baja";
type Category = "preproyecto" | "piloto";

const CATEGORY_META: Record<Category, { label: string; bandClass: string; badgeClass: string }> = {
  piloto: {
    label: "Piloto",
    bandClass: "border-l-4 border-l-primary",
    badgeClass: "bg-primary/10 text-primary border-primary/30",
  },
  preproyecto: {
    label: "Preproyecto",
    bandClass: "border-l-4 border-l-violet-500",
    badgeClass: "bg-violet-100 text-violet-800 border-violet-200",
  },
};

const PRIORITY_META: Record<Priority, { label: string; className: string }> = {
  alta: { label: "Alta", className: "bg-red-100 text-red-800 border-red-200" },
  media: { label: "Media", className: "bg-amber-100 text-amber-800 border-amber-200" },
  baja: { label: "Baja", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
};

export default function KanbanPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: me } = useGetMe();
  const { data: columns, isLoading: loadingCols } = useListKanbanColumns();
  const { data: cards, isLoading: loadingCards } = useListKanbanCards();
  const { data: members } = useListTeamMembers();

  const moveMutation = useMoveKanbanCard();
  const deleteMutation = useDeleteKanbanCard();

  const [filterCategory, setFilterCategory] = useState<string>("piloto");
  const [filterPhase, setFilterPhase] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [editing, setEditing] = useState<KanbanCard | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<KanbanCard | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const invalidateCards = () =>
    queryClient.invalidateQueries({ queryKey: getListKanbanCardsQueryKey() });

  const filteredCards = useMemo(() => {
    if (!cards) return [];
    return cards.filter((c) => {
      const cardCategory = (c.category ?? "piloto") as Category;
      if (filterCategory !== "all" && cardCategory !== filterCategory) return false;
      if (filterPhase !== "all" && (c.phaseId ?? "") !== filterPhase) return false;
      if (filterRole !== "all" && !c.assignedRoles.includes(filterRole)) return false;
      if (filterPriority !== "all" && c.priority !== filterPriority) return false;
      return true;
    });
  }, [cards, filterCategory, filterPhase, filterRole, filterPriority]);

  const cardsByColumn = useMemo(() => {
    const map = new Map<string, KanbanCard[]>();
    for (const col of columns ?? []) map.set(col.key, []);
    for (const card of filteredCards) {
      const arr = map.get(card.columnKey);
      if (arr) arr.push(card);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.position - b.position);
    return map;
  }, [filteredCards, columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const card = cards?.find((c) => c.id === active.id);
    if (!card) return;

    const overId = String(over.id);
    let targetColumn: string;
    let targetPosition: number;

    if (overId.startsWith("column:")) {
      targetColumn = overId.slice("column:".length);
      const colCards = cardsByColumn.get(targetColumn) ?? [];
      targetPosition = colCards.length;
    } else {
      const overCard = cards?.find((c) => c.id === overId);
      if (!overCard) return;
      targetColumn = overCard.columnKey;
      targetPosition = overCard.position;
    }

    if (card.columnKey === targetColumn && card.position === targetPosition) return;

    try {
      await moveMutation.mutateAsync({
        id: card.id,
        data: { columnKey: targetColumn, position: targetPosition },
      });
      void invalidateCards();
    } catch (err) {
      toast({
        title: "No se pudo mover la tarjeta",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
      void invalidateCards();
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteMutation.mutateAsync({ id: confirmDelete.id });
      toast({ title: "Tarjeta eliminada" });
      void invalidateCards();
    } catch (err) {
      toast({
        title: "No se pudo eliminar",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setConfirmDelete(null);
    }
  };

  const isPM = me?.roles?.some((r) => PM_ROLE_IDS.includes(r)) ?? false;
  const activeCard = activeId ? cards?.find((c) => c.id === activeId) ?? null : null;

  if (loadingCols || loadingCards) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-96 w-72 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kanban</h1>
          <p className="text-muted-foreground mt-1">
            Tablero operativo del piloto. Arrastra las tarjetas entre columnas para actualizar su estado.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPM && (
            <Button
              variant="outline"
              onClick={() => setBatchOpen(true)}
              data-testid="button-open-batch-kanban"
            >
              <Upload className="h-4 w-4 mr-2" /> Importar lote
            </Button>
          )}
          <Button
            onClick={() => {
              if (!(columns && columns.length > 0)) return;
              setEditing(null);
              setDialogOpen(true);
            }}
            disabled={!(columns && columns.length > 0)}
            title={
              !(columns && columns.length > 0)
                ? "No hay columnas configuradas en el tablero. Contacta a un admin."
                : undefined
            }
            data-testid="button-new-card"
          >
            <Plus className="h-4 w-4 mr-2" /> Nueva tarjeta
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border border-border rounded-lg bg-card p-3">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" /> Filtros:
        </div>
        <FilterSelect
          value={filterCategory}
          onChange={setFilterCategory}
          placeholder="Categoría"
          options={[
            { value: "piloto", label: "Piloto" },
            { value: "preproyecto", label: "Preproyecto" },
            { value: "all", label: "Todas las categorías" },
          ]}
        />
        <FilterSelect
          value={filterPhase}
          onChange={setFilterPhase}
          placeholder="Fase"
          options={[
            { value: "all", label: "Todas las fases" },
            ...PHASES.map((p) => ({ value: p.id, label: `${p.id} — ${p.shortName}` })),
          ]}
        />
        <FilterSelect
          value={filterRole}
          onChange={setFilterRole}
          placeholder="Asignado"
          options={[
            { value: "all", label: "Todos los asignados" },
            ...ROLES.map((r) => ({ value: r.id, label: r.label })),
          ]}
        />
        <FilterSelect
          value={filterPriority}
          onChange={setFilterPriority}
          placeholder="Prioridad"
          options={[
            { value: "all", label: "Todas las prioridades" },
            { value: "alta", label: "Alta" },
            { value: "media", label: "Media" },
            { value: "baja", label: "Baja" },
          ]}
        />
        {(filterCategory !== "piloto" || filterPhase !== "all" || filterRole !== "all" || filterPriority !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterCategory("piloto");
              setFilterPhase("all");
              setFilterRole("all");
              setFilterPriority("all");
            }}
          >
            Limpiar
          </Button>
        )}
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {(columns ?? []).map((col) => (
            <KanbanColumnView
              key={col.key}
              column={col}
              cards={cardsByColumn.get(col.key) ?? []}
              currentUserId={me?.id ?? ""}
              isPM={isPM}
              members={members ?? []}
              onEdit={(card) => {
                setEditing(card);
                setDialogOpen(true);
              }}
              onDelete={(card) => setConfirmDelete(card)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeCard ? (
            <CardItem
              card={activeCard}
              currentUserId={me?.id ?? ""}
              isPM={isPM}
              members={members ?? []}
              dragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <CardDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        editing={editing}
        defaultColumnKey={columns?.[0]?.key ?? "backlog"}
        members={members ?? []}
        onSaved={() => {
          void invalidateCards();
          setDialogOpen(false);
          setEditing(null);
        }}
      />

      <BatchImportKanbanCardsDialog
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        columns={columns ?? []}
      />

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta tarjeta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La tarjeta &ldquo;{confirmDelete?.title}&rdquo; se eliminará del tablero.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px] h-9 text-sm">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function KanbanColumnView({
  column,
  cards,
  currentUserId,
  isPM,
  members,
  onEdit,
  onDelete,
}: {
  column: KanbanColumn;
  cards: KanbanCard[];
  currentUserId: string;
  isPM: boolean;
  members: Member[];
  onEdit: (c: KanbanCard) => void;
  onDelete: (c: KanbanCard) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column:${column.key}` });

  return (
    <div
      ref={setNodeRef}
      className={`w-72 shrink-0 flex flex-col rounded-xl border ${
        isOver ? "border-primary bg-primary/5" : "border-border bg-muted/30"
      } transition-colors`}
    >
      <div className="px-3 py-2 flex items-center justify-between border-b border-border">
        <div className="font-medium text-sm text-foreground">{column.label}</div>
        <Badge variant="secondary" className="text-xs">{cards.length}</Badge>
      </div>
      <div className="flex-1 p-2 space-y-2 min-h-[200px]">
        {cards.map((card) => (
          <DraggableCard
            key={card.id}
            card={card}
            currentUserId={currentUserId}
            isPM={isPM}
            members={members}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        {cards.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-6">
            Sin tarjetas
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableCard({
  card,
  currentUserId,
  isPM,
  members,
  onEdit,
  onDelete,
}: {
  card: KanbanCard;
  currentUserId: string;
  isPM: boolean;
  members: Member[];
  onEdit: (c: KanbanCard) => void;
  onDelete: (c: KanbanCard) => void;
}) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: card.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`touch-none ${isDragging ? "opacity-40" : ""}`}
    >
      <CardItem
        card={card}
        currentUserId={currentUserId}
        isPM={isPM}
        members={members}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

function CardItem({
  card,
  currentUserId,
  isPM,
  members,
  onEdit,
  onDelete,
  dragging = false,
}: {
  card: KanbanCard;
  currentUserId: string;
  isPM: boolean;
  members: Member[];
  onEdit?: (c: KanbanCard) => void;
  onDelete?: (c: KanbanCard) => void;
  dragging?: boolean;
}) {
  const phase = card.phaseId ? PHASES.find((p) => p.id === card.phaseId) : null;
  const prio = PRIORITY_META[card.priority];
  const category = ((card.category ?? "piloto") as Category);
  const catMeta = CATEGORY_META[category];
  const canDelete = isPM || card.createdBy === currentUserId;
  const owner = card.ownerUserId
    ? members.find((m) => m.id === card.ownerUserId)
    : null;
  const ownerLabel = card.ownerUserId
    ? owner?.displayName ?? "Miembro asignado"
    : null;
  return (
    <Card
      className={`shadow-sm ${catMeta.bandClass} ${dragging ? "shadow-lg ring-2 ring-primary" : ""}`}
      data-testid={`kanban-card-${card.id}`}
      data-category={category}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="font-medium text-sm text-foreground leading-snug">
            {card.title}
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className={`text-[10px] font-medium ${prio.className}`}>
              {prio.label}
            </Badge>
            {category === "preproyecto" && (
              <Badge variant="outline" className={`text-[10px] ${catMeta.badgeClass}`}>
                {catMeta.label}
              </Badge>
            )}
          </div>
        </div>
        {card.description && (
          <div className="text-xs text-muted-foreground line-clamp-2">
            {card.description}
          </div>
        )}
        {ownerLabel && (
          <div
            className="text-[11px] text-foreground/80"
            data-testid={`kanban-card-owner-${card.id}`}
          >
            A cargo: <span className="font-medium">{ownerLabel}</span>
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          {phase && (
            <Badge variant="secondary" className="text-[10px]">
              {phase.id} · {phase.shortName}
            </Badge>
          )}
          {card.assignedRoles.slice(0, 2).map((roleId) => {
            const role = ROLES.find((r) => r.id === roleId);
            return (
              <Badge key={roleId} variant="outline" className="text-[10px]">
                {role?.label.split(" ")[0] ?? roleId}
              </Badge>
            );
          })}
          {card.assignedRoles.length > 2 && (
            <Badge variant="outline" className="text-[10px]">
              +{card.assignedRoles.length - 2}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
          {card.dueDate ? (
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {format(typeof card.dueDate === "string" ? parseISO(card.dueDate) : card.dueDate, "d MMM yyyy", { locale: es })}
            </div>
          ) : (
            <span />
          )}
          {!dragging && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(card);
                  }}
                  className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                  aria-label="Editar"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
              {onDelete && canDelete && (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(card);
                  }}
                  className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CardDialog({
  open,
  onOpenChange,
  editing,
  defaultColumnKey,
  members,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: KanbanCard | null;
  defaultColumnKey: string;
  members: Member[];
  onSaved: () => void;
}) {
  const { data: columns } = useListKanbanColumns();
  const createMutation = useCreateKanbanCard();
  const updateMutation = useUpdateKanbanCard();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [columnKey, setColumnKey] = useState(defaultColumnKey);
  const [phaseId, setPhaseId] = useState<string>("none");
  const [priority, setPriority] = useState<Priority>("media");
  const [category, setCategory] = useState<Category>("piloto");
  const [dueDate, setDueDate] = useState<string>("");
  const [roles, setRoles] = useState<string[]>([]);
  const [ownerUserId, setOwnerUserId] = useState<string>("none");

  const resetForm = (card: KanbanCard | null) => {
    setTitle(card?.title ?? "");
    setDescription(card?.description ?? "");
    setColumnKey(card?.columnKey ?? defaultColumnKey);
    setPhaseId(card?.phaseId ?? "none");
    setPriority((card?.priority ?? "media") as Priority);
    setCategory(((card?.category ?? "piloto") as Category));
    setDueDate(
      card?.dueDate
        ? (typeof card.dueDate === "string"
            ? card.dueDate.slice(0, 10)
            : format(card.dueDate, "yyyy-MM-dd"))
        : "",
    );
    setRoles(card?.assignedRoles ?? []);
    setOwnerUserId(card?.ownerUserId ?? "none");
  };

  const lastEditingId = editing?.id ?? null;
  // Reset when editing changes / dialog opens
  useEffect(() => {
    if (open) resetForm(editing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lastEditingId]);

  const toggleRole = (roleId: string) => {
    setRoles((rs) => (rs.includes(roleId) ? rs.filter((r) => r !== roleId) : [...rs, roleId]));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "El título es obligatorio", variant: "destructive" });
      return;
    }
    const payload = {
      title: title.trim(),
      description,
      phaseId: phaseId === "none" ? null : phaseId,
      assignedRoles: roles,
      priority,
      category,
      dueDate: dueDate ? dueDate : null,
      ownerUserId: ownerUserId === "none" ? null : ownerUserId,
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: payload });
        toast({ title: "Tarjeta actualizada" });
      } else {
        await createMutation.mutateAsync({
          data: { ...payload, columnKey },
        });
        toast({ title: "Tarjeta creada" });
      }
      onSaved();
    } catch (err) {
      toast({
        title: editing ? "No se pudo actualizar" : "No se pudo crear",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar tarjeta" : "Nueva tarjeta"}</DialogTitle>
          <DialogDescription>
            Tareas operativas del piloto. Los cambios se aplican de inmediato.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label htmlFor="kb-title">Título *</Label>
            <Input
              id="kb-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resumen breve"
              maxLength={200}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kb-desc">Descripción</Label>
            <Textarea
              id="kb-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Detalles, criterio de listo, contexto…"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <RadioGroup
              value={category}
              onValueChange={(v) => setCategory(v as Category)}
              className="flex gap-4"
            >
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value="piloto" id="kb-cat-piloto" />
                <span>Piloto (en curso)</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value="preproyecto" id="kb-cat-pre" />
                <span>Preproyecto (decisiones previas)</span>
              </label>
            </RadioGroup>
          </div>
          {!editing && (
            <div className="space-y-1.5">
              <Label>Columna inicial</Label>
              <Select value={columnKey} onValueChange={setColumnKey}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(columns ?? []).map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prioridad</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kb-due">Fecha objetivo</Label>
              <Input
                id="kb-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Persona a cargo</Label>
            <Select value={ownerUserId} onValueChange={setOwnerUserId}>
              <SelectTrigger data-testid="select-kb-owner">
                <SelectValue placeholder="Sin asignar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asignar</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Recibirá el recordatorio por correo cuando se acerque la fecha.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Fase asociada</Label>
            <Select value={phaseId} onValueChange={setPhaseId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin fase</SelectItem>
                {PHASES.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.id} — {p.shortName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Asignados (roles del equipo)</Label>
            <div className="border border-border rounded-md p-2 max-h-48 overflow-y-auto space-y-1.5">
              {ROLES.map((r) => (
                <label
                  key={r.id}
                  className="flex items-start gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded p-1"
                >
                  <Checkbox
                    checked={roles.includes(r.id)}
                    onCheckedChange={() => toggleRole(r.id)}
                  />
                  <span className="leading-tight">{r.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear tarjeta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

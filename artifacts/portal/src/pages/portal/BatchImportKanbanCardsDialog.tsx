import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useBatchImportKanbanCards,
  getListKanbanCardsQueryKey,
  type KanbanCardBatchItem,
  type BatchImportRowError,
  type KanbanColumn,
} from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const PRIORITIES = new Set(["alta", "media", "baja"]);
const CATEGORIES = new Set(["preproyecto", "piloto"]);

const CSV_HEADERS = [
  "title",
  "description",
  "columnKey",
  "category",
  "phaseId",
  "assignedRoles",
  "priority",
  "dueDate",
];

const CSV_TEMPLATE =
  CSV_HEADERS.join(",") +
  "\n" +
  [
    "Definir cobertura de cuencas piloto,Lista de cuencas + criterios,backlog,preproyecto,F0,pm_lead|hydrology_lead_cel,alta,",
    "Configurar VPN para acceso a datos CEL,,in_progress,piloto,F0,infra_devops,media,2026-06-15",
  ].join("\n") +
  "\n";

type ParsedRow = {
  row: number;
  raw: Record<string, string>;
  data?: KanbanCardBatchItem;
  errors: string[];
};

function parseCSV(text: string): Array<Record<string, string>> {
  const lines: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (inQ) {
      if (ch === '"' && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQ = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQ = true;
    } else if (ch === "\n") {
      lines.push(cur);
      cur = "";
    } else if (ch === "\r") {
      // skip
    } else {
      cur += ch;
    }
  }
  if (cur.length > 0) lines.push(cur);

  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let buf = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]!;
      if (q) {
        if (ch === '"' && line[i + 1] === '"') {
          buf += '"';
          i++;
        } else if (ch === '"') {
          q = false;
        } else {
          buf += ch;
        }
      } else if (ch === '"') {
        q = true;
      } else if (ch === ",") {
        out.push(buf);
        buf = "";
      } else {
        buf += ch;
      }
    }
    out.push(buf);
    return out;
  };

  if (lines.length === 0) return [];
  const headers = splitLine(lines[0]!).map((h) => h.trim());
  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    const ln = lines[i]!;
    if (ln.trim().length === 0) continue;
    const cells = splitLine(ln);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (cells[idx] ?? "").trim();
    });
    rows.push(obj);
  }
  return rows;
}

function validateRow(
  raw: Record<string, unknown>,
  row: number,
  validColumns: Set<string>,
): ParsedRow {
  const errors: string[] = [];
  const getStr = (k: string): string | undefined => {
    const v = raw[k];
    if (v == null) return undefined;
    if (typeof v === "string") {
      const t = v.trim();
      return t.length === 0 ? undefined : t;
    }
    return String(v);
  };
  const getArr = (k: string): string[] | undefined => {
    const v = raw[k];
    if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
    const s = getStr(k);
    if (s == null) return undefined;
    return s.split(/[|;]/).map((x) => x.trim()).filter(Boolean);
  };

  const title = getStr("title");
  const columnKey = getStr("columnKey");
  if (!title) errors.push("Falta 'title'");
  else if (title.length > 200) errors.push("'title' supera 200 caracteres");
  if (!columnKey) errors.push("Falta 'columnKey'");
  else if (validColumns.size > 0 && !validColumns.has(columnKey))
    errors.push(`'columnKey' inválido: ${columnKey}`);

  const category = getStr("category") ?? "piloto";
  if (!CATEGORIES.has(category))
    errors.push(`'category' inválido: ${category} (use 'piloto' o 'preproyecto')`);

  const priority = getStr("priority");
  if (priority && !PRIORITIES.has(priority))
    errors.push(`'priority' inválido: ${priority}`);

  const dueDate = getStr("dueDate");
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate))
    errors.push("'dueDate' debe tener formato YYYY-MM-DD");

  const description = getStr("description");
  if (description && description.length > 5000)
    errors.push("'description' supera 5000 caracteres");

  const phaseId = getStr("phaseId");
  const assignedRoles = getArr("assignedRoles");

  const data: KanbanCardBatchItem | undefined =
    errors.length === 0 && title && columnKey
      ? {
          title,
          description: description ?? null,
          columnKey,
          category: category as KanbanCardBatchItem["category"],
          phaseId: phaseId ?? null,
          assignedRoles: assignedRoles ?? [],
          priority: priority as KanbanCardBatchItem["priority"] | undefined,
          dueDate: dueDate ?? null,
        }
      : undefined;

  return {
    row,
    raw: Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, v == null ? "" : String(v)]),
    ),
    data,
    errors,
  };
}

export function BatchImportKanbanCardsDialog({
  open,
  onClose,
  columns,
}: {
  open: boolean;
  onClose: () => void;
  columns: KanbanColumn[];
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useBatchImportKanbanCards();

  const validColumns = useMemo(
    () => new Set(columns.map((c) => c.key)),
    [columns],
  );

  const [tab, setTab] = useState<string>("json");
  const [jsonText, setJsonText] = useState<string>(
    JSON.stringify(
      {
        cards: [
          {
            title: "Definir cobertura de cuencas piloto",
            description: "Lista cerrada de cuencas + criterios",
            columnKey: "backlog",
            category: "preproyecto",
            phaseId: "F0",
            assignedRoles: ["pm_lead", "hydrology_lead_cel"],
            priority: "alta",
          },
        ],
      },
      null,
      2,
    ),
  );
  const [csvText, setCsvText] = useState<string>("");
  const [serverErrors, setServerErrors] = useState<BatchImportRowError[]>([]);
  const [result, setResult] = useState<{ created: number; rejected: number } | null>(null);

  useEffect(() => {
    setServerErrors([]);
    setResult(null);
  }, [tab, jsonText, csvText]);

  const parsed: ParsedRow[] = useMemo(() => {
    if (tab === "json") {
      try {
        const obj = JSON.parse(jsonText) as { cards?: unknown };
        const arr = Array.isArray(obj.cards) ? obj.cards : [];
        if (arr.length === 0) {
          return [
            {
              row: 1,
              raw: {},
              errors: ["El JSON debe tener un arreglo 'cards' no vacío"],
            },
          ];
        }
        return arr.map((r, i) =>
          validateRow((r ?? {}) as Record<string, unknown>, i + 1, validColumns),
        );
      } catch (err) {
        return [
          {
            row: 1,
            raw: {},
            errors: [
              `JSON inválido: ${err instanceof Error ? err.message : "error de formato"}`,
            ],
          },
        ];
      }
    } else {
      if (csvText.trim().length === 0) return [];
      const rows = parseCSV(csvText);
      if (rows.length === 0) {
        return [
          {
            row: 1,
            raw: {},
            errors: ["El CSV no contiene filas de datos (sólo headers o vacío)"],
          },
        ];
      }
      return rows.map((r, i) => validateRow(r, i + 1, validColumns));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, jsonText, csvText, validColumns]);

  const validRows = parsed.filter((r) => r.errors.length === 0 && r.data);
  const invalidCount = parsed.length - validRows.length;
  const canImport =
    parsed.length > 0 && invalidCount === 0 && !mutation.isPending;

  const handleCsvFile = async (file: File) => {
    const text = await file.text();
    setCsvText(text);
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-kanban.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!canImport) return;
    setServerErrors([]);
    setResult(null);
    try {
      const res = await mutation.mutateAsync({
        data: { cards: validRows.map((r) => r.data!) },
      });
      if (res.errors && res.errors.length > 0) {
        setServerErrors(res.errors);
        toast({
          title: "No se pudo importar",
          description: `${res.errors.length} fila(s) inválida(s).`,
          variant: "destructive",
        });
        return;
      }
      setResult({ created: res.created, rejected: res.rejected ?? 0 });
      toast({
        title: "Importación lista",
        description: `${res.created} tarjeta(s) creadas.`,
      });
      await queryClient.invalidateQueries({
        queryKey: getListKanbanCardsQueryKey(),
      });
    } catch (err) {
      const anyErr = err as { errors?: BatchImportRowError[]; message?: string };
      if (anyErr?.errors && Array.isArray(anyErr.errors)) {
        setServerErrors(anyErr.errors);
      }
      toast({
        title: "Error al importar",
        description: anyErr?.message ?? "El servidor rechazó la importación.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar tarjetas (admin)</DialogTitle>
          <DialogDescription>
            Pega JSON o sube un CSV con tarjetas para cargar en lote. La
            importación es atómica: si alguna fila es inválida, no se inserta
            ninguna.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              data-testid="button-download-kanban-template"
            >
              Descargar plantilla CSV
            </Button>
            <div className="text-[11px] text-muted-foreground">
              Columnas válidas:{" "}
              {columns.map((c) => c.key).join(", ") || "(ninguna)"}
            </div>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="json" data-testid="tab-kanban-batch-json">
                JSON
              </TabsTrigger>
              <TabsTrigger value="csv" data-testid="tab-kanban-batch-csv">
                CSV
              </TabsTrigger>
            </TabsList>
            <TabsContent value="json" className="space-y-2 mt-3">
              <Label htmlFor="kb-batch-json">Pegar JSON</Label>
              <Textarea
                id="kb-batch-json"
                rows={10}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="font-mono text-xs"
                data-testid="textarea-kanban-batch-json"
              />
              <p className="text-[11px] text-muted-foreground">
                Estructura:{" "}
                <code>{`{ cards: [{ title, description?, columnKey, category, phaseId?, assignedRoles?, priority?, dueDate? }] }`}</code>
              </p>
            </TabsContent>
            <TabsContent value="csv" className="space-y-2 mt-3">
              <Label htmlFor="kb-batch-csv-file">Archivo CSV</Label>
              <input
                id="kb-batch-csv-file"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleCsvFile(f);
                }}
                className="block text-sm"
                data-testid="input-kanban-batch-csv-file"
              />
              <Label htmlFor="kb-batch-csv-text">o pegar contenido CSV</Label>
              <Textarea
                id="kb-batch-csv-text"
                rows={8}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="font-mono text-xs"
                placeholder={CSV_HEADERS.join(",") + "\n…"}
                data-testid="textarea-kanban-batch-csv"
              />
            </TabsContent>
          </Tabs>

          {parsed.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                {validRows.length} fila(s) válidas · {invalidCount} con errores
              </div>
              <div className="border border-border rounded-md max-h-64 overflow-y-auto divide-y">
                {parsed.map((r) => (
                  <div
                    key={r.row}
                    className={`p-2 text-xs ${
                      r.errors.length > 0 ? "bg-destructive/10" : "bg-card"
                    }`}
                    data-testid={`preview-kanban-row-${r.row}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        Fila {r.row}:{" "}
                        {r.data?.title || r.raw["title"] || "(sin título)"}
                      </span>
                      <span className="text-muted-foreground">
                        {r.data?.columnKey ?? r.raw["columnKey"] ?? ""}
                        {r.data?.category ? ` · ${r.data.category}` : ""}
                      </span>
                    </div>
                    {r.errors.length > 0 && (
                      <ul className="mt-1 text-[11px] text-destructive list-disc pl-4">
                        {r.errors.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {serverErrors.length > 0 && (
            <div className="border border-destructive/40 bg-destructive/10 rounded-md p-3 text-xs space-y-1">
              <div className="font-medium text-destructive">
                El servidor rechazó la importación:
              </div>
              <ul className="list-disc pl-5">
                {serverErrors.map((e, i) => (
                  <li key={i}>
                    Fila {e.row}
                    {e.field ? ` · ${e.field}` : ""}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result && (
            <div className="border border-emerald-500/40 bg-emerald-500/10 rounded-md p-3 text-xs">
              {result.created} tarjeta(s) creadas. Aparecen en el tablero
              inmediatamente.
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!canImport}
            data-testid="button-import-kanban-cards"
          >
            {mutation.isPending
              ? "Importando…"
              : `Importar ${validRows.length} tarjeta(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

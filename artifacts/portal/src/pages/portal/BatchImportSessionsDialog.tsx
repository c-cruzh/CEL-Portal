import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useBatchImportMilestones,
  useRegenerateWeeklies,
  getListMilestonesQueryKey,
  type BatchMilestoneSession,
  type BatchImportRowError,
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

const KINDS = new Set([
  "phase_milestone",
  "deliverable",
  "weekly_session",
  "presentation",
  "workshop",
  "decision",
]);

const KIND_LABEL: Record<string, string> = {
  phase_milestone: "Hito de fase",
  deliverable: "Entregable",
  weekly_session: "Sesión semanal",
  presentation: "Presentación",
  workshop: "Taller",
  decision: "Decisión clave",
};

const CSV_HEADERS = [
  "kind",
  "title",
  "weekOffset",
  "dateOverride",
  "durationMinutes",
  "location",
  "notes",
  "phaseId",
  "ownersRoles",
  "description",
];

const CSV_TEMPLATE =
  CSV_HEADERS.join(",") +
  "\n" +
  [
    "workshop,Taller de validación de datos hidrológicos,4,,120,CEL Oficina Central,Llevar laptops y acceso VPN,F1,hydrology_lead_cel|geospatial_expert_cel,Sesión de validación con CEL",
    "presentation,Demo intermedia LSTM,12,2026-09-15,90,Sala virtual,Demo con stakeholders,F3,ml_engineer|pm_lead,Avance del modelo",
  ].join("\n") +
  "\n";

type ParsedRow = {
  row: number;
  raw: Record<string, string>;
  data?: BatchMilestoneSession;
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
      // ignore
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
  const getNum = (k: string): number | undefined => {
    const s = getStr(k);
    if (s == null) return undefined;
    const n = Number(s);
    if (!Number.isFinite(n)) {
      errors.push(`${k} debe ser número`);
      return undefined;
    }
    return n;
  };
  const getArr = (k: string): string[] | undefined => {
    const v = raw[k];
    if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
    const s = getStr(k);
    if (s == null) return undefined;
    return s.split(/[|;]/).map((x) => x.trim()).filter(Boolean);
  };

  const kind = getStr("kind");
  const title = getStr("title");
  if (!kind) errors.push("Falta 'kind'");
  else if (!KINDS.has(kind)) errors.push(`'kind' inválido: ${kind}`);
  if (!title) errors.push("Falta 'title'");
  else if (title.length > 200) errors.push("'title' supera 200 caracteres");

  const weekOffset = getNum("weekOffset");
  const dateOverride = getStr("dateOverride");
  if (weekOffset == null && !dateOverride) {
    errors.push("Debe indicar 'weekOffset' o 'dateOverride'");
  }
  if (weekOffset != null && (weekOffset < 1 || weekOffset > 60)) {
    errors.push("'weekOffset' debe estar entre 1 y 60");
  }
  if (dateOverride && !/^\d{4}-\d{2}-\d{2}$/.test(dateOverride)) {
    errors.push("'dateOverride' debe tener formato YYYY-MM-DD");
  }
  const durationMinutes = getNum("durationMinutes");
  if (
    durationMinutes != null &&
    (durationMinutes < 1 || durationMinutes > 1440)
  ) {
    errors.push("'durationMinutes' debe estar entre 1 y 1440");
  }
  const location = getStr("location");
  const notes = getStr("notes");
  const phaseId = getStr("phaseId");
  const ownersRoles = getArr("ownersRoles");
  const description = getStr("description");

  const data: BatchMilestoneSession | undefined =
    errors.length === 0 && kind && title
      ? {
          kind: kind as BatchMilestoneSession["kind"],
          title,
          weekOffset: weekOffset ?? null,
          dateOverride: dateOverride ?? null,
          durationMinutes: durationMinutes ?? null,
          location: location ?? null,
          notes: notes ?? null,
          phaseId: phaseId ?? null,
          ownersRoles: ownersRoles ?? [],
          description: description ?? null,
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

export function BatchImportSessionsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useBatchImportMilestones();
  const regenMutation = useRegenerateWeeklies();

  const [tab, setTab] = useState<string>("json");
  const [jsonText, setJsonText] = useState<string>(
    JSON.stringify(
      {
        sessions: [
          {
            kind: "workshop",
            title: "Taller de validación de datos",
            weekOffset: 4,
            durationMinutes: 120,
            location: "CEL Oficina Central",
            ownersRoles: ["hydrology_lead_cel"],
            notes: "Llevar laptops",
          },
        ],
      },
      null,
      2,
    ),
  );
  const [csvText, setCsvText] = useState<string>("");
  const [serverErrors, setServerErrors] = useState<BatchImportRowError[]>([]);
  const [result, setResult] = useState<{
    created: number;
    updated: number;
    rejected: number;
  } | null>(null);

  const parsed: ParsedRow[] = useMemo(() => {
    setServerErrors([]);
    setResult(null);
    if (tab === "json") {
      try {
        const obj = JSON.parse(jsonText) as { sessions?: unknown };
        const arr = Array.isArray(obj.sessions) ? obj.sessions : [];
        if (arr.length === 0) {
          return [
            {
              row: 1,
              raw: {},
              errors: ["El JSON debe tener un arreglo 'sessions' no vacío"],
            },
          ];
        }
        return arr.map((r, i) =>
          validateRow((r ?? {}) as Record<string, unknown>, i + 1),
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
      return rows.map((r, i) => validateRow(r, i + 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, jsonText, csvText]);

  const validRows = parsed.filter((r) => r.errors.length === 0 && r.data);
  const invalidCount = parsed.length - validRows.length;
  const canImport = parsed.length > 0 && invalidCount === 0 && !mutation.isPending;

  const handleCsvFile = async (file: File) => {
    const text = await file.text();
    setCsvText(text);
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-sesiones-piloto.csv";
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
        data: { sessions: validRows.map((r) => r.data!) },
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
      setResult({
        created: res.created,
        updated: res.updated ?? 0,
        rejected: res.rejected ?? 0,
      });
      toast({
        title: "Importación lista",
        description: `${res.created} creadas · ${res.updated ?? 0} actualizadas · ${res.rejected ?? 0} rechazadas.`,
      });
      await queryClient.invalidateQueries({
        queryKey: getListMilestonesQueryKey(),
      });
    } catch (err) {
      const anyErr = err as { errors?: BatchImportRowError[]; message?: string };
      if (anyErr?.errors && Array.isArray(anyErr.errors)) {
        setServerErrors(anyErr.errors);
      }
      toast({
        title: "Error al importar",
        description:
          anyErr?.message ?? "El servidor rechazó la importación.",
        variant: "destructive",
      });
    }
  };

  const handleRegen = async () => {
    try {
      const res = await regenMutation.mutateAsync();
      toast({
        title: res.hasStartDate
          ? `Sesiones semanales regeneradas (${res.count})`
          : "T0 no configurado: se borraron las sesiones semanales del sistema",
      });
      await queryClient.invalidateQueries({
        queryKey: getListMilestonesQueryKey(),
      });
    } catch (err) {
      toast({
        title: "No se pudieron regenerar las semanales",
        description: err instanceof Error ? err.message : "Error inesperado",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar sesiones (admin)</DialogTitle>
          <DialogDescription>
            Pega JSON o sube un CSV con la lista curada de sesiones del piloto.
            La importación es atómica: si alguna fila es inválida, no se inserta
            ninguna.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              data-testid="button-download-template"
            >
              Descargar plantilla CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegen}
              disabled={regenMutation.isPending}
              data-testid="button-regen-weeklies"
            >
              {regenMutation.isPending
                ? "Regenerando…"
                : "Regenerar semanales desde T0"}
            </Button>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="json" data-testid="tab-batch-json">
                JSON
              </TabsTrigger>
              <TabsTrigger value="csv" data-testid="tab-batch-csv">
                CSV
              </TabsTrigger>
            </TabsList>
            <TabsContent value="json" className="space-y-2 mt-3">
              <Label htmlFor="batch-json">Pegar JSON</Label>
              <Textarea
                id="batch-json"
                rows={10}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="font-mono text-xs"
                data-testid="textarea-batch-json"
              />
              <p className="text-[11px] text-muted-foreground">
                Estructura: <code>{`{ sessions: [{ kind, title, weekOffset?, dateOverride?, durationMinutes?, location?, notes?, phaseId?, ownersRoles?, description? }] }`}</code>
              </p>
            </TabsContent>
            <TabsContent value="csv" className="space-y-2 mt-3">
              <Label htmlFor="batch-csv-file">Archivo CSV</Label>
              <input
                id="batch-csv-file"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleCsvFile(f);
                }}
                className="block text-sm"
                data-testid="input-batch-csv-file"
              />
              <Label htmlFor="batch-csv-text">o pegar contenido CSV</Label>
              <Textarea
                id="batch-csv-text"
                rows={8}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="font-mono text-xs"
                placeholder={CSV_HEADERS.join(",") + "\n…"}
                data-testid="textarea-batch-csv"
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
                    data-testid={`preview-row-${r.row}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        Fila {r.row}:{" "}
                        {r.data?.title || r.raw["title"] || "(sin título)"}
                      </span>
                      <span className="text-muted-foreground">
                        {r.data?.kind
                          ? KIND_LABEL[r.data.kind] ?? r.data.kind
                          : r.raw["kind"] || ""}
                      </span>
                    </div>
                    {r.data && (
                      <div className="text-[11px] text-muted-foreground mt-1">
                        {r.data.dateOverride
                          ? `Fecha fija: ${r.data.dateOverride}`
                          : `Semana ${r.data.weekOffset}`}
                        {r.data.durationMinutes
                          ? ` · ${r.data.durationMinutes} min`
                          : ""}
                        {r.data.location ? ` · ${r.data.location}` : ""}
                      </div>
                    )}
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
            <div className="border border-emerald-500/40 bg-emerald-500/10 rounded-md p-3 text-xs space-y-1">
              <div>{result.created} creadas · {result.updated} actualizadas · {result.rejected} rechazadas.</div>
              <div className="text-muted-foreground">
                Las sesiones aparecen en el calendario inmediatamente.
              </div>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground border-t pt-2">
            La curación se basa en el DSP original y los insumos de los talleres
            de Kevin. Este import es la vía de validación humana antes de que
            una sesión llegue al calendario del piloto.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!canImport}
            data-testid="button-import-sessions"
          >
            {mutation.isPending
              ? "Importando…"
              : `Importar ${validRows.length} sesión(es)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

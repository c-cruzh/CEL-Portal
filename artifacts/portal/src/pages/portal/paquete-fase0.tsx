import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mermaid } from "@/components/Mermaid";
import {
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  FileSpreadsheet,
  Presentation,
  Mail,
  Workflow,
  Layers,
  Image as ImageIcon,
  Upload,
  RotateCcw,
} from "lucide-react";
import {
  PAQUETE_DOCS,
  DECK,
  PAQUETE_DIAGRAMS,
  INDICE_DOCS,
  CORREO_REMISION,
} from "@/lib/paqueteFase0Content";
import {
  useListPaqueteFase0Overrides,
  useUpsertPaqueteFase0Override,
  useDeletePaqueteFase0Override,
  useRequestUploadUrl,
  useGetMe,
  getListPaqueteFase0OverridesQueryKey,
  type PaqueteFase0Override,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const PM_ROLE_IDS = ["project_lead", "pm_lead", "pm_cel"];
const basePath = import.meta.env.BASE_URL;

function bundledAsset(path: string): string {
  return `${basePath}${path}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("es-SV", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface SwapState {
  overridesByAsset: Map<string, PaqueteFase0Override>;
  isPM: boolean;
}

function DownloadLink({
  assetPath,
  label,
  filename,
  icon: Icon,
  swap,
}: {
  assetPath: string;
  label: string;
  filename: string;
  icon: typeof Download;
  swap: SwapState;
}) {
  const override = swap.overridesByAsset.get(assetPath);
  const href = override ? override.downloadUrl : bundledAsset(assetPath);
  return (
    <Button asChild size="sm" variant="outline" className="gap-2">
      <a href={href} download={filename} target={override ? "_blank" : undefined} rel={override ? "noopener noreferrer" : undefined}>
        <Icon className="h-4 w-4" />
        {label}
      </a>
    </Button>
  );
}

function SwapControls({
  assetPath,
  accept,
  swap,
}: {
  assetPath: string;
  accept: string;
  swap: SwapState;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const requestUrl = useRequestUploadUrl();
  const upsert = useUpsertPaqueteFase0Override();
  const del = useDeletePaqueteFase0Override();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  if (!swap.isPM) return null;
  const override = swap.overridesByAsset.get(assetPath);

  const handleFile = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "Archivo demasiado grande",
        description: "El máximo permitido es 50 MB.",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    try {
      const { uploadURL, objectPath } = await requestUrl.mutateAsync({
        data: {
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
        },
      });
      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!uploadRes.ok) {
        throw new Error("No se pudo subir el archivo al almacenamiento.");
      }
      await upsert.mutateAsync({
        data: {
          assetPath,
          objectPath,
          contentType: file.type || "application/octet-stream",
          fileName: file.name,
          sizeBytes: file.size,
        },
      });
      await queryClient.invalidateQueries({
        queryKey: getListPaqueteFase0OverridesQueryKey(),
      });
      toast({
        title: "Documento reemplazado",
        description: `${file.name} sustituye al archivo original.`,
      });
    } catch (err) {
      toast({
        title: "Error al reemplazar",
        description:
          err instanceof Error ? err.message : "Ocurrió un error inesperado.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRevert = async () => {
    if (!override) return;
    if (!confirm("¿Revertir al documento original empaquetado?")) return;
    setBusy(true);
    try {
      await del.mutateAsync({ params: { assetPath } });
      await queryClient.invalidateQueries({
        queryKey: getListPaqueteFase0OverridesQueryKey(),
      });
      toast({ title: "Documento revertido al original." });
    } catch (err) {
      toast({
        title: "Error al revertir",
        description:
          err instanceof Error ? err.message : "Ocurrió un error inesperado.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      <Button
        size="sm"
        variant="secondary"
        className="gap-2"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        title={`Reemplazar este archivo (PM)`}
      >
        <Upload className="h-4 w-4" />
        {busy ? "Subiendo…" : override ? "Reemplazar" : "Reemplazar"}
      </Button>
      {override && (
        <Button
          size="sm"
          variant="ghost"
          className="gap-2"
          disabled={busy}
          onClick={handleRevert}
          title="Revertir al archivo original empaquetado"
        >
          <RotateCcw className="h-4 w-4" />
          Revertir
        </Button>
      )}
    </>
  );
}

function OverrideBadge({
  assetPath,
  swap,
}: {
  assetPath: string;
  swap: SwapState;
}) {
  const override = swap.overridesByAsset.get(assetPath);
  if (!override) return null;
  return (
    <Badge variant="outline" className="text-[10px] font-normal text-primary border-primary/40">
      Versión personalizada · {formatDate(override.replacedAt)} ·{" "}
      {override.replacedByName} · {formatBytes(override.sizeBytes)}
    </Badge>
  );
}

export default function PaqueteFase0() {
  const [correoOpen, setCorreoOpen] = useState(false);
  const { data: me } = useGetMe();
  const isPM = me?.roles?.some((r: string) => PM_ROLE_IDS.includes(r)) ?? false;
  const { data: overridesList } = useListPaqueteFase0Overrides({
    query: {
      queryKey: getListPaqueteFase0OverridesQueryKey(),
      refetchInterval: 240_000,
    },
  });
  const overridesByAsset = new Map<string, PaqueteFase0Override>(
    (overridesList ?? []).map((o) => [o.assetPath, o]),
  );
  const swap: SwapState = { overridesByAsset, isPM };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="outline" className="text-[11px]">
              CEL-CFU 02/26 · AI Silo / Fase 0
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Paquete Final — AI Silo / Fase 0
            </h1>
            <p className="text-muted-foreground max-w-3xl">
              Material final all-in-one de alineación técnica y operativa entre
              CEL, TI, Martinexsa/Dell y la Consultora (C² Labs). Consolida
              documentos formales, deck ejecutivo y diagramas para iniciar y
              certificar la Fase 0 sin ambigüedad de alcance.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <DownloadLink
              assetPath={INDICE_DOCS.pdf}
              label="Índice (PDF)"
              filename="00_Indice_Paquete_Fase0.pdf"
              icon={FileText}
              swap={swap}
            />
            <DownloadLink
              assetPath={INDICE_DOCS.docx}
              label="Índice (DOCX)"
              filename="00_Indice_Paquete_Fase0.docx"
              icon={FileSpreadsheet}
              swap={swap}
            />
          </div>
        </div>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 text-sm text-foreground space-y-2">
            <p className="font-medium">Postura consolidada del paquete</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>El DSP firmado rige alcance y obligaciones contractuales.</li>
              <li>
                La infraestructura Martinexsa/Dell es el entorno físico
                habilitante.
              </li>
              <li>Mage es la capa central de orquestación del piloto.</li>
              <li>
                La infraestructura adquirida no amplía tácitamente el alcance
                de la Consultora.
              </li>
              <li>
                Fase 0 técnica plena requiere handoff de entorno instalado,
                accesible, documentado y verificable.
              </li>
            </ul>
          </CardContent>
        </Card>

        {isPM && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
            <span className="font-medium">Modo PM:</span> puedes reemplazar
            cualquier archivo del paquete con una versión actualizada (PDF,
            DOCX, PPTX, PNG, MMD o TXT). El reemplazo queda disponible al
            instante para todo el equipo, sustituyendo la descarga original.
          </div>
        )}
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">
              Correo de Remisión
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <DownloadLink
              assetPath={CORREO_REMISION.pdf}
              label="PDF"
              filename="07_Correo_de_Remision.pdf"
              icon={FileText}
              swap={swap}
            />
            <DownloadLink
              assetPath={CORREO_REMISION.docx}
              label="DOCX"
              filename="07_Correo_de_Remision.docx"
              icon={FileSpreadsheet}
              swap={swap}
            />
            <DownloadLink
              assetPath={CORREO_REMISION.txt}
              label="TXT"
              filename="07_Correo_de_Remision.txt"
              icon={FileText}
              swap={swap}
            />
            <SwapControls
              assetPath={CORREO_REMISION.pdf}
              accept=".pdf,application/pdf"
              swap={swap}
            />
          </div>
        </div>
        <OverrideBadge assetPath={CORREO_REMISION.pdf} swap={swap} />
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="text-sm">
              <span className="font-medium text-foreground">Asunto: </span>
              <span className="text-muted-foreground">
                {CORREO_REMISION.asunto}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 w-fit"
              onClick={() => setCorreoOpen((v) => !v)}
            >
              {correoOpen ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Ocultar cuerpo del correo
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Ver cuerpo del correo
                </>
              )}
            </Button>
            {correoOpen && (
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground bg-muted/40 border border-border rounded-md p-4 font-sans">
                {CORREO_REMISION.cuerpo}
              </pre>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">
            Documentos Finales
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PAQUETE_DOCS.map((doc) => {
            const filenameBase = doc.pdf.split("/").pop()!.replace(/\.pdf$/, "");
            return (
              <Card key={doc.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{doc.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 flex-1 flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground flex-1">
                    {doc.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 items-center">
                      <DownloadLink
                        assetPath={doc.pdf}
                        label="PDF"
                        filename={`${filenameBase}.pdf`}
                        icon={FileText}
                        swap={swap}
                      />
                      <SwapControls
                        assetPath={doc.pdf}
                        accept=".pdf,application/pdf"
                        swap={swap}
                      />
                    </div>
                    <OverrideBadge assetPath={doc.pdf} swap={swap} />
                    <div className="flex flex-wrap gap-2 items-center">
                      <DownloadLink
                        assetPath={doc.docx}
                        label="DOCX"
                        filename={`${filenameBase}.docx`}
                        icon={FileSpreadsheet}
                        swap={swap}
                      />
                      <SwapControls
                        assetPath={doc.docx}
                        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        swap={swap}
                      />
                    </div>
                    <OverrideBadge assetPath={doc.docx} swap={swap} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Presentation className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">
            Deck Ejecutivo
          </h2>
        </div>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{DECK.title}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <p className="text-sm text-muted-foreground">{DECK.description}</p>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 items-center">
                <DownloadLink
                  assetPath={DECK.pptx}
                  label="Descargar PPTX"
                  filename="06_Deck_Ejecutivo_AI_Silo_Fase0.pptx"
                  icon={Presentation}
                  swap={swap}
                />
                <SwapControls
                  assetPath={DECK.pptx}
                  accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  swap={swap}
                />
              </div>
              <OverrideBadge assetPath={DECK.pptx} swap={swap} />
              <div className="flex flex-wrap gap-2 items-center">
                <DownloadLink
                  assetPath={DECK.pdf}
                  label="Descargar PDF"
                  filename="06_Deck_Ejecutivo_AI_Silo_Fase0.pdf"
                  icon={FileText}
                  swap={swap}
                />
                <SwapControls
                  assetPath={DECK.pdf}
                  accept=".pdf,application/pdf"
                  swap={swap}
                />
              </div>
              <OverrideBadge assetPath={DECK.pdf} swap={swap} />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Workflow className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Diagramas</h2>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Los seis diagramas del paquete se renderizan abajo desde el código
          Mermaid editable. Cada uno puede descargarse en su versión PNG final
          o como archivo <code>.mmd</code> editable.
        </p>
        <div className="space-y-6">
          {PAQUETE_DIAGRAMS.map((d) => {
            const mmdName = d.mmd.split("/").pop()!;
            const pngName = d.png.split("/").pop()!;
            return (
              <Card key={d.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{d.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {d.description}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <div className="flex flex-wrap gap-2 items-center justify-end">
                        <DownloadLink
                          assetPath={d.png}
                          label="PNG"
                          filename={pngName}
                          icon={ImageIcon}
                          swap={swap}
                        />
                        <SwapControls
                          assetPath={d.png}
                          accept=".png,image/png"
                          swap={swap}
                        />
                      </div>
                      <OverrideBadge assetPath={d.png} swap={swap} />
                      <div className="flex flex-wrap gap-2 items-center justify-end">
                        <DownloadLink
                          assetPath={d.mmd}
                          label=".mmd"
                          filename={mmdName}
                          icon={Layers}
                          swap={swap}
                        />
                        <SwapControls
                          assetPath={d.mmd}
                          accept=".mmd,text/plain"
                          swap={swap}
                        />
                      </div>
                      <OverrideBadge assetPath={d.mmd} swap={swap} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Mermaid chart={d.chart} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}


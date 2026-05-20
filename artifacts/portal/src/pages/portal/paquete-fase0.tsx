import { useState } from "react";
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
} from "lucide-react";
import {
  PAQUETE_DOCS,
  DECK,
  PAQUETE_DIAGRAMS,
  INDICE_DOCS,
  CORREO_REMISION,
} from "@/lib/paqueteFase0Content";

const basePath = import.meta.env.BASE_URL;

function asset(path: string): string {
  return `${basePath}${path}`;
}

function DownloadLink({
  href,
  label,
  filename,
  icon: Icon,
}: {
  href: string;
  label: string;
  filename: string;
  icon: typeof Download;
}) {
  return (
    <Button asChild size="sm" variant="outline" className="gap-2">
      <a href={asset(href)} download={filename}>
        <Icon className="h-4 w-4" />
        {label}
      </a>
    </Button>
  );
}

export default function PaqueteFase0() {
  const [correoOpen, setCorreoOpen] = useState(false);

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
              href={INDICE_DOCS.pdf}
              label="Índice (PDF)"
              filename="00_Indice_Paquete_Fase0.pdf"
              icon={FileText}
            />
            <DownloadLink
              href={INDICE_DOCS.docx}
              label="Índice (DOCX)"
              filename="00_Indice_Paquete_Fase0.docx"
              icon={FileSpreadsheet}
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
              href={CORREO_REMISION.pdf}
              label="PDF"
              filename="07_Correo_de_Remision.pdf"
              icon={FileText}
            />
            <DownloadLink
              href={CORREO_REMISION.docx}
              label="DOCX"
              filename="07_Correo_de_Remision.docx"
              icon={FileSpreadsheet}
            />
            <DownloadLink
              href={CORREO_REMISION.txt}
              label="TXT"
              filename="07_Correo_de_Remision.txt"
              icon={FileText}
            />
          </div>
        </div>
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
                  <div className="flex flex-wrap gap-2">
                    <DownloadLink
                      href={doc.pdf}
                      label="PDF"
                      filename={`${filenameBase}.pdf`}
                      icon={FileText}
                    />
                    <DownloadLink
                      href={doc.docx}
                      label="DOCX"
                      filename={`${filenameBase}.docx`}
                      icon={FileSpreadsheet}
                    />
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
            <div className="flex flex-wrap gap-2">
              <DownloadLink
                href={DECK.pptx}
                label="Descargar PPTX"
                filename="06_Deck_Ejecutivo_AI_Silo_Fase0.pptx"
                icon={Presentation}
              />
              <DownloadLink
                href={DECK.pdf}
                label="Descargar PDF"
                filename="06_Deck_Ejecutivo_AI_Silo_Fase0.pdf"
                icon={FileText}
              />
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
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <DownloadLink
                        href={d.png}
                        label="PNG"
                        filename={pngName}
                        icon={ImageIcon}
                      />
                      <DownloadLink
                        href={d.mmd}
                        label=".mmd"
                        filename={mmdName}
                        icon={Layers}
                      />
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

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import productMd from "@docs/PRODUCT.md?raw";
import adminGuideMd from "@docs/ADMIN_GUIDE.md?raw";
import batchImportsMd from "@docs/BATCH_IMPORTS.md?raw";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Download } from "lucide-react";

type DocKey = "producto" | "admin" | "lotes";

const DOCS: Record<
  DocKey,
  { title: string; description: string; filename: string; content: string }
> = {
  producto: {
    title: "Producto",
    description:
      "Qué hace cada uno de los 9 módulos del portal y reglas transversales.",
    filename: "PRODUCT.md",
    content: productMd,
  },
  admin: {
    title: "Guía de administración",
    description:
      "Playbook para Camila y Kevin: invitar, editar miembros, T0, decisiones, auditoría.",
    filename: "ADMIN_GUIDE.md",
    content: adminGuideMd,
  },
  lotes: {
    title: "Importación masiva",
    description:
      "Plantillas y reglas de validación CSV/JSON para sesiones, Kanban y decisiones.",
    filename: "BATCH_IMPORTS.md",
    content: batchImportsMd,
  },
};

function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function DocsViewer() {
  const [active, setActive] = useState<DocKey>("producto");
  const current = DOCS[active];

  const tabKeys = useMemo(() => Object.keys(DOCS) as DocKey[], []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle>Documentación del portal</CardTitle>
            <CardDescription>
              Documentos vivos del piloto. Se actualizan junto con el código
              en la carpeta <code className="text-xs">docs/</code> del
              repositorio.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadMarkdown(current.filename, current.content)}
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar {current.filename}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs
          value={active}
          onValueChange={(v) => setActive(v as DocKey)}
          className="space-y-4"
        >
          <TabsList className="flex flex-wrap h-auto">
            {tabKeys.map((k) => (
              <TabsTrigger key={k} value={k}>
                {DOCS[k].title}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabKeys.map((k) => (
            <TabsContent key={k} value={k}>
              <div className="text-sm text-muted-foreground mb-3">
                {DOCS[k].description}
              </div>
              <div className="rounded-lg border bg-card">
                <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
                  <article
                    className="prose prose-sm md:prose-base max-w-none
                      prose-headings:scroll-mt-4
                      prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4
                      prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-3 prose-h2:border-b prose-h2:pb-2
                      prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-2
                      prose-h4:text-base prose-h4:font-semibold prose-h4:mt-4
                      prose-p:my-3 prose-li:my-1
                      prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:bg-muted prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
                      prose-pre:bg-muted prose-pre:text-xs
                      prose-table:text-sm prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-table:border prose-th:border prose-td:border
                      prose-a:text-primary"
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {DOCS[k].content}
                    </ReactMarkdown>
                  </article>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

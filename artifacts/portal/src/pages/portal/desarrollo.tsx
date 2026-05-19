import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DEV_SECTIONS,
  FLUJO_INTRO,
  FLUJO_STAGES,
  FLUJO_OUTRO,
  DATOS_INTRO,
  DATOS_CATEGORIES,
  ETL_INTRO,
  ETL_STAGES,
  MODEL_LSTM,
  MODEL_FLOOD,
  VALIDATION_ROLLING,
  VALIDATION_METRICS,
  VALIDATION_GOALS,
  DECISIONES_TECNICAS,
  OPERACION_DIARIA,
  VISUALIZACION,
  RACI_ROLES,
  RACI_TASKS,
  RACI_LEGEND,
  INFRA_INTRO,
  INFRA_ARCHITECTURE,
  INFRA_HARDWARE,
  INFRA_SOFTWARE,
  INFRA_COMMISSIONING,
  INFRA_BACKUP_POLICIES,
  LEMPA,
  type InfraStatus,
} from "@/lib/desarrolloContent";

export default function Desarrollo() {
  const [active, setActive] = useState<string>(DEV_SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );
    DEV_SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Desarrollo Técnico</h1>
          <p className="text-muted-foreground mt-1">
            Arquitectura, datos, pipelines, modelos, validación, operación y gobernanza técnica del sistema de pronóstico hidrológico con IA para el Río Lempa.
          </p>
        </header>

        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-1">
              {DEV_SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    active === s.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="space-y-16 min-w-0">
            <FlujoSection />
            <DatosSection />
            <EtlSection />
            <ModelosSection />
            <ValidacionSection />
            <DecisionesSection />
            <OperacionSection />
            <VisualizacionSection />
            <RaciSection />
            <InfraSection />
            <LempaSection />
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ id, eyebrow, title, intro }: { id: string; eyebrow?: string; title: string; intro?: string }) {
  return (
    <header className="mb-6 scroll-mt-24" id={id}>
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">{eyebrow}</p>}
      <h2 className="text-2xl font-bold tracking-tight border-b border-border pb-2">{title}</h2>
      {intro && <p className="text-sm text-foreground leading-relaxed mt-4">{intro}</p>}
    </header>
  );
}

function FlujoSection() {
  return (
    <section>
      <SectionHeader id="flujo" eyebrow="1" title="Flujo completo del sistema" intro={FLUJO_INTRO} />
      <div className="space-y-4">
        {FLUJO_STAGES.map((s) => (
          <Card key={s.id} className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded bg-primary/10 text-primary">
                  {s.tag}
                </span>
                <CardTitle className="text-lg">{s.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6 bg-primary/5 border-primary/20">
        <CardContent className="p-5">
          <p className="text-sm text-foreground leading-relaxed">{FLUJO_OUTRO}</p>
        </CardContent>
      </Card>
    </section>
  );
}

function DatosSection() {
  return (
    <section>
      <SectionHeader id="datos" eyebrow="2" title="Datos de entrada del sistema" intro={DATOS_INTRO} />
      <div className="grid gap-4 md:grid-cols-2">
        {DATOS_CATEGORIES.map((c) => (
          <Card key={c.id} className="border-border h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{c.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {c.sources.map((s, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground border border-border"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function EtlSection() {
  return (
    <section>
      <SectionHeader id="etl" eyebrow="3" title="Preprocesamiento y pipelines ETL con Mage" intro={ETL_INTRO} />
      <div className="grid gap-4 md:grid-cols-2">
        {ETL_STAGES.map((s) => (
          <Card key={s.title} className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {s.items.map((it, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
                    <span className="leading-relaxed">{it}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function ModelosSection() {
  return (
    <section>
      <SectionHeader id="modelos" eyebrow="4" title="Arquitectura y entrenamiento de modelos" />
      <div className="space-y-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">{MODEL_LSTM.title}</CardTitle>
            <CardDescription className="leading-relaxed pt-2">{MODEL_LSTM.body}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {MODEL_LSTM.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-foreground leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">{MODEL_FLOOD.title}</CardTitle>
            <CardDescription className="pt-2">{MODEL_FLOOD.body}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {MODEL_FLOOD.approaches.map((a) => (
              <div key={a.name} className="border-l-2 border-primary/40 pl-4">
                <h4 className="text-sm font-semibold text-foreground mb-1">{a.name}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{a.body}</p>
              </div>
            ))}
            <div className="mt-2 p-4 rounded-md bg-muted/50 border border-border">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Integración LSTM ↔ Inundación
              </h4>
              <p className="text-sm text-foreground leading-relaxed">{MODEL_FLOOD.integration}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function ValidacionSection() {
  return (
    <section>
      <SectionHeader id="validacion" eyebrow="5" title="Validación cruzada y métricas de evaluación" />
      <div className="space-y-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">{VALIDATION_ROLLING.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{VALIDATION_ROLLING.body}</p>
          </CardContent>
        </Card>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Métricas</h3>
          <Card className="border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-4 py-3 w-56">Métrica</th>
                    <th className="text-left font-medium px-4 py-3">Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {VALIDATION_METRICS.map((m) => (
                    <tr key={m.metric} className="border-t border-border align-top">
                      <td className="px-4 py-3 font-medium text-foreground">{m.metric}</td>
                      <td className="px-4 py-3 text-muted-foreground leading-relaxed">{m.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">Criterios de éxito</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {VALIDATION_GOALS.map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-foreground leading-relaxed">{g}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function DecisionesSection() {
  return (
    <section>
      <SectionHeader id="decisiones" eyebrow="6" title="Decisiones técnicas / informáticas" />
      <div className="grid gap-4 md:grid-cols-2">
        {DECISIONES_TECNICAS.map((d) => (
          <Card key={d.title} className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{d.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{d.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function OperacionSection() {
  return (
    <section>
      <SectionHeader id="operacion" eyebrow="7" title="Automatización y operación diaria" />
      <div className="space-y-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Programación de ejecuciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{OPERACION_DIARIA.scheduling}</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Flujo diario de ingesta y pronóstico</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {OPERACION_DIARIA.steps.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-foreground leading-relaxed pt-0.5">{s}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Monitoreo y errores</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{OPERACION_DIARIA.monitoring}</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Operación continua y re-entrenamiento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{OPERACION_DIARIA.retraining}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function VisualizacionSection() {
  return (
    <section>
      <SectionHeader id="visualizacion" eyebrow="8" title="Visualización y sistema de alertas" intro={VISUALIZACION.intro} />
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {VISUALIZACION.features.map((f) => (
          <Card key={f.title} className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{f.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">{VISUALIZACION.alerts.title}</CardTitle>
          <CardDescription className="pt-2">{VISUALIZACION.alerts.body}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {VISUALIZACION.alerts.samples.map((s, i) => (
              <li key={i} className="text-sm text-foreground leading-relaxed font-mono bg-muted/50 border border-border rounded p-3">
                {s}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}

function RaciSection() {
  return (
    <section>
      <SectionHeader id="raci" eyebrow="9" title="Matriz RACI" />
      <Card className="border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3 sticky left-0 bg-muted/40">Tarea</th>
                {RACI_ROLES.map((r) => (
                  <th key={r} className="text-center font-medium px-3 py-3 whitespace-nowrap">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RACI_TASKS.map((t) => (
                <tr key={t.task} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground sticky left-0 bg-card">{t.task}</td>
                  {t.values.map((v, i) => (
                    <td key={i} className="text-center px-3 py-3 text-muted-foreground font-mono">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {RACI_LEGEND.map((l) => (
          <div key={l.k} className="text-xs text-muted-foreground">
            <span className="inline-block h-5 w-5 rounded bg-primary/10 text-primary font-semibold text-center leading-5 mr-2">
              {l.k}
            </span>
            {l.v}
          </div>
        ))}
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: InfraStatus }) {
  if (status === "confirmado") {
    return (
      <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-200 whitespace-nowrap">
        Confirmado
      </span>
    );
  }
  return (
    <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 whitespace-nowrap">
      Por confirmar con CEL
    </span>
  );
}

function InfraSection() {
  const layerStyles: Record<string, string> = {
    Compute: "border-primary/40 bg-primary/5",
    "Data & ETL": "border-blue-500/40 bg-blue-500/5",
    Backup: "border-emerald-500/40 bg-emerald-500/5",
    Red: "border-violet-500/40 bg-violet-500/5",
    Energía: "border-amber-500/40 bg-amber-500/5",
  };

  return (
    <section>
      <SectionHeader
        id="infraestructura"
        eyebrow="10"
        title="Infraestructura local para el silo de IA de CEL"
        intro={INFRA_INTRO}
      />

      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Diagrama de arquitectura final
          </h3>
          <Card className="border-border">
            <CardContent className="p-5">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {INFRA_ARCHITECTURE.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-md border-2 p-3 ${layerStyles[n.layer] ?? "border-border bg-muted/30"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {n.layer}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">{n.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.role}</p>
                    <ul className="mt-2 space-y-1">
                      {n.specs.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/80">
                          <span className="mt-1 h-1 w-1 rounded-full bg-foreground/50 shrink-0" />
                          <span className="leading-relaxed">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                Flujo lógico: <strong>Datos & ETL</strong> ingiere y normaliza, alimenta a <strong>ML / Compute</strong> para entrenamiento e inferencia, los resultados se publican vía <strong>Aplicación</strong>, y todo se respalda al <strong>NAS</strong>. La <strong>Red</strong> conecta el silo a las DBs productivas de CEL en solo-lectura y al consultor por VPN; la <strong>Energía</strong> protegida garantiza continuidad operativa.
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            BOM de hardware
          </h3>
          <Card className="border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Categoría</th>
                    <th className="text-left font-medium px-4 py-3">Ítem</th>
                    <th className="text-left font-medium px-4 py-3 w-16">Cant.</th>
                    <th className="text-left font-medium px-4 py-3">Especificaciones</th>
                    <th className="text-left font-medium px-4 py-3">Rol</th>
                    <th className="text-left font-medium px-4 py-3 w-40">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {INFRA_HARDWARE.map((h, i) => (
                    <tr key={i} className="border-t border-border align-top">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{h.category}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{h.item}</td>
                      <td className="px-4 py-3 text-foreground">{h.qty}</td>
                      <td className="px-4 py-3 text-muted-foreground leading-relaxed">{h.specs}</td>
                      <td className="px-4 py-3 text-muted-foreground leading-relaxed">{h.role}</td>
                      <td className="px-4 py-3"><StatusBadge status={h.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            BOM de software
          </h3>
          <Card className="border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Capa</th>
                    <th className="text-left font-medium px-4 py-3">Producto</th>
                    <th className="text-left font-medium px-4 py-3">Versión</th>
                    <th className="text-left font-medium px-4 py-3">Propósito</th>
                    <th className="text-left font-medium px-4 py-3 w-40">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {INFRA_SOFTWARE.map((s, i) => (
                    <tr key={i} className="border-t border-border align-top">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{s.layer}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{s.product}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{s.version}</td>
                      <td className="px-4 py-3 text-muted-foreground leading-relaxed">{s.purpose}</td>
                      <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Plan de comisionamiento y pruebas de aceptación
          </h3>
          <Card className="border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-4 py-3 w-12">ID</th>
                    <th className="text-left font-medium px-4 py-3">Área</th>
                    <th className="text-left font-medium px-4 py-3">Prueba</th>
                    <th className="text-left font-medium px-4 py-3">Criterio de aceptación</th>
                    <th className="text-left font-medium px-4 py-3 w-40">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {INFRA_COMMISSIONING.map((c) => (
                    <tr key={c.id} className="border-t border-border align-top">
                      <td className="px-4 py-3 font-mono text-foreground">{c.id}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{c.area}</td>
                      <td className="px-4 py-3 font-medium text-foreground leading-relaxed">{c.test}</td>
                      <td className="px-4 py-3 text-muted-foreground leading-relaxed">{c.criteria}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Plan de respaldo, recuperación y políticas de seguridad
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {INFRA_BACKUP_POLICIES.map((p) => (
              <Card key={p.title} className="border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base">{p.title}</CardTitle>
                    <StatusBadge status={p.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LempaSection() {
  return (
    <section>
      <SectionHeader id="anexo-lempa" eyebrow="Anexo" title={LEMPA.title} intro={LEMPA.intro} />
      <div className="space-y-6">
        <LempaGroup title={LEMPA.geo.title} items={LEMPA.geo.items} />
        <LempaGroup title={LEMPA.climate.title} items={LEMPA.climate.items} />
        <LempaGroup title={LEMPA.governance.title} items={LEMPA.governance.items} />
        <LempaGroup title={LEMPA.implications.title} items={LEMPA.implications.items} />
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-5">
            <p className="text-sm text-foreground leading-relaxed">{LEMPA.conclusion}</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function LempaGroup({ title, items }: { title: string; items: { h: string; b: string }[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">{title}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((it) => (
          <Card key={it.h} className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{it.h}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{it.b}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

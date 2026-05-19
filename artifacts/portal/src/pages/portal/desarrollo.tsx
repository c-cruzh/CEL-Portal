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
  INFRA_PLACEHOLDER,
  LEMPA,
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

function InfraSection() {
  return (
    <section>
      <SectionHeader id="infraestructura" eyebrow="10" title={INFRA_PLACEHOLDER.title} intro={INFRA_PLACEHOLDER.intro} />
      <Card className="border-dashed border-2 border-border bg-muted/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200">
              Pendiente
            </span>
            <CardTitle className="text-base">Contenido por definir</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {INFRA_PLACEHOLDER.pending.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-foreground/30 shrink-0" />
                <span className="leading-relaxed">{p}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
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

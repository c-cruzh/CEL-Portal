import { METHODOLOGY_TEXT, METHODOLOGY_BLOCKS, TRACKING_BLOCK, PHASES } from "@/lib/projectContent";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Metodologia() {
  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Metodología Híbrida</h1>
        <p className="text-muted-foreground mt-1">
          Estrategia técnica y fases de ejecución para el sistema de pronóstico de caudales del Río Lempa.
        </p>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <p className="text-lg leading-relaxed font-medium text-foreground">{METHODOLOGY_TEXT}</p>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight border-b border-border pb-2">Pilares de la Metodología</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {METHODOLOGY_BLOCKS.map((block) => (
            <Card key={block.title} className="border-border h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{block.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{block.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight border-b border-border pb-2">
          Ruta de Implementación y Entregables
        </h2>
        <Card className="border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-3 w-16">Fase</th>
                  <th className="text-left font-medium px-4 py-3">Nombre</th>
                  <th className="text-left font-medium px-4 py-3 w-28">Semanas</th>
                  <th className="text-left font-medium px-4 py-3 w-20 text-right">Duración</th>
                  <th className="text-left font-medium px-4 py-3">Entregables principales</th>
                </tr>
              </thead>
              <tbody>
                {PHASES.map((phase) => (
                  <tr key={phase.id} className="border-t border-border align-top">
                    <td className="px-4 py-3 font-semibold">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-sm"
                          style={{ backgroundColor: phase.colorVar }}
                          aria-hidden="true"
                        />
                        {phase.id}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">{phase.shortName}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {phase.startWeek}–{phase.startWeek + phase.durationWeeks - 1}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-right">{phase.durationWeeks} sem</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <ul className="space-y-1">
                        {phase.deliverables.map((d, i) => (
                          <li key={i} className="leading-snug">
                            · {d}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight border-b border-border pb-2">Detalle por Fase</h2>
        <div className="grid gap-6">
          {PHASES.map((phase) => (
            <Card key={phase.id} className="overflow-hidden border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-sm"
                    style={{ backgroundColor: phase.colorVar }}
                    aria-hidden="true"
                  />
                  <CardTitle className="text-lg">{phase.label}</CardTitle>
                </div>
                <CardDescription>
                  Semanas {phase.startWeek}–{phase.startWeek + phase.durationWeeks - 1} · {phase.durationWeeks} semanas ·{" "}
                  {phase.objective}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground leading-relaxed">{phase.narrative}</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Actividades
                    </h4>
                    <ul className="space-y-1.5">
                      {phase.activities.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Entregables
                    </h4>
                    <ul className="space-y-1.5">
                      {phase.deliverables.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-foreground/40 shrink-0" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight border-b border-border pb-2">{TRACKING_BLOCK.title}</h2>
        <Card className="border-border">
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-foreground leading-relaxed">{TRACKING_BLOCK.body}</p>
            <ul className="space-y-2">
              {TRACKING_BLOCK.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-foreground leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

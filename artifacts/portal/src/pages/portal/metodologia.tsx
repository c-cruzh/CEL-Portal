import { METHODOLOGY_TEXT, PHASES } from "@/lib/projectContent";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Metodologia() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Metodología Híbrida</h1>
        <p className="text-muted-foreground mt-1">Estrategia técnica y fases de ejecución para el sistema de pronóstico de caudales.</p>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <p className="text-lg leading-relaxed font-medium text-foreground">
            {METHODOLOGY_TEXT}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight border-b border-border pb-2">Hoja de Ruta (28 Semanas)</h2>
        
        <div className="grid gap-6">
          {PHASES.map((phase, index) => (
            <Card key={phase.id} className="overflow-hidden border-border hover:border-primary/30 transition-colors">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-64 bg-muted/40 p-6 flex flex-col justify-center border-b md:border-b-0 md:border-r border-border">
                  <div className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
                    Semanas {phase.startWeek} - {phase.startWeek + phase.durationWeeks - 1}
                  </div>
                  <h3 className="font-semibold text-lg leading-tight">{phase.label.split(' — ')[1] || phase.label}</h3>
                  <div className="mt-4 inline-flex items-center rounded-full bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-border w-fit shadow-sm">
                    {phase.durationWeeks} semanas
                  </div>
                </div>
                <div className="flex-1 p-6">
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    {phase.activities.map((act, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                        <span className="text-sm text-muted-foreground">{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

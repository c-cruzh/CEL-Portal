import { useGetProjectConfig, useUpdateProjectConfig, getGetProjectConfigQueryKey } from "@workspace/api-client-react";
import { PHASES } from "@/lib/projectContent";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { addWeeks, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const TOTAL_WEEKS = 30; // 28 weeks + 2 contingency

export default function Cronograma() {
  const { data: config, isLoading } = useGetProjectConfig();
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-12 w-1/3"/><Skeleton className="h-96 w-full"/></div>;

  const phaseData = selectedPhase ? PHASES.find(p => p.id === selectedPhase) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Cronograma del Piloto</h1>
          <p className="text-muted-foreground mt-1">Planificación a {TOTAL_WEEKS} semanas para la implementación del sistema.</p>
        </div>
        <ConfigDate config={config} />
      </div>

      <Card className="overflow-x-auto border-border bg-card">
        <div className="min-w-[1000px] p-6">
          {/* Header Row (Weeks) */}
          <div className="flex border-b border-border/50 pb-2 mb-4">
            <div className="w-48 shrink-0 font-medium text-sm text-muted-foreground flex items-end">Fases</div>
            <div className="flex-1 grid grid-cols-[repeat(30,minmax(0,1fr))] gap-1">
              {Array.from({ length: TOTAL_WEEKS }).map((_, i) => {
                const weekNum = i + 1;
                let dateStr = "";
                if (config?.startDate) {
                  const date = addWeeks(parseISO(config.startDate), i);
                  dateStr = format(date, "d MMM", { locale: es });
                }
                
                return (
                  <div key={i} className="flex flex-col items-center justify-end">
                    <span className="text-[10px] text-muted-foreground/70 mb-1 whitespace-nowrap hidden md:block">{dateStr}</span>
                    <span className="text-xs font-medium w-full text-center">S{weekNum}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Phases Rows */}
          <div className="space-y-3">
            {PHASES.map((phase) => {
              const startCol = phase.startWeek;
              const spanCols = phase.durationWeeks;
              
              return (
                <div key={phase.id} className="flex group">
                  <div className="w-48 shrink-0 py-2 pr-4 text-sm font-medium leading-tight">
                    {phase.label}
                  </div>
                  <div className="flex-1 grid grid-cols-[repeat(30,minmax(0,1fr))] gap-1 py-1">
                    <div 
                      className="col-start-[var(--start)] col-span-[var(--span)] bg-primary/20 border border-primary/30 rounded-md hover:bg-primary/30 transition-colors cursor-pointer relative group/bar"
                      style={{ "--start": startCol, "--span": spanCols } as React.CSSProperties}
                      onClick={() => setSelectedPhase(phase.id)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-primary opacity-0 group-hover/bar:opacity-100 transition-opacity">
                        Ver actividades
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <Sheet open={!!selectedPhase} onOpenChange={(open) => !open && setSelectedPhase(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl text-primary">{phaseData?.label}</SheetTitle>
            <SheetDescription>
              Semanas {phaseData?.startWeek} a {phaseData ? phaseData.startWeek + phaseData.durationWeeks - 1 : ""} ({phaseData?.durationWeeks} semanas)
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b border-border pb-2">Actividades Clave</h3>
            <ul className="space-y-3">
              {phaseData?.activities.map((act, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </div>
                  <span className="text-foreground leading-relaxed">{act}</span>
                </li>
              ))}
            </ul>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

import type { ProjectConfig } from "@workspace/api-client-react";

function ConfigDate({ config }: { config: ProjectConfig | undefined }) {
  const [date, setDate] = useState(config?.startDate ? config.startDate.split('T')[0] : "");
  const [isEditing, setIsEditing] = useState(false);
  const updateConfig = useUpdateProjectConfig();
  const queryClient = useQueryClient();

  const handleSave = async () => {
    await updateConfig.mutateAsync({ data: { startDate: date || null } });
    queryClient.invalidateQueries({ queryKey: getGetProjectConfigQueryKey() });
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-lg border border-border shadow-sm">
        <div className="text-sm">
          <span className="text-muted-foreground mr-2">Fecha de inicio (T0):</span>
          <span className="font-medium text-foreground">
            {config?.startDate ? format(parseISO(config.startDate), "dd 'de' MMMM, yyyy", { locale: es }) : "No definida"}
          </span>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsEditing(true)}>
          Editar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-card p-2 rounded-lg border border-border shadow-sm">
      <Input 
        type="date" 
        value={date} 
        onChange={(e) => setDate(e.target.value)} 
        className="h-8 text-sm w-auto"
      />
      <Button size="sm" className="h-8" onClick={handleSave}>Guardar</Button>
      <Button variant="ghost" size="sm" className="h-8" onClick={() => { setDate(config?.startDate ? config.startDate.split('T')[0] : ""); setIsEditing(false); }}>Cancelar</Button>
    </div>
  );
}

import React, { useState } from "react";
import "./_group.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  ArrowRight, 
  Box, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  Database, 
  FileText, 
  GitBranch, 
  Globe2, 
  Layers, 
  LayoutDashboard, 
  Network, 
  Server, 
  ShieldAlert, 
  Users 
} from "lucide-react";

export default function AnexoTabs() {
  const [activeTab, setActiveTab] = useState("anexo-a");

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="font-mono text-xs font-semibold bg-primary/10 text-primary border-primary/20">
                CEL-CFU 02/26
              </Badge>
              <span className="text-sm text-muted-foreground font-medium">Desarrollo Técnico</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Arquitectura y Anexos</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              Documentación técnica y estado operativo del piloto de pronóstico hidrológico con IA en la cuenca del Río Lempa.
            </p>
          </div>
          <div className="flex items-center gap-2">
             <Badge variant="secondary" className="px-3 py-1 bg-green-100 text-green-800 hover:bg-green-100 border-transparent">
                <span className="w-2 h-2 rounded-full bg-green-600 mr-2 animate-pulse"></span>
                Estado Global: Operativo
             </Badge>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="anexo-a" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent space-x-6">
            <TabsTrigger 
              value="anexo-a" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 data-[state=active]:shadow-none"
            >
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4" />
                <span>A · Sistema IA</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="anexo-b" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground"
            >
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4" />
                <span>B · Infraestructura</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="anexo-c" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground"
            >
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4" />
                <span>C · BOM</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="anexo-d" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                <span>D · Riesgos</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="anexo-e" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground"
            >
              <div className="flex items-center gap-2">
                <Globe2 className="w-4 h-4" />
                <span>E · Lempa</span>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="anexo-a" className="mt-6 space-y-6 animate-in fade-in-50 duration-500">
            {/* KPI Ribbon */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="shadow-sm border-border/60 bg-card">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-700 rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Capítulos</p>
                    <p className="text-2xl font-bold font-mono">9/9</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-border/60 bg-card">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-700 rounded-lg">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Modelos Activos</p>
                    <p className="text-2xl font-bold font-mono">4</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-border/60 bg-card">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Estado Pipeline</p>
                    <p className="text-2xl font-bold text-emerald-700">OK</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-border/60 bg-card">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-slate-100 text-slate-700 rounded-lg">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Última Corrida</p>
                    <p className="text-2xl font-bold font-mono">06:00 SV</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Dashboard Tiles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Tile 1 */}
              <Card className="flex flex-col hover:border-primary/50 transition-colors shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="bg-primary/10 p-2 rounded-md mb-2">
                      <Network className="w-4 h-4 text-primary" />
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">A.1</Badge>
                  </div>
                  <CardTitle className="text-lg">Flujo del sistema</CardTitle>
                  <CardDescription>Vista de extremo a extremo del pipeline IA.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-3 mt-2">
                    <div className="flex justify-between items-center text-sm border-b pb-1">
                      <span className="text-muted-foreground">Nodos de procesamiento</span>
                      <span className="font-mono font-medium">12 activos</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b pb-1">
                      <span className="text-muted-foreground">Latencia promedio</span>
                      <span className="font-mono font-medium">245 ms</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t bg-muted/20">
                  <button className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 w-full justify-end group">
                    Ver detalle <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                </CardFooter>
              </Card>

              {/* Tile 2 */}
              <Card className="flex flex-col hover:border-primary/50 transition-colors shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="bg-primary/10 p-2 rounded-md mb-2">
                      <Database className="w-4 h-4 text-primary" />
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">A.2</Badge>
                  </div>
                  <CardTitle className="text-lg">Datos de entrada</CardTitle>
                  <CardDescription>Fuentes ERA5, GPM, CHIRPS e hidrológicas.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-3 mt-2">
                    <div className="flex justify-between items-center text-sm border-b pb-1">
                      <span className="text-muted-foreground">Fuentes sincrónicas</span>
                      <span className="font-mono font-medium">8/8 OK</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b pb-1">
                      <span className="text-muted-foreground">Volumen 24h</span>
                      <span className="font-mono font-medium">1.4 GB</span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mt-3">
                      <div className="h-full bg-emerald-500 w-[100%] rounded-full"></div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t bg-muted/20">
                  <button className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 w-full justify-end group">
                    Ver detalle <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                </CardFooter>
              </Card>

              {/* Tile 3 */}
              <Card className="flex flex-col hover:border-primary/50 transition-colors shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="bg-primary/10 p-2 rounded-md mb-2">
                      <Layers className="w-4 h-4 text-primary" />
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">A.3</Badge>
                  </div>
                  <CardTitle className="text-lg">ETL con Mage</CardTitle>
                  <CardDescription>Canalizaciones de preprocesamiento diario.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-3 mt-2">
                    <div className="flex justify-between items-center text-sm border-b pb-1">
                      <span className="text-muted-foreground">Pipelines</span>
                      <span className="font-mono font-medium">8</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b pb-1">
                      <span className="text-muted-foreground">Errores 24h</span>
                      <span className="font-mono font-medium text-emerald-600">0</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b pb-1">
                      <span className="text-muted-foreground">Última ejecución</span>
                      <span className="font-mono font-medium">06:03 SV</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t bg-muted/20">
                  <button className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 w-full justify-end group">
                    Ver detalle <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                </CardFooter>
              </Card>

              {/* Tile 4 */}
              <Card className="flex flex-col hover:border-primary/50 transition-colors shadow-sm border-primary/20">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="bg-primary/10 p-2 rounded-md mb-2">
                      <Activity className="w-4 h-4 text-primary" />
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">A.4</Badge>
                  </div>
                  <CardTitle className="text-lg">Modelos de predicción</CardTitle>
                  <CardDescription>LSTM caudales y modelo de anegación.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-3 mt-2">
                    <div className="flex justify-between items-center text-sm border-b pb-1">
                      <span className="text-muted-foreground">Métrica LSTM (MAE)</span>
                      <span className="font-mono font-medium">0.18 m³/s</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b pb-1">
                      <span className="text-muted-foreground">KGE Global</span>
                      <span className="font-mono font-medium">0.84</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b pb-1">
                      <span className="text-muted-foreground">Entrenamiento</span>
                      <span className="font-mono font-medium">12 may</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t bg-primary/5">
                  <button className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 w-full justify-end group">
                    Ver detalle <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                </CardFooter>
              </Card>

              {/* Tile 5 */}
              <Card className="flex flex-col hover:border-primary/50 transition-colors shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="bg-primary/10 p-2 rounded-md mb-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">A.5</Badge>
                  </div>
                  <CardTitle className="text-lg">Validación</CardTitle>
                  <CardDescription>Métricas y pruebas fuera de muestra.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-3 mt-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 font-normal">Rolling-origin completo</Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b pb-1">
                      <span className="text-muted-foreground">Próxima OOS</span>
                      <span className="font-mono font-medium">21 jun</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t bg-muted/20">
                  <button className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 w-full justify-end group">
                    Ver detalle <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                </CardFooter>
              </Card>

              {/* Tile 6 */}
              <Card className="flex flex-col hover:border-primary/50 transition-colors shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="bg-primary/10 p-2 rounded-md mb-2">
                      <GitBranch className="w-4 h-4 text-primary" />
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">A.6</Badge>
                  </div>
                  <CardTitle className="text-lg">Decisiones técnicas</CardTitle>
                  <CardDescription>Supuestos y trade-offs de arquitectura.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-3 mt-2">
                    <div className="flex justify-between items-center text-sm border-b pb-1">
                      <span className="text-muted-foreground">ADRs Registrados</span>
                      <span className="font-mono font-medium">14</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b pb-1">
                      <span className="text-muted-foreground">En revisión</span>
                      <span className="font-mono font-medium text-amber-600">2</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t bg-muted/20">
                  <button className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 w-full justify-end group">
                    Ver detalle <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                </CardFooter>
              </Card>

              {/* Tile 7 */}
              <Card className="flex flex-col hover:border-primary/50 transition-colors shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="bg-primary/10 p-2 rounded-md mb-2">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">A.7</Badge>
                  </div>
                  <CardTitle className="text-lg">Operación diaria</CardTitle>
                  <CardDescription>Ingesta, monitoreo y gestión de errores.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-3 mt-2">
                    <div className="flex justify-between items-center text-sm border-b pb-1">
                      <span className="text-muted-foreground">Cron schedule</span>
                      <span className="font-mono font-medium">0 6 * * *</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b pb-1">
                      <span className="text-muted-foreground">Monitoreo activo</span>
                      <span className="font-mono font-medium">Sí</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t bg-muted/20">
                  <button className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 w-full justify-end group">
                    Ver detalle <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                </CardFooter>
              </Card>

              {/* Tile 8 */}
              <Card className="flex flex-col hover:border-primary/50 transition-colors shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="bg-primary/10 p-2 rounded-md mb-2">
                      <LayoutDashboard className="w-4 h-4 text-primary" />
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">A.8</Badge>
                  </div>
                  <CardTitle className="text-lg">Visualización y alertas</CardTitle>
                  <CardDescription>Dashboard React y distribución SMS/email.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-3 mt-2">
                    <div className="flex justify-between items-center text-sm border-b pb-1">
                      <span className="text-muted-foreground">Alertas enviadas 24h</span>
                      <span className="font-mono font-medium">0</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b pb-1">
                      <span className="text-muted-foreground">Suscriptores SMS</span>
                      <span className="font-mono font-medium">14</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t bg-muted/20">
                  <button className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 w-full justify-end group">
                    Ver detalle <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                </CardFooter>
              </Card>

              {/* Tile 9 */}
              <Card className="flex flex-col hover:border-primary/50 transition-colors shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="bg-primary/10 p-2 rounded-md mb-2">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">A.10</Badge>
                  </div>
                  <CardTitle className="text-lg">RACI</CardTitle>
                  <CardDescription>Matriz de roles y tareas por fase.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-3 mt-2">
                    <div className="flex justify-between items-center text-sm border-b pb-1">
                      <span className="text-muted-foreground">Roles definidos</span>
                      <span className="font-mono font-medium">6</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b pb-1">
                      <span className="text-muted-foreground">Responsables clave</span>
                      <span className="font-mono font-medium">3</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t bg-muted/20">
                  <button className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 w-full justify-end group">
                    Ver detalle <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                </CardFooter>
              </Card>

            </div>
          </TabsContent>

          {/* Placeholders for other tabs */}
          <TabsContent value="anexo-b" className="mt-6">
            <Card className="p-12 text-center bg-muted/30 border-dashed">
              <Server className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground">Anexo B: Infraestructura Local</h3>
              <p className="text-muted-foreground mt-2">Hardware GPU, NAS, y políticas de respaldo del silo IA.</p>
            </Card>
          </TabsContent>
          <TabsContent value="anexo-c" className="mt-6">
             <Card className="p-12 text-center bg-muted/30 border-dashed">
              <Box className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground">Anexo C: Lista de Materiales (BOM)</h3>
              <p className="text-muted-foreground mt-2">Detalle de componentes de hardware y licencias de software.</p>
            </Card>
          </TabsContent>
          <TabsContent value="anexo-d" className="mt-6">
             <Card className="p-12 text-center bg-muted/30 border-dashed">
              <ShieldAlert className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground">Anexo D: Riesgos y Mitigación</h3>
              <p className="text-muted-foreground mt-2">Matriz de riesgos menores y planes de contingencia operativa.</p>
            </Card>
          </TabsContent>
          <TabsContent value="anexo-e" className="mt-6">
             <Card className="p-12 text-center bg-muted/30 border-dashed">
              <Globe2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground">Anexo E: Dinámicas Hidrológicas</h3>
              <p className="text-muted-foreground mt-2">Gobernanza trinacional en la Cuenca del Río Lempa.</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

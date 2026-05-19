import React, { useState } from "react";
import "./_group.css";
import { 
  Search, ChevronRight, ChevronDown, FileText, Database, Settings, 
  Activity, Map, Shield, Server, Box, Layers, AlignLeft, Info, SearchIcon, Play, RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

const sidebarData = [
  {
    title: "Anexo A: Sistema IA de Pronóstico",
    id: "anexo-a",
    expanded: true,
    items: [
      { id: "a1", title: "1. Flujo del sistema", icon: <Activity className="w-4 h-4 mr-2" /> },
      { id: "a2", title: "2. Datos de entrada", icon: <Database className="w-4 h-4 mr-2" /> },
      { id: "a3", title: "3. ETL con Mage", icon: <Settings className="w-4 h-4 mr-2" /> },
      { id: "a4", title: "4. Modelos de predicción", icon: <Layers className="w-4 h-4 mr-2" />, active: true },
      { id: "a5", title: "5. Validación", icon: <Shield className="w-4 h-4 mr-2" /> },
      { id: "a6", title: "6. Decisiones técnicas", icon: <FileText className="w-4 h-4 mr-2" /> },
      { id: "a7", title: "7. Operación diaria", icon: <Play className="w-4 h-4 mr-2" /> },
      { id: "a8", title: "8. Visualización y alertas", icon: <Activity className="w-4 h-4 mr-2" /> },
      { id: "a9", title: "9. RACI", icon: <AlignLeft className="w-4 h-4 mr-2" /> },
    ]
  },
  {
    title: "Anexo B: Infraestructura",
    id: "anexo-b",
    expanded: false,
    items: [
      { id: "b1", title: "10. Silo de IA Local", icon: <Server className="w-4 h-4 mr-2" /> }
    ]
  },
  {
    title: "Anexo C: Lista de Materiales",
    id: "anexo-c",
    expanded: false,
    items: [
      { id: "c1", title: "11. Hardware y Software (BOM)", icon: <Box className="w-4 h-4 mr-2" /> }
    ]
  },
  {
    title: "Anexo D: Riesgos Menores",
    id: "anexo-d",
    expanded: false,
    items: [
      { id: "d1", title: "12. Planes de Mitigación", icon: <Shield className="w-4 h-4 mr-2" /> }
    ]
  },
  {
    title: "Anexo E: Cuenca del Lempa",
    id: "anexo-e",
    expanded: false,
    items: [
      { id: "e1", title: "13. Dinámicas y Gobernanza", icon: <Map className="w-4 h-4 mr-2" /> }
    ]
  }
];

export default function DocsPortal() {
  const [navItems, setNavItems] = useState(sidebarData);

  const toggleSection = (id: string) => {
    setNavItems(navItems.map(section => 
      section.id === id ? { ...section, expanded: !section.expanded } : section
    ));
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-6">
        <div className="flex items-center gap-2 mr-4">
          <div className="w-8 h-8 bg-[var(--cel-navy)] rounded flex items-center justify-center text-white font-bold text-sm">
            CEL
          </div>
          <span className="font-semibold text-sm tracking-tight text-[var(--cel-navy)]">Portal Piloto</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <span>Desarrollo Técnico</span>
          <ChevronRight className="w-4 h-4 mx-1" />
          <span className="text-foreground font-medium">Documentación</span>
        </div>
        <div className="ml-auto flex items-center gap-4 text-sm">
          <div className="hidden md:flex items-center px-3 py-1 bg-secondary rounded-full text-xs font-medium text-muted-foreground">
            Corpus v2.3 — 19 may 2026
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            Sincronizar
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full">
        {/* Left Sidebar */}
        <aside className="w-[280px] border-r flex-shrink-0 flex flex-col bg-background">
          <div className="p-4 border-b">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar (Cmd+K)"
                className="w-full bg-secondary border-none rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--cel-navy)] transition-shadow"
              />
            </div>
          </div>
          <ScrollArea className="flex-1 py-4">
            <nav className="px-3 space-y-4">
              {navItems.map((section) => (
                <div key={section.id} className="space-y-1">
                  <button 
                    onClick={() => toggleSection(section.id)}
                    className="flex items-center justify-between w-full px-2 py-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {section.title}
                    <ChevronDown className={`w-4 h-4 transition-transform ${section.expanded ? "" : "-rotate-90"}`} />
                  </button>
                  {section.expanded && (
                    <div className="mt-1 space-y-0.5">
                      {section.items.map((item) => (
                        <a
                          key={item.id}
                          href="#"
                          className={`flex items-center px-2 py-1.5 text-sm rounded-md transition-colors ${
                            item.active 
                              ? "bg-[var(--cel-navy)] text-white font-medium" 
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          }`}
                        >
                          {item.icon}
                          {item.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-[720px] mx-auto">
            <div className="text-sm text-muted-foreground mb-4 flex items-center gap-1.5">
              <span>Desarrollo Técnico</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>Anexo A</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-foreground">4. Modelos</span>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[var(--cel-navy)] mb-4 tracking-tight">
                Modelos de Predicción
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Arquitectura y configuración de los modelos hidrológicos utilizados para el pronóstico 
                de caudales en la cuenca del Río Lempa, basados en redes neuronales recurrentes (LSTM) y 
                modelos de propagación de anegamiento.
              </p>
            </div>

            <div className="prose prose-sm md:prose-base max-w-none text-foreground/90">
              <h2 id="lstm" className="text-xl font-bold text-foreground mt-8 mb-4 pb-2 border-b">
                Modelo LSTM para Pronóstico de Caudales
              </h2>
              <p className="mb-4 leading-relaxed">
                El componente principal del sistema de alerta temprana es un modelo Long Short-Term Memory (LSTM) 
                entrenado para inferir la dinámica no lineal de la cuenca. Este modelo recibe series de tiempo de 
                variables meteorológicas (precipitación de GPM/CHIRPS) y mediciones de estaciones in situ, 
                generando estimaciones de caudal con un horizonte de predicción de 72 horas.
              </p>
              
              <div className="bg-[#f1f5f9] border-l-4 border-[var(--cel-navy)] p-4 rounded-r-md my-6 flex items-start gap-3">
                <Info className="w-5 h-5 text-[var(--cel-navy)] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[var(--cel-navy)] text-sm mb-1">Decisión Técnica</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Se seleccionó la arquitectura LSTM sobre alternativas tradicionales como el modelo HBV o GR4J 
                    debido a su superior capacidad de generalización en eventos hidrológicos extremos fuera de 
                    muestra, logrando una reducción del 14% en el MAE durante los meses de invierno.
                  </p>
                </div>
              </div>

              <h2 id="metricas" className="text-xl font-bold text-foreground mt-8 mb-4 pb-2 border-b">
                Métricas de Desempeño
              </h2>
              <p className="mb-4 leading-relaxed">
                Durante el entrenamiento de la versión v2.3, se evaluó el desempeño utilizando el 
                Nash-Sutcliffe Efficiency (NSE) y el Error Absoluto Medio (MAE). Las métricas actuales 
                en el conjunto de validación reflejan la madurez del piloto:
              </p>

              <div className="my-6 border rounded-md overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary text-secondary-foreground font-medium">
                    <tr>
                      <th className="px-4 py-3 border-b">Estación Virtual</th>
                      <th className="px-4 py-3 border-b">NSE (Objetivo {'>'} 0.75)</th>
                      <th className="px-4 py-3 border-b">MAE (m³/s)</th>
                      <th className="px-4 py-3 border-b">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-mono text-xs">
                    <tr>
                      <td className="px-4 py-3 font-sans font-medium">Cerrón Grande (Entrada)</td>
                      <td className="px-4 py-3 text-green-600">0.82</td>
                      <td className="px-4 py-3">12.4</td>
                      <td className="px-4 py-3 font-sans"><Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Operativo</Badge></td>
                    </tr>
                    <tr className="bg-muted/30">
                      <td className="px-4 py-3 font-sans font-medium">15 de Septiembre</td>
                      <td className="px-4 py-3 text-green-600">0.78</td>
                      <td className="px-4 py-3">18.1</td>
                      <td className="px-4 py-3 font-sans"><Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Operativo</Badge></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-sans font-medium">San Marcos Lempa</td>
                      <td className="px-4 py-3 text-amber-600">0.69</td>
                      <td className="px-4 py-3">24.5</td>
                      <td className="px-4 py-3 font-sans"><Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">En Calibración</Badge></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h2 id="anegacion" className="text-xl font-bold text-foreground mt-8 mb-4 pb-2 border-b">
                Modelo de Propagación y Anegación
              </h2>
              <p className="mb-4 leading-relaxed">
                Para traducir los caudales pronosticados a impactos físicos, se implementó un modelo 
                geocelular bidimensional reducido. Utilizando el Modelo Digital de Elevación (MDE) y 
                las capas de uso de suelo (HydroATLAS), el sistema mapea la mancha de inundación 
                esperada en el Bajo Lempa.
              </p>
              <ul className="list-disc pl-5 mb-6 space-y-2 text-sm">
                <li>Resolución espacial: 30 metros (basado en SRTM).</li>
                <li>Frecuencia de actualización: Post-procesamiento inmediato tras cada inferencia LSTM.</li>
                <li>Capa de salida: Vector GeoJSON poligonizado enviado a la base PostgreSQL+PostGIS.</li>
              </ul>
            </div>

            {/* Bottom Navigation */}
            <div className="mt-12 pt-6 border-t flex items-center justify-between">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground gap-2">
                <ChevronRight className="w-4 h-4 rotate-180" />
                3. ETL con Mage
              </Button>
              <Button variant="ghost" className="text-[var(--cel-navy)] font-medium hover:bg-[var(--cel-navy)]/10 hover:text-[var(--cel-navy)] gap-2">
                5. Validación
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </main>

        {/* Right Sidebar (On this page) */}
        <aside className="hidden lg:block w-[220px] pt-8 pr-6 flex-shrink-0">
          <div className="sticky top-20">
            <h4 className="font-semibold text-sm mb-3 text-foreground">En esta página</h4>
            <nav className="flex flex-col space-y-2 text-sm">
              <a href="#lstm" className="text-[var(--cel-navy)] font-medium border-l-2 border-[var(--cel-navy)] pl-3">
                Modelo LSTM
              </a>
              <a href="#metricas" className="text-muted-foreground hover:text-foreground border-l-2 border-transparent pl-3 transition-colors">
                Métricas de Desempeño
              </a>
              <a href="#anegacion" className="text-muted-foreground hover:text-foreground border-l-2 border-transparent pl-3 transition-colors">
                Modelo de Propagación
              </a>
            </nav>
          </div>
        </aside>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import "./_group.css";
import { 
  Activity, 
  BarChart, 
  Box, 
  CheckCircle2, 
  ChevronRight, 
  Clock, 
  CloudRain, 
  Cpu, 
  Database, 
  GitMerge, 
  Layers, 
  LayoutDashboard, 
  Map, 
  Network, 
  Server, 
  Settings, 
  ShieldCheck, 
  Users
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Capitulo {
  id: string;
  titulo: string;
  descripcion: string;
  anexos: string[];
  icono: React.ElementType;
  subItems: string[];
  estado: "Actualizado" | "En revisión" | "Estable";
  ultimaModificacion: string;
}

const capitulos: Capitulo[] = [
  {
    id: "flujo",
    titulo: "Flujo del sistema",
    descripcion: "Vista de extremo a extremo del pipeline IA de pronóstico hidrológico.",
    anexos: ["Anexo A"],
    icono: GitMerge,
    subItems: ["Arquitectura general", "Secuencia de procesos", "Puntos de integración"],
    estado: "Estable",
    ultimaModificacion: "12 may 2026",
  },
  {
    id: "datos",
    titulo: "Datos de entrada",
    descripcion: "Fuentes hidrológicas, meteorológicas (ERA5/GPM/CHIRPS) y geoespaciales.",
    anexos: ["Anexo A"],
    icono: Database,
    subItems: ["Estaciones telemétricas", "Satélites climáticos", "Modelos de elevación digital"],
    estado: "Actualizado",
    ultimaModificacion: "18 may 2026",
  },
  {
    id: "etl",
    titulo: "ETL con Mage",
    descripcion: "Preprocesamiento y canalizaciones diarias en Python.",
    anexos: ["Anexo A"],
    icono: Layers,
    subItems: ["Ingesta diaria", "Limpieza de datos", "Transformación para ML"],
    estado: "Estable",
    ultimaModificacion: "10 may 2026",
  },
  {
    id: "modelos",
    titulo: "Modelos de predicción",
    descripcion: "Arquitectura LSTM para caudales y modelo de inundación.",
    anexos: ["Anexo A"],
    icono: Network,
    subItems: ["Topología de red neuronal", "Hiperparámetros", "Cartografía de anegación"],
    estado: "Actualizado",
    ultimaModificacion: "19 may 2026",
  },
  {
    id: "validacion",
    titulo: "Validación y métricas",
    descripcion: "Pruebas rolling-origin y evaluación fuera de muestra (OOS).",
    anexos: ["Anexo A"],
    icono: BarChart,
    subItems: ["Métricas NSE, KGE", "RMSE y MAE", "Reportes de precisión"],
    estado: "Estable",
    ultimaModificacion: "15 may 2026",
  },
  {
    id: "decisiones",
    titulo: "Decisiones técnicas",
    descripcion: "Supuestos, trade-offs y rationale de la arquitectura seleccionada.",
    anexos: ["Anexo A", "Anexo D"],
    icono: Box,
    subItems: ["Registro de decisiones (ADR)", "Mitigación de riesgos", "Alternativas descartadas"],
    estado: "En revisión",
    ultimaModificacion: "17 may 2026",
  },
  {
    id: "operacion",
    titulo: "Operación diaria",
    descripcion: "Programación de ejecuciones, monitoreo y gestión de errores.",
    anexos: ["Anexo A"],
    icono: Activity,
    subItems: ["Cron y orquestación", "Alertas de fallo", "Recuperación ante desastres"],
    estado: "Actualizado",
    ultimaModificacion: "19 may 2026",
  },
  {
    id: "visualizacion",
    titulo: "Visualización y alertas",
    descripcion: "Dashboard de operaciones y distribución de notificaciones SMS/email.",
    anexos: ["Anexo A"],
    icono: LayoutDashboard,
    subItems: ["Interfaz de usuario", "Motor de reglas", "Plantillas de mensajes"],
    estado: "Estable",
    ultimaModificacion: "11 may 2026",
  },
  {
    id: "raci",
    titulo: "Matriz RACI",
    descripcion: "Roles y responsabilidades para cada fase del proyecto.",
    anexos: ["Anexo A"],
    icono: Users,
    subItems: ["Fase de desarrollo", "Pase a producción", "Mantenimiento continuo"],
    estado: "Estable",
    ultimaModificacion: "05 may 2026",
  },
  {
    id: "infraestructura",
    titulo: "Infraestructura del silo IA",
    descripcion: "Hardware y software para procesamiento y almacenamiento seguro.",
    anexos: ["Anexo B", "Anexo C"],
    icono: Server,
    subItems: ["Especificaciones GPU/NAS", "Stack PostgreSQL+MongoDB", "Políticas de respaldo"],
    estado: "En revisión",
    ultimaModificacion: "16 may 2026",
  },
  {
    id: "cuenca",
    titulo: "Cuenca del Río Lempa",
    descripcion: "Dinámicas hidrológicas y contexto de gobernanza trinacional.",
    anexos: ["Anexo E"],
    icono: Map,
    subItems: ["Hidrología regional", "Acuerdos ES/GT/HN", "Puntos de control"],
    estado: "Estable",
    ultimaModificacion: "02 may 2026",
  },
];

const anexosDisponibles = ["Todos", "Anexo A", "Anexo B", "Anexo C", "Anexo D", "Anexo E"];

const cambiosRecientes = [
  { fecha: "19 may 2026, 08:30", capitulo: "Modelos de predicción", autor: "Ing. R. Méndez", accion: "Actualización de pesos LSTM tras entrenamiento iteración 42." },
  { fecha: "18 may 2026, 15:45", capitulo: "Datos de entrada", autor: "Lic. C. Flores", accion: "Incorporación de nuevas series temporales MDE." },
  { fecha: "17 may 2026, 11:20", capitulo: "Decisiones técnicas", autor: "Ing. R. Méndez", accion: "Registro de trade-off en almacenamiento en caliente vs frío." },
];

export default function HubLanzadera() {
  const [filtroAnexo, setFiltroAnexo] = useState("Todos");

  const capitulosFiltrados = capitulos.filter(
    (cap) => filtroAnexo === "Todos" || cap.anexos.includes(filtroAnexo)
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Top Navigation Bar / Hero Compacto */}
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary rounded flex items-center justify-center text-primary-foreground">
              <CloudRain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-primary">Portal CEL — Piloto IA</h1>
              <p className="text-sm text-muted-foreground font-medium">Centro de Desarrollo Técnico</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>19 may 2026, 10:15 SV</span>
            </div>
            <div className="w-px h-4 bg-border"></div>
            <div className="flex items-center gap-1.5 text-primary">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-medium">Acceso autorizado</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {/* KPIs Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white border-border shadow-sm">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardDescription className="font-medium">Documentación</CardDescription>
              <CardTitle className="text-2xl font-bold font-mono">11/11</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <p className="text-xs text-muted-foreground">Capítulos técnicos publicados</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-border shadow-sm">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardDescription className="font-medium">Última actualización</CardDescription>
              <CardTitle className="text-2xl font-bold font-mono">19 may 2026</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <p className="text-xs text-muted-foreground">Corpus documental sincronizado</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-border shadow-sm">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardDescription className="font-medium">Modelo Principal LSTM</CardDescription>
              <CardTitle className="text-2xl font-bold font-mono text-emerald-700">0.18 m³/s</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <p className="text-xs text-muted-foreground">Error Medio Absoluto (MAE) actual</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-border shadow-sm">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardDescription className="font-medium">Salud del Pipeline</CardDescription>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <CardTitle className="text-2xl font-bold font-mono">100%</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <p className="text-xs text-muted-foreground">Operativo. Próx. ejecución 06:00 SV</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-primary">Índice de Arquitectura</h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground mr-2">Filtrar por:</span>
            {anexosDisponibles.map((anexo) => (
              <Badge
                key={anexo}
                variant={filtroAnexo === anexo ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  filtroAnexo === anexo 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "bg-white hover:bg-secondary text-foreground"
                }`}
                onClick={() => setFiltroAnexo(anexo)}
              >
                {anexo}
              </Badge>
            ))}
          </div>
        </div>

        {/* Grid de Capítulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-12">
          {capitulosFiltrados.map((cap) => {
            const Icon = cap.icono;
            return (
              <Card 
                key={cap.id} 
                className="group flex flex-col bg-white hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden border-border"
              >
                <CardHeader className="pb-3 pt-5 px-5 flex-none">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-secondary rounded-md text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {cap.anexos.map((anexo) => (
                        <Badge key={anexo} variant="secondary" className="text-[10px] font-mono bg-accent text-accent-foreground">
                          {anexo}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <CardTitle className="text-base font-bold leading-tight group-hover:text-primary transition-colors">
                    {cap.titulo}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="px-5 pb-4 flex-grow">
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {cap.descripcion}
                  </p>
                  <ul className="space-y-1.5">
                    {cap.subItems.map((item, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5 text-foreground/80">
                        <span className="text-primary/50 mt-0.5">•</span>
                        <span className="line-clamp-1">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="px-5 py-3 bg-secondary/30 border-t border-border flex items-center justify-between flex-none mt-auto">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      cap.estado === "Actualizado" ? "bg-emerald-500" :
                      cap.estado === "En revisión" ? "bg-amber-500" :
                      "bg-blue-500"
                    }`} />
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {cap.estado} ({cap.ultimaModificacion})
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Activity Log */}
        <section className="bg-white border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-secondary/30 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-primary">Registro de cambios recientes</h3>
          </div>
          <div className="divide-y divide-border">
            {cambiosRecientes.map((cambio, i) => (
              <div key={i} className="px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 hover:bg-secondary/20 transition-colors">
                <div className="text-xs font-mono text-muted-foreground w-36 shrink-0">
                  {cambio.fecha}
                </div>
                <div className="flex items-center gap-2 w-48 shrink-0">
                  <Badge variant="outline" className="text-xs bg-white">{cambio.capitulo}</Badge>
                </div>
                <div className="text-sm text-foreground flex-grow">
                  {cambio.accion}
                </div>
                <div className="text-xs text-muted-foreground shrink-0 font-medium">
                  {cambio.autor}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

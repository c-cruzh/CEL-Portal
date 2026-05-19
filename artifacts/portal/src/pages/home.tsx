import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/logo.svg`} alt="CEL Logo" className="h-8 w-8" />
          <span className="font-semibold text-foreground tracking-tight">Portal CEL — Piloto</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
            Iniciar sesión
          </Link>
          <Link href="/sign-up" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
            Crear cuenta
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center">
        <div className="max-w-3xl space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
              Sistema de Pronóstico Hidrológico
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Plataforma institucional para la colaboración del equipo piloto en el desarrollo e implementación de modelos híbridos de pronóstico para la cuenca del Río Lempa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-12">
            <div className="p-6 rounded-xl border border-border bg-card">
              <h3 className="font-semibold mb-2">Colaboración de Equipo</h3>
              <p className="text-sm text-muted-foreground">Directorio del equipo, perfiles profesionales y asignación de roles estratégicos para las fases del piloto.</p>
            </div>
            <div className="p-6 rounded-xl border border-border bg-card">
              <h3 className="font-semibold mb-2">Cronograma Activo</h3>
              <p className="text-sm text-muted-foreground">Seguimiento de las 28 semanas del proyecto, actividades por fase y control de hitos operativos.</p>
            </div>
            <div className="p-6 rounded-xl border border-border bg-card">
              <h3 className="font-semibold mb-2">Metodología Híbrida</h3>
              <p className="text-sm text-muted-foreground">Integración de experiencia hidrológica y técnicas modernas de machine learning para caudales operativos.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          Uso interno exclusivo — Comisión Ejecutiva Hidroeléctrica del Río Lempa (CEL)
        </p>
      </footer>
    </div>
  );
}

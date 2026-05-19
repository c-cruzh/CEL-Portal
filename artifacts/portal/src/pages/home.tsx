import { Link } from "wouter";

export default function Home() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <img
            src={`${basePath}/cel-logo.svg`}
            alt="Comisión Ejecutiva Hidroeléctrica del Río Lempa"
            className="h-10 w-10"
          />
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-foreground tracking-tight text-sm">Portal CEL</span>
            <span className="text-[11px] text-muted-foreground hidden sm:inline-block">
              Comisión Ejecutiva Hidroeléctrica del Río Lempa
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Crear cuenta
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-3xl w-full text-center space-y-10">
          <div className="flex flex-col items-center gap-5">
            <img
              src={`${basePath}/cel-logo.svg`}
              alt="Comisión Ejecutiva Hidroeléctrica del Río Lempa"
              className="h-20 w-20"
            />
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                Portal CEL
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Comisión Ejecutiva Hidroeléctrica del Río Lempa
              </p>
            </div>
          </div>

          <div className="h-px w-16 bg-border mx-auto" />

          <div className="space-y-5">
            <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Piloto
            </p>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
              Pronóstico hidrológico avanzado<br className="hidden md:block" /> basado en inteligencia artificial
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Plataforma institucional del equipo asignado al piloto: punto único de coordinación, documentación y seguimiento del desarrollo técnico del sistema para la cuenca del Río Lempa.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/sign-in"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Acceder al portal
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-card px-5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Solicitar acceso
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          Uso interno exclusivo — Comisión Ejecutiva Hidroeléctrica del Río Lempa (CEL)
        </p>
      </footer>
    </div>
  );
}

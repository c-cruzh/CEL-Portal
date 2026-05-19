import { ReactNode } from "react";
import { Link, useRoute } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";

export default function PortalLayout({ children }: { children: ReactNode }) {
  const { signOut } = useClerk();
  const { user } = useUser();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50 dark:bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/portal/equipo" className="flex items-center gap-2 group">
              <img src={`${basePath}/logo.svg`} alt="CEL Logo" className="h-7 w-7 transition-transform group-hover:scale-105" />
              <span className="font-semibold text-foreground tracking-tight hidden sm:inline-block">Portal CEL — Piloto</span>
            </Link>

            <nav className="flex items-center space-x-1 ml-4 border-l border-border pl-6">
              <NavItem href="/portal/equipo" label="Equipo" />
              <NavItem href="/portal/cronograma" label="Cronograma" />
              <NavItem href="/portal/metodologia" label="Metodología" />
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-foreground hidden md:block">
              {user?.primaryEmailAddress?.emailAddress}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => signOut({ redirectUrl: basePath || "/" })}
              className="text-muted-foreground"
            >
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}

function NavItem({ href, label }: { href: string; label: string }) {
  const [isActive] = useRoute(href);
  
  return (
    <Link 
      href={href} 
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive 
          ? "bg-primary/10 text-primary" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

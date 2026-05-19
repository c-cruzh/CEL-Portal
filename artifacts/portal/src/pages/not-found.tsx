import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-4 border-border shadow-sm">
        <CardContent className="pt-6 text-center">
          <div className="flex flex-col items-center mb-4 gap-2">
            <AlertCircle className="h-10 w-10 text-primary mb-2" />
            <h1 className="text-3xl font-bold text-foreground">404</h1>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Página no encontrada</h2>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            La página que buscas no existe o ha sido movida.
          </p>
          
          <div className="mt-8">
            <Link href="/" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
              Volver al inicio
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

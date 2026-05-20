import { useEffect, useRef, useState, type ReactNode } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { useGetMe, getGetMeQueryKey, ApiError } from "@workspace/api-client-react";
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Home from "@/pages/home";
import PortalLayout from "@/pages/portal/layout";
import Equipo from "@/pages/portal/equipo";
import Cronograma from "@/pages/portal/cronograma";
import Calendario from "@/pages/portal/calendario";
import Metodologia from "@/pages/portal/metodologia";
import Desarrollo from "@/pages/portal/desarrollo";
import Configuracion from "@/pages/portal/configuracion";
import Kanban from "@/pages/portal/kanban";
import Documentos from "@/pages/portal/documentos";
import Decisiones from "@/pages/portal/decisiones";
import PaqueteFase0 from "@/pages/portal/paquete-fase0";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/cel-logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(214 68% 15%)",
    colorForeground: "hsl(222 47% 11%)",
    colorMutedForeground: "hsl(215.4 16.3% 46.9%)",
    colorDanger: "hsl(0 84.2% 60.2%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(214 32% 91%)",
    colorInputForeground: "hsl(222 47% 11%)",
    colorNeutral: "hsl(214 32% 91%)",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden border border-border shadow-sm",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-xl font-semibold text-foreground",
    headerSubtitle: "text-sm text-muted-foreground",
    socialButtonsBlockButtonText: "text-sm font-medium",
    formFieldLabel: "text-sm font-medium text-foreground",
    footerActionLink: "text-primary hover:underline",
    footerActionText: "text-sm text-muted-foreground",
    dividerText: "text-xs text-muted-foreground",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-sm text-green-600",
    alertText: "text-sm text-destructive",
    logoBox: "mb-4",
    logoImage: "h-12 w-auto",
    socialButtonsBlockButton: "border-border hover:bg-muted/50",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
    formFieldInput: "border-input bg-transparent text-foreground",
    footerAction: "bg-muted/30 p-4 border-t border-border",
    dividerLine: "bg-border",
    alert: "bg-destructive/10 border-destructive/20 text-destructive",
    otpCodeFieldInput: "border-input",
    formFieldRow: "mb-4",
    main: "p-6 sm:p-8",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-8">
      <DomainRejectionBanner />
      <ApprovalRejectionBanner />
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-8">
      <DomainRejectionBanner />
      <ApprovalRejectionBanner />
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

const DOMAIN_REJECTION_STORAGE_KEY = "cel.portal.emailDomainRejection";
const APPROVAL_REJECTION_STORAGE_KEY = "cel.portal.approvalRejection";

function readDomainRejection(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(DOMAIN_REJECTION_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setDomainRejection(message: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (message) {
      window.sessionStorage.setItem(DOMAIN_REJECTION_STORAGE_KEY, message);
    } else {
      window.sessionStorage.removeItem(DOMAIN_REJECTION_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

function readApprovalRejection(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(APPROVAL_REJECTION_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setApprovalRejection(message: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (message) {
      window.sessionStorage.setItem(APPROVAL_REJECTION_STORAGE_KEY, message);
    } else {
      window.sessionStorage.removeItem(APPROVAL_REJECTION_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

function useDomainRejectionMessage(): [string | null, () => void] {
  const [message, setMessage] = useState<string | null>(() => readDomainRejection());

  useEffect(() => {
    const handler = () => setMessage(readDomainRejection());
    window.addEventListener("cel:domain-rejection", handler);
    return () => window.removeEventListener("cel:domain-rejection", handler);
  }, []);

  const clear = () => {
    setDomainRejection(null);
    setMessage(null);
  };

  return [message, clear];
}

function useApprovalRejectionMessage(): [string | null, () => void] {
  const [message, setMessage] = useState<string | null>(() => readApprovalRejection());

  useEffect(() => {
    const handler = () => setMessage(readApprovalRejection());
    window.addEventListener("cel:approval-rejection", handler);
    return () => window.removeEventListener("cel:approval-rejection", handler);
  }, []);

  const clear = () => {
    setApprovalRejection(null);
    setMessage(null);
  };

  return [message, clear];
}

function publishDomainRejection(message: string): void {
  setDomainRejection(message);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cel:domain-rejection"));
  }
}

function publishApprovalRejection(message: string): void {
  setApprovalRejection(message);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cel:approval-rejection"));
  }
}

function EmailDomainGuard({ children }: { children: ReactNode }) {
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data, error, isLoading, refetch, isFetching } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
      staleTime: 30_000,
    },
  });

  const errorPayload =
    error && error instanceof ApiError && error.status === 403
      ? (error.data as { code?: string; error?: string } | null)
      : null;
  const isPending = errorPayload?.code === "approval_pending";
  const isRejected = errorPayload?.code === "approval_rejected";
  const isDomainBlocked = errorPayload?.code === "email_domain_not_allowed";

  useEffect(() => {
    if (!isDomainBlocked && !isRejected) return;

    const fallbackMessage = isDomainBlocked
      ? "Tu correo no está autorizado para acceder al portal."
      : "Tu solicitud de acceso fue denegada.";
    const message = errorPayload?.error ?? fallbackMessage;

    if (isDomainBlocked) {
      publishDomainRejection(message);
    } else {
      publishApprovalRejection(message);
    }
    queryClient.clear();
    void signOut({ redirectUrl: `${basePath}/sign-in` }).then(() => {
      setLocation("/sign-in");
    });
  }, [
    isDomainBlocked,
    isRejected,
    errorPayload?.error,
    queryClient,
    setLocation,
    signOut,
  ]);

  if (isPending) {
    return <ApprovalPendingScreen onRefresh={() => refetch()} isRefreshing={isFetching} />;
  }

  if (isDomainBlocked || isRejected) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4 text-center text-sm text-muted-foreground">
        Cerrando sesión…
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4 text-center text-sm text-muted-foreground">
        Cargando…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4 text-center text-sm text-muted-foreground">
        <div className="max-w-md space-y-2">
          <p className="font-medium text-foreground">
            No pudimos verificar tu acceso al portal.
          </p>
          <p>Por favor, vuelve a intentarlo en unos momentos.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function DomainRejectionBanner() {
  const [message, clear] = useDomainRejectionMessage();
  if (!message) return null;
  return (
    <div className="mx-auto mb-4 w-full max-w-[440px] rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <div className="flex items-start justify-between gap-3">
        <p className="leading-snug">{message}</p>
        <button
          type="button"
          onClick={clear}
          className="text-xs font-medium uppercase tracking-wide text-destructive/80 hover:text-destructive"
          aria-label="Cerrar aviso"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function ApprovalRejectionBanner() {
  const [message, clear] = useApprovalRejectionMessage();
  if (!message) return null;
  return (
    <div className="mx-auto mb-4 w-full max-w-[440px] rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <div className="flex items-start justify-between gap-3">
        <p className="leading-snug">{message}</p>
        <button
          type="button"
          onClick={clear}
          className="text-xs font-medium uppercase tracking-wide text-destructive/80 hover:text-destructive"
          aria-label="Cerrar aviso"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function ApprovalPendingScreen({
  onRefresh,
  isRefreshing,
}: {
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md w-full space-y-5 rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xl font-semibold">
          ⌛
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">
            Cuenta en espera de aprobación
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tu correo institucional fue aceptado, pero un administrador del
            portal todavía debe aprobar tu cuenta antes de que puedas entrar.
            Te avisaremos por correo cuando esté listo.
          </p>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {isRefreshing ? "Comprobando…" : "Volver a comprobar"}
          </button>
          <button
            type="button"
            onClick={() => {
              queryClient.clear();
              void signOut({ redirectUrl: `${basePath}/sign-in` }).then(() => {
                setLocation("/sign-in");
              });
            }}
            className="w-full rounded-md border border-input bg-transparent px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <EmailDomainGuard>
          <Redirect to="/portal" />
        </EmailDomainGuard>
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function PortalRoutes() {
  return (
    <PortalLayout>
      <Switch>
        <Route path="/portal" component={() => <Redirect to="/portal/equipo" />} />
        <Route path="/portal/equipo" component={Equipo} />
        <Route path="/portal/cronograma" component={Cronograma} />
        <Route path="/portal/calendario" component={Calendario} />
        <Route path="/portal/metodologia" component={Metodologia} />
        <Route path="/portal/desarrollo-tecnico" component={Desarrollo} />
        <Route path="/portal/kanban" component={Kanban} />
        <Route path="/portal/documentos" component={Documentos} />
        <Route path="/portal/decisiones" component={Decisiones} />
        <Route path="/portal/paquete-fase0" component={PaqueteFase0} />
        <Route path="/portal/configuracion" component={Configuracion} />
        <Route component={NotFound} />
      </Switch>
    </PortalLayout>
  );
}

function PortalGuard() {
  return (
    <>
      <Show when="signed-in">
        <EmailDomainGuard>
          <PortalRoutes />
        </EmailDomainGuard>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

const localization = {
  signIn: {
    start: {
      title: "Iniciar sesión",
      subtitle: "Accede al Portal CEL — Piloto",
    },
  },
  signUp: {
    start: {
      title: "Crear cuenta",
      subtitle: "Únete al equipo del Piloto",
    },
  },
};

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={localization}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/portal/*?" component={PortalGuard} />
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;

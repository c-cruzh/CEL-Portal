import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

let initialized = false;
function ensureInit() {
  if (initialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: "neutral",
    securityLevel: "strict",
    fontFamily: "inherit",
    flowchart: { htmlLabels: true, curve: "basis", useMaxWidth: true },
  });
  initialized = true;
}

let counter = 0;

export function Mermaid({ chart, caption }: { chart: string; caption?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureInit();
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    const id = `mermaid-${++counter}`;
    mermaid
      .render(id, chart)
      .then(({ svg }) => {
        if (cancelled || !el) return;
        el.innerHTML = svg;
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Error renderizando diagrama");
      });
    return () => {
      cancelled = true;
    };
  }, [chart]);

  return (
    <figure className="my-4">
      <div className="rounded-md border border-border bg-card p-4 overflow-x-auto">
        <div ref={ref} className="[&_svg]:max-w-full [&_svg]:h-auto [&_svg]:mx-auto" />
        {error && (
          <p className="text-xs text-destructive mt-2">No se pudo renderizar el diagrama: {error}</p>
        )}
      </div>
      {caption && (
        <figcaption className="text-xs text-muted-foreground text-center mt-2 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Provenance } from "@/lib/climate";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function ProvenanceButton({
  provenance,
  payload,
  title,
}: {
  provenance: Provenance;
  payload: unknown;
  title: string;
}) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-7 px-2 text-[11px] text-muted-foreground"
      >
        {t("prov.open")}
      </Button>

      {open ? createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("prov.title")}
          className="fixed inset-0 z-50 flex justify-end bg-background/70"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="provenance-drawer glass-panel h-[100dvh] w-full max-w-md overflow-y-auto overscroll-contain border-l border-border p-4 shadow-panel sm:p-6">
            <div className="sticky top-0 z-10 -mx-4 -mt-4 flex items-start justify-between gap-3 border-b border-border bg-card/95 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:-mt-6 sm:px-6 sm:py-5">
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">
                  {t("prov.title")}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">{title}</p>
              </div>
              <Button
                ref={closeRef}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                {t("prov.close")}
              </Button>
            </div>

            <dl className="mt-4 space-y-2 text-sm">
              <Row label={t("prov.dataset")} value={provenance.dataset_id} />
              <Row label={t("prov.retrieved")} value={provenance.retrieved} />
              <Row label={t("prov.mode")} value={provenance.mode} />
            </dl>
            {(() => {
              const link = resolveSourceLink(provenance.source_url);
              return (
                <div className="mt-2 space-y-1">
                  <p className="break-all text-xs text-muted-foreground">
                    {link.href ? (
                      <a
                        className="text-primary underline"
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {link.href}
                      </a>
                    ) : (
                      provenance.source_url
                    )}
                  </p>
                  {link.query ? (
                    <p className="break-all text-[11px] text-muted-foreground">{link.query}</p>
                  ) : null}
                </div>
              );
            })()}


            <h3 className="mt-5 text-sm font-semibold text-foreground">{t("prov.raw")}</h3>
            <pre className="mt-2 max-h-[50vh] overflow-auto rounded-lg border border-border bg-elevated p-3 text-[11px] leading-relaxed text-foreground">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-border pb-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

/**
 * Cached MODIS records store the source as
 * "<endpoint>/subset (lat=.., lon=.., band=..)". That combined string is not a
 * URL. Convert it to ORNL DAAC's public MODIS product-dates API, which accepts
 * the sample coordinates directly, while retaining the recorded band below.
 */
export function resolveSourceLink(raw: string): { href: string | null; query: string | null } {
  if (!raw.startsWith("http")) return { href: null, query: null };
  const split = raw.indexOf(" (");
  if (split === -1) {
    try {
      return { href: new URL(raw).toString(), query: null };
    } catch {
      return { href: null, query: null };
    }
  }

  const base = raw.slice(0, split).trim();
  const inner = raw.slice(split + 2).replace(/\)\s*$/, "");
  const params = new Map<string, string>();
  for (const part of inner.split(",")) {
    const [key, value] = part.split("=").map((s) => s?.trim());
    if (key && value) params.set(key, value);
  }

  const lat = params.get("lat");
  const lon = params.get("lon");
  if (/^https:\/\/modis\.ornl\.gov\/rst\/api\/v1\/(MOD13Q1|MOD11A2)\/subset\/?$/.test(base) && lat && lon) {
    const endpoint = new URL(base.replace(/\/subset\/?$/, "/dates"));
    endpoint.searchParams.set("latitude", lat);
    endpoint.searchParams.set("longitude", lon);
    return { href: endpoint.toString(), query: inner };
  }
  return { href: base, query: inner };
}

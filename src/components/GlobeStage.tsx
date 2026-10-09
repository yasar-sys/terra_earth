import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import type { GlobeExplorerProps } from "@/components/GlobeExplorer";
import { useLang } from "@/lib/i18n";

const GlobeExplorer = lazy(() => import("@/components/GlobeExplorer"));

function Fallback() {
  const { t } = useLang();
  return (
    <div className="flex h-full w-full items-center justify-center">
      <p className="text-sm text-muted-foreground">{t("globe.loading")}</p>
    </div>
  );
}

export function GlobeStage(props: GlobeExplorerProps) {
  return (
    <ClientOnly fallback={<Fallback />}>
      <Suspense fallback={<Fallback />}>
        <GlobeExplorer {...props} />
      </Suspense>
    </ClientOnly>
  );
}

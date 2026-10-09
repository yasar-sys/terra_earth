import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { GlobeStage } from "@/components/GlobeStage";
import { DistrictPicker } from "@/components/DistrictPicker";
import { HomeSplash } from "@/components/HomeSplash";
import { coveredDistrictIds } from "@/lib/climate";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { SouthAsiaComparison } from "@/components/SouthAsiaComparison";
import type { VariableKey } from "@/lib/climate";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TerraBangla — Bangladesh Climate Trend Explorer" },
      {
        name: "description",
        content:
          "Spin a 3D Earth, fly into Bangladesh and inspect real NASA vegetation, temperature, solar and rainfall trends for all 64 districts.",
      },
      { property: "og:title", content: "TerraBangla — Bangladesh Climate Trend Explorer" },
      {
        property: "og:description",
        content:
          "Mann-Kendall and Theil-Sen trend tests on cached NASA POWER and MODIS records, district by district.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"world" | "bangladesh">("world");
  const [splashReady, setSplashReady] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [regionalMode, setRegionalMode] = useState(false);
  const [regionalVariable, setRegionalVariable] = useState<VariableKey>("temperature");
  const [regionalId, setRegionalId] = useState("bangladesh");
  const [apiFull, setApiFull] = useState(false);
  const [overlayFull, setOverlayFull] = useState(false);
  const isGlobeFull = apiFull || overlayFull;
  const covered = coveredDistrictIds().length;
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShowSplash(sessionStorage.getItem("terrabangla-splash-seen") !== "1");
    setSplashReady(true);
  }, []);

  useEffect(() => {
    const sync = () => setApiFull(document.fullscreenElement === frameRef.current);
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  // Overlay fallback for browsers (e.g. iOS Safari) without the element Fullscreen API.
  useEffect(() => {
    if (!overlayFull) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [overlayFull]);

  const toggleGlobeFullscreen = useCallback(() => {
    const el = frameRef.current;
    if (!el) return;
    if (overlayFull) {
      setOverlayFull(false);
      return;
    }
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    const target = el as HTMLDivElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    };
    if (typeof target.requestFullscreen === "function" || typeof target.webkitRequestFullscreen === "function") {
      void (target.requestFullscreen?.() ?? target.webkitRequestFullscreen?.());
    } else {
      setOverlayFull(true);
    }
  }, [overlayFull]);

  return (
    <div className="star-field">
      {splashReady && showSplash ? <HomeSplash onComplete={() => setShowSplash(false)} /> : null}
      <section className="mx-auto max-w-7xl px-3 pt-8 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
          {t("hero.challenge")}
        </p>
        <h1 className="mt-3 max-w-5xl font-display text-5xl font-bold leading-[0.98] text-foreground sm:text-7xl lg:text-8xl">
          {t("app.title")}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          {t("app.tagline")}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {covered} / 64 {t("globe.districts")} · {t("hero.cta")}
        </p>
        <Button className="cta-pulse mt-5 rounded-full px-6" onClick={() => setPhase("bangladesh")}>{lang === "bn" ? "অনুসন্ধান শুরু করুন" : "Start investigating"}</Button>
      </section>

      <section className="mx-auto mt-4 max-w-7xl px-3 sm:px-6">
        <div
          ref={frameRef}
          className={`globe-frame relative mt-3 overflow-hidden border border-border bg-elevated ${
            isGlobeFull ? "globe-frame-full h-full w-full" : "h-[58vh] min-h-[340px]"
          }`}
        >
          <GlobeStage
            variable={regionalMode ? regionalVariable : "temperature"}
            phase={phase}
            onPhaseChange={setPhase}
            onSelectDistrict={(districtId) =>
              navigate({ to: "/district/$districtId", params: { districtId } })
            }
            regionalMode={regionalMode}
            selectedRegionalId={regionalId}
            onSelectRegional={setRegionalId}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleGlobeFullscreen}
            aria-pressed={isGlobeFull}
            aria-label={
              isGlobeFull
                ? lang === "bn"
                  ? "ফুল স্ক্রিন বন্ধ করুন"
                  : "Exit full screen"
                : lang === "bn"
                  ? "গ্লোব ফুল স্ক্রিনে দেখুন"
                  : "View globe in full screen"
            }
            className="absolute right-3 top-3 z-20 bg-card/90"
          >
            {isGlobeFull ? <Minimize2 aria-hidden /> : <Maximize2 aria-hidden />}
            <span>
              {isGlobeFull
                ? lang === "bn"
                  ? "ছোট করুন"
                  : "Exit full screen"
                : lang === "bn"
                  ? "ফুল স্ক্রিন"
                  : "Full screen"}
            </span>
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {lang === "bn"
            ? "গ্লোব মাউস বা টাচ দিয়ে ঘোরানো যায়; কীবোর্ড ব্যবহারকারীরা নিচের তালিকা থেকে জেলা বেছে নিতে পারেন।"
            : "The globe is mouse and touch driven; keyboard users can select any district from the list below."}
        </p>
      </section>

      <SouthAsiaComparison
        selection={{
          active: regionalMode,
          variable: regionalVariable,
          selectedId: regionalId,
          onSelect: (id) => {
            setRegionalId(id);
            setRegionalMode(true);
            setPhase("world");
          },
          onVariable: setRegionalVariable,
          onActive: (active) => {
            setRegionalMode(active);
            if (active) setPhase("world");
          },
        }}
      />

      <section className="mx-auto mt-6 max-w-7xl px-3 pb-4 sm:px-6">
        <DistrictPicker />
      </section>
    </div>
  );
}

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import terraBanglaLogo from "@/assets/brand/terra-earth-logo.png.asset.json";

const SPLASH_KEY = "terrabangla-splash-seen";

export function HomeSplash({ onComplete }: { onComplete: () => void }) {
  const { lang } = useLang();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (sessionStorage.getItem(SPLASH_KEY) === "1") {
      document.body.style.overflow = previousOverflow;
      onComplete();
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => finish(), reducedMotion ? 350 : 4000);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function finish() {
    sessionStorage.setItem(SPLASH_KEY, "1");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onComplete();
      return;
    }
    setLeaving(true);
    window.setTimeout(onComplete, 420);
  }

  return createPortal(
    <div className={`home-splash ${leaving ? "is-leaving" : ""}`} role="dialog" aria-modal="true" aria-label={lang === "bn" ? "টেরা আর্থ পরিচিতি" : "Terra Earth introduction"}>
      <div className="home-splash-stars" aria-hidden />
      <div className="home-splash-logo-wrap">
        <span className="home-splash-logo-halo" aria-hidden />
        <img
          className="home-splash-logo"
          src={terraBanglaLogo.url}
          alt={lang === "bn" ? "টেরা আর্থ" : "Terra Earth"}
          width={768}
          height={768}
        />
      </div>
      <div className="home-splash-copy">
        <p>{lang === "bn" ? "পৃথিবী জলবায়ু প্রমাণ" : "Earth climate evidence"}</p>
        <span>{lang === "bn" ? "পৃথিবী থেকে স্থান—বাস্তব NASA তথ্যের পথে" : "From Earth to location, guided by real NASA data"}</span>
      </div>
      <div className="home-splash-progress" aria-hidden><i /></div>
      <Button variant="ghost" className="home-splash-skip" onClick={finish}>
        {lang === "bn" ? "এড়িয়ে যান" : "Skip"}<ArrowRight />
      </Button>
    </div>,
    document.body,
  );
}
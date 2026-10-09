import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, BarChart3, BookOpen, Compass, FlaskConical, Globe2, Languages, Library, Map, Menu, MessageCircle, Satellite } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AuthButton } from "@/components/AuthButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import terraBanglaLogo from "@/assets/brand/terrabangla-logo.png.asset.json";

const NAV = [
  { to: "/", key: "nav.globe", icon: Globe2 },
  { to: "/heatmap", key: "nav.heatmap", icon: Map },
  { to: "/compare", key: "nav.compare", icon: BarChart3 },
  { to: "/kids", key: "nav.kids", icon: FlaskConical },
  { to: "/chat", key: "nav.chat", icon: MessageCircle },
  { to: "/about", key: "nav.about", icon: BookOpen },
  { to: "/how-it-works", key: "nav.how", icon: Compass },
  { to: "/reference", key: "nav.reference", icon: Library },
] as const;

function Brand() {
  const { t } = useLang();
  return (
    <Link to="/" className="group flex min-w-0 items-center gap-3 rounded-md">
      <img className="site-brand-logo" src={terraBanglaLogo.url} alt="" width={768} height={768} />
      <span className="min-w-0">
        <span className="block truncate font-display text-lg font-semibold text-foreground">{t("app.title")}</span>
        <span className="block truncate text-[10px] uppercase text-muted-foreground">Global climate evidence</span>
      </span>
    </Link>
  );
}

function NavItems({ mobile = false }: { mobile?: boolean }) {
  const { t } = useLang();
  return NAV.map((item) => {
    const Icon = item.icon;
    const link = (
      <Link
        to={item.to}
        activeOptions={{ exact: item.to === "/" }}
        className={mobile ? "nav-mobile-link" : "nav-desktop-link"}
        activeProps={{ className: mobile ? "nav-mobile-link nav-link-active" : "nav-desktop-link nav-link-active" }}
      >
        {mobile && <Icon aria-hidden />} <span className="whitespace-nowrap">{t(item.key)}</span>
      </Link>
    );
    return mobile ? <SheetClose asChild key={item.to}>{link}</SheetClose> : <li key={item.to}>{link}</li>;
  });
}

function BackButton() {
  const { lang } = useLang();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/") return null;
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => (window.history.length > 1 ? router.history.back() : router.navigate({ to: "/" }))}
      aria-label={lang === "bn" ? "আগের পাতায় ফিরে যান" : "Go back"}
    >
      <ArrowLeft aria-hidden /> {lang === "bn" ? "ফিরে যান" : "Back"}
    </Button>
  );
}

export function SiteHeader() {
  const { t, lang, setLang } = useLang();
  return (
    <header className="site-header sticky top-0 z-40 border-b border-border/80 bg-background/82 backdrop-blur-xl">
      <div className="header-spectrum" />
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-3 sm:px-6">
        <BackButton />
        <Brand />
        <nav aria-label="Main" className="ml-auto hidden xl:block">
          <ul className="flex items-center gap-1"><NavItems /></ul>
        </nav>
        <Button variant="outline" size="sm" onClick={() => setLang(lang === "en" ? "bn" : "en")} className="ml-auto shrink-0 xl:ml-0" aria-label={t("lang.label")}>
          <Languages aria-hidden /> {t("lang.toggle")}
        </Button>
        <ThemeToggle />
        <div className="hidden sm:block"><AuthButton /></div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 xl:hidden" aria-label={t("nav.menu")}><Menu aria-hidden /></Button>
          </SheetTrigger>
          <SheetContent className="glass-panel border-border bg-background/95 backdrop-blur-xl">
            <SheetHeader><SheetTitle><Brand /></SheetTitle></SheetHeader>
            <nav aria-label="Mobile" className="mt-8 flex flex-col gap-2"><NavItems mobile /></nav>
            <div className="mt-5"><AuthButton /></div>
            <div className="mt-8 border-t border-border pt-5 text-xs leading-6 text-muted-foreground">
              {t("app.tagline")}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { t, lang } = useLang();
  const L = (en: string, bn: string) => (lang === "bn" ? bn : en);
  return (
    <footer className="relative z-10 mt-14 border-t border-border bg-elevated/92 backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl gap-8 px-3 py-9 sm:px-6 md:grid-cols-[1.25fr_0.75fr_0.75fr]">
        <div>
          <Brand />
          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">{t("footer.built")}</p>
          <p className="mt-3 inline-flex items-center gap-2 text-xs text-accent"><Satellite aria-hidden className="h-4 w-4" /> NASA data · deterministic statistics · AI-guided inquiry</p>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase text-foreground">{L("Investigate", "অনুসন্ধান")}</h2>
          <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/heatmap" className="hover:text-foreground">{t("nav.heatmap")}</Link>
            <Link to="/compare" search={{ districtA: undefined, districtB: undefined }} className="hover:text-foreground">{t("nav.compare")}</Link>
            <Link to="/kids" className="hover:text-foreground">{t("nav.kids")}</Link>
          </div>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase text-foreground">{L("Open science", "উন্মুক্ত বিজ্ঞান")}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("footer.license")}</p>
          <div className="flex flex-col gap-2">
            <Link to="/about" className="mt-2 text-sm text-primary hover:underline">{t("nav.about")}</Link>
            <Link to="/how-it-works" className="text-sm text-primary hover:underline">{t("nav.how")}</Link>
            <Link to="/reference" className="text-sm text-primary hover:underline">{t("nav.reference")}</Link>
          </div>
          <Link to="/admin" className="mt-2 inline-block text-sm text-muted-foreground hover:underline">Admin</Link>
        </div>
      </div>
      <div className="border-t border-border/70 px-3 py-3 text-center text-[11px] text-muted-foreground">MEC TERRA_DETECTORS · Worldwide · 2026</div>
    </footer>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogIn, ShieldCheck } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { safeAuthNext, usesLovableAuthBroker } from "@/lib/auth-host";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Sign in — Terra Earth" },
    { name: "description", content: "Sign in securely to save Terra Earth climate conversations." },
    { property: "og:title", content: "Sign in — Terra Earth" },
    { property: "og:description", content: "Save your climate questions and return to them anytime." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const go = () => {
      const next = sessionStorage.getItem("terrabangla-auth-next") || "/chat";
      sessionStorage.removeItem("terrabangla-auth-next");
      void navigate({ to: safeAuthNext(next) });
    };
    void supabase.auth.getSession().then(({ data }) => { if (data.session) go(); else setBusy(false); });
    const { data } = supabase.auth.onAuthStateChange((event, session) => { if (session && event === "SIGNED_IN") go(); });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function signIn() {
    setBusy(true); setError("");
    const next = safeAuthNext(sessionStorage.getItem("terrabangla-auth-next"));

    if (!usesLovableAuthBroker()) {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth-callback?next=${encodeURIComponent(next)}`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (oauthError) { setError(oauthError.message); setBusy(false); }
      return;
    }

    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin, extraParams: { prompt: "select_account" },
    });
    if (result.error) { setError(result.error.message); setBusy(false); return; }
    if (result.redirected) return;
    sessionStorage.removeItem("terrabangla-auth-next");
    void navigate({ to: next });
  }

  return <div className="mx-auto flex min-h-[65vh] max-w-lg items-center px-4 py-12">
    <section className="panel w-full p-7 text-center">
      <ShieldCheck className="mx-auto h-10 w-10 text-accent" aria-hidden />
      <h1 className="mt-4 font-display text-3xl text-foreground">Terra Earth</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{lang === "bn" ? "আপনার জলবায়ু কথোপকথন নিরাপদে সংরক্ষণ করতে Google দিয়ে সাইন ইন করুন।" : "Sign in with Google to securely save and revisit your climate conversations."}</p>
      <Button className="mt-6 w-full" onClick={signIn} disabled={busy}><LogIn aria-hidden />{busy ? (lang === "bn" ? "পরীক্ষা করছি…" : "Checking…") : (lang === "bn" ? "Google দিয়ে চালিয়ে যান" : "Continue with Google")}</Button>
      {error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}
    </section>
  </div>;
}
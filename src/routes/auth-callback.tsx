import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/auth-callback")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Signing you in — Terra Earth" },
    { name: "description", content: "Completing your secure Terra Earth sign-in." },
    { property: "og:title", content: "Signing you in — Terra Earth" },
    { property: "og:description", content: "Completing your secure Terra Earth sign-in." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AuthCallback,
});

function safeNext(value: string | null): "/admin" | "/chat" {
  return value === "/admin" ? "/admin" : "/chat";
}

function AuthCallback() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const go = () => {
      const stored = sessionStorage.getItem("terrabangla-auth-next");
      sessionStorage.removeItem("terrabangla-auth-next");
      const url = new URL(window.location.href);
      const next = safeNext(url.searchParams.get("next") ?? stored);
      void navigate({ to: next });
    };

    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const oauthError = params.get("error_description") ?? params.get("error") ?? hash.get("error_description");
    if (oauthError) { setError(oauthError); return; }

    // supabase-js exchanges the code/tokens in the URL on first client access.
    const check = async (attempt: number): Promise<void> => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) { go(); return; }
      if (attempt >= 12) {
        setError(lang === "bn" ? "সাইন ইন সম্পূর্ণ হয়নি। আবার চেষ্টা করুন।" : "Sign-in did not complete. Please try again.");
        return;
      }
      setTimeout(() => void check(attempt + 1), 400);
    };
    void check(0);

    return () => { cancelled = true; };
  }, [navigate, lang]);

  return <div className="mx-auto flex min-h-[60vh] max-w-lg items-center px-4 py-12">
    <section className="panel w-full p-7 text-center">
      <h1 className="font-display text-2xl text-foreground">Terra Earth</h1>
      <p aria-live="polite" className="mt-3 text-sm leading-6 text-muted-foreground">
        {error ? error : lang === "bn" ? "সাইন ইন সম্পূর্ণ করছি…" : "Completing your sign-in…"}
      </p>
      {error ? <a className="mt-4 inline-block text-sm underline" href="/auth">{lang === "bn" ? "আবার চেষ্টা করুন" : "Try again"}</a> : null}
    </section>
  </div>;
}

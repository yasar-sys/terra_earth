import { useEffect, useState } from "react";
import { LogIn, LogOut, UserRound } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import { safeAuthNext, usesLovableAuthBroker } from "@/lib/auth-host";

export function AuthButton() {
  const { lang } = useLang();
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "SIGNED_IN" && session) {
        const next = sessionStorage.getItem("terrabangla-auth-next");
        if (next === "/admin" || next === "/profile" || next === "/reference" || next?.startsWith("/chat")) {
          sessionStorage.removeItem("terrabangla-auth-next");
          window.location.assign(next);
        }
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function signIn() {
    setBusy(true);
    sessionStorage.setItem("terrabangla-auth-next", window.location.pathname);
    if (!usesLovableAuthBroker()) {
      const next = safeAuthNext(window.location.pathname);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth-callback?next=${encodeURIComponent(next)}`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) setBusy(false);
      return;
    }
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
      extraParams: { prompt: "select_account" },
    });
    if (result.error) setBusy(false);
  }

  if (user) {
    return (
      <div className="flex items-center gap-1">
        {user.email?.toLowerCase() === "saminyasarsunny@gmail.com" ? <Button asChild variant="ghost" size="sm"><Link to="/admin">{lang === "bn" ? "অ্যাডমিন" : "Admin"}</Link></Button> : null}
        <Button asChild variant="ghost" size="sm"><Link to="/profile"><UserRound aria-hidden/>{lang === "bn" ? "প্রোফাইল" : "Profile"}</Link></Button>
        <Button variant="outline" size="sm" onClick={() => void supabase.auth.signOut()} title={user.email ?? ""}>
          <LogOut aria-hidden /> {lang === "bn" ? "সাইন আউট" : "Sign out"}
        </Button>
      </div>
    );
  }
  return (
    <Button variant="outline" size="sm" onClick={signIn} disabled={busy}>
      <LogIn aria-hidden /> {busy ? (lang === "bn" ? "খুলছে…" : "Opening…") : (lang === "bn" ? "সাইন ইন" : "Sign in")}
    </Button>
  );
}
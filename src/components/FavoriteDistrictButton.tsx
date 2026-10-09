import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getFavoriteDistrictIds, toggleFavoriteDistrict } from "@/lib/learning.functions";
import { useLang } from "@/lib/i18n";

export function FavoriteDistrictButton({ districtId }: { districtId: string }) {
  const { lang } = useLang();
  const [favorite, setFavorite] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const listFavorites = useServerFn(getFavoriteDistrictIds);
  const toggleFavorite = useServerFn(toggleFavoriteDistrict);
  useEffect(() => {
    void supabase.auth.getUser().then(async ({ data }) => {
      setSignedIn(Boolean(data.user));
      if (data.user) setFavorite((await listFavorites()).includes(districtId));
    });
  }, [districtId, listFavorites]);
  const label = favorite ? (lang === "bn" ? "প্রিয় জেলা থেকে সরাও" : "Remove favorite") : (lang === "bn" ? "প্রিয় জেলা হিসেবে সেভ করো" : "Save favorite");
  return <Button variant="outline" disabled={busy} onClick={async () => {
    if (!signedIn) { sessionStorage.setItem("terrabangla-auth-next", window.location.pathname); window.location.assign("/auth"); return; }
    setBusy(true); const next = !favorite;
    try { await toggleFavorite({ data: { districtId, favorite: next } }); setFavorite(next); } finally { setBusy(false); }
  }} aria-label={label} title={label}><Heart className={favorite ? "fill-current text-accent" : ""}/>{favorite ? (lang === "bn" ? "সেভ করা" : "Saved") : (lang === "bn" ? "সেভ" : "Save")}</Button>;
}
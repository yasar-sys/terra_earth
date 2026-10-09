import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin } from "lucide-react";
import { districts } from "@/lib/climate";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function DistrictPicker() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [districtId, setDistrictId] = useState("dhaka");

  return (
    <section aria-labelledby="picker-heading" className="panel mx-auto max-w-3xl p-4 sm:p-5">
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_1.4fr_auto]">
        <div>
        <h2 id="picker-heading" className="font-display text-lg font-semibold text-foreground">
          {t("globe.pick")}
        </h2>
          <p className="mt-1 text-xs text-muted-foreground">{lang === "bn" ? "একটি জেলা বেছে বিস্তারিত উপাত্ত দেখুন।" : "Choose one district to open its evidence."}</p>
        </div>
        <label className="text-xs text-muted-foreground">
          <span className="sr-only">{t("globe.pick")}</span>
          <select value={districtId} onChange={(e) => setDistrictId(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-border bg-elevated px-3 text-sm text-foreground">
            {districts.map((d) => <option key={d.id} value={d.id}>{lang === "bn" ? d.bn : d.name} · {d.division}</option>)}
          </select>
        </label>
        <Button onClick={() => navigate({ to: "/district/$districtId", params: { districtId } })}>
          <MapPin aria-hidden />{lang === "bn" ? "দেখুন" : "Explore"}
        </Button>
      </div>
    </section>
  );
}

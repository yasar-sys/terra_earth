import { useEffect, useState, type CSSProperties } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import celebratingAsset from "@/assets/mascot/celebrating.png.asset.json";
import encouragingAsset from "@/assets/mascot/encouraging.png.asset.json";
import idleAsset from "@/assets/mascot/idle.png.asset.json";
import thinkingAsset from "@/assets/mascot/thinking.png.asset.json";
import wavingAsset from "@/assets/mascot/waving.png.asset.json";
import { useLang } from "@/lib/i18n";
import { getDistrictScene, getDistrictTheme } from "@/lib/district-themes";

export type MascotState = "idle" | "celebrating" | "encouraging" | "thinking" | "waving";

const POSES: Record<MascotState, string> = {
  idle: idleAsset.url,
  celebrating: celebratingAsset.url,
  encouraging: encouragingAsset.url,
  thinking: thinkingAsset.url,
  waving: wavingAsset.url,
};

const MESSAGES: Record<MascotState, { en: string; bn: string }> = {
  idle: { en: "Read the map, then follow the evidence through time.", bn: "মানচিত্রটি দেখো, তারপর সময়ের সঙ্গে প্রমাণ অনুসরণ করো।" },
  celebrating: { en: "This pattern is statistically significant.", bn: "এই প্রবণতাটি পরিসংখ্যানগতভাবে তাৎপর্যপূর্ণ।" },
  encouraging: { en: "Compare the direction with the evidence sentence.", bn: "প্রমাণের বাক্যটির সঙ্গে পরিবর্তনের দিক মিলিয়ে দেখো।" },
  thinking: { en: "The evidence view is updating.", bn: "প্রমাণের দৃশ্যটি হালনাগাদ হচ্ছে।" },
  waving: { en: "Welcome to the district climate studio.", bn: "জেলা জলবায়ু স্টুডিওতে স্বাগতম।" },
};

export function KidsMascot({ state, context, districtId = "dhaka" }: { state: MascotState; context?: { district: string; variable: string }; districtId?: string }) {
  const { lang } = useLang();
  const [minimized, setMinimized] = useState(false);
  const accent = getDistrictTheme(districtId).characterAccent;
  const scene = getDistrictScene(districtId);

  useEffect(() => {
    Object.values(POSES).forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }, []);

  const contextual = context && state === "idle"
    ? lang === "bn"
      ? `${context.district}-এর ${context.variable} উপাত্তে কী দেখা যায়, তা এখানে বোঝানো হয়েছে।`
      : `Here is what the ${context.variable.toLowerCase()} record shows for ${context.district}.`
    : MESSAGES[state][lang];

  if (minimized) return <Button type="button" variant="outline" size="sm" className="kids-guide-restore" onClick={() => setMinimized(false)}><ChevronUp />{lang === "bn" ? "গাইড দেখাও" : "Show guide"}</Button>;

  return (
    <aside className={`kids-mascot is-${state}`} data-accessory={accent.accessory} data-chat-style={scene.chatStyle} style={{ "--district-guide-accent": accent.color } as CSSProperties} aria-live="polite" aria-atomic="true">
      <div className="kids-mascot-copy"><span><i aria-hidden="true" />{lang === "bn" ? "তথ্য গাইড" : "Evidence guide"}</span><p>{contextual}</p><small>{context?.district ?? (lang === "bn" ? "বাংলাদেশ" : "Bangladesh")}</small></div>
      <div className="kids-mascot-art" key={state}>
        <img src={POSES[state]} alt="" aria-hidden="true" draggable={false} />
        <i className="kids-mascot-accent" aria-hidden="true">{String(accent.mark).padStart(2, "0")}</i>
      </div>
      <Button type="button" variant="ghost" size="icon-sm" className="kids-guide-minimize" onClick={() => setMinimized(true)} aria-label={lang === "bn" ? "গাইড ছোট করো" : "Minimize guide"}><ChevronDown /></Button>
    </aside>
  );
}
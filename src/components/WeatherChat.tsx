import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";

type Who = "sun" | "cloud" | "rain" | "you";
type Mood = "happy" | "hot" | "sad" | "wow" | "angry";
type Bi = { en: string; bn: string };

interface Msg { who: Who; mood?: Mood; text: Bi }
interface Choice { label: Bi; next: string; points: number }
interface Scene { msgs: Msg[]; choices: Choice[] }

const NAMES: Record<Who, Bi> = {
  sun: { en: "Sunny the Sun", bn: "সূর্যমামা" },
  cloud: { en: "Meghla the Cloud", bn: "মেঘলা মেঘ" },
  rain: { en: "Brishti the Raindrop", bn: "বৃষ্টি ফোঁটা" },
  you: { en: "You", bn: "তুমি" },
};

const STORY: Record<string, Scene> = {
  start: {
    msgs: [
      { who: "sun", mood: "happy", text: { en: "Good morning, Bangladesh! ☀️ I'm Sunny.", bn: "সুপ্রভাত বাংলাদেশ! ☀️ আমি সূর্যমামা।" } },
      { who: "cloud", mood: "happy", text: { en: "And I'm Meghla! I carry water across the sky.", bn: "আর আমি মেঘলা! আমি আকাশে পানি বয়ে বেড়াই।" } },
      { who: "sun", mood: "hot", text: { en: "Phew… lately Dhaka feels SO hot. Even I'm sweating! 🥵", bn: "উফ… ইদানীং ঢাকা খুব গরম লাগে। আমিও ঘামছি! 🥵" } },
      { who: "cloud", mood: "sad", text: { en: "Why do you think the city is heating up, friend?", bn: "বন্ধু, তোমার কী মনে হয়, শহর এত গরম হচ্ছে কেন?" } },
    ],
    choices: [
      { label: { en: "Too many trees were cut 🌳", bn: "অনেক গাছ কাটা হয়েছে 🌳" }, next: "trees", points: 2 },
      { label: { en: "The Sun got bigger", bn: "সূর্য বড় হয়ে গেছে" }, next: "sunBigger", points: 0 },
    ],
  },
  sunBigger: {
    msgs: [
      { who: "sun", mood: "wow", text: { en: "Haha, no! I'm the same size I've always been. 😄", bn: "হাহা, না! আমি আগের মতোই আছি। 😄" } },
      { who: "cloud", mood: "happy", text: { en: "The real reasons are on Earth: fewer trees, more concrete, more smoke.", bn: "আসল কারণ পৃথিবীতেই: কম গাছ, বেশি কংক্রিট, বেশি ধোঁয়া।" } },
    ],
    choices: [{ label: { en: "Oh! Tell me about trees", bn: "ওহ! গাছের কথা বলো" }, next: "trees", points: 0 }],
  },
  trees: {
    msgs: [
      { who: "cloud", mood: "happy", text: { en: "Yes! Trees give shade and breathe out water — like a natural air-cooler.", bn: "হ্যাঁ! গাছ ছায়া দেয় আর পানি ছাড়ে — প্রাকৃতিক এসির মতো।" } },
      { who: "sun", mood: "sad", text: { en: "Without trees, my light hits hot roads and roofs. They trap heat all night.", bn: "গাছ না থাকলে আমার আলো গরম রাস্তা আর ছাদে পড়ে। সারারাত তাপ আটকে থাকে।" } },
      { who: "rain", mood: "wow", text: { en: "Plip-plop! Did someone call for rain? 💧", bn: "টুপটাপ! কেউ কি বৃষ্টি ডাকলে? 💧" } },
      { who: "rain", mood: "sad", text: { en: "In monsoon I come, but sometimes too much at once… and floods happen. 😢", bn: "বর্ষায় আমি আসি, কিন্তু কখনো একসাথে অনেক বেশি… তখন বন্যা হয়। 😢" } },
    ],
    choices: [
      { label: { en: "Keep drains clean & plant trees", bn: "নালা পরিষ্কার রাখো আর গাছ লাগাও" }, next: "drains", points: 2 },
      { label: { en: "Throw plastic in the canal", bn: "খালে প্লাস্টিক ফেলো" }, next: "plastic", points: 0 },
    ],
  },
  plastic: {
    msgs: [
      { who: "rain", mood: "angry", text: { en: "Nooo! Plastic blocks my way and the streets flood! 😠", bn: "না না! প্লাস্টিক আমার পথ আটকায়, রাস্তা ডুবে যায়! 😠" } },
      { who: "cloud", mood: "sad", text: { en: "Let's try again — what helps water flow away safely?", bn: "আবার চেষ্টা করি — কী করলে পানি নিরাপদে সরে যায়?" } },
    ],
    choices: [{ label: { en: "Clean drains & plant trees!", bn: "নালা পরিষ্কার আর গাছ লাগানো!" }, next: "drains", points: 1 }],
  },
  drains: {
    msgs: [
      { who: "rain", mood: "happy", text: { en: "Yay! Tree roots soak me up and clean drains let me flow. 🎉", bn: "ইয়ে! গাছের শিকড় আমাকে শুষে নেয়, পরিষ্কার নালায় আমি বয়ে যাই। 🎉" } },
      { who: "sun", mood: "happy", text: { en: "And shade keeps the city cooler. Scientists see this in NASA satellite data!", bn: "আর ছায়ায় শহর ঠান্ডা থাকে। বিজ্ঞানীরা নাসার উপগ্রহের তথ্যে এটা দেখেন!" } },
      { who: "cloud", mood: "wow", text: { en: "One last question, detective: what can YOU do tomorrow?", bn: "শেষ প্রশ্ন, গোয়েন্দা: কাল তুমি কী করতে পারো?" } },
    ],
    choices: [
      { label: { en: "Walk or cycle to school 🚲", bn: "হেঁটে বা সাইকেলে স্কুলে যাব 🚲" }, next: "end", points: 2 },
      { label: { en: "Switch off fans when leaving 💡", bn: "বের হলে পাখা বন্ধ করব 💡" }, next: "end", points: 2 },
      { label: { en: "Leave the AC on all day", bn: "সারাদিন এসি চালু রাখব" }, next: "acOops", points: 0 },
    ],
  },
  acOops: {
    msgs: [
      { who: "sun", mood: "hot", text: { en: "Oh no, that uses lots of electricity and warms the air outside! 🥵", bn: "ওহ না, এতে অনেক বিদ্যুৎ খরচ হয় আর বাইরের বাতাস গরম হয়! 🥵" } },
    ],
    choices: [{ label: { en: "Okay, I'll save energy instead", bn: "ঠিক আছে, আমি বিদ্যুৎ বাঁচাব" }, next: "end", points: 1 }],
  },
  end: {
    msgs: [
      { who: "sun", mood: "happy", text: { en: "You're a real Earth Trend Detective! 🕵️", bn: "তুমি সত্যিকারের পৃথিবী-গোয়েন্দা! 🕵️" } },
      { who: "cloud", mood: "happy", text: { en: "Small actions + many people = big change. 🌍", bn: "ছোট কাজ + অনেক মানুষ = বড় পরিবর্তন। 🌍" } },
      { who: "rain", mood: "wow", text: { en: "See you in the next monsoon! Plip-plop! 💧", bn: "পরের বর্ষায় দেখা হবে! টুপটাপ! 💧" } },
    ],
    choices: [],
  },
};
const MAX_POINTS = 6;

function Face({ mood }: { mood: Mood }) {
  const mouth: Record<Mood, string> = {
    happy: "M-7 4 Q0 11 7 4",
    hot: "M-6 7 Q0 3 6 7",
    sad: "M-6 8 Q0 2 6 8",
    wow: "M-3 5 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0",
    angry: "M-6 7 L6 7",
  };
  return (
    <g stroke="#1A1F2E" strokeWidth="2" strokeLinecap="round" fill="none">
      {mood === "angry" && <path d="M-10 -9 L-3 -6 M10 -9 L3 -6" />}
      <circle cx="-6" cy="-3" r="1.8" fill="#1A1F2E" />
      <circle cx="6" cy="-3" r="1.8" fill="#1A1F2E" />
      <path d={mouth[mood]} fill={mood === "wow" ? "#1A1F2E" : "none"} />
      {mood === "hot" && <path d="M12 -8 q2 4 0 6 q-2 -2 0 -6" fill="#7CC4F0" stroke="none" />}
      {(mood === "happy" || mood === "hot") && (
        <>
          <circle cx="-11" cy="3" r="2.5" fill="#F28B82" stroke="none" opacity="0.6" />
          <circle cx="11" cy="3" r="2.5" fill="#F28B82" stroke="none" opacity="0.6" />
        </>
      )}
    </g>
  );
}

export function Character({ who, mood = "happy", size = 44 }: { who: Exclude<Who, "you">; mood?: Mood; size?: number }) {
  const anim = mood === "angry" || mood === "hot" ? "wc-shake" : mood === "wow" ? "wc-jump" : "wc-bob";
  return (
    <svg viewBox="-30 -30 60 60" width={size} height={size} className={anim} aria-hidden="true">
      {who === "sun" && (
        <>
          <g className="wc-spin" fill={mood === "hot" ? "#F2703B" : "#F2A93B"}>
            {Array.from({ length: 10 }).map((_, i) => (
              <rect key={i} x="-2" y="-29" width="4" height="9" rx="2" transform={`rotate(${i * 36})`} />
            ))}
          </g>
          <circle r="18" fill={mood === "hot" ? "#F28B3B" : "#F7C948"} />
        </>
      )}
      {who === "cloud" && (
        <path d="M-22 12 a10 10 0 0 1 2 -19 a13 13 0 0 1 24 -5 a11 11 0 0 1 18 12 a8 8 0 0 1 -2 12 z" fill={mood === "sad" ? "#AEB6C8" : "#E8ECF4"} />
      )}
      {who === "rain" && <path d="M0 -24 C10 -8 17 2 17 10 A17 17 0 0 1 -17 10 C-17 2 -10 -8 0 -24 z" fill="#5BA8F0" />}
      <g transform={who === "rain" ? "translate(0 8)" : who === "cloud" ? "translate(1 2)" : ""}>
        <Face mood={mood} />
      </g>
    </svg>
  );
}

export function WeatherChat() {
  const { lang } = useLang();
  const L = (b: Bi) => (lang === "bn" ? b.bn : b.en);
  const [log, setLog] = useState<Msg[]>([]);
  const [queue, setQueue] = useState<Msg[]>(STORY["start"]!.msgs);
  const [scene, setScene] = useState("start");
  const [points, setPoints] = useState(0);
  const [typing, setTyping] = useState<Who | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (queue.length === 0) { setTyping(null); return; }
    const next = queue[0]!;
    setTyping(next.who);
    const id = window.setTimeout(() => {
      setLog((l) => [...l, next]);
      setQueue((q) => q.slice(1));
    }, reduce ? 150 : 1100);
    return () => window.clearTimeout(id);
  }, [queue, reduce]);

  useEffect(() => {
    const el = endRef.current?.parentElement;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [log, typing, reduce]);

  const choose = (c: Choice) => {
    setLog((l) => [...l, { who: "you", text: c.label }]);
    setPoints((p) => p + c.points);
    setScene(c.next);
    setQueue(STORY[c.next]!.msgs);
  };
  const restart = () => { setLog([]); setPoints(0); setScene("start"); setQueue(STORY["start"]!.msgs); };

  const lastMood = (w: Who) => [...log].reverse().find((m) => m.who === w)?.mood ?? "happy";
  const done = queue.length === 0;
  const choices = done ? STORY[scene]!.choices : [];

  return (
    <div className="glass-panel overflow-hidden rounded-2xl border border-border shadow-panel">
      <div className="flex items-center gap-3 border-b border-border bg-accent/10 px-4 py-3">
        <div className="flex -space-x-3">
          {(["sun", "cloud", "rain"] as const).map((w) => (
            <span key={w} className="rounded-full bg-background/80 p-0.5 ring-2 ring-card"><Character who={w} mood={lastMood(w)} size={34} /></span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{lang === "bn" ? "আবহাওয়া বন্ধুরা 🌦️" : "Weather Friends 🌦️"}</p>
          <p className="truncate text-xs text-muted-foreground">
            {typing ? `${L(NAMES[typing])} ${lang === "bn" ? "লিখছে…" : "is typing…"}` : lang === "bn" ? "সূর্যমামা, মেঘলা, বৃষ্টি, তুমি" : "Sunny, Meghla, Brishti, you"}
          </p>
        </div>
        <span className="rounded-full bg-stable/15 px-3 py-1 text-xs font-semibold text-stable">🌍 {points}/{MAX_POINTS}</span>
      </div>

      <div className="wc-wallpaper h-[420px] space-y-3 overflow-y-auto px-3 py-4 sm:px-5" aria-live="polite">
        {log.map((m, i) =>
          m.who === "you" ? (
            <div key={i} className="flex justify-end animate-fade-in">
              <div className="max-w-[78%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground shadow-glow">{L(m.text)}</div>
            </div>
          ) : (
            <div key={i} className="flex items-end gap-2 animate-fade-in">
              <Character who={m.who} mood={m.mood ?? "happy"} size={40} />
              <div className="max-w-[78%] rounded-2xl rounded-bl-sm bg-secondary px-3.5 py-2 text-sm text-foreground shadow">
                <p className="text-[11px] font-semibold text-[var(--rising)]">{L(NAMES[m.who])}</p>
                {L(m.text)}
              </div>
            </div>
          ),
        )}
        {typing && typing !== "you" && (
          <div className="flex items-end gap-2">
            <Character who={typing} mood="happy" size={40} />
            <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-secondary px-4 py-3">
              {[0, 1, 2].map((d) => <span key={d} className="wc-dot h-2 w-2 rounded-full bg-muted-foreground" style={{ animationDelay: `${d * 0.15}s` }} />)}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border bg-background/60 p-3">
        {choices.map((c) => (
          <button key={c.label.en} type="button" onClick={() => choose(c)} className="hover-scale rounded-full border border-primary/60 bg-primary/15 px-4 py-2 text-sm text-foreground hover:bg-primary/30">
            {L(c.label)}
          </button>
        ))}
        {done && choices.length === 0 && (
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-foreground">
              {lang === "bn" ? `গল্প শেষ! তুমি পেয়েছ ${points}/${MAX_POINTS} পৃথিবী-পয়েন্ট 🌍` : `Story complete! You earned ${points}/${MAX_POINTS} Earth points 🌍`}
            </p>
            <button type="button" onClick={restart} className="cta-pulse rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              {lang === "bn" ? "আবার খেলো" : "Play again"}
            </button>
          </div>
        )}
        {!done && <p className="text-xs text-muted-foreground">{lang === "bn" ? "বন্ধুরা কথা বলছে…" : "Your friends are chatting…"}</p>}
      </div>
    </div>
  );
}

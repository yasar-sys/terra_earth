import { useLocationEvidence } from "@/lib/location-evidence";
import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Captions,
  Check,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackToTop } from "@/components/BackToTop";
import { usePublishedQuiz } from "@/lib/public-content";
import { ProvenanceButton } from "@/components/ProvenanceDrawer";
import { analyzeVariable, getDistrict } from "@/lib/climate";
import { fmt, useLang } from "@/lib/i18n";
import {
  KIDS_STORY,
  type StoryScene,
  type StorySound,
  type StoryText,
} from "@/lib/kids-story";
import earth from "@/assets/global-story/earth.jpg";
import nightScene from "@/assets/global-story/earth.jpg";
import guideScene from "@/assets/global-story/guide.jpg";
import deltaScene from "@/assets/global-story/landscapes.jpg";
import signalsScene from "@/assets/global-story/signals.jpg";
import greenScene from "@/assets/global-story/forest.jpg";
import landScene from "@/assets/global-story/land.jpg";
import airScene from "@/assets/global-story/city.jpg";
import sunScene from "@/assets/global-story/sun.jpg";
import rainScene from "@/assets/global-story/rain.jpg";
import dotsScene from "@/assets/global-story/dots.jpg";
import testScene from "@/assets/global-story/test.jpg";
import rateScene from "@/assets/global-story/rate.jpg";
import journalScene from "@/assets/global-story/evidence.jpg";
import challengeScene from "@/assets/global-story/future.jpg";
import celebrating from "@/assets/mascot/celebrating.png.asset.json";
import encouraging from "@/assets/mascot/encouraging.png.asset.json";
import idle from "@/assets/mascot/idle.png.asset.json";
import thinking from "@/assets/mascot/thinking.png.asset.json";
import waving from "@/assets/mascot/waving.png.asset.json";

const SCENE_ART: Record<string, string> = {
  night: nightScene,
  guide: guideScene,
  delta: deltaScene,
  signals: signalsScene,
  green: greenScene,
  land: landScene,
  air: airScene,
  sun: sunScene,
  rain: rainScene,
  dots: dotsScene,
  test: testScene,
  rate: rateScene,
  journal: journalScene,
  challenge: challengeScene,
};
type StoryMood = "welcoming" | "curious" | "thinking" | "encouraging" | "happy";
type VoiceState = "idle" | "speaking" | "paused";

const POSES: Record<StoryMood, string> = {
  welcoming: waving.url,
  curious: encouraging.url,
  thinking: thinking.url,
  encouraging: idle.url,
  happy: celebrating.url,
};

const MOODS: Record<string, StoryMood> = {
  night: "welcoming",
  guide: "happy",
  delta: "curious",
  signals: "encouraging",
  green: "curious",
  land: "thinking",
  air: "thinking",
  sun: "happy",
  rain: "curious",
  dots: "thinking",
  test: "encouraging",
  rate: "thinking",
  journal: "happy",
  challenge: "welcoming",
};

type ReviewQuestion = { q: StoryText; o: StoryText[]; a: number; w: StoryText; scene?: string };
const BUILT_IN_QUESTIONS: [ReviewQuestion, ...ReviewQuestion[]] = [
  { scene: "dots", q: { en: "Why is a line between only the first and last year not enough?", bn: "শুধু প্রথম ও শেষ বছরের মাঝে রেখা টানা কেন যথেষ্ট নয়?" }, o: [{ en: "Every year between them also matters", bn: "মাঝের প্রতিটি বছরও গুরুত্বপূর্ণ" }, { en: "The last year is always wrong", bn: "শেষ বছর সবসময় ভুল" }, { en: "Lines cannot be drawn on maps", bn: "মানচিত্রে রেখা আঁকা যায় না" }], a: 0, w: { en: "Two dots are not a trend: Terra Earth uses every annual observation in the selected period.", bn: "দুটি বিন্দু প্রবণতা নয়: টেরা আর্থ নির্বাচিত সময়ের প্রতিটি বার্ষিক পর্যবেক্ষণ ব্যবহার করে।" } },
  { scene: "green", q: { en: "In Brazil, what does NDVI help Tara compare?", bn: "ব্রাজিলে NDVI তারাকে কী তুলনা করতে সাহায্য করে?" }, o: [{ en: "River depth", bn: "নদীর গভীরতা" }, { en: "Plant greenness", bn: "উদ্ভিদের সবুজের পরিমাণ" }, { en: "A photograph of every leaf", bn: "প্রতিটি পাতার ছবি" }], a: 1, w: { en: "NDVI is a greenness signal—not a photograph of every leaf.", bn: "NDVI সবুজের একটি সংকেত—প্রতিটি পাতার ছবি নয়।" } },
  { scene: "air", q: { en: "Are Cairo's land temperature and Tokyo's air temperature the same kind of record?", bn: "কায়রোর ভূপৃষ্ঠের তাপমাত্রা আর টোকিওর বায়ুর তাপমাত্রা কি একই ধরনের রেকর্ড?" }, o: [{ en: "Yes, the names are similar", bn: "হ্যাঁ, নাম কাছাকাছি" }, { en: "Only at night", bn: "শুধু রাতে" }, { en: "No, they are measured separately", bn: "না, এগুলো আলাদাভাবে মাপা হয়" }], a: 2, w: { en: "Land temperature comes from MODIS; air temperature comes from NASA POWER. Similar names do not mean identical evidence.", bn: "ভূপৃষ্ঠের তাপমাত্রা আসে MODIS থেকে; বায়ুর তাপমাত্রা NASA POWER থেকে। নাম কাছাকাছি হলেও প্রমাণ এক নয়।" } },
  { scene: "rain", q: { en: "Rafi says heavy rain today is…", bn: "রাফি বলে, আজকের ভারী বৃষ্টি হলো…" }, o: [{ en: "Weather", bn: "আবহাওয়া" }, { en: "A climate trend", bn: "জলবায়ুর প্রবণতা" }, { en: "A satellite error", bn: "স্যাটেলাইটের ভুল" }], a: 0, w: { en: "One day is weather; a pattern across many years is the evidence we test for climate.", bn: "একদিনের ঘটনা আবহাওয়া; বহু বছরের ধরনই জলবায়ুর জন্য পরীক্ষিত প্রমাণ।" } },
  { scene: "test", q: { en: "What does the Mann–Kendall test check?", bn: "Mann–Kendall পরীক্ষা কী যাচাই করে?" }, o: [{ en: "A satellite's speed", bn: "স্যাটেলাইটের গতি" }, { en: "The direction of change through time", bn: "সময়ের সঙ্গে পরিবর্তনের দিক" }, { en: "The colour of the map", bn: "মানচিত্রের রং" }], a: 1, w: { en: "Mann–Kendall checks direction, and the p-value helps decide whether the pattern is clear.", bn: "Mann–Kendall দিক যাচাই করে, আর p-value বুঝতে সাহায্য করে ধরনটি স্পষ্ট কি না।" } },
  { scene: "test", q: { en: "If the evidence is not statistically significant, what is the honest conclusion?", bn: "প্রমাণ পরিসংখ্যানগতভাবে তাৎপর্যপূর্ণ না হলে সৎ সিদ্ধান্ত কী?" }, o: [{ en: "A dramatic change", bn: "বড় পরিবর্তন" }, { en: "Delete the data", bn: "তথ্য মুছে ফেলো" }, { en: "No clear change", bn: "স্পষ্ট পরিবর্তন নেই" }], a: 2, w: { en: "The honest answer is no clear change—even when the two endpoints differ.", bn: "সৎ উত্তর হলো স্পষ্ট পরিবর্তন নেই—দুই শেষবিন্দু আলাদা হলেও।" } },
  { scene: "rate", q: { en: "Which method estimates the rate of change while resisting unusual years?", bn: "কোন পদ্ধতি অস্বাভাবিক বছরের টান সামলে পরিবর্তনের হার হিসাব করে?" }, o: [{ en: "Theil–Sen", bn: "Theil–Sen" }, { en: "The illustration", bn: "ছবি" }, { en: "An AI guess", bn: "এআই-এর অনুমান" }], a: 0, w: { en: "Theil–Sen estimates the rate; no illustration or AI invents these numbers.", bn: "Theil–Sen হার হিসাব করে; কোনো ছবি বা এআই এই সংখ্যা বানায় না।" } },
];

function voiceScore(voice: SpeechSynthesisVoice, lang: "en" | "bn") {
  const name = voice.name.toLowerCase();
  const language = voice.lang.toLowerCase();
  let score = 0;
  if (lang === "bn" && (language.startsWith("bn") || name.includes("bangla") || name.includes("bengali"))) score += 100;
  if (lang === "en" && language.startsWith("en")) score += 100;
  if (name.includes("google") || name.includes("microsoft") || name.includes("samantha") || name.includes("natural")) score += 20;
  if (voice.localService) score += 5;
  return score;
}

function useStoryAudio(lang: "en" | "bn", muted: boolean) {
  const [status, setStatus] = useState<VoiceState>("idle");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const ctx = useRef<AudioContext | null>(null);
  const nodes = useRef<{ sources: AudioScheduledSourceNode[]; gain: GainNode } | null>(null);
  const currentSound = useRef<StorySound>("space");

  const stopAmbience = useCallback(() => {
    nodes.current?.sources.forEach((source) => {
      try { source.stop(); } catch { /* already stopped */ }
    });
    nodes.current = null;
  }, []);

  const fadeAmbience = useCallback(() => {
    const active = nodes.current;
    if (!active || !ctx.current) return;
    const now = ctx.current.currentTime;
    active.gain.gain.cancelScheduledValues(now);
    active.gain.gain.setValueAtTime(Math.max(active.gain.gain.value, 0.0001), now);
    active.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    window.setTimeout(() => {
      active.sources.forEach((source) => {
        try { source.stop(); } catch { /* already stopped */ }
      });
      if (nodes.current === active) nodes.current = null;
    }, 200);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    stopAmbience();
    setStatus("idle");
  }, [stopAmbience]);

  useEffect(() => {
    const loadVoices = () => setVoices(window.speechSynthesis?.getVoices() ?? []);
    loadVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices);
  }, []);

  const ambience = useCallback((sound: StorySound) => {
    if (muted) return;
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) return;
    ctx.current ??= new AudioContextConstructor();
    stopAmbience();
    void ctx.current.resume();
    const audio = ctx.current;
    // Soft scene bed: filtered noise texture (wind/river/rain) plus a quiet drone.
    const profiles: Record<StorySound, { frequencies: number[]; type: OscillatorType; tone: number; noise: number; cutoff: number }> = {
      space: { frequencies: [82, 123], type: "sine", tone: 0.03, noise: 0.012, cutoff: 500 },
      river: { frequencies: [146, 196], type: "sine", tone: 0.015, noise: 0.05, cutoff: 900 },
      forest: { frequencies: [196, 294], type: "triangle", tone: 0.012, noise: 0.03, cutoff: 1600 },
      city: { frequencies: [110, 165], type: "triangle", tone: 0.014, noise: 0.035, cutoff: 700 },
      rain: { frequencies: [233, 349], type: "triangle", tone: 0.008, noise: 0.07, cutoff: 3200 },
      signal: { frequencies: [261, 392], type: "sine", tone: 0.022, noise: 0.01, cutoff: 1200 },
      dawn: { frequencies: [174, 261, 349], type: "sine", tone: 0.02, noise: 0.018, cutoff: 1000 },
    };
    const profile = profiles[sound];
    const gain = audio.createGain();
    const now = audio.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(1, now + 0.8);
    gain.connect(audio.destination);
    const toneGain = audio.createGain();
    toneGain.gain.value = profile.tone;
    toneGain.connect(gain);
    const sources: AudioScheduledSourceNode[] = profile.frequencies.map((frequency, index) => {
      const source = audio.createOscillator();
      source.type = profile.type;
      source.frequency.value = frequency;
      source.detune.value = index % 2 === 0 ? -5 : 5;
      source.connect(toneGain);
      source.start();
      return source;
    });
    const buffer = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
    const channel = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < channel.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; channel[i] = last * 3.5; }
    const noise = audio.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = audio.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = profile.cutoff;
    const noiseGain = audio.createGain();
    noiseGain.gain.value = profile.noise * 6;
    noise.connect(filter).connect(noiseGain).connect(gain);
    noise.start();
    sources.push(noise);
    nodes.current = { sources, gain };
  }, [muted]);

  const speak = useCallback((text: string, sound: StorySound) => {
    stop();
    if (muted || !window.speechSynthesis) return;
    currentSound.current = sound;
    ambience(sound);
    const utterance = new SpeechSynthesisUtterance(text);
    const chosen = [...voices].sort((a, b) => voiceScore(b, lang) - voiceScore(a, lang))[0];
    if (chosen && voiceScore(chosen, lang) >= 100) utterance.voice = chosen;
    utterance.lang = lang === "bn" ? "bn-BD" : "en-US";
    utterance.rate = lang === "bn" ? 0.82 : 0.88;
    utterance.pitch = lang === "bn" ? 1.1 : 1.08;
    utterance.volume = 1;
    utterance.onstart = () => setStatus("speaking");
    utterance.onend = () => { setStatus("idle"); };
    utterance.onerror = () => { setStatus("idle"); };
    window.speechSynthesis.speak(utterance);
  }, [ambience, fadeAmbience, lang, muted, stop, voices]);

  const togglePause = useCallback(() => {
    if (status === "speaking") {
      window.speechSynthesis.pause();
      stopAmbience();
      setStatus("paused");
    } else if (status === "paused") {
      window.speechSynthesis.resume();
      ambience(currentSound.current);
      setStatus("speaking");
    }
  }, [ambience, status, stopAmbience]);

  useEffect(() => stop, [lang, muted, stop]);
  useEffect(() => () => stop(), [stop]);
  return { speak, stop, status, togglePause };
}

declare global { interface Window { webkitAudioContext?: typeof AudioContext } }

function FinalReview({ onReview }: { onReview: () => void }) {
  const { lang } = useLang();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const localize = (value: StoryText) => value[lang];
  const published = usePublishedQuiz();
  const QUESTIONS: ReviewQuestion[] = published && published.length > 0 ? published.map((item) => ({ q: item.q, o: item.options, a: item.answer, w: item.why })) : BUILT_IN_QUESTIONS;

  if (index >= QUESTIONS.length) return (
    <section className="story-review story-review-finish">
      <BookOpenCheck />
      <p>{lang === "bn" ? "প্রমাণ পাঠ সম্পন্ন" : "Evidence reading complete"}</p>
      <h2>{lang === "bn" ? `${QUESTIONS.length.toLocaleString("bn-BD")}টির মধ্যে ${score.toLocaleString("bn-BD")}টি সঠিক` : `${score} of ${QUESTIONS.length} correct`}</h2>
      <p>{lang === "bn" ? "এখন তুমি স্থান, চলক, সময়, পরীক্ষা ও উৎস—সব মিলিয়ে প্রমাণ পড়তে পারো।" : "You can now read evidence by connecting place, variable, time, test and source."}</p>
      <div>
        <Button onClick={onReview}><ArrowLeft />{lang === "bn" ? "গল্প আবার দেখো" : "Review story"}</Button>
        <Button variant="outline" onClick={() => { setIndex(0); setPicked(null); setScore(0); }}><RotateCcw />{lang === "bn" ? "আবার উত্তর দাও" : "Try again"}</Button>
      </div>
    </section>
  );

  const question = QUESTIONS[index] ?? QUESTIONS[0]!;
  const clue = question.scene ? KIDS_STORY.find((item) => item.id === question.scene) : undefined;
  return (
    <section className="story-review" aria-labelledby="review-title">
      <div className="story-review-progress"><span>{lang === "bn" ? `প্রশ্ন ${index + 1} / ${QUESTIONS.length}` : `Question ${index + 1} of ${QUESTIONS.length}`}</span><i style={{ width: `${((index + (picked === null ? 0 : 1)) / QUESTIONS.length) * 100}%` }} /></div>
      {clue ? <small className="block text-xs text-muted-foreground">{lang === "bn" ? "গল্পের সূত্র: " : "Story clue: "}{localize(clue.title)}</small> : null}
      <h2 id="review-title">{localize(question.q)}</h2>
      <div className="story-review-options">{question.o.map((option, optionIndex) => <Button key={option.en} variant="outline" disabled={picked !== null} className={picked === null ? "" : optionIndex === question.a ? "is-correct" : optionIndex === picked ? "is-wrong" : "is-muted"} onClick={() => { setPicked(optionIndex); if (optionIndex === question.a) setScore((value) => value + 1); }}>{picked !== null && optionIndex === question.a ? <Check /> : null}{localize(option)}</Button>)}</div>
      {picked !== null ? <div className="story-review-answer" role="status"><small>{lang === "bn" ? "এখান থেকে কী শিখলাম" : "What you learned"}</small><p>{localize(question.w)}</p><Button onClick={() => { setIndex((value) => value + 1); setPicked(null); }}>{index === QUESTIONS.length - 1 ? (lang === "bn" ? "ফলাফল দেখো" : "See result") : (lang === "bn" ? "পরের প্রশ্ন" : "Next question")}<ArrowRight /></Button></div> : null}
    </section>
  );
}

function narrationFor(scene: StoryScene, lang: "en" | "bn") {
  return `${scene.title[lang]}. ${scene.dialogue[lang]} ${scene.narration[lang]}`;
}

export function KidsStory() {
  const { lang, setLang } = useLang();
  const [started, setStarted] = useState(false);
  const [active, setActive] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [muted, setMuted] = useState(false);
  const [captions, setCaptions] = useState(true);
  const touchStart = useRef<number | null>(null);
  const { stop, speak, status, togglePause } = useStoryAudio(lang, muted);
  const scene = KIDS_STORY[active] ?? KIDS_STORY[0];
  const mood = MOODS[scene.id] ?? "encouraging";
  const localize = (value: StoryText) => value[lang];
  const locationEvidence = useLocationEvidence(scene.evidence?.districtId ?? "dhaka", false);
  const analysis = useMemo(() => scene.evidence ? analyzeVariable(scene.evidence.districtId, scene.evidence.variable) : null, [scene, locationEvidence.version]);
  const district = useMemo(() => scene.evidence ? getDistrict(scene.evidence.districtId) : null, [scene]);

  const playScene = useCallback((target: StoryScene) => {
    speak(narrationFor(target, lang), target.sound);
  }, [lang, speak]);

  const go = useCallback((next: number) => {
    stop();
    if (next >= KIDS_STORY.length) {
      setShowReview(true);
      return;
    }
    const bounded = Math.max(0, next);
    const target = KIDS_STORY[bounded] ?? KIDS_STORY[0];
    setShowReview(false);
    setActive(bounded);
    sessionStorage.setItem("tb-story-scene", String(bounded));
    playScene(target);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [playScene, stop]);

  useEffect(() => {

    const stored = Number(sessionStorage.getItem("tb-story-scene") ?? 0);
    if (Number.isFinite(stored)) setActive(Math.min(Math.max(stored, 0), KIDS_STORY.length - 1));
  }, [setLang]);

  useEffect(() => {
    [...Object.values(SCENE_ART), ...Object.values(POSES)].forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }, []);

  useEffect(() => {
    if (!started || showReview) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") go(active + 1);
      if (event.key === "ArrowLeft") go(active - 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, go, showReview, started]);

  useEffect(() => {
    if (started && !showReview) stop();
  }, [lang, showReview, started, stop]);

  if (!started) return (
    <section className="story-gate">
      <img src={earth} alt="Tara and Rafi explore planet Earth" width={1536} height={1024} />
      <div>
        <p>{lang === "bn" ? "টেরা আর্থ কমিক যাত্রা" : "A Terra Earth comic journey"}</p>
        <h1>{lang === "bn" ? "প্রমাণের খাতা" : "The Evidence Journal"}</h1>
        <p>{lang === "bn" ? "তারা, রাফি ও নীলের সঙ্গে ব্রাজিলের বন থেকে টোকিও, নাইরোবি ও অস্ট্রেলিয়ার প্রমাণ খুঁজে দেখো।" : "Join Tara, Rafi and Neel across continents, from Brazil’s forests to Tokyo, Nairobi and Australia. Follow the records, not guesses."}</p>
        <Button size="lg" onClick={() => { setStarted(true); playScene(scene); window.scrollTo({ top: 0, behavior: "auto" }); }}><Play />{lang === "bn" ? "গল্প শুরু করো" : "Start story"}</Button>
      </div>
    </section>
  );

  if (showReview) return (
    <main className="story-slide-shell story-review-screen">
      <FinalReview onReview={() => go(0)} />
      <BackToTop />
      <p className="story-honesty">{lang === "bn" ? "কমিকের ছবি ব্যাখ্যার জন্য। পরিমাপ করা প্রমাণ শুধু সংরক্ষিত NASA রেকর্ড ও নির্ধারিত পরিসংখ্যান থেকে আসে।" : "Comic artwork is explanatory. Measured evidence comes only from cached NASA records and deterministic statistics."}</p>
    </main>
  );

  return (
    <main
      className="story-slide-shell"
      data-scene={scene.id}
      onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        const end = event.changedTouches[0]?.clientX;
        if (touchStart.current === null || end === undefined) return;
        const distance = end - touchStart.current;
        if (Math.abs(distance) > 55) go(distance < 0 ? active + 1 : active - 1);
        touchStart.current = null;
      }}
    >
      <div className="story-backdrop" key={scene.id} aria-hidden><img src={SCENE_ART[scene.id] ?? nightScene} alt="" width={1536} height={1024} /></div>
      <header className="story-toolbar">
        <div><small>{lang === "bn" ? `অধ্যায় ${scene.chapter}` : `Chapter ${scene.chapter}`}</small><strong>{localize(scene.chapterTitle)}</strong></div>
        <span>{active + 1} / {KIDS_STORY.length}</span>
        <Button size="icon" variant="outline" onClick={() => status === "idle" ? playScene(scene) : togglePause()} aria-label={status === "speaking" ? (lang === "bn" ? "বিরতি" : "Pause") : status === "paused" ? (lang === "bn" ? "আবার চালাও" : "Resume") : (lang === "bn" ? "আবার শোনাও" : "Replay narration")}>{status === "speaking" ? <Pause /> : <Play />}</Button>
        <Button size="icon" variant="outline" onClick={() => setMuted((value) => !value)} aria-label={muted ? (lang === "bn" ? "শব্দ চালু" : "Unmute") : (lang === "bn" ? "শব্দ বন্ধ" : "Mute")}>{muted ? <VolumeX /> : <Volume2 />}</Button>
        <Button size="icon" variant={captions ? "secondary" : "outline"} onClick={() => setCaptions((value) => !value)} aria-label={lang === "bn" ? "ক্যাপশন" : "Captions"}><Captions /></Button>
      </header>
      <div className="story-progress" aria-hidden><i style={{ width: `${((active + 1) / KIDS_STORY.length) * 100}%` }} /></div>

      <section className="story-active-slide" key={`${scene.id}-${lang}`} aria-labelledby="story-slide-title">
        <div className="story-character-stage" data-mood={mood} data-motion={scene.id} data-speaking={status === "speaking" ? "true" : "false"}>
          <div className="story-character">
            <img src={POSES[mood]} alt="" aria-hidden draggable={false} />
          </div>
        </div>

        <article className="story-panel">
          <p className="story-panel-index">{String(active + 1).padStart(2, "0")} · {localize(scene.chapterTitle)}</p>
          <h2 id="story-slide-title">{localize(scene.title)}</h2>
          <div className="story-dialogue"><div><span>{localize(scene.speaker)}</span><p>“{localize(scene.dialogue)}”</p></div></div>
          {captions ? <p className="story-caption">{localize(scene.narration)}</p> : null}
          {analysis ? <div className="story-evidence" onClickCapture={stop}><div><small>{lang === "bn" ? "বাস্তব নাসা প্রমাণ" : "Real NASA evidence"}</small><strong>{lang === "bn" ? district?.bn : district?.name} · {analysis.label}</strong><p>{analysis.result.period.start}–{analysis.result.period.end} · {analysis.result.n_observations} {lang === "bn" ? "বার্ষিক পর্যবেক্ষণ" : "annual observations"} · {lang === "bn" ? "প্রতি দশকে" : "per decade"} {fmt(analysis.result.slope.slope_per_decade, lang, 2)} {analysis.unit}</p></div><ProvenanceButton provenance={analysis.provenance} payload={analysis} title={`${district?.name} · ${analysis.label}`} /></div> : null}
          <nav className="story-nav" aria-label={lang === "bn" ? "গল্পের দৃশ্য" : "Story scenes"}>
            <Button variant="outline" disabled={active === 0} onClick={() => go(active - 1)}><ArrowLeft />{lang === "bn" ? "আগের দৃশ্য" : "Previous"}</Button>
            <Button onClick={() => go(active + 1)}>{active === KIDS_STORY.length - 1 ? (lang === "bn" ? "শেষের প্রশ্ন" : "Final review") : (lang === "bn" ? "পরের দৃশ্য" : "Next")}<ArrowRight /></Button>
          </nav>
          {scene.evidence ? <Button asChild variant="outline"><Link to="/district/$districtId" params={{districtId:scene.evidence.districtId}}>{lang === "bn" ? "এই স্থানের NASA প্রমাণ খুলুন" : "Open this location’s NASA evidence"}</Link></Button> : null}
        </article>
      </section>
      <BackToTop />
    </main>
  );
}
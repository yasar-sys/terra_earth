import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Bell, Database, FileText, HelpCircle, MessageSquare, Trash2 } from "lucide-react";
import { addAnnouncement, addDataUpload, addDistrictContent, deleteDataUpload, deleteQuizQuestion, getAdminDashboard, listQuizAdmin, saveQuizQuestion } from "@/lib/admin.functions";
import { districts, VARIABLE_KEYS } from "@/lib/climate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [
    { title: "Admin workspace — Terra Earth" }, { name: "description", content: "Restricted Terra Earth content administration." },
    { property: "og:title", content: "Admin workspace — Terra Earth" }, { property: "og:description", content: "Restricted administration workspace." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex" },
  ] }), component: AdminPage,
});

function field(form: FormData, name: string) { return String(form.get(name) ?? ""); }

function AdminPage() {
  const [data, setData] = useState<any>(null); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const refresh = () => getAdminDashboard().then(setData).catch((e) => setError(e instanceof Error ? e.message : String(e)));
  useEffect(() => { void refresh(); }, []);
  async function submit(kind: "announcement" | "content" | "upload", event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); const form = new FormData(event.currentTarget);
    try {
      if (kind === "announcement") await addAnnouncement({ data: { titleEn: field(form,"titleEn"), titleBn: field(form,"titleBn"), bodyEn: field(form,"bodyEn"), bodyBn: field(form,"bodyBn"), published: form.get("published") === "on" } });
      if (kind === "content") await addDistrictContent({ data: { districtId: field(form,"districtId"), headingEn: field(form,"headingEn"), headingBn: field(form,"headingBn"), bodyEn: field(form,"bodyEn"), bodyBn: field(form,"bodyBn"), published: form.get("published") === "on" } });
      if (kind === "upload") await addDataUpload({ data: { districtId: field(form,"districtId"), variable: field(form,"variable"), sourceName: field(form,"sourceName"), sourceUrl: field(form,"sourceUrl"), payload: field(form,"payload") } });
      event.currentTarget.reset(); setNotice("Saved securely."); await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }
  if (error && !data) return <div className="mx-auto min-h-[60vh] max-w-xl px-4 py-14"><section className="panel p-6"><h1 className="font-display text-2xl">Admin workspace</h1><p role="alert" className="mt-3 text-sm text-destructive">{error}</p></section></div>;
  return <div className="mx-auto max-w-7xl px-3 py-8 sm:px-6"><h1 className="font-display text-4xl">Admin workspace</h1><p className="mt-2 text-sm text-muted-foreground">Restricted to the approved Terra Earth administrator.</p>{notice ? <p role="status" className="mt-3 text-sm text-stable">{notice}</p> : null}{error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}
    <Tabs defaultValue="districts" className="mt-6"><TabsList className="grid h-auto w-full grid-cols-2 lg:grid-cols-5"><TabsTrigger value="districts"><FileText className="mr-2 h-4 w-4" />District content</TabsTrigger><TabsTrigger value="announcements"><Bell className="mr-2 h-4 w-4" />Announcements</TabsTrigger><TabsTrigger value="chat"><MessageSquare className="mr-2 h-4 w-4" />Chat review</TabsTrigger><TabsTrigger value="uploads"><Database className="mr-2 h-4 w-4" />Data files</TabsTrigger><TabsTrigger value="quiz"><HelpCircle className="mr-2 h-4 w-4" />Quiz</TabsTrigger></TabsList>
      <TabsContent value="districts"><AdminForm onSubmit={(e) => void submit("content", e)}><SelectDistrict /><Input name="headingEn" required placeholder="English heading" /><Input name="headingBn" required placeholder="বাংলা শিরোনাম" /><Textarea name="bodyEn" required placeholder="English content" /><Textarea name="bodyBn" required placeholder="বাংলা বিষয়বস্তু" /><Publish /></AdminForm><Records rows={data?.content} /></TabsContent>
      <TabsContent value="announcements"><AdminForm onSubmit={(e) => void submit("announcement", e)}><Input name="titleEn" required placeholder="English title" /><Input name="titleBn" required placeholder="বাংলা শিরোনাম" /><Textarea name="bodyEn" required placeholder="English announcement" /><Textarea name="bodyBn" required placeholder="বাংলা ঘোষণা" /><Publish /></AdminForm><Records rows={data?.announcements} /></TabsContent>
      <TabsContent value="chat"><section className="panel p-5"><h2 className="font-display text-xl">Recent saved conversations</h2><p className="mt-1 text-xs text-muted-foreground">Review recent student questions and assistant replies.</p><div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto">{data?.chatMessages?.map((message: Record<string, unknown>) => <article key={String(message['id'])} className="rounded-md border border-border bg-elevated p-3"><p className="text-[10px] font-semibold uppercase text-accent">{String(message['role'])}</p><p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{String(message['content'])}</p></article>)}</div></section></TabsContent>
      <TabsContent value="uploads"><DataFileTab rows={data?.uploads} onSubmit={(e) => void submit("upload", e)} onDelete={async (id) => { await deleteDataUpload({ data: { id } }); await refresh(); }} /></TabsContent><TabsContent value="quiz"><QuizAdmin /></TabsContent>
    </Tabs></div>;
}
function AdminForm({ children, onSubmit }: { children: React.ReactNode; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) { return <form onSubmit={onSubmit} className="panel my-4 grid gap-3 p-5">{children}<Button type="submit">Save</Button></form>; }
function SelectDistrict() { return <select name="districtId" className="h-9 rounded-md border border-input bg-background px-3 text-sm">{districts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}</select>; }
function Publish() { return <label className="flex items-center gap-2 text-sm"><input name="published" type="checkbox" />Publish now</label>; }
function Records({ rows }: { rows?: Array<Record<string, unknown>> }) { return <div className="mt-3 grid gap-2">{rows?.slice(0,20).map((row) => <div key={String(row['id'])} className="rounded-md border border-border bg-elevated p-3 text-xs text-muted-foreground">{String(row['title_en'] ?? row['heading_en'] ?? row['title'] ?? row['source_name'] ?? row['id'])}</div>)}</div>; }
const SAMPLE = `{
  "unit": "°C",
  "label": "Air temperature (annual mean)",
  "annual": { "2015": 26.1, "2016": 26.3, "2017": 26.2, "2018": 26.5, "2019": 26.6 }
}`;

function DataFileTab({ rows, onSubmit, onDelete }: { rows?: Record<string, unknown>[]; onSubmit: (e: FormEvent<HTMLFormElement>) => void; onDelete: (id: string) => Promise<void> }) {
  const [text, setText] = useState("");
  async function pick(file: File | undefined) { if (file) setText(await file.text()); }
  return <>
    <AdminForm onSubmit={onSubmit}>
      <p className="text-sm text-muted-foreground">Add a yearly data file for a district. It appears on that district's page right away, with the same trend tests as the NASA data. NASA data already stored for that measure takes priority.</p>
      <label className="grid gap-1 text-sm">District<SelectDistrict /></label>
      <label className="grid gap-1 text-sm">Measure<select name="variable" className="h-9 rounded-md border border-input bg-background px-3 text-sm">{VARIABLE_KEYS.map((key) => <option key={key}>{key}</option>)}</select></label>
      <Input name="sourceName" required placeholder="Source name, e.g. NASA POWER" />
      <Input name="sourceUrl" type="url" required placeholder="https://source…" />
      <label className="grid gap-1 text-sm">Choose a .json file<input type="file" accept=".json,application/json" onChange={(e) => void pick(e.target.files?.[0])} className="text-sm" /></label>
      <Textarea name="payload" required value={text} onChange={(e) => setText(e.target.value)} placeholder={SAMPLE} className="min-h-40 font-mono text-xs" />
      <p className="text-xs text-muted-foreground">Needs a unit and at least 5 years of values.</p>
    </AdminForm>
    <section className="panel p-5"><h2 className="font-display text-xl">Uploaded files</h2><ul className="mt-3 space-y-2">{rows?.map((row) => <li key={String(row['id'])} className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm"><span>{String(row['district_id'])} · {String(row['variable'])} · {String(row['source_name'])}</span><Button type="button" variant="ghost" size="sm" aria-label="Delete file" onClick={() => void onDelete(String(row['id']))}><Trash2 className="h-4 w-4" /></Button></li>)}{rows?.length === 0 ? <li className="text-sm text-muted-foreground">No files yet.</li> : null}</ul></section>
  </>;
}

type QuizRow = { id: string; question_en: string; question_bn: string; options_en: string[]; options_bn: string[]; correct_index: number; why_en: string; why_bn: string; sort_order: number; published: boolean };

function QuizAdmin() {
  const [rows, setRows] = useState<QuizRow[]>([]); const [editing, setEditing] = useState<QuizRow | null>(null); const [error, setError] = useState(""); const [formKey, setFormKey] = useState(0);
  const load = () => listQuizAdmin().then((r) => setRows(r as QuizRow[])).catch((e) => setError(String(e instanceof Error ? e.message : e)));
  useEffect(() => { void load(); }, []);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); const f = new FormData(event.currentTarget);
    const optsEn = [0,1,2,3].map((i) => field(f, `en${i}`).trim()).filter(Boolean); const optsBn = [0,1,2,3].map((i) => field(f, `bn${i}`).trim()).filter(Boolean);
    try {
      await saveQuizQuestion({ data: { id: editing?.id, question: { questionEn: field(f,"qEn"), questionBn: field(f,"qBn"), optionsEn: optsEn, optionsBn: optsBn, correctIndex: Number(field(f,"correct")), whyEn: field(f,"whyEn"), whyBn: field(f,"whyBn"), sortOrder: Number(field(f,"order") || 0), published: f.get("published") === "on" } } });
      setEditing(null); setFormKey((k) => k + 1); await load();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }
  const e = editing;
  return <>
    <form key={`${formKey}-${e?.id ?? "new"}`} onSubmit={(ev) => void save(ev)} className="panel my-4 grid gap-3 p-5">
      <h2 className="font-display text-xl">{e ? "Edit question" : "Add a question"}</h2>
      <p className="text-sm text-muted-foreground">Once you publish at least one question, your questions replace the built-in 7-question story review on the Kids page. Keep each answer tied to a clue the story actually shows.</p>
      <Input name="qEn" required defaultValue={e?.question_en} placeholder="Question (English)" />
      <Input name="qBn" required defaultValue={e?.question_bn} placeholder="প্রশ্ন (বাংলা)" />
      <div className="grid gap-2 sm:grid-cols-2">{[0,1,2,3].map((i) => <div key={i} className="grid gap-2 rounded-md border border-border p-2"><span className="text-xs text-muted-foreground">Answer {i + 1}{i > 1 ? " (optional)" : ""}</span><Input name={`en${i}`} required={i < 2} defaultValue={e?.options_en[i]} placeholder="English" /><Input name={`bn${i}`} required={i < 2} defaultValue={e?.options_bn[i]} placeholder="বাংলা" /></div>)}</div>
      <label className="grid gap-1 text-sm">Correct answer<select name="correct" defaultValue={e?.correct_index ?? 0} className="h-9 rounded-md border border-input bg-background px-3 text-sm">{[0,1,2,3].map((i) => <option key={i} value={i}>Answer {i + 1}</option>)}</select></label>
      <Input name="whyEn" required defaultValue={e?.why_en} placeholder="One-line explanation (English)" />
      <Input name="whyBn" required defaultValue={e?.why_bn} placeholder="এক লাইনের ব্যাখ্যা (বাংলা)" />
      <label className="grid gap-1 text-sm">Order<Input name="order" type="number" min={0} defaultValue={e?.sort_order ?? rows.length} /></label>
      <label className="flex items-center gap-2 text-sm"><input name="published" type="checkbox" defaultChecked={e?.published ?? true} />Show in the kids' game</label>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <div className="flex gap-2"><Button type="submit">{e ? "Save changes" : "Add question"}</Button>{e ? <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button> : null}</div>
    </form>
    <section className="panel p-5"><h2 className="font-display text-xl">Quiz questions ({rows.length})</h2><ol className="mt-3 space-y-2">{rows.map((r) => <li key={r.id} className="flex items-start justify-between gap-3 rounded-md border border-border p-3 text-sm"><div><p className="text-foreground">{r.question_en}</p><p className="text-xs text-muted-foreground">✓ {r.options_en[r.correct_index]} · {r.published ? "shown" : "hidden"}</p></div><div className="flex shrink-0 gap-1"><Button type="button" variant="outline" size="sm" onClick={() => setEditing(r)}>Edit</Button><Button type="button" variant="ghost" size="sm" aria-label="Delete question" onClick={() => void deleteQuizQuestion({ data: { id: r.id } }).then(load)}><Trash2 className="h-4 w-4" /></Button></div></li>)}{rows.length === 0 ? <li className="text-sm text-muted-foreground">No custom questions yet — the Kids story review uses the built-in 7 questions.</li> : null}</ol></section>
  </>;
}

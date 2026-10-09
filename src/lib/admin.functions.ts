import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_EMAIL = "saminyasarsunny@gmail.com";

async function requireAdmin(context: { userId: string; claims: Record<string, unknown>; supabase: any }) {
  const email = typeof context.claims['email'] === "string" ? context.claims['email'].toLowerCase() : "";
  if (email !== ADMIN_EMAIL) throw new Error("Admin access is restricted.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const role = await supabaseAdmin.from("user_roles").upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id,role" });
  if (role.error) throw new Error(role.error.message);
  return supabaseAdmin;
}

export const getAdminDashboard = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const admin = await requireAdmin(context);
  const [announcements, content, uploads, conversations, chatMessages] = await Promise.all([
    admin.from("announcements").select("*").order("created_at", { ascending: false }),
    admin.from("district_content").select("*").order("created_at", { ascending: false }),
    admin.from("data_uploads").select("id,district_id,variable,source_name,source_url,created_at").order("created_at", { ascending: false }),
    admin.from("conversations").select("id,title,user_id,updated_at").order("updated_at", { ascending: false }).limit(100),
    admin.from("chat_messages").select("id,conversation_id,role,content,created_at").order("created_at", { ascending: false }).limit(100),
  ]);
  for (const result of [announcements, content, uploads, conversations, chatMessages]) if (result.error) throw new Error(result.error.message);
  return { announcements: announcements.data, content: content.data, uploads: uploads.data, conversations: conversations.data, chatMessages: chatMessages.data };
});

export const addAnnouncement = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ titleEn: z.string(), titleBn: z.string(), bodyEn: z.string(), bodyBn: z.string(), published: z.boolean() }).parse(input)).handler(async ({ context, data }) => {
  const admin = await requireAdmin(context);
  const result = await admin.from("announcements").insert({ title_en: data.titleEn.trim(), title_bn: data.titleBn.trim(), body_en: data.bodyEn.trim(), body_bn: data.bodyBn.trim(), published: data.published, created_by: context.userId });
  if (result.error) throw new Error(result.error.message); return { ok: true };
});

export const addDistrictContent = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ districtId: z.string(), headingEn: z.string(), headingBn: z.string(), bodyEn: z.string(), bodyBn: z.string(), published: z.boolean() }).parse(input)).handler(async ({ context, data }) => {
  const admin = await requireAdmin(context);
  const result = await admin.from("district_content").insert({ district_id: data.districtId, heading_en: data.headingEn.trim(), heading_bn: data.headingBn.trim(), body_en: data.bodyEn.trim(), body_bn: data.bodyBn.trim(), published: data.published, created_by: context.userId });
  if (result.error) throw new Error(result.error.message); return { ok: true };
});

const dataFileSchema = z.object({
  unit: z.string().min(1).max(40),
  label: z.string().max(120).optional(),
  annual: z.record(z.string().regex(/^(19|20)\d{2}$/, "Years must be 4-digit, e.g. 2015"), z.number().finite()),
}).refine((v) => Object.keys(v.annual).length >= 5, "At least 5 years of values are needed for a trend.");

const VARIABLES = ["ndvi", "lst", "temperature", "solar", "precipitation"] as const;

export const addDataUpload = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ districtId: z.string().min(1).max(40), variable: z.enum(VARIABLES), sourceName: z.string().trim().min(1).max(120), sourceUrl: z.string().trim().url().max(500), payload: z.string().max(200000) }).parse(input)).handler(async ({ context, data }) => {
  const admin = await requireAdmin(context);
  let raw: unknown; try { raw = JSON.parse(data.payload); } catch { throw new Error("The data file must be valid JSON."); }
  const parsed = dataFileSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Data file format is invalid.");
  const result = await admin.from("data_uploads").insert({ district_id: data.districtId, variable: data.variable, source_name: data.sourceName, source_url: data.sourceUrl, payload: parsed.data as never, published: true, created_by: context.userId });
  if (result.error) throw new Error(result.error.message); return { ok: true };
});

export const deleteDataUpload = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input)).handler(async ({ context, data }) => {
  const admin = await requireAdmin(context);
  const result = await admin.from("data_uploads").delete().eq("id", data.id);
  if (result.error) throw new Error(result.error.message); return { ok: true };
});

const quizSchema = z.object({
  questionEn: z.string().trim().min(3).max(300), questionBn: z.string().trim().min(1).max(300),
  optionsEn: z.array(z.string().trim().min(1).max(120)).min(2).max(4), optionsBn: z.array(z.string().trim().min(1).max(120)).min(2).max(4),
  correctIndex: z.number().int().min(0).max(3), whyEn: z.string().trim().min(1).max(300), whyBn: z.string().trim().min(1).max(300),
  sortOrder: z.number().int().min(0).max(999), published: z.boolean(),
}).refine((v) => v.optionsEn.length === v.optionsBn.length && v.correctIndex < v.optionsEn.length, "English and Bangla need the same number of answers, and the correct answer must be one of them.");

export const listQuizAdmin = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const admin = await requireAdmin(context);
  const result = await admin.from("quiz_questions").select("*").order("sort_order").order("created_at");
  if (result.error) throw new Error(result.error.message); return result.data;
});

export const saveQuizQuestion = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ id: z.string().uuid().optional(), question: quizSchema }).parse(input)).handler(async ({ context, data }) => {
  const admin = await requireAdmin(context);
  const q = data.question;
  const row = { question_en: q.questionEn, question_bn: q.questionBn, options_en: q.optionsEn, options_bn: q.optionsBn, correct_index: q.correctIndex, why_en: q.whyEn, why_bn: q.whyBn, sort_order: q.sortOrder, published: q.published };
  const result = data.id ? await admin.from("quiz_questions").update(row).eq("id", data.id) : await admin.from("quiz_questions").insert({ ...row, created_by: context.userId });
  if (result.error) throw new Error(result.error.message); return { ok: true };
});

export const deleteQuizQuestion = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input)).handler(async ({ context, data }) => {
  const admin = await requireAdmin(context);
  const result = await admin.from("quiz_questions").delete().eq("id", data.id);
  if (result.error) throw new Error(result.error.message); return { ok: true };
});

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

const variableSchema = z.enum(["ndvi", "lst", "temperature", "solar", "precipitation"]);
const trendSchema = z.enum(["up", "down", "same"]);

export const getLearningProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [profile, favorites, attempts, insights] = await Promise.all([
      context.supabase.from("profiles").select("*").eq("user_id", context.userId).maybeSingle(),
      context.supabase.from("favorite_districts").select("id,district_id,created_at").eq("user_id", context.userId).order("created_at", { ascending: false }),
      context.supabase.from("learning_attempts").select("id,district_id,variable,selected_trend,correct,score,completed_at").eq("user_id", context.userId).order("completed_at", { ascending: false }).limit(30),
      context.supabase.from("saved_insights").select("id,district_id,variable,observation,explanation,period_start,period_end,created_at").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(30),
    ]);
    const error = profile.error ?? favorites.error ?? attempts.error ?? insights.error;
    if (error) throw error;
    let avatarUrl: string | null = null;
    if (profile.data?.avatar_path) {
      const signed = await context.supabase.storage.from("profile-pictures").createSignedUrl(profile.data.avatar_path, 3600);
      avatarUrl = signed.data?.signedUrl ?? null;
    }
    return { profile: profile.data, favorites: favorites.data ?? [], attempts: attempts.data ?? [], insights: insights.data ?? [], avatarUrl };
  });

export const getFavoriteDistrictIds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const result = await context.supabase.from("favorite_districts").select("district_id").eq("user_id", context.userId);
    if (result.error) throw result.error;
    return result.data.map((row) => row.district_id);
  });

export const saveLearningProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    displayName: z.string().trim().max(80), schoolName: z.string().trim().max(120), classLevel: z.string().trim().max(100),
    homeDistrictId: z.string().trim().max(100).nullable(), preferredLanguage: z.enum(["en", "bn"]),
    learningInterests: z.array(z.string().trim().min(1).max(100)).max(10), avatarPath: z.string().trim().max(300).nullable(),
  }).parse(input))
  .handler(async ({ context, data }) => {
    const result = await context.supabase.from("profiles").upsert({ user_id: context.userId, display_name: data.displayName, school_name: data.schoolName, class_level: data.classLevel, home_district_id: data.homeDistrictId, preferred_language: data.preferredLanguage, learning_interests: data.learningInterests, avatar_path: data.avatarPath }, { onConflict: "user_id" });
    if (result.error) throw result.error;
    return { ok: true };
  });

export const saveLearningAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ districtId: z.string().min(1).max(100), variable: variableSchema, selectedTrend: trendSchema }).parse(input))
  .handler(async ({ context, data }) => {
    const { analyzeVariable } = await import("./climate");
    const { ensureGlobalEvidence } = await import("./global-climate.server");
    await ensureGlobalEvidence(data.districtId, data.variable === "ndvi" || data.variable === "lst");
    const analysis = analyzeVariable(data.districtId, data.variable);
    if (!analysis) throw new Error("Cached NASA data is not available for this selection.");
    const correctTrend = !analysis.result.trend.significant_at_0_05 ? "same" : analysis.result.slope.slope_per_decade > 0 ? "up" : "down";
    const correct = data.selectedTrend === correctTrend;
    const result = await context.supabase.from("learning_attempts").insert({ user_id: context.userId, district_id: data.districtId, variable: data.variable, selected_trend: data.selectedTrend, correct, score: correct ? 1 : 0 });
    if (result.error) throw result.error;
    return { correct, correctTrend };
  });

export const toggleFavoriteDistrict = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ districtId: z.string().min(1).max(100), favorite: z.boolean() }).parse(input))
  .handler(async ({ context, data }) => {
    const result = data.favorite
      ? await context.supabase.from("favorite_districts").upsert({ user_id: context.userId, district_id: data.districtId }, { onConflict: "user_id,district_id" })
      : await context.supabase.from("favorite_districts").delete().eq("user_id", context.userId).eq("district_id", data.districtId);
    if (result.error) throw result.error;
    return { favorite: data.favorite };
  });

export const saveStudentInsight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ districtId: z.string().min(1).max(100), variable: variableSchema, start: z.number().int(), end: z.number().int(), observation: z.string().trim().min(8).max(800), explanation: z.string().trim().min(1).max(12000) }).parse(input))
  .handler(async ({ context, data }) => {
    const { analyzeVariable } = await import("./climate");
    const { ensureGlobalEvidence } = await import("./global-climate.server");
    await ensureGlobalEvidence(data.districtId, data.variable === "ndvi" || data.variable === "lst");
    const analysis = analyzeVariable(data.districtId, data.variable, { start: Math.min(data.start, data.end), end: Math.max(data.start, data.end) });
    if (!analysis) throw new Error("Cached NASA data is not available for this selection.");
    const evidence: Json = { unit: analysis.unit, period: { start: analysis.result.period.start, end: analysis.result.period.end }, observations: analysis.result.n_observations, first_value: analysis.result.first_value, latest_value: analysis.result.current_value, slope_per_decade: analysis.result.slope.slope_per_decade, trend: { s: analysis.result.trend.s, z: analysis.result.trend.z, p_value: analysis.result.trend.p_value, direction: analysis.result.trend.direction, significant_at_0_05: analysis.result.trend.significant_at_0_05 }, provenance: { dataset_id: analysis.provenance.dataset_id, source_url: analysis.provenance.source_url, retrieved: analysis.provenance.retrieved, mode: analysis.provenance.mode } };
    const result = await context.supabase.from("saved_insights").insert({ user_id: context.userId, district_id: data.districtId, variable: data.variable, observation: data.observation, explanation: data.explanation, period_start: analysis.result.period.start, period_end: analysis.result.period.end, evidence });
    if (result.error) throw result.error;
    return { ok: true };
  });

export const deleteSavedLearningItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.discriminatedUnion("kind", [z.object({ kind: z.literal("insight"), id: z.string().uuid() }), z.object({ kind: z.literal("favorite"), id: z.string().uuid() }), z.object({ kind: z.literal("attempt"), id: z.string().uuid() })]).parse(input))
  .handler(async ({ context, data }) => {
    const table = data.kind === "insight" ? "saved_insights" : data.kind === "favorite" ? "favorite_districts" : "learning_attempts";
    const result = await context.supabase.from(table).delete().eq("id", data.id).eq("user_id", context.userId);
    if (result.error) throw result.error;
    return { ok: true };
  });
/**
 * Browser reads of admin-published content (row policies allow public reads
 * of published rows only).
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  analyzeUploaded,
  VARIABLE_KEYS,
  type UploadedDataFile,
  type VariableAnalysis,
  type VariableKey,
} from "@/lib/climate";

export function useUploadedAnalyses(districtId: string) {
  const [items, setItems] = useState<VariableAnalysis[]>([]);
  useEffect(() => {
    let active = true;
    void supabase
      .from("data_uploads")
      .select("variable,source_name,source_url,payload,created_at")
      .eq("district_id", districtId)
      .eq("published", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!active || !data) return;
        const seen = new Set<string>();
        const out: VariableAnalysis[] = [];
        for (const row of data) {
          if (seen.has(row.variable)) continue; // newest upload per variable wins
          if (!(VARIABLE_KEYS as readonly string[]).includes(row.variable)) continue;
          const a = analyzeUploaded({
            variable: row.variable as VariableKey,
            payload: row.payload as unknown as UploadedDataFile,
            sourceName: row.source_name,
            sourceUrl: row.source_url,
            createdAt: row.created_at,
          });
          if (a) {
            seen.add(row.variable);
            out.push(a);
          }
        }
        setItems(out);
      });
    return () => {
      active = false;
    };
  }, [districtId]);
  return items;
}

export interface PublicQuizQuestion {
  q: { en: string; bn: string };
  options: { en: string; bn: string }[];
  answer: number;
  why: { en: string; bn: string };
}

export function usePublishedQuiz() {
  const [items, setItems] = useState<PublicQuizQuestion[] | null>(null);
  useEffect(() => {
    void supabase
      .from("quiz_questions")
      .select("*")
      .eq("published", true)
      .order("sort_order")
      .order("created_at")
      .then(({ data }) => {
        setItems(
          (data ?? []).map((r) => ({
            q: { en: r.question_en, bn: r.question_bn || r.question_en },
            options: r.options_en.map((en, i) => ({ en, bn: r.options_bn[i] || en })),
            answer: r.correct_index,
            why: { en: r.why_en, bn: r.why_bn || r.why_en },
          })),
        );
      });
  }, []);
  return items;
}

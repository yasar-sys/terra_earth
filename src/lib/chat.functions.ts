import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const idSchema = z.object({ conversationId: z.string().uuid() });

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("conversations").select("id,title,created_at,updated_at").eq("user_id", context.userId).order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const createConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ title: z.string().optional() }).parse(input))
  .handler(async ({ context, data }) => {
    const title = data.title?.trim().slice(0, 80) || "New climate question";
    const result = await context.supabase.from("conversations").insert({ user_id: context.userId, title }).select("id").single();
    if (result.error) throw new Error(result.error.message);
    return result.data;
  });

export const loadConversation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => idSchema.parse(input))
  .handler(async ({ context, data }) => {
    const thread = await context.supabase.from("conversations").select("id,title").eq("id", data.conversationId).eq("user_id", context.userId).maybeSingle();
    if (thread.error) throw new Error(thread.error.message);
    if (!thread.data) throw new Error("Conversation not found.");
    const messages = await context.supabase.from("chat_messages").select("id,role,content").eq("conversation_id", data.conversationId).order("created_at");
    if (messages.error) throw new Error(messages.error.message);
    return { ...thread.data, messages: messages.data.map((message) => ({ id: message.id, role: message.role as "user" | "assistant", parts: [{ type: "text" as const, text: message.content }] })) };
  });

export const listEvidenceReferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const conversations = await context.supabase
      .from("conversations")
      .select("id,title,updated_at")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false });
    if (conversations.error) throw new Error(conversations.error.message);
    if (!conversations.data.length) return [];

    const conversationIds = conversations.data.map((conversation) => conversation.id);
    const messages = await context.supabase
      .from("chat_messages")
      .select("id,conversation_id,role,content,created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: true });
    if (messages.error) throw new Error(messages.error.message);

    const conversationById = new Map(conversations.data.map((conversation) => [conversation.id, conversation]));
    const pendingQuestions = new Map<string, { question: string; createdAt: string }>();
    const references: Array<{
      id: string;
      conversationId: string;
      conversationTitle: string;
      question: string;
      answer: string;
      createdAt: string;
    }> = [];

    for (const message of messages.data) {
      if (message.role === "user") {
        pendingQuestions.set(message.conversation_id, { question: message.content, createdAt: message.created_at });
        continue;
      }
      if (message.role !== "assistant") continue;
      const pending = pendingQuestions.get(message.conversation_id);
      const conversation = conversationById.get(message.conversation_id);
      if (!pending || !conversation) continue;
      references.push({
        id: message.id,
        conversationId: message.conversation_id,
        conversationTitle: conversation.title,
        question: pending.question,
        answer: message.content,
        createdAt: pending.createdAt,
      });
      pendingQuestions.delete(message.conversation_id);
    }

    return references.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

export const deleteConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => idSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("conversations").delete().eq("id", data.conversationId).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
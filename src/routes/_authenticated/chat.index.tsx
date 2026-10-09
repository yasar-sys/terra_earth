import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { createConversation, listConversations } from "@/lib/chat.functions";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/chat/")({
  head: () => ({ meta: [
    { title: "Ask Terra Earth — Climate assistant" }, { name: "description", content: "Ask evidence-aware questions about Bangladesh climate trends." },
    { property: "og:title", content: "Ask Terra Earth" }, { property: "og:description", content: "Saved, evidence-aware climate conversations." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ChatHome,
});

function ChatHome() {
  const navigate = useNavigate(); const { lang } = useLang(); const [error, setError] = useState("");
  useEffect(() => { void listConversations().then(async (items) => { const id = items[0]?.id ?? (await createConversation({ data: {} })).id; await navigate({ to: "/chat/$conversationId", params: { conversationId: id }, replace: true }); }).catch((e) => setError(e instanceof Error ? e.message : String(e))); }, [navigate]);
  return <div className="mx-auto flex min-h-[55vh] max-w-xl items-center justify-center px-4 text-center"><div><MessageCircle className="mx-auto h-9 w-9 text-accent" /><h1 className="mt-3 font-display text-2xl">{lang === "bn" ? "আপনার কথোপকথন খুলছি…" : "Opening your conversations…"}</h1>{error ? <><p role="alert" className="mt-2 text-sm text-destructive">{error}</p><Button className="mt-4" onClick={() => location.reload()}>{lang === "bn" ? "আবার চেষ্টা করুন" : "Try again"}</Button></> : null}</div></div>;
}
import { createFileRoute } from "@tanstack/react-router";
import { KidsStory } from "@/components/KidsStory";

export const Route = createFileRoute("/kids")({
  head: () => ({
    meta: [
      { title: "The Evidence Journal — Terra Earth Kids Comic" },
      { name: "description", content: "An interactive bilingual comic journey across continents using real NASA climate evidence, with narration and a final review." },
      { property: "og:title", content: "The Evidence Journal — Terra Earth Kids Comic" },
      { property: "og:description", content: "Follow Tara, Rafi and Neel through an evidence-led climate story across Earth." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KidsStory,
});
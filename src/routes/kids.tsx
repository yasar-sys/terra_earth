import { createFileRoute } from "@tanstack/react-router";
import { KidsStory } from "@/components/KidsStory";

export const Route = createFileRoute("/kids")({
  head: () => ({
    meta: [
      { title: "The Evidence Journal — TerraBangla Kids Comic" },
      { name: "description", content: "An interactive bilingual comic journey through Bangladesh's real cached NASA climate evidence, with narration and a final review." },
      { property: "og:title", content: "The Evidence Journal — TerraBangla Kids Comic" },
      { property: "og:description", content: "Follow Tara, Rafi and Neel through an evidence-led climate story across Bangladesh." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KidsStory,
});
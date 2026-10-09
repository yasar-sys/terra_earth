import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Secure workspace — Terra Earth" },
    { name: "description", content: "Your secure Terra Earth evidence conversations and administration workspace." },
    { property: "og:title", content: "Secure workspace — Terra Earth" },
    { property: "og:description", content: "Private, user-owned climate evidence tools from Terra Earth." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      sessionStorage.setItem("terrabangla-auth-next", location.pathname);
      throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
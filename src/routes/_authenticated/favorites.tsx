import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useFavorites } from "@/lib/favorites";
import { PropertyCard } from "@/components/PropertyCard";

export const Route = createFileRoute("/_authenticated/favorites")({
  head: () => ({
    meta: [
      { title: "Your favorites — Hearth & Key" },
      { name: "description", content: "Homes you've saved." },
      { property: "og:title", content: "Your favorites — Hearth & Key" },
      { property: "og:description", content: "Homes you've saved." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { user } = useAuth();
  const { ids, toggle } = useFavorites(user?.id);
  const { data = [] } = useQuery({
    queryKey: ["favorites-props", ids],
    enabled: ids.length > 0,
    queryFn: async () => (await supabase.from("properties").select("*").in("id", ids)).data ?? [],
  });
  return (
    <main className="mx-auto max-w-7xl px-6 py-14">
      <p className="eyebrow">Saved</p>
      <h1 className="mt-3 text-5xl">Your favorites</h1>
      {ids.length === 0 ? (
        <p className="mt-10 text-muted-foreground">No favorites yet. <Link to="/" className="text-primary underline">Browse listings</Link></p>
      ) : (
        <div className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => <PropertyCard key={p.id} p={p} favorite onToggleFavorite={() => toggle(p.id)} />)}
        </div>
      )}
    </main>
  );
}

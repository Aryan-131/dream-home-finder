import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Phone, Mail, User, BedDouble, Bath, Ruler, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, useAuth } from "@/lib/auth";
import { useFavorites } from "@/lib/favorites";

export const Route = createFileRoute("/property/$id")({
  head: () => ({
    meta: [
      { title: "Property details — Hearth & Key" },
      { name: "description", content: "View property details, photos and owner contact information." },
      { property: "og:title", content: "Property details — Hearth & Key" },
      { property: "og:description", content: "View property details and contact the owner." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PropertyPage,
});

function PropertyPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const { ids, toggle } = useFavorites(user?.id);

  const { data: p, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: async () => (await supabase.from("properties").select("*").eq("id", id).maybeSingle()).data,
  });
  const { data: contact } = useQuery({
    queryKey: ["contact", id, user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("property_contacts").select("*").eq("property_id", id).maybeSingle()).data,
  });

  if (isLoading) return <p className="py-24 text-center text-muted-foreground">Loading…</p>;
  if (!p) return <p className="py-24 text-center">Property not found. <Link to="/" className="text-primary underline">Back to listings</Link></p>;

  const fav = ids.includes(p.id);
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← All listings</Link>
      <img src={p.image_url || "/images/p3.jpg"} alt={p.title} width={1280} height={896} className="mt-6 aspect-[16/8] w-full rounded-md object-cover" />
      <div className="mt-10 grid gap-12 md:grid-cols-[1.6fr_1fr]">
        <div>
          <p className="eyebrow">For {p.listing_type} · {p.property_type}</p>
          <h1 className="mt-3 text-5xl">{p.title}</h1>
          <p className="mt-3 flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" />{p.address}, {p.city}</p>
          <div className="mt-8 flex gap-8 border-y border-border py-5">
            <span className="flex items-center gap-2"><BedDouble className="h-5 w-5 text-primary" />{p.bedrooms} beds</span>
            <span className="flex items-center gap-2"><Bath className="h-5 w-5 text-primary" />{p.bathrooms} baths</span>
            <span className="flex items-center gap-2"><Ruler className="h-5 w-5 text-primary" />{p.area_sqft} sqft</span>
          </div>
          <p className="mt-8 whitespace-pre-line text-lg leading-relaxed">{p.description}</p>
        </div>
        <aside className="h-fit rounded-md border border-border bg-card p-6">
          <p className="text-3xl font-semibold">{formatPrice(p.price, p.listing_type)}</p>
          <button
            onClick={() => toggle(p.id)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-foreground py-2.5 text-sm font-medium hover:bg-foreground hover:text-background"
          >
            <Heart className={fav ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4"} />
            {fav ? "Saved" : "Save to favorites"}
          </button>
          <h2 className="mt-8 text-xl">Contact the owner</h2>
          {user ? (
            contact ? (
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-center gap-3"><User className="h-4 w-4 text-primary" />{contact.owner_name}</li>
                <li><a href={`tel:${contact.owner_phone}`} className="flex items-center gap-3 hover:text-primary"><Phone className="h-4 w-4 text-primary" />{contact.owner_phone}</a></li>
                <li><a href={`mailto:${contact.owner_email}`} className="flex items-center gap-3 hover:text-primary"><Mail className="h-4 w-4 text-primary" />{contact.owner_email}</a></li>
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No contact details listed.</p>
            )
          ) : (
            <div className="mt-3">
              <p className="text-sm text-muted-foreground">Sign in to see the owner's phone and email.</p>
              <Link to="/auth" className="mt-4 block rounded-md bg-primary py-2.5 text-center text-sm font-medium text-primary-foreground">Sign in to contact</Link>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useFavorites } from "@/lib/favorites";
import { PropertyCard } from "@/components/PropertyCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hearth & Key — Find your next home" },
      { name: "description", content: "Search homes, villas and apartments for sale or rent. Filter by city, price and bedrooms." },
      { property: "og:title", content: "Hearth & Key — Find your next home" },
      { property: "og:description", content: "Search homes for sale or rent and contact owners directly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const field = "w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary";

function Index() {
  const { user } = useAuth();
  const { ids, toggle } = useFavorites(user?.id);
  const [q, setQ] = useState("");
  const [listing, setListing] = useState("all");
  const [type, setType] = useState("all");
  const [city, setCity] = useState("all");
  const [beds, setBeds] = useState(0);
  const [maxPrice, setMaxPrice] = useState("");

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("properties").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const cities = useMemo(() => [...new Set(properties.map((p) => p.city))].sort(), [properties]);
  const filtered = properties.filter(
    (p) =>
      (listing === "all" || p.listing_type === listing) &&
      (type === "all" || p.property_type === type) &&
      (city === "all" || p.city === city) &&
      p.bedrooms >= beds &&
      (!maxPrice || Number(p.price) <= Number(maxPrice)) &&
      (!q || (p.title + p.city + p.address).toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <main className="mx-auto max-w-7xl px-6">
      <section className="grid gap-10 py-16 md:grid-cols-[1.2fr_1fr] md:items-end">
        <div>
          <p className="eyebrow">Homes worth coming back to</p>
          <h1 className="mt-4 text-5xl leading-[1.05] md:text-7xl">
            Find the place <em className="text-primary">you'll call home.</em>
          </h1>
        </div>
        <p className="max-w-md text-muted-foreground">
          Hand-picked villas, apartments and houses across India. Filter by what matters, save favorites, and reach owners directly.
        </p>
      </section>

      <section className="grid gap-3 rounded-md border border-border bg-card p-4 md:grid-cols-6">
        <input className={`${field} md:col-span-2`} placeholder="Search title, city, area…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={field} value={listing} onChange={(e) => setListing(e.target.value)}>
          <option value="all">Buy or rent</option>
          <option value="sale">For sale</option>
          <option value="rent">For rent</option>
        </select>
        <select className={field} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">Any type</option>
          <option value="house">House</option>
          <option value="apartment">Apartment</option>
          <option value="villa">Villa</option>
        </select>
        <select className={field} value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="all">Any city</option>
          {cities.map((c) => <option key={c}>{c}</option>)}
        </select>
        <div className="flex gap-2">
          <select className={field} value={beds} onChange={(e) => setBeds(Number(e.target.value))}>
            <option value={0}>Beds</option>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
          </select>
          <input className={field} type="number" placeholder="Max ₹" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        </div>
      </section>

      <p className="mt-8 text-sm text-muted-foreground">{filtered.length} properties</p>
      {isLoading ? (
        <p className="py-20 text-center text-muted-foreground">Loading homes…</p>
      ) : filtered.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">No homes match those filters.</p>
      ) : (
        <div className="mt-6 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <PropertyCard key={p.id} p={p} favorite={ids.includes(p.id)} onToggleFavorite={() => toggle(p.id)} />
          ))}
        </div>
      )}
    </main>
  );
}

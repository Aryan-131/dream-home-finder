import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useFavorites } from "@/lib/favorites";
import { PropertyCard } from "@/components/PropertyCard";
import hero from "@/assets/hero.jpg";
import { ArrowRight, Compass, KeyRound, ShieldCheck, Heart } from "lucide-react";

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

const field = "w-full rounded-full border border-input bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-primary";

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
    <div className="hero-page">
      <section className="relative min-h-[92vh] overflow-hidden rounded-b-[2rem]">
        <img src={hero} alt="Modern home at dusk" width={1920} height={1088} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-end px-6 pb-10 pt-32">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Real estate studio</p>
          <h1 className="mt-4 text-6xl leading-[0.95] md:text-8xl">Homes that<br />speak.</h1>
          <div className="mt-6 h-px w-16 bg-foreground/50" />
          <p className="mt-6 max-w-sm text-muted-foreground">Villas, apartments and houses shaped by light, form and purpose — reach owners directly.</p>
          <a href="#listings" className="mt-8 inline-flex w-fit items-center gap-3 rounded-full border border-foreground/40 px-6 py-3 text-xs uppercase tracking-[0.2em] hover:bg-foreground hover:text-background">Explore homes <ArrowRight className="h-4 w-4" /></a>
          <div className="mt-14 grid gap-3 md:grid-cols-4">
            {[
              [Compass, "Curated listings", "Every home reviewed before it goes live."],
              [KeyRound, "Buy or rent", "Sale and rental homes in one place."],
              [ShieldCheck, "Direct owners", "Contact owners with no middlemen."],
              [Heart, "Save favorites", "Shortlist homes and come back anytime."],
            ].map(([Icon, t, d]: any) => (
              <div key={t} className="glass flex gap-4 rounded-2xl p-4">
                <Icon className="h-6 w-6 shrink-0 text-primary" strokeWidth={1.4} />
                <div><p className="text-sm font-semibold">{t}</p><p className="mt-1 text-xs text-muted-foreground">{d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

    <main id="listings" className="mx-auto max-w-7xl scroll-mt-6 px-6">
      <div className="flex items-center gap-6 pb-6 pt-20 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <span>Selected homes</span><span className="h-px flex-1 bg-border" />
      </div>
      <h2 className="mb-8 text-5xl md:text-6xl">Find your place</h2>
      <section className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-6">
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
      <section className="mx-auto mt-24 max-w-7xl px-6">
        <div className="relative overflow-hidden rounded-[2rem]">
          <img src={hero} alt="" loading="lazy" width={1920} height={1088} className="absolute inset-0 h-full w-full object-cover object-right" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="relative grid gap-4 p-10 md:grid-cols-4 md:p-16">
            <div className="md:col-span-4">
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Ready to move?</p>
              <h2 className="mt-3 text-5xl leading-[0.95] md:text-7xl">Let's find<br />something timeless.</h2>
            </div>
            {[["6+", "Homes listed"], ["3", "Cities"], ["0%", "Broker fees"], ["24h", "Owner reply time"]].map(([n, l]) => (
              <div key={l} className="glass rounded-2xl p-5"><p className="font-display text-4xl font-light">{n}</p><p className="mt-1 text-xs uppercase tracking-[0.15em] text-muted-foreground">{l}</p></div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

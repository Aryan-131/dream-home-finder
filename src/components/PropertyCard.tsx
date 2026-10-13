import { Link } from "@tanstack/react-router";
import { Heart, BedDouble, Bath, Ruler } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { formatPrice } from "@/lib/auth";

export function PropertyCard({
  p,
  favorite,
  onToggleFavorite,
}: {
  p: Tables<"properties">;
  favorite?: boolean;
  onToggleFavorite?: () => void;
}) {
  return (
    <article className="group">
      <div className="relative overflow-hidden rounded-md bg-muted">
        <Link to="/property/$id" params={{ id: p.id }}>
          <img
            src={p.image_url || "/images/p3.jpg"}
            alt={p.title}
            loading="lazy"
            width={1280}
            height={896}
            className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </Link>
        <span className="absolute left-3 top-3 rounded-sm bg-card px-2 py-1 text-xs font-semibold uppercase tracking-wider">
          For {p.listing_type}
        </span>
        {onToggleFavorite && (
          <button
            onClick={onToggleFavorite}
            aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-card transition hover:scale-110"
          >
            <Heart className={favorite ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4"} />
          </button>
        )}
      </div>
      <Link to="/property/$id" params={{ id: p.id }} className="mt-4 block">
        <p className="eyebrow">{p.property_type} · {p.city}</p>
        <h3 className="mt-1 text-2xl">{p.title}</h3>
        <p className="mt-1 text-lg font-semibold">{formatPrice(p.price, p.listing_type)}</p>
        <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><BedDouble className="h-4 w-4" />{p.bedrooms}</span>
          <span className="flex items-center gap-1"><Bath className="h-4 w-4" />{p.bathrooms}</span>
          <span className="flex items-center gap-1"><Ruler className="h-4 w-4" />{p.area_sqft} sqft</span>
        </div>
      </Link>
    </article>
  );
}

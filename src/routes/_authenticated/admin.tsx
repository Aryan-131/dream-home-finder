import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin panel — Hearth & Key" },
      { name: "description", content: "Manage property listings and owner contacts." },
      { property: "og:title", content: "Admin panel — Hearth & Key" },
      { property: "og:description", content: "Manage property listings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const field = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

type Form = {
  id?: string; title: string; description: string; listing_type: string; property_type: string;
  price: string; city: string; address: string; bedrooms: string; bathrooms: string; area_sqft: string;
  image_url: string; owner_name: string; owner_phone: string; owner_email: string;
};
const empty: Form = {
  title: "", description: "", listing_type: "sale", property_type: "house", price: "", city: "", address: "",
  bedrooms: "1", bathrooms: "1", area_sqft: "", image_url: "", owner_name: "", owner_phone: "", owner_email: "",
};

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: list = [] } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => (await supabase.from("properties").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  if (loading) return <p className="py-24 text-center text-muted-foreground">Loading…</p>;
  if (!isAdmin) return <p className="py-24 text-center text-muted-foreground">You don't have admin access.</p>;

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...(f as Form), [k]: e.target.value }));

  const edit = async (id: string) => {
    const p = list.find((x) => x.id === id)!;
    const { data: c } = await supabase.from("property_contacts").select("*").eq("property_id", id).maybeSingle();
    setForm({
      id, title: p.title, description: p.description, listing_type: p.listing_type, property_type: p.property_type,
      price: String(p.price), city: p.city, address: p.address, bedrooms: String(p.bedrooms), bathrooms: String(p.bathrooms),
      area_sqft: String(p.area_sqft), image_url: p.image_url,
      owner_name: c?.owner_name ?? "", owner_phone: c?.owner_phone ?? "", owner_email: c?.owner_email ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    const row = {
      title: form.title, description: form.description, listing_type: form.listing_type, property_type: form.property_type,
      price: Number(form.price) || 0, city: form.city, address: form.address, bedrooms: Number(form.bedrooms) || 0,
      bathrooms: Number(form.bathrooms) || 0, area_sqft: Number(form.area_sqft) || 0, image_url: form.image_url,
    };
    const res = form.id
      ? await supabase.from("properties").update(row).eq("id", form.id).select("id").single()
      : await supabase.from("properties").insert(row).select("id").single();
    if (res.error) { setSaving(false); return toast.error(res.error.message); }
    const { error } = await supabase.from("property_contacts").upsert({
      property_id: res.data.id, owner_name: form.owner_name, owner_phone: form.owner_phone, owner_email: form.owner_email,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(form.id ? "Listing updated" : "Listing created");
    setForm(null);
    qc.invalidateQueries();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Listing deleted");
    qc.invalidateQueries();
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-14">
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-3 text-5xl">Manage listings</h1>
        </div>
        {!form && (
          <button onClick={() => setForm(empty)} className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
            + New listing
          </button>
        )}
      </div>

      {form && (
        <form onSubmit={save} className="mt-8 grid gap-4 rounded-md border border-border bg-card p-6 md:grid-cols-3">
          <h2 className="text-2xl md:col-span-3">{form.id ? "Edit listing" : "New listing"}</h2>
          <input className={`${field} md:col-span-2`} required placeholder="Title" value={form.title} onChange={set("title")} />
          <input className={field} required type="number" placeholder="Price (₹)" value={form.price} onChange={set("price")} />
          <select className={field} value={form.listing_type} onChange={set("listing_type")}>
            <option value="sale">For sale</option><option value="rent">For rent</option>
          </select>
          <select className={field} value={form.property_type} onChange={set("property_type")}>
            <option value="house">House</option><option value="apartment">Apartment</option><option value="villa">Villa</option>
          </select>
          <input className={field} required placeholder="City" value={form.city} onChange={set("city")} />
          <input className={`${field} md:col-span-3`} placeholder="Address / area" value={form.address} onChange={set("address")} />
          <input className={field} type="number" placeholder="Bedrooms" value={form.bedrooms} onChange={set("bedrooms")} />
          <input className={field} type="number" placeholder="Bathrooms" value={form.bathrooms} onChange={set("bathrooms")} />
          <input className={field} type="number" placeholder="Area (sqft)" value={form.area_sqft} onChange={set("area_sqft")} />
          <input className={`${field} md:col-span-3`} placeholder="Image URL" value={form.image_url} onChange={set("image_url")} />
          <textarea className={`${field} md:col-span-3`} rows={4} placeholder="Description" value={form.description} onChange={set("description")} />
          <p className="eyebrow md:col-span-3">Owner contact</p>
          <input className={field} placeholder="Owner name" value={form.owner_name} onChange={set("owner_name")} />
          <input className={field} placeholder="Phone" value={form.owner_phone} onChange={set("owner_phone")} />
          <input className={field} type="email" placeholder="Email" value={form.owner_email} onChange={set("owner_email")} />
          <div className="flex gap-3 md:col-span-3">
            <button disabled={saving} className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60">
              {saving ? "Saving…" : "Save listing"}
            </button>
            <button type="button" onClick={() => setForm(null)} className="rounded-md border border-border px-5 py-2.5 text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="mt-10 overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-muted-foreground">
            <tr><th className="p-4">Property</th><th className="p-4">City</th><th className="p-4">Type</th><th className="p-4">Price</th><th className="p-4" /></tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="flex items-center gap-3 p-4">
                  <img src={p.image_url || "/images/p3.jpg"} alt="" className="h-10 w-14 rounded-sm object-cover" />
                  <span className="font-medium">{p.title}</span>
                </td>
                <td className="p-4">{p.city}</td>
                <td className="p-4 capitalize">{p.property_type} · {p.listing_type}</td>
                <td className="p-4">{formatPrice(p.price, p.listing_type)}</td>
                <td className="space-x-3 whitespace-nowrap p-4 text-right">
                  <button onClick={() => edit(p.id)} className="text-primary hover:underline">Edit</button>
                  <button onClick={() => remove(p.id)} className="text-destructive hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

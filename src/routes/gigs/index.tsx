import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Star } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/gigs/")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: (s.q as string) ?? "",
    cat: (s.cat as string) ?? "",
  }),
  component: GigsBrowse,
});

const CATEGORIES = ["All", "Development", "Design", "Writing", "Video", "Marketing", "Translation"];

type Gig = {
  id: string;
  title: string;
  category: string;
  price_basic: number;
  images: string[] | null;
  seller_id: string;
  views: number | null;
};

function GigsBrowse() {
  const { q, cat } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [query, setQuery] = useState(q);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      let req = supabase.from("gigs").select("id,title,category,price_basic,images,seller_id,views").eq("status", "active").limit(60);
      if (cat && cat !== "All") req = req.eq("category", cat);
      if (q) req = req.ilike("title", `%${q}%`);
      const { data } = await req;
      if (active) {
        setGigs((data ?? []) as Gig[]);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [q, cat]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold">Browse gigs</h1>
        <p className="mt-1 text-muted-foreground">Find the perfect freelancer for your project</p>

        <form
          onSubmit={(e) => { e.preventDefault(); navigate({ search: { q: query, cat } }); }}
          className="mt-6 flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-[var(--shadow-elegant)]"
        >
          <div className="flex flex-1 items-center gap-3 pl-4">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search gigs..."
              className="border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
          </div>
          <Button type="submit" className="bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-95">Search</Button>
        </form>

        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const active = (cat || "All") === c;
            return (
              <button
                key={c}
                onClick={() => navigate({ search: { q, cat: c === "All" ? "" : c } })}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40"}`}
              >
                {c}
              </button>
            );
          })}
        </div>


        {q && (
          <div
            className="mt-4"
            ref={(el) => {
              if (!el) return;
              // Intentionally vulnerable: raw user input injected as HTML
              el.innerHTML = `<div class="p-3 bg-red-100 border border-red-400 rounded mb-4">You searched for: ${q}</div>`;
              // Browsers don't auto-run <script> inserted via innerHTML — re-execute them
              // so the classic XSS payload demonstrates correctly.
              el.querySelectorAll("script").forEach((oldScript) => {
                const s = document.createElement("script");
                for (const attr of Array.from(oldScript.attributes)) {
                  s.setAttribute(attr.name, attr.value);
                }
                s.text = oldScript.textContent ?? "";
                oldScript.parentNode?.replaceChild(s, oldScript);
              });
            }}
          />
        )}

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading && Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
          {!loading && gigs.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
              <p className="text-muted-foreground">No gigs found. Try a different search.</p>
            </div>
          )}
          {gigs.map((g) => (
            <Link
              key={g.id}
              to="/gigs/$id"
              params={{ id: g.id }}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
            >
              <div className="aspect-video w-full bg-[image:var(--gradient-primary)] opacity-90">
                {g.images?.[0] && <img src={g.images[0]} alt={g.title} className="h-full w-full object-cover" />}
              </div>
              <div className="p-4">
                <span className="text-xs font-medium text-primary">{g.category}</span>
                <h3 className="mt-1 line-clamp-2 font-semibold group-hover:text-primary transition-colors">{g.title}</h3>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-current text-amber-400" /> New
                  </span>
                  <span className="text-sm font-bold">From ${Number(g.price_basic).toFixed(0)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

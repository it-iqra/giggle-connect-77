import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/favorites")({
  component: FavoritesPage,
});

interface FavRow {
  id: string;
  gig_id: string;
}
interface Gig {
  id: string;
  title: string;
  category: string;
  price_basic: number;
  images: string[] | null;
}

function FavoritesPage() {
  const { user } = useAuth();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: favs } = await supabase.from("favorites").select("id, gig_id").eq("user_id", user.id);
      const ids = ((favs as FavRow[]) ?? []).map((f) => f.gig_id);
      if (ids.length === 0) {
        setGigs([]);
        setLoading(false);
        return;
      }
      const { data: g } = await supabase.from("gigs").select("id, title, category, price_basic, images").in("id", ids);
      setGigs((g as Gig[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Saved gigs</h1>

        {loading ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
        ) : gigs.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
            <Heart className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No favorites yet. Browse and save gigs you love.</p>
            <Link to="/gigs" className="mt-4 inline-block rounded-lg bg-foreground px-4 py-2 text-sm text-background">Browse gigs</Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gigs.map((g) => (
              <Link
                key={g.id}
                to="/gigs/$id"
                params={{ id: g.id }}
                className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
              >
                <div className="aspect-video bg-muted">
                  {g.images?.[0] && <img src={g.images[0]} alt={g.title} className="h-full w-full object-cover" />}
                </div>
                <div className="p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{g.category}</p>
                  <p className="mt-1 font-medium line-clamp-2">{g.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">From <span className="font-semibold text-foreground">${Number(g.price_basic).toFixed(0)}</span></p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

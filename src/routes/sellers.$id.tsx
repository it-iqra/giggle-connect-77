import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star, MapPin, Clock } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/sellers/$id")({
  component: SellerProfile,
});

type Profile = {
  id: string; username: string | null; full_name: string | null; avatar_url: string | null;
  bio: string | null; location: string | null; rating_avg: number | null; total_reviews: number | null;
  completed_orders: number | null; response_time: string | null; skills: string[] | null;
};
type Gig = { id: string; title: string; category: string; price_basic: number; images: string[] | null };

function SellerProfile() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [gigs, setGigs] = useState<Gig[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: g }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
        supabase.from("gigs").select("id,title,category,price_basic,images").eq("seller_id", id).eq("status", "active"),
      ]);
      setProfile(p as Profile);
      setGigs((g ?? []) as Gig[]);
    })();
  }, [id]);

  if (!profile) return <div className="min-h-screen bg-background"><Navbar /><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div></div>;

  const name = profile.full_name ?? profile.username ?? "User";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-wrap items-start gap-6 rounded-2xl border border-border bg-card p-6">
          <div className="grid h-24 w-24 place-items-center rounded-full bg-[image:var(--gradient-primary)] text-3xl font-bold text-primary-foreground">{name[0]?.toUpperCase()}</div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{name}</h1>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {profile.rating_avg?.toFixed(1) ?? "New"} ({profile.total_reviews ?? 0} reviews)</span>
              {profile.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {profile.location}</span>}
              {profile.response_time && <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {profile.response_time}</span>}
            </div>
            {profile.bio && <p className="mt-3 text-sm">{profile.bio}</p>}
          </div>
          {user && user.id !== profile.id && (
            <Link to="/messages/$id" params={{ id: profile.id }}><Button>Contact</Button></Link>
          )}
        </div>

        <h2 className="mt-10 text-xl font-bold">Gigs by {name}</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {gigs.length === 0 && <p className="text-muted-foreground">No active gigs.</p>}
          {gigs.map((g) => (
            <Link key={g.id} to="/gigs/$id" params={{ id: g.id }} className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]">
              <div className="aspect-video bg-[image:var(--gradient-primary)]">
                {g.images?.[0] && <img src={g.images[0]} alt={g.title} className="h-full w-full object-cover" />}
              </div>
              <div className="p-4">
                <span className="text-xs font-medium text-primary">{g.category}</span>
                <h3 className="mt-1 line-clamp-2 font-semibold group-hover:text-primary">{g.title}</h3>
                <div className="mt-2 text-sm font-bold">From ${Number(g.price_basic).toFixed(0)}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

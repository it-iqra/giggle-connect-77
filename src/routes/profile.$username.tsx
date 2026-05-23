import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star, MapPin, Clock, Pencil, Calendar, Briefcase, MessageSquare } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PortfolioSection } from "@/components/PortfolioSection";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/profile/$username")({
  component: ProfileViewPage,
});

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  rating_avg: number | null;
  total_reviews: number | null;
  completed_orders: number | null;
  response_time: string | null;
  skills: string[] | null;
  languages: string[] | null;
  experience_level: string | null;
  created_at: string;
};

type Gig = { id: string; title: string; category: string; price_basic: number; images: string[] | null };

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_id: string;
};

function ProfileViewPage() {
  const { username } = Route.useParams();
  const { user, roles } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewerNames, setReviewerNames] = useState<Record<string, string>>({});
  const [profileRoles, setProfileRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const isMe = username === "me";

  useEffect(() => {
    if (isMe && !user) return;
    (async () => {
      setLoading(true);
      let q = supabase.from("profiles").select("*");
      q = isMe ? q.eq("id", user!.id) : q.eq("username", username);
      const { data: p } = await q.maybeSingle();
      if (!p) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const [{ data: g }, { data: r }, { data: rl }] = await Promise.all([
        supabase.from("gigs").select("id,title,category,price_basic,images").eq("seller_id", p.id).eq("status", "active"),
        supabase.from("reviews").select("id,rating,comment,created_at,reviewer_id").eq("reviewee_id", p.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("user_roles").select("role").eq("user_id", p.id),
      ]);
      setProfile(p as Profile);
      setGigs((g ?? []) as Gig[]);
      setReviews((r ?? []) as Review[]);
      setProfileRoles((rl ?? []).map((x: { role: string }) => x.role));
      const ids = Array.from(new Set((r ?? []).map((x) => x.reviewer_id)));
      if (ids.length) {
        const { data: names } = await supabase.from("profiles").select("id,username,full_name").in("id", ids);
        const map: Record<string, string> = {};
        (names ?? []).forEach((n: { id: string; username: string | null; full_name: string | null }) => {
          map[n.id] = n.full_name ?? n.username ?? "User";
        });
        setReviewerNames(map);
      }
      setLoading(false);
    })();
  }, [username, isMe, user]);

  if (isMe && !user) return <Navigate to="/auth" search={{ mode: "login" }} />;
  if (loading) return <div className="min-h-screen bg-background"><Navbar /><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading…</div></div>;
  if (notFound || !profile) return <div className="min-h-screen bg-background"><Navbar /><div className="container mx-auto px-4 py-20 text-center"><h1 className="text-2xl font-bold">Profile not found</h1></div></div>;

  const isOwner = user?.id === profile.id;
  const name = profile.full_name ?? profile.username ?? "User";
  const initial = name[0]?.toUpperCase() ?? "?";
  const memberSince = new Date(profile.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const isSeller = profileRoles.includes("seller") || profileRoles.includes("both") || (isOwner && (roles.includes("seller") || roles.includes("both")));
  const roleBadge = profileRoles.includes("admin") ? "Admin" : profileRoles.includes("both") ? "Buyer & Seller" : profileRoles.includes("seller") ? "Seller" : "Buyer";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-5xl px-4 py-10">
        {/* Header */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-start gap-6">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={name} className="h-[120px] w-[120px] rounded-full object-cover border-2 border-border" />
            ) : (
              <div className="grid h-[120px] w-[120px] place-items-center rounded-full bg-[image:var(--gradient-primary)] text-4xl font-bold text-primary-foreground">{initial}</div>
            )}
            <div className="flex-1 min-w-[200px]">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
                <Badge variant="secondary">{roleBadge}</Badge>
              </div>
              {profile.username && <p className="mt-1 text-sm text-muted-foreground">@{profile.username}</p>}
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                {profile.location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {profile.location}</span>}
                <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" /> Member since {memberSince}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {isOwner ? (
                <Link to="/profile/edit">
                  <Button variant="outline" size="sm"><Pencil className="mr-1 h-4 w-4" /> Edit Profile</Button>
                </Link>
              ) : user && (
                <Link to="/messages/$id" params={{ id: profile.id }}>
                  <Button size="sm"><MessageSquare className="mr-1 h-4 w-4" /> Contact</Button>
                </Link>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border p-3">
              <div className="text-xs text-muted-foreground">Completed orders</div>
              <div className="mt-1 inline-flex items-center gap-1 text-lg font-semibold"><Briefcase className="h-4 w-4" /> {profile.completed_orders ?? 0}</div>
            </div>
            <div className="rounded-xl border border-border p-3">
              <div className="text-xs text-muted-foreground">Rating</div>
              <div className="mt-1 inline-flex items-center gap-1 text-lg font-semibold"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {profile.rating_avg ? profile.rating_avg.toFixed(1) : "—"} <span className="text-xs font-normal text-muted-foreground">({profile.total_reviews ?? 0})</span></div>
            </div>
            <div className="rounded-xl border border-border p-3">
              <div className="text-xs text-muted-foreground">Response time</div>
              <div className="mt-1 text-lg font-semibold">{profile.response_time ?? "—"}</div>
            </div>
            <div className="rounded-xl border border-border p-3">
              <div className="text-xs text-muted-foreground">Experience</div>
              <div className="mt-1 text-lg font-semibold">{profile.experience_level ?? "—"}</div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold tracking-tight">About</h2>
          <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">{profile.bio || "No bio yet"}</p>
        </section>

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <section className="mt-8 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold tracking-tight">Skills</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span key={s} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">{s}</span>
              ))}
            </div>
            {profile.languages && profile.languages.length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-muted-foreground">Languages</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile.languages.map((l) => (
                    <span key={l} className="rounded-full border border-border px-3 py-1 text-xs">{l}</span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Portfolio */}
        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <PortfolioSection userId={profile.id} editable={isOwner} />
        </section>

        {/* Gigs */}
        {isSeller && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight">Gigs by {name}</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {gigs.length === 0 && <p className="text-sm text-muted-foreground">No active gigs.</p>}
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
          </section>
        )}

        {/* Reviews */}
        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold tracking-tight">Reviews</h2>
          {reviews.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No reviews yet.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {reviews.map((rv) => (
                <li key={rv.id} className="border-b border-border pb-4 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{reviewerNames[rv.reviewer_id] ?? "User"}</span>
                    <span className="inline-flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < rv.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                      ))}
                    </span>
                    <span className="text-xs text-muted-foreground">{new Date(rv.created_at).toLocaleDateString()}</span>
                  </div>
                  {rv.comment && <p className="mt-1 text-sm text-muted-foreground">{rv.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

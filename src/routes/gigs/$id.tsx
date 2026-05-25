import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star, Clock, RefreshCw, Check, Heart } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/gigs/$id")({
  component: GigDetail,
});

type Gig = {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[] | null;
  images: string[] | null;
  seller_id: string;
  price_basic: number;
  price_standard: number | null;
  price_premium: number | null;
  delivery_days_basic: number;
  delivery_days_standard: number | null;
  delivery_days_premium: number | null;
  revisions: number | null;
};

type Seller = { id: string; username: string | null; full_name: string | null; avatar_url: string | null; rating_avg: number | null; total_reviews: number | null };
type Review = { id: string; rating: number; comment: string | null; created_at: string; reviewer_id: string };

const PACKAGES = ["basic", "standard", "premium"] as const;
type Pkg = (typeof PACKAGES)[number];

function GigDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gig, setGig] = useState<Gig | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pkg, setPkg] = useState<Pkg>("basic");
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: g } = await supabase.from("gigs").select("*").eq("id", id).maybeSingle();
      if (!g) { setLoading(false); return; }
      setGig(g as Gig);
      const [{ data: s }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("id,username,full_name,avatar_url,rating_avg,total_reviews").eq("id", g.seller_id).maybeSingle(),
        supabase.from("reviews").select("id,rating,comment,created_at,reviewer_id").eq("reviewee_id", g.seller_id).order("created_at", { ascending: false }).limit(5),
      ]);
      setSeller(s as Seller);
      setReviews((r ?? []) as Review[]);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-background"><Navbar /><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div></div>;
  if (!gig) return <div className="min-h-screen bg-background"><Navbar /><div className="container mx-auto px-4 py-20 text-center">Gig not found. <Link to="/gigs" className="text-primary">Browse all</Link></div></div>;

  const priceMap = { basic: gig.price_basic, standard: gig.price_standard, premium: gig.price_premium };
  const daysMap = { basic: gig.delivery_days_basic, standard: gig.delivery_days_standard, premium: gig.delivery_days_premium };
  const price = priceMap[pkg];
  const days = daysMap[pkg];

  const handleOrder = async () => {
    if (!user) { navigate({ to: "/auth", search: { mode: "login" } }); return; }
    if (user.id === gig.seller_id) { toast.error("You can't order your own gig"); return; }
    if (!price) { toast.error("This package is not available"); return; }
    setOrdering(true);
    const { data, error } = await supabase.from("orders").insert({
      gig_id: gig.id,
      buyer_id: user.id,
      seller_id: gig.seller_id,
      package_type: pkg,
      amount: price,
      status: "pending",
    }).select("id").single();
    setOrdering(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Order placed! Waiting for seller to accept.");
    navigate({ to: "/orders/$id", params: { id: data.id } });
  };

  const handleFavorite = async () => {
    if (!user) { navigate({ to: "/auth", search: { mode: "login" } }); return; }
    const { error } = await supabase.from("favorites").insert({ gig_id: gig.id, user_id: user.id });
    if (error) toast.error("Already in favorites"); else toast.success("Saved to favorites");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Link to="/gigs" className="text-sm text-muted-foreground hover:text-foreground">← Back to browse</Link>
          <h1 className="mt-4 text-3xl font-bold md:text-4xl">{gig.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            {seller && (
              <Link to="/sellers/$id" params={{ id: seller.id }} className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-accent text-accent-foreground text-xs font-bold">
                  {(seller.full_name ?? seller.username ?? "?")[0]?.toUpperCase()}
                </div>
                <span className="font-medium">{seller.full_name ?? seller.username}</span>
              </Link>
            )}
            <span className="text-muted-foreground">·</span>
            <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-current text-amber-400" /> {seller?.rating_avg?.toFixed(1) ?? "New"} ({seller?.total_reviews ?? 0})</span>
          </div>

          <div className="mt-6 aspect-video w-full overflow-hidden rounded-2xl border border-border bg-[image:var(--gradient-primary)]">
            {gig.images?.[0] && <img src={gig.images[0]} alt={gig.title} className="h-full w-full object-cover" />}
          </div>

          <h2 className="mt-10 text-xl font-bold">About this gig</h2>
          <p className="mt-3 whitespace-pre-line text-muted-foreground">{gig.description}</p>

          {gig.tags && gig.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {gig.tags.map((t) => <span key={t} className="rounded-full border border-border bg-card px-3 py-1 text-xs">{t}</span>)}
            </div>
          )}

          <h2 className="mt-10 text-xl font-bold">Reviews</h2>
          {reviews.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No reviews yet.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-current" : ""}`} />)}
                  </div>
                  <p className="mt-2 text-sm">{r.comment}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)]">
            <div className="flex gap-2 rounded-lg bg-muted p-1">
              {PACKAGES.map((p) => {
                const disabled = !priceMap[p];
                return (
                  <button
                    key={p}
                    disabled={disabled}
                    onClick={() => setPkg(p)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors disabled:opacity-30 ${pkg === p ? "bg-background shadow-sm" : ""}`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-bold">${Number(price ?? 0).toFixed(0)}</span>
              <span className="text-sm text-muted-foreground capitalize">{pkg} package</span>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> {days ?? "—"} day delivery</div>
              <div className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-muted-foreground" /> {gig.revisions ?? 1} revisions</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Money-back guarantee</div>
            </div>

            <Button
              onClick={handleOrder}
              disabled={ordering}
              className="mt-5 w-full bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-95"
              size="lg"
            >
              {ordering ? "Placing..." : `Continue ($${Number(price ?? 0).toFixed(0)})`}
            </Button>
            <Button variant="outline" className="mt-2 w-full" onClick={handleFavorite}>
              <Heart className="mr-2 h-4 w-4" /> Save
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">Stripe checkout coming soon — contact seller to arrange payment</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

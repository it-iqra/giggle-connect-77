import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Edit } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/gigs/my")({
  component: MyGigs,
});

type Gig = { id: string; title: string; category: string; price_basic: number; status: string; views: number | null; images: string[] | null };

function MyGigs() {
  const { user } = useAuth();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) load(); }, [user]);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("gigs").select("id,title,category,price_basic,status,views,images").eq("seller_id", user!.id).order("created_at", { ascending: false });
    setGigs((data ?? []) as Gig[]);
    setLoading(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this gig?")) return;
    const { error } = await supabase.from("gigs").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Gig deleted"); load(); }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My gigs</h1>
            <p className="mt-1 text-muted-foreground">Manage your service listings</p>
          </div>
          <Link to="/gigs/create">
            <Button className="bg-[image:var(--gradient-primary)] text-primary-foreground"><Plus className="mr-2 h-4 w-4" /> New gig</Button>
          </Link>
        </div>

        {loading ? <p className="mt-10 text-muted-foreground">Loading...</p> : gigs.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">You haven't created any gigs yet.</p>
            <Link to="/gigs/create"><Button className="mt-4">Create your first gig</Button></Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {gigs.map((g) => (
              <div key={g.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="aspect-video bg-[image:var(--gradient-primary)]">
                  {g.images?.[0] && <img src={g.images[0]} alt={g.title} className="h-full w-full object-cover" />}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-primary font-medium">{g.category}</span>
                    <span className={`rounded-full px-2 py-0.5 ${g.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{g.status}</span>
                  </div>
                  <h3 className="mt-2 line-clamp-2 font-semibold">{g.title}</h3>
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-sm">From <strong>${Number(g.price_basic).toFixed(0)}</strong></span>
                    <div className="flex gap-1">
                      <Link to="/gigs/$id" params={{ id: g.id }}><Button size="icon" variant="ghost"><Edit className="h-4 w-4" /></Button></Link>
                      <Button size="icon" variant="ghost" onClick={() => remove(g.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/orders/")({
  component: Orders,
});

type Order = {
  id: string; gig_id: string | null; buyer_id: string; seller_id: string;
  package_type: string; amount: number; status: string; created_at: string;
  gigs?: { title: string } | null;
};

function Orders() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"buying" | "selling">("buying");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const col = tab === "buying" ? "buyer_id" : "seller_id";
    const fetchOrders = () =>
      supabase.from("orders").select("id,gig_id,buyer_id,seller_id,package_type,amount,status,created_at,gigs(title)").eq(col, user.id).order("created_at", { ascending: false })
        .then(({ data }) => { setOrders((data ?? []) as Order[]); setLoading(false); });
    fetchOrders();
    const ch = supabase.channel(`orders:${user.id}:${tab}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `${col}=eq.${user.id}` }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, tab]);

  const statusColor = (s: string) => ({
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    active: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
    delivered: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300",
    cancelled: "bg-muted text-muted-foreground",
  } as Record<string, string>)[s] ?? "bg-accent text-accent-foreground";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold">Orders</h1>
        <div className="mt-6 inline-flex rounded-lg bg-muted p-1">
          <button onClick={() => setTab("buying")} className={`rounded-md px-4 py-1.5 text-sm font-medium ${tab === "buying" ? "bg-background shadow-sm" : ""}`}>Buying</button>
          <button onClick={() => setTab("selling")} className={`rounded-md px-4 py-1.5 text-sm font-medium ${tab === "selling" ? "bg-background shadow-sm" : ""}`}>Selling</button>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          {loading ? <p className="p-6 text-muted-foreground">Loading...</p> : orders.length === 0 ? (
            <p className="p-12 text-center text-muted-foreground">No orders yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="p-4">Gig</th><th className="p-4">Package</th><th className="p-4">Amount</th><th className="p-4">Status</th><th className="p-4">Date</th><th></th></tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="p-4 font-medium">{o.gigs?.title ?? "—"}</td>
                    <td className="p-4 capitalize">{o.package_type}</td>
                    <td className="p-4">${Number(o.amount).toFixed(2)}</td>
                    <td className="p-4"><span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium capitalize">{o.status}</span></td>
                    <td className="p-4 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="p-4"><Link to="/orders/$id" params={{ id: o.id }} className="text-primary font-medium">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/orders/$id")({
  component: OrderDetail,
});

type Order = {
  id: string; gig_id: string | null; buyer_id: string; seller_id: string;
  package_type: string; amount: number; status: string; requirements: string | null;
  delivery_file_url: string | null; delivered_at: string | null; completed_at: string | null;
  created_at: string; gigs?: { title: string } | null;
};

function OrderDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [deliveryUrl, setDeliveryUrl] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("orders").select("*,gigs(title)").eq("id", id).maybeSingle();
    setOrder(data as Order);
    if (data) {
      const { data: rev } = await supabase.from("reviews").select("id").eq("order_id", id).maybeSingle();
      setHasReviewed(!!rev);
    }
    setLoading(false);
  }

  async function accept() {
    const { error } = await supabase.from("orders").update({ status: "active" }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Order accepted!"); load(); }
  }

  async function deliver() {
    if (!deliveryUrl) return toast.error("Add a delivery link or message");
    const { error } = await supabase.from("orders").update({ status: "delivered", delivery_file_url: deliveryUrl, delivered_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Delivered!"); load(); }
  }

  async function complete() {
    const { error } = await supabase.from("orders").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Order completed!"); load(); }
  }

  async function cancel() {
    if (!confirm("Cancel this order?")) return;
    const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Cancelled"); load(); }
  }

  async function submitReview() {
    if (!order || !comment.trim()) return toast.error("Add a comment");
    const { error } = await supabase.from("reviews").insert({
      order_id: order.id, reviewer_id: user!.id, reviewee_id: order.seller_id, rating, comment: comment.trim(),
    });
    if (error) toast.error(error.message); else { toast.success("Review posted"); setHasReviewed(true); }
  }

  if (loading) return <div className="min-h-screen bg-background"><Navbar /><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div></div>;
  if (!order) return <div className="min-h-screen bg-background"><Navbar /><div className="container mx-auto px-4 py-20 text-center">Order not found</div></div>;

  const isBuyer = user?.id === order.buyer_id;
  const isSeller = user?.id === order.seller_id;
  const otherId = isBuyer ? order.seller_id : order.buyer_id;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <Link to="/orders" className="text-sm text-muted-foreground">← Back to orders</Link>
        <h1 className="mt-4 text-3xl font-bold">{order.gigs?.title ?? "Order"}</h1>
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="capitalize">{order.package_type} package</span>
          <span>·</span>
          <span>${Number(order.amount).toFixed(2)}</span>
          <span>·</span>
          <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium capitalize text-accent-foreground">{order.status}</span>
        </div>

        <div className="mt-8 space-y-4">
          <Link to="/messages/$id" params={{ id: otherId }}>
            <Button variant="outline">Message {isBuyer ? "seller" : "buyer"}</Button>
          </Link>

          {order.status === "pending" && (
            <div className="rounded-2xl border-2 border-amber-400/40 bg-amber-50/40 dark:bg-amber-950/20 p-6">
              <h3 className="font-semibold">Awaiting seller confirmation</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {isSeller
                  ? "A buyer has placed this order. Confirm to start working."
                  : "We're waiting for the seller to accept your order."}
              </p>
              {isSeller && (
                <Button className="mt-3 bg-[image:var(--gradient-primary)] text-primary-foreground" onClick={accept}>
                  Accept order
                </Button>
              )}
            </div>
          )}

          {isSeller && order.status === "active" && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-semibold">Deliver work</h3>
              <Input className="mt-3" placeholder="Delivery link or notes" value={deliveryUrl} onChange={e => setDeliveryUrl(e.target.value)} />
              <Button className="mt-3" onClick={deliver}>Mark as delivered</Button>
            </div>
          )}

          {order.delivery_file_url && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-semibold">Delivery</h3>
              <p className="mt-2 text-sm break-all">{order.delivery_file_url}</p>
              <p className="mt-1 text-xs text-muted-foreground">Delivered {order.delivered_at ? new Date(order.delivered_at).toLocaleString() : ""}</p>
            </div>
          )}

          {isBuyer && order.status === "delivered" && (
            <Button onClick={complete} className="bg-[image:var(--gradient-primary)] text-primary-foreground">Accept & complete</Button>
          )}

          {(order.status === "active" || order.status === "pending") && (
            <Button variant="outline" onClick={cancel}>Cancel order</Button>
          )}

          {isBuyer && order.status === "completed" && !hasReviewed && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-semibold">Leave a review</h3>
              <div className="mt-3 flex gap-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setRating(n)}>
                    <Star className={`h-6 w-6 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
              <Textarea className="mt-3" placeholder="Share your experience..." value={comment} onChange={e => setComment(e.target.value)} maxLength={1000} />
              <Button className="mt-3" onClick={submitReview}>Post review</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

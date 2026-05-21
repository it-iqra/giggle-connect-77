import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/gigs/create")({
  component: CreateGig,
});

const CATEGORIES = ["Development", "Design", "Writing", "Video", "Marketing", "Translation"];

const schema = z.object({
  title: z.string().trim().min(10, "Title must be at least 10 characters").max(120),
  description: z.string().trim().min(50, "Description must be at least 50 characters").max(5000),
  category: z.string().min(1, "Pick a category"),
  tags: z.string().max(200).optional(),
  imageUrl: z.string().url().or(z.literal("")).optional(),
  price_basic: z.coerce.number().min(5, "Minimum $5").max(10000),
  delivery_days_basic: z.coerce.number().int().min(1).max(90),
  price_standard: z.coerce.number().min(0).max(10000).optional(),
  delivery_days_standard: z.coerce.number().int().min(0).max(90).optional(),
  price_premium: z.coerce.number().min(0).max(10000).optional(),
  delivery_days_premium: z.coerce.number().int().min(0).max(90).optional(),
  revisions: z.coerce.number().int().min(0).max(20),
});

function CreateGig() {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const isSeller = roles.includes("seller") || roles.includes("both") || roles.includes("admin");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const raw = Object.fromEntries(form.entries());
    const parsed = schema.safeParse(raw);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    const v = parsed.data;
    setSaving(true);
    const { data, error } = await supabase.from("gigs").insert({
      seller_id: user!.id,
      title: v.title,
      description: v.description,
      category: v.category,
      tags: v.tags ? v.tags.split(",").map(s => s.trim()).filter(Boolean) : [],
      images: v.imageUrl ? [v.imageUrl] : [],
      price_basic: v.price_basic,
      delivery_days_basic: v.delivery_days_basic,
      price_standard: v.price_standard || null,
      delivery_days_standard: v.delivery_days_standard || null,
      price_premium: v.price_premium || null,
      delivery_days_premium: v.delivery_days_premium || null,
      revisions: v.revisions,
      status: "active",
    }).select("id").single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Gig published!");
    navigate({ to: "/gigs/$id", params: { id: data.id } });
  };

  if (!isSeller) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Seller account required</h1>
          <p className="mt-2 text-muted-foreground">Your account is set as buyer only. Switch to a seller account to create gigs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-3xl font-bold">Create a new gig</h1>
        <p className="mt-1 text-muted-foreground">Tell buyers what you offer</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <Label htmlFor="title">Gig title</Label>
            <Input id="title" name="title" placeholder="I will design a modern logo for your brand" required maxLength={120} />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <select id="category" name="category" required className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="">Select…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={6} placeholder="Describe what's included, your process, and what buyers should expect..." required maxLength={5000} />
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input id="tags" name="tags" placeholder="logo, branding, illustrator" maxLength={200} />
          </div>

          <div>
            <Label htmlFor="imageUrl">Cover image URL (optional)</Label>
            <Input id="imageUrl" name="imageUrl" type="url" placeholder="https://..." />
          </div>

          <div className="rounded-xl border border-border p-4">
            <h3 className="font-semibold">Basic package (required)</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div><Label>Price ($)</Label><Input name="price_basic" type="number" min={5} step={1} defaultValue={25} required /></div>
              <div><Label>Delivery (days)</Label><Input name="delivery_days_basic" type="number" min={1} defaultValue={3} required /></div>
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <h3 className="font-semibold">Standard (optional)</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div><Label>Price ($)</Label><Input name="price_standard" type="number" min={0} step={1} /></div>
              <div><Label>Delivery (days)</Label><Input name="delivery_days_standard" type="number" min={0} /></div>
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <h3 className="font-semibold">Premium (optional)</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div><Label>Price ($)</Label><Input name="price_premium" type="number" min={0} step={1} /></div>
              <div><Label>Delivery (days)</Label><Input name="delivery_days_premium" type="number" min={0} /></div>
            </div>
          </div>

          <div>
            <Label htmlFor="revisions">Revisions included</Label>
            <Input id="revisions" name="revisions" type="number" min={0} max={20} defaultValue={1} required />
          </div>

          <Button type="submit" disabled={saving} size="lg" className="w-full bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-95">
            {saving ? "Publishing..." : "Publish gig"}
          </Button>
        </form>
      </div>
    </div>
  );
}

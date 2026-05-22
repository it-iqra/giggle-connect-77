import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileUpload } from "@/components/FileUpload";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Item {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  project_url: string | null;
  category: string | null;
}

export function PortfolioSection({ userId, editable }: { userId: string; editable: boolean }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    image_url: "",
    project_url: "",
    category: "",
  });

  async function load() {
    const { data } = await supabase
      .from("portfolio_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setItems((data as Item[]) ?? []);
  }

  useEffect(() => {
    load();
  }, [userId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("portfolio_items").insert({
      user_id: user.id,
      title: form.title,
      description: form.description || null,
      image_url: form.image_url || null,
      project_url: form.project_url || null,
      category: form.category || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Portfolio item added");
    setForm({ title: "", description: "", image_url: "", project_url: "", category: "" });
    setOpen(false);
    load();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Portfolio</h2>
        {editable && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="mr-1 h-4 w-4" /> Add item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New portfolio item</DialogTitle>
              </DialogHeader>
              <form onSubmit={add} className="space-y-3">
                <div>
                  <Label>Title</Label>
                  <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Web Design" />
                </div>
                <div>
                  <Label>Project URL</Label>
                  <Input value={form.project_url} onChange={(e) => setForm({ ...form, project_url: e.target.value })} placeholder="https://…" />
                </div>
                <div>
                  <Label>Cover image</Label>
                  <FileUpload
                    bucket="portfolio"
                    currentUrl={form.image_url || null}
                    onUploaded={(url) => setForm((f) => ({ ...f, image_url: url }))}
                  />
                </div>
                <Button type="submit" className="w-full">Save</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No portfolio items yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="group overflow-hidden rounded-xl border border-border bg-card">
              {item.image_url && (
                <div className="aspect-video overflow-hidden bg-muted">
                  <img src={item.image_url} alt={item.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                </div>
              )}
              <div className="space-y-1 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium leading-tight">{item.title}</h3>
                  {editable && (
                    <button onClick={() => remove(item.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {item.category && <p className="text-xs text-muted-foreground">{item.category}</p>}
                {item.description && <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>}
                {item.project_url && (
                  <a href={item.project_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    Visit <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

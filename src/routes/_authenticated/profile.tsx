import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/FileUpload";
import { PortfolioSection } from "@/components/PortfolioSection";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    avatar_url: "",
    bio: "",
    location: "",
    skills: "",
    languages: "",
    experience_level: "",
    response_time: "",
    resume_url: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm({
            username: data.username ?? "",
            full_name: data.full_name ?? "",
            avatar_url: data.avatar_url ?? "",
            bio: data.bio ?? "",
            location: data.location ?? "",
            skills: (data.skills ?? []).join(", "),
            languages: (data.languages ?? []).join(", "),
            experience_level: data.experience_level ?? "",
            response_time: data.response_time ?? "",
            resume_url: (data as { resume_url?: string }).resume_url ?? "",
          });
        }
        setLoading(false);
      });
  }, [user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        username: form.username || null,
        full_name: form.full_name || null,
        avatar_url: form.avatar_url || null,
        bio: form.bio || null,
        location: form.location || null,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        languages: form.languages.split(",").map((s) => s.trim()).filter(Boolean),
        experience_level: form.experience_level || null,
        response_time: form.response_time || null,
        resume_url: form.resume_url || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  }

  async function persistField(field: string, value: string | null) {
    if (!user) return;
    await supabase.from("profiles").update({ [field]: value }).eq("id", user.id);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Edit profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Showcase yourself to buyers and sellers.</p>

        {loading ? (
          <p className="mt-10 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <form onSubmit={save} className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6">
              <div>
                <Label className="mb-2 block">Profile picture</Label>
                <FileUpload
                  bucket="avatars"
                  currentUrl={form.avatar_url || null}
                  label={form.avatar_url ? "Change avatar" : "Upload avatar"}
                  onUploaded={(url) => {
                    setForm((f) => ({ ...f, avatar_url: url }));
                    persistField("avatar_url", url);
                  }}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Username</Label>
                  <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                </div>
                <div>
                  <Label>Full name</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Bio</Label>
                <Textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell people what you do…" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Location</Label>
                  <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </div>
                <div>
                  <Label>Experience level</Label>
                  <Input value={form.experience_level} onChange={(e) => setForm({ ...form, experience_level: e.target.value })} placeholder="Beginner / Intermediate / Expert" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Skills (comma separated)</Label>
                  <Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Figma, React, SEO" />
                </div>
                <div>
                  <Label>Languages (comma separated)</Label>
                  <Input value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} placeholder="English, Spanish" />
                </div>
              </div>
              <div>
                <Label>Response time</Label>
                <Input value={form.response_time} onChange={(e) => setForm({ ...form, response_time: e.target.value })} placeholder="Within 1 hour" />
              </div>

              <div>
                <Label className="mb-2 block">Resume (PDF, private)</Label>
                <FileUpload
                  bucket="resumes"
                  accept="application/pdf"
                  maxSizeMB={10}
                  currentUrl={form.resume_url || null}
                  label={form.resume_url ? "Replace resume" : "Upload resume"}
                  onUploaded={(url) => {
                    setForm((f) => ({ ...f, resume_url: url }));
                    persistField("resume_url", url);
                  }}
                />
              </div>

              <Button type="submit" disabled={saving} className="bg-[image:var(--gradient-primary)] text-primary-foreground">
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </form>

            {user && (
              <div className="mt-10 rounded-2xl border border-border bg-card p-6">
                <PortfolioSection userId={user.id} editable />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

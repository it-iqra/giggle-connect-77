import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, Users, Briefcase, AlertTriangle, CheckCircle2, Ban } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { mode: "login" } });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    if (!roles?.some((r) => r.role === "admin")) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminPanel,
});

type Tab = "gigs" | "users" | "disputes";

function AdminPanel() {
  const [tab, setTab] = useState<Tab>("gigs");
  const [stats, setStats] = useState({ users: 0, gigs: 0, pending: 0, disputes: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("gigs").select("id", { count: "exact", head: true }),
      supabase.from("gigs").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("disputes").select("id", { count: "exact", head: true }).eq("status", "open"),
    ]).then(([u, g, p, d]) => {
      setStats({ users: u.count ?? 0, gigs: g.count ?? 0, pending: p.count ?? 0, disputes: d.count ?? 0 });
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-foreground text-background">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin panel</h1>
            <p className="text-sm text-muted-foreground">Moderate the marketplace.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Users" value={stats.users} />
          <StatCard icon={Briefcase} label="Gigs" value={stats.gigs} />
          <StatCard icon={CheckCircle2} label="Pending gigs" value={stats.pending} />
          <StatCard icon={AlertTriangle} label="Open disputes" value={stats.disputes} />
        </div>

        <div className="mt-8 flex gap-2 border-b border-border">
          {(["gigs", "users", "disputes"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize -mb-px border-b-2 ${tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "gigs" && <GigsModeration />}
          {tab === "users" && <UsersModeration />}
          {tab === "disputes" && <DisputesModeration />}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function GigsModeration() {
  const [rows, setRows] = useState<Array<{ id: string; title: string; category: string; status: string; seller_id: string }>>([]);

  async function load() {
    const { data } = await supabase.from("gigs").select("id, title, category, status, seller_id").order("created_at", { ascending: false }).limit(100);
    setRows((data as typeof rows) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function setStatus(id: string, status: "active" | "rejected" | "paused") {
    const { error } = await supabase.from("gigs").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Gig ${status}`); load(); }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((g) => (
            <tr key={g.id} className="border-t border-border">
              <td className="px-4 py-3 font-medium">{g.title}</td>
              <td className="px-4 py-3 text-muted-foreground">{g.category}</td>
              <td className="px-4 py-3 capitalize">{g.status}</td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => setStatus(g.id, "active")} className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent">Approve</button>
                <button onClick={() => setStatus(g.id, "paused")} className="ml-2 rounded-md border border-border px-2 py-1 text-xs hover:bg-accent">Pause</button>
                <button onClick={() => setStatus(g.id, "rejected")} className="ml-2 rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10">Reject</button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No gigs.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function UsersModeration() {
  const [rows, setRows] = useState<Array<{ id: string; username: string | null; full_name: string | null; is_banned: boolean | null }>>([]);

  async function load() {
    const { data } = await supabase.from("profiles").select("id, username, full_name, is_banned").order("created_at", { ascending: false }).limit(100);
    setRows((data as typeof rows) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function toggleBan(id: string, banned: boolean) {
    const { error } = await supabase.from("profiles").update({ is_banned: banned }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(banned ? "User banned" : "User unbanned"); load(); }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id} className="border-t border-border">
              <td className="px-4 py-3">
                <p className="font-medium">{u.full_name ?? u.username ?? "—"}</p>
                <p className="text-xs text-muted-foreground">@{u.username ?? "—"}</p>
              </td>
              <td className="px-4 py-3">
                {u.is_banned ? <span className="text-destructive">Banned</span> : <span className="text-success">Active</span>}
              </td>
              <td className="px-4 py-3 text-right">
                {u.is_banned ? (
                  <button onClick={() => toggleBan(u.id, false)} className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent">Unban</button>
                ) : (
                  <button onClick={() => toggleBan(u.id, true)} className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10">
                    <Ban className="h-3 w-3" /> Ban
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DisputesModeration() {
  const [rows, setRows] = useState<Array<{ id: string; reason: string; status: string; order_id: string; created_at: string }>>([]);
  const [resolution, setResolution] = useState<Record<string, string>>({});

  async function load() {
    const { data } = await supabase.from("disputes").select("id, reason, status, order_id, created_at").order("created_at", { ascending: false }).limit(100);
    setRows((data as typeof rows) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function resolve(id: string, status: "resolved" | "rejected") {
    const { error } = await supabase.from("disputes").update({ status, admin_resolution: resolution[id] ?? null }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Dispute ${status}`); load(); }
  }

  return (
    <div className="space-y-3">
      {rows.length === 0 && <p className="text-sm text-muted-foreground">No disputes.</p>}
      {rows.map((d) => (
        <div key={d.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Order {d.order_id.slice(0, 8)} · {new Date(d.created_at).toLocaleDateString()}</p>
              <p className="mt-1 font-medium">{d.reason}</p>
              <p className="mt-1 text-xs capitalize">Status: {d.status}</p>
            </div>
          </div>
          {d.status === "open" && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Resolution notes…"
                value={resolution[d.id] ?? ""}
                onChange={(e) => setResolution({ ...resolution, [d.id]: e.target.value })}
              />
              <button onClick={() => resolve(d.id, "resolved")} className="rounded-md border border-border px-3 py-2 text-xs hover:bg-accent">Resolve</button>
              <button onClick={() => resolve(d.id, "rejected")} className="rounded-md border border-destructive/40 px-3 py-2 text-xs text-destructive hover:bg-destructive/10">Reject</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

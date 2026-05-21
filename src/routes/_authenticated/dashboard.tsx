import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag, Briefcase, Wallet, Heart, MessageSquare, Star, Settings } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, profile, roles } = useAuth();
  const isSeller = roles.includes("seller") || roles.includes("both");
  const isAdmin = roles.includes("admin");

  const stats = [
    { icon: ShoppingBag, label: "Active orders", value: "0" },
    { icon: Wallet, label: "Wallet balance", value: "$0.00" },
    { icon: Heart, label: "Saved gigs", value: "0" },
    { icon: MessageSquare, label: "Unread messages", value: "0" },
  ];

  const actions = [
    { icon: ShoppingBag, title: "Browse gigs", desc: "Find the perfect service", href: "/", color: "from-primary to-primary-glow" },
    ...(isSeller ? [{ icon: Briefcase, title: "My gigs", desc: "Manage your offerings", href: "/dashboard", color: "from-success to-primary" }] : []),
    { icon: Settings, title: "Edit profile", desc: "Update your info", href: "/dashboard", color: "from-primary-glow to-success" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {profile?.full_name ?? profile?.username ?? user?.email}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              {roles.length === 0 && (
                <span className="text-xs text-muted-foreground">Setting up your account…</span>
              )}
              {roles.map((r) => (
                <span
                  key={r}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium capitalize"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
          {isAdmin && (
            <Link
              to="/dashboard"
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
            >
              Admin panel
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-2xl font-bold">{s.value}</p>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <h2 className="mt-12 mb-4 text-lg font-semibold">Quick actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {actions.map((a) => (
            <Link
              key={a.title}
              to={a.href}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
            >
              <div className={`mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${a.color} text-primary-foreground`}>
                <a.icon className="h-6 w-6" />
              </div>
              <div className="font-semibold">{a.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{a.desc}</div>
            </Link>
          ))}
        </div>

        {/* Empty state */}
        <div className="mt-12 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <Star className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Your activity will appear here</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Once you place an order or {isSeller ? "publish a gig" : "save a favorite"}, it'll show up on your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}

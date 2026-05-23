import { Link } from "@tanstack/react-router";
import { Sparkles, Menu, Bell, Wallet, Shield, Heart, User, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function Navbar() {
  const { user, signOut, profile, roles } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const isSeller = roles.includes("seller") || roles.includes("both") || roles.includes("admin");
  const isAdmin = roles.includes("admin");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)
      .then(({ count }) => setUnread(count ?? 0));
  }, [user]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-elegant)]">
            <Sparkles className="h-4 w-4" />
          </span>
          <span>Giggr</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex text-sm font-medium text-muted-foreground">
          <Link to="/gigs" className="hover:text-foreground transition-colors">Browse</Link>
          {user && <Link to="/orders" className="hover:text-foreground transition-colors">Orders</Link>}
          {user && <Link to="/messages" className="hover:text-foreground transition-colors">Messages</Link>}
          {isSeller && <Link to="/gigs/my" className="hover:text-foreground transition-colors">My gigs</Link>}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {isSeller && (
                <Link to="/gigs/create" className="hidden sm:inline-flex">
                  <Button size="sm" className="bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-95">+ New gig</Button>
                </Link>
              )}
              <Link to="/notifications" className="relative hidden sm:inline-flex">
                <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{unread}</span>
                )}
              </Link>
              <Link to="/wallet" className="hidden sm:inline-flex"><Button variant="ghost" size="icon"><Wallet className="h-4 w-4" /></Button></Link>
              {isAdmin && <Link to="/admin" className="hidden sm:inline-flex"><Button variant="ghost" size="icon"><Shield className="h-4 w-4" /></Button></Link>}
              <Link to="/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link>
              <Link to="/profile/edit" className="hidden sm:inline-flex" title="Edit profile">
                <Button variant="ghost" size="icon"><Settings className="h-4 w-4" /></Button>
              </Link>
              <Link to="/profile/$username" params={{ username: "me" }} title="View profile" className="inline-flex">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username ?? "Profile"} className="h-10 w-10 rounded-full object-cover border border-border hover:border-primary transition-colors" />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-[image:var(--gradient-primary)] text-sm font-bold text-primary-foreground border border-border">
                    {(profile?.username ?? user.email ?? "?")[0]?.toUpperCase()}
                  </div>
                )}
              </Link>
              <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
            </>
          ) : (
            <>
              <Link to="/auth" search={{ mode: "login" }}><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button size="sm" className="bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-elegant)] hover:opacity-95">Join</Button>
              </Link>
            </>
          )}
          <button className="md:hidden" onClick={() => setOpen(!open)}><Menu className="h-5 w-5" /></button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="container mx-auto flex flex-col gap-2 px-4 py-3 text-sm">
            <Link to="/gigs" onClick={() => setOpen(false)}>Browse</Link>
            {user && <Link to="/orders" onClick={() => setOpen(false)}>Orders</Link>}
            {user && <Link to="/messages" onClick={() => setOpen(false)}>Messages</Link>}
            {user && <Link to="/notifications" onClick={() => setOpen(false)} className="inline-flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications {unread > 0 && `(${unread})`}</Link>}
            {user && <Link to="/wallet" onClick={() => setOpen(false)} className="inline-flex items-center gap-2"><Wallet className="h-4 w-4" /> Wallet</Link>}
            {user && <Link to="/favorites" onClick={() => setOpen(false)} className="inline-flex items-center gap-2"><Heart className="h-4 w-4" /> Saved</Link>}
            {user && <Link to="/profile/$username" params={{ username: "me" }} onClick={() => setOpen(false)} className="inline-flex items-center gap-2"><User className="h-4 w-4" /> Profile</Link>}
            {user && <Link to="/profile/edit" onClick={() => setOpen(false)} className="inline-flex items-center gap-2"><Settings className="h-4 w-4" /> Edit profile</Link>}
            {isSeller && <Link to="/gigs/my" onClick={() => setOpen(false)}>My gigs</Link>}
            {isSeller && <Link to="/gigs/create" onClick={() => setOpen(false)}>+ New gig</Link>}
            {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="inline-flex items-center gap-2"><Shield className="h-4 w-4" /> Admin</Link>}
          </nav>
        </div>
      )}
    </header>
  );
}

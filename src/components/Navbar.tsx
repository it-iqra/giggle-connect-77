import { Link } from "@tanstack/react-router";
import { Sparkles, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const { user, signOut, profile, roles } = useAuth();
  const [open, setOpen] = useState(false);
  const isSeller = roles.includes("seller") || roles.includes("both") || roles.includes("admin");

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
              <Link to="/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link>
              <span className="hidden lg:inline text-sm text-muted-foreground">{profile?.username ?? user.email}</span>
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
            {isSeller && <Link to="/gigs/my" onClick={() => setOpen(false)}>My gigs</Link>}
            {isSeller && <Link to="/gigs/create" onClick={() => setOpen(false)}>+ New gig</Link>}
          </nav>
        </div>
      )}
    </header>
  );
}

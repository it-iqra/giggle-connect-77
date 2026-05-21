import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Search, Shield, Zap, Star, Code, Palette, PenTool, Camera, Megaphone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/")({
  component: Landing,
});

const categories = [
  { icon: Code, name: "Development", count: "12,400+" },
  { icon: Palette, name: "Design", count: "8,900+" },
  { icon: PenTool, name: "Writing", count: "5,600+" },
  { icon: Camera, name: "Video", count: "3,200+" },
  { icon: Megaphone, name: "Marketing", count: "4,100+" },
  { icon: Globe, name: "Translation", count: "2,800+" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div
          className="absolute inset-0 -z-10 opacity-[0.08]"
          style={{ backgroundImage: "var(--gradient-hero)" }}
        />
        <div
          className="absolute -top-32 -right-32 -z-10 h-96 w-96 rounded-full blur-3xl opacity-30"
          style={{ background: "var(--gradient-primary)" }}
        />
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <span className="grid h-2 w-2 place-items-center rounded-full bg-success animate-pulse" />
              Trusted by 50,000+ businesses worldwide
            </div>
            <h1 className="text-5xl font-bold tracking-tight md:text-7xl">
              Find the <span className="bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">perfect freelance</span> services for your business
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Work with talented people at the most affordable price to get the most out of your time and cost.
            </p>

            <form className="mx-auto mt-10 flex max-w-2xl items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-[var(--shadow-elegant)]">
              <div className="flex flex-1 items-center gap-3 pl-4">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder='Try "logo design" or "react developer"'
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
              </div>
              <Button size="lg" className="bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-95">
                Search
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>Popular:</span>
              {["Website Design", "WordPress", "Logo Design", "AI Services", "Voice Over"].map((t) => (
                <span key={t} className="rounded-full border border-border bg-background px-3 py-1 hover:border-primary/40 cursor-pointer transition-colors">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="container mx-auto px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Explore the marketplace</h2>
          <p className="mt-3 text-muted-foreground">Find pros in 200+ categories</p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <div
              key={c.name}
              className="group cursor-pointer rounded-2xl border border-border bg-card p-6 text-center transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-elegant)]"
            >
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <c.icon className="h-6 w-6" />
              </div>
              <div className="font-semibold text-sm">{c.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{c.count} gigs</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border/60 bg-muted/30">
        <div className="container mx-auto px-4 py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">A whole world of freelance talent at your fingertips</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: Search, title: "Find the right service", desc: "Browse 500K+ gigs from top-rated freelancers in every category." },
              { icon: Shield, title: "Pay securely", desc: "Funds are held in escrow until you approve the work. 100% protected." },
              { icon: Zap, title: "Get work done fast", desc: "Order in seconds. Most freelancers deliver in under 48 hours." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-8">
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-elegant)]">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Become a seller */}
      <section id="sellers" className="container mx-auto px-4 py-24">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 md:p-16">
          <div className="absolute inset-0 -z-10 opacity-10" style={{ background: "var(--gradient-hero)" }} />
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                <Star className="h-3 w-3 fill-current" />
                For sellers
              </div>
              <h2 className="mt-4 text-4xl font-bold md:text-5xl">Earn money doing what you love.</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Join a thriving community of freelancers. Set your prices, choose your hours, and get paid for your skills.
              </p>
              <Link to="/auth" search={{ mode: "signup" }} className="mt-8 inline-block">
                <Button size="lg" className="bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-95">
                  Become a seller <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { stat: "$2.4M", label: "Paid out to freelancers" },
                { stat: "98%", label: "Satisfaction rate" },
                { stat: "24h", label: "Avg. response time" },
                { stat: "50K+", label: "Active freelancers" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-border bg-background p-6">
                  <div className="text-3xl font-bold bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">{s.stat}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 py-10 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Giggr. Built with Lovable Cloud.
        </div>
      </footer>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wallet as WalletIcon, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/wallet")({
  component: WalletPage,
});

interface Tx {
  id: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
}

function WalletPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle(),
      supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    ]).then(([w, t]) => {
      setBalance(Number(w.data?.balance ?? 0));
      setTxs((t.data as Tx[]) ?? []);
      setLoading(false);
    });
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Wallet & earnings</h1>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary to-primary-glow p-6 text-primary-foreground sm:col-span-2">
            <div className="flex items-center gap-2 text-sm opacity-90">
              <WalletIcon className="h-4 w-4" /> Available balance
            </div>
            <div className="mt-2 text-4xl font-bold">${balance.toFixed(2)}</div>
            <button
              className="mt-4 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/30 disabled:opacity-50"
              disabled
              title="Withdrawals coming soon"
            >
              Request withdrawal
            </button>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Transactions</p>
            <p className="mt-2 text-3xl font-bold">{txs.length}</p>
          </div>
        </div>

        <h2 className="mt-10 mb-3 text-lg font-semibold">Transaction history</h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading…</p>
          ) : txs.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((t) => {
                  const isCredit = t.type === "credit" || t.type === "deposit" || t.type === "earning";
                  return (
                    <tr key={t.id} className="border-t border-border">
                      <td className="px-4 py-3 capitalize">
                        <span className="inline-flex items-center gap-1">
                          {isCredit ? <ArrowDownRight className="h-4 w-4 text-success" /> : <ArrowUpRight className="h-4 w-4 text-destructive" />}
                          {t.type}
                        </span>
                      </td>
                      <td className={`px-4 py-3 font-medium ${isCredit ? "text-success" : ""}`}>
                        {isCredit ? "+" : "-"}${Number(t.amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 capitalize">{t.status}</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(t.created_at).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

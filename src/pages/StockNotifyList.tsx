import { Fragment, useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/* Who is waiting on which coffee to come back.
   Nothing here sends email — that's deliberate for now. The CSV export is what
   makes this useful today: the owner can mail the list by hand the day a coffee
   returns, with no Mailchimp account involved.

   Shares TOKEN_KEY with WholesaleAdmin so one admin password covers both. */

const TOKEN_KEY = "wholesale-admin-token";

interface ProductSummary {
  productHandle: string;
  productTitle: string | null;
  count: number;
  lastSignupAt: string;
}

interface Signup {
  id: string;
  product_handle: string;
  product_title: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  source: string;
  mailchimp_status: string;
  created_at: string;
}

const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
};

/** Quote a value for CSV: double any quotes, wrap if it holds a separator. */
const csvCell = (value: string | null) => {
  const s = (value ?? "").replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
};

const StockNotifyList = () => {
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const [openHandle, setOpenHandle] = useState<string | null>(null);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Validate any stored admin token on load.
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setChecking(false);
      return;
    }
    (async () => {
      try {
        const { data } = await supabase.functions.invoke("verify-admin-password", {
          body: { token: stored },
        });
        if (data?.valid) setToken(stored);
        else localStorage.removeItem(TOKEN_KEY);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stock-notify-list", {
        body: { token, mode: "summary" },
      });
      if (error || data?.error) {
        toast({
          title: "Couldn't load",
          description: data?.error ?? "Try again",
          variant: "destructive",
        });
        setProducts([]);
      } else {
        setProducts(data?.products ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  const loadDetail = async (handle: string) => {
    if (!token) return;
    // Second click on the same row collapses it.
    if (openHandle === handle) {
      setOpenHandle(null);
      setSignups([]);
      return;
    }
    setOpenHandle(handle);
    setDetailLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stock-notify-list", {
        body: { token, mode: "detail", productHandle: handle },
      });
      if (error || data?.error) {
        toast({
          title: "Couldn't load signups",
          description: data?.error ?? "Try again",
          variant: "destructive",
        });
        setSignups([]);
      } else {
        setSignups(data?.signups ?? []);
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const exportCsv = async (handle: string, title: string | null) => {
    if (!token) return;
    const { data, error } = await supabase.functions.invoke("stock-notify-list", {
      body: { token, mode: "detail", productHandle: handle },
    });
    if (error || data?.error) {
      toast({ title: "Export failed", description: data?.error ?? "Try again", variant: "destructive" });
      return;
    }
    const rows: Signup[] = data?.signups ?? [];
    if (rows.length === 0) {
      toast({ title: "Nothing to export", description: "No signups for this coffee yet." });
      return;
    }

    const header = ["Email", "First name", "Last name", "Source", "Signed up"];
    const body = rows.map((r) =>
      [
        csvCell(r.email),
        csvCell(r.first_name),
        csvCell(r.last_name),
        csvCell(r.source),
        csvCell(r.created_at),
      ].join(","),
    );
    const csv = [header.join(","), ...body].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `back-in-stock-${handle}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const authenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(false);
    try {
      const { data, error } = await supabase.functions.invoke("verify-admin-password", {
        body: { password },
      });
      if (error || data?.error || !data?.token) {
        setAuthError(true);
        setPassword("");
      } else {
        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
      }
    } catch {
      setAuthError(true);
    } finally {
      setAuthLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <form onSubmit={authenticate} className="w-full max-w-sm space-y-4">
          <h1 className="text-2xl font-semibold text-center">Back-in-Stock List</h1>
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setAuthError(false);
            }}
            className={`w-full h-10 px-4 rounded border ${authError ? "border-red-500" : "border-input"} bg-background outline-none`}
            autoFocus
          />
          {authError && <p className="text-red-500 text-sm text-center">Incorrect password</p>}
          <button
            type="submit"
            disabled={!password || authLoading}
            className="w-full h-10 rounded bg-foreground text-background font-medium disabled:opacity-60"
          >
            {authLoading ? "Checking…" : "Enter"}
          </button>
        </form>
      </div>
    );
  }

  const totalWaiting = products.reduce((sum, p) => sum + p.count, 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Back-in-Stock List</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {totalWaiting} {totalWaiting === 1 ? "person" : "people"} waiting across{" "}
              {products.length} {products.length === 1 ? "coffee" : "coffees"}. No email is sent
              automatically yet — export the list when a coffee comes back.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => load()} className="h-9 px-4 rounded border border-input text-sm">
              Refresh
            </button>
            <button
              onClick={() => {
                localStorage.removeItem(TOKEN_KEY);
                setToken(null);
              }}
              className="h-9 px-4 rounded border border-input text-sm"
            >
              Sign out
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading list…</p>
        ) : products.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground">Nobody has signed up yet</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="p-3">Coffee</th>
                  <th className="p-3">Waiting</th>
                  <th className="p-3">Last signup</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <Fragment key={p.productHandle}>
                    <tr className="border-t align-top">
                      <td className="p-3 font-medium">
                        {p.productTitle || p.productHandle}
                        <span className="block text-xs text-muted-foreground">{p.productHandle}</span>
                      </td>
                      <td className="p-3 font-semibold">{p.count}</td>
                      <td className="p-3 whitespace-nowrap">{fmtDate(p.lastSignupAt)}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadDetail(p.productHandle)}
                            className="h-8 px-3 rounded border border-input text-xs"
                          >
                            {openHandle === p.productHandle ? "Hide" : "View"}
                          </button>
                          <button
                            onClick={() => exportCsv(p.productHandle, p.productTitle)}
                            className="h-8 px-3 rounded bg-foreground text-background text-xs"
                          >
                            Export CSV
                          </button>
                        </div>
                      </td>
                    </tr>

                    {openHandle === p.productHandle && (
                      <tr className="border-t bg-muted/20">
                        <td colSpan={4} className="p-3">
                          {detailLoading ? (
                            <p className="text-muted-foreground text-xs">Loading signups…</p>
                          ) : (
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-left text-muted-foreground">
                                  <th className="py-1">Email</th>
                                  <th className="py-1">Name</th>
                                  <th className="py-1">Source</th>
                                  <th className="py-1">Signed up</th>
                                </tr>
                              </thead>
                              <tbody>
                                {signups.map((s) => (
                                  <tr key={s.id} className="border-t">
                                    <td className="py-1">{s.email}</td>
                                    <td className="py-1">
                                      {[s.first_name, s.last_name].filter(Boolean).join(" ") || "—"}
                                    </td>
                                    <td className="py-1">
                                      {s.source === "logged_in" ? "Logged in" : "Anonymous"}
                                    </td>
                                    <td className="py-1 whitespace-nowrap">{fmtDate(s.created_at)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockNotifyList;

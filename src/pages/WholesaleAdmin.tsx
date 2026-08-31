import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface WholesaleCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  status: "pending" | "approved" | "rejected" | null;
  shopName: string;
  address: string;
  businessTaxNumber: string;
  otherBusinessNumber: string;
}

const TOKEN_KEY = "wholesale-admin-token";

const StatusBadge = ({ status }: { status: WholesaleCustomer["status"] }) => {
  const cls =
    status === "approved"
      ? "bg-green-600"
      : status === "rejected"
      ? "bg-red-600"
      : "bg-yellow-600";
  const label = status ? status[0].toUpperCase() + status.slice(1) : "—";
  return <span className={`text-white text-xs px-2 py-1 rounded ${cls}`}>{label}</span>;
};

const WholesaleAdmin = () => {
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const [customers, setCustomers] = useState<WholesaleCustomer[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

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
      const { data, error } = await supabase.functions.invoke("list-wholesale-customers", {
        body: { token, status: statusFilter },
      });
      if (error || data?.error) {
        toast({ title: "Couldn't load", description: data?.error ?? "Try again", variant: "destructive" });
        setCustomers([]);
      } else {
        setCustomers(data?.customers ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

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

  const act = async (customerId: string, action: "approve" | "reject") => {
    if (!token) return;
    setActingId(customerId);
    try {
      const { data, error } = await supabase.functions.invoke("set-wholesale-status", {
        body: { token, customerId, action },
      });
      if (error || data?.error) {
        toast({ title: "Action failed", description: data?.error ?? "Try again", variant: "destructive" });
      } else {
        if (data?.companyError) {
          toast({ title: "Approved (with warning)", description: `Company: ${data.companyError}`, variant: "destructive" });
        } else {
          toast({ title: action === "approve" ? "Approved" : "Rejected" });
        }
        await load();
      }
    } finally {
      setActingId(null);
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
          <h1 className="text-2xl font-semibold text-center">Wholesale Admin</h1>
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-3xl font-bold">Wholesale Approvals</h1>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded border border-input bg-background text-sm"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All</option>
            </select>
            <button
              onClick={() => load()}
              className="h-9 px-4 rounded border border-input text-sm"
            >
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
          <p className="text-muted-foreground">Loading applications…</p>
        ) : customers.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground">No customers found</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="p-3">Name</th>
                  <th className="p-3">Shop</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Address</th>
                  <th className="p-3">Tax #</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-t align-top">
                    <td className="p-3 font-medium whitespace-nowrap">
                      {[c.firstName, c.lastName].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="p-3">{c.shopName || "—"}</td>
                    <td className="p-3">{c.email}</td>
                    <td className="p-3 whitespace-nowrap">{c.phone || "—"}</td>
                    <td className="p-3 max-w-xs">{c.address || "—"}</td>
                    <td className="p-3">{c.businessTaxNumber || "—"}</td>
                    <td className="p-3"><StatusBadge status={c.status} /></td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          disabled={actingId === c.id || c.status === "approved"}
                          onClick={() => act(c.id, "approve")}
                          className="h-8 px-3 rounded bg-green-600 text-white text-xs disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          disabled={actingId === c.id || c.status === "rejected"}
                          onClick={() => act(c.id, "reject")}
                          className="h-8 px-3 rounded bg-red-600 text-white text-xs disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WholesaleAdmin;

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { subscribeBackInStock } from "@/lib/customerAuth";

/* Shown when someone taps "NOTIFY ME WHEN BACK IN STOCK" and the server tells
   us it doesn't know who they are (no customer session). Logged-in customers
   never see this — their email comes from the session.

   Uses the shadcn Dialog rather than a popup positioned inside the card: the
   cards live inside HorizontalPinScroll's transformed, clipped track, so an
   absolutely-positioned element would be cut off. Radix portals to the body,
   which is the same reason AnchoredMenu exists for the weight picker. */

// Keep in step with CONSENT_TEXT_VERSION in stock-notify-subscribe.
const CONSENT_COPY = "We'll email you once when it's back in stock. Unsubscribe anytime.";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productHandle: string;
  productTitle: string;
  onSubscribed: () => void;
}

const NotifyBackInStockDialog = ({
  open,
  onOpenChange,
  productHandle,
  productTitle,
  onSubscribed,
}: Props) => {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset between openings so a previous error or a half-typed address never
  // carries over to a different coffee.
  useEffect(() => {
    if (open) {
      setFirstName("");
      setEmail("");
      setError(null);
      setSaving(false);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await subscribeBackInStock({
      productHandle,
      productTitle,
      email: email.trim(),
      firstName: firstName.trim(),
      consent: true,
    });

    setSaving(false);

    if (!res.ok || res.data?.error) {
      setError(res.data?.error ?? "Something went wrong. Please try again.");
      return;
    }

    onSubscribed();
    onOpenChange(false);
  };

  const inputClass =
    "w-full h-10 px-3 rounded-full border border-ink bg-[#f5f0e6] text-[12px] font-extended text-black outline-none placeholder:text-black/40 focus:border-black";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-ink bg-[#f5f0e6] text-black">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-extended uppercase tracking-wide text-black">
            Notify me — {productTitle}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            autoComplete="given-name"
            className={inputClass}
            autoFocus
            required
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className={inputClass}
            required
          />

          <p className="text-[10px] leading-snug text-black/60">{CONSENT_COPY}</p>

          {error && <p className="text-[10px] leading-snug text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={saving || !firstName.trim() || !email.trim()}
            className="w-full h-10 rounded-full border border-ink bg-[#c9c2b2] text-[10px] font-extended uppercase tracking-wide text-black transition-colors hover:bg-[#b8b0a0] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Notify me"}
          </button>

          <p className="text-center text-[10px] text-black/50">
            Have an account?{" "}
            <a href="/login" className="underline hover:text-black">
              Log in
            </a>{" "}
            and we'll use your email.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NotifyBackInStockDialog;

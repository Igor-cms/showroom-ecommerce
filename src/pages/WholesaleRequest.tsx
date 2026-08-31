import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { getCustomer, startAuth, beginAuthRedirect, updateCustomer, registerWholesale, isProfileComplete } from "@/lib/customerAuth";
import { toast } from "@/hooks/use-toast";
import WholesaleHeader from "@/components/WholesaleHeader";
import SiteFooterBar from "@/components/SiteFooterBar";

type Mode = "request" | "update" | "setup";

interface FormState {
  first_name: string;
  last_name: string;
  shop_name: string;
  email: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  business_tax_number: string;
  other_business_number: string;
  shipping_address: string;
  message: string;
}

const empty: FormState = {
  first_name: "",
  last_name: "",
  shop_name: "",
  email: "",
  phone: "",
  country: "",
  state: "",
  city: "",
  business_tax_number: "",
  other_business_number: "",
  shipping_address: "",
  message: "",
};

const schema = z.object({
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
  shop_name: z.string().trim().min(1).max(150),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  country: z.string().trim().min(1).max(100),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  business_tax_number: z.string().trim().max(100).optional().or(z.literal("")),
  other_business_number: z.string().trim().max(100).optional().or(z.literal("")),
  shipping_address: z.string().trim().max(500).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

// Adaptive vertical rhythm so the ENTIRE form (all fields + submit) fits the
// viewport height without scrolling, even on screens shorter than the design
// target. Each value scales with viewport height (vh) and is capped at the
// original comfortable size, so tall screens look unchanged and shorter screens
// compress the spacing/sizes instead of overflowing.
/* Width matters on phones, height on desktop, so this is split across a
   breakpoint rather than folded into one expression (a nested
   clamp(min(vw,vh)) measured 7.7 on RM's 320 canvas instead of the intended 9).
   Mobile: RM sets fields at 9px on the 320 stage ⇒ 2.8125vw. Desktop keeps the
   original height-driven rule so a short screen still fits the whole form. */
const FIELD_FONT_CLASS = "text-[min(2.8125vw,12.1px)] lg:text-[clamp(13px,1.9vh,15px)]";
/* Mobile row rhythm: RM's fields sit on a 36px pitch on the 320 canvas. Applied
   as classes (not inline) so the lg rule can still win. */
const FIELD_PAD_CLASS = "py-[min(3.39vw,14.6px)] lg:py-[clamp(3px,1.1vh,12px)]";

const Field = ({
  name,
  label,
  value,
  onChange,
  type = "text",
  textarea = false,
  readOnly = false,
  grow = false,
  required = false,
}: {
  name: keyof FormState;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  textarea?: boolean;
  readOnly?: boolean;
  /** On lg, this field absorbs the leftover column height (and shrinks first) so
   *  the submit button always stays visible — used by the YOUR MESSAGE box. */
  grow?: boolean;
  /** Pins a persistent red * so required fields stay flagged even after filling
   *  (the label is a placeholder, so it disappears once the user types). */
  required?: boolean;
}) => (
  <div
    className={`relative border-b border-black px-1 ${FIELD_PAD_CLASS} ${grow ? "lg:flex-1 lg:min-h-0 lg:flex lg:flex-col" : "lg:shrink-0"}`}
  >
    {textarea ? (
      <textarea
        id={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={required ? `${label} *` : label}
        rows={3}
        readOnly={readOnly}
        style={{ fontFamily: "'Helvetica', Arial, sans-serif", fontWeight: 400, height: "clamp(52px, 11vh, 116px)" }}
        className={`w-full bg-transparent outline-none placeholder:text-black/60 resize-none lg:flex-1 lg:min-h-[40px] lg:max-h-[140px] lg:h-auto ${FIELD_FONT_CLASS}`}
      />
    ) : (
      <div className="flex items-center justify-between">
        <input
          id={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={required ? `${label} *` : label}
          readOnly={readOnly}
          style={{ fontFamily: "'Helvetica', Arial, sans-serif", fontWeight: 400 }}
          className={`flex-1 min-w-0 bg-transparent outline-none placeholder:text-black/60 ${FIELD_FONT_CLASS}`}
        />
        {required && value && (
          <span aria-hidden="true" className={`ml-2 text-black/60 leading-none ${FIELD_FONT_CLASS}`}>*</span>
        )}
      </div>
    )}
  </div>
);

// Full country list for the COUNTRY dropdown (UN members + common territories).
const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain",
  "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
  "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada",
  "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
  "Congo (Brazzaville)", "Congo (Kinshasa)", "Costa Rica", "Côte d'Ivoire", "Croatia",
  "Cuba", "Cyprus", "Czechia", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia",
  "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia",
  "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau",
  "Guyana", "Haiti", "Honduras", "Hong Kong", "Hungary", "Iceland", "India",
  "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan",
  "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein",
  "Lithuania", "Luxembourg", "Macau", "Madagascar", "Malawi", "Malaysia", "Maldives",
  "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico",
  "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique",
  "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua",
  "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan",
  "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru",
  "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa",
  "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia",
  "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands",
  "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka",
  "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan",
  "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago",
  "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine",
  "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

// COUNTRY field rendered as a dropdown that keeps the exact same row layout as the
// text Fields (border-b + placeholder look). The option list is hidden until the
// row is clicked, then closes on select or on any click outside.
const CountrySelect = ({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <div className={`relative border-b border-black px-1 lg:shrink-0 ${FIELD_PAD_CLASS}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between bg-transparent outline-none text-left ${FIELD_FONT_CLASS}`}
        style={{ fontFamily: "'Helvetica', Arial, sans-serif", fontWeight: 400 }}
      >
        <span className={value ? "" : "text-black/60"}>{value || (required ? `${label} *` : label)}</span>
      </button>

      {open && (
        <ul
          className="absolute left-0 right-0 top-full z-30 max-h-60 overflow-y-auto border border-black bg-[#efe9d7] shadow-lg"
          style={{ fontFamily: "'Helvetica', Arial, sans-serif", fontSize: "14px" }}
        >
          {COUNTRIES.map((c) => (
            <li key={c}>
              <button
                type="button"
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-black/10 ${
                  c === value ? "bg-black/5 font-bold" : ""
                }`}
              >
                {c}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default function WholesaleRequest() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const rawMode = params.get("mode");
  const mode: Mode = rawMode === "update" ? "update" : rawMode === "setup" ? "setup" : "request";

  const [form, setForm] = useState<FormState>(empty);
  const [shopifyCustomerId, setShopifyCustomerId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [prefilling, setPrefilling] = useState(mode === "update");

  /**
   * Hand back to /wholesale-copy with a REAL page load, never navigate().
   *
   * CustomerProvider resolves the customer once per page load, behind a
   * `started` latch, and /wholesale-copy reads it from that context while this
   * page reads it live from getCustomer(). After a successful update the two
   * therefore disagree: this page sees the completed profile, the gate still
   * holds the snapshot taken before the save. The gate then sends the visitor
   * back here for the fields it thinks are missing, this page finds nothing
   * missing and sends them to the gate, and they ping-pong between the two
   * pages forever — measured at dozens of round trips in a few seconds.
   *
   * Reloading re-runs the provider against the saved profile, so the gate sees
   * what was actually written and forwards to /wholesale-row. This is the same
   * reason WholesaleCopy, WholesalePending, WholesaleRejected and
   * CustomerAuthCallback all reload rather than navigate; this page was the
   * remaining exception.
   */
  const backToGate = () => {
    window.location.replace("/wholesale-copy");
  };

  useEffect(() => {
    if (mode !== "update") return;
    (async () => {
      // Email comes from EmailLookupStep via sessionStorage. Keep it there
      // so the submit handler can use it for Shopify auth.
      let lookupEmail = "";
      try {
        lookupEmail = sessionStorage.getItem("wholesale_lookup_email") ?? "";
      } catch {
        // ignore
      }

      setForm((f) => ({ ...f, email: lookupEmail || f.email }));

      // Prefill from the authenticated Shopify session. The user reaches this
      // page only AFTER confirming their Shopify login (started at the email
      // step), so the live session data is available here.
      const res = await getCustomer();
      // Update mode is only for an authenticated customer with missing fields.
      // No session (direct URL visit / expired login) -> back to the gate,
      // which walks them through password + Shopify login first.
      if (!res.ok || !res.data?.customer) {
        backToGate();
        return;
      }
      if (res.ok && res.data?.customer) {
        const c = res.data.customer;
        // Nothing missing on Shopify -> no need to show the form; go to portal.
        if (isProfileComplete(c)) {
          backToGate();
          return;
        }
        const addr = c.defaultAddress ?? null;
        const nameParts = (c.displayName ?? "").split(" ").filter(Boolean);
        const shippingParts = [addr?.address1, addr?.address2, addr?.zip]
          .map((p) => (p ?? "").trim())
          .filter(Boolean);
        setForm((f) => ({
          ...f,
          first_name: c.firstName ?? nameParts[0] ?? "",
          last_name: c.lastName ?? nameParts.slice(1).join(" ") ?? "",
          shop_name: addr?.company ?? "",
          email: lookupEmail || c.emailAddress?.emailAddress || f.email,
          phone: c.phoneNumber?.phoneNumber ?? addr?.phoneNumber ?? "",
          country: addr?.country ?? "",
          state: addr?.province ?? "",
          city: addr?.city ?? "",
          shipping_address: shippingParts.join(", "),
        }));
        setShopifyCustomerId(c.id ?? null);
      }
      setPrefilling(false);
    })();
  }, [mode]);

  const set = (k: keyof FormState) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      toast({ title: "Please complete required fields", description: first, variant: "destructive" });
      return;
    }
    if (mode === "update") {
      // Source of truth is Shopify: write the reviewed details back to the
      // authenticated customer (Admin API, via the session cookie). No Supabase.
      setSubmitting(true);
      const res = await updateCustomer({ ...parsed.data });
      setSubmitting(false);
      if (!res.ok) {
        // No active session (e.g. landed here directly / session expired):
        // start Shopify auth so they can log in, then return through the gate
        // (which re-checks completeness — the failed update was never saved).
        if (res.status === 401) {
          try {
            sessionStorage.setItem("post_login_redirect", "/wholesale-copy");
          } catch {
            // ignore
          }
          const auth = await startAuth(parsed.data.email);
          if (auth.ok && beginAuthRedirect(auth.data)) {
            return;
          }
        }
        toast({
          title: "Something went wrong",
          description: res.error ?? "Couldn't save your details. Please try again.",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Thanks!", description: "Your details have been saved." });
      backToGate();
      return;
    }

    if (mode === "setup") {
      // Register the applicant in Shopify. A brand-new email is created as a
      // pending (or pre-approved) customer. An email that ALREADY belongs to a
      // customer is NOT touched: the server returns { requiresAuth: true } and
      // writes nothing until the person proves ownership by logging in.
      setSubmitting(true);
      // The wholesale password token (set when they passed the password gate)
      // proves pre-approval, so the server registers them as approved instead
      // of pending — no admin review needed for password holders.
      let wholesaleToken = "";
      try {
        wholesaleToken = localStorage.getItem("wholesale-copy-token") ?? "";
      } catch {
        // ignore storage errors
      }
      const payload = { ...parsed.data, wholesale_token: wholesaleToken };
      const res = await registerWholesale(payload);

      // Existing customer: confirm the Shopify login BEFORE any change. Stash
      // the reviewed details so they can be applied automatically the moment
      // login is confirmed (handled on /wholesale-copy), then start auth.
      if (res.data?.requiresAuth) {
        try {
          sessionStorage.setItem("wholesale_setup_payload", JSON.stringify(payload));
          // Land on the gated portal (not the store): the applyingSetup effect on
          // /wholesale-copy applies the pending tag, then the gate shows the
          // waiting screen until an admin approves them.
          sessionStorage.setItem("post_login_redirect", "/wholesale-copy");
        } catch {
          // ignore storage errors
        }
        const auth = await startAuth(parsed.data.email);
        setSubmitting(false);
        if (auth.ok && beginAuthRedirect(auth.data)) {
          return;
        }
        toast({
          title: "Couldn't start login",
          description: "Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!res.ok || res.data?.error) {
        setSubmitting(false);
        const serverError = res.data?.error ?? res.error;
        // Shopify enforces a unique customer phone store-wide. Surface that
        // specific cause so the user knows to change the number.
        const phoneTaken =
          !!serverError &&
          /phone/i.test(serverError) &&
          /taken|already|in use/i.test(serverError);
        toast({
          title: phoneTaken
            ? "Phone number already in use"
            : "Couldn't submit your request",
          description: phoneTaken
            ? "That phone number is already registered to another account. Please use a different number."
            : serverError ?? "Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Brand-new customer created (tagged wholesale-pending). Confirm the Shopify
      // login now and send them to the GATED portal, not the store: /wholesale-copy
      // reads the live pending tag and shows the waiting screen until approval.
      try {
        sessionStorage.setItem("post_login_redirect", "/wholesale-copy");
      } catch {
        // ignore
      }
      const auth = await startAuth(parsed.data.email);
      setSubmitting(false);
      if (auth.ok && beginAuthRedirect(auth.data)) {
        return;
      }
      toast({
        title: "Request received",
        description: "We saved your request but couldn't start login. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // request (legacy fallback): record in Supabase and show the thanks page.
    setSubmitting(true);
    const { error } = await supabase.from("wholesale_requests").insert({
      mode,
      ...parsed.data,
      shopify_customer_id: shopifyCustomerId,
    } as any);
    setSubmitting(false);
    if (error) {
      toast({ title: "Something went wrong", description: error.message, variant: "destructive" });
      return;
    }
    navigate("/wholesale-request/thanks", { replace: true });
  };

  // Left-column copy varies by mode. Each array entry is one rendered title line.
  // The default "request" mode is the page the client's reference shows, so its
  // copy is Readymag's verbatim. `setup` and `update` are our own post-approval
  // flows, which the reference doesn't cover — they keep their own wording.
  const titleLines =
    mode === "setup"
      ? ["REQUEST", "WHOLESALE"]
      : mode === "update"
      ? ["WHOLESALE", "UPDATE INFO"]
      : ["WHOLESALE", "REQUEST"];
  const intro =
    mode === "setup"
      ? "TELL US ABOUT YOUR BUSINESS — WE'LL REVIEW AND APPROVE YOUR WHOLESALE ACCESS"
      : mode === "update"
      ? "CONFIRM YOUR DETAILS TO COMPLETE YOUR WHOLESALE PROFILE"
      : "REACH OUT TO GET ACCESS TO OUR WHOLESALE PORTAL / OFFERLIST";
  /* RM sets a second, right-aligned note under the headline pointing at the
     programme details further down the page. Only the request view has it. */
  const detailsNote =
    mode === "request" ? "DETAILS ABOUT OUR WHOLESALE PROGRAM ARE ON THE BOTTOM OF THIS PAGE" : null;

  return (
    <main
      className="min-h-screen bg-[#efe9d7] text-black"
      style={{ fontFamily: "'Helvetica', Arial, sans-serif" }}
    >
      {/* Fixed header — stays in place while the page scrolls. `solid` forces the
          site-standard opaque cream bar (same as Shop/Producers); without it the
          compact header is transparent and the scrolling content bleeds through. */}
      <div className="sticky top-0 z-40">
        {/* No way out to the site from the signup flow: the mark is plain
            artwork (logoHref null) and the hamburger is inert, since the menu
            it opens links to /shop, /account and the rest of the new site. */}
        <WholesaleHeader compact solid logoHref={null} disableMenu />
      </div>


      {/* Single (page) scrollbar: scrolling moves the tall left column while
          the right (form) column stays pinned via sticky. */}
      {/* Client Iteration 2 (mobile, PDF p21): the reference stacks intro →
          headline → FORM → SUBMIT → programme details → footer. Our source order
          keeps the details with the intro (they share the desktop's left column),
          so on mobile the three blocks are re-ordered with `order`; from lg they
          fall back into the original two-column grid via explicit placement. */}
      <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] lg:items-start">
        {/* Left column, part 1 — intro + headline */}
        <section className="order-1 lg:order-none lg:col-start-1 lg:row-start-1 pl-2 pr-6 pt-4 lg:pb-0 lg:border-r-2 lg:border-ink/40">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="group mb-4 inline-flex items-center gap-1.5 uppercase text-black/45 hover:text-black/70 transition-colors text-[min(2.8125vw,12.1px)] lg:text-[11px]"
            style={{ fontFamily: "'Helvetica', Arial, sans-serif", fontWeight: 400, letterSpacing: "0.02em" }}
          >
            <span aria-hidden="true" className="transition-transform group-hover:-translate-x-1">&larr;</span>
            Back
          </button>
          {/* RM mobile canvas (320): intro line is 9px/10px ⇒ 2.8125vw. */}
          <p
            className="uppercase mb-[min(3.75vw,16px)] lg:mb-10 text-[min(2.8125vw,12.1px)] leading-[min(3.125vw,13.5px)] lg:text-[14px] lg:leading-[20px]"
            style={{ fontFamily: "'Helvetica', Arial, sans-serif", fontWeight: 400 }}
          >
            {intro}
          </p>
          {/* RM mobile: 53px / -4.4px / 45px line on the 320 canvas. */}
          <h1
            className="mb-[min(6.25vw,27px)] lg:mb-10 text-[min(16.5625vw,71px)] tracking-[max(-1.375vw,-5.9px)] leading-[0.85] lg:text-[clamp(56px,6vw,144px)] lg:tracking-[-0.05em] lg:leading-[0.87]"
            style={{ fontFamily: "'Helvetica', Arial, sans-serif", fontWeight: 400 }}
          >
            {titleLines.map((line, i) => (
              <span key={i} className="block">{line}</span>
            ))}
          </h1>
          {detailsNote && (
            /* RM places this hard right, aligned to the form's right edge. */
            <p
              className="uppercase text-right ml-auto max-w-[63%] mb-[min(3.75vw,16px)] lg:mb-10
                         text-[min(2.8125vw,12.1px)] leading-[min(3.125vw,13.5px)] lg:text-[14px] lg:leading-[20px]"
              style={{ fontFamily: "'Helvetica', Arial, sans-serif", fontWeight: 400 }}
            >
              {detailsNote}
            </p>
          )}
        </section>

        {/* Left column, part 2 — programme details (below the form on mobile) */}
        <section className="order-3 lg:order-none lg:col-start-1 lg:row-start-2 pl-2 pr-6 pb-10 lg:border-r-2 lg:border-ink/40">
          {/* RM mobile: 12px BOLD (custom_75141), ls -0.4 ⇒ 3.75vw. Ours was
              24px at weight 400. */}
          <h2
            className="uppercase mb-[min(3.75vw,16px)] lg:mb-6 text-[min(3.75vw,16.1px)] lg:text-[24px] font-bold lg:font-normal tracking-[-0.4px] lg:tracking-[-0.5px]"
            style={{ fontFamily: "'Helvetica', Arial, sans-serif" }}
          >
            Wholesale Program Details
          </h2>

          {/* RM mobile body: 9px / 12px line ⇒ 2.8125vw / 3.75vw. */}
          <div
            className="space-y-[min(5vw,21px)] lg:space-y-6 text-[min(2.8125vw,12.1px)] leading-[min(3.75vw,16.1px)] lg:text-[14px] lg:leading-[19px]"
            style={{ fontFamily: "'Helvetica', Arial, sans-serif", fontWeight: 400 }}
          >
            <div>
              <p className="mb-[min(2.5vw,11px)] lg:mb-4 text-[min(2.8125vw,12.1px)] leading-[min(3.4375vw,14.8px)] lg:text-[16px] lg:leading-[20px] tracking-[-0.4px] lg:tracking-normal" style={{ fontFamily: "'Helvetica', Arial, sans-serif", fontWeight: 700 }}>1.0 &nbsp; ROASTING PERSPECTIVE / COFFEE PROGRAM</p>
              <p><strong>Roasting</strong> - Our profiles are more in line with progressive <strong>light roasting styles</strong>. We like light (yet properly developed) coffee that accentuates sweetness and clarity without tasting any roast. We collaborate at origin to decide together exactly how each new coffee should taste. Right now we are offering omni-roasted profiles which allow for easy extraction on filter or espresso. All roasts will be light and in line with a more progressive style of coffee.</p>
              <p className="mt-4"><strong>Sourcing</strong> - Although we will be showcasing coffees from Diego's coffee project - HACHI, we will also start sourcing from many other producers worldwide and futher through Colombia.</p>
              <p className="mt-4"><strong>Fresh Green</strong> - We will be roasting from Colombia, one of the only places in the world that is harvesting cherries every 15 days due to the unique microclimate. This feature of Colombian coffee growing, along with the fact that we are roasting at origin, means we will be one of extremely few roasters in the world that can offer coffee roasted within a month from when the coffee cherries were picked. This results in a much more vibrant coffee and allows the highest quality control possible.</p>
            </div>
            <div>
              <p className="mb-[min(2.5vw,11px)] lg:mb-4 text-[min(2.8125vw,12.1px)] leading-[min(3.4375vw,14.8px)] lg:text-[16px] lg:leading-[20px] tracking-[-0.4px] lg:tracking-normal" style={{ fontFamily: "'Helvetica', Arial, sans-serif", fontWeight: 700 }}>2.0 &nbsp; ROASTING & DELIVERY SCHEDULE</p>
              <p>We ship coffee within 5 business days of receiving order (if not before) and use DHL 3 day shipping for international / UPS 3 day shipping within the US (in most cases).</p>
            </div>
            <div>
              <p className="mb-[min(2.5vw,11px)] lg:mb-4 text-[min(2.8125vw,12.1px)] leading-[min(3.4375vw,14.8px)] lg:text-[16px] lg:leading-[20px] tracking-[-0.4px] lg:tracking-normal" style={{ fontFamily: "'Helvetica', Arial, sans-serif", fontWeight: 700 }}>3.0 &nbsp; ORDER MINIMUMS</p>
              <p>5kg / 12lb minimums / <strong>free shipping on orders over $500 (US) / $700 (International)</strong></p>
            </div>
            <div>
              <p className="mb-[min(2.5vw,11px)] lg:mb-4 text-[min(2.8125vw,12.1px)] leading-[min(3.4375vw,14.8px)] lg:text-[16px] lg:leading-[20px] tracking-[-0.4px] lg:tracking-normal" style={{ fontFamily: "'Helvetica', Arial, sans-serif", fontWeight: 700 }}>4.0 &nbsp; RESTING COFFEES</p>
              <p>As we are roasting light, our coffees typically need a minimum of 3-4 weeks rest before using (to taste as they should). They peak from 6-7 weeks and do not lose quality until after 8-9 weeks.</p>
            </div>
          </div>
        </section>

        {/* Right column - form: pinned below the fixed header (sticky), so the
            page's single scrollbar only moves the left column. The ~67px offset
            matches the compact header height (logo 48px + py-2 + 3px divider) so
            the whole form stays visible. */}
        <section className="order-2 lg:order-none lg:col-start-2 lg:row-start-1 lg:row-span-2 px-[min(2.8125vw,12.1px)] lg:px-0 lg:pl-2 lg:pr-0 py-[clamp(12px,3.5vh,40px)] lg:sticky lg:top-[67px] lg:self-start lg:h-[calc(100vh-67px)]">
          {prefilling ? (
            <p className="text-sm text-black/60">Loading your details…</p>
          ) : (
            <form onSubmit={submit} className="w-full lg:h-full lg:flex lg:flex-col">
              <p className="mb-1 shrink-0 uppercase leading-none text-black/60 text-[min(2.8125vw,12.1px)] lg:text-[11px]" style={{ letterSpacing: "0.02em" }}>
                <span className="text-black/60">*</span> Required
              </p>
              <Field name="first_name" label="FIRST NAME" required value={form.first_name} onChange={set("first_name")} />
              <Field name="last_name" label="LAST NAME" required value={form.last_name} onChange={set("last_name")} />
              <Field name="shop_name" label="SHOP NAME" required value={form.shop_name} onChange={set("shop_name")} />
              <Field name="email" label="EMAIL" required type="email" value={form.email} onChange={set("email")} readOnly={mode === "update"} />
              <Field name="phone" label="PHONE NUMBER" value={form.phone} onChange={set("phone")} />
              <CountrySelect label="COUNTRY" required value={form.country} onChange={set("country")} />
              <Field name="state" label="STATE / PROVINCE" value={form.state} onChange={set("state")} />
              <Field name="city" label="CITY" value={form.city} onChange={set("city")} />
              <Field name="business_tax_number" label="BUSINESS TAX # (EIN/VAT/TAX ID #/ETC.)" value={form.business_tax_number} onChange={set("business_tax_number")} />
              <Field name="other_business_number" label="OTHER BUSINESS # (EORI/USCC/ETC.) (optional)" value={form.other_business_number} onChange={set("other_business_number")} />
              <Field name="shipping_address" label="SHIPPING ADDRESS" value={form.shipping_address} onChange={set("shipping_address")} />
              <Field name="message" label="YOUR MESSAGE" textarea grow value={form.message} onChange={set("message")} />

              {/* Mobile follows the reference exactly (measured off the RM
                  widget): a full-width 13px bar on the 320 canvas — so 4.0625vw —
                  filled #BCB7A8, cream 9px text, square corners, and a 1px BLACK
                  INSET RULE, which RM draws as `box-shadow: inset 0 0 0 1px`
                  rather than a border. That hairline is what made ours read as a
                  plain block. The black pill stays on lg. */}
              <button
                type="submit"
                disabled={submitting}
                style={{ fontFamily: "'Helvetica', Arial, sans-serif" }}
                className="mt-[clamp(6px,1.6vh,24px)] mx-auto block shrink-0 w-full uppercase disabled:opacity-60
                           h-[min(4.0625vw,17.5px)] leading-[min(4.0625vw,17.5px)] text-[min(2.8125vw,12.1px)] tracking-normal
                           bg-[#BCB7A8] text-[#FFFBE4] shadow-[inset_0_0_0_1px_#000]
                           lg:w-[800px] lg:max-w-full lg:h-[clamp(36px,5vh,44px)] lg:leading-normal lg:text-[13px]
                           lg:tracking-[0.3em] lg:rounded-full lg:bg-black lg:text-[#efe9d7] lg:shadow-none"
              >
                {submitting
                  ? (mode === "update" ? "Confirming…" : "Submitting…")
                  : (mode === "update" ? "Confirm" : "Submit")}
              </button>
            </form>
          )}
        </section>
      </div>

      {/* The reference closes the page with the ©2026 / CHALLENGE THE ORDINARY /
          ⊥ bar; this page had none. NOTE: the client (PDF p5) also wants every
          footer reformatted like Contact's and recoloured to F8F5E4 — that is a
          separate pass over SiteFooterBar, which still carries the older tone. */}
      <SiteFooterBar />
    </main>
  );
}

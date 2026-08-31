import WholesaleHeader from "@/components/WholesaleHeader";

export default function WholesaleRequestThanks() {
  return (
    <main className="min-h-screen bg-[#f3eed8] text-black font-sans flex flex-col" style={{ paddingTop: "var(--site-header-h, 72px)" }}>
      {/* No way out to the site from the signup flow — see WholesaleRequest. */}
      <WholesaleHeader compact fixed solid logoHref={null} disableMenu />


      <section className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-xl w-full text-center space-y-8">
          <p className="text-[11px] tracking-widest uppercase">Wholesale</p>
          <h1 className="text-[44px] sm:text-[64px] leading-[0.95] font-black tracking-tight">
            REQUEST<br />RECEIVED
          </h1>
          <p className="text-[15px] leading-relaxed text-black/80">
            Thanks for reaching out. Our team will review your request shortly.
            Once approved, you'll receive an email with your wholesale access
            password so you can continue placing your order.
          </p>
          {/* The "Back to Native" button that stood here linked to "/" — the
              new site's home. This is the end of the signup flow: the next
              step is the approval email, not a way back into the site. */}
        </div>
      </section>
    </main>
  );
}

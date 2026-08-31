import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { CustomerProvider } from "@/contexts/CustomerContext";
import Index from "./pages/Index";
import ProtectedWholesale from "./pages/ProtectedWholesale";
import ProtectedWholesaleRow from "./pages/ProtectedWholesaleRow";
import WholesaleRowTemp from "./pages/WholesaleRowTemp";
import WholesaleCopy from "./pages/WholesaleCopy";
import WholesaleRequest from "./pages/WholesaleRequest";
import WholesaleRequestThanks from "./pages/WholesaleRequestThanks";
import WholesaleAdmin from "./pages/WholesaleAdmin";
import ProfitCalculator from "./pages/ProfitCalculator";
import CouponOrders from "./pages/CouponOrders";
import VaultApplications from "./pages/VaultApplications";
import StockNotifyList from "./pages/StockNotifyList";
import Shop from "./pages/Shop";
import Producers from "./pages/Producers";
import Podcast from "./pages/Podcast";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import CustomerLogin from "./pages/CustomerLogin";
import CustomerSignup from "./pages/CustomerSignup";
import CustomerAuthCallback from "./pages/CustomerAuthCallback";
import CustomerAccount from "./pages/CustomerAccount";
import NotFound from "./pages/NotFound";
import SiteGate from "@/components/SiteGate";

const queryClient = new QueryClient();

// No subdomain redirects: wholesale.thenativecoffeecompany.com/ renders the normal Index route.

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <CustomerProvider>
        <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<SiteGate><Index /></SiteGate>} />
              <Route path="/wholesale" element={<ProtectedWholesale />} />
              <Route path="/wholesale-copy" element={<WholesaleCopy />} />
              <Route path="/wholesale-request" element={<WholesaleRequest />} />
              <Route path="/wholesale-request/thanks" element={<WholesaleRequestThanks />} />
              <Route path="/wholesale-admin" element={<WholesaleAdmin />} />
              <Route path="/wholesale-row" element={<ProtectedWholesaleRow />} />
              <Route path="/wholesale-row-temp" element={<SiteGate title="Internal"><WholesaleRowTemp /></SiteGate>} />
              <Route path="/profit-calculator" element={<SiteGate title="Internal"><ProfitCalculator /></SiteGate>} />
              <Route path="/coupon-orders" element={<SiteGate title="Internal"><CouponOrders /></SiteGate>} />
              <Route path="/vault-applications" element={<SiteGate title="Internal"><VaultApplications /></SiteGate>} />
              <Route path="/stock-notify-list" element={<StockNotifyList />} />
              <Route path="/shop" element={<SiteGate><Shop /></SiteGate>} />
              <Route path="/producers" element={<SiteGate><Producers /></SiteGate>} />
              <Route path="/podcast" element={<SiteGate><Podcast /></SiteGate>} />
              <Route path="/blog" element={<SiteGate><Blog /></SiteGate>} />
              <Route path="/contact" element={<SiteGate><Contact /></SiteGate>} />
              <Route path="/login" element={<SiteGate><CustomerLogin /></SiteGate>} />
              <Route path="/signup" element={<SiteGate><CustomerSignup /></SiteGate>} />
              <Route path="/auth/callback" element={<CustomerAuthCallback />} />
              {/* Not gated, unlike the rest of the retail pages: this is where a
                  wholesale customer reads their own order history, and the
                  portal only shows them their latest order. It carries no site
                  header or menu, and it renders nothing without a session — a
                  signed-out visitor is sent to /login, which IS still closed —
                  so opening it exposes no part of the unreleased site. */}
              <Route path="/account" element={<CustomerAccount />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<SiteGate><NotFound /></SiteGate>} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        </CartProvider>
      </CustomerProvider>
    </QueryClientProvider>
  );
};

export default App;

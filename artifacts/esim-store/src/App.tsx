import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CurrencyProvider } from "@/lib/currency-context";
import NotFound from "@/pages/not-found";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

import Home from "@/pages/Home";
import Destinations from "@/pages/Destinations";
import DestinationDetail from "@/pages/DestinationDetail";
import Checkout from "@/pages/Checkout";
import OrderSuccess from "@/pages/OrderSuccess";
import Admin from "@/pages/Admin";
import Account from "@/pages/Account";
import EsimCard from "@/pages/EsimCard";
import ProductPage from "@/pages/ProductPage";
import ResourcesPage from "@/pages/ResourcesPage";
import OffersPage from "@/pages/OffersPage";
import HelpPage from "@/pages/HelpPage";

const queryClient = new QueryClient();

function setMeta(selector: string, attrName: string, value: string) {
  let el = document.querySelector(selector) as HTMLElement | null;
  if (!el) {
    el = document.createElement("meta");
    const m = selector.match(/\[([^=]+)="([^"]+)"\]/);
    if (m) el.setAttribute(m[1], m[2]);
    document.head.appendChild(el);
  }
  el.setAttribute(attrName, value);
}

function applyHeadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem("voltey-platform-settings") ?? "{}");
    const favicon = localStorage.getItem("voltey-logo-favicon") ?? "";

    const title = s.metaTitle || "Voltey eSIM | Global Travel eSIM for Seamless Connectivity";
    const desc  = s.metaDesc  || "Stay connected worldwide with Voltey eSIM. Enjoy fast, reliable mobile internet in any country without roaming hassle or physical SIM cards.";
    const kw    = s.metaKw    || "eSIM, travel eSIM, Voltey, global eSIM";
    const tw    = s.twHandle  || "@voltey";

    document.title = title;

    setMeta('meta[name="description"]',         "content", desc);
    setMeta('meta[name="keywords"]',            "content", kw);
    setMeta('meta[property="og:title"]',        "content", title);
    setMeta('meta[property="og:description"]',  "content", desc);
    setMeta('meta[name="twitter:title"]',       "content", title);
    setMeta('meta[name="twitter:description"]', "content", desc);
    setMeta('meta[name="twitter:site"]',        "content", tw);

    if (s.googleVerify) setMeta('meta[name="google-site-verification"]', "content", s.googleVerify);
    if (s.bingVerify)   setMeta('meta[name="msvalidate.01"]',            "content", s.bingVerify);

    if (favicon) {
      let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "icon");
        document.head.appendChild(link);
      }
      link.href = favicon;
      link.type = favicon.includes("svg") ? "image/svg+xml" : "image/png";
    }
  } catch { /* ignore */ }
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    // Disable browser's native scroll restoration so it doesn't fight us
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, left: 0 });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location]);
  return null;
}

function StoreLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {/* offset for fixed navbar (banner ~44px + nav 72px = 116px) */}
      <main className="flex-1 pt-[116px]">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/destinations" component={Destinations} />
          <Route path="/destination/:locationCode" component={DestinationDetail} />
          <Route path="/checkout/:packageCode" component={Checkout} />
          <Route path="/order/:transactionId" component={OrderSuccess} />
          <Route path="/product/:slug" component={ProductPage} />
          <Route path="/resources/:slug" component={ResourcesPage} />
          <Route path="/offers/:slug" component={OffersPage} />
          <Route path="/help/:slug" component={HelpPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  useEffect(() => {
    applyHeadSettings();
    window.addEventListener("voltey-settings-changed", applyHeadSettings);
    window.addEventListener("voltey-logo-changed",     applyHeadSettings);
    window.addEventListener("storage",                 applyHeadSettings);
    return () => {
      window.removeEventListener("voltey-settings-changed", applyHeadSettings);
      window.removeEventListener("voltey-logo-changed",     applyHeadSettings);
      window.removeEventListener("storage",                 applyHeadSettings);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <ScrollToTop />
          <Switch>
            {/* Admin — no Navbar/Footer */}
            <Route path="/admin" component={Admin} />
            {/* User account — no Navbar/Footer */}
            <Route path="/account" component={Account} />
            {/* Public eSIM card — no Navbar/Footer */}
            <Route path="/esim/:transactionId" component={EsimCard} />
            {/* Store — with Navbar/Footer */}
            <Route component={StoreLayout} />
          </Switch>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  );
}

export default App;

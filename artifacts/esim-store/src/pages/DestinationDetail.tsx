import { useListPackages, getListPackagesQueryKey } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { formatData } from "@/lib/format-utils";
import { useCurrency } from "@/lib/currency-context";
import { Skeleton } from "@/components/ui/skeleton";
import { LottieIcon } from "@/components/LottieIcon";
import {
  Minus, Plus, Star, ShieldCheck, Check, MessagesSquare,
  CircleCheck, CreditCard, Bell, Globe, ChevronRight, X as XIcon, Info,
} from "lucide-react";

/* ──────────────────────────── helpers ──────────────────────────── */
const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

function fillT(template: string, ctx: Record<string, string>): string {
  if (!template) return "";
  return template.replace(/\{(\w+)\}/g, (_, key) => ctx[key] ?? `{${key}}`);
}

function renderBold(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="text-gray-900 font-semibold">{part}</strong>
      : <span key={i}>{part}</span>
  );
}

/* ──────────────────────────── defaults ──────────────────────────── */
const DEST_PAGE_DEFAULT = {
  headingFontSize: 40,
  headingColor: "#111827",
  headingFont: "Poppins, sans-serif",
  descTemplate: "Get an eSIM card for {country} and enjoy reliable and affordable internet access on your trip.",
  descSize: 14,
  descColor: "#6b7280",
  planLabelTemplate: "Get an eSIM data plan for {country}",
  coverImageOverride: "",
  bestChoiceLabel: "Best Choice",
  creditsText: "3% in Voltey credits",
  creditsColor: "#b45309",
  activationHeading: "Can I activate my plan later?",
  activationBody: "All plans have a **30-day** activation period. If you get a plan **today** and don't activate it until {deadline}, it will be activated automatically.",
  quantityHeading: "Choose number of eSIMs",
  quantitySub: "How many travelers?",
  checkoutBtnLabel: "Go to Checkout",
  checkoutBtnBg: "#f5e642",
  compatibilityBtnLabel: "Device Compatibility",
  trustRating: "4.7",
  trustReviewCount: "97,400+",
  trustSecureLabel: "Secure Payment Guaranteed",
  descriptionTabText: "Stay connected in {country} with Voltey eSIM. Our plans are powered by top local networks and offer fast, reliable data — so you can navigate, stream, and communicate without interruption. Plans activate within minutes and can be used across {country} without any roaming charges.",
  stepsHeadingTemplate: "How to get{data} eSIM for {country}",
  stepsHeadingSize: 40,
  stepsHeadingColor: "#111827",
  steps: [
    { title: "Choose a data plan for your trip", desc: "Select your destination and buy your travel eSIM data plan. Then, download the Voltey app." },
    { title: "Set up your eSIM and enable data roaming", desc: "Set up the eSIM from your device by following instructions in the app and enable data roaming for your Voltey plan." },
    { title: "Enjoy your data", desc: "Get ready for takeoff — your data plan will activate automatically when you arrive at your destination!" },
  ] as { title: string; desc: string }[],
  whyHeadingTemplate: "Why you should get the Voltey eSIM app for {country}?",
  whyHeadingSize: 40,
  whyHeadingColor: "#111827",
  whyDesc: "Voltey's eSIM data plans include many benefits:",
  whyItems: [
    { title: "24/7 chat support", desc: "Get help whenever you need it. Our support team is ready to chat around the clock — just drop a line and they'll help you solve your issues.", iconLottie: "", iconEmoji: "" },
    { title: "Easy to use", desc: "Just download the app, install the eSIM, and get a data plan — it will activate automatically the moment you reach your destination.", iconLottie: "", iconEmoji: "" },
    { title: "One eSIM for all your trips", desc: "We offer mobile data in 200+ destinations. Add them to your existing Voltey eSIM — no need to install a new eSIM every time.", iconLottie: "", iconEmoji: "" },
    { title: "Never run out of data", desc: "Don't risk running out of data at the worst possible moment — we'll notify you when you've used up 80% of your plan.", iconLottie: "", iconEmoji: "" },
    { title: "Your security is top priority", desc: "Stay connected without sacrificing your privacy. Use Voltey's security features to change your virtual location and reduce trackers and ads.", iconLottie: "", iconEmoji: "" },
    { title: "Global and regional plans", desc: "Stay online everywhere you go — get regional or global mobile data plans and stay connected as you traverse the continents.", iconLottie: "", iconEmoji: "" },
  ] as { title: string; desc: string; iconLottie: string; iconEmoji: string }[],
  comparisonHeading: "Voltey vs. other eSIM services",
  comparisonHeadingSize: 40,
  reviewsHeading: "Why travelers choose the Voltey eSIM app",
  reviewsSubheading: "Check out what fellow travelers are saying about Voltey!",
  reviewsBg: "#eaecf4",
  faqHeading: "Frequently asked questions",
  faqHeadingSize: 36,
  faqItems: [
    { q: "What is the best eSIM for {country}?", a: "Voltey is one of the top-rated eSIMs for {country}, offering fast 4G/5G data plans, instant delivery to your email, and affordable pricing with no hidden fees." },
    { q: "After getting an eSIM, do I need to turn anything on?", a: "Once your eSIM is installed, it will activate automatically when you arrive at your destination. Just make sure mobile data is turned on and your eSIM line is selected in your phone settings." },
    { q: "Do I keep my number when using a {country} eSIM?", a: "Yes! Your primary SIM and phone number remain active. The Voltey eSIM is a separate data line — you stay reachable on your normal number while using Voltey for mobile data abroad." },
    { q: "Does Voltey detect when I arrive at my destination?", a: "Yes — your Voltey eSIM data plan activates automatically when you land, or up to 30 days after purchase, whichever comes first." },
    { q: "How do I install my Voltey eSIM?", a: "After purchasing, you'll receive a QR code by email. Open your phone's Settings → Cellular → Add eSIM, then scan the QR code. The whole process takes under 2 minutes." },
    { q: "Is the Voltey eSIM app legit?", a: "Absolutely. Voltey is a trusted eSIM provider used by millions of travelers and recommended by major publications including Lonely Planet and Forbes." },
    { q: "What is a tourist eSIM?", a: "A tourist eSIM is a short-term digital SIM designed for travelers. It gives you local data rates without needing a physical SIM swap, so you stay connected the moment you land." },
    { q: "Can I use my Voltey eSIM on multiple trips?", a: "Yes — once installed, your Voltey eSIM stays on your device. You can top up or add new destination plans for future trips without reinstalling anything." },
  ] as { q: string; a: string }[],
  referralHeading: "Refer a friend, get free Voltey credits!",
  referralDesc: "Invite your friends to use the Voltey eSIM app and get US$5.00 in Voltey credits for every successful referral.",
  referralBtnLabel: "Learn More",
  referralImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&h=600&q=85",
};

/* ──────────────── default Lucide icons per why-item index ──────────────── */
const DEFAULT_WHY_ICONS = [
  <MessagesSquare className="w-8 h-8 text-gray-900" strokeWidth={1.5} />,
  <CircleCheck className="w-8 h-8 text-gray-900" strokeWidth={1.5} />,
  <CreditCard className="w-8 h-8 text-gray-900" strokeWidth={1.5} />,
  <Bell className="w-8 h-8 text-gray-900" strokeWidth={1.5} />,
  <ShieldCheck className="w-8 h-8 text-gray-900" strokeWidth={1.5} />,
  <Globe className="w-8 h-8 text-gray-900" strokeWidth={1.5} />,
];

function WhyIcon({ item, index }: { item: { iconLottie: string; iconEmoji: string }; index: number }) {
  if (item.iconLottie) {
    return (
      <div className="mb-4">
        <LottieIcon src={item.iconLottie.startsWith("http") ? item.iconLottie : `${BASE}${item.iconLottie}`} size={40} playOnHover />
      </div>
    );
  }
  if (item.iconEmoji) {
    return <div className="mb-4 text-[36px] leading-none">{item.iconEmoji}</div>;
  }
  return <div className="mb-4">{DEFAULT_WHY_ICONS[index] ?? DEFAULT_WHY_ICONS[0]}</div>;
}

/* ──────────────────────────── info tabs ──────────────────────────── */
type InfoTab = "features" | "description" | "technical";
const INFO_TABS: { id: InfoTab; label: string }[] = [
  { id: "features",    label: "Key features" },
  { id: "description", label: "Description" },
  { id: "technical",   label: "Technical details" },
];

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function DestinationDetail() {
  const { fmt } = useCurrency();
  const { locationCode: urlParam } = useParams<{ locationCode: string }>();
  const [, setLocation] = useLocation();

  /* ── Slug resolution: urlParam may be "AL" (code) or "albania" (custom slug) ── */
  const isSlug = !!urlParam && /[a-z]/.test(urlParam);
  const [resolvedCode, setResolvedCode] = useState<string>(isSlug ? "" : (urlParam ?? ""));

  useEffect(() => {
    if (!urlParam) { setResolvedCode(""); return; }
    if (/[a-z]/.test(urlParam)) {
      let cancelled = false;
      /* Looks like a custom slug — resolve to a location code via DB */
      fetch(`${BASE}/api/content/resolve-slug/${encodeURIComponent(urlParam)}`, { cache: "no-store" })
        .then(r => r.ok ? r.json() : null)
        .then(result => {
          if (cancelled) return;
          if (result?.locationCode) {
            setResolvedCode(result.locationCode);
          } else {
            /* Slug not found and we're still on this page — go to destinations */
            if (!cancelled) setLocation("/destinations");
          }
        })
        .catch(() => { if (!cancelled) setLocation("/destinations"); });
      return () => { cancelled = true; };
    } else {
      setResolvedCode(urlParam);
    }
  }, [urlParam]);

  /* Use the resolved code (e.g. "AL") for all API calls */
  const locationCode = resolvedCode;

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const { data, isLoading } = useListPackages(
    { locationCode },
    { query: { enabled: !!locationCode, queryKey: getListPackagesQueryKey({ locationCode }) } }
  );

  const packages = data?.packages ?? [];
  const locationName = data?.locationName ?? "Destination";
  const flagUrl = packages[0]?.flagUrl;
  const relatedRegions = data?.relatedRegions ?? [];

  /* ── SEO meta tags — reactive, re-fetches when admin saves ── */
  const [seoVersion, setSeoVersion] = useState(0);
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === `voltey-seo-country-${locationCode}`) setSeoVersion(v => v + 1);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [locationCode]);

  useEffect(() => {
    if (!locationCode) return;
    let cancelled = false;
    fetch(`${BASE}/api/content/seo:country:${locationCode}`, { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(seo => {
        if (cancelled) return;
        document.title = seo?.metaTitle || (locationName !== "Destination" ? `${locationName} eSIM | Voltey` : "Voltey eSIM | Global Travel eSIM");
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute("content", seo?.metaDesc || "");
        const metaKw = document.querySelector('meta[name="keywords"]');
        if (metaKw) metaKw.setAttribute("content", seo?.metaKw || "");
        /* Apply OG image */
        let ogImg = document.querySelector<HTMLMetaElement>('meta[property="og:image"]');
        if (!ogImg) {
          ogImg = document.createElement("meta");
          ogImg.setAttribute("property", "og:image");
          document.head.appendChild(ogImg);
        }
        ogImg.setAttribute("content", seo?.ogImage || "");
        /* If URL is using the code but a custom slug is saved, redirect to slug URL.
           Guard: only fire the replace if we are still on THIS destination URL — the
           fetch is async, and by the time it resolves the user may have navigated to
           checkout; replacing the checkout entry would wipe its history state. */
        if (seo?.urlSlug && urlParam === locationCode) {
          const currentPath = window.location.pathname;
          const stillHere =
            currentPath === `/destination/${urlParam}` ||
            currentPath === `/destination/${locationCode}` ||
            currentPath === `/destination/${seo.urlSlug}`;
          if (stillHere) {
            setLocation(`/destination/${seo.urlSlug}`, { replace: true } as never);
          }
        }
      })
      .catch(() => {
        if (cancelled) return;
        if (locationName !== "Destination") document.title = `${locationName} eSIM | Voltey`;
      });
    return () => {
      cancelled = true;
      document.title = "Voltey eSIM | Global Travel eSIM";
    };
  }, [locationCode, locationName, seoVersion]);

  /* ── Admin overrides from localStorage — reactive across tabs ── */
  type PkgOverride = { enabled?: boolean; popular?: boolean; recommend?: boolean; bestValue?: boolean };
  const [overrides, setOverrides] = useState<Record<string, PkgOverride>>(() => {
    try { return JSON.parse(localStorage.getItem("voltey-pkg-overrides") ?? "{}"); }
    catch { return {}; }
  });

  /* Listen for changes made in admin tab (storage event fires in OTHER tabs) */
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "voltey-pkg-overrides") {
        try { setOverrides(JSON.parse(e.newValue ?? "{}")); }
        catch { setOverrides({}); }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* Filter out admin-disabled plans, then layer on badges */
  const visiblePackages = useMemo(
    () => packages.filter(p => overrides[p.packageCode]?.enabled !== false),
    [packages, overrides]
  );
  const pkgOv = (code: string) => overrides[code] ?? {};

  /* ── CMS ── */
  const [cms, setCms] = useState<typeof DEST_PAGE_DEFAULT>(DEST_PAGE_DEFAULT);
  const [pressHeading, setPressHeading] = useState("They talk about us");

  useEffect(() => {
    fetch(`${BASE}/api/content/home`)
      .then(r => r.json())
      .then(d => {
        const dp = d.destinationPage || {};
        setCms({
          ...DEST_PAGE_DEFAULT,
          ...dp,
          steps: dp.steps?.length ? dp.steps : DEST_PAGE_DEFAULT.steps,
          whyItems: dp.whyItems?.length ? dp.whyItems : DEST_PAGE_DEFAULT.whyItems,
          faqItems: dp.faqItems?.length ? dp.faqItems : DEST_PAGE_DEFAULT.faqItems,
        });
        setPressHeading(d.press?.heading || "They talk about us");
      })
      .catch(() => {});
  }, []);

  /* ── Best choice = highest volume (among visible plans) ── */
  const bestChoiceCode = useMemo(() => {
    if (!visiblePackages.length) return null;
    return [...visiblePackages].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))[0]?.packageCode ?? null;
  }, [visiblePackages]);

  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [infoTab, setInfoTab] = useState<InfoTab>("features");
  const [coverImageUrl, setCoverImageUrl] = useState<string>("/images/destination-bg.png");

  useEffect(() => {
    if (!locationName || locationName === "Destination") return;
    let cancelled = false;
    setCoverImageUrl("/images/destination-bg.png");
    const candidates = [`Tourism in ${locationName}`, `Geography of ${locationName}`, locationName];
    const tryNext = (index: number) => {
      if (cancelled || index >= candidates.length) return;
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(candidates[index])}`)
        .then(r => r.json())
        .then(d => {
          if (cancelled) return;
          const url: string | undefined = d?.originalimage?.source ?? d?.thumbnail?.source;
          if (url) {
            const lower = url.toLowerCase();
            const isFlag = lower.includes("flag_of") || lower.includes("coat_of_arms") || lower.includes("emblem") || lower.includes("seal_of");
            if (!isFlag) setCoverImageUrl(url); else tryNext(index + 1);
          } else tryNext(index + 1);
        })
        .catch(() => tryNext(index + 1));
    };
    tryNext(0);
    return () => { cancelled = true; };
  }, [locationName]);

  useEffect(() => {
    if (bestChoiceCode && !selectedCode) setSelectedCode(bestChoiceCode);
  }, [bestChoiceCode]);

  const effectiveSelected = (selectedCode && visiblePackages.find(p => p.packageCode === selectedCode))
    ? selectedCode : bestChoiceCode;
  const selectedPkg = visiblePackages.find(p => p.packageCode === effectiveSelected);
  const effectiveCoverImage = cms.coverImageOverride || coverImageUrl;

  const handleCheckout = () => {
    if (!selectedPkg) return;
    const from = locationCode ? `?from=${encodeURIComponent(locationCode)}` : "";
    setLocation(`/checkout/${selectedPkg.packageCode}${from}`, { state: { package: selectedPkg, quantity, locationCode } });
  };

  const activationDeadline = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  }, []);

  const headingStyle: React.CSSProperties = {
    fontSize: (cms.headingFontSize || 40),
    color: cms.headingColor || "#111827",
    fontFamily: cms.headingFont || "Poppins, sans-serif",
    lineHeight: 1.2,
  };

  return (
    <div>
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

          {/* ════ Two-column layout ════ */}
          <div className="flex gap-10 items-start">

            {/* ── Left: travel image — sticky, hidden on mobile ── */}
            <div className="shrink-0 hidden lg:block sticky" style={{ width: 420, top: 128, alignSelf: "flex-start" }}>
              <img
                src={effectiveCoverImage}
                alt={`Travel to ${locationName}`}
                className="w-full rounded-2xl object-cover"
                style={{ height: "calc(100vh - 160px)", maxHeight: 780 }}
              />
            </div>

            {/* ── Right: content ── */}
            <div className="flex-1 min-w-0">

              {/* Heading */}
              {isLoading ? (
                <div className="space-y-3 mb-6">
                  <Skeleton className="h-10 w-64" />
                  <Skeleton className="h-4 w-96" />
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {flagUrl && (
                      <img
                        src={flagUrl}
                        alt={`${locationName} flag`}
                        className="w-[44px] h-[29px] rounded-[5px] object-cover shrink-0"
                        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}
                      />
                    )}
                    <h1 style={headingStyle}>eSIM for {locationName}</h1>
                  </div>
                  <p className="leading-relaxed mb-6" style={{ maxWidth: 480, fontSize: cms.descSize || 14, color: cms.descColor || "#6b7280" }}>
                    {fillT(cms.descTemplate, { country: locationName })}
                  </p>
                </div>
              )}

              {/* Plan section label */}
              <p className="text-[15px] font-semibold text-gray-900 mb-3">
                {fillT(cms.planLabelTemplate, { country: locationName })}
              </p>

              {/* ── Plan cards grid ── */}
              {isLoading ? (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
                </div>
              ) : visiblePackages.length === 0 ? (
                <div className="py-10 text-center border rounded-xl border-gray-200 mb-5">
                  <p className="text-[14px] text-gray-400">No plans available for {locationName}.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {visiblePackages.map(pkg => {
                    const isBest     = pkg.packageCode === bestChoiceCode;
                    const isSelected = pkg.packageCode === effectiveSelected;
                    const ov         = pkgOv(pkg.packageCode);
                    const isPopular  = !!ov.popular;
                    const isRecommend= !!ov.recommend;
                    const isBestVal  = !!ov.bestValue;

                    /* Banner only shown when admin explicitly enables it — no auto-selection */
                    const banner = isBestVal   ? { label: cms.bestChoiceLabel || "Best Choice", bg: "#111" }
                      : isRecommend            ? { label: "Recommended", bg: "#0d9488" }
                      : null;

                    return (
                      <button key={pkg.packageCode} onClick={() => setSelectedCode(pkg.packageCode)} className="text-left w-full">
                        <div className="rounded-xl overflow-hidden transition-all relative" style={{ border: isSelected ? "2px solid #111" : "1.5px solid #e8e8e8", background: "#fff" }}>
                          {banner && (
                            <div className="w-full text-center text-white text-[12px] font-semibold py-1.5 tracking-wide" style={{ background: banner.bg }}>
                              {banner.label}
                            </div>
                          )}
                          <div className="p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border-2 transition-colors shrink-0" style={{ borderColor: isSelected ? "#111" : "#d1d5db", background: isSelected ? "#111" : "#fff" }}>
                                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </span>
                              {isPopular && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>
                                  <LottieIcon src="/icons/lottie/star.json" size={13} autoplay loop />
                                  Popular
                                </span>
                              )}
                            </div>
                            <p className="text-gray-900 leading-tight mb-0.5" style={{ fontSize: 16, fontWeight: 400 }}>{formatData(pkg.volume, pkg.dataType)}</p>
                            <p className="text-[13px] text-gray-500 mb-2" style={{ fontWeight: 400 }}>
                              {pkg.duration} {pkg.durationUnit === "DAY" ? (pkg.duration === 1 ? "day" : "days") : pkg.durationUnit}
                            </p>
                            <p className="text-gray-900 leading-tight mb-1.5" style={{ fontSize: 16, fontWeight: 400 }}>{fmt(pkg.retailPrice as number)}</p>
                            <div className="flex items-center gap-1">
                              <LottieIcon src="/icons/tag.json" size={13} autoplay loop />
                              <span className="text-[11px] font-medium" style={{ color: cms.creditsColor || "#b45309" }}>
                                {cms.creditsText || "3% in Voltey credits"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── Activation info box ── */}
              <div className="rounded-xl mb-5 px-4 py-3.5" style={{ background: "#f5f5f5" }}>
                <p className="text-[13px] font-semibold text-gray-900 mb-2">{cms.activationHeading}</p>
                <div className="flex items-start gap-2.5">
                  <span className="shrink-0 w-[18px] h-[18px] rounded-full border border-gray-400 flex items-center justify-center text-[10px] font-bold text-gray-500 mt-px">i</span>
                  <p className="text-[13px] text-gray-500 leading-snug">
                    {renderBold(fillT(cms.activationBody, { deadline: activationDeadline }))}
                  </p>
                </div>
              </div>

              {/* ── Quantity counter ── */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[15px] font-semibold text-gray-900 leading-snug">{cms.quantityHeading}</p>
                  <p className="text-[13px] text-gray-400">{cms.quantitySub}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:border-gray-500 transition-colors disabled:opacity-30" style={{ border: "1.5px solid #d1d5db" }}>
                    <Minus className="w-[14px] h-[14px]" strokeWidth={2} />
                  </button>
                  <span className="text-[14px] font-medium text-gray-900 min-w-[56px] text-center">{quantity} eSIM{quantity > 1 ? "s" : ""}</span>
                  <button onClick={() => setQuantity(q => Math.min(9, q + 1))} disabled={quantity >= 9} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:border-gray-500 transition-colors disabled:opacity-30" style={{ border: "1.5px solid #d1d5db" }}>
                    <Plus className="w-[14px] h-[14px]" strokeWidth={2} />
                  </button>
                </div>
              </div>

              {/* ── Go to Checkout ── */}
              <button onClick={handleCheckout} disabled={!selectedPkg || isLoading} className="w-full h-[52px] rounded-full text-[16px] font-semibold text-gray-900 transition-opacity disabled:opacity-40 mb-3" style={{ background: cms.checkoutBtnBg || "#f5e642" }}>
                {cms.checkoutBtnLabel || "Go to Checkout"}
              </button>

              {/* ── Device Compatibility ── */}
              <button className="w-full h-[52px] rounded-full text-[16px] font-semibold text-gray-900 bg-white transition-colors hover:bg-gray-50 mb-4" style={{ border: "1.5px solid #111" }}>
                {cms.compatibilityBtnLabel || "Device Compatibility"}
              </button>

              {/* ── Trust row ── */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5 mb-5">
                <span className="flex items-center gap-1.5 text-[13px] text-gray-700">
                  <Star className="w-[14px] h-[14px] fill-gray-800 text-gray-800" />
                  <span className="font-medium">{cms.trustRating || "4.7"}</span>
                  <span className="text-gray-500">({cms.trustReviewCount || "97,400+"} reviews)</span>
                </span>
                <span className="flex items-center gap-1.5 text-[13px] text-gray-700">
                  <ShieldCheck className="w-[15px] h-[15px] text-green-600" />
                  <span>{cms.trustSecureLabel || "Secure Payment Guaranteed"}</span>
                </span>
              </div>

              {/* ── Divider ── */}
              <div className="border-t border-gray-200 mb-5" />

              {/* ── Info tabs ── */}
              <div className="flex flex-wrap items-center mb-5 gap-1" style={{ border: "1.5px solid #d1d5db", borderRadius: "999px", padding: "6px 8px", width: "fit-content" }}>
                {INFO_TABS.map(tab => {
                  const active = infoTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => setInfoTab(tab.id)} className={`text-[14px] font-medium transition-colors leading-none px-3 sm:px-4 py-[7px] ${active ? "bg-gray-900 text-white rounded-full" : "text-gray-700 hover:text-gray-900"}`}>
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* ── Tab content ── */}
              {infoTab === "features" && (
                <ul className="space-y-2 pl-1">
                  {[
                    `Affordable data plans, starting from ${fmt(packages[0]?.retailPrice ?? 0)}.`,
                    `Reliable connection from ${locationName}'s best networks.`,
                    "Works with all eSIM-compatible smartphones.",
                    "Instant activation — no SIM card required.",
                    "Keep your existing number while abroad.",
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-[14px] text-gray-600">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />{item}
                    </li>
                  ))}
                </ul>
              )}
              {infoTab === "description" && (
                <p className="text-[14px] text-gray-600 leading-relaxed">
                  {fillT(cms.descriptionTabText, { country: locationName })}
                </p>
              )}
              {infoTab === "technical" && (
                <ul className="space-y-2 pl-1">
                  {[
                    "Technology: eSIM (embedded SIM)",
                    "Activation: QR code — instant delivery by email",
                    `Coverage: ${locationName}`,
                    "Network: Local carriers via ESIMAccess",
                    "Compatible: iOS 12.1+ / Android 9+ (eSIM capable devices)",
                    "Top-up: Supported on eligible plans",
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-[14px] text-gray-600">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />{item}
                    </li>
                  ))}
                </ul>
              )}

            </div>
          </div>

          {/* ════ How to get an eSIM — full-width ════ */}
          {!isLoading && packages.length > 0 && (
            <div className="mt-12 sm:mt-16 pb-12 sm:pb-16">
              <h2 className="text-gray-900 mb-6 sm:mb-8 leading-tight" style={{ fontSize: `clamp(24px, 5vw, ${cms.stepsHeadingSize || 40}px)`, color: cms.stepsHeadingColor || "#111827" }}>
                {fillT(cms.stepsHeadingTemplate, {
                  country: locationName,
                  data: selectedPkg ? ` a ${formatData(selectedPkg.volume, selectedPkg.dataType)}` : " an",
                })}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                {/* Step 1 */}
                <div className="rounded-3xl p-6 sm:p-8 flex flex-col" style={{ background: "#f3f4f6", minHeight: 340 }}>
                  <span className="text-[13px] font-medium text-gray-500 mb-5 flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: "999px", background: "#e5e7eb" }}>1</span>
                  <h3 className="text-gray-900 mb-2.5" style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.3 }}>
                    {cms.steps[0]?.title || "Choose a data plan for your trip"}
                  </h3>
                  <p className="text-[14.5px] text-gray-500 leading-relaxed mb-6">
                    {cms.steps[0]?.desc || "Select your destination and buy your travel eSIM data plan. Then, download the Voltey app."}
                  </p>
                  <div className="mt-auto bg-white rounded-2xl p-5">
                    <div className="h-3 bg-gray-100 rounded-full w-3/4 mb-2.5" />
                    <div className="h-2.5 bg-gray-100 rounded-full w-1/2 mb-5" />
                    <div className="rounded-xl p-4 flex items-center gap-3 mb-4" style={{ border: "2px solid #111" }}>
                      <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ border: "2px solid #111", background: "#111" }}>
                        <span className="w-2 h-2 rounded-full bg-white" />
                      </span>
                      <div>
                        <p className="text-[15px] font-semibold text-gray-900 leading-tight">{selectedPkg ? formatData(selectedPkg.volume, selectedPkg.dataType) : "—"}</p>
                        <p className="text-[13px] text-gray-500 mt-0.5">
                          {selectedPkg ? `${selectedPkg.duration} ${selectedPkg.durationUnit === "DAY" ? (selectedPkg.duration === 1 ? "day" : "days") : selectedPkg.durationUnit}` : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full w-2/3 mb-2" />
                    <div className="h-2.5 bg-gray-100 rounded-full w-1/2" />
                  </div>
                </div>

                {/* Step 2 */}
                <div className="rounded-3xl p-6 sm:p-8 flex flex-col" style={{ background: "#f3f4f6", minHeight: 340 }}>
                  <span className="text-[13px] font-medium text-gray-500 mb-5 flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: "999px", background: "#e5e7eb" }}>2</span>
                  <h3 className="text-gray-900 mb-2.5" style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.3 }}>
                    {cms.steps[1]?.title || "Set up your eSIM and enable data roaming"}
                  </h3>
                  <p className="text-[14.5px] text-gray-500 leading-relaxed mb-6">
                    {cms.steps[1]?.desc || "Set up the eSIM from your device by following instructions in the app and enable data roaming for your Voltey plan."}
                  </p>
                  <div className="mt-auto flex flex-col items-center py-6">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4" style={{ background: "#f5e642" }}>
                      <Check className="w-10 h-10 text-gray-900" strokeWidth={2.5} />
                    </div>
                    <p className="text-[15px] text-gray-600 font-medium">eSIM installed</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="rounded-3xl p-6 sm:p-8 flex flex-col" style={{ background: "#f3f4f6", minHeight: 340 }}>
                  <span className="text-[13px] font-medium text-gray-500 mb-5 flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: "999px", background: "#e5e7eb" }}>3</span>
                  <h3 className="text-gray-900 mb-2.5" style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.3 }}>
                    {cms.steps[2]?.title || "Enjoy your data"}
                  </h3>
                  <p className="text-[14.5px] text-gray-500 leading-relaxed mb-6">
                    {cms.steps[2]?.desc || "Get ready for takeoff — your data plan will activate automatically when you arrive at your destination!"}
                  </p>
                  <div className="mt-auto bg-white rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {flagUrl && <img src={flagUrl} alt={`${locationName} flag`} className="w-[36px] h-[24px] rounded-[4px] object-cover shrink-0" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />}
                        <span className="text-[15px] font-semibold text-gray-900">{locationName}</span>
                      </div>
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "#dcfce7", color: "#16a34a" }}>Active</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] text-gray-500">Remaining data</span>
                      <span className="text-[13px] font-semibold text-gray-800">
                        {selectedPkg ? `${formatData(selectedPkg.volume, selectedPkg.dataType)} / ${formatData(selectedPkg.volume, selectedPkg.dataType)}` : "— / —"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[13px] text-gray-500">Expires in</span>
                      <span className="text-[13px] font-semibold text-gray-800">
                        {selectedPkg ? `${selectedPkg.duration} ${selectedPkg.durationUnit === "DAY" ? "days" : selectedPkg.durationUnit}` : "—"}
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full w-full mb-2" />
                    <div className="h-2.5 bg-gray-100 rounded-full w-2/3" />
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ════ Regional plans ════ */}
          {!isLoading && relatedRegions.length > 0 && (
            <div className="pb-10 sm:pb-12">
              <h2 className="text-gray-900 mb-3 leading-tight" style={{ fontSize: "clamp(22px,4vw,40px)", fontWeight: 500, maxWidth: 600 }}>
                Get an eSIM for {locationName} with regional plans
              </h2>
              <p className="text-[14px] text-gray-500 mb-8" style={{ maxWidth: 520 }}>
                Visiting countries other than {locationName}? You may want to get an eSIM that works in multiple countries, including {locationName}.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {relatedRegions.map(region => (
                  <button key={region.locationCode} onClick={() => setLocation(`/destination/${region.locationCode}`)} className="flex items-center gap-4 text-left transition-shadow hover:shadow-md" style={{ border: "1px solid #e8e8e8", borderRadius: 16, padding: "14px 18px", background: "#fff" }}>
                    <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-100">
                      {region.isGlobal ? <span style={{ fontSize: 22 }}>🌍</span> : <img src={region.flagUrl} alt={region.locationName} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900" style={{ fontSize: 15, fontWeight: 600 }}>{region.locationName}</p>
                      <p className="text-gray-500" style={{ fontSize: 13 }}>From {fmt(region.lowestPrice)}&nbsp;·&nbsp;{region.countryCount} {region.countryCount === 1 ? "country" : "countries"}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" strokeWidth={2} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ════ Why Voltey section ════ */}
          {!isLoading && packages.length > 0 && (
            <div className="pb-20 sm:pb-32">
              <h2 className="text-gray-900 mb-3 leading-tight" style={{ fontSize: `clamp(22px,4vw,${cms.whyHeadingSize || 40}px)`, color: cms.whyHeadingColor || "#111827", maxWidth: 560 }}>
                {fillT(cms.whyHeadingTemplate, { country: locationName })}
              </h2>
              <p className="text-[14px] text-gray-500 mb-8 sm:mb-10">{cms.whyDesc}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 sm:gap-x-12 gap-y-8 sm:gap-y-10">
                {cms.whyItems.map((item, i) => (
                  <div key={i}>
                    <WhyIcon item={item} index={i} />
                    <p className="text-gray-900 mb-2" style={{ fontSize: 16, fontWeight: 700 }}>{item.title}</p>
                    <p className="text-[14px] text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════ Comparison table ════ */}
          {!isLoading && packages.length > 0 && (() => {
            type CellValue = boolean | string;
            const COMPETITORS: { name: string; color: string }[] = [
              { name: "airalo",  color: "#f97316" },
              { name: "Holafly", color: "#e8396f" },
              { name: "Nomad",   color: "#3b82f6" },
              { name: "Ubigi",   color: "#6b7280" },
            ];
            const ROWS: { label: string; info?: boolean; voltey: CellValue; comps: CellValue[] }[] = [
              { label: "One eSIM for supported destinations", info: true,  voltey: true,  comps: [false, false, false, true]  },
              { label: "24/7 live chat support",                           voltey: true,  comps: [true,  true,  true,  false] },
              { label: "Refunds",                             info: true,  voltey: true,  comps: [true,  true,  true,  true]  },
              { label: "Security features",                                voltey: true,  comps: [false, false, false, false] },
              { label: "Virtual locations",                                voltey: "115+",comps: ["0",  "0",   "0",   "0"]   },
              { label: "Blocks malicious URLs",                            voltey: true,  comps: [false, false, false, false] },
              { label: "Data saver (ad blocker)",             info: true,  voltey: true,  comps: [false, false, false, false] },
            ];
            const Cell = ({ val, dark }: { val: CellValue; dark?: boolean }) => {
              if (typeof val === "string") return <span className={dark ? "text-white" : "text-gray-900"} style={{ fontSize: 15, fontWeight: 600 }}>{val}</span>;
              return val
                ? <Check className="w-5 h-5 mx-auto" style={{ color: "#22c55e" }} strokeWidth={2.5} />
                : <XIcon className="w-4 h-4 mx-auto text-gray-300" strokeWidth={2} />;
            };
            const COL_W = 110;
            const VOLTEY_W = 150;
            return (
              <div className="pb-12 sm:pb-16">
                <h2 className="text-gray-900 mb-8 sm:mb-10 leading-tight" style={{ fontSize: `clamp(22px,4vw,${cms.comparisonHeadingSize || 40}px)` }}>
                  {cms.comparisonHeading || "Voltey vs. other eSIM services"}
                </h2>
                <div className="overflow-x-auto">
                  <div style={{ minWidth: 540, display: "grid", gridTemplateColumns: `1fr ${VOLTEY_W}px ${COL_W}px ${COL_W}px ${COL_W}px ${COL_W}px` }}>
                    <div />
                    <div className="flex flex-col items-center justify-center gap-1 py-5" style={{ background: "#111", borderRadius: "20px 20px 0 0" }}>
                      <span style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" }}>voltey</span>
                    </div>
                    {COMPETITORS.map(c => (
                      <div key={c.name} className="flex items-center justify-center py-5">
                        <span style={{ fontSize: 13, fontWeight: 700, color: c.color }}>{c.name}</span>
                      </div>
                    ))}
                    {ROWS.map((row, ri) => (
                      <div key={row.label} style={{ display: "contents" }}>
                        <div className="flex items-center gap-1.5 pr-4" style={{ borderTop: ri === 0 ? "none" : "1px solid #f3f4f6", padding: "16px 16px 16px 0" }}>
                          <span className="text-gray-700" style={{ fontSize: 13 }}>{row.label}</span>
                          {row.info && <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" strokeWidth={1.5} />}
                        </div>
                        <div className="flex items-center justify-center" style={{ background: "#111", borderTop: "1px solid #1f2937", padding: "16px 0" }}><Cell val={row.voltey} dark /></div>
                        {COMPETITORS.map((c, ci) => (
                          <div key={c.name} className="flex items-center justify-center" style={{ borderTop: ri === 0 ? "none" : "1px solid #f3f4f6", padding: "16px 0" }}><Cell val={row.comps[ci]} /></div>
                        ))}
                      </div>
                    ))}
                    <div />
                    <div className="flex items-center justify-center py-4" style={{ background: "#111", borderRadius: "0 0 20px 20px", borderTop: "1px solid #1f2937" }}>
                      <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="rounded-full text-gray-900 font-semibold transition-opacity hover:opacity-90" style={{ background: "#f5e642", fontSize: 13, padding: "8px 22px" }}>View Plans</button>
                    </div>
                    {COMPETITORS.map(c => <div key={c.name} />)}
                  </div>
                </div>
                <p className="text-gray-400 mt-6" style={{ fontSize: 12, lineHeight: 1.6, maxWidth: 640 }}>
                  *This data was taken from competitors' official English-language sites and publicly available product comparison reports. Voltey is unaffiliated with the goods or services to which it is being compared.
                </p>
              </div>
            );
          })()}

          {/* ════ Press logos bar ════ */}
          {!isLoading && packages.length > 0 && (
            <div className="py-8 sm:py-10 text-center">
              <p className="font-medium text-gray-900 mb-6 sm:mb-8 text-[22px] sm:text-[28px]">{pressHeading}</p>
              <div className="flex items-center justify-center gap-8 sm:gap-14 flex-wrap">
                <span className="flex items-center gap-1.5" style={{ color: "#006CB7", fontWeight: 700, fontSize: 15 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#006CB7" strokeWidth="2"/><ellipse cx="12" cy="12" rx="4" ry="10" stroke="#006CB7" strokeWidth="1.5"/><line x1="2" y1="12" x2="22" y2="12" stroke="#006CB7" strokeWidth="1.5"/></svg>
                  lonely planet
                </span>
                <span className="flex flex-col items-center leading-none">
                  <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", color: "#888" }}>NATIONAL</span>
                  <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.14em", color: "#1a1a1a" }}>TRAVELER</span>
                </span>
                <span style={{ color: "#00A651", fontWeight: 700, fontStyle: "italic", fontSize: 20 }}>Forbes</span>
                <span className="font-black px-2.5 py-1 rounded-[3px]" style={{ background: "#CC0000", color: "white", fontSize: 14, letterSpacing: "0.05em" }}>CNN</span>
                <span className="flex flex-col items-center leading-none">
                  <span style={{ color: "#CC0000", fontWeight: 900, fontSize: 20, lineHeight: 1 }}>PC</span>
                  <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.1em", color: "#555" }}>MAGAZINE</span>
                </span>
                <span className="flex items-center gap-0.5" style={{ color: "#1a1a1a", fontSize: 15, fontWeight: 500 }}>
                  tech<strong>radar</strong>
                  <svg width="16" height="14" viewBox="0 0 20 18" fill="none" className="ml-0.5"><path d="M3 15 Q10 2 17 15" stroke="#e02020" strokeWidth="2.2" strokeLinecap="round" fill="none"/><path d="M6 15 Q10 7 14 15" stroke="#e02020" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".7"/><circle cx="10" cy="15" r="1.8" fill="#e02020"/></svg>
                </span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ════ Reviews section — full-width bleed ════ */}
      {!isLoading && packages.length > 0 && (
        <section className="py-14 sm:py-20" style={{ background: cms.reviewsBg || "#eaecf4" }}>
          <div className="max-w-[1160px] mx-auto px-4 sm:px-8">
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="font-bold text-gray-900 mb-3 leading-tight" style={{ fontSize: "clamp(22px,4vw,2.4rem)" }}>
                {cms.reviewsHeading || "Why travelers choose the Voltey eSIM app"}
              </h2>
              <p className="text-gray-400 text-[15px]">{cms.reviewsSubheading || "Check out what fellow travelers are saying about Voltey!"}</p>
            </div>

            {/* Mobile: vertical stack; Desktop: 4-col masonry */}
            <div className="hidden lg:flex gap-4 items-start">
              {/* Col 1 */}
              <div className="flex flex-col gap-4" style={{ width: "23%" }}>
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-gray-900 text-[14px]">Jorge A.</span>
                    <div className="flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#00b67a"><path d="M12 2l2.9 8.9H23l-7.5 5.5 2.9 8.9L12 20l-7.5 5.5 2.9-8.9L0 10.9h8.1z"/></svg>
                      <span className="text-[12px] text-gray-500 font-medium">Trustpilot</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-[13px] leading-relaxed mb-4">Easy, cheap and fast. Easy step to step setup and troubleshooting, super fast speed (around 100 mbps). Cheap, great coverage and helpful chat/assistance. Keep up the good work.</p>
                  <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill="#f5a623"><path d="M12 2l2.9 8.9H23l-7.5 5.5 2.9 8.9L12 20l-7.5 5.5 2.9-8.9L0 10.9h8.1z"/></svg>)}</div>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-sm" style={{ aspectRatio: "16/9" }}>
                  <iframe src="https://www.youtube-nocookie.com/embed/P4N9Pi4QONE?rel=0&modestbranding=1&autoplay=1&mute=1&loop=1&playlist=P4N9Pi4QONE&controls=0&playsinline=1" title="Review 1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" style={{ border: 0, display: "block" }} />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-sm" style={{ aspectRatio: "9/16" }}>
                  <iframe src="https://www.youtube-nocookie.com/embed/scTiMKfRwKs?rel=0&modestbranding=1&autoplay=1&mute=1&loop=1&playlist=scTiMKfRwKs&controls=0&playsinline=1" title="Review 2" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" style={{ border: 0, display: "block" }} />
                </div>
              </div>
              {/* Col 2 */}
              <div className="flex flex-col gap-4" style={{ width: "28%" }}>
                <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col">
                  <div className="text-[4rem] leading-none text-gray-800 mb-4" style={{ fontFamily: "Georgia, serif", lineHeight: 1 }}>"</div>
                  <p className="text-[1.4rem] font-bold text-gray-900 leading-snug flex-1">Voltey is an affordable, easy-to-use, and sustainable eSIM service that gives reliable mobile and internet connections from anywhere in the world.</p>
                  <div className="mt-8 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#006CB7" strokeWidth="2"/><ellipse cx="12" cy="12" rx="4" ry="10" stroke="#006CB7" strokeWidth="1.5"/><line x1="2" y1="12" x2="22" y2="12" stroke="#006CB7" strokeWidth="1.5"/></svg>
                    <span style={{ color: "#006CB7", fontWeight: 700, fontSize: 15 }}>lonely planet</span>
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-sm" style={{ aspectRatio: "16/9" }}>
                  <iframe src="https://www.youtube-nocookie.com/embed/gG7uCskUOrA?rel=0&modestbranding=1&autoplay=1&mute=1&loop=1&playlist=gG7uCskUOrA&controls=0&playsinline=1" title="Review 3" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" style={{ border: 0, display: "block" }} />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-sm" style={{ aspectRatio: "9/16" }}>
                  <iframe src="https://www.youtube-nocookie.com/embed/jNQXAC9IVRw?rel=0&modestbranding=1&autoplay=1&mute=1&loop=1&playlist=jNQXAC9IVRw&controls=0&playsinline=1" title="Review 4" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" style={{ border: 0, display: "block" }} />
                </div>
              </div>
              {/* Col 3 */}
              <div className="flex flex-col gap-4" style={{ width: "23%" }}>
                <div className="rounded-2xl overflow-hidden shadow-sm" style={{ aspectRatio: "9/16" }}>
                  <iframe src="https://www.youtube-nocookie.com/embed/7Q-k8zVG8sI?rel=0&modestbranding=1&autoplay=1&mute=1&loop=1&playlist=7Q-k8zVG8sI&controls=0&playsinline=1" title="Review 5" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" style={{ border: 0, display: "block" }} />
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-gray-900 text-[14px]">Domas R.</span>
                    <div className="flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#00b67a"><path d="M12 2l2.9 8.9H23l-7.5 5.5 2.9 8.9L12 20l-7.5 5.5 2.9-8.9L0 10.9h8.1z"/></svg>
                      <span className="text-[12px] text-gray-500 font-medium">Trustpilot</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-[13px] leading-relaxed mb-4">Awesome — used Voltey across 3 countries already (UK, Netherlands and Belgium). Took me like 1min to buy eSIM and activate it. My internet was way better than my friends' who remained connected to their local providers.</p>
                  <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill="#f5a623"><path d="M12 2l2.9 8.9H23l-7.5 5.5 2.9 8.9L12 20l-7.5 5.5 2.9-8.9L0 10.9h8.1z"/></svg>)}</div>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-sm" style={{ aspectRatio: "16/9" }}>
                  <iframe src="https://www.youtube-nocookie.com/embed/BQ0mxQXmLsk?rel=0&modestbranding=1&autoplay=1&mute=1&loop=1&playlist=BQ0mxQXmLsk&controls=0&playsinline=1" title="Review 6" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" style={{ border: 0, display: "block" }} />
                </div>
              </div>
              {/* Col 4 */}
              <div className="flex flex-col gap-4 flex-1">
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-4">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 5 3.6 9.7 8 11 4.4-1.3 8-6 8-11V6L12 2z" fill="#111" opacity=".9"/><path d="M9 12l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span className="font-bold text-gray-900 text-[14px] tracking-tight">cybernews<span className="text-gray-400 font-normal text-[11px]">°</span></span>
                  </div>
                  <p className="text-gray-600 text-[13px] leading-relaxed">With comprehensive coverage and affordable prices, Voltey is the best eSIM for Europe. Activating Voltey is straightforward. Download the app, choose your plan, and surf the internet.</p>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-sm" style={{ aspectRatio: "9/16" }}>
                  <iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&autoplay=1&mute=1&loop=1&playlist=dQw4w9WgXcQ&controls=0&playsinline=1" title="Review 7" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" style={{ border: 0, display: "block" }} />
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-4">
                    <span className="font-bold text-gray-900 text-[15px] tracking-tight">techradar</span>
                    <svg width="16" height="14" viewBox="0 0 20 18" fill="none"><path d="M3 15 Q10 2 17 15" stroke="#e02020" strokeWidth="2.2" strokeLinecap="round" fill="none"/><path d="M6 15 Q10 7 14 15" stroke="#e02020" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".7"/><circle cx="10" cy="15" r="1.8" fill="#e02020"/></svg>
                  </div>
                  <p className="text-gray-600 text-[13px] leading-relaxed">As a product backed by the reputable NordVPN brand, Voltey benefits from the company's focus on security and privacy. Users praise its easy installation, affordable pricing, and reliable coverage worldwide.</p>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-sm" style={{ aspectRatio: "16/9" }}>
                  <iframe src="https://www.youtube-nocookie.com/embed/9bZkp7q19f0?rel=0&modestbranding=1&autoplay=1&mute=1&loop=1&playlist=9bZkp7q19f0&controls=0&playsinline=1" title="Review 8" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" style={{ border: 0, display: "block" }} />
                </div>
              </div>
            </div>

            {/* Mobile reviews: 2-col cards */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-900 text-[14px]">Jorge A.</span>
                  <div className="flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="#00b67a"><path d="M12 2l2.9 8.9H23l-7.5 5.5 2.9 8.9L12 20l-7.5 5.5 2.9-8.9L0 10.9h8.1z"/></svg><span className="text-[11px] text-gray-500">Trustpilot</span></div>
                </div>
                <p className="text-gray-600 text-[13px] leading-relaxed mb-3">Easy, cheap and fast. Super fast speed (around 100 mbps). Cheap, great coverage and helpful chat/assistance.</p>
                <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="#f5a623"><path d="M12 2l2.9 8.9H23l-7.5 5.5 2.9 8.9L12 20l-7.5 5.5 2.9-8.9L0 10.9h8.1z"/></svg>)}</div>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-900 text-[14px]">Domas R.</span>
                  <div className="flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="#00b67a"><path d="M12 2l2.9 8.9H23l-7.5 5.5 2.9 8.9L12 20l-7.5 5.5 2.9-8.9L0 10.9h8.1z"/></svg><span className="text-[11px] text-gray-500">Trustpilot</span></div>
                </div>
                <p className="text-gray-600 text-[13px] leading-relaxed mb-3">Awesome — used Voltey across 3 countries. Took me like 1min to buy and activate it. My internet was way better than my friends' who used roaming.</p>
                <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="#f5a623"><path d="M12 2l2.9 8.9H23l-7.5 5.5 2.9 8.9L12 20l-7.5 5.5 2.9-8.9L0 10.9h8.1z"/></svg>)}</div>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm sm:col-span-2">
                <p className="text-[1.1rem] font-bold text-gray-900 leading-snug mb-4">"Voltey is an affordable, easy-to-use, and sustainable eSIM service that gives reliable mobile and internet connections from anywhere in the world."</p>
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#006CB7" strokeWidth="2"/><ellipse cx="12" cy="12" rx="4" ry="10" stroke="#006CB7" strokeWidth="1.5"/><line x1="2" y1="12" x2="22" y2="12" stroke="#006CB7" strokeWidth="1.5"/></svg>
                  <span style={{ color: "#006CB7", fontWeight: 700, fontSize: 14 }}>lonely planet</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ════ FAQ ════ */}
      {!isLoading && packages.length > 0 && (
        <section className="py-14 sm:py-20 bg-white">
          <div className="max-w-[900px] mx-auto px-4 sm:px-8">
            <h2 className="font-bold text-gray-900 text-center mb-8 sm:mb-10 leading-tight" style={{ fontSize: `clamp(20px,4vw,${cms.faqHeadingSize || 36}px)` }}>
              {cms.faqHeading || "Frequently asked questions"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cms.faqItems.map((item, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={i} className={`rounded-xl border cursor-pointer transition-all duration-200 ${isOpen ? "border-gray-900" : "border-gray-200 hover:border-gray-300"}`} onClick={() => setOpenFaq(isOpen ? null : i)}>
                    <div className="flex items-center justify-between px-5 py-4 gap-4">
                      <span className="text-[15px] text-gray-900 leading-snug font-normal">{fillT(item.q, { country: locationName })}</span>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                        <path d="M3 6l5 5 5-5" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    {isOpen && <div className="px-5 pb-5"><p className="text-[14px] text-gray-500 leading-relaxed">{fillT(item.a, { country: locationName })}</p></div>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ════ Referral banner ════ */}
      {!isLoading && packages.length > 0 && (
        <section className="relative w-full overflow-hidden flex items-center justify-center" style={{ height: 320, minHeight: 240 }}>
          <img src={cms.referralImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&h=600&q=85"} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
          <div className="absolute inset-0" style={{ background: "rgba(30,60,90,0.25)" }} />
          <div className="relative z-10 flex flex-col items-center text-center px-6 sm:px-16 py-10 sm:py-12 rounded-2xl w-full" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.25)", maxWidth: "90%" }}>
            <h2 className="font-bold text-white leading-tight mb-3" style={{ fontSize: "clamp(18px,4vw,2rem)" }}>
              {cms.referralHeading || "Refer a friend, get free Voltey credits!"}
            </h2>
            <p className="text-white/85 text-[14px] sm:text-[15px] leading-relaxed mb-6 max-w-md">
              {cms.referralDesc || "Invite your friends to use the Voltey eSIM app and get US$5.00 in Voltey credits for every successful referral."}
            </p>
            <button className="px-6 sm:px-8 py-3 rounded-full text-[15px] font-medium text-white transition-colors hover:bg-white/20" style={{ border: "1.5px solid rgba(255,255,255,0.7)" }}>
              {cms.referralBtnLabel || "Learn More"}
            </button>
          </div>
        </section>
      )}

      {/* ════ Sticky bottom bar ════ */}
      {!isLoading && selectedPkg && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white flex items-center justify-between px-4 sm:px-8" style={{ height: 68, borderTop: "1px solid #e5e7eb" }}>
          <div className="flex items-center gap-2.5">
            {flagUrl && <img src={flagUrl} alt={`${locationName} flag`} className="w-[32px] h-[21px] rounded-[3px] object-cover shrink-0" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />}
            <span className="text-[13px] sm:text-[14px] font-semibold text-gray-900 hidden sm:block">eSIM for {locationName}</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-[13px] sm:text-[14px] font-semibold text-gray-900">
            <span>{formatData(selectedPkg.volume, selectedPkg.dataType)}</span>
            <span className="text-gray-400 font-normal hidden sm:block">{selectedPkg.duration} {selectedPkg.durationUnit === "DAY" ? "days" : selectedPkg.durationUnit}</span>
            <span>{fmt(selectedPkg.retailPrice as number)}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 disabled:opacity-30 transition-colors hover:bg-gray-100" style={{ border: "1px solid #d1d5db" }}>
                <Minus className="w-3 h-3" strokeWidth={2} />
              </button>
              <span className="text-[13px] font-medium text-gray-900 w-12 text-center">{quantity} eSIM{quantity > 1 ? "s" : ""}</span>
              <button onClick={() => setQuantity(q => Math.min(9, q + 1))} disabled={quantity >= 9} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 disabled:opacity-30 transition-colors hover:bg-gray-100" style={{ border: "1px solid #d1d5db" }}>
                <Plus className="w-3 h-3" strokeWidth={2} />
              </button>
            </div>
            <button onClick={handleCheckout} className="h-10 px-5 sm:px-6 rounded-full text-[14px] font-semibold text-gray-900 transition-opacity" style={{ background: cms.checkoutBtnBg || "#f5e642" }}>
              {cms.checkoutBtnLabel || "Go to Checkout"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

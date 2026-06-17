import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useListDestinations } from "@workspace/api-client-react";
import { useCurrency } from "@/lib/currency-context";
import {
  X, Search, Globe, ChevronDown, User, Menu, ChevronRight, CircleDollarSign,
} from "lucide-react";
import { LottieIcon } from "@/components/LottieIcon";

/* ─────────────────────────────────────────────────
   Language data
───────────────────────────────────────────────── */
const LANGUAGES = [
  { code: "EN", label: "English",    flag: "🇬🇧" },
  { code: "ES", label: "Español",    flag: "🇪🇸" },
  { code: "FR", label: "Français",   flag: "🇫🇷" },
  { code: "DE", label: "Deutsch",    flag: "🇩🇪" },
  { code: "IT", label: "Italiano",   flag: "🇮🇹" },
  { code: "PT", label: "Português",  flag: "🇵🇹" },
  { code: "JA", label: "日本語",      flag: "🇯🇵" },
  { code: "ZH", label: "中文",        flag: "🇨🇳" },
  { code: "KO", label: "한국어",      flag: "🇰🇷" },
  { code: "AR", label: "العربية",    flag: "🇸🇦" },
];

/* ─────────────────────────────────────────────────
   Types
───────────────────────────────────────────────── */
type MenuItem = {
  icon: string;
  label: string;
  badge?: string;
  desc: string;
  href?: string;
};
type MenuCol     = { heading: string; items: MenuItem[] };
type ExploreSlide = { img: string; title: string; desc: string };
type BottomBar   = { question: string; cta: string; ctaHref: string };
type MegaMenu    = { cols: MenuCol[]; slides: ExploreSlide[]; bottom: BottomBar };

/* ─────────────────────────────────────────────────
   Mega-menu content
───────────────────────────────────────────────── */
const MENUS: Record<string, MegaMenu> = {
  Product: {
    cols: [
      {
        heading: "Features",
        items: [
          { icon: "/icons/lottie/call.json",          label: "Phone Number",      badge: "New", desc: "Call, text, and receive calls with a US phone number.",  href: "/destinations" },
          { icon: "/icons/lottie/magic-star.json",    label: "Ultra Plan",        badge: "New", desc: "Your all-in-one premium travel plan.",                   href: "/destinations" },
          { icon: "/icons/bag.json",                  label: "eSIM for Business", badge: "New", desc: "All team data plans in one dashboard.",                  href: "/destinations" },
          { icon: "/icons/security-card.json",        label: "Security Features",              desc: "Keep your data safe and private.",                       href: "/destinations" },
        ],
      },
      {
        heading: "Tools",
        items: [
          { icon: "/icons/chart.json", label: "Data Usage Calculator", desc: "Estimate your data usage.",                         href: "/destinations" },
          { icon: "/icons/cpu.json",   label: "eSIM Compatibility",    desc: "Find out if your device is eSIM compatible.",       href: "/destinations" },
        ],
      },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&q=80", title: "eSIM for Business",           desc: "Manage all your team's eSIM plans." },
      { img: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500&q=80", title: "Instant eSIM Activation",     desc: "Connected in under 2 minutes, anywhere." },
      { img: "https://images.unsplash.com/photo-1563986768711-b3bde3dc821e?w=500&q=80", title: "Security Features",           desc: "Your data stays safe with Voltey." },
    ],
    bottom: { question: "What is an eSIM?", cta: "Browse All Plans", ctaHref: "/destinations" },
  },

  Resources: {
    cols: [
      {
        heading: "",
        items: [
          { icon: "/icons/lottie/book open.json",      label: "What is an eSIM?",    desc: "Discover how an eSIM works and why it's useful.",              href: "/destinations" },
          { icon: "/icons/note-text.json",              label: "Blog",                desc: "Read articles, guides, and product updates.",                  href: "/destinations" },
          { icon: "/icons/people.json",                 label: "About Us",            desc: "Learn more about who we are and what we do.",                  href: "/destinations" },
          { icon: "/icons/lottie/global refresh.json",  label: "Press Area",          desc: "The latest news, insights, and brand assets.",                 href: "/destinations" },
        ],
      },
      {
        heading: "",
        items: [
          { icon: "/icons/lottie/profile-2user.json",   label: "Affiliate Program",                desc: "Partner with Voltey and earn commissions.",                href: "/destinations" },
          { icon: "/icons/lottie/camera.json",          label: "Creators Program",   badge: "New", desc: "Promote Voltey and get paid for every referral.",          href: "/destinations" },
          { icon: "/icons/lottie/award.json",           label: "Voltey Reviews",                   desc: "Find out what people are saying about us!",               href: "/destinations" },
          { icon: "/icons/bag.json",                    label: "Careers",                          desc: "Explore open roles and join the team.",                    href: "/destinations" },
        ],
      },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1529119368496-2dfda6ec2804?w=500&q=80", title: "Data Usage Calculator",       desc: "Find out how much data you'll need on your trip." },
      { img: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=500&q=80", title: "What is an eSIM?",            desc: "Discover how eSIM technology works." },
      { img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&q=80", title: "Voltey Creator Program",      desc: "Share Voltey and earn on every referral." },
    ],
    bottom: { question: "Is your device eSIM compatible?", cta: "Check Compatibility", ctaHref: "/destinations" },
  },

  Offers: {
    cols: [
      {
        heading: "",
        items: [
          { icon: "/icons/user-add.json",               label: "Refer a Friend",            desc: "Share Voltey with friends and earn rewards.",                  href: "/destinations" },
          { icon: "/icons/lottie/discount circle.json", label: "Student Discount",          desc: "Save more with special pricing for students.",                 href: "/destinations" },
          { icon: "/icons/lottie/heart.json",           label: "Voltey for Nonprofit",      desc: "Apply for discounted eSIM data plans for nonprofits.",         href: "/destinations" },
        ],
      },
      {
        heading: "",
        items: [
          { icon: "/icons/ticket.json",                        label: "Voltey Vouchers",              desc: "Get a Voltey voucher, use within 12 months.",              href: "/destinations" },
          { icon: "/icons/tag.json",                           label: "Voltey Coupons",               desc: "Get the best deals and save on eSIM data!",               href: "/destinations" },
          { icon: "/icons/lottie/crown.json",                  label: "Tournament eSIM Deal",         desc: "Save on mobile data for host-country travel.",             href: "/destinations" },
        ],
      },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80", title: "Security Features",           desc: "Discover Voltey's built-in digital protection." },
      { img: "https://images.unsplash.com/photo-1563986768494-4759ab23173a?w=500&q=80", title: "Refer & Earn",                desc: "Share Voltey and earn up to US$100 in rewards." },
      { img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&q=80",   title: "Student Discount",            desc: "Special pricing for students worldwide." },
    ],
    bottom: { question: "What is an eSIM?", cta: "See All Offers", ctaHref: "/destinations" },
  },

  Help: {
    cols: [
      {
        heading: "",
        items: [
          { icon: "/icons/category.json",       label: "Getting Started", desc: "A quick guide to using the Voltey eSIM app.",          href: "/destinations" },
          { icon: "/icons/lottie/book.json",    label: "Help Center",     desc: "Browse guides and support resources.",                 href: "/destinations" },
          { icon: "/icons/setting.json",        label: "Troubleshooting", desc: "Fix common issues with step-by-step help.",            href: "/destinations" },
        ],
      },
      {
        heading: "",
        items: [
          { icon: "/icons/message.json", label: "FAQ", desc: "Find answers to the most common questions about Voltey.", href: "/destinations" },
        ],
      },
    ],
    slides: [
      { img: "https://images.unsplash.com/photo-1529119368496-2dfda6ec2804?w=500&q=80", title: "Data Usage Calculator",       desc: "Find out how much data you'll need on your trip." },
      { img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&q=80",   title: "24/7 Customer Support",       desc: "We're here whenever you need us." },
      { img: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=500&q=80",   title: "Easy Refund Policy",          desc: "Unused plans? We've got you covered." },
    ],
    bottom: { question: "What is an eSIM?", cta: "Contact Support", ctaHref: "/destinations" },
  },
};

const NAV_ITEMS_DEFAULT = ["Product", "Resources", "Offers", "Help"] as const;
type NavItem = string;

const BASE_API = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

/* ─────────────────────────────────────────────────
   Top-10 curated destination codes (matches Saily)
───────────────────────────────────────────────── */
const TOP10_CODES = ["ES", "GR", "IT", "TR", "GB", "PT", "FR", "DE", "NL", "CA"];

function getCategory(code: string): "country" | "region" | "global" {
  if (code.startsWith("GL-")) return "global";
  if (/^[A-Z]{2}$/.test(code)) return "country";
  return "region";
}

/* ─────────────────────────────────────────────────
   Navbar
───────────────────────────────────────────────── */
function getNavUser(): { name: string; email: string } | null {
  const s = sessionStorage.getItem("voltey-user-session") || localStorage.getItem("voltey-user-session");
  return s ? JSON.parse(s) as { name: string; email: string } : null;
}

export function Navbar() {
  const [location] = useLocation();
  const [bannerOpen, setBannerOpen]   = useState(true);
  const [activeMenu, setActiveMenu]   = useState<NavItem | null>(null);
  const [destOpen, setDestOpen]       = useState(false);
  const [langOpen, setLangOpen]       = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [activeLang, setActiveLang]   = useState("EN");
  const [scrolled, setScrolled]       = useState(false);
  const [navUser, setNavUser]         = useState(getNavUser);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const isHome = location === "/";
  const { currencies, selected, setCode: setCurrencyCode, fmt } = useCurrency();

  /* ── CMS state (populated from /api/content/header) ── */
  const [navItems,   setNavItems]   = useState<string[]>([...NAV_ITEMS_DEFAULT]);
  const [menus,      setMenus]      = useState<Record<string, MegaMenu>>(MENUS);
  const [navBadges,  setNavBadges]  = useState<Record<string, string>>({ Product: "New" });
  const [cmsBanner,  setCmsBanner]  = useState<{ text: string; linkLabel: string; linkHref: string } | null>(null);
  const [bannerEnabled, setBannerEnabled] = useState(true);

  useEffect(() => {
    fetch(`${BASE_API}/api/content/header`)
      .then(r => r.ok ? r.json() : null)
      .then((d: Record<string, unknown> | null) => {
        if (!d) return;
        const entries = d.navEntries as Array<{ label: string; badge: string; megaMenu: MegaMenu }> | undefined;
        if (entries?.length) {
          const items: string[] = [];
          const m: Record<string, MegaMenu> = {};
          const badges: Record<string, string> = {};
          for (const entry of entries) {
            items.push(entry.label);
            m[entry.label] = { cols: entry.megaMenu.cols, slides: entry.megaMenu.slides, bottom: entry.megaMenu.bottom };
            if (entry.badge) badges[entry.label] = entry.badge;
          }
          setNavItems(items);
          setMenus(m);
          setNavBadges(badges);
        }
        if (typeof d.topBannerEnabled === "boolean") setBannerEnabled(d.topBannerEnabled);
        if (d.topBannerText || d.topBannerLinkLabel) {
          setCmsBanner({
            text: String(d.topBannerText ?? ""),
            linkLabel: String(d.topBannerLinkLabel ?? "Learn More"),
            linkHref: String(d.topBannerLinkHref ?? "#"),
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 10); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
        setDestOpen(false);
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setActiveMenu(null);
    setDestOpen(false);
    setLangOpen(false);
    setMobileMenuOpen(false);
  }, [location]);

  const readLogos = useCallback(() => ({
    platform: localStorage.getItem("voltey-logo-platform") ?? "",
    white:    localStorage.getItem("voltey-logo-white")    ?? "",
  }), []);

  const [customLogos, setCustomLogos] = useState(readLogos);

  useEffect(() => {
    const handler = () => setCustomLogos(readLogos());
    window.addEventListener("voltey-logo-changed", handler);
    return () => window.removeEventListener("voltey-logo-changed", handler);
  }, [readLogos]);

  function toggle(item: NavItem) {
    setDestOpen(false);
    setLangOpen(false);
    setActiveMenu((prev) => (prev === item ? null : item));
  }

  function toggleDest() {
    setActiveMenu(null);
    setLangOpen(false);
    setDestOpen((prev) => !prev);
  }

  function toggleLang() {
    setActiveMenu(null);
    setDestOpen(false);
    setLangOpen((prev) => !prev);
  }

  const anyOpen = activeMenu !== null || destOpen || langOpen || mobileMenuOpen;

  return (
    <div className="fixed top-0 left-0 right-0 z-50" ref={navRef}>

      {/* ── Announcement Banner ── */}
      {bannerOpen && bannerEnabled && (
        <div className="bg-[#111] text-white text-[13.5px] py-[11px] px-4 flex items-center justify-center relative">
          <div className="flex items-center gap-2">
            <LottieIcon src="/icons/people.json" size={16} autoplay loop />
            <span>{cmsBanner ? cmsBanner.text : "Rewards sprint: Refer friends, earn up to US$100 in gift cards and Voltey credits!"}</span>
            <button className="ml-1 border border-white/50 text-white text-[12px] font-semibold px-3.5 py-[5px] rounded-full hover:bg-white/10 transition-colors whitespace-nowrap">
              {cmsBanner ? cmsBanner.linkLabel : "Learn More"}
            </button>
          </div>
          <button
            onClick={() => setBannerOpen(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>
      )}

      {/* ── Main Navbar ── */}
      <nav className={`transition-all duration-200 ${isHome && !anyOpen && !scrolled ? "bg-transparent" : "bg-white border-b border-gray-200 shadow-sm"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-[72px] flex items-center">

          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity shrink-0">
            <img
              src={
                isHome && !anyOpen && !scrolled
                  ? (customLogos.white    || "/logo-green.png")
                  : (customLogos.platform || "/logo-dark.png")
              }
              alt="Voltey"
              className="h-[30px] w-auto"
            />
          </Link>

          {/* Nav items */}
          <div className="hidden md:flex items-center gap-0.5 ml-auto text-[15px] font-medium text-gray-800">
            {navItems.map((item) => {
              const open = activeMenu === item;
              const badge = navBadges[item];
              return (
                <button
                  key={item}
                  onClick={() => toggle(item)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg transition-colors ${
                    open ? "text-gray-900" : "hover:bg-gray-900/5 text-gray-800"
                  }`}
                >
                  {item}
                  {badge && (
                    <span className="inline-flex items-center rounded-full bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 leading-none">
                      {badge}
                    </span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                  />
                </button>
              );
            })}

            {/* Destinations search pill */}
            <button
              onClick={toggleDest}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[14.5px] font-medium transition-colors ml-3 ${
                destOpen
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 text-gray-800 hover:bg-gray-900/5"
              }`}
            >
              <Search className="w-[15px] h-[15px]" />
              Destinations
            </button>

            {/* My Account */}
            <Link
              href="/account"
              className="flex items-center gap-2 rounded-full border px-4 py-2 text-[14.5px] font-medium transition-colors ml-1.5 border-gray-300 text-gray-900 hover:bg-gray-900/5"
              onClick={() => setNavUser(getNavUser())}
            >
              {navUser ? (
                <>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                    style={{ background: "#22c55e" }}>
                    {navUser.name.slice(0, 1).toUpperCase()}
                  </div>
                  {navUser.name.split(" ")[0]}
                </>
              ) : (
                <>
                  <User className="w-[15px] h-[15px]" />
                  Sign In
                </>
              )}
            </Link>

            {/* Currency selector */}
            <div className="relative ml-1.5">
              <button
                onClick={() => { setCurrencyOpen(v => !v); setLangOpen(false); }}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-[13.5px] font-semibold transition-colors ${
                  currencyOpen
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 text-gray-800 hover:bg-gray-900/5"
                }`}
              >
                <CircleDollarSign className="w-[14px] h-[14px]" />
                {selected.code}
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${currencyOpen ? "rotate-180" : "text-gray-600"}`} />
              </button>
              {currencyOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] bg-white rounded-2xl shadow-xl border border-gray-100 py-2 w-56 z-50 max-h-72 overflow-y-auto">
                  {currencies.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => { setCurrencyCode(c.code); setCurrencyOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13.5px] transition-colors hover:bg-gray-50 ${
                        selected.code === c.code ? "font-semibold text-gray-900" : "font-normal text-gray-700"
                      }`}
                    >
                      <span className="w-6 text-center font-bold text-gray-500 text-[14px] shrink-0">{c.symbol}</span>
                      <span className="font-mono text-[12px] text-gray-500 shrink-0">{c.code}</span>
                      <span className="flex-1 text-left text-[13px]">{c.name}</span>
                      {selected.code === c.code && <span className="w-2 h-2 rounded-full bg-gray-900 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language selector */}
            <div className="relative ml-1.5">
              <button
                onClick={toggleLang}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[14.5px] font-medium transition-colors ${
                  langOpen
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 text-gray-800 hover:bg-gray-900/5"
                }`}
              >
                <Globe className="w-[15px] h-[15px]" />
                {activeLang}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${langOpen ? "rotate-180" : "text-gray-600"}`} />
              </button>

              {/* Language dropdown */}
              {langOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] bg-white rounded-2xl shadow-xl border border-gray-100 py-2 w-48 z-50">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setActiveLang(lang.code); setLangOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-[14px] transition-colors hover:bg-gray-50 ${
                        activeLang === lang.code ? "font-semibold text-gray-900" : "font-normal text-gray-700"
                      }`}
                    >
                      <span className="text-[18px] leading-none">{lang.flag}</span>
                      <span className="flex-1 text-left">{lang.label}</span>
                      {activeLang === lang.code && (
                        <span className="w-2 h-2 rounded-full bg-gray-900 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Hamburger button (mobile only) ── */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="ml-auto md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            style={{ color: isHome && !anyOpen && !scrolled ? "white" : "#1a1a1a" }}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* ── Mobile Menu ── */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 shadow-lg">
          <div className="px-4 py-3 space-y-0.5">
            {navItems.map((item) => (
              <button
                key={item}
                className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-[15px] font-medium text-gray-800 hover:bg-gray-50 transition-colors"
              >
                <span>{item}</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            ))}
            <div className="pt-2 border-t border-gray-100 space-y-0.5">
              <Link
                href="/destinations"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-medium text-gray-800 hover:bg-gray-50 transition-colors"
              >
                <Search className="w-[18px] h-[18px] text-gray-500" />
                Browse Destinations
              </Link>
              <Link
                href="/account"
                onClick={() => { setMobileMenuOpen(false); setNavUser(getNavUser()); }}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-medium text-gray-800 hover:bg-gray-50 transition-colors"
              >
                {navUser ? (
                  <>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white shrink-0" style={{ background: "#22c55e" }}>
                      {navUser.name.slice(0, 1).toUpperCase()}
                    </div>
                    My Account
                  </>
                ) : (
                  <>
                    <User className="w-[18px] h-[18px] text-gray-500" />
                    Sign In
                  </>
                )}
              </Link>
              <div className="flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-medium text-gray-700">
                <Globe className="w-[18px] h-[18px] text-gray-500" />
                <span>{activeLang}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Destinations Search Panel ── */}
      {destOpen && <DestinationsSearchPanel onClose={() => setDestOpen(false)} />}

      {/* ── Mega Menu Panel ── */}
      {activeMenu !== null && menus[activeMenu] && (
        <MegaMenuPanel menu={menus[activeMenu]} />
      )}

      {/* ── Backdrop ── */}
      {anyOpen && (
        <div
          className="fixed inset-0 bg-black/10 -z-10"
          onClick={() => { setActiveMenu(null); setDestOpen(false); setLangOpen(false); }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Destinations Search Panel
───────────────────────────────────────────────── */
type DestTab = "top10" | "country" | "region" | "ultraplan";

function DestinationsSearchPanel({ onClose }: { onClose: () => void }) {
  const [, navigate] = useLocation();
  const { data } = useListDestinations();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<DestTab>("top10");

  const allDests = data?.destinations ?? [];

  const top10 = useMemo(() => {
    if (!allDests.length) return [];
    return TOP10_CODES
      .map((code) => allDests.find((d) => d.locationCode === code))
      .filter(Boolean) as typeof allDests;
  }, [allDests]);

  const displayed = useMemo(() => {
    let base =
      tab === "top10"     ? top10 :
      tab === "country"   ? allDests.filter((d) => getCategory(d.locationCode) === "country") :
      tab === "region"    ? allDests.filter((d) => getCategory(d.locationCode) === "region") :
                            allDests.filter((d) => getCategory(d.locationCode) === "global");

    if (search.trim()) {
      const q = search.toLowerCase();
      base = base.filter((d) => d.locationName.toLowerCase().includes(q));
    }
    return base;
  }, [tab, top10, allDests, search]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      onClose();
      navigate(`/destinations?q=${encodeURIComponent(search.trim())}`);
    }
  }

  const TABS: { id: DestTab; label: string; badge?: string }[] = [
    { id: "top10",     label: "Top 10" },
    { id: "country",   label: "Country" },
    { id: "region",    label: "Region" },
    { id: "ultraplan", label: "Ultra Plan", badge: "New" },
  ];

  return (
    <div className="w-full bg-white border-b border-gray-100 shadow-lg">
      <div className="max-w-7xl mx-auto px-8 pt-6 pb-0">
        <form onSubmit={handleSearch} className="flex items-center gap-3 mb-5">
          <div className="flex-1 relative">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Where are you travelling to?"
              className="w-full rounded-full border border-gray-200 bg-gray-50 px-5 py-3 text-[15px] text-gray-800 placeholder-gray-400 outline-none focus:border-gray-400 focus:bg-white transition-colors pr-14"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center hover:bg-gray-700 transition-colors"
            >
              <Search className="w-[16px] h-[16px] text-white" />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-2 mb-5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[14px] font-medium transition-colors ${
                tab === t.id ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t.label}
              {t.badge && (
                <span className="inline-flex items-center rounded-full bg-[#0da976] text-white text-[10px] font-bold px-1.5 py-0.5 leading-none">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {allDests.length === 0 ? (
          <div className="grid grid-cols-5 gap-x-8 gap-y-4 pb-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0 animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-100 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-[15px]">
            No destinations found for "{search}"
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-x-8 gap-y-1 pb-6">
            {displayed.slice(0, 10).map((dest) => (
              <Link
                key={dest.locationCode}
                href={`/destination/${dest.locationCode}`}
                onClick={onClose}
                className="flex items-center gap-3 py-2.5 rounded-xl hover:bg-gray-50 px-2 -mx-2 transition-colors group"
              >
                <img
                  src={dest.flagUrl}
                  alt={dest.locationName}
                  className="w-[48px] h-[32px] rounded-[5px] object-cover shrink-0"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}
                />
                <div className="min-w-0">
                  <p className="text-[14.5px] font-semibold text-gray-900 leading-snug truncate group-hover:text-gray-700">
                    {dest.locationName}
                  </p>
                  <p className="text-[12.5px] text-gray-400 mt-0.5">
                    From {fmt(dest.lowestPrice)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-8 py-3.5 flex items-center justify-between">
          <button className="flex items-center gap-2 text-[13px] text-gray-500 hover:text-gray-800 transition-colors">
            <LottieIcon src="/icons/cpu.json" size={16} autoplay loop />
            Is your device eSIM compatible?
          </button>
          <Link
            href="/destinations"
            onClick={onClose}
            className="bg-gray-900 hover:bg-gray-700 text-white text-[13.5px] font-semibold px-5 py-2 rounded-full transition-colors"
          >
            View All Destinations
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Mega Menu Panel
───────────────────────────────────────────────── */
function MegaMenuPanel({ menu }: { menu: MegaMenu }) {
  const [slideIdx, setSlideIdx] = useState(0);

  /* Auto-advance every 4 seconds */
  useEffect(() => {
    const t = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % menu.slides.length);
    }, 4000);
    return () => clearInterval(t);
  }, [menu.slides.length]);

  const slide = menu.slides[slideIdx];
  const hasHeadings = menu.cols.some((c) => c.heading.trim() !== "");

  return (
    <div className="w-full bg-white border-b border-gray-100 shadow-lg">
      <div className="max-w-7xl mx-auto px-8 pt-8 pb-10">
        <div className="grid gap-10" style={{ gridTemplateColumns: `repeat(${menu.cols.length}, 1fr) 280px` }}>

          {/* ── Content columns ── */}
          {menu.cols.map((col, ci) => (
            <div key={ci}>
              {hasHeadings && (
                <p className="text-[11px] font-semibold tracking-[0.12em] text-gray-400 uppercase mb-5">
                  {col.heading}
                </p>
              )}
              <ul className={hasHeadings ? "space-y-6" : "space-y-5 pt-1"}>
                {col.items.map((item) => {
                  const inner = (
                    <div className="flex items-start gap-3.5 group">
                      <div className="w-9 h-9 rounded-full bg-[#22c55e] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#16a34a] transition-colors">
                        <LottieIcon src={item.icon} size={20} autoplay loop style={{ filter: "brightness(0) invert(1)" }} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 leading-snug flex-wrap">
                          <span className="text-[14.5px] font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">{item.label}</span>
                          {item.badge && (
                            <span className="inline-flex items-center rounded-full border border-gray-300 text-gray-600 text-[10px] font-bold px-2 py-0.5 leading-none">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[12.5px] text-gray-500 mt-0.5 leading-snug">{item.desc}</p>
                      </div>
                    </div>
                  );
                  return (
                    <li key={item.label}>
                      {item.href ? (
                        <Link href={item.href} className="block">
                          {inner}
                        </Link>
                      ) : (
                        <div className="cursor-default">{inner}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* ── Explore card with slider ── */}
          <div>
            <p className="text-[11px] font-semibold tracking-[0.12em] text-gray-400 uppercase mb-5">
              Explore
            </p>
            <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="relative h-[160px] overflow-hidden bg-gray-100">
                {menu.slides.map((s, i) => (
                  <img
                    key={i}
                    src={s.img}
                    alt={s.title}
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                    style={{ opacity: i === slideIdx ? 1 : 0 }}
                  />
                ))}
              </div>
              <div className="px-4 pt-3 pb-4 bg-white">
                <p className="font-semibold text-gray-900 text-[14.5px] leading-snug transition-all duration-300">
                  {slide.title}
                </p>
                <p className="text-gray-500 text-[12.5px] mt-0.5 leading-snug">{slide.desc}</p>

                {/* Clickable dot indicators */}
                <div className="flex items-center gap-1.5 mt-3">
                  {menu.slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSlideIdx(i)}
                      aria-label={`Slide ${i + 1}`}
                      className={`block rounded-full transition-all duration-300 ${
                        i === slideIdx
                          ? "w-6 h-[6px] bg-gray-900"
                          : "w-[6px] h-[6px] bg-gray-300 hover:bg-gray-400"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-8 py-3.5 flex items-center justify-between">
          <button className="flex items-center gap-2 text-[13px] text-gray-500 hover:text-gray-800 transition-colors">
            <LottieIcon src="/icons/book.json" size={16} autoplay loop />
            {menu.bottom.question}
          </button>
          <Link
            href={menu.bottom.ctaHref}
            className="bg-gray-900 hover:bg-gray-700 text-white text-[13.5px] font-semibold px-5 py-2 rounded-full transition-colors"
          >
            {menu.bottom.cta}
          </Link>
        </div>
      </div>
    </div>
  );
}

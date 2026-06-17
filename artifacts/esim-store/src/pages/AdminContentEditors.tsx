import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, ChevronDown, ChevronUp, Check,
  Globe, Layout, FileText, MapPin, AlertCircle, Upload, X as XIcon,
} from "lucide-react";
import { LottieIcon } from "@/components/LottieIcon";

/* ─── shared helpers ─── */
const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const apiGet = (path: string) => fetch(`${BASE}${path}`).then(r => r.json());
const apiPut = (path: string, body: unknown) =>
  fetch(`${BASE}${path}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

const LOTTIE_ICONS = ["bag","book","card","category","chart","chart-presentation","code","cpu","element-4","empty-wallet","global","graph","home-trend-up","map","message","money-receive","note-text","notification","notification-bing","people","profile-tick","security-card","setting","shopping-cart","simcard","tag","ticket","user-add","user","wallet-add","wifi"];
const inp = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[13.5px] text-gray-800 outline-none focus:border-green-400 transition-colors bg-white";
const smallInp = "w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-800 outline-none focus:border-green-400 transition-colors bg-white";
const ta = "w-full px-4 py-3 rounded-xl border border-gray-200 text-[13.5px] text-gray-800 outline-none focus:border-green-400 transition-colors resize-none bg-white";

function FSize({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-gray-500 w-28 shrink-0">{label}</span>
      <input type="number" min={8} max={120} value={value || ""} onChange={e => onChange(Number(e.target.value))} className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-[12px] text-center focus:outline-none focus:ring-1 focus:ring-green-400" />
      <span className="text-[11px] text-gray-400">px</span>
    </div>
  );
}

function Lbl({ t, req }: { t: string; req?: boolean }) {
  return <p className="text-[12.5px] font-semibold text-gray-700 mb-1.5">{t}{req && <span className="text-red-400 ml-0.5">*</span>}</p>;
}

function SectionHeader({ title, sub, icon }: { title: string; sub?: string; icon?: string }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      {icon && (
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
          <LottieIcon src={icon} size={24} autoplay loop />
        </div>
      )}
      <div>
        <h3 className="text-[16px] font-bold text-gray-900">{title}</h3>
        {sub && <p className="text-[13px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SaveBar({ saving, saved, onSave }: { saving: boolean; saved: boolean; onSave: () => void }) {
  return (
    <button
      onClick={onSave}
      disabled={saving}
      className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13.5px] font-bold text-white transition-all disabled:opacity-60"
      style={{ background: saved ? "#22c55e" : "#111827" }}
    >
      {saved ? <><Check className="w-4 h-4" /> Saved!</> : saving ? "Saving…" : "Save Changes"}
    </button>
  );
}

function ArrayEditor<T extends Record<string, string>>({
  items, onChange, fields, addLabel,
}: {
  items: T[];
  onChange: (v: T[]) => void;
  fields: { key: keyof T; label: string; placeholder?: string; type?: string }[];
  addLabel: string;
}) {
  const add = () => {
    const blank = {} as T;
    fields.forEach(f => { blank[f.key] = "" as T[keyof T]; });
    onChange([...items, blank]);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const upd = (i: number, key: keyof T, val: string) => {
    const next = items.map((it, idx) => idx === i ? { ...it, [key]: val } : it);
    onChange(next);
  };
  const move = (i: number, dir: -1 | 1) => {
    const next = [...items];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">Item {i + 1}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition"><ChevronUp className="w-3.5 h-3.5" /></button>
              <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition"><ChevronDown className="w-3.5 h-3.5" /></button>
              <button onClick={() => remove(i)} className="p-1 rounded hover:bg-red-100 text-red-500 transition"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <div className={`grid gap-3 ${fields.length > 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
            {fields.map(f => (
              <div key={String(f.key)}>
                <p className="text-[11.5px] font-semibold text-gray-500 mb-1">{f.label}</p>
                {f.type === "color" ? (
                  <div className="flex items-center gap-2">
                    <input type="color" value={String(item[f.key] || "#000000")}
                      onChange={e => upd(i, f.key, e.target.value)}
                      className="w-9 h-9 rounded-lg border border-gray-200 p-0.5 cursor-pointer" />
                    <input type="text" value={String(item[f.key] || "")} placeholder={f.placeholder}
                      onChange={e => upd(i, f.key, e.target.value)}
                      className={smallInp} />
                  </div>
                ) : (
                  <input type={f.type || "text"} value={String(item[f.key] || "")}
                    placeholder={f.placeholder}
                    onChange={e => upd(i, f.key, e.target.value)}
                    className={smallInp} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button onClick={add}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-gray-300 text-[13px] font-semibold text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors w-full justify-center">
        <Plus className="w-4 h-4" /> {addLabel}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════
   HEADER & FOOTER EDITOR — TYPES & DEFAULTS
══════════════════════════════════════════════ */
type CmsMenuItem  = { icon: string; label: string; badge: string; desc: string; href: string };
type CmsMenuCol   = { heading: string; items: CmsMenuItem[] };
type CmsSlide     = { img: string; title: string; desc: string };
type CmsBottomBar = { question: string; cta: string; ctaHref: string };
type CmsMegaMenu  = { cols: CmsMenuCol[]; slides: CmsSlide[]; bottom: CmsBottomBar };
type CmsNavEntry  = { label: string; badge: string; megaMenu: CmsMegaMenu };
type FooterLink   = { label: string; href: string };
type FooterColumn = { heading: string; links: FooterLink[] };

/* ── Default mega-menu data (mirrors Navbar.tsx hardcoded content) ── */
const BLANK_MEGA: CmsMegaMenu = {
  cols: [{ heading: "Column 1", items: [] }],
  slides: [],
  bottom: { question: "", cta: "Browse All", ctaHref: "/destinations" },
};

const DEFAULT_NAV_ENTRIES: CmsNavEntry[] = [
  {
    label: "Plans", badge: "New",
    megaMenu: {
      cols: [
        { heading: "Features", items: [
          { icon: "/icons/simcard.json",       label: "eSIM for Travel",   badge: "Popular", desc: "Your all-in-one travel data plan.",          href: "/destinations" },
          { icon: "/icons/card.json",          label: "eSIM for Business", badge: "New",     desc: "All team data plans in one dashboard.",      href: "/destinations" },
          { icon: "/icons/people.json",        label: "Travel Partners",   badge: "",        desc: "Offer your clients affordable mobile data.", href: "/destinations" },
          { icon: "/icons/security-card.json", label: "Security Features", badge: "",        desc: "Keep your data safe and private.",           href: "/destinations" },
        ]},
        { heading: "Tools", items: [
          { icon: "/icons/chart.json", label: "Data Usage Calculator", badge: "", desc: "Estimate your data usage.",                       href: "" },
          { icon: "/icons/cpu.json",   label: "eSIM Compatibility",    badge: "", desc: "Find out if your device supports eSIM.", href: "/destinations" },
        ]},
      ],
      slides: [
        { img: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=80", title: "Best eSIMs for Summer Travel",  desc: "Top picks for Europe, Asia & Americas." },
        { img: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80", title: "Stay Connected Anywhere",       desc: "Instant activation — no physical SIM needed." },
        { img: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80", title: "Business Travel Made Easy",    desc: "One dashboard for your entire team." },
      ],
      bottom: { question: "What is an eSIM?", cta: "Browse All Plans", ctaHref: "/destinations" },
    },
  },
  {
    label: "Destinations", badge: "",
    megaMenu: {
      cols: [
        { heading: "By Region", items: [
          { icon: "/icons/global.json", label: "Europe",               badge: "", desc: "France, Germany, Italy + 40 more",      href: "/destinations" },
          { icon: "/icons/map.json",    label: "Asia Pacific",         badge: "", desc: "Japan, Thailand, Australia + 35 more",  href: "/destinations" },
          { icon: "/icons/global.json", label: "Americas",             badge: "", desc: "USA, Canada, Mexico + 20 more",         href: "/destinations" },
          { icon: "/icons/map.json",    label: "Middle East & Africa", badge: "", desc: "UAE, Turkey, Egypt + 25 more",          href: "/destinations" },
        ]},
        { heading: "Popular", items: [
          { icon: "/icons/map.json", label: "United States",  badge: "", desc: "5G coverage coast to coast",          href: "/destination/US" },
          { icon: "/icons/map.json", label: "Japan",          badge: "", desc: "High-speed plans across all cities",  href: "/destination/JP" },
          { icon: "/icons/map.json", label: "United Kingdom", badge: "", desc: "4G/5G across England & Scotland",     href: "/destination/GB" },
          { icon: "/icons/map.json", label: "Thailand",       badge: "", desc: "Affordable plans for Southeast Asia", href: "/destination/TH" },
        ]},
      ],
      slides: [
        { img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80", title: "190+ Countries & Regions",  desc: "Find the plan that fits your itinerary." },
        { img: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&q=80", title: "Europe from US$0.75/day",   desc: "Covers 40+ European countries in one plan." },
        { img: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80", title: "Asia Pacific Plans",        desc: "Japan, Korea, Thailand & 30 more." },
      ],
      bottom: { question: "Don't see your destination?", cta: "Browse All Destinations", ctaHref: "/destinations" },
    },
  },
  {
    label: "How it works", badge: "",
    megaMenu: {
      cols: [
        { heading: "Get Connected", items: [
          { icon: "/icons/category.json",          label: "Choose a Plan",    badge: "", desc: "Browse 190+ destinations and pick a data plan.",    href: "/destinations" },
          { icon: "/icons/notification-bing.json", label: "Instant Delivery", badge: "", desc: "Your eSIM QR code arrives by email in seconds.",     href: "/destinations" },
          { icon: "/icons/simcard.json",           label: "Scan & Connect",   badge: "", desc: "Scan in Settings — no physical SIM needed.",        href: "/destinations" },
          { icon: "/icons/wifi.json",              label: "Stay Connected",   badge: "", desc: "Top up anytime. Your plan never expires mid-trip.", href: "/destinations" },
        ]},
        { heading: "Learn More", items: [
          { icon: "/icons/book.json",      label: "What is an eSIM?",   badge: "", desc: "Understand the technology behind eSIMs." , href: "" },
          { icon: "/icons/cpu.json",       label: "Compatible Devices", badge: "", desc: "iPhone, Android, and more.",               href: "" },
          { icon: "/icons/note-text.json", label: "Installation Guide", badge: "", desc: "Step-by-step setup instructions.",         href: "" },
        ]},
      ],
      slides: [
        { img: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&q=80", title: "Ready in under 2 minutes", desc: "No stores, no waiting — just instant connectivity." },
        { img: "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=400&q=80", title: "Scan & Go",                 desc: "One QR code — activate in Settings." },
        { img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80", title: "Works on 5,000+ Devices",   desc: "All modern iPhones & Android phones." },
      ],
      bottom: { question: "Need help getting started?", cta: "View Setup Guide", ctaHref: "/destinations" },
    },
  },
  {
    label: "Help", badge: "",
    megaMenu: {
      cols: [
        { heading: "Support", items: [
          { icon: "/icons/book.json",      label: "Help Center",        badge: "", desc: "Browse FAQs and how-to articles.",  href: "" },
          { icon: "/icons/message.json",   label: "Contact Us",         badge: "", desc: "Reach our support team anytime.",   href: "" },
          { icon: "/icons/note-text.json", label: "Installation Guide", badge: "", desc: "Step-by-step eSIM setup.",          href: "" },
          { icon: "/icons/ticket.json",    label: "Track My Order",     badge: "", desc: "Check the status of your eSIM.",   href: "" },
        ]},
        { heading: "Quick Answers", items: [
          { icon: "/icons/book.json",         label: "What is an eSIM?",     badge: "", desc: "Learn how eSIMs work.",               href: "" },
          { icon: "/icons/cpu.json",          label: "Device Compatibility", badge: "", desc: "Check if your phone supports eSIM.", href: "" },
          { icon: "/icons/empty-wallet.json", label: "Refunds & Returns",    badge: "", desc: "Our fair refund policy.",             href: "" },
        ]},
      ],
      slides: [
        { img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80",   title: "24/7 Customer Support",  desc: "We're here whenever you need us." },
        { img: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=400&q=80", title: "Instant eSIM Delivery",  desc: "Get your QR code in seconds by email." },
        { img: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&q=80",   title: "Easy Refund Policy",     desc: "Unused plans? We've got you covered." },
      ],
      bottom: { question: "Still have questions?", cta: "Contact Support", ctaHref: "/destinations" },
    },
  },
];

const DEFAULT_HEADER_V2 = {
  topBannerEnabled: true,
  topBannerText: "Rewards sprint: Refer friends, earn up to US$100 in gift cards and Voltey credits!",
  topBannerLinkLabel: "Learn More",
  topBannerLinkHref: "#",
  navEntries: DEFAULT_NAV_ENTRIES,
  searchBtnLabel: "Destinations",
  searchBtnHref: "/destinations",
  signInLabel: "Sign In",
  signInHref: "/account",
};

const DEFAULT_FOOTER = {
  copyright: `© ${new Date().getFullYear()} Voltey. All rights reserved.`,
  appStoreHref: "#",
  googlePlayHref: "#",
  socialHeading: "Follow Us",
  columns: [
    { heading: "Popular Destinations", links: [
      { label: "Spain", href: "/destinations" },
      { label: "Greece", href: "/destinations" },
      { label: "Italy", href: "/destinations" },
      { label: "Turkey", href: "/destinations" },
      { label: "United Kingdom", href: "/destinations" },
      { label: "Portugal", href: "/destinations" },
      { label: "France", href: "/destinations" },
      { label: "Germany", href: "/destinations" },
      { label: "Netherlands", href: "/destinations" },
      { label: "Canada", href: "/destinations" },
    ]},
    { heading: "Voltey", links: [
      { label: "Business", href: "#" },
      { label: "About Us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Refer a Friend", href: "#" },
      { label: "Become an Affiliate", href: "#" },
      { label: "eSIM for Travel Partners", href: "#" },
      { label: "Creators Program", href: "#" },
      { label: "Student Discount", href: "#" },
      { label: "Voltey for Nonprofit", href: "#" },
      { label: "Press Area", href: "#" },
      { label: "Football tournament eSIM deal", href: "#" },
    ]},
    { heading: "eSIM", links: [
      { label: "What is an eSIM", href: "#" },
      { label: "Supported Devices", href: "#" },
      { label: "Download App", href: "#" },
      { label: "Security Features", href: "#" },
      { label: "Data Usage Calculator", href: "#" },
      { label: "Blog", href: "#" },
    ]},
    { heading: "Help", links: [
      { label: "Help Center", href: "#" },
      { label: "Getting Started", href: "#" },
      { label: "Plans and Payments", href: "#" },
      { label: "Troubleshooting", href: "#" },
      { label: "FAQ", href: "#" },
    ]},
  ] as FooterColumn[],
  socialLinks: [
    { platform: "facebook",  href: "#" },
    { platform: "twitter",   href: "#" },
    { platform: "linkedin",  href: "#" },
    { platform: "youtube",   href: "#" },
    { platform: "instagram", href: "#" },
    { platform: "reddit",    href: "#" },
  ] as { platform: string; href: string }[],
  legalLinks: [
    { label: "Privacy Policy",    href: "#" },
    { label: "Terms of Service",  href: "#" },
    { label: "Cookie Preference", href: "#" },
  ] as FooterLink[],
};

/* ── Sub-editors ── */
/* ── Image upload field (URL input + file upload → data URL) ── */
function ImageUploadField({ value, onChange, placeholder, label }: {
  value: string; onChange: (v: string) => void; placeholder?: string; label?: string;
}) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { if (ev.target?.result) onChange(ev.target.result as string); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-[12px] font-semibold text-gray-600 mb-1">{label}</p>}
      <div className="flex gap-2">
        <input
          type="text" value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? "https://... or upload a file →"}
          className={`${smallInp} flex-1 min-w-0`}
        />
        <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 text-white text-[12px] font-bold cursor-pointer hover:bg-gray-700 transition whitespace-nowrap shrink-0">
          <Upload className="w-3.5 h-3.5" />
          Upload
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </label>
      </div>
      {value && (
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center" style={{ minHeight: 80, maxHeight: 180 }}>
          <img
            src={value} alt="Preview"
            className="max-w-full max-h-44 object-contain"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}
    </div>
  );
}

function VideoUploadField({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { if (ev.target?.result) onChange(ev.target.result as string); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const isVideo = value && (value.startsWith("data:video") || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(value));

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text" value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? "https://... or upload a video →"}
          className={`${smallInp} flex-1 min-w-0`}
        />
        {value && (
          <button onClick={() => onChange("")} className="px-3 py-2 rounded-xl bg-red-50 text-red-500 text-[12px] font-bold hover:bg-red-100 transition whitespace-nowrap shrink-0">
            Clear
          </button>
        )}
        <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 text-white text-[12px] font-bold cursor-pointer hover:bg-gray-700 transition whitespace-nowrap shrink-0">
          <Upload className="w-3.5 h-3.5" />
          Upload
          <input type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" onChange={handleFile} className="hidden" />
        </label>
      </div>
      {value && isVideo && (
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
          <video
            src={value}
            className="w-full max-h-44 object-cover"
            muted autoPlay loop playsInline
          />
        </div>
      )}
      {value && !isVideo && (
        <p className="text-[11px] text-gray-400 px-1">URL set — preview only available for uploaded files.</p>
      )}
      <p className="text-[11px] text-gray-400 px-1">Supported: MP4, WebM, MOV · Max ~12 MB for best results</p>
    </div>
  );
}

/* ── Built-in icons (original 31 hand-picked) ── */
type IconEntry = { name: string; label: string; category: string; path: string };

const BUILTIN_ICONS: IconEntry[] = [
  "bag","book","card","category","chart","chart-presentation","code","cpu",
  "element-4","empty-wallet","global","graph","home-trend-up","map","message",
  "money-receive","note-text","notification-bing","notification","people",
  "profile-tick","security-card","setting","shopping-cart","simcard","tag",
  "ticket","user-add","user","wallet-add","wifi",
].map(n => ({ name: n, label: n.replace(/-/g, " "), category: "Built-in", path: `/icons/${n}.json` }));

function IconPickerField({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [allIcons, setAllIcons] = useState<IconEntry[]>(BUILTIN_ICONS);
  const [loading, setLoading] = useState(false);
  const [manifestLoaded, setManifestLoaded] = useState(false);

  const loadManifest = async () => {
    if (manifestLoaded) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/icons/lottie/manifest.json`);
      const data: IconEntry[] = await res.json();
      setAllIcons([...BUILTIN_ICONS, ...data]);
      setManifestLoaded(true);
    } catch { /* keep built-ins */ }
    finally { setLoading(false); }
  };

  const handleOpen = () => { setOpen(true); loadManifest(); };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { if (ev.target?.result) { onChange(ev.target.result as string); setOpen(false); } };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const cats = ["All", ...Array.from(new Set(allIcons.map(i => i.category))).sort((a, b) => a === "Built-in" ? -1 : b === "Built-in" ? 1 : a.localeCompare(b))];

  const filtered = allIcons.filter(icon => {
    const matchCat = activeCat === "All" || icon.category === activeCat;
    const matchSearch = !search || icon.label.toLowerCase().includes(search.toLowerCase()) || icon.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const isPreviewable = value && !value.startsWith("data:") && value.endsWith(".json");

  const closeModal = () => { setOpen(false); setSearch(""); };

  return (
    <div className="space-y-2">
      {label && <p className="text-[12px] font-semibold text-gray-600 mb-1">{label}</p>}
      <div className="flex gap-2 items-center">
        {isPreviewable && (
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
            <LottieIcon src={value} size={24} autoplay loop />
          </div>
        )}
        <input
          type="text" value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="/icons/global.json"
          className={`${smallInp} flex-1 min-w-0`}
        />
        <button type="button" onClick={handleOpen}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-[12px] font-bold hover:bg-indigo-700 transition whitespace-nowrap shrink-0">
          ✦ Pick
        </button>
        <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 text-white text-[12px] font-bold cursor-pointer hover:bg-gray-700 transition whitespace-nowrap shrink-0">
          <Upload className="w-3.5 h-3.5" /> Upload
          <input type="file" accept=".json,image/*" onChange={handleUpload} className="hidden" />
        </label>
      </div>

      {open && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-[16px] font-bold text-gray-900">Choose Icon</h3>
                {loading && <p className="text-[11px] text-indigo-500 mt-0.5">Loading 950+ icons…</p>}
                {!loading && manifestLoaded && <p className="text-[11px] text-gray-400 mt-0.5">{allIcons.length} icons</p>}
              </div>
              <button type="button" onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"><XIcon className="w-5 h-5" /></button>
            </div>

            {/* Search */}
            <div className="px-5 py-3 border-b border-gray-100 shrink-0">
              <input type="text" value={search} onChange={e => { setSearch(e.target.value); setActiveCat("All"); }}
                placeholder="Search 950+ icons…" autoFocus
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13.5px] focus:outline-none focus:border-indigo-400 bg-gray-50" />
            </div>

            {/* Body: sidebar + grid */}
            <div className="flex flex-1 min-h-0">
              {/* Category sidebar */}
              <div className="w-32 shrink-0 border-r border-gray-100 overflow-y-auto py-2">
                {cats.map(cat => (
                  <button key={cat} type="button"
                    onClick={() => setActiveCat(cat)}
                    className={`w-full text-left px-3 py-1.5 text-[11.5px] font-medium rounded-lg mx-1 transition ${activeCat === cat ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                    {cat}
                  </button>
                ))}
              </div>

              {/* Icon grid */}
              <div className="flex-1 overflow-y-auto p-3">
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
                  {filtered.map(icon => (
                    <button key={icon.path} type="button"
                      onClick={() => { onChange(icon.path); closeModal(); }}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition ${value === icon.path ? "border-emerald-500 bg-emerald-50" : "border-transparent hover:border-gray-200 hover:bg-gray-50"}`}
                      title={icon.label}>
                      <LottieIcon src={icon.path} size={30} autoplay={value === icon.path} loop />
                      <span className="text-[9px] text-gray-500 text-center leading-tight break-all w-full line-clamp-2">{icon.label}</span>
                    </button>
                  ))}
                  {filtered.length === 0 && !loading && (
                    <div className="col-span-full text-center text-gray-400 py-12 text-[13px]">No icons match "{search}"</div>
                  )}
                  {loading && (
                    <div className="col-span-full text-center text-gray-400 py-12 text-[13px]">Loading icons…</div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between rounded-b-2xl shrink-0">
              <p className="text-[12px] text-gray-400">{filtered.length} shown{activeCat !== "All" ? ` in ${activeCat}` : ""}</p>
              <label className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 text-white text-[12px] font-bold cursor-pointer hover:bg-gray-700 transition">
                <Upload className="w-3.5 h-3.5" /> Upload Custom .json
                <input type="file" accept=".json" onChange={handleUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${on ? "bg-emerald-500" : "bg-gray-300"}`}>
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

function MegaMenuItemsEditor({ items, onChange }: { items: CmsMenuItem[]; onChange: (v: CmsMenuItem[]) => void }) {
  const blank: CmsMenuItem = { icon: "/icons/global.json", label: "", badge: "", desc: "", href: "" };
  const add = () => onChange([...items, { ...blank }]);
  const rm  = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const upd = (i: number, k: keyof CmsMenuItem, v: string) =>
    onChange(items.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const move = (i: number, d: -1|1) => {
    const a = [...items]; const j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]]; onChange(a);
  };

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="border border-gray-100 rounded-xl p-3 bg-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Item {i + 1}</span>
            <div className="flex gap-1">
              <button onClick={() => move(i,-1)} disabled={i===0} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
              <button onClick={() => move(i, 1)} disabled={i===items.length-1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
              <button onClick={() => rm(i)} className="p-1 rounded hover:bg-red-50 text-red-400"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <IconPickerField value={item.icon} onChange={v => upd(i, "icon", v)} label="Icon" />
            </div>
            <div><p className="text-[11px] font-semibold text-gray-500 mb-1">Label</p><input value={item.label} onChange={e => upd(i,"label",e.target.value)} placeholder="eSIM for Travel" className={smallInp} /></div>
            <div><p className="text-[11px] font-semibold text-gray-500 mb-1">Badge (optional)</p><input value={item.badge} onChange={e => upd(i,"badge",e.target.value)} placeholder="Popular" className={smallInp} /></div>
            <div className="col-span-2"><p className="text-[11px] font-semibold text-gray-500 mb-1">Description</p><input value={item.desc} onChange={e => upd(i,"desc",e.target.value)} placeholder="Short description" className={smallInp} /></div>
            <div className="col-span-2"><p className="text-[11px] font-semibold text-gray-500 mb-1">Link URL</p><input value={item.href} onChange={e => upd(i,"href",e.target.value)} placeholder="/destinations" className={smallInp} /></div>
          </div>
        </div>
      ))}
      <button onClick={add}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-[12px] font-semibold text-gray-500 hover:border-green-400 hover:text-green-600 transition w-full justify-center">
        <Plus className="w-3.5 h-3.5" /> Add Item
      </button>
    </div>
  );
}

function MegaMenuColsEditor({ cols, onChange }: { cols: CmsMenuCol[]; onChange: (v: CmsMenuCol[]) => void }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const addCol = () => onChange([...cols, { heading: "New Column", items: [] }]);
  const rmCol  = (i: number) => { onChange(cols.filter((_, idx) => idx !== i)); setOpenIdx(null); };
  const updCol = (i: number, c: CmsMenuCol) => onChange(cols.map((col, idx) => idx === i ? c : col));

  return (
    <div className="space-y-2">
      {cols.map((col, ci) => (
        <div key={ci} className="border border-gray-200 rounded-xl overflow-hidden">
          <button onClick={() => setOpenIdx(openIdx === ci ? null : ci)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition">
            <span className="text-[13px] font-bold text-gray-800">{col.heading || `Column ${ci + 1}`} <span className="text-gray-400 font-normal text-[12px]">({col.items.length} items)</span></span>
            {openIdx === ci ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {openIdx === ci && (
            <div className="p-4 bg-white space-y-3">
              <div><p className="text-[12px] font-semibold text-gray-600 mb-1">Column Heading</p><input value={col.heading} onChange={e => updCol(ci, { ...col, heading: e.target.value })} className={smallInp} /></div>
              <div>
                <p className="text-[12px] font-semibold text-gray-600 mb-2">Menu Items</p>
                <MegaMenuItemsEditor items={col.items} onChange={items => updCol(ci, { ...col, items })} />
              </div>
              <button onClick={() => rmCol(ci)} className="flex items-center gap-1.5 text-[12px] font-semibold text-red-500 hover:text-red-600 transition">
                <Trash2 className="w-3.5 h-3.5" /> Remove column
              </button>
            </div>
          )}
        </div>
      ))}
      <button onClick={addCol}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed border-gray-300 text-[12.5px] font-semibold text-gray-500 hover:border-green-400 hover:text-green-600 transition w-full justify-center">
        <Plus className="w-3.5 h-3.5" /> Add Column
      </button>
    </div>
  );
}

function MegaMenuSlidesEditor({ slides, onChange }: { slides: CmsSlide[]; onChange: (v: CmsSlide[]) => void }) {
  const blank: CmsSlide = { img: "", title: "", desc: "" };
  const add = () => onChange([...slides, { ...blank }]);
  const rm  = (i: number) => onChange(slides.filter((_, idx) => idx !== i));
  const upd = (i: number, k: keyof CmsSlide, v: string) =>
    onChange(slides.map((s, idx) => idx === i ? { ...s, [k]: v } : s));

  return (
    <div className="space-y-3">
      {slides.map((sl, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-3 bg-gray-50 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Slide {i + 1}</span>
            <button onClick={() => rm(i)} className="p-1 rounded hover:bg-red-50 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <ImageUploadField
            label="Image"
            value={sl.img}
            onChange={v => upd(i, "img", v)}
            placeholder="https://... or upload a file →"
          />
          <div><p className="text-[11px] font-semibold text-gray-500 mb-1">Title</p><input value={sl.title} onChange={e => upd(i,"title",e.target.value)} className={smallInp} /></div>
          <div><p className="text-[11px] font-semibold text-gray-500 mb-1">Description</p><input value={sl.desc} onChange={e => upd(i,"desc",e.target.value)} className={smallInp} /></div>
        </div>
      ))}
      <button onClick={add}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed border-gray-300 text-[12.5px] font-semibold text-gray-500 hover:border-green-400 hover:text-green-600 transition w-full justify-center">
        <Plus className="w-3.5 h-3.5" /> Add Slide
      </button>
    </div>
  );
}

function NavEntryEditor({ entry, onChange, onRemove, onMove, idx, total }:
  { entry: CmsNavEntry; onChange: (e: CmsNavEntry) => void; onRemove: () => void; onMove: (d: -1|1) => void; idx: number; total: number }) {
  const [open, setOpen] = useState(false);
  const [mmTab, setMmTab] = useState<"columns" | "slides" | "bottombar">("columns");

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition text-left">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-[12px] font-bold shrink-0">{idx + 1}</div>
          <div>
            <span className="text-[14.5px] font-bold text-gray-900">{entry.label || `Menu Item ${idx + 1}`}</span>
            {entry.badge && <span className="ml-2 text-[10px] font-bold text-white bg-emerald-500 px-1.5 py-0.5 rounded-full">{entry.badge}</span>}
            <p className="text-[12px] text-gray-400 mt-0.5">{entry.megaMenu.cols.length} column{entry.megaMenu.cols.length !== 1 ? "s" : ""} · {entry.megaMenu.slides.length} slide{entry.megaMenu.slides.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={e => { e.stopPropagation(); onMove(-1); }} disabled={idx === 0} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition"><ChevronUp className="w-4 h-4" /></button>
          <button onClick={e => { e.stopPropagation(); onMove(1); }} disabled={idx === total - 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition"><ChevronDown className="w-4 h-4" /></button>
          <button onClick={e => { e.stopPropagation(); onRemove(); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400 ml-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-5">
          {/* Label & Badge */}
          <div className="grid grid-cols-2 gap-4">
            <div><Lbl t="Menu Label" req /><input value={entry.label} onChange={e => onChange({ ...entry, label: e.target.value })} placeholder="Plans" className={inp} /></div>
            <div><Lbl t="Badge (optional)" /><input value={entry.badge} onChange={e => onChange({ ...entry, badge: e.target.value })} placeholder="New" className={inp} /></div>
          </div>

          {/* Mega menu tabs */}
          <div>
            <p className="text-[13px] font-bold text-gray-700 mb-3">Dropdown / Mega Menu</p>
            <div className="flex gap-1.5 mb-4 bg-white border border-gray-200 p-1 rounded-xl w-fit">
              {(["columns", "slides", "bottombar"] as const).map(t => (
                <button key={t} onClick={() => setMmTab(t)}
                  className={`px-4 py-1.5 rounded-lg text-[12.5px] font-bold transition-all ${mmTab === t ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                  {t === "columns" ? "Columns & Items" : t === "slides" ? "Slider Images" : "Bottom Bar"}
                </button>
              ))}
            </div>

            {mmTab === "columns" && (
              <MegaMenuColsEditor
                cols={entry.megaMenu.cols}
                onChange={cols => onChange({ ...entry, megaMenu: { ...entry.megaMenu, cols } })}
              />
            )}
            {mmTab === "slides" && (
              <MegaMenuSlidesEditor
                slides={entry.megaMenu.slides}
                onChange={slides => onChange({ ...entry, megaMenu: { ...entry.megaMenu, slides } })}
              />
            )}
            {mmTab === "bottombar" && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">Bottom Bar</p>
                <div><p className="text-[12px] font-semibold text-gray-600 mb-1">Question Text</p><input value={entry.megaMenu.bottom.question} onChange={e => onChange({ ...entry, megaMenu: { ...entry.megaMenu, bottom: { ...entry.megaMenu.bottom, question: e.target.value } } })} placeholder="What is an eSIM?" className={inp} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-[12px] font-semibold text-gray-600 mb-1">CTA Button Label</p><input value={entry.megaMenu.bottom.cta} onChange={e => onChange({ ...entry, megaMenu: { ...entry.megaMenu, bottom: { ...entry.megaMenu.bottom, cta: e.target.value } } })} placeholder="Browse All Plans" className={inp} /></div>
                  <div><p className="text-[12px] font-semibold text-gray-600 mb-1">CTA Button URL</p><input value={entry.megaMenu.bottom.ctaHref} onChange={e => onChange({ ...entry, megaMenu: { ...entry.megaMenu, bottom: { ...entry.megaMenu.bottom, ctaHref: e.target.value } } })} placeholder="/destinations" className={inp} /></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   DEDICATED MENU EDITOR PAGE
══════════════════════════════════════════════ */
export function MenuEditorPage() {
  const qc = useQueryClient();
  const { data: allContent } = useQuery({ queryKey: ["admin-content"], queryFn: () => apiGet("/api/admin/content") });

  const [navEntries, setNavEntries] = useState<CmsNavEntry[]>(DEFAULT_NAV_ENTRIES);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);
  const [itemSubTab, setItemSubTab] = useState<Record<number, "columns" | "slides" | "bottombar">>({});

  useEffect(() => {
    if (!allContent?.header) return;
    const h = allContent.header as typeof DEFAULT_HEADER_V2;
    if (h.navEntries?.length) setNavEntries(h.navEntries);
  }, [allContent]);

  const getSubTab = (i: number) => itemSubTab[i] ?? "columns";
  const setSubTab = (i: number, t: "columns" | "slides" | "bottombar") =>
    setItemSubTab(prev => ({ ...prev, [i]: t }));

  const updEntry  = (i: number, e: CmsNavEntry) => setNavEntries(arr => arr.map((x, idx) => idx === i ? e : x));
  const rmEntry   = (i: number) => { setNavEntries(arr => arr.filter((_, idx) => idx !== i)); if (expandedIdx === i) setExpandedIdx(null); };
  const moveEntry = (i: number, d: -1|1) => {
    const arr = [...navEntries]; const j = i + d;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]]; setNavEntries(arr);
  };
  const addEntry = () => {
    setNavEntries(arr => [...arr, { label: "New Menu", badge: "", megaMenu: BLANK_MEGA }]);
    setExpandedIdx(navEntries.length);
  };

  const save = async () => {
    setSaving(true);
    const current = allContent?.header ?? {};
    await apiPut("/api/admin/content/header", { ...current, navEntries });
    qc.invalidateQueries({ queryKey: ["admin-content"] });
    qc.invalidateQueries({ queryKey: ["website-content"] });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-gray-900">Header Menu Editor</h2>
          <p className="text-[13.5px] text-gray-400 mt-1">
            Manage your top navigation items and their dropdown mega-menus. Each item can have multiple columns with submenu links, image slides, and a bottom call-to-action bar.
          </p>
        </div>
        <SaveBar saving={saving} saved={saved} onSave={save} />
      </div>

      {/* How it works guide */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 flex gap-4">
        <div className="text-[20px] shrink-0">🗂️</div>
        <div className="text-[13px] text-blue-700 space-y-0.5">
          <p className="font-bold text-blue-800">How menu editing works</p>
          <p>Each <strong>Menu Item</strong> (Plans, Destinations…) is a top-level nav button. Expand one to edit its label and dropdown.</p>
          <p>Inside the dropdown you have <strong>Columns</strong> (groups of links), an <strong>Image Slider</strong>, and a <strong>Bottom Bar</strong> CTA.</p>
          <p>Under each Column, click <strong>+ Add Submenu Item</strong> to add individual links with an icon, label, description and URL.</p>
        </div>
      </div>

      {/* Menu items list */}
      <div className="space-y-3">
        {navEntries.map((entry, i) => {
          const isOpen = expandedIdx === i;
          const subTab = getSubTab(i);
          const totalItems = entry.megaMenu.cols.reduce((s, c) => s + c.items.length, 0);

          return (
            <div key={i} className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
              {/* Item header row */}
              <div className="flex items-center gap-0 border-b border-gray-100">
                <button
                  onClick={() => setExpandedIdx(isOpen ? null : i)}
                  className="flex-1 flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center text-[13px] font-black shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[15px] font-bold text-gray-900">{entry.label || `Menu Item ${i + 1}`}</span>
                      {entry.badge && (
                        <span className="text-[10px] font-bold text-white bg-emerald-500 px-2 py-0.5 rounded-full">{entry.badge}</span>
                      )}
                    </div>
                    <p className="text-[12px] text-gray-400 mt-0.5">
                      {entry.megaMenu.cols.length} column{entry.megaMenu.cols.length !== 1 ? "s" : ""} · {totalItems} submenu item{totalItems !== 1 ? "s" : ""} · {entry.megaMenu.slides.length} slide{entry.megaMenu.slides.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
                </button>
                <div className="flex items-center gap-0.5 px-3 shrink-0">
                  <button onClick={() => moveEntry(i, -1)} disabled={i === 0} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition" title="Move up"><ChevronUp className="w-4 h-4 text-gray-500" /></button>
                  <button onClick={() => moveEntry(i, 1)} disabled={i === navEntries.length - 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition" title="Move down"><ChevronDown className="w-4 h-4 text-gray-500" /></button>
                  <button onClick={() => rmEntry(i)} className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Expanded editing area */}
              {isOpen && (
                <div className="bg-gray-50 p-5 space-y-5">
                  {/* Label & Badge */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-3">Menu Item Settings</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Lbl t="Label" req />
                        <input value={entry.label} onChange={e => updEntry(i, { ...entry, label: e.target.value })} placeholder="Plans" className={inp} />
                      </div>
                      <div>
                        <Lbl t="Badge (optional)" />
                        <input value={entry.badge} onChange={e => updEntry(i, { ...entry, badge: e.target.value })} placeholder="New" className={inp} />
                        <p className="text-[11px] text-gray-400 mt-1">Short label shown as a green pill next to the item (e.g. "New")</p>
                      </div>
                    </div>
                  </div>

                  {/* Dropdown sub-tabs */}
                  <div>
                    <p className="text-[13px] font-bold text-gray-700 mb-3">Dropdown Mega-Menu</p>
                    <div className="flex gap-1 mb-4 bg-white border border-gray-200 p-1 rounded-xl w-fit">
                      {([
                        { key: "columns",  label: "📋 Columns & Submenu Items" },
                        { key: "slides",   label: "🖼️ Image Slider" },
                        { key: "bottombar",label: "🔗 Bottom Bar" },
                      ] as const).map(({ key, label }) => (
                        <button key={key} onClick={() => setSubTab(i, key)}
                          className={`px-4 py-2 rounded-lg text-[12.5px] font-bold transition-all whitespace-nowrap ${subTab === key ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* COLUMNS & SUBMENU ITEMS */}
                    {subTab === "columns" && (
                      <div className="space-y-4">
                        <p className="text-[12.5px] text-gray-500">
                          Columns group your submenu links. Each column has a heading and a list of submenu items.
                        </p>
                        {entry.megaMenu.cols.map((col, ci) => (
                          <div key={ci} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                            {/* Column header */}
                            <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                              <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] font-black">{ci + 1}</div>
                                <input
                                  value={col.heading}
                                  onChange={e => {
                                    const cols = entry.megaMenu.cols.map((c, idx) => idx === ci ? { ...c, heading: e.target.value } : c);
                                    updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, cols } });
                                  }}
                                  placeholder="Column heading…"
                                  className="text-[13.5px] font-bold text-gray-800 bg-transparent border-b border-transparent focus:border-green-400 outline-none px-0 py-0.5 w-48 transition"
                                />
                                <span className="text-[11px] text-gray-400">({col.items.length} items)</span>
                              </div>
                              <button
                                onClick={() => {
                                  const cols = entry.megaMenu.cols.filter((_, idx) => idx !== ci);
                                  updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, cols } });
                                }}
                                className="flex items-center gap-1 text-[12px] text-red-400 hover:text-red-600 font-semibold transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Remove column
                              </button>
                            </div>

                            {/* Submenu items */}
                            <div className="p-4 space-y-2">
                              {col.items.map((item, ii) => (
                                <div key={ii} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                                  <div className="flex items-center justify-between mb-2.5">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Submenu Item {ii + 1}</span>
                                    <div className="flex gap-0.5">
                                      <button onClick={() => {
                                        const items = [...col.items]; if (ii > 0) { [items[ii], items[ii-1]] = [items[ii-1], items[ii]]; }
                                        const cols = entry.megaMenu.cols.map((c, idx) => idx === ci ? { ...c, items } : c);
                                        updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, cols } });
                                      }} disabled={ii === 0} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
                                      <button onClick={() => {
                                        const items = [...col.items]; if (ii < items.length - 1) { [items[ii], items[ii+1]] = [items[ii+1], items[ii]]; }
                                        const cols = entry.megaMenu.cols.map((c, idx) => idx === ci ? { ...c, items } : c);
                                        updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, cols } });
                                      }} disabled={ii === col.items.length - 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
                                      <button onClick={() => {
                                        const items = col.items.filter((_, idx) => idx !== ii);
                                        const cols = entry.megaMenu.cols.map((c, idx) => idx === ci ? { ...c, items } : c);
                                        updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, cols } });
                                      }} className="p-1 rounded hover:bg-red-50 text-red-400"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="col-span-2">
                                      <IconPickerField
                                        label="Icon"
                                        value={item.icon}
                                        onChange={v => {
                                          const items = col.items.map((it, idx) => idx === ii ? { ...it, icon: v } : it);
                                          const cols = entry.megaMenu.cols.map((c, idx) => idx === ci ? { ...c, items } : c);
                                          updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, cols } });
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <p className="text-[11px] font-semibold text-gray-500 mb-1">Label</p>
                                      <input value={item.label} placeholder="eSIM for Travel"
                                        onChange={e => {
                                          const items = col.items.map((it, idx) => idx === ii ? { ...it, label: e.target.value } : it);
                                          const cols = entry.megaMenu.cols.map((c, idx) => idx === ci ? { ...c, items } : c);
                                          updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, cols } });
                                        }}
                                        className={smallInp} />
                                    </div>
                                    <div>
                                      <p className="text-[11px] font-semibold text-gray-500 mb-1">Badge <span className="font-normal text-gray-400">(optional)</span></p>
                                      <input value={item.badge} placeholder="Popular"
                                        onChange={e => {
                                          const items = col.items.map((it, idx) => idx === ii ? { ...it, badge: e.target.value } : it);
                                          const cols = entry.megaMenu.cols.map((c, idx) => idx === ci ? { ...c, items } : c);
                                          updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, cols } });
                                        }}
                                        className={smallInp} />
                                    </div>
                                    <div className="col-span-2">
                                      <p className="text-[11px] font-semibold text-gray-500 mb-1">Description</p>
                                      <input value={item.desc} placeholder="Short description shown under the label"
                                        onChange={e => {
                                          const items = col.items.map((it, idx) => idx === ii ? { ...it, desc: e.target.value } : it);
                                          const cols = entry.megaMenu.cols.map((c, idx) => idx === ci ? { ...c, items } : c);
                                          updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, cols } });
                                        }}
                                        className={smallInp} />
                                    </div>
                                    <div className="col-span-2">
                                      <p className="text-[11px] font-semibold text-gray-500 mb-1">Link URL</p>
                                      <input value={item.href} placeholder="/destinations"
                                        onChange={e => {
                                          const items = col.items.map((it, idx) => idx === ii ? { ...it, href: e.target.value } : it);
                                          const cols = entry.megaMenu.cols.map((c, idx) => idx === ci ? { ...c, items } : c);
                                          updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, cols } });
                                        }}
                                        className={smallInp} />
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {/* Add submenu item */}
                              <button
                                onClick={() => {
                                  const blank: CmsMenuItem = { icon: "/icons/global.json", label: "", badge: "", desc: "", href: "" };
                                  const items = [...col.items, blank];
                                  const cols = entry.megaMenu.cols.map((c, idx) => idx === ci ? { ...c, items } : c);
                                  updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, cols } });
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-emerald-300 text-[12.5px] font-bold text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400 transition w-full justify-center mt-1"
                              >
                                <Plus className="w-4 h-4" /> Add Submenu Item
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Add column */}
                        <button
                          onClick={() => {
                            const cols = [...entry.megaMenu.cols, { heading: "New Column", items: [] }];
                            updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, cols } });
                          }}
                          className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-gray-300 text-[13px] font-bold text-gray-500 hover:border-gray-400 hover:text-gray-700 transition w-full justify-center"
                        >
                          <Plus className="w-4 h-4" /> Add Column
                        </button>
                      </div>
                    )}

                    {/* IMAGE SLIDER */}
                    {subTab === "slides" && (
                      <div className="space-y-3">
                        <p className="text-[12.5px] text-gray-500">These images appear in the right panel of the dropdown, rotating as a carousel.</p>
                        {entry.megaMenu.slides.map((sl, si) => (
                          <div key={si} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                              <span className="text-[13px] font-bold text-gray-700">Slide {si + 1}</span>
                              <button onClick={() => {
                                const slides = entry.megaMenu.slides.filter((_, idx) => idx !== si);
                                updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, slides } });
                              }} className="flex items-center gap-1 text-[12px] text-red-400 hover:text-red-600 font-semibold transition">
                                <Trash2 className="w-3.5 h-3.5" /> Remove
                              </button>
                            </div>
                            <div className="p-4 space-y-3">
                              <ImageUploadField
                                label="Image"
                                value={sl.img}
                                onChange={v => {
                                  const slides = entry.megaMenu.slides.map((s, idx) => idx === si ? { ...s, img: v } : s);
                                  updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, slides } });
                                }}
                                placeholder="https://images.unsplash.com/..."
                              />
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Lbl t="Title" />
                                  <input value={sl.title} placeholder="Best eSIMs for Summer"
                                    onChange={e => {
                                      const slides = entry.megaMenu.slides.map((s, idx) => idx === si ? { ...s, title: e.target.value } : s);
                                      updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, slides } });
                                    }}
                                    className={inp} />
                                </div>
                                <div>
                                  <Lbl t="Description" />
                                  <input value={sl.desc} placeholder="Short caption"
                                    onChange={e => {
                                      const slides = entry.megaMenu.slides.map((s, idx) => idx === si ? { ...s, desc: e.target.value } : s);
                                      updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, slides } });
                                    }}
                                    className={inp} />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const slides = [...entry.megaMenu.slides, { img: "", title: "", desc: "" }];
                            updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, slides } });
                          }}
                          className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-gray-300 text-[13px] font-bold text-gray-500 hover:border-gray-400 hover:text-gray-700 transition w-full justify-center"
                        >
                          <Plus className="w-4 h-4" /> Add Slide
                        </button>
                      </div>
                    )}

                    {/* BOTTOM BAR */}
                    {subTab === "bottombar" && (
                      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
                        <p className="text-[12.5px] text-gray-500">The bottom strip of the dropdown — a question text on the left and a CTA button on the right.</p>
                        <div>
                          <Lbl t="Question Text" />
                          <input value={entry.megaMenu.bottom.question}
                            onChange={e => updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, bottom: { ...entry.megaMenu.bottom, question: e.target.value } } })}
                            placeholder="What is an eSIM?" className={inp} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Lbl t="CTA Button Label" />
                            <input value={entry.megaMenu.bottom.cta}
                              onChange={e => updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, bottom: { ...entry.megaMenu.bottom, cta: e.target.value } } })}
                              placeholder="Browse All Plans" className={inp} />
                          </div>
                          <div>
                            <Lbl t="CTA Button URL" />
                            <input value={entry.megaMenu.bottom.ctaHref}
                              onChange={e => updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, bottom: { ...entry.megaMenu.bottom, ctaHref: e.target.value } } })}
                              placeholder="/destinations" className={inp} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add new menu item */}
      <button
        onClick={addEntry}
        className="flex items-center gap-3 px-5 py-4 rounded-2xl border-2 border-dashed border-gray-300 text-[14px] font-bold text-gray-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition w-full justify-center"
      >
        <Plus className="w-5 h-5" /> Add Menu Item
      </button>

      {/* Bottom save */}
      <div className="flex justify-end pt-2">
        <SaveBar saving={saving} saved={saved} onSave={save} />
      </div>
    </div>
  );
}

export function HeaderFooterEditor() {
  const qc = useQueryClient();
  const { data: allContent } = useQuery({ queryKey: ["admin-content"], queryFn: () => apiGet("/api/admin/content") });

  const [header, setHeader] = useState(DEFAULT_HEADER_V2);
  const [footer, setFooter] = useState(DEFAULT_FOOTER);
  const [hSaving, setHSaving] = useState(false);
  const [hSaved, setHSaved] = useState(false);
  const [fSaving, setFSaving] = useState(false);
  const [fSaved, setFSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<"header" | "footer">("header");
  const [fColOpen, setFColOpen] = useState<number | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [itemSubTab, setItemSubTab] = useState<Record<number, "columns" | "slides" | "bottombar">>({});
  const getSubTab = (i: number) => itemSubTab[i] ?? "columns";
  const setSubTab = (i: number, t: "columns" | "slides" | "bottombar") => setItemSubTab(prev => ({ ...prev, [i]: t }));

  useEffect(() => {
    if (!allContent) return;
    if (allContent.header) setHeader(h => ({ ...h, ...(allContent.header as typeof DEFAULT_HEADER_V2) }));
    if (allContent.footer) setFooter(f => ({ ...f, ...(allContent.footer as typeof DEFAULT_FOOTER) }));
  }, [allContent]);

  const saveHeader = async () => {
    setHSaving(true);
    await apiPut("/api/admin/content/header", header);
    qc.invalidateQueries({ queryKey: ["admin-content"] });
    qc.invalidateQueries({ queryKey: ["website-content"] });
    setHSaving(false); setHSaved(true);
    setTimeout(() => setHSaved(false), 2500);
  };

  const saveFooter = async () => {
    setFSaving(true);
    await apiPut("/api/admin/content/footer", footer);
    qc.invalidateQueries({ queryKey: ["admin-content"] });
    qc.invalidateQueries({ queryKey: ["website-content"] });
    setFSaving(false); setFSaved(true);
    setTimeout(() => setFSaved(false), 2500);
  };

  const updEntry = (i: number, e: CmsNavEntry) =>
    setHeader(h => ({ ...h, navEntries: h.navEntries.map((en, idx) => idx === i ? e : en) }));
  const removeEntry = (i: number) =>
    setHeader(h => ({ ...h, navEntries: h.navEntries.filter((_, idx) => idx !== i) }));
  const moveEntry = (i: number, d: -1|1) => {
    const arr = [...header.navEntries]; const j = i + d;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setHeader(h => ({ ...h, navEntries: arr }));
  };
  const addEntry = () => setHeader(h => ({ ...h, navEntries: [...h.navEntries, { label: "New Menu", badge: "", megaMenu: BLANK_MEGA }] }));

  const updFCol = (i: number, col: FooterColumn) =>
    setFooter(f => ({ ...f, columns: f.columns.map((c, idx) => idx === i ? col : c) }));

  return (
    <div className="p-6 space-y-6">
      {/* Section Tabs */}
      <div className="flex gap-2">
        {(["header", "footer"] as const).map(s => (
          <button key={s} onClick={() => setActiveSection(s)}
            className={`px-5 py-2 rounded-xl text-[13.5px] font-bold transition-all ${activeSection === s ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            {s === "header" ? "Header" : "Footer"}
          </button>
        ))}
      </div>

      {/* ─── HEADER ─── */}
      {activeSection === "header" && (
        <div className="space-y-6">

          {/* Top banner */}
          <div className="rounded-2xl border border-gray-200 p-6">
            <SectionHeader title="Top Announcement Banner" sub="The slim bar at the very top of every page" icon="/icons/note-text.json" />
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 bg-gray-50">
                <div>
                  <p className="text-[14px] font-bold text-gray-900">Enable Banner</p>
                  <p className="text-[12.5px] text-gray-400 mt-0.5">Show the announcement bar across all pages</p>
                </div>
                <Toggle on={header.topBannerEnabled} onChange={v => setHeader(h => ({ ...h, topBannerEnabled: v }))} />
              </div>
              <div><Lbl t="Banner Text" /><input value={header.topBannerText} onChange={e => setHeader(h => ({ ...h, topBannerText: e.target.value }))} className={inp} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Lbl t="Link Label" /><input value={header.topBannerLinkLabel} onChange={e => setHeader(h => ({ ...h, topBannerLinkLabel: e.target.value }))} placeholder="Learn More" className={inp} /></div>
                <div><Lbl t="Link URL" /><input value={header.topBannerLinkHref} onChange={e => setHeader(h => ({ ...h, topBannerLinkHref: e.target.value }))} placeholder="#" className={inp} /></div>
              </div>
            </div>
          </div>

          {/* Nav Menu — full inline editor */}
          <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
            <SectionHeader title="Navigation Menu Items" sub="Each item appears in the top nav bar. Expand to edit its mega-menu dropdown." icon="/icons/global.json" />

            {/* How it works guide */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 flex gap-4">
              <div className="text-[20px] shrink-0">🗂️</div>
              <div className="text-[13px] text-blue-700 space-y-0.5">
                <p className="font-bold text-blue-800">How menu editing works</p>
                <p>Each <strong>Menu Item</strong> (Plans, Destinations…) is a top-level nav button. Expand one to edit its label and dropdown.</p>
                <p>Inside the dropdown you have <strong>Columns</strong> (groups of links), an <strong>Image Slider</strong>, and a <strong>Bottom Bar</strong> CTA.</p>
                <p>Under each Column, click <strong>+ Add Submenu Item</strong> to add individual links with an icon, label, description and URL.</p>
              </div>
            </div>

            {/* Menu items list */}
            <div className="space-y-3">
              {header.navEntries.map((entry, i) => {
                const isOpen = expandedIdx === i;
                const subTab = getSubTab(i);
                const totalItems = entry.megaMenu.cols.reduce((s, c) => s + c.items.length, 0);
                return (
                  <div key={i} className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                    {/* Item header row */}
                    <div className="flex items-center gap-0 border-b border-gray-100">
                      <button
                        onClick={() => setExpandedIdx(isOpen ? null : i)}
                        className="flex-1 flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition text-left"
                      >
                        <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center text-[13px] font-black shrink-0">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[15px] font-bold text-gray-900">{entry.label || `Menu Item ${i + 1}`}</span>
                            {entry.badge && (
                              <span className="text-[10px] font-bold text-white bg-emerald-500 px-2 py-0.5 rounded-full">{entry.badge}</span>
                            )}
                          </div>
                          <p className="text-[12px] text-gray-400 mt-0.5">
                            {entry.megaMenu.cols.length} column{entry.megaMenu.cols.length !== 1 ? "s" : ""} · {totalItems} submenu item{totalItems !== 1 ? "s" : ""} · {entry.megaMenu.slides.length} slide{entry.megaMenu.slides.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
                      </button>
                      <div className="flex items-center gap-0.5 px-3 shrink-0">
                        <button onClick={() => moveEntry(i, -1)} disabled={i === 0} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition" title="Move up"><ChevronUp className="w-4 h-4 text-gray-500" /></button>
                        <button onClick={() => moveEntry(i, 1)} disabled={i === header.navEntries.length - 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition" title="Move down"><ChevronDown className="w-4 h-4 text-gray-500" /></button>
                        <button onClick={() => removeEntry(i)} className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>

                    {/* Expanded editing area */}
                    {isOpen && (
                      <div className="bg-gray-50 p-5 space-y-5">
                        {/* Label & Badge */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                          <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-3">Menu Item Settings</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Lbl t="Label" req />
                              <input value={entry.label} onChange={e => updEntry(i, { ...entry, label: e.target.value })} placeholder="Plans" className={inp} />
                            </div>
                            <div>
                              <Lbl t="Badge (optional)" />
                              <input value={entry.badge} onChange={e => updEntry(i, { ...entry, badge: e.target.value })} placeholder="New" className={inp} />
                              <p className="text-[11px] text-gray-400 mt-1">Short label shown as a green pill next to the item (e.g. "New")</p>
                            </div>
                          </div>
                        </div>

                        {/* Dropdown sub-tabs */}
                        <div>
                          <p className="text-[13px] font-bold text-gray-700 mb-3">Dropdown Mega-Menu</p>
                          <div className="flex gap-1 mb-4 bg-white border border-gray-200 p-1 rounded-xl w-fit">
                            {([
                              { key: "columns",   label: "📋 Columns & Submenu Items" },
                              { key: "slides",    label: "🖼️ Image Slider" },
                              { key: "bottombar", label: "🔗 Bottom Bar" },
                            ] as const).map(({ key, label }) => (
                              <button key={key} onClick={() => setSubTab(i, key)}
                                className={`px-4 py-2 rounded-lg text-[12.5px] font-bold transition-all whitespace-nowrap ${subTab === key ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                                {label}
                              </button>
                            ))}
                          </div>

                          {/* COLUMNS */}
                          {subTab === "columns" && (
                            <div className="space-y-4">
                              <p className="text-[12.5px] text-gray-500">Columns group your submenu links. Each column has a heading and a list of submenu items.</p>
                              {entry.megaMenu.cols.map((col, ci) => (
                                <div key={ci} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                                  <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] font-black">{ci + 1}</div>
                                      <input
                                        value={col.heading}
                                        onChange={e => {
                                          const cols = entry.megaMenu.cols.map((c, idx) => idx === ci ? { ...c, heading: e.target.value } : c);
                                          updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, cols } });
                                        }}
                                        placeholder="Column heading…"
                                        className="text-[13.5px] font-bold text-gray-800 bg-transparent border-b border-transparent focus:border-green-400 outline-none px-0 py-0.5 w-48 transition"
                                      />
                                      <span className="text-[11px] text-gray-400">({col.items.length} items)</span>
                                    </div>
                                    <button
                                      onClick={() => {
                                        const cols = entry.megaMenu.cols.filter((_, idx) => idx !== ci);
                                        updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, cols } });
                                      }}
                                      className="flex items-center gap-1 text-[12px] text-red-400 hover:text-red-600 font-semibold transition"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" /> Remove column
                                    </button>
                                  </div>
                                  <div className="p-4 space-y-2">
                                    {col.items.map((item, ii) => (
                                      <div key={ii} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                                        <div className="flex items-center justify-between mb-2.5">
                                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Submenu Item {ii + 1}</span>
                                          <div className="flex gap-0.5">
                                            <button onClick={() => {
                                              const items = [...col.items]; if (ii > 0) { [items[ii], items[ii-1]] = [items[ii-1], items[ii]]; }
                                              const cols = entry.megaMenu.cols.map((c, idx) => idx === ci ? { ...c, items } : c);
                                              updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, cols } });
                                            }} disabled={ii === 0} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
                                            <button onClick={() => {
                                              const items = [...col.items]; if (ii < items.length - 1) { [items[ii], items[ii+1]] = [items[ii+1], items[ii]]; }
                                              const cols = entry.megaMenu.cols.map((c, idx) => idx === ci ? { ...c, items } : c);
                                              updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, cols } });
                                            }} disabled={ii === col.items.length - 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
                                            <button onClick={() => {
                                              const items = col.items.filter((_, idx) => idx !== ii);
                                              const cols = entry.megaMenu.cols.map((c, idx) => idx === ci ? { ...c, items } : c);
                                              updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, cols } });
                                            }} className="p-1 rounded hover:bg-red-50 text-red-400"><Trash2 className="w-3 h-3" /></button>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="col-span-2">
                                            <IconPickerField
                                              label="Icon"
                                              value={item.icon}
                                              onChange={v => {
                                                const items = col.items.map((it, idx) => idx === ii ? { ...it, icon: v } : it);
                                                const cols = entry.megaMenu.cols.map((c, idx) => idx === ci ? { ...c, items } : c);
                                                updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, cols } });
                                              }}
                                            />
                                          </div>
                                          <div>
                                            <p className="text-[11px] font-semibold text-gray-500 mb-1">Label</p>
                                            <input value={item.label} placeholder="eSIM for Travel"
                                              onChange={e => {
                                                const items = col.items.map((it, idx) => idx === ii ? { ...it, label: e.target.value } : it);
                                                const cols = entry.megaMenu.cols.map((c, idx) => idx === ci ? { ...c, items } : c);
                                                updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, cols } });
                                              }}
                                              className={smallInp} />
                                          </div>
                                          <div>
                                            <p className="text-[11px] font-semibold text-gray-500 mb-1">Badge <span className="font-normal text-gray-400">(optional)</span></p>
                                            <input value={item.badge} placeholder="Popular"
                                              onChange={e => {
                                                const items = col.items.map((it, idx) => idx === ii ? { ...it, badge: e.target.value } : it);
                                                const cols = entry.megaMenu.cols.map((c, idx) => idx === ci ? { ...c, items } : c);
                                                updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, cols } });
                                              }}
                                              className={smallInp} />
                                          </div>
                                          <div className="col-span-2">
                                            <p className="text-[11px] font-semibold text-gray-500 mb-1">Description</p>
                                            <input value={item.desc} placeholder="Short description shown under the label"
                                              onChange={e => {
                                                const items = col.items.map((it, idx) => idx === ii ? { ...it, desc: e.target.value } : it);
                                                const cols = entry.megaMenu.cols.map((c, idx) => idx === ci ? { ...c, items } : c);
                                                updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, cols } });
                                              }}
                                              className={smallInp} />
                                          </div>
                                          <div className="col-span-2">
                                            <p className="text-[11px] font-semibold text-gray-500 mb-1">Link URL</p>
                                            <input value={item.href} placeholder="/destinations"
                                              onChange={e => {
                                                const items = col.items.map((it, idx) => idx === ii ? { ...it, href: e.target.value } : it);
                                                const cols = entry.megaMenu.cols.map((c, idx) => idx === ci ? { ...c, items } : c);
                                                updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, cols } });
                                              }}
                                              className={smallInp} />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                    <button
                                      onClick={() => {
                                        const blank: CmsMenuItem = { icon: "/icons/global.json", label: "", badge: "", desc: "", href: "" };
                                        const items = [...col.items, blank];
                                        const cols = entry.megaMenu.cols.map((c, idx) => idx === ci ? { ...c, items } : c);
                                        updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, cols } });
                                      }}
                                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-emerald-300 text-[12.5px] font-bold text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400 transition w-full justify-center mt-1"
                                    >
                                      <Plus className="w-4 h-4" /> Add Submenu Item
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  const cols = [...entry.megaMenu.cols, { heading: "New Column", items: [] }];
                                  updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, cols } });
                                }}
                                className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-gray-300 text-[13px] font-bold text-gray-500 hover:border-gray-400 hover:text-gray-700 transition w-full justify-center"
                              >
                                <Plus className="w-4 h-4" /> Add Column
                              </button>
                            </div>
                          )}

                          {/* IMAGE SLIDER */}
                          {subTab === "slides" && (
                            <div className="space-y-3">
                              <p className="text-[12.5px] text-gray-500">These images appear in the right panel of the dropdown, rotating as a carousel.</p>
                              {entry.megaMenu.slides.map((sl, si) => (
                                <div key={si} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                                  <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                                    <span className="text-[13px] font-bold text-gray-700">Slide {si + 1}</span>
                                    <button onClick={() => {
                                      const slides = entry.megaMenu.slides.filter((_, idx) => idx !== si);
                                      updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, slides } });
                                    }} className="flex items-center gap-1 text-[12px] text-red-400 hover:text-red-600 font-semibold transition">
                                      <Trash2 className="w-3.5 h-3.5" /> Remove
                                    </button>
                                  </div>
                                  <div className="p-4 space-y-3">
                                    <ImageUploadField
                                      label="Image"
                                      value={sl.img}
                                      onChange={v => {
                                        const slides = entry.megaMenu.slides.map((s, idx) => idx === si ? { ...s, img: v } : s);
                                        updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, slides } });
                                      }}
                                      placeholder="https://images.unsplash.com/..."
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Lbl t="Title" />
                                        <input value={sl.title} placeholder="Best eSIMs for Summer"
                                          onChange={e => {
                                            const slides = entry.megaMenu.slides.map((s, idx) => idx === si ? { ...s, title: e.target.value } : s);
                                            updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, slides } });
                                          }}
                                          className={inp} />
                                      </div>
                                      <div>
                                        <Lbl t="Description" />
                                        <input value={sl.desc} placeholder="Short caption"
                                          onChange={e => {
                                            const slides = entry.megaMenu.slides.map((s, idx) => idx === si ? { ...s, desc: e.target.value } : s);
                                            updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, slides } });
                                          }}
                                          className={inp} />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  const slides = [...entry.megaMenu.slides, { img: "", title: "", desc: "" }];
                                  updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, slides } });
                                }}
                                className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-gray-300 text-[13px] font-bold text-gray-500 hover:border-gray-400 hover:text-gray-700 transition w-full justify-center"
                              >
                                <Plus className="w-4 h-4" /> Add Slide
                              </button>
                            </div>
                          )}

                          {/* BOTTOM BAR */}
                          {subTab === "bottombar" && (
                            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
                              <p className="text-[12.5px] text-gray-500">The bottom strip of the dropdown — a question text on the left and a CTA button on the right.</p>
                              <div>
                                <Lbl t="Question Text" />
                                <input value={entry.megaMenu.bottom.question}
                                  onChange={e => updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, bottom: { ...entry.megaMenu.bottom, question: e.target.value } } })}
                                  placeholder="What is an eSIM?" className={inp} />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Lbl t="CTA Button Label" />
                                  <input value={entry.megaMenu.bottom.cta}
                                    onChange={e => updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, bottom: { ...entry.megaMenu.bottom, cta: e.target.value } } })}
                                    placeholder="Browse All Plans" className={inp} />
                                </div>
                                <div>
                                  <Lbl t="CTA Button URL" />
                                  <input value={entry.megaMenu.bottom.ctaHref}
                                    onChange={e => updEntry(i, { ...entry, megaMenu: { ...entry.megaMenu, bottom: { ...entry.megaMenu.bottom, ctaHref: e.target.value } } })}
                                    placeholder="/destinations" className={inp} />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button onClick={addEntry}
              className="flex items-center gap-3 px-5 py-4 rounded-2xl border-2 border-dashed border-gray-300 text-[14px] font-bold text-gray-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition w-full justify-center">
              <Plus className="w-5 h-5" /> Add Menu Item
            </button>
          </div>

          {/* Action Buttons */}
          <div className="rounded-2xl border border-gray-200 p-6">
            <SectionHeader title="Action Buttons" sub="The search pill and sign-in button on the right side of the header" icon="/icons/setting.json" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div><Lbl t="Search Button Label" /><input value={header.searchBtnLabel} onChange={e => setHeader(h => ({ ...h, searchBtnLabel: e.target.value }))} className={inp} /></div>
              <div><Lbl t="Search Button URL" /><input value={header.searchBtnHref} onChange={e => setHeader(h => ({ ...h, searchBtnHref: e.target.value }))} className={inp} /></div>
              <div><Lbl t="Sign In Label" /><input value={header.signInLabel} onChange={e => setHeader(h => ({ ...h, signInLabel: e.target.value }))} className={inp} /></div>
              <div><Lbl t="Sign In URL" /><input value={header.signInHref} onChange={e => setHeader(h => ({ ...h, signInHref: e.target.value }))} className={inp} /></div>
            </div>
          </div>

          <div className="flex justify-end">
            <SaveBar saving={hSaving} saved={hSaved} onSave={saveHeader} />
          </div>
        </div>
      )}

      {/* ─── FOOTER ─── */}
      {activeSection === "footer" && (
        <div className="space-y-6">

          {/* ── App store + copyright ── */}
          <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
            <SectionHeader title="General" icon="/icons/setting.json" />
            <div><Lbl t="Copyright line" /><input value={footer.copyright} onChange={e => setFooter(f => ({ ...f, copyright: e.target.value }))} className={inp} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Lbl t="App Store link URL" /><input value={(footer as any).appStoreHref ?? ""} onChange={e => setFooter(f => ({ ...f, appStoreHref: e.target.value } as any))} placeholder="https://apps.apple.com/…" className={inp} /></div>
              <div><Lbl t="Google Play link URL" /><input value={(footer as any).googlePlayHref ?? ""} onChange={e => setFooter(f => ({ ...f, googlePlayHref: e.target.value } as any))} placeholder="https://play.google.com/…" className={inp} /></div>
            </div>
          </div>

          {/* ── Legal links (bottom bar) ── */}
          <div className="rounded-2xl border border-gray-200 p-6">
            <SectionHeader title="Legal Links" sub="Bottom bar links (Privacy Policy, Terms, etc.)" icon="/icons/security-card.json" />
            <ArrayEditor
              items={(footer as any).legalLinks ?? []}
              onChange={v => setFooter(f => ({ ...f, legalLinks: v } as any))}
              fields={[
                { key: "label", label: "Label",    placeholder: "Privacy Policy" },
                { key: "href",  label: "URL",       placeholder: "/privacy" },
              ]}
              addLabel="Add Legal Link"
            />
          </div>

          {/* ── Link columns ── */}
          <div className="rounded-2xl border border-gray-200 p-6">
            <SectionHeader title="Footer Link Columns" sub="Each column has a heading and a list of links" icon="/icons/note-text.json" />
            <div className="space-y-3">
              {footer.columns.map((col, ci) => (
                <div key={ci} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setFColOpen(fColOpen === ci ? null : ci)}
                    className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 hover:bg-gray-100 transition">
                    <span className="text-[13.5px] font-bold text-gray-800">{col.heading || `Column ${ci + 1}`} <span className="text-gray-400 font-normal text-[12px]">({col.links.length} links)</span></span>
                    {fColOpen === ci ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>
                  {fColOpen === ci && (
                    <div className="p-5 space-y-4 bg-white">
                      <div><Lbl t="Column Heading" /><input value={col.heading} onChange={e => updFCol(ci, { ...col, heading: e.target.value })} className={inp} /></div>
                      <div>
                        <Lbl t="Links" />
                        <ArrayEditor
                          items={col.links}
                          onChange={links => updFCol(ci, { ...col, links })}
                          fields={[
                            { key: "label", label: "Label", placeholder: "About Us" },
                            { key: "href",  label: "URL",   placeholder: "/about" },
                          ]}
                          addLabel="Add Link"
                        />
                      </div>
                      <button onClick={() => { setFooter(f => ({ ...f, columns: f.columns.filter((_, i) => i !== ci) })); setFColOpen(null); }}
                        className="flex items-center gap-1.5 text-[12.5px] font-semibold text-red-500 hover:text-red-600 transition">
                        <Trash2 className="w-3.5 h-3.5" /> Remove this column
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <button onClick={() => setFooter(f => ({ ...f, columns: [...f.columns, { heading: "New Column", links: [] }] }))}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-gray-300 text-[13px] font-semibold text-gray-500 hover:border-green-400 hover:text-green-600 transition w-full justify-center">
                <Plus className="w-4 h-4" /> Add Column
              </button>
            </div>
          </div>

          {/* ── Social links ── */}
          <div className="rounded-2xl border border-gray-200 p-6">
            <SectionHeader title="Social Links" sub="Shown as the last column — platform icons auto-matched" icon="/icons/global.json" />
            <div className="mb-4"><Lbl t="Column heading" /><input value={(footer as any).socialHeading ?? "Follow Us"} onChange={e => setFooter(f => ({ ...f, socialHeading: e.target.value } as any))} className={inp} /></div>
            <ArrayEditor
              items={footer.socialLinks}
              onChange={v => setFooter(f => ({ ...f, socialLinks: v }))}
              fields={[
                { key: "platform", label: "Platform  (facebook / twitter / instagram / linkedin / youtube / reddit)", placeholder: "facebook" },
                { key: "href",     label: "URL", placeholder: "https://facebook.com/voltey" },
              ]}
              addLabel="Add Social Link"
            />
          </div>

          <div className="flex justify-end">
            <SaveBar saving={fSaving} saved={fSaved} onSave={saveFooter} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   HOME PAGE EDITOR
══════════════════════════════════════════════ */
type HomeSection = "hero" | "press" | "feature-slides" | "slides" | "destinations" | "esim-info" | "features" | "got-you-covered" | "steps" | "reviews" | "faq" | "app" | "product-page";

const HOME_SECTIONS: { id: HomeSection; label: string }[] = [
  { id: "hero",             label: "Hero" },
  { id: "press",            label: "Press Logos" },
  { id: "feature-slides",   label: "Feature Slides" },
  { id: "slides",           label: "Promo Cards" },
  { id: "destinations",     label: "Destinations" },
  { id: "esim-info",        label: "eSIM Info" },
  { id: "features",         label: "Features" },
  { id: "got-you-covered",  label: "Got You Covered" },
  { id: "steps",            label: "How-to Steps" },
  { id: "reviews",          label: "Reviews" },
  { id: "faq",              label: "FAQ" },
  { id: "app",              label: "App Download" },
  { id: "product-page",     label: "Product Page" },
];

const DEFAULT_HOME = {
  press: {
    heading: "They talk about us",
    items: [
      { name: "Lonely Planet", href: "https://www.lonelyplanet.com", logo: "" },
      { name: "National Traveler", href: "#", logo: "" },
      { name: "Forbes", href: "https://www.forbes.com", logo: "" },
      { name: "CNN", href: "https://www.cnn.com", logo: "" },
      { name: "PC Magazine", href: "https://www.pcmag.com", logo: "" },
      { name: "TechRadar", href: "https://www.techradar.com", logo: "" },
    ] as { name: string; href: string; logo: string }[],
  },
  hero: {
    backgroundImage: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&h=900&q=85",
    backgroundVideo: "",
    badge: "Save on roaming",
    heading: "Affordable eSIM data for international travel",
    headingFontSize: "52",
    headingFontFamily: "Poppins, sans-serif",
    headingColor: "#111827",
    description: "",
    bullets: [
      "Instant eSIM delivery — no physical SIM needed",
      "4G / 5G networks in 190+ destinations",
      "Flexible plans from 1 GB to 50 GB",
    ],
    searchPlaceholder: "Search for destination",
    planLinkText: "plans and destinations",
  },
  searchModal: {
    title: "Where?",
    placeholder: "Enter your destination",
    popularLabel: "Most popular destinations",
    popularCodes: ["ES", "GR", "IT", "GL-WORLD", "GL-EU", "TR", "GB", "FR", "JP", "US"],
  },
  featureSlides: [
    { heading1: "Get a local number", heading2: "for your trip", body: "Call and text with your own local number from the Voltey eSIM app. Get a monthly subscription.", price: "US$0.99", unit: "/mo", cta: "Learn More", ctaHref: "/destinations", note: "eSIM compatibility check required before purchase.", bgColor: "#edeef8", photo: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1400&h=700&q=85", video: "" },
    { heading1: "Instant eSIM for", heading2: "190+ destinations", body: "Get connected in minutes with instant eSIM delivery to your email. No physical SIM card needed.", price: "From US$1.99", unit: "/trip", cta: "Browse Plans", ctaHref: "/destinations", note: "Works on any eSIM-compatible iPhone or Android device.", bgColor: "#e8f4ea", photo: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1400&h=700&q=85", video: "" },
    { heading1: "Save up to 90%", heading2: "on roaming charges", body: "Skip expensive carrier roaming fees. Affordable 4G/5G data plans for every destination worldwide.", price: "From US$0.99", unit: "/day", cta: "Get Started", ctaHref: "/destinations", note: "Plans available in 190+ countries and regions.", bgColor: "#fef3e8", photo: "https://images.unsplash.com/photo-1530521954074-e64f4810b5d9?auto=format&fit=crop&w=1400&h=700&q=85", video: "" },
  ] as { heading1: string; heading2: string; body: string; price: string; unit: string; cta: string; ctaHref: string; note: string; bgColor: string; photo: string; video: string }[],
  slides: [
    { heading: "Refer friends, earn up to\nUS$100 in rewards!", body: "For a limited time, sharing Voltey can earn you up to US$50 in gift cards plus up to US$50 in Voltey credits! Join the Rewards sprint now.", cta: "Learn More", ctaHref: "#", photo: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&h=500&q=85", icon: "🎁" },
    { heading: "Get connected in minutes,\nanywhere in the world", body: "Instant eSIM delivery straight to your email. No physical SIM, no queues — activate your plan before you even board the plane.", cta: "Browse Plans", ctaHref: "/destinations", photo: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&h=500&q=85", icon: "✈️" },
    { heading: "Coverage in 190+\ndestinations worldwide", body: "From Europe to Asia, the Americas to the Middle East — Voltey has you covered with fast 4G/5G data plans wherever your adventure takes you.", cta: "See Destinations", ctaHref: "/destinations", photo: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=900&h=500&q=85", icon: "🌍" },
  ] as { heading: string; body: string; cta: string; ctaHref: string; photo: string; video: string; icon: string }[],
  destinations: {
    heading: "Choose your travel destination",
    subheading: "Pick a mobile data plan for your trip.",
    headingSize: 40,
    subheadingSize: 15,
    pageHeroHeading: "Save up to 35% on popular destination plans",
    pageHeroHeadingSize: 42,
    pageHeroHeadingColor: "#111827",
    pageHeroHeadingFont: "Poppins, sans-serif",
    pageHeroDesc: "Save on data plans across Europe, Asia, and the Americas — or grab one discounted multi-country eSIM covering entire regions! Every plan comes with instant email delivery.",
    pageHeroDescSize: 14,
    pageHeroDescColor: "#6b7280",
    pageAllHeading: "All destinations",
    pageAllHeadingSize: 32,
    pageAllHeadingColor: "#111827",
    pageAllHeadingFont: "Poppins, sans-serif",
    pageAllDesc: "Find the best data plans in over 190+ destinations — and enjoy easy and safe internet access wherever you go.",
    pageAllDescSize: 14,
    pageAllDescColor: "#6b7280",
    pageSearchPlaceholder: "Search for destination",
  },
  esimInfo: {
    heading: "What is an eSIM?", headingSize: 40, descSize: 14, description: "An eSIM is a virtual or digital SIM card that lets you connect to mobile networks without a physical SIM card.", badge1: "easy to use", badge2: "easy to install", badge3: "easy to enjoy", btnLabel: "More details", btnHref: "#", photo: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1400&h=700&q=85", video: "", bgColor: "#dcf0f5",
    slide2Heading: "Enjoy unlimited data in 3 steps", slide2HeadingSize: 40, slide2BgColor: "#fef9f2", slide2Photo1: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=320&h=200&q=80", slide2Photo2: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=320&h=200&q=80",
    slide2Steps: [{ num: "01.", title: "Find your destination", body: "and select the days for the data plan you need!", icon: "/icons/map.json" }, { num: "02.", title: "Install your eSIM", body: "using the setup guide in your email.", icon: "/icons/simcard.json" }, { num: "03.", title: "Turn on your eSIM at arrival", body: "and connect instantly.", icon: "/icons/wifi.json" }] as { num: string; title: string; body: string; icon: string }[],
    slide3Heading1: "Works on your", slide3Heading2: "device", slide3HeadingSize: 40, slide3DescSize: 14, slide3Description: "Compatible with all eSIM-capable iPhones and Android devices. Check if your phone supports eSIM in seconds — most modern devices do.", slide3Bullets: ["iPhone XS and later", "Samsung Galaxy S20 and later", "Google Pixel 3 and later", "Most modern Android flagships"] as string[], slide3BtnLabel: "Check compatibility", slide3BtnHref: "/destinations", slide3Photo: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1400&h=700&q=85", slide3Video: "", slide3BgColor: "#e8f4ea",
  },
  featureSlidesSizes: { heading1Size: 40, bodySize: 14, priceSize: 32 },
  slidesSizes: { headingSize: 40, bodySize: 13 },
  features: {
    sectionBadge: "Why choose Voltey?",
    heading: "Stay connected while traveling",
    badgeSize: 12,
    headingSize: 40,
    itemTitleSize: 15,
    itemBodySize: 13,
    items: [
      { title: "International data plans", desc: "Get cellular data that works for your budget and itinerary. From 1 GB to unlimited plans." },
      { title: "Easy to use", desc: "Just download the Voltey eSIM app, install the eSIM, and add an eSIM data plan." },
      { title: "Avoid roaming charges", desc: "Stay online wherever you go – get a Global eSIM data plan." },
      { title: "One eSIM for all your travels", desc: "Add new destinations to your existing Voltey eSIM." },
      { title: "Get mobile data usage alerts", desc: "Don't risk running out of data at the worst possible moment." },
      { title: "Global and regional plans", desc: "Stay online wherever you go – get a Global eSIM data plan." },
    ] as { title: string; desc: string }[],
    gotYouCoveredImages: ["", "", "", "", "", ""] as string[],
    gotYouCoveredHeading: "Enjoy reliable and affordable internet\nin your trips. We got you covered.",
    gotYouCoveredHeadingSize: 40,
    gotYouCoveredItems: [
      { title: "Keep using your favorite Apps",        desc: "Get that safe ride home, find that great restaurant, and pin the local attractions, **all while staying connected with your loved ones.**", learnMoreHref: "" },
      { title: "Earn Voltey Rewards after buying",     desc: "**Earn reward points** when you buy an eSIM or refer a friend, and use them on future purchases!", learnMoreHref: "" },
      { title: "Keep your WhatsApp number",            desc: "You can call and message all your contacts on WhatsApp, **like you're in the same country.** Don't lose touch with family and friends.", learnMoreHref: "" },
      { title: "24/7 Customer support",                desc: "In need of assistance? **Our 24/7 chat support** is just a message away to keep you connected and **help you** with everything you need.", learnMoreHref: "" },
      { title: "Money-back guarantee",                 desc: "Purchase your Voltey eSIM with **peace of mind.** If your plans change, **you'll have up to 7 days** to request a refund.", learnMoreHref: "/destinations" },
      { title: "Fast and reliable Internet connection", desc: "Connect to the **best networks at your destination** and get internet that is consistent and high-speed.", learnMoreHref: "" },
    ] as { title: string; desc: string; learnMoreHref: string }[],
  },
  steps: {
    heading: "How to use Voltey",
    headingSize: 40,
    itemTitleSize: 17,
    itemBodySize: 13,
    items: [
      { num: "01", title: "Download the App", desc: "Get the Voltey eSIM app from the App Store or Google Play." },
      { num: "02", title: "Choose a Plan", desc: "Browse our 1000+ data plans for 190+ destinations." },
      { num: "03", title: "Install Your eSIM", desc: "Activate your eSIM in minutes — no physical card needed." },
      { num: "04", title: "Travel & Stay Connected", desc: "Enjoy fast data wherever your journey takes you." },
    ] as { num: string; title: string; desc: string }[],
  },
  reviews: {
    heading: "Voltey reviews from travelers",
    headingSize: 40,
    nameSize: 14,
    bodySize: 13,
    items: [
      { name: "Alex M.", location: "Traveled to Japan", text: "Amazing service! The eSIM worked perfectly from the moment I landed.", rating: "5", youtubeId: "" },
      { name: "Sarah K.", location: "Traveled to Europe", text: "Best eSIM provider I've used. Fast setup and great coverage.", rating: "5", youtubeId: "" },
      { name: "James T.", location: "Traveled to USA", text: "Super affordable and reliable. Will use again!", rating: "5", youtubeId: "" },
    ] as { name: string; location: string; text: string; rating: string; youtubeId: string }[],
    masonryItems: [
      { type: "review",   name: "Jorge A.",  location: "", text: "Easy, cheap and fast. Easy step to step setup and troubleshooting, super fast speed (around 100 mbps). Cheap, great coverage and helpful chat/assistance. Keep up the good work.", rating: "5", badge: "trustpilot", pub: "", pubType: "", videoId: "", videoTitle: "" },
      { type: "youtube",  name: "",          location: "", text: "",  rating: "", badge: "", pub: "", pubType: "", videoId: "P4N9Pi4QONE", videoTitle: "Review 1" },
      { type: "reel",     name: "",          location: "", text: "",  rating: "", badge: "", pub: "", pubType: "", videoId: "scTiMKfRwKs", videoTitle: "Review 2" },
      { type: "featured", name: "",          location: "", text: "Voltey is an affordable, easy-to-use, and sustainable eSIM service that gives reliable mobile and internet connections from anywhere in the world. That's why we recommend Voltey as our eSIM partner.", rating: "", badge: "", pub: "lonely planet", pubType: "lonely-planet", videoId: "", videoTitle: "" },
      { type: "youtube",  name: "",          location: "", text: "",  rating: "", badge: "", pub: "", pubType: "", videoId: "gG7uCskUOrA", videoTitle: "Review 3" },
      { type: "reel",     name: "",          location: "", text: "",  rating: "", badge: "", pub: "", pubType: "", videoId: "jNQXAC9IVRw", videoTitle: "Review 4" },
      { type: "reel",     name: "",          location: "", text: "",  rating: "", badge: "", pub: "", pubType: "", videoId: "7Q-k8zVG8sI", videoTitle: "Review 5" },
      { type: "review",   name: "Domas R.", location: "",  text: "Awesome — used Voltey across 3 countries already (UK, Netherlands and Belgium). Took me like 1min to buy eSIM and activate it. My internet was way better than my friends' who remained connected to their local providers and used roaming plans instead.", rating: "5", badge: "trustpilot", pub: "", pubType: "", videoId: "", videoTitle: "" },
      { type: "youtube",  name: "",          location: "", text: "",  rating: "", badge: "", pub: "", pubType: "", videoId: "BQ0mxQXmLsk", videoTitle: "Review 6" },
      { type: "press",    name: "",          location: "", text: "With comprehensive coverage and affordable prices, Voltey is the best eSIM for Europe. Activating Voltey is straightforward. Download the app, choose your plan, and surf the internet. You can contact the Voltey customer support team via live chat or email if you encounter any issues.", rating: "", badge: "", pub: "cybernews", pubType: "cybernews", videoId: "", videoTitle: "" },
      { type: "reel",     name: "",          location: "", text: "",  rating: "", badge: "", pub: "", pubType: "", videoId: "dQw4w9WgXcQ", videoTitle: "Review 7" },
      { type: "press",    name: "",          location: "", text: "As a product backed by the reputable NordVPN brand, Voltey benefits from the company's focus on security and privacy. Users praise its easy installation process, affordable pricing, and reliable coverage across the world.", rating: "", badge: "", pub: "techradar", pubType: "techradar", videoId: "", videoTitle: "" },
      { type: "youtube",  name: "",          location: "", text: "",  rating: "", badge: "", pub: "", pubType: "", videoId: "9bZkp7q19f0", videoTitle: "Review 8" },
    ] as any[],
  },
  faq: {
    heading: "Frequently asked questions",
    headingSize: 40,
    questionSize: 15,
    answerSize: 14,
    items: [
      { question: "What is an eSIM?", answer: "An eSIM is a digital SIM card embedded in your device that can be activated remotely." },
      { question: "How do I install my eSIM?", answer: "After purchase, you'll receive a QR code. Scan it in your device settings to activate." },
      { question: "Which devices support eSIM?", answer: "Most modern smartphones, tablets, and smartwatches support eSIM." },
    ] as { question: string; answer: string }[],
  },
  app: {
    heading: "Download the Voltey app",
    headingSize: 40,
    bodySize: 14,
    description: "Manage your eSIMs, monitor data usage, and add top-ups on the go.",
    appStoreHref: "#",
    playStoreHref: "#",
    photo: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&h=500&q=80",
  },
  destinationPage: {
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
  },
};

export function HomePageEditor() {
  const qc = useQueryClient();
  const { data: allContent } = useQuery({ queryKey: ["admin-content"], queryFn: () => apiGet("/api/admin/content") });
  const [data, setData] = useState(DEFAULT_HOME);
  const [section, setSection] = useState<HomeSection>("hero");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (allContent?.home) {
      const h = allContent.home as any;
      const normalizedSlides = (h.slides || []).map((s: any) => ({
        heading: s.heading || s.title || "",
        body: s.body || s.subtitle || "",
        cta: s.cta || s.btnLabel || "Learn More",
        ctaHref: s.ctaHref || s.btnHref || "#",
        photo: s.photo || "",
        video: s.video || "",
        icon: s.icon || "",
      }));
      setData(d => ({ ...d, ...(h as typeof DEFAULT_HOME), slides: normalizedSlides.length ? normalizedSlides : d.slides }));
    }
  }, [allContent]);

  const save = async () => {
    setSaving(true);
    await apiPut("/api/admin/content/home", data);
    qc.invalidateQueries({ queryKey: ["admin-content"] });
    qc.invalidateQueries({ queryKey: ["website-content"] });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const upd = useCallback(<K extends keyof typeof DEFAULT_HOME>(key: K, val: (typeof DEFAULT_HOME)[K]) => {
    setData(d => ({ ...d, [key]: val }));
  }, []);

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap gap-2">
        {HOME_SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className={`px-4 py-1.5 rounded-xl text-[13px] font-semibold transition-all ${section === s.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── HERO ── */}
      {section === "hero" && (
        <div className="rounded-2xl border border-gray-200 p-6 space-y-5">
          <SectionHeader title="Hero Section" sub="The large banner at the very top of the homepage" icon="/icons/home-trend-up.json" />
          <div>
            <Lbl t="Background Image" req />
            <ImageUploadField value={data.hero.backgroundImage} onChange={v => upd("hero", { ...data.hero, backgroundImage: v })} placeholder="https://... or upload a file" />
          </div>
          <div>
            <Lbl t="Background Video" />
            <p className="text-[11px] text-gray-400 mb-1.5">If set, the video plays instead of the image. Keep under ~12 MB for fast loading.</p>
            <VideoUploadField value={data.hero.backgroundVideo ?? ""} onChange={v => upd("hero", { ...data.hero, backgroundVideo: v })} placeholder="https://... or upload an MP4/WebM" />
          </div>
          <div><Lbl t="Badge Text" /><input value={data.hero.badge} onChange={e => upd("hero", { ...data.hero, badge: e.target.value })} placeholder="Save on roaming" className={inp} /></div>
          <div>
            <Lbl t="Main Heading" req />
            <textarea value={data.hero.heading} onChange={e => upd("hero", { ...data.hero, heading: e.target.value })} rows={2} className={ta} />
          </div>
          <div className="space-y-1.5">
            <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Font Sizes</p>
            <FSize label="Heading size" value={data.hero.headingSize || 48} onChange={v => upd("hero", { ...data.hero, headingSize: v })} />
            <FSize label="Body / bullets size" value={data.hero.bodySize || 14} onChange={v => upd("hero", { ...data.hero, bodySize: v })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Lbl t="Font Size (px)" />
              <input type="number" value={data.hero.headingFontSize} onChange={e => upd("hero", { ...data.hero, headingFontSize: e.target.value })} min="20" max="120" className={inp} />
            </div>
            <div>
              <Lbl t="Font Family" />
              <select value={data.hero.headingFontFamily} onChange={e => upd("hero", { ...data.hero, headingFontFamily: e.target.value })} className={inp}>
                {["Poppins, sans-serif", "Inter, sans-serif", "Georgia, serif", "Playfair Display, serif", "Montserrat, sans-serif", "Roboto, sans-serif"].map(f => (
                  <option key={f} value={f}>{f.split(",")[0]}</option>
                ))}
              </select>
            </div>
            <div>
              <Lbl t="Heading Color" />
              <div className="flex items-center gap-2">
                <input type="color" value={data.hero.headingColor} onChange={e => upd("hero", { ...data.hero, headingColor: e.target.value })} className="w-10 h-10 rounded-xl border border-gray-200 p-0.5 cursor-pointer" />
                <input type="text" value={data.hero.headingColor} onChange={e => upd("hero", { ...data.hero, headingColor: e.target.value })} className={inp} />
              </div>
            </div>
          </div>
          <div>
            <Lbl t="Description / Sub-heading" />
            <textarea value={data.hero.description} onChange={e => upd("hero", { ...data.hero, description: e.target.value })} rows={2} placeholder="Optional sub-heading text below the main heading" className={ta} />
          </div>
          <div>
            <Lbl t="Bullet Points" />
            <div className="space-y-2">
              {data.hero.bullets.map((b, i) => (
                <div key={i} className="flex gap-2">
                  <input value={b} onChange={e => { const next = [...data.hero.bullets]; next[i] = e.target.value; upd("hero", { ...data.hero, bullets: next }); }} className={inp} />
                  <button onClick={() => { const next = data.hero.bullets.filter((_, idx) => idx !== i); upd("hero", { ...data.hero, bullets: next }); }} className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              <button onClick={() => upd("hero", { ...data.hero, bullets: [...data.hero.bullets, ""] })}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-gray-300 text-[13px] font-semibold text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors">
                <Plus className="w-4 h-4" /> Add Bullet
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Lbl t="Search Bar Placeholder" /><input value={data.hero.searchPlaceholder} onChange={e => upd("hero", { ...data.hero, searchPlaceholder: e.target.value })} className={inp} /></div>
            <div><Lbl t="Plans Link Text" /><input value={data.hero.planLinkText} onChange={e => upd("hero", { ...data.hero, planLinkText: e.target.value })} className={inp} /></div>
          </div>

          {/* ── Search Modal ── */}
          <div className="rounded-2xl border border-gray-200 p-5 space-y-4">
            <SectionHeader title="Search Modal" sub="Popup that appears when clicking the hero search bar" icon="/icons/message.json" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Lbl t="Modal Title" />
                <input value={(data as any).searchModal?.title || "Where?"} onChange={e => upd("searchModal", { ...(data as any).searchModal, title: e.target.value })} className={inp} placeholder="Where?" />
              </div>
              <div>
                <Lbl t="Input Placeholder" />
                <input value={(data as any).searchModal?.placeholder || "Enter your destination"} onChange={e => upd("searchModal", { ...(data as any).searchModal, placeholder: e.target.value })} className={inp} placeholder="Enter your destination" />
              </div>
            </div>
            <div>
              <Lbl t="Popular Destinations Label" />
              <input value={(data as any).searchModal?.popularLabel || "Most popular destinations"} onChange={e => upd("searchModal", { ...(data as any).searchModal, popularLabel: e.target.value })} className={inp} placeholder="Most popular destinations" />
            </div>
            <div>
              <Lbl t="Popular Destination Codes" />
              <p className="text-[11px] text-gray-400 mb-1.5">Comma-separated location codes shown when no query is typed. E.g. <code className="bg-gray-100 px-1 rounded">ES,GR,IT,TR,GB,FR,JP,US</code></p>
              <input
                value={((data as any).searchModal?.popularCodes || []).join(",")}
                onChange={e => upd("searchModal", { ...(data as any).searchModal, popularCodes: e.target.value.split(",").map((s: string) => s.trim().toUpperCase()).filter(Boolean) })}
                className={inp}
                placeholder="ES,GR,IT,TR,GB,FR,JP,US"
              />
            </div>
            {/* Mini preview */}
            <div className="rounded-xl border border-gray-100 p-4 bg-gray-50 space-y-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Preview</p>
              <div className="bg-white rounded-xl shadow-sm p-4" style={{ maxWidth: 340 }}>
                <p className="font-semibold text-gray-900 mb-3" style={{ fontSize: 20 }}>{(data as any).searchModal?.title || "Where?"}</p>
                <div className="rounded-lg border border-gray-300 px-3 py-2.5 text-[14px] text-gray-400 mb-3">
                  {(data as any).searchModal?.placeholder || "Enter your destination"}
                </div>
                <p className="text-[12px] text-gray-500 font-medium">{(data as any).searchModal?.popularLabel || "Most popular destinations"}</p>
              </div>
            </div>
          </div>

          {data.hero.heading && (
            <div className="p-5 rounded-2xl border-2 border-dashed border-green-300 bg-emerald-50/20">
              <p className="text-[12px] font-bold text-emerald-600 mb-3 uppercase tracking-wide">Live Preview</p>
              <div className="rounded-xl overflow-hidden bg-gray-900 p-8 text-white">
                {data.hero.badge && <p className="text-[12px] font-bold text-emerald-400 mb-3">✦ {data.hero.badge}</p>}
                <h1 style={{ fontSize: `${Math.min(Number(data.hero.headingFontSize) || 52, 40)}px`, fontFamily: data.hero.headingFontFamily, color: data.hero.headingColor }} className="font-black leading-tight mb-3">{data.hero.heading}</h1>
                {data.hero.bullets.map((b, i) => <p key={i} className="text-[13px] text-white/70">✓ {b}</p>)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── FEATURE SLIDES ── */}
      {section === "feature-slides" && (
        <div className="rounded-2xl border border-gray-200 p-6 space-y-5">
          <SectionHeader title="Feature Slides" sub="The 3-panel carousel showcasing price & value props (below press logos)" icon="/icons/category.json" />
          <div className="space-y-6">
            {data.featureSlides.map((slide, i) => (
              <div key={i} className="rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <span className="text-[13px] font-bold text-gray-700">Slide {i + 1}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Lbl t="Heading Line 1" />
                    <input value={slide.heading1} onChange={e => { const n = [...data.featureSlides]; n[i] = { ...n[i], heading1: e.target.value }; upd("featureSlides", n); }} className={inp} placeholder="Get a local number" />
                  </div>
                  <div>
                    <Lbl t="Heading Line 2" />
                    <input value={slide.heading2} onChange={e => { const n = [...data.featureSlides]; n[i] = { ...n[i], heading2: e.target.value }; upd("featureSlides", n); }} className={inp} placeholder="for your trip" />
                  </div>
                </div>
                <div>
                  <Lbl t="Body Text" />
                  <textarea value={slide.body} onChange={e => { const n = [...data.featureSlides]; n[i] = { ...n[i], body: e.target.value }; upd("featureSlides", n); }} rows={2} className={inp + " resize-none"} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="col-span-2">
                    <Lbl t="Price" />
                    <input value={slide.price} onChange={e => { const n = [...data.featureSlides]; n[i] = { ...n[i], price: e.target.value }; upd("featureSlides", n); }} className={inp} placeholder="From US$0.99" />
                  </div>
                  <div>
                    <Lbl t="Unit" />
                    <input value={slide.unit} onChange={e => { const n = [...data.featureSlides]; n[i] = { ...n[i], unit: e.target.value }; upd("featureSlides", n); }} className={inp} placeholder="/day" />
                  </div>
                  <div>
                    <Lbl t="Background Color" />
                    <div className="flex items-center gap-2">
                      <input type="color" value={slide.bgColor || "#edeef8"} onChange={e => { const n = [...data.featureSlides]; n[i] = { ...n[i], bgColor: e.target.value }; upd("featureSlides", n); }} className="w-10 h-9 rounded cursor-pointer border border-gray-200 p-0.5" />
                      <span className="text-[11px] text-gray-500 font-mono">{slide.bgColor || "#edeef8"}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Lbl t="Button Label" />
                    <input value={slide.cta} onChange={e => { const n = [...data.featureSlides]; n[i] = { ...n[i], cta: e.target.value }; upd("featureSlides", n); }} className={inp} placeholder="Get Started" />
                  </div>
                  <div>
                    <Lbl t="Button Link" />
                    <input value={slide.ctaHref} onChange={e => { const n = [...data.featureSlides]; n[i] = { ...n[i], ctaHref: e.target.value }; upd("featureSlides", n); }} className={inp} placeholder="/destinations" />
                  </div>
                </div>
                <div>
                  <Lbl t="Footer Note" />
                  <input value={slide.note} onChange={e => { const n = [...data.featureSlides]; n[i] = { ...n[i], note: e.target.value }; upd("featureSlides", n); }} className={inp} />
                </div>
                <div>
                  <Lbl t="Background Image" />
                  <ImageUploadField value={slide.photo} onChange={v => { const n = [...data.featureSlides]; n[i] = { ...n[i], photo: v }; upd("featureSlides", n); }} placeholder="https://... or upload image" />
                </div>
                <div>
                  <Lbl t="Background Video (overrides image)" />
                  <VideoUploadField value={slide.video} onChange={v => { const n = [...data.featureSlides]; n[i] = { ...n[i], video: v }; upd("featureSlides", n); }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400">Changes save and reflect live on the website. Recommended image size: 1400×700 px. Video overrides image when set.</p>
        </div>
      )}

      {/* ── PRESS LOGOS ── */}
      {section === "press" && (
        <div className="rounded-2xl border border-gray-200 p-6 space-y-5">
          <SectionHeader title="Press Logos Bar" sub='"They talk about us" section — logos shown after the hero' icon="/icons/global.json" />
          <div>
            <Lbl t="Section Heading" />
            <input value={data.press.heading} onChange={e => upd("press", { ...data.press, heading: e.target.value })} className={inp} />
          </div>
          <FSize label="Heading size" value={data.press.headingSize || 17} onChange={v => upd("press", { ...data.press, headingSize: v })} />
          <div className="space-y-4">
            {data.press.items.map((item, i) => (
              <div key={i} className="rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-bold text-gray-700">Logo {i + 1}</span>
                  <button onClick={() => upd("press", { ...data.press, items: data.press.items.filter((_, idx) => idx !== i) })} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Lbl t="Publication Name" />
                    <input value={item.name} onChange={e => { const n = [...data.press.items]; n[i] = { ...n[i], name: e.target.value }; upd("press", { ...data.press, items: n }); }} className={inp} placeholder="Forbes" />
                  </div>
                  <div>
                    <Lbl t="Link URL (optional)" />
                    <input value={item.href} onChange={e => { const n = [...data.press.items]; n[i] = { ...n[i], href: e.target.value }; upd("press", { ...data.press, items: n }); }} className={inp} placeholder="https://..." />
                  </div>
                </div>
                <div>
                  <Lbl t="Logo Image (optional — leave blank to use styled text)" />
                  <ImageUploadField value={item.logo} onChange={v => { const n = [...data.press.items]; n[i] = { ...n[i], logo: v }; upd("press", { ...data.press, items: n }); }} placeholder="https://... or upload logo" />
                </div>
              </div>
            ))}
            <button
              onClick={() => upd("press", { ...data.press, items: [...data.press.items, { name: "Publication", href: "#", logo: "" }] })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-gray-300 text-[13px] font-semibold text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors">
              <Plus className="w-4 h-4" /> Add Logo
            </button>
          </div>
          <p className="text-[11px] text-gray-400">If no image is uploaded, the name is displayed as styled text. Recommended logo size: 120×40 px, transparent background PNG.</p>
        </div>
      )}

      {/* ── PROMO SLIDES ── */}
      {section === "slides" && (
        <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
          <SectionHeader title="Promo Cards" sub="The promotional slider shown on the home page" icon="/icons/category.json" />
          <div className="space-y-6">
            {data.slides.map((slide, i) => (
              <div key={i} className="rounded-xl border border-gray-200 p-5 space-y-4 relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-bold text-gray-700">Card {i + 1}</span>
                  <button onClick={() => upd("slides", data.slides.filter((_, idx) => idx !== i))} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div><Lbl t="Heading (use \n for line break)" /><textarea value={slide.heading} onChange={e => { const n = [...data.slides]; n[i] = { ...n[i], heading: e.target.value }; upd("slides", n); }} rows={2} className={ta} /></div>
                <div><Lbl t="Body Text" /><textarea value={slide.body} onChange={e => { const n = [...data.slides]; n[i] = { ...n[i], body: e.target.value }; upd("slides", n); }} rows={2} className={ta} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Lbl t="Button Label" /><input value={slide.cta} onChange={e => { const n = [...data.slides]; n[i] = { ...n[i], cta: e.target.value }; upd("slides", n); }} className={inp} /></div>
                  <div><Lbl t="Button URL" /><input value={slide.ctaHref} onChange={e => { const n = [...data.slides]; n[i] = { ...n[i], ctaHref: e.target.value }; upd("slides", n); }} className={inp} /></div>
                </div>
                <div><Lbl t="Icon (emoji)" /><input value={slide.icon} onChange={e => { const n = [...data.slides]; n[i] = { ...n[i], icon: e.target.value }; upd("slides", n); }} placeholder="🎁" className={inp} style={{ maxWidth: 80 }} /></div>
                <div>
                  <Lbl t="Background Photo" />
                  <ImageUploadField value={slide.photo} onChange={v => { const n = [...data.slides]; n[i] = { ...n[i], photo: v }; upd("slides", n); }} placeholder="https://... or upload" />
                </div>
                <div>
                  <Lbl t="Background Video" />
                  <p className="text-[11px] text-gray-400 mb-1.5">If set, the video loops as the card background instead of the photo.</p>
                  <VideoUploadField value={(slide as any).video ?? ""} onChange={v => { const n = [...data.slides]; n[i] = { ...n[i], video: v }; upd("slides", n); }} placeholder="https://... or upload an MP4/WebM" />
                </div>
              </div>
            ))}
            <button
              onClick={() => upd("slides", [...data.slides, { heading: "New Slide", body: "Slide description here.", cta: "Learn More", ctaHref: "#", photo: "", video: "", icon: "✨" }])}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-gray-300 text-[13px] font-semibold text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors">
              <Plus className="w-4 h-4" /> Add Card
            </button>
          </div>
        </div>
      )}

      {/* ── DESTINATIONS SECTION ── */}
      {section === "destinations" && (
        <div className="rounded-2xl border border-gray-200 p-6 space-y-5">
          <SectionHeader title="Destinations Page" sub="Edits the /destinations page text and typography" icon="/icons/global.json" />

          {/* ── Home page destinations widget ── */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
            <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Home Page — Destinations Widget</p>
            <div><Lbl t="Widget Heading" /><input value={data.destinations.heading} onChange={e => upd("destinations", { ...data.destinations, heading: e.target.value })} className={inp} /></div>
            <div><Lbl t="Widget Sub-heading" /><input value={data.destinations.subheading} onChange={e => upd("destinations", { ...data.destinations, subheading: e.target.value })} className={inp} /></div>
            <div className="flex flex-wrap gap-4">
              <FSize label="Heading size" value={(data.destinations as any).headingSize || 40} onChange={v => upd("destinations", { ...data.destinations, headingSize: v } as any)} />
              <FSize label="Sub-heading size" value={(data.destinations as any).subheadingSize || 15} onChange={v => upd("destinations", { ...data.destinations, subheadingSize: v } as any)} />
            </div>
          </div>

          {/* ── Destinations page hero ── */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
            <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Destinations Page — Hero</p>
            <div>
              <Lbl t="Heading" />
              <textarea value={(data.destinations as any).pageHeroHeading || ""} onChange={e => upd("destinations", { ...data.destinations, pageHeroHeading: e.target.value } as any)} rows={2} className={ta} placeholder="Save up to 35% on popular destination plans" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Lbl t="Font Size (px)" />
                <input type="number" min="16" max="100" value={(data.destinations as any).pageHeroHeadingSize || 42} onChange={e => upd("destinations", { ...data.destinations, pageHeroHeadingSize: Number(e.target.value) } as any)} className={inp} />
              </div>
              <div>
                <Lbl t="Font Family" />
                <select value={(data.destinations as any).pageHeroHeadingFont || "Poppins, sans-serif"} onChange={e => upd("destinations", { ...data.destinations, pageHeroHeadingFont: e.target.value } as any)} className={inp}>
                  {["Poppins, sans-serif","Inter, sans-serif","Georgia, serif","Playfair Display, serif","Montserrat, sans-serif","Roboto, sans-serif"].map(f => <option key={f} value={f}>{f.split(",")[0]}</option>)}
                </select>
              </div>
              <div>
                <Lbl t="Heading Color" />
                <div className="flex items-center gap-2">
                  <input type="color" value={(data.destinations as any).pageHeroHeadingColor || "#111827"} onChange={e => upd("destinations", { ...data.destinations, pageHeroHeadingColor: e.target.value } as any)} className="w-10 h-10 rounded-xl border border-gray-200 p-0.5 cursor-pointer" />
                  <input type="text" value={(data.destinations as any).pageHeroHeadingColor || "#111827"} onChange={e => upd("destinations", { ...data.destinations, pageHeroHeadingColor: e.target.value } as any)} className={inp} />
                </div>
              </div>
            </div>
            <div>
              <Lbl t="Description" />
              <textarea value={(data.destinations as any).pageHeroDesc || ""} onChange={e => upd("destinations", { ...data.destinations, pageHeroDesc: e.target.value } as any)} rows={3} className={ta} placeholder="Save on data plans across Europe, Asia..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Lbl t="Description Size (px)" />
                <input type="number" min="10" max="30" value={(data.destinations as any).pageHeroDescSize || 14} onChange={e => upd("destinations", { ...data.destinations, pageHeroDescSize: Number(e.target.value) } as any)} className={inp} />
              </div>
              <div>
                <Lbl t="Description Color" />
                <div className="flex items-center gap-2">
                  <input type="color" value={(data.destinations as any).pageHeroDescColor || "#6b7280"} onChange={e => upd("destinations", { ...data.destinations, pageHeroDescColor: e.target.value } as any)} className="w-10 h-10 rounded-xl border border-gray-200 p-0.5 cursor-pointer" />
                  <input type="text" value={(data.destinations as any).pageHeroDescColor || "#6b7280"} onChange={e => upd("destinations", { ...data.destinations, pageHeroDescColor: e.target.value } as any)} className={inp} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Destinations page "All destinations" section ── */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
            <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Destinations Page — "All Destinations" Section</p>
            <div>
              <Lbl t="Section Heading" />
              <input value={(data.destinations as any).pageAllHeading || ""} onChange={e => upd("destinations", { ...data.destinations, pageAllHeading: e.target.value } as any)} className={inp} placeholder="All destinations" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Lbl t="Font Size (px)" />
                <input type="number" min="16" max="100" value={(data.destinations as any).pageAllHeadingSize || 32} onChange={e => upd("destinations", { ...data.destinations, pageAllHeadingSize: Number(e.target.value) } as any)} className={inp} />
              </div>
              <div>
                <Lbl t="Font Family" />
                <select value={(data.destinations as any).pageAllHeadingFont || "Poppins, sans-serif"} onChange={e => upd("destinations", { ...data.destinations, pageAllHeadingFont: e.target.value } as any)} className={inp}>
                  {["Poppins, sans-serif","Inter, sans-serif","Georgia, serif","Playfair Display, serif","Montserrat, sans-serif","Roboto, sans-serif"].map(f => <option key={f} value={f}>{f.split(",")[0]}</option>)}
                </select>
              </div>
              <div>
                <Lbl t="Heading Color" />
                <div className="flex items-center gap-2">
                  <input type="color" value={(data.destinations as any).pageAllHeadingColor || "#111827"} onChange={e => upd("destinations", { ...data.destinations, pageAllHeadingColor: e.target.value } as any)} className="w-10 h-10 rounded-xl border border-gray-200 p-0.5 cursor-pointer" />
                  <input type="text" value={(data.destinations as any).pageAllHeadingColor || "#111827"} onChange={e => upd("destinations", { ...data.destinations, pageAllHeadingColor: e.target.value } as any)} className={inp} />
                </div>
              </div>
            </div>
            <div>
              <Lbl t="Description" />
              <textarea value={(data.destinations as any).pageAllDesc || ""} onChange={e => upd("destinations", { ...data.destinations, pageAllDesc: e.target.value } as any)} rows={2} className={ta} placeholder="Find the best data plans in over 190+..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Lbl t="Description Size (px)" />
                <input type="number" min="10" max="30" value={(data.destinations as any).pageAllDescSize || 14} onChange={e => upd("destinations", { ...data.destinations, pageAllDescSize: Number(e.target.value) } as any)} className={inp} />
              </div>
              <div>
                <Lbl t="Description Color" />
                <div className="flex items-center gap-2">
                  <input type="color" value={(data.destinations as any).pageAllDescColor || "#6b7280"} onChange={e => upd("destinations", { ...data.destinations, pageAllDescColor: e.target.value } as any)} className="w-10 h-10 rounded-xl border border-gray-200 p-0.5 cursor-pointer" />
                  <input type="text" value={(data.destinations as any).pageAllDescColor || "#6b7280"} onChange={e => upd("destinations", { ...data.destinations, pageAllDescColor: e.target.value } as any)} className={inp} />
                </div>
              </div>
            </div>
            <div>
              <Lbl t="Search Bar Placeholder" />
              <input value={(data.destinations as any).pageSearchPlaceholder || ""} onChange={e => upd("destinations", { ...data.destinations, pageSearchPlaceholder: e.target.value } as any)} className={inp} placeholder="Search for destination" />
            </div>
          </div>
        </div>
      )}

      {/* ── ESIM INFO ── */}
      {section === "esim-info" && (
        <div className="rounded-2xl border border-gray-200 p-6 space-y-6">
          <SectionHeader title="eSIM Info Section" sub="3-slide carousel — edit all slides below" icon="/icons/simcard.json" />

          {/* Slide 1 */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
            <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Slide 1 — What is an eSIM?</p>
            <div><Lbl t="Heading" /><input value={data.esimInfo.heading} onChange={e => upd("esimInfo", { ...data.esimInfo, heading: e.target.value })} className={inp} /></div>
            <div><Lbl t="Description" /><textarea value={data.esimInfo.description} onChange={e => upd("esimInfo", { ...data.esimInfo, description: e.target.value })} rows={3} className={ta} /></div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <FSize label="Heading size" value={data.esimInfo.headingSize || 40} onChange={v => upd("esimInfo", { ...data.esimInfo, headingSize: v })} />
              <FSize label="Desc size" value={data.esimInfo.descSize || 14} onChange={v => upd("esimInfo", { ...data.esimInfo, descSize: v })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><Lbl t="Badge 1" /><input value={data.esimInfo.badge1} onChange={e => upd("esimInfo", { ...data.esimInfo, badge1: e.target.value })} className={inp} /></div>
              <div><Lbl t="Badge 2" /><input value={data.esimInfo.badge2} onChange={e => upd("esimInfo", { ...data.esimInfo, badge2: e.target.value })} className={inp} /></div>
              <div><Lbl t="Badge 3" /><input value={data.esimInfo.badge3} onChange={e => upd("esimInfo", { ...data.esimInfo, badge3: e.target.value })} className={inp} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Lbl t="Button Label" /><input value={data.esimInfo.btnLabel} onChange={e => upd("esimInfo", { ...data.esimInfo, btnLabel: e.target.value })} className={inp} /></div>
              <div><Lbl t="Button URL" /><input value={data.esimInfo.btnHref} onChange={e => upd("esimInfo", { ...data.esimInfo, btnHref: e.target.value })} className={inp} /></div>
            </div>
            <div>
              <Lbl t="Overlay Color" />
              <div className="flex items-center gap-3">
                <input type="color" value={data.esimInfo.bgColor || "#dcf0f5"} onChange={e => upd("esimInfo", { ...data.esimInfo, bgColor: e.target.value })} className="w-10 h-9 rounded cursor-pointer border border-gray-200 p-0.5" />
                <span className="text-[11px] text-gray-500 font-mono">{data.esimInfo.bgColor || "#dcf0f5"}</span>
              </div>
            </div>
            <div><Lbl t="Background Image" /><ImageUploadField value={data.esimInfo.photo || ""} onChange={v => upd("esimInfo", { ...data.esimInfo, photo: v })} placeholder="https://... or upload (1400×700 px)" /></div>
            <div><Lbl t="Background Video (overrides image)" /><VideoUploadField value={data.esimInfo.video || ""} onChange={v => upd("esimInfo", { ...data.esimInfo, video: v })} /></div>
          </div>

          {/* Slide 2 */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
            <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Slide 2 — 3 Steps</p>
            <div><Lbl t="Heading" /><input value={data.esimInfo.slide2Heading || ""} onChange={e => upd("esimInfo", { ...data.esimInfo, slide2Heading: e.target.value })} className={inp} /></div>
            <FSize label="Heading size" value={data.esimInfo.slide2HeadingSize || 40} onChange={v => upd("esimInfo", { ...data.esimInfo, slide2HeadingSize: v })} />
            <div>
              <Lbl t="Background Color" />
              <div className="flex items-center gap-3">
                <input type="color" value={data.esimInfo.slide2BgColor || "#fef9f2"} onChange={e => upd("esimInfo", { ...data.esimInfo, slide2BgColor: e.target.value })} className="w-10 h-9 rounded cursor-pointer border border-gray-200 p-0.5" />
                <span className="text-[11px] text-gray-500 font-mono">{data.esimInfo.slide2BgColor || "#fef9f2"}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Lbl t="Left Photo (top)" /><ImageUploadField value={data.esimInfo.slide2Photo1 || ""} onChange={v => upd("esimInfo", { ...data.esimInfo, slide2Photo1: v })} placeholder="https://... or upload" /></div>
              <div><Lbl t="Left Photo (bottom)" /><ImageUploadField value={data.esimInfo.slide2Photo2 || ""} onChange={v => upd("esimInfo", { ...data.esimInfo, slide2Photo2: v })} placeholder="https://... or upload" /></div>
            </div>
            <div className="space-y-2">
              <Lbl t="Step Cards" />
              {(data.esimInfo.slide2Steps ?? []).map((step, i) => (
                <div key={i} className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
                  <p className="text-[11px] font-semibold text-gray-500">Step {i + 1}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div><Lbl t="Number" /><input value={step.num} onChange={e => { const s = [...data.esimInfo.slide2Steps]; s[i] = { ...s[i], num: e.target.value }; upd("esimInfo", { ...data.esimInfo, slide2Steps: s }); }} className={inp} /></div>
                    <div className="col-span-2"><Lbl t="Title" /><input value={step.title} onChange={e => { const s = [...data.esimInfo.slide2Steps]; s[i] = { ...s[i], title: e.target.value }; upd("esimInfo", { ...data.esimInfo, slide2Steps: s }); }} className={inp} /></div>
                  </div>
                  <div><Lbl t="Body" /><input value={step.body} onChange={e => { const s = [...data.esimInfo.slide2Steps]; s[i] = { ...s[i], body: e.target.value }; upd("esimInfo", { ...data.esimInfo, slide2Steps: s }); }} className={inp} /></div>
                  <div>
                    <Lbl t="Icon" />
                    <select value={step.icon || ""} onChange={e => { const s = [...data.esimInfo.slide2Steps]; s[i] = { ...s[i], icon: e.target.value }; upd("esimInfo", { ...data.esimInfo, slide2Steps: s }); }} className={inp}>
                      {LOTTIE_ICONS.map(ic => <option key={ic} value={`/icons/${ic}.json`}>{ic}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Slide 3 */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
            <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Slide 3 — Device Compatibility</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Lbl t="Heading Line 1" /><input value={data.esimInfo.slide3Heading1 || ""} onChange={e => upd("esimInfo", { ...data.esimInfo, slide3Heading1: e.target.value })} className={inp} /></div>
              <div><Lbl t="Heading Line 2" /><input value={data.esimInfo.slide3Heading2 || ""} onChange={e => upd("esimInfo", { ...data.esimInfo, slide3Heading2: e.target.value })} className={inp} /></div>
            </div>
            <div><Lbl t="Description" /><textarea value={data.esimInfo.slide3Description || ""} onChange={e => upd("esimInfo", { ...data.esimInfo, slide3Description: e.target.value })} rows={3} className={ta} /></div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <FSize label="Heading size" value={data.esimInfo.slide3HeadingSize || 40} onChange={v => upd("esimInfo", { ...data.esimInfo, slide3HeadingSize: v })} />
              <FSize label="Desc size" value={data.esimInfo.slide3DescSize || 14} onChange={v => upd("esimInfo", { ...data.esimInfo, slide3DescSize: v })} />
            </div>
            <div className="space-y-2">
              <Lbl t="Bullet List Items" />
              {(data.esimInfo.slide3Bullets ?? []).map((b, i) => (
                <div key={i} className="flex gap-2">
                  <input value={b} onChange={e => { const bullets = [...data.esimInfo.slide3Bullets]; bullets[i] = e.target.value; upd("esimInfo", { ...data.esimInfo, slide3Bullets: bullets }); }} className={inp + " flex-1"} />
                  <button onClick={() => { const bullets = data.esimInfo.slide3Bullets.filter((_, idx) => idx !== i); upd("esimInfo", { ...data.esimInfo, slide3Bullets: bullets }); }} className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              <button onClick={() => upd("esimInfo", { ...data.esimInfo, slide3Bullets: [...(data.esimInfo.slide3Bullets ?? []), "New item"] })} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-[12px] text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors"><Plus className="w-3.5 h-3.5" />Add bullet</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Lbl t="Button Label" /><input value={data.esimInfo.slide3BtnLabel || ""} onChange={e => upd("esimInfo", { ...data.esimInfo, slide3BtnLabel: e.target.value })} className={inp} /></div>
              <div><Lbl t="Button URL" /><input value={data.esimInfo.slide3BtnHref || ""} onChange={e => upd("esimInfo", { ...data.esimInfo, slide3BtnHref: e.target.value })} className={inp} /></div>
            </div>
            <div>
              <Lbl t="Overlay Color" />
              <div className="flex items-center gap-3">
                <input type="color" value={data.esimInfo.slide3BgColor || "#e8f4ea"} onChange={e => upd("esimInfo", { ...data.esimInfo, slide3BgColor: e.target.value })} className="w-10 h-9 rounded cursor-pointer border border-gray-200 p-0.5" />
                <span className="text-[11px] text-gray-500 font-mono">{data.esimInfo.slide3BgColor || "#e8f4ea"}</span>
              </div>
            </div>
            <div><Lbl t="Background Image" /><ImageUploadField value={data.esimInfo.slide3Photo || ""} onChange={v => upd("esimInfo", { ...data.esimInfo, slide3Photo: v })} placeholder="https://... or upload (1400×700 px)" /></div>
            <div><Lbl t="Background Video (overrides image)" /><VideoUploadField value={data.esimInfo.slide3Video || ""} onChange={v => upd("esimInfo", { ...data.esimInfo, slide3Video: v })} /></div>
          </div>
        </div>
      )}

      {/* ── FEATURES ── */}
      {section === "features" && (
        <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
          <SectionHeader title="Features / Why Voltey Section" icon="/icons/chart.json" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Lbl t="Section Badge" /><input value={data.features.sectionBadge} onChange={e => upd("features", { ...data.features, sectionBadge: e.target.value })} className={inp} /></div>
            <div><Lbl t="Section Heading" /><input value={data.features.heading} onChange={e => upd("features", { ...data.features, heading: e.target.value })} className={inp} /></div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <FSize label="Badge size" value={data.features.badgeSize || 12} onChange={v => upd("features", { ...data.features, badgeSize: v })} />
            <FSize label="Heading size" value={data.features.headingSize || 40} onChange={v => upd("features", { ...data.features, headingSize: v })} />
            <FSize label="Item title size" value={data.features.itemTitleSize || 15} onChange={v => upd("features", { ...data.features, itemTitleSize: v })} />
            <FSize label="Item body size" value={data.features.itemBodySize || 13} onChange={v => upd("features", { ...data.features, itemBodySize: v })} />
          </div>
          <div>
            <Lbl t="Feature Items (Why Choose Voltey cards)" />
            <ArrayEditor
              items={data.features.items}
              onChange={v => upd("features", { ...data.features, items: v })}
              fields={[
                { key: "title", label: "Title",       placeholder: "International data plans" },
                { key: "desc",  label: "Description", placeholder: "Get cellular data..." },
              ]}
              addLabel="Add Feature"
            />
          </div>
          {/* Pointer to the dedicated tab */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
            <span className="text-blue-500 text-[18px] shrink-0 mt-0.5">📌</span>
            <p className="text-[13px] text-blue-800 leading-snug">
              The <strong>"We got you covered"</strong> 6-card section (with icons and feature descriptions) has its own dedicated tab: <strong>Got You Covered</strong>. Switch to that tab to edit the heading, icons, and card text.
            </p>
          </div>
        </div>
      )}

      {/* ── GOT YOU COVERED ── */}
      {section === "got-you-covered" && (() => {
        const DEFAULT_TITLES = [
          "Keep using your favorite Apps",
          "Earn Voltey Rewards after buying",
          "Keep your WhatsApp number",
          "24/7 Customer support",
          "Money-back guarantee",
          "Fast and reliable Internet connection",
        ];
        const DEFAULT_DESCS = [
          "Get that safe ride home, find that great restaurant, and pin the local attractions, **all while staying connected with your loved ones.**",
          "**Earn reward points** when you buy an eSIM or refer a friend, and use them on future purchases!",
          "You can call and message all your contacts on WhatsApp, **like you're in the same country.** Don't lose touch with family and friends.",
          "In need of assistance? **Our 24/7 chat support** is just a message away to keep you connected and **help you** with everything you need.",
          "Purchase your Voltey eSIM with **peace of mind.** If your plans change, **you'll have up to 7 days** to request a refund.",
          "Connect to the **best networks at your destination** and get internet that is consistent and high-speed.",
        ];
        const imgs: string[] = (data.features as any).gotYouCoveredImages || ["","","","","",""];
        const items: any[] = (data.features as any).gotYouCoveredItems || [];
        return (
          <div className="space-y-5">
            {/* Heading card */}
            <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
              <SectionHeader title="Got You Covered — Section" sub="The 6-card feature grid below the eSIM info slides" icon="/icons/category.json" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Lbl t="Section Heading" />
                  <textarea
                    value={(data.features as any).gotYouCoveredHeading || ""}
                    onChange={e => upd("features", { ...data.features, gotYouCoveredHeading: e.target.value } as any)}
                    rows={3}
                    className={ta}
                    placeholder={"Enjoy reliable and affordable internet\nin your trips. We got you covered."}
                  />
                  <p className="text-[11px] text-gray-400 mt-0.5">Press Enter inside the field to create a line break in the heading.</p>
                </div>
                <div className="flex items-start pt-5">
                  <FSize label="Heading size (px)" value={(data.features as any).gotYouCoveredHeadingSize || 40} onChange={v => upd("features", { ...data.features, gotYouCoveredHeadingSize: v } as any)} />
                </div>
              </div>
            </div>

            {/* 6 item cards */}
            {DEFAULT_TITLES.map((defaultTitle, i) => {
              const item = items[i] || { title: defaultTitle, desc: DEFAULT_DESCS[i], learnMoreHref: "" };
              const updItem = (patch: any) => {
                const next = [...items];
                next[i] = { ...item, ...patch };
                upd("features", { ...data.features, gotYouCoveredItems: next } as any);
              };
              return (
                <div key={i} className="rounded-2xl border border-gray-200 p-6 space-y-4">
                  <SectionHeader title={`Card ${i + 1} — ${item.title || defaultTitle}`} sub="Edit icon/image, title, and description" icon="/icons/note-text.json" />

                  {/* Image / Icon upload */}
                  <div>
                    <Lbl t="Icon / Image" />
                    <ImageUploadField
                      value={imgs[i] || ""}
                      onChange={v => {
                        const next = [...imgs];
                        next[i] = v;
                        upd("features", { ...data.features, gotYouCoveredImages: next } as any);
                      }}
                      placeholder="Upload an image or paste a URL — leave blank to use the default illustrated icon"
                    />
                    {imgs[i] && (
                      <div className="mt-2 flex items-center gap-3">
                        <img src={imgs[i]} alt="preview" className="h-16 w-auto rounded-lg object-contain border border-gray-200 p-1 bg-white" onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
                        <button type="button" onClick={() => { const next = [...imgs]; next[i] = ""; upd("features", { ...data.features, gotYouCoveredImages: next } as any); }} className="text-[12px] text-red-500 hover:text-red-700 font-medium">Remove image (use default icon)</button>
                      </div>
                    )}
                    {!imgs[i] && (
                      <p className="text-[11px] text-gray-400 mt-1">Currently showing the default illustrated icon. Upload a PNG/SVG/JPG to replace it.</p>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <Lbl t="Title" />
                    <input value={item.title || ""} onChange={e => updItem({ title: e.target.value })} className={inp} placeholder={defaultTitle} />
                  </div>

                  {/* Description */}
                  <div>
                    <Lbl t="Description" />
                    <textarea value={item.desc || ""} onChange={e => updItem({ desc: e.target.value })} rows={3} className={ta} placeholder={DEFAULT_DESCS[i]} />
                    <p className="text-[11px] text-gray-400 mt-0.5">Wrap text in <code className="bg-gray-100 px-1 rounded">**bold**</code> to make it bold.</p>
                  </div>

                  {/* Learn More link */}
                  <div>
                    <Lbl t="Learn More Link (optional)" />
                    <input value={item.learnMoreHref || ""} onChange={e => updItem({ learnMoreHref: e.target.value })} className={inp} placeholder="/destinations or https://..." />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ── STEPS ── */}
      {section === "steps" && (
        <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
          <SectionHeader title="How-to Steps" sub="The numbered steps section" icon="/icons/category.json" />
          <div><Lbl t="Section Heading" /><input value={data.steps.heading} onChange={e => upd("steps", { ...data.steps, heading: e.target.value })} className={inp} /></div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <FSize label="Heading size" value={data.steps.headingSize || 40} onChange={v => upd("steps", { ...data.steps, headingSize: v })} />
            <FSize label="Item title size" value={data.steps.itemTitleSize || 17} onChange={v => upd("steps", { ...data.steps, itemTitleSize: v })} />
            <FSize label="Item body size" value={data.steps.itemBodySize || 13} onChange={v => upd("steps", { ...data.steps, itemBodySize: v })} />
          </div>
          <ArrayEditor
            items={data.steps.items}
            onChange={v => upd("steps", { ...data.steps, items: v })}
            fields={[
              { key: "num",   label: "Step Number", placeholder: "01" },
              { key: "title", label: "Title",        placeholder: "Download the App" },
              { key: "desc",  label: "Description",  placeholder: "Get the Voltey app..." },
            ]}
            addLabel="Add Step"
          />
        </div>
      )}

      {/* ── REVIEWS ── */}
      {section === "reviews" && (
        <div className="rounded-2xl border border-gray-200 p-6 space-y-6">
          <SectionHeader title="Reviews Section" sub="Edit masonry cards — reviews, videos, press quotes" icon="/icons/home-trend-up.json" />

          {/* heading + font sizes */}
          <div><Lbl t="Section Heading" /><input value={data.reviews.heading} onChange={e => upd("reviews", { ...data.reviews, heading: e.target.value })} className={inp} /></div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <FSize label="Heading size" value={data.reviews.headingSize || 40} onChange={v => upd("reviews", { ...data.reviews, headingSize: v })} />
            <FSize label="Name size"    value={data.reviews.nameSize || 14}    onChange={v => upd("reviews", { ...data.reviews, nameSize: v })} />
            <FSize label="Body size"    value={data.reviews.bodySize || 13}    onChange={v => upd("reviews", { ...data.reviews, bodySize: v })} />
          </div>

          {/* ── Simple top-grid reviews ── */}
          <div className="border-t pt-4">
            <Lbl t="Top Review Grid (simple text cards)" />
            <p className="text-[12px] text-gray-400 mb-3">These appear above the masonry section as a simple 3-column grid.</p>
            <ArrayEditor
              items={data.reviews.items}
              onChange={v => upd("reviews", { ...data.reviews, items: v })}
              fields={[
                { key: "name",      label: "Reviewer Name",  placeholder: "Alex M." },
                { key: "location",  label: "Location / Trip", placeholder: "Traveled to Japan" },
                { key: "text",      label: "Review Text",     placeholder: "Amazing service..." },
                { key: "rating",    label: "Star Rating (1-5)", placeholder: "5" },
                { key: "youtubeId", label: "YouTube Video ID (optional)", placeholder: "dQw4w9WgXcQ" },
              ]}
              addLabel="Add Review"
            />
          </div>

          {/* ── Masonry items editor ── */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Lbl t="Masonry Section Cards" />
                <p className="text-[12px] text-gray-400 mt-0.5">Cards are split into 4 columns. Reorder to rearrange the layout.</p>
              </div>
            </div>

            {(data.reviews.masonryItems || []).map((item: any, idx: number) => {
              const mi: any[] = data.reviews.masonryItems || [];
              const upItem = (patch: any) => {
                const next = [...mi];
                next[idx] = { ...next[idx], ...patch };
                upd("reviews", { ...data.reviews, masonryItems: next });
              };
              const moveUp = () => { if (idx === 0) return; const a = [...mi]; [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; upd("reviews", { ...data.reviews, masonryItems: a }); };
              const moveDn = () => { if (idx === mi.length-1) return; const a = [...mi]; [a[idx], a[idx+1]] = [a[idx+1], a[idx]]; upd("reviews", { ...data.reviews, masonryItems: a }); };
              const remove = () => { const a = mi.filter((_: any, i: number) => i !== idx); upd("reviews", { ...data.reviews, masonryItems: a }); };

              const typeLabel: Record<string,string> = { review: "Review Card", press: "Press Card", featured: "Featured Quote", youtube: "YouTube Video (16:9)", reel: "Reel / Short (9:16)" };
              const pubOptions = [
                { value: "trustpilot",    label: "Trustpilot" },
                { value: "cybernews",     label: "cybernews" },
                { value: "techradar",     label: "techradar" },
                { value: "lonely-planet", label: "Lonely Planet" },
                { value: "custom",        label: "Custom text" },
              ];

              return (
                <div key={idx} className="rounded-xl border border-gray-200 p-4 space-y-3 bg-gray-50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">
                      {idx + 1}. {typeLabel[item.type] || item.type}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={moveUp} disabled={idx === 0} className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 transition"><ChevronUp className="w-3.5 h-3.5 text-gray-500" /></button>
                      <button onClick={moveDn} disabled={idx === mi.length-1} className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 transition"><ChevronDown className="w-3.5 h-3.5 text-gray-500" /></button>
                      <button onClick={remove} className="p-1.5 rounded hover:bg-red-50 text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  {/* Type selector */}
                  <div>
                    <Lbl t="Card Type" />
                    <select value={item.type} onChange={e => upItem({ type: e.target.value })} className={inp}>
                      <option value="review">Review Card</option>
                      <option value="press">Press Card</option>
                      <option value="featured">Featured Quote</option>
                      <option value="youtube">YouTube Video (16:9)</option>
                      <option value="reel">Reel / Short (9:16)</option>
                    </select>
                  </div>

                  {/* Video fields */}
                  {(item.type === "youtube" || item.type === "reel") && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Lbl t="YouTube Video ID" />
                        <input value={item.videoId || ""} onChange={e => upItem({ videoId: e.target.value })} placeholder="dQw4w9WgXcQ" className={inp} />
                        <p className="text-[11px] text-gray-400 mt-1">from youtube.com/watch?v=<strong>ID</strong> or youtu.be/<strong>ID</strong></p>
                      </div>
                      <div><Lbl t="Title (optional)" /><input value={item.videoTitle || ""} onChange={e => upItem({ videoTitle: e.target.value })} placeholder="Review video" className={inp} /></div>
                    </div>
                  )}

                  {/* Review fields */}
                  {item.type === "review" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div><Lbl t="Reviewer Name" /><input value={item.name || ""} onChange={e => upItem({ name: e.target.value })} placeholder="Alex M." className={inp} /></div>
                        <div><Lbl t="Location / Trip" /><input value={item.location || ""} onChange={e => upItem({ location: e.target.value })} placeholder="Traveled to Japan" className={inp} /></div>
                      </div>
                      <div><Lbl t="Review Text" /><textarea value={item.text || ""} onChange={e => upItem({ text: e.target.value })} rows={2} className={ta} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Lbl t="Star Rating (1-5)" /><input value={item.rating || "5"} onChange={e => upItem({ rating: e.target.value })} placeholder="5" className={inp} /></div>
                        <div>
                          <Lbl t="Badge / Logo" />
                          <select value={item.badge || ""} onChange={e => upItem({ badge: e.target.value })} className={inp}>
                            <option value="">None</option>
                            <option value="trustpilot">Trustpilot</option>
                            <option value="cybernews">cybernews</option>
                            <option value="techradar">techradar</option>
                            <option value="lonely-planet">Lonely Planet</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Press card fields */}
                  {item.type === "press" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Lbl t="Publication Logo" />
                          <select value={item.pubType || ""} onChange={e => upItem({ pubType: e.target.value })} className={inp}>
                            {pubOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                        {item.pubType === "custom" && (
                          <div><Lbl t="Custom Name" /><input value={item.pub || ""} onChange={e => upItem({ pub: e.target.value })} placeholder="Forbes" className={inp} /></div>
                        )}
                      </div>
                      <div><Lbl t="Quote / Body Text" /><textarea value={item.text || ""} onChange={e => upItem({ text: e.target.value })} rows={3} className={ta} /></div>
                    </div>
                  )}

                  {/* Featured quote fields */}
                  {item.type === "featured" && (
                    <div className="space-y-2">
                      <div><Lbl t="Large Quote Text" /><textarea value={item.text || ""} onChange={e => upItem({ text: e.target.value })} rows={4} className={ta} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Lbl t="Publication Logo" />
                          <select value={item.pubType || ""} onChange={e => upItem({ pubType: e.target.value })} className={inp}>
                            {pubOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                        {item.pubType === "custom" && (
                          <div><Lbl t="Custom Name" /><input value={item.pub || ""} onChange={e => upItem({ pub: e.target.value })} placeholder="Forbes" className={inp} /></div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add Item buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { type: "review",   label: "+ Review Card" },
                { type: "press",    label: "+ Press Card" },
                { type: "featured", label: "+ Featured Quote" },
                { type: "youtube",  label: "+ YouTube Video" },
                { type: "reel",     label: "+ Reel / Short" },
              ].map(btn => (
                <button
                  key={btn.type}
                  onClick={() => {
                    const blank = { type: btn.type, name: "", location: "", text: "", rating: "5", badge: "", pub: "", pubType: btn.type === "review" ? "trustpilot" : btn.type === "press" ? "cybernews" : btn.type === "featured" ? "lonely-planet" : "", videoId: "", videoTitle: "" };
                    upd("reviews", { ...data.reviews, masonryItems: [...(data.reviews.masonryItems || []), blank] });
                  }}
                  className="px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-[12px] text-gray-500 hover:border-gray-400 hover:text-gray-700 transition"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── FAQ ── */}
      {section === "faq" && (
        <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
          <SectionHeader title="FAQ Section" icon="/icons/message.json" />
          <div><Lbl t="Section Heading" /><input value={data.faq.heading} onChange={e => upd("faq", { ...data.faq, heading: e.target.value })} className={inp} /></div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <FSize label="Heading size" value={data.faq.headingSize || 40} onChange={v => upd("faq", { ...data.faq, headingSize: v })} />
            <FSize label="Question size" value={data.faq.questionSize || 15} onChange={v => upd("faq", { ...data.faq, questionSize: v })} />
            <FSize label="Answer size" value={data.faq.answerSize || 14} onChange={v => upd("faq", { ...data.faq, answerSize: v })} />
          </div>
          <ArrayEditor
            items={data.faq.items}
            onChange={v => upd("faq", { ...data.faq, items: v })}
            fields={[
              { key: "question", label: "Question", placeholder: "What is an eSIM?" },
              { key: "answer",   label: "Answer",   placeholder: "An eSIM is..." },
            ]}
            addLabel="Add FAQ Item"
          />
        </div>
      )}

      {/* ── APP DOWNLOAD ── */}
      {section === "app" && (
        <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
          <SectionHeader title="App Download Section" icon="/icons/setting.json" />
          <div><Lbl t="Heading" /><input value={data.app.heading} onChange={e => upd("app", { ...data.app, heading: e.target.value })} className={inp} /></div>
          <div><Lbl t="Description" /><textarea value={data.app.description} onChange={e => upd("app", { ...data.app, description: e.target.value })} rows={2} className={ta} /></div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <FSize label="Heading size" value={data.app.headingSize || 40} onChange={v => upd("app", { ...data.app, headingSize: v })} />
            <FSize label="Body size" value={data.app.bodySize || 14} onChange={v => upd("app", { ...data.app, bodySize: v })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Lbl t="App Store URL" /><input value={data.app.appStoreHref} onChange={e => upd("app", { ...data.app, appStoreHref: e.target.value })} className={inp} /></div>
            <div><Lbl t="Play Store URL" /><input value={data.app.playStoreHref} onChange={e => upd("app", { ...data.app, playStoreHref: e.target.value })} className={inp} /></div>
          </div>
          <div>
            <Lbl t="Background Photo (beach / right-side image)" />
            <p className="text-[11px] text-gray-400 mb-1.5">This is the photo shown on the right side of the Download App section. Recommended size: 900×500 px.</p>
            <ImageUploadField value={(data.app as any).photo || ""} onChange={v => upd("app", { ...data.app, photo: v } as any)} placeholder="https://... or upload image" />
          </div>
        </div>
      )}

      {section === "product-page" && (
        <div className="space-y-5">
          {/* ── Hero ── */}
          <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
            <SectionHeader title="Hero — Heading & Description" icon="/icons/text.json" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FSize label="Heading size (px)" value={(data.destinationPage as any).headingFontSize || 40} onChange={v => upd("destinationPage", { ...(data.destinationPage as any), headingFontSize: v })} />
              <div>
                <Lbl t="Heading color" />
                <div className="flex gap-2 items-center">
                  <input type="color" value={(data.destinationPage as any).headingColor || "#111827"} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), headingColor: e.target.value })} className="w-10 h-10 rounded-xl border border-gray-200 p-0.5 cursor-pointer" />
                  <input type="text" value={(data.destinationPage as any).headingColor || "#111827"} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), headingColor: e.target.value })} className={inp} />
                </div>
              </div>
            </div>
            <div>
              <Lbl t="Heading font" />
              <select value={(data.destinationPage as any).headingFont || "Poppins, sans-serif"} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), headingFont: e.target.value })} className={inp}>
                {["Poppins, sans-serif","Inter, sans-serif","Georgia, serif","Playfair Display, serif","Montserrat, sans-serif","Roboto, sans-serif"].map(f => <option key={f} value={f}>{f.split(",")[0]}</option>)}
              </select>
            </div>
            <div>
              <Lbl t="Description template (use {country})" />
              <textarea value={(data.destinationPage as any).descTemplate || ""} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), descTemplate: e.target.value })} rows={2} className={ta} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FSize label="Description size (px)" value={(data.destinationPage as any).descSize || 14} onChange={v => upd("destinationPage", { ...(data.destinationPage as any), descSize: v })} />
              <div>
                <Lbl t="Description color" />
                <div className="flex gap-2 items-center">
                  <input type="color" value={(data.destinationPage as any).descColor || "#6b7280"} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), descColor: e.target.value })} className="w-10 h-10 rounded-xl border border-gray-200 p-0.5 cursor-pointer" />
                  <input type="text" value={(data.destinationPage as any).descColor || "#6b7280"} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), descColor: e.target.value })} className={inp} />
                </div>
              </div>
            </div>
            <div>
              <Lbl t="Plan section label (use {country})" />
              <input value={(data.destinationPage as any).planLabelTemplate || ""} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), planLabelTemplate: e.target.value })} className={inp} />
            </div>
            <div>
              <Lbl t="Cover image override URL (leave blank = auto Wikipedia photo)" />
              <ImageUploadField value={(data.destinationPage as any).coverImageOverride || ""} onChange={v => upd("destinationPage", { ...(data.destinationPage as any), coverImageOverride: v })} placeholder="https://... or upload image" />
            </div>
          </div>

          {/* ── Plan cards ── */}
          <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
            <SectionHeader title="Plan Cards" icon="/icons/category.json" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Lbl t="'Best Choice' banner label" /><input value={(data.destinationPage as any).bestChoiceLabel || "Best Choice"} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), bestChoiceLabel: e.target.value })} className={inp} /></div>
              <div><Lbl t="Credits badge text" /><input value={(data.destinationPage as any).creditsText || "3% in Voltey credits"} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), creditsText: e.target.value })} className={inp} /></div>
            </div>
            <div>
              <Lbl t="Credits badge color" />
              <div className="flex gap-2 items-center">
                <input type="color" value={(data.destinationPage as any).creditsColor || "#b45309"} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), creditsColor: e.target.value })} className="w-10 h-10 rounded-xl border border-gray-200 p-0.5 cursor-pointer" />
                <input type="text" value={(data.destinationPage as any).creditsColor || "#b45309"} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), creditsColor: e.target.value })} className={inp} />
              </div>
            </div>
          </div>

          {/* ── Activation box ── */}
          <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
            <SectionHeader title="Activation Info Box" icon="/icons/note-text.json" />
            <div><Lbl t="Heading" /><input value={(data.destinationPage as any).activationHeading || ""} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), activationHeading: e.target.value })} className={inp} /></div>
            <div>
              <Lbl t="Body (use **bold** for emphasis, {deadline} for the date)" />
              <textarea value={(data.destinationPage as any).activationBody || ""} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), activationBody: e.target.value })} rows={3} className={ta} />
            </div>
          </div>

          {/* ── Quantity & Buttons ── */}
          <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
            <SectionHeader title="Quantity & Buttons" icon="/icons/setting.json" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Lbl t="Quantity heading" /><input value={(data.destinationPage as any).quantityHeading || ""} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), quantityHeading: e.target.value })} className={inp} /></div>
              <div><Lbl t="Quantity sub-label" /><input value={(data.destinationPage as any).quantitySub || ""} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), quantitySub: e.target.value })} className={inp} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Lbl t="Checkout button label" /><input value={(data.destinationPage as any).checkoutBtnLabel || "Go to Checkout"} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), checkoutBtnLabel: e.target.value })} className={inp} /></div>
              <div>
                <Lbl t="Checkout button color" />
                <div className="flex gap-2 items-center">
                  <input type="color" value={(data.destinationPage as any).checkoutBtnBg || "#f5e642"} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), checkoutBtnBg: e.target.value })} className="w-10 h-10 rounded-xl border border-gray-200 p-0.5 cursor-pointer" />
                  <input type="text" value={(data.destinationPage as any).checkoutBtnBg || "#f5e642"} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), checkoutBtnBg: e.target.value })} className={inp} />
                </div>
              </div>
            </div>
            <div><Lbl t="Compatibility button label" /><input value={(data.destinationPage as any).compatibilityBtnLabel || "Device Compatibility"} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), compatibilityBtnLabel: e.target.value })} className={inp} /></div>
          </div>

          {/* ── Trust row ── */}
          <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
            <SectionHeader title="Trust Row (below checkout button)" icon="/icons/global.json" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><Lbl t="Star rating (text)" /><input value={(data.destinationPage as any).trustRating || "4.7"} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), trustRating: e.target.value })} className={inp} /></div>
              <div><Lbl t="Review count (text)" /><input value={(data.destinationPage as any).trustReviewCount || "97,400+"} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), trustReviewCount: e.target.value })} className={inp} /></div>
              <div><Lbl t="Secure label" /><input value={(data.destinationPage as any).trustSecureLabel || "Secure Payment Guaranteed"} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), trustSecureLabel: e.target.value })} className={inp} /></div>
            </div>
          </div>

          {/* ── Description tab ── */}
          <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
            <SectionHeader title="Description Tab Content" icon="/icons/text.json" />
            <div>
              <Lbl t="Description tab body (use {country})" />
              <textarea value={(data.destinationPage as any).descriptionTabText || ""} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), descriptionTabText: e.target.value })} rows={4} className={ta} />
            </div>
          </div>

          {/* ── Steps section ── */}
          <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
            <SectionHeader title="How-to Steps Section" icon="/icons/note-text.json" />
            <div>
              <Lbl t="Section heading template (use {country}, {data})" />
              <input value={(data.destinationPage as any).stepsHeadingTemplate || ""} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), stepsHeadingTemplate: e.target.value })} className={inp} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FSize label="Heading size (px)" value={(data.destinationPage as any).stepsHeadingSize || 40} onChange={v => upd("destinationPage", { ...(data.destinationPage as any), stepsHeadingSize: v })} />
              <div>
                <Lbl t="Heading color" />
                <div className="flex gap-2 items-center">
                  <input type="color" value={(data.destinationPage as any).stepsHeadingColor || "#111827"} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), stepsHeadingColor: e.target.value })} className="w-10 h-10 rounded-xl border border-gray-200 p-0.5 cursor-pointer" />
                  <input type="text" value={(data.destinationPage as any).stepsHeadingColor || "#111827"} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), stepsHeadingColor: e.target.value })} className={inp} />
                </div>
              </div>
            </div>
            {((data.destinationPage as any).steps || []).map((step: any, i: number) => (
              <div key={i} className="rounded-xl border border-gray-100 p-4 space-y-2 bg-gray-50">
                <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wide">Step {i + 1}</p>
                <div><Lbl t="Title" /><input value={step.title} onChange={e => { const s = [...((data.destinationPage as any).steps || [])]; s[i] = { ...s[i], title: e.target.value }; upd("destinationPage", { ...(data.destinationPage as any), steps: s }); }} className={inp} /></div>
                <div><Lbl t="Description" /><textarea value={step.desc} rows={2} onChange={e => { const s = [...((data.destinationPage as any).steps || [])]; s[i] = { ...s[i], desc: e.target.value }; upd("destinationPage", { ...(data.destinationPage as any), steps: s }); }} className={ta} /></div>
              </div>
            ))}
          </div>

          {/* ── Why section ── */}
          <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
            <SectionHeader title="Why Voltey Section (6 features)" icon="/icons/setting.json" />
            <div>
              <Lbl t="Heading template (use {country})" />
              <input value={(data.destinationPage as any).whyHeadingTemplate || ""} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), whyHeadingTemplate: e.target.value })} className={inp} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FSize label="Heading size (px)" value={(data.destinationPage as any).whyHeadingSize || 40} onChange={v => upd("destinationPage", { ...(data.destinationPage as any), whyHeadingSize: v })} />
              <div>
                <Lbl t="Heading color" />
                <div className="flex gap-2 items-center">
                  <input type="color" value={(data.destinationPage as any).whyHeadingColor || "#111827"} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), whyHeadingColor: e.target.value })} className="w-10 h-10 rounded-xl border border-gray-200 p-0.5 cursor-pointer" />
                  <input type="text" value={(data.destinationPage as any).whyHeadingColor || "#111827"} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), whyHeadingColor: e.target.value })} className={inp} />
                </div>
              </div>
            </div>
            <div><Lbl t="Sub-description" /><input value={(data.destinationPage as any).whyDesc || ""} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), whyDesc: e.target.value })} className={inp} /></div>
            {((data.destinationPage as any).whyItems || []).map((item: any, i: number) => {
              const updWhyItem = (patch: any) => {
                const s = [...((data.destinationPage as any).whyItems || [])];
                s[i] = { ...s[i], ...patch };
                upd("destinationPage", { ...(data.destinationPage as any), whyItems: s });
              };
              const LOTTIE_ICONS = [
                { label: "Message / Support", path: "/icons/message.json" },
                { label: "24-hr Support", path: "/icons/lottie/24-support.json" },
                { label: "Settings", path: "/icons/setting.json" },
                { label: "Global / World", path: "/icons/global.json" },
                { label: "Security Card", path: "/icons/security-card.json" },
                { label: "Wallet", path: "/icons/empty-wallet.json" },
                { label: "Notification", path: "/icons/notification-bing.json" },
                { label: "SIM Card", path: "/icons/simcard.json" },
                { label: "Shopping", path: "/icons/shopping-cart.json" },
                { label: "Tag / Label", path: "/icons/tag.json" },
                { label: "People", path: "/icons/people.json" },
                { label: "Profile Tick", path: "/icons/profile-tick.json" },
                { label: "Money In", path: "/icons/money-receive.json" },
                { label: "Map", path: "/icons/map.json" },
                { label: "Chart", path: "/icons/chart.json" },
                { label: "CPU", path: "/icons/cpu.json" },
                { label: "Ticket", path: "/icons/ticket.json" },
                { label: "User", path: "/icons/user.json" },
                { label: "Book", path: "/icons/book.json" },
                { label: "Note", path: "/icons/note-text.json" },
              ];
              const iconType = item.iconLottie ? "lottie" : item.iconEmoji ? "emoji" : "default";
              return (
                <div key={i} className="rounded-xl border border-gray-100 p-4 space-y-3 bg-gray-50">
                  <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wide">Feature {i + 1}</p>
                  {/* Icon type selector */}
                  <div>
                    <Lbl t="Icon type" />
                    <div className="flex gap-2">
                      {(["default", "lottie", "emoji"] as const).map(t => (
                        <button key={t} type="button"
                          onClick={() => updWhyItem({ iconLottie: t === "lottie" ? (item.iconLottie || LOTTIE_ICONS[0].path) : "", iconEmoji: t === "emoji" ? (item.iconEmoji || "✨") : "" })}
                          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all ${iconType === t ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                          {t === "default" ? "Default (Lucide)" : t === "lottie" ? "Lottie Animation" : "Emoji"}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Lottie picker */}
                  {iconType === "lottie" && (
                    <div>
                      <Lbl t="Choose Lottie icon" />
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        {LOTTIE_ICONS.map(ic => (
                          <button key={ic.path} type="button" onClick={() => updWhyItem({ iconLottie: ic.path })}
                            className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] text-gray-500 transition-all hover:border-gray-400 ${item.iconLottie === ic.path ? "border-gray-900 bg-white" : "border-gray-200 bg-white"}`}>
                            <LottieIcon src={ic.path} size={28} autoplay={false} playOnHover />
                            <span className="text-center leading-tight">{ic.label}</span>
                          </button>
                        ))}
                      </div>
                      <Lbl t="Or paste custom Lottie JSON URL" />
                      <input value={item.iconLottie || ""} onChange={e => updWhyItem({ iconLottie: e.target.value })} className={inp} placeholder="/icons/message.json or https://..." />
                    </div>
                  )}
                  {/* Emoji input */}
                  {iconType === "emoji" && (
                    <div>
                      <Lbl t="Emoji character" />
                      <input value={item.iconEmoji || ""} onChange={e => updWhyItem({ iconEmoji: e.target.value })} className={inp} placeholder="✈️ or 🌍 or 🛡️" maxLength={4} style={{ maxWidth: 100, fontSize: 24, textAlign: "center" }} />
                    </div>
                  )}
                  <div><Lbl t="Title" /><input value={item.title} onChange={e => updWhyItem({ title: e.target.value })} className={inp} /></div>
                  <div><Lbl t="Description" /><textarea value={item.desc} rows={2} onChange={e => updWhyItem({ desc: e.target.value })} className={ta} /></div>
                </div>
              );
            })}
          </div>

          {/* ── Comparison table ── */}
          <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
            <SectionHeader title="Comparison Table" icon="/icons/global.json" />
            <div><Lbl t="Section heading" /><input value={(data.destinationPage as any).comparisonHeading || "Voltey vs. other eSIM services"} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), comparisonHeading: e.target.value })} className={inp} /></div>
            <FSize label="Heading size (px)" value={(data.destinationPage as any).comparisonHeadingSize || 40} onChange={v => upd("destinationPage", { ...(data.destinationPage as any), comparisonHeadingSize: v })} />
          </div>

          {/* ── Press Logos ── */}
          <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
            <SectionHeader title="Press Logos Bar" sub="'They talk about us' — heading is shared with Home page" icon="/icons/people.json" />
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-amber-500 text-[18px] shrink-0 mt-0.5">ℹ️</span>
              <p className="text-[13px] text-amber-800 leading-snug">The press logos on the product page are shared with the <strong>Home → Press Logos</strong> section. To edit the heading or logos, switch to the <strong>Press Logos</strong> tab above.</p>
            </div>
            <div>
              <Lbl t="Current heading (from Home → Press Logos)" />
              <input value={data.press?.heading || "They talk about us"} readOnly className={`${inp} opacity-50 cursor-not-allowed`} />
            </div>
          </div>

          {/* ── Reviews section ── */}
          <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
            <SectionHeader title="Reviews Section" sub="Note: Review cards/videos are shared with the Home page Reviews section" icon="/icons/note-text.json" />
            <div><Lbl t="Section heading" /><input value={(data.destinationPage as any).reviewsHeading || ""} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), reviewsHeading: e.target.value })} className={inp} /></div>
            <div><Lbl t="Sub-heading" /><input value={(data.destinationPage as any).reviewsSubheading || ""} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), reviewsSubheading: e.target.value })} className={inp} /></div>
            <div>
              <Lbl t="Background color" />
              <div className="flex gap-2 items-center">
                <input type="color" value={(data.destinationPage as any).reviewsBg || "#eaecf4"} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), reviewsBg: e.target.value })} className="w-10 h-10 rounded-xl border border-gray-200 p-0.5 cursor-pointer" />
                <input type="text" value={(data.destinationPage as any).reviewsBg || "#eaecf4"} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), reviewsBg: e.target.value })} className={inp} />
              </div>
            </div>
          </div>

          {/* ── FAQ ── */}
          <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
            <SectionHeader title="FAQ Section" icon="/icons/setting.json" />
            <div><Lbl t="Section heading" /><input value={(data.destinationPage as any).faqHeading || "Frequently asked questions"} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), faqHeading: e.target.value })} className={inp} /></div>
            <FSize label="Heading size (px)" value={(data.destinationPage as any).faqHeadingSize || 36} onChange={v => upd("destinationPage", { ...(data.destinationPage as any), faqHeadingSize: v })} />
            {((data.destinationPage as any).faqItems || []).map((item: any, i: number) => (
              <div key={i} className="rounded-xl border border-gray-100 p-4 space-y-2 bg-gray-50">
                <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wide">FAQ {i + 1}</p>
                <div><Lbl t="Question (use {country})" /><input value={item.q} onChange={e => { const s = [...((data.destinationPage as any).faqItems || [])]; s[i] = { ...s[i], q: e.target.value }; upd("destinationPage", { ...(data.destinationPage as any), faqItems: s }); }} className={inp} /></div>
                <div><Lbl t="Answer (use {country})" /><textarea value={item.a} rows={2} onChange={e => { const s = [...((data.destinationPage as any).faqItems || [])]; s[i] = { ...s[i], a: e.target.value }; upd("destinationPage", { ...(data.destinationPage as any), faqItems: s }); }} className={ta} /></div>
              </div>
            ))}
          </div>

          {/* ── Referral banner ── */}
          <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
            <SectionHeader title="Referral Banner" icon="/icons/category.json" />
            <div><Lbl t="Heading" /><input value={(data.destinationPage as any).referralHeading || ""} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), referralHeading: e.target.value })} className={inp} /></div>
            <div><Lbl t="Description" /><textarea value={(data.destinationPage as any).referralDesc || ""} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), referralDesc: e.target.value })} rows={2} className={ta} /></div>
            <div><Lbl t="Button label" /><input value={(data.destinationPage as any).referralBtnLabel || "Learn More"} onChange={e => upd("destinationPage", { ...(data.destinationPage as any), referralBtnLabel: e.target.value })} className={inp} /></div>
            <div>
              <Lbl t="Background image" />
              <ImageUploadField value={(data.destinationPage as any).referralImage || ""} onChange={v => upd("destinationPage", { ...(data.destinationPage as any), referralImage: v })} placeholder="https://... or upload image" />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <SaveBar saving={saving} saved={saved} onSave={save} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   PRODUCT PAGE EDITOR
══════════════════════════════════════════════ */
const DEFAULT_PRODUCT = {
  heroBanner: { title: "Find your perfect eSIM plan", subtitle: "Browse 1000+ plans across 190+ destinations.", bgColor: "#f0fdf4" },
  promoBar: { enabled: false, text: "Limited offer: 20% off all plans this week!", bgColor: "#22c55e", textColor: "#ffffff" },
  filterSection: { heading: "Filter by destination", subheading: "" },
};

export function ProductPageEditor() {
  const qc = useQueryClient();
  const { data: allContent } = useQuery({ queryKey: ["admin-content"], queryFn: () => apiGet("/api/admin/content") });
  const [data, setData] = useState(DEFAULT_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (allContent?.product) setData(d => ({ ...d, ...(allContent.product as typeof DEFAULT_PRODUCT) }));
  }, [allContent]);

  const save = async () => {
    setSaving(true);
    await apiPut("/api/admin/content/product", data);
    qc.invalidateQueries({ queryKey: ["admin-content"] });
    qc.invalidateQueries({ queryKey: ["website-content"] });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
        <SectionHeader title="Hero Banner" sub="Top section of the Products / Destinations page" icon="/icons/category.json" />
        <div><Lbl t="Title" /><input value={data.heroBanner.title} onChange={e => setData(d => ({ ...d, heroBanner: { ...d.heroBanner, title: e.target.value } }))} className={inp} /></div>
        <div><Lbl t="Subtitle" /><input value={data.heroBanner.subtitle} onChange={e => setData(d => ({ ...d, heroBanner: { ...d.heroBanner, subtitle: e.target.value } }))} className={inp} /></div>
        <div>
          <Lbl t="Background Color" />
          <div className="flex gap-2 items-center">
            <input type="color" value={data.heroBanner.bgColor} onChange={e => setData(d => ({ ...d, heroBanner: { ...d.heroBanner, bgColor: e.target.value } }))} className="w-10 h-10 rounded-xl border border-gray-200 p-0.5 cursor-pointer" />
            <input type="text" value={data.heroBanner.bgColor} onChange={e => setData(d => ({ ...d, heroBanner: { ...d.heroBanner, bgColor: e.target.value } }))} className={inp} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
        <SectionHeader title="Promo Bar" sub="Optional colored announcement bar on the page" icon="/icons/note-text.json" />
        <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 bg-gray-50">
          <div><p className="text-[14px] font-bold text-gray-900">Enable Promo Bar</p></div>
          <button onClick={() => setData(d => ({ ...d, promoBar: { ...d.promoBar, enabled: !d.promoBar.enabled } }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${data.promoBar.enabled ? "bg-emerald-500" : "bg-gray-300"}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${data.promoBar.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
        <div><Lbl t="Promo Text" /><input value={data.promoBar.text} onChange={e => setData(d => ({ ...d, promoBar: { ...d.promoBar, text: e.target.value } }))} className={inp} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Lbl t="Background Color" />
            <div className="flex gap-2 items-center">
              <input type="color" value={data.promoBar.bgColor} onChange={e => setData(d => ({ ...d, promoBar: { ...d.promoBar, bgColor: e.target.value } }))} className="w-10 h-10 rounded-xl border border-gray-200 p-0.5 cursor-pointer" />
              <input type="text" value={data.promoBar.bgColor} onChange={e => setData(d => ({ ...d, promoBar: { ...d.promoBar, bgColor: e.target.value } }))} className={inp} />
            </div>
          </div>
          <div>
            <Lbl t="Text Color" />
            <div className="flex gap-2 items-center">
              <input type="color" value={data.promoBar.textColor} onChange={e => setData(d => ({ ...d, promoBar: { ...d.promoBar, textColor: e.target.value } }))} className="w-10 h-10 rounded-xl border border-gray-200 p-0.5 cursor-pointer" />
              <input type="text" value={data.promoBar.textColor} onChange={e => setData(d => ({ ...d, promoBar: { ...d.promoBar, textColor: e.target.value } }))} className={inp} />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
        <SectionHeader title="Filter Section Labels" icon="/icons/global.json" />
        <div><Lbl t="Heading" /><input value={data.filterSection.heading} onChange={e => setData(d => ({ ...d, filterSection: { ...d.filterSection, heading: e.target.value } }))} className={inp} /></div>
        <div><Lbl t="Sub-heading" /><input value={data.filterSection.subheading} onChange={e => setData(d => ({ ...d, filterSection: { ...d.filterSection, subheading: e.target.value } }))} className={inp} /></div>
      </div>

      <div className="flex justify-end">
        <SaveBar saving={saving} saved={saved} onSave={save} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   DESTINATION PAGE EDITOR
══════════════════════════════════════════════ */
const DEFAULT_DESTINATION = {
  hero: { heading: "eSIM for", subheading: "Get reliable mobile data for your trip.", bgColor: "#f0fdf4" },
  planSection: { heading: "Available Plans", subheading: "Choose the best plan for your needs.", sortLabel: "Sort by" },
  infoSection: { heading: "About eSIM coverage", description: "Voltey partners with the best local carriers to provide reliable data coverage." },
  relatedSection: { heading: "You might also like", subheading: "Other popular destinations" },
};

export function DestinationPageEditor() {
  const qc = useQueryClient();
  const { data: allContent } = useQuery({ queryKey: ["admin-content"], queryFn: () => apiGet("/api/admin/content") });
  const [data, setData] = useState(DEFAULT_DESTINATION);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (allContent?.destination) setData(d => ({ ...d, ...(allContent.destination as typeof DEFAULT_DESTINATION) }));
  }, [allContent]);

  const save = async () => {
    setSaving(true);
    await apiPut("/api/admin/content/destination", data);
    qc.invalidateQueries({ queryKey: ["admin-content"] });
    qc.invalidateQueries({ queryKey: ["website-content"] });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
        <SectionHeader title="Destination Hero" sub="Top banner on individual destination pages (e.g. 'eSIM for Spain')" icon="/icons/global.json" />
        <div><Lbl t="Heading Prefix (e.g. 'eSIM for')" /><input value={data.hero.heading} onChange={e => setData(d => ({ ...d, hero: { ...d.hero, heading: e.target.value } }))} placeholder="eSIM for" className={inp} /></div>
        <div><Lbl t="Sub-heading" /><input value={data.hero.subheading} onChange={e => setData(d => ({ ...d, hero: { ...d.hero, subheading: e.target.value } }))} className={inp} /></div>
        <div>
          <Lbl t="Background Color" />
          <div className="flex gap-2 items-center">
            <input type="color" value={data.hero.bgColor} onChange={e => setData(d => ({ ...d, hero: { ...d.hero, bgColor: e.target.value } }))} className="w-10 h-10 rounded-xl border border-gray-200 p-0.5 cursor-pointer" />
            <input type="text" value={data.hero.bgColor} onChange={e => setData(d => ({ ...d, hero: { ...d.hero, bgColor: e.target.value } }))} className={inp} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
        <SectionHeader title="Plans Section Labels" icon="/icons/simcard.json" />
        <div><Lbl t="Section Heading" /><input value={data.planSection.heading} onChange={e => setData(d => ({ ...d, planSection: { ...d.planSection, heading: e.target.value } }))} className={inp} /></div>
        <div><Lbl t="Sub-heading" /><input value={data.planSection.subheading} onChange={e => setData(d => ({ ...d, planSection: { ...d.planSection, subheading: e.target.value } }))} className={inp} /></div>
        <div><Lbl t="Sort Label" /><input value={data.planSection.sortLabel} onChange={e => setData(d => ({ ...d, planSection: { ...d.planSection, sortLabel: e.target.value } }))} className={inp} /></div>
      </div>

      <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
        <SectionHeader title="Coverage Info Section" icon="/icons/global.json" />
        <div><Lbl t="Heading" /><input value={data.infoSection.heading} onChange={e => setData(d => ({ ...d, infoSection: { ...d.infoSection, heading: e.target.value } }))} className={inp} /></div>
        <div><Lbl t="Description" /><textarea value={data.infoSection.description} onChange={e => setData(d => ({ ...d, infoSection: { ...d.infoSection, description: e.target.value } }))} rows={3} className={ta} /></div>
      </div>

      <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
        <SectionHeader title="Related Destinations Section" icon="/icons/global.json" />
        <div><Lbl t="Heading" /><input value={data.relatedSection.heading} onChange={e => setData(d => ({ ...d, relatedSection: { ...d.relatedSection, heading: e.target.value } }))} className={inp} /></div>
        <div><Lbl t="Sub-heading" /><input value={data.relatedSection.subheading} onChange={e => setData(d => ({ ...d, relatedSection: { ...d.relatedSection, subheading: e.target.value } }))} className={inp} /></div>
      </div>

      <div className="flex justify-end">
        <SaveBar saving={saving} saved={saved} onSave={save} />
      </div>
    </div>
  );
}

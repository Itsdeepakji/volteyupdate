import { useState, useEffect } from "react";
import { Link } from "wouter";
import { LottieIcon } from "@/components/LottieIcon";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API  = import.meta.env.VITE_API_BASE ?? "";

/* ─── Device database ─── */
const DEVICES: Record<string, Record<string, string[]>> = {
  smartphones: {
    iPhone: [
      "iPhone XS", "iPhone XS Max", "iPhone XR",
      "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max",
      "iPhone SE (2nd Gen)", "iPhone SE (3rd Gen)",
      "iPhone 12", "iPhone 12 Mini", "iPhone 12 Pro", "iPhone 12 Pro Max",
      "iPhone 13", "iPhone 13 Mini", "iPhone 13 Pro", "iPhone 13 Pro Max",
      "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max",
      "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max",
    ],
    Samsung: [
      "Galaxy S20", "Galaxy S20+", "Galaxy S20 Ultra", "Galaxy S20 FE",
      "Galaxy S21", "Galaxy S21+", "Galaxy S21 Ultra", "Galaxy S21 FE",
      "Galaxy S22", "Galaxy S22+", "Galaxy S22 Ultra",
      "Galaxy S23", "Galaxy S23+", "Galaxy S23 Ultra", "Galaxy S23 FE",
      "Galaxy S24", "Galaxy S24+", "Galaxy S24 Ultra",
      "Galaxy Z Fold 2", "Galaxy Z Fold 3", "Galaxy Z Fold 4", "Galaxy Z Fold 5",
      "Galaxy Z Flip 3", "Galaxy Z Flip 4", "Galaxy Z Flip 5",
      "Galaxy Note 20", "Galaxy Note 20 Ultra",
    ],
    Google: [
      "Pixel 3", "Pixel 3 XL", "Pixel 3a", "Pixel 3a XL",
      "Pixel 4", "Pixel 4 XL", "Pixel 4a", "Pixel 4a 5G",
      "Pixel 5", "Pixel 5a",
      "Pixel 6", "Pixel 6 Pro", "Pixel 6a",
      "Pixel 7", "Pixel 7 Pro", "Pixel 7a",
      "Pixel 8", "Pixel 8 Pro", "Pixel 8a",
      "Pixel Fold",
    ],
    Huawei: ["P40", "P40 Pro", "P40 Pro+", "Mate 40 Pro", "P50 Pro"],
    Xiaomi: ["Mi 10 Pro 5G", "Mi 11 Lite 5G NE", "12T Pro", "13 Pro", "14 Pro"],
    Motorola: ["Razr 2019", "Razr 5G", "Razr 2022", "Edge 40 Pro", "Edge+ 2023"],
    Oppo: ["Find X3 Pro", "Find X5 Pro", "Find X6 Pro", "Find N2 Flip"],
    Sony: ["Xperia 1 IV", "Xperia 1 V", "Xperia 10 V", "Xperia 5 IV"],
    Nokia: ["G60 5G", "X30 5G"],
    Rakuten: ["Rakuten Big-S", "Rakuten Mini", "Rakuten Hand", "Rakuten Mobile"],
    Nuu: ["X6 Plus"],
    Sharp: ["AQUOS R5G", "AQUOS R6", "AQUOS R7", "AQUOS sense4 lite"],
    Surface: ["Duo", "Duo 2", "Pro X", "Pro 9"],
    Honor: ["Magic4 Pro", "Magic5 Pro", "Magic6 Pro"],
    Fairphone: ["Fairphone 4", "Fairphone 5"],
    OnePlus: ["11", "12", "Open"],
    Hammer: ["Hammer 4G", "Hammer Active 4G"],
    Viva: ["V10 Pro 5G"],
    "T-Mobile": ["T-Mobile Revvl 5G"],
    Tcl: ["TCL 30 5G"],
    Other: ["Gemini PDA", "Orbic Speed 5G"],
  },
  smartwatches: {
    Apple: ["Apple Watch Series 7 (GPS + Cellular)", "Apple Watch Series 8 (GPS + Cellular)", "Apple Watch Series 9 (GPS + Cellular)", "Apple Watch Ultra", "Apple Watch Ultra 2"],
    Samsung: ["Galaxy Watch 4 (LTE)", "Galaxy Watch 4 Classic (LTE)", "Galaxy Watch 5 (LTE)", "Galaxy Watch 5 Pro (LTE)", "Galaxy Watch 6 (LTE)", "Galaxy Watch 6 Classic (LTE)"],
    Other: ["Amazfit GTR 3 Pro (4G)", "Nubia Watch 2S"],
  },
  tablets: {
    Apple: [
      "iPad Pro 11\" (1st Gen 2018)", "iPad Pro 12.9\" (3rd Gen 2018)",
      "iPad Pro 11\" (2nd Gen 2020)", "iPad Pro 12.9\" (4th Gen 2020)",
      "iPad Pro 11\" (3rd Gen 2021)", "iPad Pro 12.9\" (5th Gen 2021)",
      "iPad Pro 11\" (4th Gen 2022)", "iPad Pro 12.9\" (6th Gen 2022)",
      "iPad Air (3rd Gen 2019)", "iPad Air (4th Gen 2020)", "iPad Air (5th Gen 2022)",
      "iPad mini (5th Gen 2019)", "iPad mini (6th Gen 2021)",
      "iPad (7th Gen 2019)", "iPad (8th Gen 2020)", "iPad (9th Gen 2021)", "iPad (10th Gen 2022)",
    ],
    Samsung: ["Galaxy Tab S7 FE (5G)", "Galaxy Tab S7+ (5G)", "Galaxy Tab S8 (5G)", "Galaxy Tab S8+ (5G)", "Galaxy Tab S8 Ultra (5G)", "Galaxy Tab S9 (5G)"],
    Other: ["Lenovo Tab P12 Pro", "Surface Pro X", "Surface Pro 9 (5G)"],
  },
  laptops: {
    Apple: ["MacBook Air (M1, 2020)", "MacBook Air (M2, 2022)", "MacBook Air (M3, 2024)", "MacBook Pro 14\" (M3, 2023)", "MacBook Pro 16\" (M3, 2023)"],
    Samsung: ["Galaxy Book3 360", "Galaxy Book3 Pro", "Galaxy Book3 Ultra", "Galaxy Book4 Pro"],
    Other: ["Lenovo Yoga 5G", "HP Spectre x360 (5G)", "Microsoft Surface Pro X", "Acer Enduro T1"],
  },
};

const TABS = [
  { key: "smartphones",  label: "Smartphones",   icon: "/icons/simcard.json" },
  { key: "smartwatches", label: "Smartwatches",  icon: "/icons/notification.json" },
  { key: "tablets",      label: "Tablets",       icon: "/icons/card.json" },
  { key: "laptops",      label: "Laptops",       icon: "/icons/cpu.json" },
];

const FAQS = [
  { q: "What kind of devices are compatible with eSIMs?",  a: "eSIM-compatible devices include most modern smartphones, certain smartwatches (Apple Watch, Galaxy Watch), select tablets (iPad, Samsung Tab), and some laptops (MacBook, Surface Pro). The device must be carrier-unlocked to use Voltey eSIM." },
  { q: "How do I know if my device supports eSIM?",        a: "On iPhone: Settings → General → About → look for 'eSIM'. On Android: Settings → Network & Internet → SIMs → look for 'Add eSIM' option. You can also check our compatibility list on this page." },
  { q: "Does my iPhone support eSIM?",                     a: "All iPhones from XS onward (2018+) support eSIM. That includes XS, XS Max, XR, all iPhone 11-15 models, and all SE models from 2nd generation onward." },
  { q: "Do all devices support eSIM?",                     a: "No — only devices with a built-in eSIM chip support it. Older phones and budget devices typically do not. Use the search bar or browse our compatibility list to check your specific model." },
  { q: "Can I use an eSIM and a physical SIM at the same time?", a: "Yes! Most modern smartphones support Dual SIM — you can run a physical SIM for calls/texts and a Voltey eSIM for data simultaneously, with no conflict." },
  { q: "Is an eSIM tied to a phone?",                      a: "An eSIM profile is stored on your device, but your Voltey plan is tied to your account. If you get a new phone, you can re-download your plan or contact Voltey support for a free re-issue." },
];

function BrandAccordion({ brand, devices }: { brand: string; devices: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 px-2 text-left hover:bg-gray-50 transition-all">
        <span className="font-semibold text-gray-800 text-[15px]">{brand}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="pb-4 px-2 grid sm:grid-cols-2 gap-1.5">
          {devices.map((device) => (
            <div key={device} className="flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-gray-50">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
              <span className="text-[13px] text-gray-600">{device}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CompatibilityPage() {
  const [activeTab, setActiveTab] = useState("smartphones");
  const [query, setQuery] = useState("");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  /* Search results across all categories */
  const searchResults: { brand: string; device: string; category: string }[] = query.length >= 2
    ? Object.entries(DEVICES).flatMap(([cat, brands]) =>
        Object.entries(brands).flatMap(([brand, devices]) =>
          devices
            .filter((d) => d.toLowerCase().includes(query.toLowerCase()))
            .map((d) => ({ brand, device: d, category: cat }))
        )
      )
    : [];

  const currentBrands = DEVICES[activeTab] ?? {};
  const categoryIcon = TABS.find((t) => t.key === activeTab)?.icon ?? "/icons/simcard.json";

  return (
    <div style={{ fontFamily: "Poppins, sans-serif" }}>

      {/* ── HEADER ── */}
      <section className="bg-white border-b border-gray-100 py-12 px-6 text-center">
        <h1 className="font-black text-gray-900 mb-2" style={{ fontSize: "clamp(26px,4vw,44px)" }}>
          Devices that support eSIMs
        </h1>
        <p className="text-gray-400 text-[15px] mb-8 max-w-lg mx-auto">
          Only devices that are carrier-unlocked and support eSIM technology can use Voltey.
        </p>
        {/* Search bar */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for device"
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-gray-200 text-[14px] focus:outline-none focus:border-green-400 transition-all"
          />
          {query && (
            <button onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">
              ×
            </button>
          )}
        </div>

        {/* Search results */}
        {query.length >= 2 && (
          <div className="max-w-md mx-auto mt-3 bg-white border border-gray-200 rounded-2xl shadow-xl text-left overflow-hidden max-h-72 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="p-5 text-[14px] text-gray-500 text-center">
                No compatible devices found for "{query}".
                <br /><span className="text-[12px] text-gray-400">It may still support eSIM — contact us to verify.</span>
              </div>
            ) : (
              searchResults.slice(0, 20).map((r, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <div>
                    <p className="text-[13.5px] font-bold text-gray-800">{r.device}</p>
                    <p className="text-[11px] text-gray-400 capitalize">{r.brand} · {r.category}</p>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "#f0fdf9", color: "#0da976" }}>
                    Compatible
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* ── TABS ── */}
      <section className="py-10 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Tab pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13.5px] font-bold transition-all border-2"
                style={{
                  background: activeTab === tab.key ? "#0da976" : "#fff",
                  color:      activeTab === tab.key ? "#fff" : "#6b7280",
                  borderColor: activeTab === tab.key ? "#0da976" : "#e5e7eb",
                }}
              >
                <LottieIcon src={tab.icon} size={16} autoplay loop />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category icon + heading */}
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#f0fdf9" }}>
              <LottieIcon src={categoryIcon} size={28} autoplay loop />
            </div>
            <div>
              <h2 className="font-black text-gray-900" style={{ fontSize: "clamp(20px,3vw,28px)" }}>
                {TABS.find((t) => t.key === activeTab)?.label}
              </h2>
              <p className="text-[13px] text-gray-400">
                {activeTab === "smartphones" && "Voltey is available on most iPhones and many Android phones"}
                {activeTab === "smartwatches" && "Compatible smartwatches with eSIM + cellular support"}
                {activeTab === "tablets"      && "Tablets with eSIM support for travel data plans"}
                {activeTab === "laptops"      && "Laptops with built-in eSIM connectivity"}
              </p>
            </div>
          </div>

          {/* Brand accordion list */}
          <div className="mt-6 divide-y divide-gray-100">
            {Object.entries(currentBrands).map(([brand, devices]) => (
              <BrandAccordion key={brand} brand={brand} devices={devices} />
            ))}
          </div>

          {/* Counts */}
          <p className="text-[12.5px] text-gray-400 text-center mt-6">
            {Object.values(currentBrands).flat().length} compatible {activeTab} listed
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-black text-gray-900 mb-10 text-center" style={{ fontSize: "clamp(22px,3vw,34px)" }}>
            Frequently asked questions
          </h2>
          <div className="space-y-0">
            {FAQS.map((f, i) => (
              <div key={i} className="border-b border-gray-200">
                <button onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between py-4 text-left gap-4">
                  <span className="font-semibold text-gray-900 text-[15px]">{f.q}</span>
                  {faqOpen === i ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                </button>
                {faqOpen === i && <div className="pb-4 text-[14px] text-gray-500 leading-relaxed">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

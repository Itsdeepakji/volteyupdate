import { useListDestinations } from "@workspace/api-client-react";
import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { Search, ChevronRight } from "lucide-react";
import { useCurrency } from "@/lib/currency-context";
import { Skeleton } from "@/components/ui/skeleton";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const DEST_DEFAULT = {
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
};

/* ── Featured popular destination codes ── */
const FEATURED_CODES = ["US", "GB", "JP", "TH", "ES", "AU"];

/* ── Tab definitions ── */
type Tab = "all" | "country" | "region" | "global";
const TABS: { id: Tab; label: string; badge?: string }[] = [
  { id: "all",     label: "All" },
  { id: "country", label: "Country" },
  { id: "region",  label: "Region" },
  { id: "global",  label: "Global Plan", badge: "New" },
];

/* ── Destination categorisation ── */
function getCategory(code: string): "country" | "region" | "global" {
  if (code.startsWith("GL-")) return "global";
  // Standard 2-letter ISO = single country
  if (/^[A-Z]{2}$/.test(code)) return "country";
  // Everything else (dashes, longer prefixes) = regional multi-country
  return "region";
}

/* ── Reusable plan card ── */
type Dest = { locationCode: string; locationName: string; flagUrl: string; lowestPrice: number };

function PlanCard({ dest, fmt }: { dest: Dest; fmt: (n: number) => string }) {
  const cat = getCategory(dest.locationCode);
  return (
    <Link href={`/destination/${dest.locationCode}`}>
      <div className="bg-[#f5f5f5] hover:bg-[#eeeeee] transition-colors rounded-2xl flex items-center gap-3 cursor-pointer group" style={{ padding: "15px 18px" }}>
        <img
          src={dest.flagUrl}
          alt={`${dest.locationName} flag`}
          className="w-[52px] h-[34px] rounded-[5px] object-cover shrink-0"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-gray-900 leading-snug truncate">{dest.locationName}</p>
          <p className="text-[13px] font-normal text-gray-500 mt-0.5 leading-none">
            From {fmt(dest.lowestPrice)}
            {cat === "region" && <span className="text-gray-400"> &bull; multiple countries</span>}
            {cat === "global" && <span className="text-gray-400"> &bull; worldwide</span>}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 group-hover:text-gray-600 transition-colors" />
      </div>
    </Link>
  );
}

/* ── Skeleton card ── */
function CardSkeleton() {
  return (
    <div className="bg-[#f5f5f5] rounded-2xl flex items-center gap-3" style={{ padding: "15px 18px" }}>
      <Skeleton className="w-11 h-11 rounded-full shrink-0 bg-gray-200" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/5 bg-gray-200" />
        <Skeleton className="h-3 w-1/3 bg-gray-200" />
      </div>
    </div>
  );
}

export default function Destinations() {
  const { fmt } = useCurrency();
  const { data, isLoading } = useListDestinations();

  /* ── CMS ── */
  const [cms, setCms] = useState(DEST_DEFAULT);
  useEffect(() => {
    fetch(`${BASE}/api/content/home`)
      .then(r => r.json())
      .then(d => {
        if (d?.destinations && typeof d.destinations === "object") {
          setCms(prev => ({ ...prev, ...d.destinations }));
        }
      })
      .catch(() => {});
  }, []);

  const [search, setSearch] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("q") ?? "";
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearch(params.get("q") ?? "");
  }, []);

  const [activeTab, setActiveTab] = useState<Tab>("all");

  /* Featured destinations pulled from live API */
  const featuredDestinations = useMemo(() => {
    if (!data?.destinations) return [];
    return FEATURED_CODES
      .map((code) => data.destinations.find((d) => d.locationCode === code))
      .filter(Boolean) as Dest[];
  }, [data]);

  /* Full filtered + tabbed grid */
  const filteredDestinations = useMemo(() => {
    if (!data?.destinations) return [];
    return data.destinations.filter((d) => {
      const matchesSearch = d.locationName.toLowerCase().includes(search.toLowerCase());
      const matchesTab =
        activeTab === "all" ||
        getCategory(d.locationCode) === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [data, search, activeTab]);

  const showFeatured = !search && activeTab === "all" && featuredDestinations.length > 0;

  return (
    <div className="min-h-screen bg-white">

      {/* ════════════════ Promo header + Featured plan boxes ════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-10 sm:pt-14 pb-0">
        <h1
          className="font-bold leading-tight mb-4"
          style={{
            maxWidth: 640,
            fontSize: (cms.pageHeroHeadingSize || 42) + "px",
            color: cms.pageHeroHeadingColor || "#111827",
            fontFamily: cms.pageHeroHeadingFont || "Poppins, sans-serif",
          }}
        >
          {cms.pageHeroHeading || "Save up to 35% on popular destination plans"}
        </h1>
        <p
          className="font-normal leading-relaxed mb-8"
          style={{
            maxWidth: 560,
            fontSize: (cms.pageHeroDescSize || 14) + "px",
            color: cms.pageHeroDescColor || "#6b7280",
          }}
        >
          {cms.pageHeroDesc || "Save on data plans across Europe, Asia, and the Americas — or grab one discounted multi-country eSIM covering entire regions! Every plan comes with instant email delivery."}
        </p>

        {/* Featured plan boxes */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : showFeatured ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
            {featuredDestinations.map((dest) => (
              <PlanCard key={dest.locationCode} dest={dest} fmt={fmt} />
            ))}
          </div>
        ) : null}
      </div>

      {/* ════════════════ All destinations section ════════════════ */}
      <div className="max-w-7xl mx-auto px-8 pb-24">

        {/* Section heading */}
        <h2
          className="font-bold mb-2 leading-tight"
          style={{
            fontSize: (cms.pageAllHeadingSize || 32) + "px",
            color: cms.pageAllHeadingColor || "#111827",
            fontFamily: cms.pageAllHeadingFont || "Poppins, sans-serif",
          }}
        >
          {cms.pageAllHeading || "All destinations"}
        </h2>
        <p
          className="font-normal mb-7"
          style={{
            maxWidth: 520,
            fontSize: (cms.pageAllDescSize || 14) + "px",
            color: cms.pageAllDescColor || "#6b7280",
          }}
        >
          {cms.pageAllDesc || "Find the best data plans in over 190+ destinations — and enjoy easy and safe internet access wherever you go."}
        </p>

        {/* Filter tabs — bordered pill container */}
        <div className="w-full overflow-x-auto mb-5 pb-0.5 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div
          className="inline-flex items-center min-w-max"
          style={{
            border: "1.5px solid #d1d5db",
            borderRadius: "999px",
            padding: "6px 8px",
            gap: "4px",
          }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearch(""); }}
                className={`flex items-center gap-2 text-[15px] font-medium transition-colors leading-none whitespace-nowrap ${
                  active
                    ? "bg-gray-900 text-white rounded-full px-5 py-[9px]"
                    : "text-gray-700 px-4 py-[9px] hover:text-gray-900"
                }`}
              >
                {tab.label}
                {tab.badge && (
                  <span
                    className="text-[11px] font-bold leading-none"
                    style={{
                      background: "#f5e642",
                      color: "#111",
                      borderRadius: "999px",
                      padding: "3px 7px",
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        </div>

        {/* Search bar — rectangular, full-width */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder={cms.pageSearchPlaceholder || "Search for destination"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 h-12 rounded-lg border border-gray-200 bg-white text-[14px] text-gray-800 placeholder:text-gray-400 outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        {/* Destination grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredDestinations.map((dest) => (
                <PlanCard key={dest.locationCode} dest={dest} fmt={fmt} />
              ))}
            </div>

            {filteredDestinations.length === 0 && (
              <div className="py-24 text-center">
                <p className="text-[14px] text-gray-400">
                  No destinations found for &ldquo;{search || activeTab}&rdquo;
                </p>
                <button
                  onClick={() => { setSearch(""); setActiveTab("all"); }}
                  className="mt-3 text-gray-700 text-[13px] underline underline-offset-2 hover:text-gray-900"
                >
                  Clear filters
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

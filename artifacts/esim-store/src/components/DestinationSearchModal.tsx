import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { useListDestinations } from "@workspace/api-client-react";
import { useCurrency } from "@/lib/currency-context";
import { X, Search } from "lucide-react";

/* ── Top popular destination codes shown by default ── */
const DEFAULT_CODES = ["ES", "GR", "IT", "GL-WORLD", "GL-EU", "TR", "GB", "FR", "JP", "US"];

const SEARCH_MODAL_DEFAULTS = {
  title: "Where?",
  placeholder: "Enter your destination",
  popularLabel: "Most popular destinations",
  popularCodes: DEFAULT_CODES,
};

/** Read popular country codes from admin overrides (max 10 for search modal). */
function getPopularCodesFromOverrides(max = 10): string[] {
  try {
    const raw = localStorage.getItem("voltey-country-overrides");
    if (!raw) return [];
    const overrides: Record<string, { status?: boolean; popular?: boolean }> = JSON.parse(raw);
    return Object.entries(overrides)
      .filter(([, v]) => v.popular === true)
      .map(([code]) => code)
      .slice(0, max);
  } catch {
    return [];
  }
}

function getSubtitle(code: string, name: string): string {
  if (code.startsWith("GL-")) {
    if (name.toLowerCase().includes("world") || name.toLowerCase().includes("global")) return "121 countries";
    if (name.toLowerCase().includes("europe")) return "35 countries";
    if (name.toLowerCase().includes("asia")) return "24 countries";
    return "multiple countries";
  }
  if (!/^[A-Z]{2}$/.test(code)) return "multiple countries";
  return "";
}

type DestinationSearchModalProps = {
  initialQuery?: string;
  onClose: () => void;
  title?: string;
  placeholder?: string;
  popularLabel?: string;
  popularCodes?: string[];
};

export function DestinationSearchModal({
  initialQuery = "",
  onClose,
  title = SEARCH_MODAL_DEFAULTS.title,
  placeholder = SEARCH_MODAL_DEFAULTS.placeholder,
  popularLabel = SEARCH_MODAL_DEFAULTS.popularLabel,
  popularCodes: popularCodesProp,
}: DestinationSearchModalProps) {
  const [, navigate] = useLocation();
  const { data } = useListDestinations();
  const { fmt } = useCurrency();
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const allDests = data?.destinations ?? [];

  /* Live popular codes from admin overrides (max 10); fall back to prop or default */
  const [adminPopularCodes, setAdminPopularCodes] = useState<string[]>(() => getPopularCodesFromOverrides(10));

  useEffect(() => {
    function refresh() {
      const codes = getPopularCodesFromOverrides(10);
      setAdminPopularCodes(codes);
    }
    window.addEventListener("voltey-country-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("voltey-country-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  /* Use admin overrides if any are set, otherwise prop or default */
  const popularCodes = adminPopularCodes.length > 0
    ? adminPopularCodes
    : (popularCodesProp ?? SEARCH_MODAL_DEFAULTS.popularCodes);

  /* Auto-focus input */
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  /* Close on Escape */
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  /* Lock body scroll while open */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  /* Displayed list — filtered when typing, popular list when empty */
  const displayed = useMemo(() => {
    if (!allDests.length) return [];
    const q = query.trim().toLowerCase();
    if (!q) {
      const popular = popularCodes
        .map((code) => allDests.find((d) => d.locationCode === code))
        .filter(Boolean) as typeof allDests;
      /* fill up to 8 with other top countries if codes not found */
      if (popular.length < 5) {
        return allDests.slice(0, 8);
      }
      return popular;
    }
    return allDests
      .filter((d) => d.locationName.toLowerCase().includes(q))
      .slice(0, 12);
  }, [allDests, query]);

  function goTo(code: string) {
    onClose();
    navigate(`/destination/${code}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      onClose();
      navigate(`/destinations?q=${encodeURIComponent(query.trim())}`);
    }
  }

  const isSearching = query.trim().length > 0;

  return (
    /* ── Backdrop ── */
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* ── Modal card ── */}
      <div className="bg-white rounded-2xl shadow-2xl w-full" style={{ maxWidth: 640 }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-gray-900" style={{ fontSize: 26, fontWeight: 600, lineHeight: "1.2" }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Search input */}
        <form onSubmit={handleSubmit} className="px-6 pb-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-[15px] text-gray-800 placeholder-gray-400 outline-none focus:border-gray-500 transition-colors pr-10"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* List */}
        <div className="px-6 pb-6">
          {/* Section label */}
          <p className="text-[13px] text-gray-500 font-medium mb-3">
            {isSearching ? `Results for "${query.trim()}"` : popularLabel}
          </p>

          {/* Loading skeletons */}
          {allDests.length === 0 && (
            <ul className="space-y-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 py-2">
                  <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-gray-100 rounded animate-pulse w-2/5" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-1/4" />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* No results */}
          {allDests.length > 0 && displayed.length === 0 && (
            <p className="text-gray-400 text-[14px] py-4 text-center">
              No destinations found for "{query.trim()}"
            </p>
          )}

          {/* Results */}
          {displayed.length > 0 && (
            <ul className="space-y-0.5" style={{ maxHeight: 320, overflowY: "auto" }}>
              {displayed.map((dest) => {
                const subtitle = getSubtitle(dest.locationCode, dest.locationName);
                return (
                  <li key={dest.locationCode}>
                    <button
                      onClick={() => goTo(dest.locationCode)}
                      className="w-full flex items-center gap-3.5 py-2.5 px-2 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                    >
                      <img
                        src={dest.flagUrl}
                        alt={dest.locationName}
                        className="w-[46px] h-[30px] rounded-[4px] object-cover shrink-0"
                        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-gray-900 leading-snug group-hover:text-gray-700 truncate">
                          {dest.locationName}
                        </p>
                        <p className="text-[12.5px] text-gray-400 mt-0.5">
                          From {fmt(dest.lowestPrice)}
                          {subtitle && (
                            <span className="text-gray-400"> &bull; {subtitle}</span>
                          )}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

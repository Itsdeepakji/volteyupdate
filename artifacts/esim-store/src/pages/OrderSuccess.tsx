import { useParams, useLocation, Link } from "wouter";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Copy, Search, ChevronDown, ChevronUp } from "lucide-react";
import { LottieIcon } from "@/components/LottieIcon";

/* ─── device detection ─────────────────────────────────────────────── */
function getDeviceOS(): "ios" | "android" | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

function buildQuickInstallUrl(ac: string): string | null {
  const os = getDeviceOS();
  if (os === "ios")
    return `https://esimsetup.apple.com/esim_qr_code_generator_data_input?EID=&AC=${encodeURIComponent(ac)}`;
  if (os === "android") return `esim:${ac}`;
  return null;
}

function parseSmdp(ac: string): string {
  const parts = ac.split("$");
  return parts[1] ?? "lpa.esim.com";
}

function formatExpiry(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit", timeZoneName: "short",
    });
  } catch { return iso; }
}

/* ─── CopyField ────────────────────────────────────────────────────── */
function CopyField({ label, value, icon }: { label: string; value: string; icon: string }) {
  const { toast } = useToast();
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <LottieIcon src={icon} size={14} playOnHover />
        <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2 bg-secondary/60 border rounded-xl px-3 py-2">
        <span className="text-[12px] font-mono flex-1 truncate text-foreground">{value}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(value);
            toast({ title: "Copied!" });
          }}
          className="shrink-0 p-1 rounded-lg hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
        >
          <Copy className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

/* ─── Coverage section ─────────────────────────────────────────────── */
interface LocationNetwork {
  locationName: string;
  locationCode: string;
  operatorList?: Array<{ operatorName: string; networkType: string }>;
}

const BADGE: Record<string, string> = {
  "5G": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "4G": "bg-blue-100 text-blue-700",
  LTE: "bg-blue-100 text-blue-700",
  "3G": "bg-green-100 text-green-700",
};

function Coverage({ networks }: { networks: LocationNetwork[] }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () => networks.filter((n) => n.locationName.toLowerCase().includes(search.toLowerCase())),
    [networks, search]
  );
  return (
    <div className="bg-card border rounded-2xl overflow-hidden">
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <LottieIcon src="/icons/global.json" size={20} playOnHover />
          <h2 className="text-[14px] font-semibold text-foreground">Coverage and networks</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Country or area"
            className="w-full pl-8 pr-3 py-2 text-[12px] border rounded-xl bg-secondary/40 outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>
      <div className="divide-y divide-border/50 max-h-52 overflow-y-auto">
        {filtered.map((net) => (
          <div key={net.locationCode} className="flex items-center gap-3 px-5 py-2.5">
            <img
              src={`https://flagcdn.com/w160/${net.locationCode.toLowerCase()}.png`}
              alt={net.locationName}
              className="w-4 h-4 rounded-full object-cover shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span className="text-[12px] font-medium text-foreground w-20 shrink-0 truncate">
              {net.locationName}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(net.operatorList ?? []).map((op) => (
                <span key={op.operatorName} className="text-[11px] text-muted-foreground flex items-center gap-1">
                  {op.operatorName}
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${BADGE[op.networkType] ?? "bg-muted text-muted-foreground"}`}>
                    {op.networkType}
                  </span>
                </span>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="px-5 py-3 text-[12px] text-muted-foreground text-center">
            No results for "{search}"
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Installation Guide ───────────────────────────────────────────── */
const IOS_STEPS = [
  { icon: "/icons/setting.json",      title: "Open Settings",   body: "Go to Settings on your iPhone." },
  { icon: "/icons/simcard.json",      title: "Mobile Service",  body: 'Tap "Mobile Service" → "Add eSIM" (or "Add Data Plan").' },
  { icon: "/icons/code.json",         title: "Scan QR Code",    body: "Tap 'Use QR Code' and scan the code above, or enter details manually." },
  { icon: "/icons/profile-tick.json", title: "Confirm",         body: "Follow the prompts. Your eSIM will activate in seconds." },
  { icon: "/icons/wifi.json",         title: "Enable Data",     body: "In Settings → Mobile Service, set Voltey eSIM as your data line." },
];
const ANDROID_STEPS = [
  { icon: "/icons/setting.json",      title: "Open Settings",   body: "Go to Settings → Network & Internet (or Connections on Samsung)." },
  { icon: "/icons/simcard.json",      title: "SIM Manager",     body: 'Tap "SIM Manager" or "Mobile network" → "Add eSIM".' },
  { icon: "/icons/code.json",         title: "Scan QR Code",    body: "Select 'Scan QR code' and point your camera at the code above." },
  { icon: "/icons/profile-tick.json", title: "Activate",        body: "Follow the prompts to download and activate — under a minute." },
  { icon: "/icons/wifi.json",         title: "Set as Data SIM", body: "In SIM Manager, set your Voltey eSIM as the preferred data SIM." },
];

function InstallationGuide() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"ios" | "android">("ios");
  const steps = tab === "ios" ? IOS_STEPS : ANDROID_STEPS;

  return (
    <div className="bg-card border rounded-2xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <LottieIcon src="/icons/note-text.json" size={18} autoplay={open} loop={false} playOnHover />
          <span className="text-[14px] font-semibold text-foreground">Installation Guide</span>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-border/50 pt-4">
          {/* OS tab switcher */}
          <div className="flex p-1 bg-secondary/60 rounded-xl mb-4">
            {(["ios", "android"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                style={{
                  background: tab === t ? "white" : "transparent",
                  color: tab === t ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,.10)" : "none",
                }}
              >
                {t === "ios" ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                    iPhone (iOS)
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.637.637 0 0 0-.85.26l-1.87 3.23A10.733 10.733 0 0 0 12 8c-1.55 0-3.03.34-4.46.94L5.67 5.71c-.17-.31-.55-.43-.86-.27-.31.17-.43.56-.26.87L6.4 9.49A10.92 10.92 0 0 0 1 19h22a10.92 10.92 0 0 0-5.4-9.52zM7 16c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm10 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
                    </svg>
                    Android
                  </>
                )}
              </button>
            ))}
          </div>

          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/8 flex items-center justify-center shrink-0 mt-0.5 border border-primary/10">
                  <LottieIcon src={step.icon} size={18} playOnHover />
                </div>
                <div className="pt-0.5">
                  <p className="text-[12px] font-semibold text-foreground leading-tight">{step.title}</p>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          {tab === "ios" && (
            <p className="mt-4 text-[11px] text-primary/80 bg-primary/5 border border-primary/10 rounded-xl px-3 py-2.5">
              Requires iPhone XS or later with iOS 12.1+. Dual SIM functionality may vary by carrier.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Per-eSIM profile card ────────────────────────────────────────── */
interface EsimProfile {
  iccid: string;
  ac?: string;
  qrCodeUrl?: string;
  smdpAddress?: string;
  matchingId?: string;
  apn?: string;
  expiredTime?: string;
}

function ProfileCard({ profile, index, total, isMobile }: {
  profile: EsimProfile;
  index: number;
  total: number;
  isMobile: boolean;
}) {
  const [installTab, setInstallTab] = useState<"qr" | "manual">("qr");
  const smdp = profile.smdpAddress ?? (profile.ac ? parseSmdp(profile.ac) : "lpa.esim.com");
  const quickInstallUrl = profile.ac ? buildQuickInstallUrl(profile.ac) : null;

  return (
    <div className="bg-card border rounded-2xl overflow-hidden">
      {total > 1 && (
        <div className="flex items-center justify-between px-5 py-2.5 bg-secondary/40 border-b border-border/50">
          <div className="flex items-center gap-2">
            <LottieIcon src="/icons/simcard.json" size={15} playOnHover />
            <p className="text-[12px] font-semibold text-foreground">eSIM {index + 1}</p>
          </div>
          <span className="text-[10px] text-muted-foreground">{index + 1} of {total}</span>
        </div>
      )}
      <div className="px-5 py-4 space-y-4">
        {quickInstallUrl && isMobile && (
          <a
            href={quickInstallUrl}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[14px] font-semibold text-white bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all"
          >
            ⚡ Quick Install
          </a>
        )}

        <div className="flex p-1 bg-secondary/60 rounded-xl">
          {(["qr", "manual"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setInstallTab(t)}
              className="flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all"
              style={{
                background: installTab === t ? "white" : "transparent",
                color: installTab === t ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                boxShadow: installTab === t ? "0 1px 3px rgba(0,0,0,.10)" : "none",
              }}
            >
              {t === "qr" ? "📷 Scan QR Code" : "✏️ Manual Entry"}
            </button>
          ))}
        </div>

        {installTab === "qr" ? (
          <div className="flex flex-col items-center py-2">
            {profile.qrCodeUrl ? (
              <div className="p-3 bg-white rounded-2xl border border-border/60 shadow-sm mb-2 inline-block">
                <img src={profile.qrCodeUrl} alt="eSIM QR Code" className="w-40 h-40 block" />
              </div>
            ) : (
              <div className="w-40 h-40 rounded-2xl border-2 border-dashed border-border flex items-center justify-center mb-2">
                <LottieIcon src="/icons/code.json" size={36} playOnHover />
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">Scan on your eSIM-compatible device</p>
          </div>
        ) : (
          <div className="space-y-3 py-1">
            <CopyField label="SM-DP+ Address" value={smdp} icon="/icons/wifi.json" />
            <CopyField label="Activation Code" value={profile.ac ?? profile.matchingId ?? "N/A"} icon="/icons/code.json" />
            <CopyField label="ICCID" value={profile.iccid} icon="/icons/security-card.json" />
            {profile.apn && (
              <CopyField label="APN" value={profile.apn} icon="/icons/cpu.json" />
            )}
          </div>
        )}

        {profile.expiredTime && (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 text-[12px]">
            <span className="text-amber-600 font-medium">Activate before</span>
            <span className="text-amber-800 font-semibold">{formatExpiry(profile.expiredTime)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main page ────────────────────────────────────────────────────── */
export default function OrderSuccess() {
  const { transactionId } = useParams<{ transactionId: string }>();

  const { data: order, isLoading, error } = useGetOrder(transactionId!, {
    query: { enabled: !!transactionId, queryKey: getGetOrderQueryKey(transactionId!) },
  });

  const pkgState = (window.history.state as { package?: Record<string, unknown> } | null)?.package;
  const locationNetworks = (pkgState?.locationNetworkList as LocationNetwork[] | undefined) ?? [];
  const deviceOS = getDeviceOS();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="text-center space-y-3">
          <LottieIcon src="/icons/wifi.json" size={48} autoplay loop className="mx-auto opacity-60" />
          <p className="text-[13px] text-muted-foreground">Loading your eSIM…</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-secondary/30 flex flex-col items-center justify-center gap-4 px-4">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <h1 className="text-[18px] font-bold">Order Not Found</h1>
        <p className="text-[13px] text-muted-foreground">We couldn't find this order.</p>
        <Link href="/">
          <button className="px-6 py-2 rounded-full border text-[13px] font-medium hover:bg-secondary transition-colors">
            Back to Home
          </button>
        </Link>
      </div>
    );
  }

  const isMobile = deviceOS === "ios" || deviceOS === "android";
  const profiles = (order.esimProfiles ?? []) as EsimProfile[];

  return (
    <div className="min-h-screen bg-secondary/30 pb-12">
      <div className="max-w-md mx-auto px-4 pt-10 space-y-3">

        {/* ── Header ── */}
        <div className="text-center pb-2">
          <div className="flex items-center justify-center mb-3">
            <LottieIcon
              src="/icons/profile-tick.json"
              size={56}
              autoplay
              loop={false}
              playOnHover={false}
              className="drop-shadow-sm"
            />
          </div>
          <h1 className="text-[24px] font-bold tracking-tight text-foreground">Payment Successful!</h1>
          <div className="flex items-center justify-center gap-1.5 mt-1.5">
            <LottieIcon src="/icons/message.json" size={14} playOnHover />
            <p className="text-[13px] text-muted-foreground">
              Your eSIM{profiles.length > 1 ? "s are" : " is"} ready. Details sent to your email.
            </p>
          </div>
        </div>

        {/* ── Plan info card ── */}
        <div className="bg-card border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-2">
              <LottieIcon src="/icons/simcard.json" size={20} playOnHover />
              <div>
                <p className="text-[13px] font-semibold text-foreground leading-tight">
                  {order.packageName || "eSIM Plan"}
                </p>
                {order.orderNo && (
                  <p className="text-[11px] text-muted-foreground">Order #{order.orderNo}</p>
                )}
              </div>
            </div>
            <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
              {profiles.length > 1 ? `${profiles.length} eSIMs` : "Active"}
            </span>
          </div>
        </div>

        {/* ── Per-eSIM profile cards ── */}
        {profiles.length > 0 ? (
          profiles.map((p, i) => (
            <ProfileCard key={p.iccid || i} profile={p} index={i} total={profiles.length} isMobile={isMobile} />
          ))
        ) : (
          <div className="bg-card border rounded-2xl px-5 py-6 text-center">
            <LottieIcon src="/icons/notification-bing.json" size={40} autoplay loop className="mx-auto mb-2" />
            <p className="text-[13px] font-semibold text-foreground mb-1">eSIM Profile Pending</p>
            <p className="text-[12px] text-muted-foreground">
              eSIM details will arrive in your email shortly.
            </p>
          </div>
        )}

        {/* ── Coverage and networks ── */}
        {locationNetworks.length > 0 && (
          <Coverage networks={locationNetworks} />
        )}

        {/* ── Installation Guide ── */}
        <InstallationGuide />

        {/* ── Footer ── */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <Link href="/">
            <button className="px-8 py-2.5 rounded-full border bg-card text-[13px] font-medium text-foreground hover:bg-secondary transition-colors shadow-sm">
              Back to Home
            </button>
          </Link>
          {order.transactionId && (
            <p className="text-[10px] text-muted-foreground/60">
              Transaction ID: {order.transactionId}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}

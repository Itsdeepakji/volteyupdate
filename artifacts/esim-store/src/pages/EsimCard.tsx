import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Copy, Check, Smartphone } from "lucide-react";

/* ── Types ── */
interface EsimProfile {
  iccid?: string;
  ac?: string;
  smdpAddress?: string;
  matchingId?: string;
  apn?: string;
  expiredTime?: string;
}
interface EsimData {
  transactionId: string;
  packageName: string;
  status: string;
  esimProfiles: EsimProfile[];
  createdAt?: string;
}

/* ── Country code map (ISO-2 for flagcdn) ── */
const COUNTRY_CODE: Record<string, string> = {
  "Afghanistan":"af","Albania":"al","Algeria":"dz","Argentina":"ar","Armenia":"am","Australia":"au",
  "Austria":"at","Azerbaijan":"az","Bahrain":"bh","Bangladesh":"bd","Belgium":"be","Bolivia":"bo",
  "Brazil":"br","Bulgaria":"bg","Cambodia":"kh","Canada":"ca","Chile":"cl","China":"cn","Colombia":"co",
  "Costa Rica":"cr","Croatia":"hr","Cyprus":"cy","Czech":"cz","Denmark":"dk","Ecuador":"ec","Egypt":"eg",
  "Estonia":"ee","Ethiopia":"et","Finland":"fi","France":"fr","Georgia":"ge","Germany":"de","Ghana":"gh",
  "Greece":"gr","Guatemala":"gt","Honduras":"hn","Hong Kong":"hk","Hungary":"hu","India":"in",
  "Indonesia":"id","Iran":"ir","Iraq":"iq","Ireland":"ie","Israel":"il","Italy":"it","Japan":"jp",
  "Jordan":"jo","Kazakhstan":"kz","Kenya":"ke","Kuwait":"kw","Kyrgyzstan":"kg","Latvia":"lv",
  "Lebanon":"lb","Lithuania":"lt","Luxembourg":"lu","Malaysia":"my","Malta":"mt","Mexico":"mx",
  "Moldova":"md","Mongolia":"mn","Montenegro":"me","Morocco":"ma","Mozambique":"mz","Myanmar":"mm",
  "Nepal":"np","Netherlands":"nl","New Zealand":"nz","Nicaragua":"ni","Nigeria":"ng","Norway":"no",
  "Oman":"om","Pakistan":"pk","Panama":"pa","Paraguay":"py","Peru":"pe","Philippines":"ph","Poland":"pl",
  "Portugal":"pt","Puerto Rico":"pr","Qatar":"qa","Romania":"ro","Russia":"ru","Saudi Arabia":"sa",
  "Senegal":"sn","Serbia":"rs","Singapore":"sg","Slovakia":"sk","Slovenia":"si","Somalia":"so",
  "South Africa":"za","South Korea":"kr","Spain":"es","Sri Lanka":"lk","Sweden":"se","Switzerland":"ch",
  "Taiwan":"tw","Tajikistan":"tj","Tanzania":"tz","Thailand":"th","Tunisia":"tn","Turkey":"tr",
  "Uganda":"ug","Ukraine":"ua","United Arab Emirates":"ae","United Kingdom":"gb","United States":"us",
  "Uruguay":"uy","Uzbekistan":"uz","Venezuela":"ve","Vietnam":"vn","Yemen":"ye","Zambia":"zm",
  "Zimbabwe":"zw","Laos":"la","Lao PDR":"la","Macao":"mo","Macau":"mo","North Macedonia":"mk",
  "Kosovo":"xk","Palestine":"ps","Europe":"eu","Global":"un","Caribbean":"","Africa":"","Asia":"","Americas":"",
};

/* ── Package name parser ── */
function countryFromPackage(name: string): string {
  const sorted = Object.keys(COUNTRY_CODE).sort((a, b) => b.length - a.length);
  for (const c of sorted) { if (name.startsWith(c)) return c; }
  return name.split(" ")[0] ?? name;
}
function parsePackageName(name: string): { country: string; data: string; duration: string } {
  const country = countryFromPackage(name);
  const rest = name.slice(country.length).trim();
  const m = rest.match(/(\d+(?:\.\d+)?(?:MB|GB|TB))\s*[x×]?\s*(\d+\s*(?:Day|Month|Year)s?)/i);
  if (m) return { country, data: m[1], duration: m[2] };
  const parts = rest.split(/\s+/);
  return { country, data: parts[0] ?? "—", duration: parts[1] ?? "—" };
}

/* ── QR image component ── */
function QrImg({ value, size = 180 }: { value: string; size?: number }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    if (!value) return;
    QRCode.toDataURL(value, { width: size * 2, margin: 2, color: { dark: "#000000", light: "#ffffff" } })
      .then(setSrc).catch(() => {});
  }, [value, size]);
  if (!src) return <div className="animate-pulse bg-gray-100 rounded-lg" style={{ width: size, height: size }} />;
  return <img src={src} alt="QR Code" style={{ width: size, height: size }} className="rounded-lg" />;
}

/* ── Detail row with copy ── */
function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className={`text-[13px] text-gray-800 truncate ${mono ? "font-mono" : "font-medium"}`}>{value}</p>
      </div>
      <button
        onClick={() => {
          navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-green-600 transition-colors"
        title="Copy"
      >
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

/* ── Installation card ── */
const IOS_STEPS = [
  "Settings → General → VPN & Device Management → Add eSIM",
  "Tap 'Use QR Code' then scan the QR above, or tap the QR to launch iOS eSIM setup",
  "Tap Continue and follow the on-screen prompts",
  "Give the eSIM a label (e.g. Voltey Travel) and confirm",
  "Settings → Cellular → enable Voltey eSIM and turn on Data Roaming",
];
const ANDROID_STEPS = [
  "Settings → Connections → SIM Manager → Add eSIM (varies by manufacturer)",
  "Tap 'Scan QR code' then scan the QR above, or tap the QR to launch eSIM setup",
  "Confirm carrier details and tap Activate",
  "Name your eSIM (e.g. Voltey Travel) and confirm",
  "Mobile Networks → select Voltey eSIM → enable Data Roaming",
];

function InstallCard({ platform, steps }: { platform: "ios" | "android"; steps: string[] }) {
  const isIos = platform === "ios";
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3" style={{ background: "#22c55e" }}>
        <span className="text-white text-lg">{isIos ? "🍎" : "🤖"}</span>
        <div>
          <p className="text-white font-bold text-[13px]">{isIos ? "iPhone (iOS 13+)" : "Android 9+"}</p>
          <p className="text-green-100 text-[11px]">{isIos ? "Tap QR to open Apple eSIM setup" : "Tap QR to launch eSIM installer"}</p>
        </div>
      </div>
      <div className="p-4 space-y-2.5">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-2.5">
            <span
              className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white mt-0.5"
              style={{ background: "#22c55e" }}
            >
              {i + 1}
            </span>
            <p className="text-[12px] text-gray-700 leading-snug">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function EsimCard() {
  const params = useParams<{ transactionId: string }>();
  const transactionId = params?.transactionId ?? "";

  const { data, isLoading, error } = useQuery({
    queryKey: ["esim-card", transactionId],
    queryFn: async () => {
      const res = await fetch(`/api/esim/${transactionId}`);
      if (!res.ok) throw new Error("eSIM not found");
      return res.json() as Promise<EsimData>;
    },
    enabled: !!transactionId,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading your eSIM…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-xs">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">eSIM not found</h2>
          <p className="text-sm text-gray-500">This link may be invalid or the eSIM may have been removed.</p>
        </div>
      </div>
    );
  }

  const { country, data: dataAmt, duration } = parsePackageName(data.packageName);
  const cc = COUNTRY_CODE[country] ?? "un";
  const profiles = data.esimProfiles ?? [];
  const profile = profiles[0] ?? {};

  const lpaString = profile.smdpAddress && profile.matchingId
    ? `LPA:1$${profile.smdpAddress}$${profile.matchingId}`
    : (profile.ac ?? "");

  const handleQrTap = () => {
    if (!lpaString) return;
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) {
      const parts = lpaString.split("$");
      const ac = parts[2] ?? "";
      window.open(
        `https://esimsetup.apple.com/esim_qr_code_generator_data_input?EID=&AC=${encodeURIComponent(ac)}`,
        "_blank",
      );
    } else if (/Android/.test(ua)) {
      window.location.href = `esim:${lpaString}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero card — matches attached image design ── */}
      <div className="relative w-full overflow-hidden" style={{ height: "min(60vw, 640px)", minHeight: 420 }}>
        {/* Flag background */}
        <img
          src={`https://flagcdn.com/w1280/${cc}.png`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* White frosted overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "rgba(255,255,255,0.58)", backdropFilter: "blur(4px)" }}
        />

        {/* Content grid */}
        <div
          className="relative z-10 flex flex-col h-full px-6 md:px-12 py-5 md:py-8"
          style={{ height: "min(60vw, 640px)", minHeight: 420 }}
        >
          {/* Top row: logo | plan name | expires */}
          <div className="flex items-start justify-between gap-2">
            <span
              className="text-2xl sm:text-3xl md:text-4xl font-black leading-none shrink-0"
              style={{ color: "#22c55e" }}
            >
              voltey.
            </span>
            <div className="text-center flex-1 px-2">
              <h1 className="text-sm sm:text-xl md:text-2xl font-black text-gray-900 leading-tight">
                {country} {dataAmt} {duration}
              </h1>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] uppercase tracking-wide text-gray-500">Expires</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-700">After {duration}</p>
            </div>
          </div>

          {/* QR centred */}
          <div className="flex-1 flex items-center justify-center py-2">
            {lpaString ? (
              <button
                onClick={handleQrTap}
                className="bg-white rounded-2xl md:rounded-3xl shadow-2xl p-3 md:p-5 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                title="Tap to install eSIM on this device"
              >
                <QrImg value={lpaString} size={Math.min(200, Math.round(window.innerWidth * 0.38))} />
              </button>
            ) : (
              <div className="bg-white rounded-2xl px-6 py-8 text-center shadow-md">
                <Smartphone className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">QR unavailable</p>
              </div>
            )}
          </div>

          {/* SCAN text */}
          <div className="text-center">
            <p className="text-base sm:text-xl md:text-2xl font-black text-gray-900">SCAN or Click the QR</p>
            <p className="text-[11px] sm:text-sm text-gray-600 mt-0.5">
              Point your camera or tap to install your eSIM
            </p>
          </div>

          {/* Issued in — bottom right */}
          <div className="flex justify-end pt-2">
            <p className="text-[11px] italic text-gray-600">Issued in {country}</p>
          </div>
        </div>
      </div>

      {/* ── Details + Installation ── */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Brand strip */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-black" style={{ color: "#22c55e" }}>voltey.</span>
          <span className="text-sm text-gray-400">eSIM Activation Card</span>
        </div>

        {/* eSIM technical details */}
        {profiles.length > 0 && (profile.iccid || profile.smdpAddress || profile.matchingId) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-3 mb-1">
              eSIM Technical Details
            </p>
            {profile.iccid && <DetailRow label="ICCID" value={profile.iccid} mono />}
            {profile.smdpAddress && <DetailRow label="SM-DP+ Address" value={profile.smdpAddress} />}
            {profile.matchingId && <DetailRow label="Activation Code" value={profile.matchingId} mono />}
          </div>
        )}

        {/* Installation guide */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-3">Installation Guide</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InstallCard platform="ios" steps={IOS_STEPS} />
            <InstallCard platform="android" steps={ANDROID_STEPS} />
          </div>
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-[12px] text-amber-800 font-medium leading-snug">
              ⚠️ Your device must be unlocked and eSIM-compatible. Once deleted, the eSIM cannot be re-downloaded. Keep this page bookmarked.
            </p>
          </div>
        </div>

        {/* Help footer */}
        <div className="text-center pt-4 pb-8 border-t border-gray-100">
          <p className="text-[12px] text-gray-400">
            Need help?{" "}
            <a href="mailto:support@voltey.app" className="text-green-600 font-medium hover:underline">
              support@voltey.app
            </a>
          </p>
          <p className="text-[11px] text-gray-300 mt-1">voltey.app · Your global eSIM partner</p>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link } from "wouter";
import { LottieIcon } from "@/components/LottieIcon";
import { Check, Shield, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import appStoreSvg from "@assets/app-store_1781450235986.svg";
import googlePlaySvg from "@assets/google-play_1781450235984.svg";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API  = import.meta.env.VITE_API_BASE ?? "";

function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {items.map((item, i) => (
        <div key={i} className="border-b border-gray-200">
          <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between py-4 text-left gap-4">
            <span className="font-semibold text-gray-900 text-[15px]">{item.q}</span>
            {open === i ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
          </button>
          {open === i && <div className="pb-4 text-[14px] text-gray-500 leading-relaxed">{item.a}</div>}
        </div>
      ))}
    </div>
  );
}

const DEFAULT = {
  hero: {
    title: "Safe travels with the Voltey eSIM features",
    subtitle: "Stay connected wherever you go and protect your browsing.",
  },
  securityPoints: [
    "Block tracking sites automatically",
    "Secure mobile data encryption",
    "Keep your identity private",
  ],
  locationPoints: [
    "Choose from Free plan for basic locations",
    "Upgrade for 3,000+ locations",
    "Browse your home content without borders",
  ],
  adsPoints: [
    "Remove intrusive distractions",
    "Protect children browsing online",
    "Smooth browsing experience",
  ],
  threatsPoints: [
    "Block malicious sites automatically",
    "Anti-phishing protection",
    "Secure DNS queries",
  ],
  stayCards: [
    { icon: "/icons/simcard.json",       title: "Free plan for all", desc: "Access basic protection features on any Voltey eSIM plan at no extra cost." },
    { icon: "/icons/lottie/call.json",   title: "Easy to use",        desc: "Turn security features on or off from the Voltey app in a single tap." },
    { icon: "/icons/global.json",        title: "Never run out of data", desc: "Data-saving mode helps your plan last longer on every trip." },
    { icon: "/icons/security-card.json", title: "Instant learning guide", desc: "Set up in minutes with our in-app step-by-step security guide." },
  ],
  faqs: [
    { q: "What are some online examples of security features?",   a: "Voltey includes ad blocking, malicious site blocking, and encrypted DNS — all designed to protect your browsing automatically." },
    { q: "What is a virtual location?",                           a: "A virtual location lets you browse the internet as if you're in a different country, giving you access to local content and protecting your real IP address." },
    { q: "How do I change my virtual location on my phone?",      a: "Open the Voltey app, go to Security Settings, and select a virtual location from the available list." },
    { q: "How do I use the Actual Location feature on iPhone?",   a: "In the Voltey app on iOS, go to Settings → Location Privacy → and toggle 'Use Actual Location' on or off." },
    { q: "Is the Voltey ad blocker free?",                        a: "Yes! Basic ad blocking and tracker blocking are included free with every Voltey eSIM plan." },
    { q: "How do I enable web protection?",                       a: "Go to the Security tab in your Voltey app and toggle Web Protection to On. It activates instantly." },
    { q: "Can web protection be bypassed?",                       a: "Voltey's web protection works at the network level, so most malicious sites are blocked before they can load." },
  ],
};

export default function SecurityPage() {
  const [cms, setCms] = useState(DEFAULT);

  useEffect(() => {
    fetch(`${API}/api/content/product-security`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setCms({ ...DEFAULT, ...d }); })
      .catch(() => {});
  }, []);

  return (
    <div style={{ fontFamily: "Poppins, sans-serif" }}>

      {/* ── HERO — light blue gradient ── */}
      <section style={{ background: "linear-gradient(180deg, #dbeafe 0%, #eff6ff 60%, #fff 100%)" }}>
        <div className="max-w-6xl mx-auto px-6 py-14 lg:py-20 text-center">
          <h1 className="font-black text-gray-900 mb-3" style={{ fontSize: "clamp(28px,4vw,46px)" }}>
            {cms.hero.title}
          </h1>
          <p className="text-[15px] text-gray-500 mb-10">{cms.hero.subtitle}</p>
          {/* Phone mockup hero */}
          <div className="relative inline-block">
            <img
              src="https://images.unsplash.com/photo-1563986768711-b3bde3dc821e?w=700&q=80"
              alt="Security"
              className="rounded-3xl shadow-2xl mx-auto object-cover"
              style={{ width: "100%", maxWidth: 680, height: 320 }}
            />
            {/* floating shield badge */}
            <div className="absolute top-4 left-6 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#f0fdf9" }}>
                <LottieIcon src="/icons/security-card.json" size={20} autoplay loop />
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Status</p>
                <p className="text-[13px] font-bold" style={{ color: "#0da976" }}>Protected</p>
              </div>
            </div>
            <div className="absolute bottom-4 right-6 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-2">
              <LottieIcon src="/icons/wifi.json" size={20} autoplay loop />
              <p className="text-[13px] font-bold text-gray-800">Secure Connection</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BETTER SECURITY ── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 max-w-xl">
            <h2 className="font-black text-gray-900 mb-4" style={{ fontSize: "clamp(22px,3vw,32px)" }}>
              Better eSIM security — stay safer across your travels
            </h2>
            <p className="text-[14px] text-gray-500 mb-6 leading-relaxed">
              You don't have to worry about security with Voltey. Our best-in-class protection indicators let you know you're always protected. Keep your personal data safe while you're away with end-to-end encryption across all connections.
            </p>
            <ul className="space-y-3">
              {cms.securityPoints.map((pt, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="w-5 h-5 shrink-0" style={{ color: "#0da976" }} />
                  <span className="text-[14px] text-gray-700">{pt}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative bg-gray-50 rounded-3xl p-6" style={{ width: 320 }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#0da976" }}>
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-gray-900">Security Dashboard</span>
              </div>
              {["Ad Blocking", "Tracker Blocking", "DNS Encryption", "Malware Protection"].map((f, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <span className="text-[13px] text-gray-700">{f}</span>
                  <span className="text-[12px] font-bold px-3 py-1 rounded-full" style={{ background: "#f0fdf9", color: "#0da976" }}>ON</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── LOCATION ── */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row-reverse items-center gap-12">
          <div className="flex-1 max-w-xl">
            <span className="inline-block text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3">Virtual Location</span>
            <h2 className="font-black text-gray-900 mb-4" style={{ fontSize: "clamp(22px,3vw,32px)" }}>
              Changing your location is effortless
            </h2>
            <p className="text-[14px] text-gray-500 mb-6 leading-relaxed">
              Use a virtual location to access content from back home, stay private while browsing, and keep using your favorite services without interruption — no matter where you travel.
            </p>
            <ul className="space-y-3">
              {cms.locationPoints.map((pt, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="w-5 h-5 shrink-0" style={{ color: "#0da976" }} />
                  <span className="text-[14px] text-gray-700">{pt}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 flex justify-center">
            <img
              src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500&q=80"
              alt="Globe"
              className="rounded-3xl shadow-xl object-cover"
              style={{ width: 340, height: 380 }}
            />
          </div>
        </div>
      </section>

      {/* ── ADS ── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 max-w-xl">
            <span className="inline-block text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3">Ad Blocker</span>
            <h2 className="font-black text-gray-900 mb-4" style={{ fontSize: "clamp(22px,3vw,32px)" }}>
              More blocked ads, more relaxed browsing
            </h2>
            <p className="text-[14px] text-gray-500 mb-6 leading-relaxed">
              Cut out the noise with Voltey's built-in ad blocker. Your connection is faster, pages load quicker, and you save on data — all without lifting a finger.
            </p>
            <ul className="space-y-3">
              {cms.adsPoints.map((pt, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="w-5 h-5 shrink-0" style={{ color: "#0da976" }} />
                  <span className="text-[14px] text-gray-700">{pt}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 flex justify-center">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&q=80"
              alt="Browsing"
              className="rounded-3xl shadow-xl object-cover"
              style={{ width: 340, height: 380 }}
            />
          </div>
        </div>
      </section>

      {/* ── THREATS ── */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row-reverse items-center gap-12">
          <div className="flex-1 max-w-xl">
            <span className="inline-block text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3">Threat Protection</span>
            <h2 className="font-black text-gray-900 mb-4" style={{ fontSize: "clamp(22px,3vw,32px)" }}>
              Don't let online threats ruin your trip
            </h2>
            <p className="text-[14px] text-gray-500 mb-6 leading-relaxed">
              Voltey monitors every connection in real time. If a suspicious site or malicious link appears, it's blocked before it can do any damage — keeping your devices and accounts secure wherever you go.
            </p>
            <ul className="space-y-3">
              {cms.threatsPoints.map((pt, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="w-5 h-5 shrink-0" style={{ color: "#0da976" }} />
                  <span className="text-[14px] text-gray-700">{pt}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 flex justify-center">
            <img
              src="https://images.unsplash.com/photo-1551650975-87deedd944c3?w=500&q=80"
              alt="Threat protection"
              className="rounded-3xl shadow-xl object-cover"
              style={{ width: 340, height: 380 }}
            />
          </div>
        </div>
      </section>

      {/* ── STAY CONNECTED ── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-black text-gray-900 mb-2 text-center" style={{ fontSize: "clamp(22px,3vw,34px)" }}>
            Stay connected wherever you go
          </h2>
          <p className="text-center text-gray-400 text-[14px] mb-10">Security features that travel with you.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {cms.stayCards.map((card, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#f0fdf9" }}>
                  <LottieIcon src={card.icon} size={28} autoplay loop />
                </div>
                <h3 className="font-bold text-gray-900 text-[14.5px] mb-2">{card.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── APP DOWNLOAD ── */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 max-w-md">
            <span className="inline-block text-[12px] font-bold uppercase tracking-widest mb-3" style={{ color: "#0da976" }}>iOS · Android</span>
            <h2 className="font-black text-gray-900 mb-4" style={{ fontSize: "clamp(22px,3vw,32px)" }}>
              Download the Voltey eSIM app
            </h2>
            <p className="text-[14px] text-gray-500 mb-6 leading-relaxed">
              Manage your eSIM plans, monitor security features, and control your virtual location — all from one powerful app.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#" className="hover:opacity-80 transition-opacity">
                <img src={appStoreSvg} alt="App Store" className="h-11" />
              </a>
              <a href="#" className="hover:opacity-80 transition-opacity">
                <img src={googlePlaySvg} alt="Google Play" className="h-11" />
              </a>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <img
              src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80"
              alt="App"
              className="rounded-3xl shadow-xl object-cover"
              style={{ width: 420, height: 280 }}
            />
          </div>
        </div>
      </section>

      {/* ── 24/7 SUPPORT ── */}
      <section className="py-10 px-6 text-center border-y border-gray-100 bg-white">
        <div className="max-w-xl mx-auto">
          <p className="font-bold text-gray-900 text-[18px] mb-2">24/7 eSIM support</p>
          <p className="text-[14px] text-gray-400 mb-4">Have a question? Our Support team is available 24/7.</p>
          <a href="mailto:support@voltey.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-bold border-2 border-gray-200 text-gray-700 hover:border-green-400 hover:text-green-600 transition-all">
            Contact Support
          </a>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-black text-gray-900 mb-10 text-center" style={{ fontSize: "clamp(22px,3vw,34px)" }}>
            Frequently asked questions
          </h2>
          <Faq items={cms.faqs} />
        </div>
      </section>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link } from "wouter";
import { LottieIcon } from "@/components/LottieIcon";
import { Check, ChevronDown, ChevronUp, ArrowRight, Zap, Shield, Wifi, Clock } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API  = import.meta.env.VITE_API_BASE ?? "";

function DarkFaq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2 max-w-3xl mx-auto">
      {items.map((item, i) => (
        <div key={i} className="border-b border-white/10">
          <button onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between py-4 text-left gap-4">
            <span className="font-semibold text-white/90 text-[14.5px]">{item.q}</span>
            {open === i
              ? <ChevronUp className="w-4 h-4 text-white/40 shrink-0" />
              : <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />}
          </button>
          {open === i && (
            <div className="pb-4 text-[13.5px] text-white/60 leading-relaxed">{item.a}</div>
          )}
        </div>
      ))}
    </div>
  );
}

const DEFAULT = {
  hero: {
    title: "Voltey Ultra: Your all-in-one premium travel plan",
    subtitle: "Fully unlimited data, unlimited storage, instant access. Stay connected, protected, and stress-free wherever you travel.",
  },
  whatTitle: "What is the Voltey Ultra plan?",
  whatDesc: "The Ultra plan is Voltey's premium tier — packed with unlimited data, built-in security tools, access to airport lounges, fast-track services, and delayed-flight insurance. It's everything a frequent traveler needs, in one subscription.",
  perks: [
    { icon: "/icons/lottie/magic-star.json", title: "Fast-track service",            desc: "Skip the line at security and check-in — get your boarding pass and access priority queues instantly." },
    { icon: "/icons/security-card.json",      title: "Premium online security tools", desc: "Bank-grade encryption, ad blocking, threat detection, and virtual location — all included." },
    { icon: "/icons/lottie/award.json",       title: "Airport lounge access",         desc: "Escape the crowds — access 1,000+ airport lounges worldwide included in your Ultra plan." },
    { icon: "/icons/notification.json",       title: "Delayed-flight insurance",      desc: "Flight delayed 2+ hours? Get compensation automatically — no claims process needed." },
  ],
  whyItems: [
    { icon: "/icons/wifi.json",             title: "Truly unlimited data",         desc: "Stay connected with no data caps, no speed throttling, and no hidden limits anywhere in the world." },
    { icon: "/icons/simcard.json",          title: "Fast internet access",          desc: "Import files with Saily Ultra, interact with other Voltey users in real time, or do anything you do on a regular basis." },
    { icon: "/icons/lottie/profile-2user.json", title: "Plan management",          desc: "Voltey Ultra releases automatically whenever you need it. No manual steps, no waiting." },
    { icon: "/icons/security-card.json",    title: "Digital security tools",        desc: "Voltey Ultra includes NordVPN, NordPass, and NordLocker — protecting your privacy, passwords, and files." },
    { icon: "/icons/lottie/call.json",      title: "Priority 24/7 support",        desc: "Ultra subscribers get a dedicated support channel with guaranteed 2-minute response times." },
    { icon: "/icons/lottie/discount circle.json", title: "Cancel anytime",         desc: "Change your plan month-to-month. You can switch tiers or cancel with one tap — no penalties." },
  ],
  faqs: [
    { q: "What's the difference between Voltey's regular and monthly site plans?",  a: "Regular plans cover a set amount of data for a specific trip. Ultra is a monthly subscription with unlimited data, security tools, and exclusive perks like lounge access." },
    { q: "How does billing work for the Ultra plan?",                                a: "Ultra is billed monthly. Your card is charged on the same date each month. Cancel anytime from the app with no fees." },
    { q: "Where can I use my Voltey Ultra data?",                                    a: "Voltey Ultra covers all 190+ destinations available on the platform. Switch countries at any time with no extra charge." },
    { q: "Can I cancel my Voltey Ultra plan anytime?",                               a: "Yes. Cancel from Settings → Subscription in the Voltey app and you'll keep access until the end of your billing period." },
    { q: "Can I use my regular SIM card at the same time?",                          a: "Yes. Ultra runs on your eSIM line. Your regular SIM stays active for calls and texts if you prefer." },
    { q: "When will my Voltey Ultra plan start?",                                    a: "Your Ultra plan activates the moment your payment is confirmed — usually within seconds." },
    { q: "How does the cash back in Voltey credits work?",                           a: "For every month you're on Ultra, you earn 5% back in Voltey credits usable on future plan purchases." },
    { q: "How does the lounge feature work?",                                        a: "After activating Ultra, open the Lounge tab in the Voltey app, find your airport, and show the digital pass at the lounge entrance." },
    { q: "How many lounges and fast-track accesses does the Voltey Ultra plan include?", a: "Ultra includes unlimited lounge visits and up to 12 fast-track accesses per year in participating airports." },
  ],
};

export default function UltraPlanPage() {
  const [cms, setCms] = useState(DEFAULT);

  useEffect(() => {
    fetch(`${API}/api/content/product-ultra-plan`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setCms({ ...DEFAULT, ...d }); })
      .catch(() => {});
  }, []);

  return (
    <div style={{ fontFamily: "Poppins, sans-serif" }}>

      {/* ── DARK HERO ── */}
      <section style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #111827 60%, #0a0a0a 100%)" }}>
        <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 max-w-xl">
            <h1 className="font-black text-white leading-tight mb-5" style={{ fontSize: "clamp(30px,4.5vw,54px)" }}>
              {cms.hero.title}
            </h1>
            <p className="text-white/60 text-[15px] leading-relaxed mb-8">{cms.hero.subtitle}</p>
            <Link href={`${BASE}/destinations`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-[15px] font-bold"
              style={{ background: "#0da976", color: "white", boxShadow: "0 8px 24px rgba(13,169,118,0.4)" }}>
              Get Ultra Plan <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80"
                alt="Ultra plan"
                className="rounded-3xl object-cover"
                style={{ width: 400, height: 340, filter: "brightness(0.8)" }}
              />
              {/* Ultra badge */}
              <div className="absolute top-5 left-5 rounded-2xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <div className="flex items-center gap-2">
                  <LottieIcon src="/icons/lottie/magic-star.json" size={20} autoplay loop />
                  <span className="text-white font-black text-[15px]">Voltey Ultra</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full ml-1" style={{ background: "#0da976", color: "white" }}>PREMIUM</span>
                </div>
              </div>
              {/* stats */}
              <div className="absolute bottom-5 right-5 rounded-2xl px-4 py-3 text-right"
                style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <p className="text-white/50 text-[11px]">Data used</p>
                <p className="text-white font-black text-[20px]">Unlimited</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT IS ULTRA ── */}
      <section style={{ background: "#111" }} className="py-16 px-6">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          {/* mockup card */}
          <div className="flex-1 flex justify-center">
            <div className="rounded-3xl p-7" style={{ background: "#1a1a1a", width: 320 }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#0da976" }}>
                  <LottieIcon src="/icons/lottie/magic-star.json" size={22} autoplay loop />
                </div>
                <div>
                  <p className="text-white font-black text-[16px]">Voltey Ultra</p>
                  <p className="text-[11px] font-bold px-2 py-0.5 rounded-full inline-block" style={{ background: "#0da976", color: "white" }}>ACTIVE</p>
                </div>
              </div>
              {[
                { label: "Data", value: "Unlimited" },
                { label: "Lounges", value: "1,000+ airports" },
                { label: "Fast-track", value: "Included" },
                { label: "Flight insurance", value: "Included" },
                { label: "Security tools", value: "All included" },
              ].map((row, i) => (
                <div key={i} className="flex justify-between py-2.5 border-b border-white/10 last:border-0">
                  <span className="text-white/50 text-[13px]">{row.label}</span>
                  <span className="text-white font-bold text-[13px]">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 max-w-xl">
            <h2 className="font-black text-white mb-4" style={{ fontSize: "clamp(22px,3vw,34px)" }}>
              {cms.whatTitle}
            </h2>
            <p className="text-white/60 text-[15px] leading-relaxed">{cms.whatDesc}</p>
          </div>
        </div>
      </section>

      {/* ── PERKS ── */}
      <section style={{ background: "#0d0d0d" }} className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-black text-white mb-2 text-center" style={{ fontSize: "clamp(22px,3vw,34px)" }}>
            Travel smarter with exclusive perks
          </h2>
          <p className="text-center text-white/40 text-[14px] mb-10">Unlock access to benefits designed to elevate every trip.</p>
          <div className="grid sm:grid-cols-2 gap-5">
            {cms.perks.map((perk, i) => (
              <div key={i} className="rounded-2xl p-6 flex gap-4 items-start hover:border hover:border-white/20 transition-all"
                style={{ background: "#1a1a1a" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#252525" }}>
                  <LottieIcon src={perk.icon} size={28} autoplay loop />
                </div>
                <div>
                  <h3 className="font-bold text-white text-[15px] mb-1.5">{perk.title}</h3>
                  <p className="text-[13px] text-white/50 leading-relaxed">{perk.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE ── */}
      <section style={{ background: "#111" }} className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-black text-white mb-2 text-center" style={{ fontSize: "clamp(22px,3vw,34px)" }}>
            Why choose the Voltey Ultra plan?
          </h2>
          <p className="text-center text-white/40 text-[14px] mb-10">Voltey Ultra offers more than three times the value — it simplifies every journey.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cms.whyItems.map((item, i) => (
              <div key={i} className="rounded-2xl p-6" style={{ background: "#1a1a1a" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "#252525" }}>
                  <LottieIcon src={item.icon} size={22} autoplay loop />
                </div>
                <h3 className="font-bold text-white text-[14.5px] mb-1.5">{item.title}</h3>
                <p className="text-[13px] text-white/50 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ (dark) ── */}
      <section style={{ background: "#0a0a0a" }} className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-black text-white mb-2 text-center" style={{ fontSize: "clamp(22px,3vw,34px)" }}>
            Frequently asked questions about monthly plans
          </h2>
          <p className="text-center text-white/40 text-[14px] mb-10">Everything you need to know.</p>
          <DarkFaq items={cms.faqs} />
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative overflow-hidden py-20 px-6 text-center"
        style={{ background: "linear-gradient(135deg, #0c1a0c 0%, #0a1f0a 50%, #0d0d0d 100%)" }}>
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #0da976 0%, transparent 70%)" }} />
        <div className="relative z-10">
          <h2 className="font-black text-white mb-3" style={{ fontSize: "clamp(24px,3.5vw,42px)" }}>
            Voltey Ultra: One plan, all the perks
          </h2>
          <p className="text-white/60 text-[15px] mb-8">Everything a frequent traveler needs — bundled together, always on.</p>
          <Link href={`${BASE}/destinations`}
            className="inline-flex items-center gap-2 px-9 py-4 rounded-full text-[16px] font-bold"
            style={{ background: "#0da976", color: "white", boxShadow: "0 8px 32px rgba(13,169,118,0.45)" }}>
            Get Ultra Plan <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

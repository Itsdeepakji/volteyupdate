import { useState, useEffect } from "react";
import { Link } from "wouter";
import { LottieIcon } from "@/components/LottieIcon";
import { Check, ChevronDown, ChevronUp, ArrowRight, Quote } from "lucide-react";

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
    title: "eSIM for business: manage team's plans in one dashboard",
    bullets: [
      "Buy and manage eSIM data plans from one easy-to-use dashboard.",
      "Assign plans, track usage, and update your team members wherever they go.",
      "Automatic invoices",
      "Pricing tailored to your business needs",
      "Flexible plans for every trip",
    ],
  },
  quote: {
    text: "At Voltey, we're always looking to support travelers as they plan their next trip and recognize that staying connected is one of the necessities of being on the road. That's why we recommend Voltey as our eSIM partner. Voltey is an affordable, easy-to-use, and sustainable eSIM service that gives reliable mobile and internet connections from anywhere in the world.",
    author: "Lonely Planet",
    authorHref: "https://lonelyplanet.com",
  },
  whyFeatures: [
    { icon: "/icons/lottie/award.json",    title: "Voltey credits",           desc: "Earn and use credits for future purchases for your whole team." },
    { icon: "/icons/simcard.json",          title: "Custom plans",             desc: "Get custom pricing delivered to your company, team, and business and team travel needs." },
    { icon: "/icons/card.json",             title: "Automated invoices",       desc: "Get invoices automatically via email, simplifying tracking and compliance reporting." },
    { icon: "/icons/security-card.json",    title: "Web protection",           desc: "Keep your team safe from malicious websites, phishing links, and privacy trackers." },
    { icon: "/icons/chart.json",            title: "Personalized pricing",     desc: "Get pricing tailored to your business size and optimize costs based on your growth needs." },
    { icon: "/icons/global.json",           title: "Flexible plan management", desc: "Assign the right plan to each team member at the right time — complete control." },
  ],
  dashboardSteps: [
    { icon: "/icons/people.json",   title: "Add team members",       desc: "Invite your organization and assign plans and data budgets in seconds." },
    { icon: "/icons/simcard.json",  title: "Purchase plans quickly", desc: "Choose country, select plan size and inventory, and buy — all in one step." },
    { icon: "/icons/chart.json",    title: "Monitor data usage",     desc: "See each team member's data usage across all plans in your account dashboard." },
  ],
  productFamily: [
    { name: "Voltey VPN",      color: "#5c5cff", desc: "Secure your team's browsing" },
    { name: "Voltey Pass",     color: "#0da976", desc: "Password manager for teams" },
    { name: "Voltey Vault",    color: "#f59e0b", desc: "Encrypted cloud storage" },
    { name: "Voltey Shield",   color: "#ef4444", desc: "Advanced threat protection" },
  ],
  faqs: [
    { q: "What is the difference between an eSIM and a SIM card for business?",  a: "An eSIM is a digital SIM that doesn't need a physical card. Your team can buy and activate data plans instantly via the Voltey app, with no logistics, no shipping, and no hardware needed." },
    { q: "What countries does the Voltey business eSIM app cover?",              a: "Voltey Business covers all 190+ countries available on the platform, with the same pricing and coverage as consumer plans plus volume discounts." },
    { q: "How do I use an eSIM for business?",                                   a: "Sign up for a Voltey Business account, add team members, and assign plans. Each team member installs their eSIM via QR code — the whole process takes under 3 minutes." },
    { q: "How can I add more data to my business eSIM plan?",                    a: "From the Voltey Business dashboard, select the team member, click 'Top Up', choose the plan, and it's active instantly. No action required from the employee." },
    { q: "Can I share data through a hotspot?",                                  a: "Yes. Team members with Voltey eSIM plans can share data via hotspot to their other devices or colleagues using the same network." },
    { q: "Can I use SIM and eSIM cards simultaneously?",                          a: "Yes. Voltey eSIM works alongside a physical SIM in dual-SIM devices. Employees can keep their work number on the physical SIM and use Voltey eSIM for data." },
  ],
};

export default function BusinessPage() {
  const [cms, setCms] = useState(DEFAULT);

  useEffect(() => {
    fetch(`${API}/api/content/product-esim-business`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setCms({ ...DEFAULT, ...d }); })
      .catch(() => {});
  }, []);

  return (
    <div style={{ fontFamily: "Poppins, sans-serif" }}>

      {/* ── HERO ── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-14 lg:py-20 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 max-w-xl">
            <h1 className="font-black text-gray-900 leading-tight mb-6" style={{ fontSize: "clamp(26px,3.5vw,44px)" }}>
              {cms.hero.title}
            </h1>
            <ul className="space-y-2.5 mb-8">
              {cms.hero.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[14px] text-gray-600">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#0da976" }} />
                  {b}
                </li>
              ))}
            </ul>
            <Link href={`${BASE}/destinations`}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-[14px] font-bold text-white"
              style={{ background: "#0da976" }}>
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80"
                alt="Business team"
                className="rounded-3xl shadow-2xl object-cover"
                style={{ width: 420, height: 340 }}
              />
              {/* Team count badge */}
              <div className="absolute top-5 right-5 bg-white rounded-2xl shadow-xl px-4 py-3">
                <p className="text-[11px] text-gray-400">Team plans</p>
                <p className="text-[20px] font-black" style={{ color: "#0da976" }}>200+</p>
                <p className="text-[11px] text-gray-400">managed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUOTE ── */}
      <section className="py-14 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto border-l-4 pl-8 py-2" style={{ borderColor: "#0da976" }}>
          <p className="text-[16px] text-gray-700 italic leading-relaxed mb-4">
            "{cms.quote.text}"
          </p>
          <a href={cms.quote.authorHref} target="_blank" rel="noopener noreferrer"
            className="font-bold text-[14px] hover:underline" style={{ color: "#0da976" }}>
            {cms.quote.author}
          </a>
        </div>
      </section>

      {/* ── WHY BUSINESSES ── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-black text-gray-900 mb-2 text-center" style={{ fontSize: "clamp(22px,3vw,34px)" }}>
            Why businesses choose Voltey
          </h2>
          <p className="text-center text-gray-400 text-[14px] mb-10">Enterprise features built for growing teams.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cms.whyFeatures.map((feat, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 p-6 hover:shadow-xl transition-all group">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" style={{ background: "#f0fdf9" }}>
                  <LottieIcon src={feat.icon} size={28} autoplay loop />
                </div>
                <h3 className="font-bold text-gray-900 text-[15px] mb-2">{feat.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GET STARTED STEPS ── */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-black text-gray-900 mb-2 text-center" style={{ fontSize: "clamp(22px,3vw,34px)" }}>
            Get started with your Voltey business dashboard
          </h2>
          <p className="text-center text-gray-400 text-[14px] mb-10">
            The Voltey access dashboard gives your company full control over team connectivity, from managing team members to assigning and managing plans across any destination.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {cms.dashboardSteps.map((step, i) => (
              <div key={i} className="rounded-2xl bg-white border border-gray-100 p-7 text-center shadow-sm">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#f0fdf9" }}>
                  <LottieIcon src={step.icon} size={32} autoplay loop />
                </div>
                <p className="text-[12px] font-black text-gray-300 mb-1">STEP {i + 1}</p>
                <h3 className="font-bold text-gray-900 text-[15px] mb-2">{step.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCT FAMILY ── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-black text-gray-900 mb-2 text-center" style={{ fontSize: "clamp(22px,3vw,34px)" }}>
            Our product family
          </h2>
          <p className="text-center text-gray-400 text-[14px] mb-10">Pair Voltey eSIM with our other business tools.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cms.productFamily.map((prod, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: prod.color }}>
                  <LottieIcon src="/icons/global.json" size={22} autoplay loop />
                </div>
                <p className="font-bold text-gray-900 text-[14px] mb-1">{prod.name}</p>
                <p className="text-[12px] text-gray-400 mb-4">{prod.desc}</p>
                <button className="text-[12.5px] font-bold border border-gray-200 px-4 py-1.5 rounded-full hover:border-gray-400 transition-all text-gray-600">
                  Visit Product Page
                </button>
              </div>
            ))}
          </div>
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

      {/* ── CTA BANNER ── */}
      <section className="relative overflow-hidden py-20 px-6 text-center">
        <img
          src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1400&q=70"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.25)" }}
        />
        <div className="relative z-10">
          <h2 className="font-black text-white mb-3" style={{ fontSize: "clamp(24px,3.5vw,42px)" }}>
            Ready to get your team connected?
          </h2>
          <p className="text-white/70 text-[15px] mb-8">Log in or sign up to use the Voltey business dashboard.</p>
          <Link href={`${BASE}/destinations`}
            className="inline-flex items-center gap-2 px-9 py-4 rounded-full text-[15px] font-bold text-white"
            style={{ background: "#0da976", boxShadow: "0 8px 24px rgba(13,169,118,0.4)" }}>
            Get Started <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

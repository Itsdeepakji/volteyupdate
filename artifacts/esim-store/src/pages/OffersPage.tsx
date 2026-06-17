import { useState } from "react";
import { Link, useParams } from "wouter";
import { LottieIcon } from "@/components/LottieIcon";
import { ArrowRight, Copy, Check, Tag } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

/* ─── Coupon copy helper ─── */
function CouponCard({ code, discount, desc }: { code: string; discount: string; desc: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-2xl border-2 border-dashed p-5 flex items-center justify-between gap-4"
      style={{ borderColor: "#0da976", background: "#f0fdf9" }}>
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{desc}</p>
        <p className="font-black text-[22px]" style={{ color: "#0da976" }}>{discount}</p>
        <p className="text-[13px] text-gray-500">Use code: <span className="font-bold text-gray-800">{code}</span></p>
      </div>
      <button onClick={copy}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all"
        style={{ background: copied ? "#6b7280" : "#0da976" }}>
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

type PageConfig = {
  badge: string;
  title: string;
  subtitle: string;
  heroImg: string;
  heroBg: string;
  icon: string;
  cta: string;
  ctaHref: string;
  body:
    | { type: "steps"; steps: { num: string; title: string; desc: string }[] }
    | { type: "cards"; items: { icon: string; title: string; desc: string }[] }
    | { type: "coupons"; codes: { code: string; discount: string; desc: string }[] }
    | { type: "tiers"; tiers: { name: string; pct: string; who: string; perks: string[] }[] };
};

const PAGES: Record<string, PageConfig> = {
  "refer": {
    badge: "Earn Rewards",
    title: "Refer a Friend & Earn",
    subtitle: "Share Voltey with friends and earn up to US$50 in gift cards plus US$50 in Voltey credits for every successful referral. No limit!",
    heroImg: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
    heroBg: "#f0fdf9",
    icon: "/icons/user-add.json",
    body: {
      type: "steps",
      steps: [
        { num: "01", title: "Get Your Referral Link",   desc: "Log into your Voltey account and copy your personal referral link from the Rewards tab." },
        { num: "02", title: "Share with Friends",       desc: "Send your link via WhatsApp, email, social media, or anywhere else your friends will see it." },
        { num: "03", title: "They Buy Their First Plan", desc: "Your friend signs up and purchases their first Voltey eSIM plan using your link." },
        { num: "04", title: "Both of You Earn",         desc: "You get up to US$50 in gift cards + US$50 in Voltey credits. Your friend gets 15% off their first plan." },
      ],
    },
    cta: "Start Referring",
    ctaHref: "/destinations",
  },
  "student": {
    badge: "Student Offer",
    title: "Student Discount",
    subtitle: "Students get an exclusive 20% discount on all Voltey eSIM plans. Verify your status once, save every time you travel.",
    heroImg: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80",
    heroBg: "#fef9f2",
    icon: "/icons/lottie/discount circle.json",
    body: {
      type: "tiers",
      tiers: [
        {
          name: "Student Saver",
          pct: "20% OFF",
          who: "All verified students",
          perks: [
            "20% off every eSIM plan",
            "Free data top-ups during exam season",
            "Access to student-exclusive global plans",
            "No minimum purchase required",
          ],
        },
        {
          name: "Campus Ambassador",
          pct: "30% OFF",
          who: "Voltey Campus Ambassadors",
          perks: [
            "30% off all plans + 25% affiliate commission",
            "Free Ultra Plan for your semester abroad",
            "Exclusive ambassador swag & branded kit",
            "Invite-only ambassador community",
          ],
        },
      ],
    },
    cta: "Verify Student Status",
    ctaHref: "/destinations",
  },
  "nonprofit": {
    badge: "Non-Profit",
    title: "Voltey for Nonprofit",
    subtitle: "Qualifying nonprofit organizations get discounted eSIM plans to help their teams and volunteers stay connected anywhere in the world.",
    heroImg: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80",
    heroBg: "#edeef8",
    icon: "/icons/lottie/heart.json",
    body: {
      type: "cards",
      items: [
        { icon: "/icons/lottie/heart.json",    title: "Up to 40% Discount",     desc: "Qualifying nonprofits receive 40% off all data plans — for your whole team, every trip." },
        { icon: "/icons/people.json",           title: "Team Management",        desc: "Manage all staff and volunteer eSIMs from one simple admin dashboard." },
        { icon: "/icons/lottie/award.json",     title: "Fast Verification",      desc: "Submit your nonprofit documents and receive approval within 48 hours." },
        { icon: "/icons/global.json",           title: "190+ Countries",         desc: "Send volunteers anywhere in the world — they'll have coverage wherever they go." },
        { icon: "/icons/security-card.json",    title: "Invoiced Billing",       desc: "Receive monthly invoices for easy budget tracking and grant reporting." },
        { icon: "/icons/lottie/call.json",      title: "Dedicated Support",      desc: "Your team gets a dedicated account manager and priority 24/7 support." },
      ],
    },
    cta: "Apply for Nonprofit Rate",
    ctaHref: "/destinations",
  },
  "vouchers": {
    badge: "Gift",
    title: "Voltey Gift Vouchers",
    subtitle: "Give the gift of connectivity. Voltey vouchers can be redeemed on any data plan within 12 months — the perfect travel gift.",
    heroImg: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=800&q=80",
    heroBg: "#f0fdf9",
    icon: "/icons/ticket.json",
    body: {
      type: "cards",
      items: [
        { icon: "/icons/ticket.json",          title: "Available in Any Amount",  desc: "Purchase vouchers from US$5 to US$500. Custom amounts accepted for businesses." },
        { icon: "/icons/message.json",          title: "Instant Digital Delivery", desc: "Vouchers are delivered by email instantly — no shipping costs or delays." },
        { icon: "/icons/global.json",           title: "Valid for 12 Months",     desc: "Recipients have 12 months from the issue date to redeem their voucher." },
        { icon: "/icons/simcard.json",          title: "Works on Any Plan",       desc: "Redeem toward any Voltey eSIM plan for any destination worldwide." },
        { icon: "/icons/lottie/award.json",     title: "Personalized Message",    desc: "Add a custom note to make your gift extra special." },
        { icon: "/icons/security-card.json",    title: "Secure Redemption",       desc: "Unique voucher codes are verified at checkout — no fraud risk." },
      ],
    },
    cta: "Buy a Voucher",
    ctaHref: "/destinations",
  },
  "coupons": {
    badge: "Save More",
    title: "Voltey Coupons & Deals",
    subtitle: "Get the best prices on Voltey eSIM plans. Use these exclusive coupon codes at checkout to save on your next trip.",
    heroImg: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
    heroBg: "#fef9f2",
    icon: "/icons/tag.json",
    body: {
      type: "coupons",
      codes: [
        { code: "VOLT15",    discount: "15% OFF",  desc: "All plans — first order" },
        { code: "SUMMER26",  discount: "20% OFF",  desc: "Summer travel plans" },
        { code: "EURO2026",  discount: "25% OFF",  desc: "European destinations" },
        { code: "Asia10",    discount: "10% OFF",  desc: "Asia-Pacific plans" },
        { code: "ULTRA30",   discount: "30% OFF",  desc: "Voltey Ultra Plan only" },
        { code: "REFER50",   discount: "US$5 OFF", desc: "Any plan, referral bonus" },
      ],
    },
    cta: "Shop Plans",
    ctaHref: "/destinations",
  },
  "tournament": {
    badge: "Limited Offer",
    title: "Tournament eSIM Deal",
    subtitle: "Traveling to see your team play? Get special discounted eSIM data plans for host-country travel during major sporting events and tournaments.",
    heroImg: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80",
    heroBg: "#f0f9ff",
    icon: "/icons/lottie/crown.json",
    body: {
      type: "cards",
      items: [
        { icon: "/icons/lottie/crown.json",    title: "Up to 35% Off",          desc: "Tournament-edition plans are priced up to 35% cheaper than standard plans for the same destination." },
        { icon: "/icons/wifi.json",             title: "High-Speed Guaranteed",  desc: "Tournament plans prioritize speed at stadiums, fan zones, and event venues." },
        { icon: "/icons/notification.json",     title: "Match Alerts",           desc: "Optional score and schedule notifications delivered straight to your Voltey app." },
        { icon: "/icons/map.json",              title: "Venue Maps Included",    desc: "Download offline venue and city maps for the tournament host city." },
        { icon: "/icons/lottie/call.json",      title: "Group Plans",            desc: "Buy plans for your whole travel party at once — group discounts apply." },
        { icon: "/icons/simcard.json",          title: "Limited Availability",   desc: "Tournament deals are only available for a limited time. Grab yours before kickoff!" },
      ],
    },
    cta: "Get Tournament Deal",
    ctaHref: "/destinations",
  },
};

export default function OffersPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "refer";
  const page = PAGES[slug];

  if (!page) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-2xl font-bold text-gray-800">Page not found</p>
        <Link href={`${BASE}/`} className="text-green-600 underline">Back to Home</Link>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Poppins, sans-serif" }}>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ background: page.heroBg }}>
        <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 max-w-xl">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5 border"
              style={{ borderColor: "#0da976", background: "rgba(13,169,118,0.08)" }}
            >
              <LottieIcon src={page.icon} size={18} autoplay loop />
              <span className="text-[12px] font-bold" style={{ color: "#0da976" }}>{page.badge}</span>
            </div>
            <h1 className="font-black text-gray-900 leading-tight mb-4" style={{ fontSize: "clamp(28px,4vw,46px)" }}>
              {page.title}
            </h1>
            <p className="text-[16px] text-gray-500 leading-relaxed mb-8">{page.subtitle}</p>
            <Link
              href={`${BASE}${page.ctaHref}`}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-[15px] font-bold text-white"
              style={{ background: "#0da976", boxShadow: "0 8px 24px rgba(13,169,118,0.3)" }}
            >
              {page.cta} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex-1 hidden lg:block">
            <img
              src={page.heroImg}
              alt={page.title}
              className="w-full max-w-md ml-auto rounded-3xl shadow-2xl object-cover"
              style={{ height: 340 }}
            />
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          {page.body.type === "steps" && (
            <div className="max-w-3xl mx-auto space-y-6">
              {page.body.steps.map((step, i) => (
                <div key={i} className="flex gap-6 items-start p-6 rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all">
                  <span className="text-[28px] font-black shrink-0" style={{ color: "#0da976", opacity: 0.5 }}>{step.num}</span>
                  <div>
                    <h3 className="font-bold text-gray-900 text-[16px] mb-1.5">{step.title}</h3>
                    <p className="text-[14px] text-gray-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {page.body.type === "cards" && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {page.body.items.map((item, i) => (
                <div key={i} className="rounded-2xl p-6 border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "#f0fdf9" }}>
                    <LottieIcon src={item.icon} size={26} autoplay loop />
                  </div>
                  <h3 className="font-bold text-gray-900 text-[15px] mb-1.5">{item.title}</h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          )}

          {page.body.type === "coupons" && (
            <div className="max-w-2xl mx-auto">
              <h2 className="font-black text-gray-900 text-center mb-2" style={{ fontSize: "clamp(22px,3vw,32px)" }}>
                Active Coupon Codes
              </h2>
              <p className="text-center text-[14px] text-gray-400 mb-8">Copy a code and paste it at checkout. Terms apply.</p>
              <div className="space-y-4">
                {page.body.codes.map((c, i) => (
                  <CouponCard key={i} code={c.code} discount={c.discount} desc={c.desc} />
                ))}
              </div>
              <p className="mt-6 text-center text-[12.5px] text-gray-400">
                Codes are valid for a limited time. One code per order. Cannot be combined with other offers.
              </p>
            </div>
          )}

          {page.body.type === "tiers" && (
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {page.body.tiers.map((tier, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-7 border-2 flex flex-col"
                  style={{
                    borderColor: i === 0 ? "#0da976" : "#f59e0b",
                    background: i === 0 ? "#f0fdf9" : "#fffbeb",
                  }}
                >
                  <p className="font-bold text-[12px] uppercase tracking-widest text-gray-400 mb-1">{tier.who}</p>
                  <p className="font-black text-[32px] leading-none mb-1" style={{ color: i === 0 ? "#0da976" : "#f59e0b" }}>
                    {tier.pct}
                  </p>
                  <p className="font-bold text-gray-900 text-[17px] mb-4">{tier.name}</p>
                  <ul className="space-y-2 flex-1">
                    {tier.perks.map((p, j) => (
                      <li key={j} className="flex items-start gap-2 text-[13.5px] text-gray-700">
                        <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: i === 0 ? "#0da976" : "#f59e0b" }} />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`${BASE}/destinations`}
                    className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-[14px] font-bold text-white"
                    style={{ background: i === 0 ? "#0da976" : "#f59e0b" }}
                  >
                    Get Started <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-16 px-6 text-center" style={{ background: "linear-gradient(135deg, #0da976 0%, #0bc285 100%)" }}>
        <h2 className="font-black text-white mb-3" style={{ fontSize: "clamp(22px,3vw,36px)" }}>
          Ready to save on your next trip?
        </h2>
        <p className="text-white/80 text-[15px] mb-8">Browse plans and apply your discount at checkout.</p>
        <Link
          href={`${BASE}/destinations`}
          className="inline-flex items-center gap-2 px-9 py-4 rounded-full text-[16px] font-bold bg-white hover:bg-gray-50 transition-all"
          style={{ color: "#0da976", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
        >
          Browse All Plans <ArrowRight className="w-5 h-5" />
        </Link>
      </section>
    </div>
  );
}

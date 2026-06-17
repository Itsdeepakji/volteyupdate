import { useState } from "react";
import { Link, useParams } from "wouter";
import { LottieIcon } from "@/components/LottieIcon";
import { ArrowRight, ChevronDown, ChevronUp, Search } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

/* ─── Accordion ─── */
function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {items.map((item, i) => (
        <div key={i}
          className="rounded-2xl border overflow-hidden transition-all"
          style={{ borderColor: open === i ? "#0da976" : "#e5e7eb" }}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-4 text-left"
            style={{ background: open === i ? "#f0fdf9" : "#fff" }}
          >
            <span className="font-bold text-gray-900 text-[14.5px] pr-4">{item.q}</span>
            {open === i
              ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: "#0da976" }} />
              : <ChevronDown className="w-4 h-4 shrink-0 text-gray-400" />}
          </button>
          {open === i && (
            <div className="px-6 pb-5 text-[14px] text-gray-500 leading-relaxed" style={{ background: "#f0fdf9" }}>
              {item.a}
            </div>
          )}
        </div>
      ))}
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
    | { type: "steps"; steps: { num: string; title: string; desc: string; icon: string }[] }
    | { type: "cards"; items: { icon: string; title: string; desc: string; href?: string }[] }
    | { type: "faq";   faqs: { q: string; a: string }[] }
    | { type: "troubleshoot"; issues: { title: string; steps: string[] }[] };
};

const PAGES: Record<string, PageConfig> = {
  "getting-started": {
    badge: "Beginner Guide",
    title: "Getting Started with Voltey",
    subtitle: "New to Voltey? Here's everything you need to know to get your first eSIM activated and connected in under 5 minutes.",
    heroImg: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80",
    heroBg: "#f0fdf9",
    icon: "/icons/category.json",
    cta: "Browse Plans",
    ctaHref: "/destinations",
    body: {
      type: "steps",
      steps: [
        { num: "01", icon: "/icons/simcard.json",       title: "Check Your Device",           desc: "Make sure your phone supports eSIM. Go to Settings → General → About and look for 'eSIM' or 'Available SIM'. Most iPhones from XS onward and Android flagships from 2020 are compatible." },
        { num: "02", icon: "/icons/global.json",         title: "Choose Your Destination",     desc: "Browse Voltey's 190+ destinations and select the country (or region) you're traveling to. Pick your plan size based on your trip length and data needs." },
        { num: "03", icon: "/icons/card.json",           title: "Complete Your Purchase",       desc: "Checkout securely with your credit card, PayPal, or Apple/Google Pay. You'll receive a QR code by email immediately after payment." },
        { num: "04", icon: "/icons/notification.json",   title: "Install the eSIM",            desc: "Open your QR code email and scan it in Settings → Mobile Data → Add eSIM. The entire process takes under 60 seconds." },
        { num: "05", icon: "/icons/wifi.json",           title: "Activate on Arrival",         desc: "When you land at your destination, your Voltey eSIM activates automatically. Switch to it in your phone settings and start browsing instantly." },
        { num: "06", icon: "/icons/chart.json",          title: "Monitor Your Usage",          desc: "Check your remaining data anytime in the Voltey app. Get notified when you've used 80% of your plan so you never run out unexpectedly." },
      ],
    },
  },
  "center": {
    badge: "Help Center",
    title: "Voltey Help Center",
    subtitle: "Browse help articles, video guides, and support resources. Find answers to the most common questions about using Voltey.",
    heroImg: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80",
    heroBg: "#edeef8",
    icon: "/icons/lottie/book.json",
    cta: "Contact Support",
    ctaHref: "/help/troubleshooting",
    body: {
      type: "cards",
      items: [
        { icon: "/icons/simcard.json",         title: "Installing Your eSIM",          desc: "Step-by-step guides for iOS and Android. Includes video walkthroughs.", href: "/help/getting-started" },
        { icon: "/icons/global.json",           title: "Supported Countries",           desc: "Full list of all 190+ destinations where Voltey eSIM plans are available." },
        { icon: "/icons/card.json",             title: "Billing & Payments",            desc: "Questions about charges, invoices, refunds, and payment methods." },
        { icon: "/icons/wifi.json",             title: "Connectivity Issues",           desc: "Troubleshoot slow speeds, no signal, or eSIM not activating.", href: "/help/troubleshooting" },
        { icon: "/icons/lottie/call.json",      title: "Phone Number Feature",          desc: "How to set up and use your Voltey local phone number.", href: "/product/phone-number" },
        { icon: "/icons/security-card.json",    title: "Account & Privacy",             desc: "Manage your account settings, password reset, and data privacy options." },
        { icon: "/icons/notification.json",     title: "Data Usage & Top-ups",          desc: "Understand your usage, set alerts, and add more data mid-trip." },
        { icon: "/icons/chart.json",            title: "eSIM Compatibility",            desc: "Check if your device supports eSIM and get a list of compatible models.", href: "/product/compatibility" },
        { icon: "/icons/lottie/award.json",     title: "Voltey Rewards",               desc: "How to earn and redeem Voltey reward points and referral credits." },
      ],
    },
  },
  "troubleshooting": {
    badge: "Fix Issues",
    title: "Troubleshooting",
    subtitle: "Something not working? Follow these step-by-step fixes for the most common Voltey eSIM issues.",
    heroImg: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&q=80",
    heroBg: "#fef9f2",
    icon: "/icons/setting.json",
    cta: "Contact Support",
    ctaHref: "/help/center",
    body: {
      type: "troubleshoot",
      issues: [
        {
          title: "eSIM not activating after installation",
          steps: [
            "Restart your device after scanning the QR code.",
            "Go to Settings → Mobile Data (or Cellular) and confirm the Voltey plan is selected as your data line.",
            "Make sure 'Data Roaming' is enabled for the Voltey eSIM line.",
            "Wait up to 15 minutes in your destination country — activation can take a moment.",
            "If still not working, contact Voltey support from the app — we'll activate it manually.",
          ],
        },
        {
          title: "QR code not scanning",
          steps: [
            "Make sure you have a stable Wi-Fi connection before scanning — you cannot scan an eSIM QR code using cellular data.",
            "Increase the screen brightness of the device showing the QR code.",
            "Hold your camera steady at 15–30 cm from the code.",
            "Try entering the activation code manually: go to Settings → eSIM → Enter Code Manually.",
            "Download the QR code image and zoom in if the email preview is too small.",
          ],
        },
        {
          title: "Slow data speeds",
          steps: [
            "Confirm you're in a 4G/5G coverage area for the destination carrier.",
            "Toggle Airplane Mode on and off to refresh the network connection.",
            "Go to Settings → Mobile Data → Network Selection and choose your carrier manually.",
            "Check your remaining data in the Voltey app — you may have used your allowance.",
            "Try restarting your device and reconnecting.",
          ],
        },
        {
          title: "eSIM disappeared from my phone",
          steps: [
            "Go to Settings → Mobile Data → eSIM — your plan may still be stored but not active.",
            "Do NOT perform a factory reset — this deletes eSIMs permanently.",
            "If you transferred to a new iPhone via iCloud, eSIMs are not transferred. Contact Voltey support for a re-issue.",
            "Contact support with your order number and we'll re-provision your eSIM at no charge.",
          ],
        },
        {
          title: "Can't receive calls or SMS",
          steps: [
            "Confirm your Voltey Phone Number subscription is active in the app.",
            "Check that Call Forwarding is not enabled to another number.",
            "Toggle the Voltey eSIM line off and back on in Settings → Mobile Data.",
            "Check you have at least some data balance — SMS delivery requires a data connection.",
            "Contact support if calls/SMS still fail after these steps.",
          ],
        },
      ],
    },
  },
  "faq": {
    badge: "FAQ",
    title: "Frequently Asked Questions",
    subtitle: "Quick answers to the most common questions about Voltey eSIM plans, pricing, compatibility, and more.",
    heroImg: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
    heroBg: "#f0f9ff",
    icon: "/icons/message.json",
    cta: "Browse Plans",
    ctaHref: "/destinations",
    body: {
      type: "faq",
      faqs: [
        { q: "What is an eSIM?",                           a: "An eSIM is a digital SIM card embedded in your phone. It lets you activate a mobile data plan without a physical SIM card — just scan a QR code and you're connected." },
        { q: "Does my phone support eSIM?",                a: "Most modern smartphones do. iPhones from XS onward, Samsung Galaxy S20+, Google Pixel 3+, and most Android flagships from 2020 all support eSIM. Check in Settings → General → About on iPhone or Settings → Network on Android." },
        { q: "How quickly does my eSIM activate?",         a: "Instantly in most cases. After scanning the QR code, your eSIM is ready within minutes. Simply turn on the Voltey data line when you arrive at your destination." },
        { q: "Can I use Voltey eSIM and my regular SIM?",  a: "Yes! Your phone can hold multiple eSIM profiles and use both a physical SIM and an eSIM simultaneously (Dual SIM). Use your home number for calls and Voltey eSIM for local data." },
        { q: "What happens when my data runs out?",        a: "You'll receive a notification at 80% usage. When your plan is used up, you can purchase a top-up from the Voltey app in seconds — no need to buy a new eSIM." },
        { q: "Can I get a refund?",                        a: "Yes. If your eSIM hasn't been activated, you can request a full refund within 7 days of purchase. Contact our support team and we'll process it within 24 hours." },
        { q: "Will my plan work in multiple countries?",   a: "Yes! Regional and global plans are available. These cover multiple countries under a single data allowance. Country-specific plans only work in the listed destination." },
        { q: "Is there a data speed limit?",               a: "Voltey plans run at full 4G/5G speed. There is no artificial throttling. Speed depends on the local carrier network at your destination." },
        { q: "How do I share data as a hotspot?",          a: "Enable the Personal Hotspot feature on your phone while using the Voltey eSIM line. Data used by connected devices counts toward your plan allowance." },
        { q: "What payment methods do you accept?",        a: "We accept all major credit/debit cards, PayPal, Apple Pay, and Google Pay. Business accounts can pay by invoice (net-30 terms available)." },
        { q: "How do I install my eSIM on Android?",       a: "Go to Settings → Network & Internet → SIM cards → Add eSIM. Scan the QR code from your Voltey order email. Follow the on-screen prompts to complete activation." },
        { q: "Can I transfer my eSIM to a new phone?",     a: "eSIMs cannot typically be transferred between devices once activated. If you get a new phone, contact Voltey support and we'll re-issue your plan at no charge (one re-issue per plan)." },
      ],
    },
  },
};

export default function HelpPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "faq";
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
            <div className="flex flex-wrap gap-3">
              <Link
                href={`${BASE}${page.ctaHref}`}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-[15px] font-bold text-white"
                style={{ background: "#0da976", boxShadow: "0 8px 24px rgba(13,169,118,0.3)" }}
              >
                {page.cta} <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="mailto:support@voltey.com"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-[15px] font-bold border-2 border-gray-200 text-gray-700 hover:border-green-400 hover:text-green-600 transition-all"
              >
                <LottieIcon src="/icons/message.json" size={16} autoplay loop />
                Email Support
              </a>
            </div>
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
            <div className="max-w-3xl mx-auto space-y-5">
              <h2 className="font-black text-gray-900 text-center mb-8" style={{ fontSize: "clamp(22px,3vw,32px)" }}>
                How It Works — Step by Step
              </h2>
              {page.body.steps.map((step, i) => (
                <div key={i} className="flex gap-5 items-start p-6 rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all">
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#f0fdf9" }}>
                      <LottieIcon src={step.icon} size={22} autoplay loop />
                    </div>
                    <span className="text-[11px] font-black text-gray-300">{step.num}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-[15.5px] mb-1.5">{step.title}</h3>
                    <p className="text-[13.5px] text-gray-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {page.body.type === "cards" && (
            <div>
              <h2 className="font-black text-gray-900 text-center mb-2" style={{ fontSize: "clamp(22px,3vw,32px)" }}>
                Browse Help Topics
              </h2>
              <p className="text-center text-[14px] text-gray-400 mb-10">Select a category to find the help you need.</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {page.body.items.map((item, i) => (
                  <div key={i}
                    className="rounded-2xl p-6 border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => item.href && (window.location.href = `${BASE}${item.href}`)}
                  >
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "#f0fdf9" }}>
                      <LottieIcon src={item.icon} size={26} autoplay loop />
                    </div>
                    <h3 className="font-bold text-gray-900 text-[15px] mb-1.5">{item.title}</h3>
                    <p className="text-[13px] text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
              {/* Contact card */}
              <div className="mt-10 p-8 rounded-3xl text-center" style={{ background: "#f0fdf9", border: "2px solid #0da976" }}>
                <p className="font-bold text-gray-800 text-[16px] mb-2">Can't find what you need?</p>
                <p className="text-[14px] text-gray-500 mb-5">Our support team is available 24/7 — we typically respond in under 5 minutes.</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <a href="mailto:support@voltey.com"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-bold text-white"
                    style={{ background: "#0da976" }}>
                    <LottieIcon src="/icons/message.json" size={16} autoplay loop />
                    Email Support
                  </a>
                  <Link href={`${BASE}/help/troubleshooting`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-bold border-2 border-green-300 text-green-700 hover:bg-green-50 transition-all">
                    Troubleshooting Guide
                  </Link>
                </div>
              </div>
            </div>
          )}

          {page.body.type === "troubleshoot" && (
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="font-black text-gray-900 text-center mb-8" style={{ fontSize: "clamp(22px,3vw,32px)" }}>
                Common Issues & Fixes
              </h2>
              {page.body.issues.map((issue, i) => (
                <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 flex items-center gap-3" style={{ background: "#f9fafb" }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] font-bold shrink-0"
                      style={{ background: "#0da976" }}>{i + 1}</div>
                    <h3 className="font-bold text-gray-900 text-[15px]">{issue.title}</h3>
                  </div>
                  <ol className="p-6 space-y-3">
                    {issue.steps.map((step, j) => (
                      <li key={j} className="flex items-start gap-3 text-[13.5px] text-gray-600">
                        <span className="w-5 h-5 rounded-full bg-green-50 text-green-600 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {j + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
              <div className="mt-8 p-6 rounded-2xl text-center" style={{ background: "#f0fdf9", border: "2px solid #0da976" }}>
                <p className="font-bold text-gray-800 mb-2">Issue not listed?</p>
                <p className="text-[14px] text-gray-500 mb-4">Contact our 24/7 support team — we'll fix it with you in real time.</p>
                <a href="mailto:support@voltey.com"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-bold text-white"
                  style={{ background: "#0da976" }}>
                  Contact Support
                </a>
              </div>
            </div>
          )}

          {page.body.type === "faq" && (
            <div>
              <h2 className="font-black text-gray-900 text-center mb-2" style={{ fontSize: "clamp(22px,3vw,32px)" }}>
                Common Questions
              </h2>
              <p className="text-center text-[14px] text-gray-400 mb-10">Click a question to see the answer.</p>
              <Accordion items={page.body.faqs} />
              <div className="mt-10 p-8 rounded-3xl text-center" style={{ background: "#f0fdf9", border: "2px solid #0da976" }}>
                <p className="font-bold text-gray-800 text-[16px] mb-2">Still have a question?</p>
                <p className="text-[14px] text-gray-500 mb-5">Our support team is available 24/7.</p>
                <a href="mailto:support@voltey.com"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-bold text-white"
                  style={{ background: "#0da976" }}>
                  <LottieIcon src="/icons/message.json" size={16} autoplay loop />
                  Contact Support
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-16 px-6 text-center" style={{ background: "linear-gradient(135deg, #0da976 0%, #0bc285 100%)" }}>
        <h2 className="font-black text-white mb-3" style={{ fontSize: "clamp(22px,3vw,36px)" }}>
          Ready to get connected?
        </h2>
        <p className="text-white/80 text-[15px] mb-8">Choose your destination and get your eSIM in minutes.</p>
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

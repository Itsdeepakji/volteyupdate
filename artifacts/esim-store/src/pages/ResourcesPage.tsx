import { useState } from "react";
import { Link, useParams } from "wouter";
import { LottieIcon } from "@/components/LottieIcon";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type PageConfig = {
  badge: string;
  title: string;
  subtitle: string;
  heroImg: string;
  heroBg: string;
  icon: string;
  body?: { type: "cards"; items: { icon: string; title: string; desc: string }[] }
       | { type: "blog";  posts: { tag: string; title: string; date: string; desc: string; img: string }[] }
       | { type: "team";  members: { name: string; role: string; img: string }[] }
       | { type: "press"; logos: { name: string; quote: string }[] }
       | { type: "steps"; steps: { num: string; title: string; desc: string }[] }
       | { type: "jobs";  depts: { dept: string; roles: { title: string; location: string; type: string }[] }[] };
  cta: string;
  ctaHref: string;
};

const PAGES: Record<string, PageConfig> = {
  "what-is-esim": {
    badge: "Learn",
    title: "What is an eSIM?",
    subtitle: "An eSIM (embedded SIM) is a digital SIM card built directly into your device. No physical card needed — activate a data plan instantly, anywhere.",
    heroImg: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80",
    heroBg: "#f0fdf9",
    icon: "/icons/lottie/book open.json",
    body: {
      type: "steps",
      steps: [
        { num: "01", title: "Built into your device", desc: "Unlike a traditional SIM card, an eSIM is soldered directly onto your phone's motherboard. It cannot be removed or swapped physically." },
        { num: "02", title: "Activate plans digitally", desc: "You can activate a new mobile data plan completely digitally — no store visit, no physical SIM delivery. Just scan a QR code or tap a button in an app." },
        { num: "03", title: "Switch carriers instantly", desc: "Store multiple eSIM profiles and switch between carriers at any time from your phone settings. Perfect for frequent travelers." },
        { num: "04", title: "Works globally", desc: "Voltey eSIM plans cover 190+ destinations. Buy a plan before you fly and activate automatically when you land." },
      ],
    },
    cta: "Browse eSIM Plans",
    ctaHref: "/destinations",
  },
  "blog": {
    badge: "Blog",
    title: "Voltey Travel Blog",
    subtitle: "Tips, guides, and updates for savvy travelers. Stay informed about eSIM technology, destination guides, and connectivity tips.",
    heroImg: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
    heroBg: "#fef9f2",
    icon: "/icons/note-text.json",
    body: {
      type: "blog",
      posts: [
        { tag: "Guide", title: "How to Set Up Your eSIM on iPhone", date: "Jun 10, 2026", desc: "Step-by-step guide to installing and activating a Voltey eSIM on any iPhone XS or later.", img: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&q=80" },
        { tag: "Travel", title: "Best eSIM Plans for Europe 2026", date: "Jun 4, 2026", desc: "We compare the best regional eSIM data plans for exploring Europe this summer.", img: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=400&q=80" },
        { tag: "Tips", title: "5 Ways to Save on Roaming Abroad", date: "May 28, 2026", desc: "From eSIMs to Wi-Fi calling — the smartest ways to stay connected without breaking the bank.", img: "https://images.unsplash.com/photo-1530521954074-e64f4810b5d9?w=400&q=80" },
        { tag: "Tech", title: "eSIM vs Physical SIM: Which is Better?", date: "May 20, 2026", desc: "We break down the key differences, pros and cons, and who should use which.", img: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80" },
        { tag: "Destinations", title: "Top 10 Most Visited Countries for 2026", date: "May 12, 2026", desc: "Planning your next trip? Here are the top destinations travelers are heading to this year.", img: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80" },
        { tag: "Guide", title: "How to Check eSIM Compatibility", date: "May 5, 2026", desc: "Not sure if your phone supports eSIM? Here's how to check in under 30 seconds.", img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80" },
      ],
    },
    cta: "Browse Plans",
    ctaHref: "/destinations",
  },
  "about": {
    badge: "Company",
    title: "About Voltey",
    subtitle: "We're on a mission to make mobile connectivity simple, affordable, and borderless for travelers everywhere.",
    heroImg: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
    heroBg: "#edeef8",
    icon: "/icons/people.json",
    body: {
      type: "cards",
      items: [
        { icon: "/icons/lottie/award.json",  title: "Our Mission",   desc: "To eliminate the pain of roaming and make mobile data affordable for every traveler, everywhere." },
        { icon: "/icons/global.json",         title: "190+ Countries", desc: "We operate in more than 190 destinations across every continent, partnering with top-tier local carriers." },
        { icon: "/icons/people.json",         title: "2M+ Customers",  desc: "Over 2 million travelers have used Voltey to stay connected on their adventures." },
        { icon: "/icons/simcard.json",        title: "Founded 2020",   desc: "Born out of a frustrating roaming bill in Tokyo, Voltey was built to be the eSIM for everyone." },
        { icon: "/icons/security-card.json",  title: "Privacy First",  desc: "We never sell your data or log your browsing. Your privacy is a core product feature, not an afterthought." },
        { icon: "/icons/lottie/heart.json",   title: "Community Driven", desc: "We listen to our customers. Every feature request goes into our public roadmap — vote for what matters to you." },
      ],
    },
    cta: "Join Our Team",
    ctaHref: "/resources/careers",
  },
  "press": {
    badge: "Media",
    title: "Voltey Press Area",
    subtitle: "The latest news, media resources, and brand assets for journalists and content creators covering Voltey.",
    heroImg: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80",
    heroBg: "#f0f9ff",
    icon: "/icons/lottie/global refresh.json",
    body: {
      type: "press",
      logos: [
        { name: "Forbes",          quote: "The easiest way to get online the moment you land." },
        { name: "TechRadar",       quote: "Voltey makes eSIM setup genuinely effortless." },
        { name: "Lonely Planet",   quote: "Our top pick for travel connectivity in 2026." },
        { name: "CNN Travel",      quote: "A must-have app for international travelers." },
        { name: "PC Magazine",     quote: "Editors' Choice for best travel eSIM service." },
        { name: "The Verge",       quote: "Voltey is the eSIM service we've been waiting for." },
      ],
    },
    cta: "Contact PR Team",
    ctaHref: "/help/center",
  },
  "affiliate": {
    badge: "Partners",
    title: "Affiliate Program",
    subtitle: "Partner with Voltey and earn generous commissions for every customer you refer. Join thousands of successful affiliates worldwide.",
    heroImg: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
    heroBg: "#f0fdf9",
    icon: "/icons/lottie/profile-2user.json",
    body: {
      type: "steps",
      steps: [
        { num: "01", title: "Sign Up for Free",       desc: "Create your affiliate account in minutes — no approval wait time, no minimum traffic requirements." },
        { num: "02", title: "Get Your Unique Link",   desc: "You'll receive a personalized referral link and access to ready-made banners, copy, and creatives." },
        { num: "03", title: "Share & Promote",        desc: "Share your link on your website, social media, YouTube channel, newsletter, or anywhere your audience is." },
        { num: "04", title: "Earn Commissions",       desc: "Earn up to 20% commission on every plan sold through your link. Payments processed monthly." },
      ],
    },
    cta: "Join as Affiliate",
    ctaHref: "/destinations",
  },
  "creators": {
    badge: "New",
    title: "Voltey Creators Program",
    subtitle: "A program built for travel creators, influencers, and bloggers. Share Voltey with your audience and earn on every referral — plus get perks.",
    heroImg: "https://images.unsplash.com/photo-1533228876829-65c94e7b5025?w=800&q=80",
    heroBg: "#fef9f2",
    icon: "/icons/lottie/camera.json",
    body: {
      type: "cards",
      items: [
        { icon: "/icons/lottie/camera.json",   title: "Creator Dashboard",     desc: "Track your referrals, earnings, and top-performing content in real-time." },
        { icon: "/icons/lottie/award.json",     title: "Exclusive Perks",       desc: "Free Voltey plans, early access to new features, and priority support." },
        { icon: "/icons/chart.json",            title: "Competitive Rates",     desc: "Earn up to 25% commission — higher than our standard affiliate rate." },
        { icon: "/icons/people.json",           title: "Creator Community",     desc: "Join a private Slack group with other Voltey creators, get feedback, and collaborate." },
        { icon: "/icons/message.json",          title: "Ready-Made Content",    desc: "Access Voltey's content library: videos, photos, copy templates, and more." },
        { icon: "/icons/notification.json",     title: "Monthly Payouts",       desc: "Reliable monthly payments to PayPal, bank transfer, or Voltey credits." },
      ],
    },
    cta: "Apply Now",
    ctaHref: "/destinations",
  },
  "reviews": {
    badge: "Social Proof",
    title: "Voltey Customer Reviews",
    subtitle: "Don't just take our word for it — here's what over 2 million travelers around the world have to say about Voltey.",
    heroImg: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
    heroBg: "#f0fdf9",
    icon: "/icons/lottie/award.json",
    body: {
      type: "cards",
      items: [
        { icon: "/icons/user.json", title: "Sarah M. — New York 🇺🇸", desc: "\"Set it up in 2 minutes before boarding. Had 5G data the moment I landed in Tokyo. Absolute game changer!\" ⭐⭐⭐⭐⭐" },
        { icon: "/icons/user.json", title: "Marco T. — Milan 🇮🇹",    desc: "\"Used Voltey across 6 European countries in one trip. Seamless — never lost connection once.\" ⭐⭐⭐⭐⭐" },
        { icon: "/icons/user.json", title: "Yuki H. — Tokyo 🇯🇵",     desc: "\"The data speeds were incredible in Europe. Much cheaper than my carrier's roaming plans.\" ⭐⭐⭐⭐⭐" },
        { icon: "/icons/user.json", title: "Ama K. — London 🇬🇧",     desc: "\"Voltey's support team responded in minutes when I had a setup question. 10/10 service.\" ⭐⭐⭐⭐⭐" },
        { icon: "/icons/user.json", title: "James L. — Sydney 🇦🇺",   desc: "\"Bought a plan at the airport 30 min before my flight. Was connected instantly in Bangkok.\" ⭐⭐⭐⭐⭐" },
        { icon: "/icons/user.json", title: "Priya S. — Mumbai 🇮🇳",   desc: "\"I've been using Voltey for 2 years across 15 countries. Never had a single issue.\" ⭐⭐⭐⭐⭐" },
      ],
    },
    cta: "Try Voltey Today",
    ctaHref: "/destinations",
  },
  "careers": {
    badge: "We're Hiring",
    title: "Careers at Voltey",
    subtitle: "Join a fast-growing team on a mission to connect the world's travelers. Remote-first, globally distributed, and deeply passionate about great products.",
    heroImg: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
    heroBg: "#edeef8",
    icon: "/icons/bag.json",
    body: {
      type: "jobs",
      depts: [
        {
          dept: "Engineering",
          roles: [
            { title: "Senior Backend Engineer",    location: "Remote",        type: "Full-time" },
            { title: "iOS Developer",              location: "Remote",        type: "Full-time" },
            { title: "Android Developer",          location: "Remote",        type: "Full-time" },
          ],
        },
        {
          dept: "Product & Design",
          roles: [
            { title: "Product Manager",            location: "Remote",        type: "Full-time" },
            { title: "Senior Product Designer",    location: "Remote",        type: "Full-time" },
          ],
        },
        {
          dept: "Marketing & Growth",
          roles: [
            { title: "Performance Marketing Manager", location: "Remote",    type: "Full-time" },
            { title: "Content & SEO Specialist",      location: "Remote",    type: "Part-time" },
          ],
        },
        {
          dept: "Customer Success",
          roles: [
            { title: "Customer Support Specialist",   location: "Remote (APAC)", type: "Full-time" },
          ],
        },
      ],
    },
    cta: "See All Openings",
    ctaHref: "/destinations",
  },
};

export default function ResourcesPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "what-is-esim";
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
          {page.body?.type === "cards" && (
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

          {page.body?.type === "blog" && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {page.body.posts.map((post, i) => (
                <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all group cursor-pointer">
                  <div className="relative overflow-hidden" style={{ height: 180 }}>
                    <img src={post.img} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <span className="absolute top-3 left-3 bg-white text-[11px] font-bold text-green-600 px-3 py-1 rounded-full shadow">
                      {post.tag}
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="text-[11px] text-gray-400 font-medium mb-2">{post.date}</p>
                    <h3 className="font-bold text-gray-900 text-[15px] mb-2 leading-snug">{post.title}</h3>
                    <p className="text-[13px] text-gray-500 leading-relaxed">{post.desc}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-green-600">
                      Read more <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {page.body?.type === "steps" && (
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

          {page.body?.type === "press" && (
            <div>
              <h2 className="font-black text-gray-900 text-center mb-2" style={{ fontSize: "clamp(22px,3vw,34px)" }}>As Featured In</h2>
              <p className="text-center text-gray-400 text-[14px] mb-10">Leading publications agree — Voltey is the traveler's choice.</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {page.body.logos.map((l, i) => (
                  <div key={i} className="rounded-2xl p-6 border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all">
                    <p className="font-black text-[18px] text-gray-800 mb-3">{l.name}</p>
                    <p className="text-[14px] text-gray-500 italic">"{l.quote}"</p>
                  </div>
                ))}
              </div>
              <div className="mt-12 p-8 rounded-3xl text-center" style={{ background: "#f0fdf9" }}>
                <p className="font-bold text-gray-800 text-[16px] mb-2">Press inquiries</p>
                <p className="text-[14px] text-gray-500 mb-4">For interviews, quotes, or brand assets, reach out to our PR team.</p>
                <a href="mailto:press@voltey.com"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-bold text-white"
                  style={{ background: "#0da976" }}>
                  press@voltey.com
                </a>
              </div>
            </div>
          )}

          {page.body?.type === "jobs" && (
            <div className="max-w-3xl mx-auto space-y-8">
              {page.body.depts.map((dept, i) => (
                <div key={i}>
                  <h3 className="font-bold text-[13px] text-gray-400 uppercase tracking-widest mb-3">{dept.dept}</h3>
                  <div className="space-y-3">
                    {dept.roles.map((role, j) => (
                      <div key={j}
                        className="flex items-center justify-between p-5 rounded-2xl border border-gray-100 hover:border-green-300 hover:shadow-md transition-all cursor-pointer group">
                        <div>
                          <p className="font-bold text-gray-900 text-[15px] group-hover:text-green-600 transition-colors">{role.title}</p>
                          <p className="text-[13px] text-gray-400 mt-0.5">{role.location} · {role.type}</p>
                        </div>
                        <span className="px-4 py-2 rounded-full text-[13px] font-bold text-white" style={{ background: "#0da976" }}>
                          Apply
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-16 px-6 text-center" style={{ background: "linear-gradient(135deg, #0da976 0%, #0bc285 100%)" }}>
        <h2 className="font-black text-white mb-3" style={{ fontSize: "clamp(22px,3vw,36px)" }}>
          Ready to stay connected?
        </h2>
        <p className="text-white/80 text-[15px] mb-8">Get your eSIM plan and go live in minutes.</p>
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

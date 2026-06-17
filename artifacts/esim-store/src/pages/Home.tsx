import { useState, useEffect, useCallback } from "react";
import { useListDestinations } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useCurrency } from "@/lib/currency-context";
import { ChevronRight, Search, Check, Smartphone, Download, Smile, Wifi, QrCode, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import appStoreSvg from "@assets/app-store_1781450235986.svg";
import googlePlaySvg from "@assets/google-play_1781450235984.svg";
import { DestinationSearchModal } from "@/components/DestinationSearchModal";
import { LottieIcon } from "@/components/LottieIcon";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

/* ── Default CMS content (mirrors admin DEFAULT_HOME) ── */
const HOME_DEFAULT = {
  press: {
    heading: "They talk about us",
    headingSize: 17,
    items: [
      { name: "Lonely Planet", href: "https://www.lonelyplanet.com", logo: "" },
      { name: "National Traveler", href: "#", logo: "" },
      { name: "Forbes", href: "https://www.forbes.com", logo: "" },
      { name: "CNN", href: "https://www.cnn.com", logo: "" },
      { name: "PC Magazine", href: "https://www.pcmag.com", logo: "" },
      { name: "TechRadar", href: "https://www.techradar.com", logo: "" },
    ] as { name: string; href: string; logo: string }[],
  },
  featureSlides: [
    { heading1: "Get a local number", heading2: "for your trip", body: "Call and text with your own local number from the Voltey eSIM app. Get a monthly subscription.", price: "US$0.99", unit: "/mo", cta: "Learn More", ctaHref: "/destinations", note: "eSIM compatibility check required before purchase.", bgColor: "#edeef8", photo: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1400&h=700&q=85", video: "" },
    { heading1: "Instant eSIM for", heading2: "190+ destinations", body: "Get connected in minutes with instant eSIM delivery to your email. No physical SIM card needed.", price: "From US$1.99", unit: "/trip", cta: "Browse Plans", ctaHref: "/destinations", note: "Works on any eSIM-compatible iPhone or Android device.", bgColor: "#e8f4ea", photo: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1400&h=700&q=85", video: "" },
    { heading1: "Save up to 90%", heading2: "on roaming charges", body: "Skip expensive carrier roaming fees. Affordable 4G/5G data plans for every destination worldwide.", price: "From US$0.99", unit: "/day", cta: "Get Started", ctaHref: "/destinations", note: "Plans available in 190+ countries and regions.", bgColor: "#fef3e8", photo: "https://images.unsplash.com/photo-1530521954074-e64f4810b5d9?auto=format&fit=crop&w=1400&h=700&q=85", video: "" },
  ] as { heading1: string; heading2: string; body: string; price: string; unit: string; cta: string; ctaHref: string; note: string; bgColor: string; photo: string; video: string }[],
  featureSlidesSizes: { heading1Size: 40, bodySize: 14, priceSize: 32 },
  hero: {
    backgroundImage: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&h=900&q=85",
    backgroundVideo: "",
    badge: "Save on roaming",
    heading: "Affordable eSIM data for international travel",
    headingSize: 48,
    bodySize: 14,
    bullets: [
      "Instant eSIM delivery — no physical SIM needed",
      "4G / 5G networks in 190+ destinations",
      "Flexible plans from 1 GB to 50 GB",
    ],
    searchPlaceholder: "Search for destination",
    planLinkText: "plans and destinations",
  },
  searchModal: {
    title: "Where?",
    placeholder: "Enter your destination",
    popularLabel: "Most popular destinations",
    popularCodes: ["ES", "GR", "IT", "GL-WORLD", "GL-EU", "TR", "GB", "FR", "JP", "US"],
  },
  slides: [
    { heading: "Refer friends, earn up to\nUS$100 in rewards!", body: "For a limited time, sharing Voltey can earn you up to US$50 in gift cards plus up to US$50 in Voltey credits! Join the Rewards sprint now.", cta: "Learn More", ctaHref: "#", photo: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&h=500&q=85", video: "", icon: "🎁" },
    { heading: "Get connected in minutes,\nanywhere in the world", body: "Instant eSIM delivery straight to your email. No physical SIM, no queues — activate your plan before you even board the plane.", cta: "Browse Plans", ctaHref: "/destinations", photo: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&h=500&q=85", video: "", icon: "✈️" },
    { heading: "Coverage in 190+\ndestinations worldwide", body: "From Europe to Asia, the Americas to the Middle East — Voltey has you covered with fast 4G/5G data plans wherever your adventure takes you.", cta: "See Destinations", ctaHref: "/destinations", photo: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=900&h=500&q=85", video: "", icon: "🌍" },
  ] as { heading: string; body: string; cta: string; ctaHref: string; photo: string; video: string; icon: string }[],
  slidesSizes: { headingSize: 40, bodySize: 13 },
  destinations: { heading: "Choose your travel destination", subheading: "Pick a mobile data plan for your trip.", headingSize: 40, subheadingSize: 15 },
  esimInfo: {
    // Slide 1
    heading: "What is an eSIM?",
    description: "An eSIM is a virtual or digital SIM card that lets you connect to mobile networks without a physical SIM card. Store multiple eSIMs, access different carriers and data plans — ideal for travel or everyday use. Activate in minutes.",
    badge1: "easy to use",
    badge2: "easy to install",
    badge3: "easy to enjoy",
    btnLabel: "More details",
    btnHref: "#",
    headingSize: 40,
    descSize: 14,
    photo: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1400&h=700&q=85",
    video: "",
    bgColor: "#dcf0f5",
    // Slide 2
    slide2Heading: "Enjoy unlimited data in 3 steps",
    slide2HeadingSize: 40,
    slide2BgColor: "#fef9f2",
    slide2Photo1: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=320&h=200&q=80",
    slide2Photo2: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=320&h=200&q=80",
    slide2Steps: [
      { num: "01.", title: "Find your destination", body: "and select the days for the data plan you need!", icon: "/icons/map.json" },
      { num: "02.", title: "Install your eSIM", body: "using the setup guide in your email.", icon: "/icons/simcard.json" },
      { num: "03.", title: "Turn on your eSIM at arrival", body: "and connect instantly.", icon: "/icons/wifi.json" },
    ] as { num: string; title: string; body: string; icon: string }[],
    // Slide 3
    slide3Heading1: "Works on your",
    slide3Heading2: "device",
    slide3HeadingSize: 40,
    slide3DescSize: 14,
    slide3Description: "Compatible with all eSIM-capable iPhones and Android devices. Check if your phone supports eSIM in seconds — most modern devices do.",
    slide3Bullets: ["iPhone XS and later", "Samsung Galaxy S20 and later", "Google Pixel 3 and later", "Most modern Android flagships"] as string[],
    slide3BtnLabel: "Check compatibility",
    slide3BtnHref: "/destinations",
    slide3Photo: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1400&h=700&q=85",
    slide3Video: "",
    slide3BgColor: "#e8f4ea",
  },
  features: {
    sectionBadge: "Why choose Voltey?",
    heading: "Stay connected while traveling",
    badgeSize: 12,
    headingSize: 40,
    itemTitleSize: 15,
    itemBodySize: 13,
    items: [
      { title: "International data plans", desc: "Get cellular data that works for your budget and itinerary. From 1 GB to unlimited plans, Voltey's got you covered!" },
      { title: "Easy to use", desc: "Just download the Voltey eSIM app, install the eSIM, and buy an eSIM data plan — it will activate automatically the moment you reach your destination." },
      { title: "Avoid roaming charges", desc: "If you want to avoid costly roaming, eSIM technology offers a good alternative. Know how much your internet connection will cost before you take off!" },
      { title: "One eSIM for all your travels", desc: "Add new destinations to your existing Voltey eSIM — no need to install new eSIMs every time. Just top up and connect!" },
      { title: "Get mobile data usage alerts", desc: "Don't risk running out of eSIM data at the worst possible moment — we'll notify you when you've used 80% of your plan." },
      { title: "Global and regional plans", desc: "Stay online wherever you go — get a Global eSIM data plan or a regional eSIM data plan to explore entire regions and beyond." },
    ] as { title: string; desc: string }[],
    gotYouCoveredImages: ["", "", "", "", "", ""] as string[],
    gotYouCoveredHeading: "Enjoy reliable and affordable internet\nin your trips. We got you covered.",
    gotYouCoveredHeadingSize: 40,
    gotYouCoveredItems: [
      { title: "Keep using your favorite Apps",        desc: "Get that safe ride home, find that great restaurant, and pin the local attractions, **all while staying connected with your loved ones.**", learnMoreHref: "" },
      { title: "Earn Voltey Rewards after buying",     desc: "**Earn reward points** when you buy an eSIM or refer a friend, and use them on future purchases!", learnMoreHref: "" },
      { title: "Keep your WhatsApp number",            desc: "You can call and message all your contacts on WhatsApp, **like you're in the same country.** Don't lose touch with family and friends.", learnMoreHref: "" },
      { title: "24/7 Customer support",                desc: "In need of assistance? **Our 24/7 chat support** is just a message away to keep you connected and **help you** with everything you need.", learnMoreHref: "" },
      { title: "Money-back guarantee",                 desc: "Purchase your Voltey eSIM with **peace of mind.** If your plans change, **you'll have up to 7 days** to request a refund.", learnMoreHref: "/destinations" },
      { title: "Fast and reliable Internet connection", desc: "Connect to the **best networks at your destination** and get internet that is consistent and high-speed.", learnMoreHref: "" },
    ] as { title: string; desc: string; learnMoreHref: string }[],
  },
  steps: {
    heading: "How does Voltey work?",
    headingSize: 40,
    itemTitleSize: 17,
    itemBodySize: 13,
    items: [
      { num: "1", title: "Choose a data plan for your trip", desc: "Select your destination and buy your travel eSIM data plan. Then, download the Voltey app." },
      { num: "2", title: "Set up your eSIM and enable data roaming", desc: "Set up the eSIM from your device by following instructions in the app and enable data roaming for your Voltey plan." },
      { num: "3", title: "Enjoy your data", desc: "Get ready for takeoff — your data plan will activate automatically when you arrive at your destination!" },
    ] as { num: string; title: string; desc: string }[],
  },
  reviews: {
    heading: "Voltey reviews from travelers",
    headingSize: 40,
    nameSize: 14,
    bodySize: 13,
    items: [] as { name: string; location: string; text: string; rating: string; youtubeId: string }[],
    masonryItems: [
      { type: "review",   name: "Jorge A.",  location: "", text: "Easy, cheap and fast. Easy step to step setup and troubleshooting, super fast speed (around 100 mbps). Cheap, great coverage and helpful chat/assistance. Keep up the good work.", rating: "5", badge: "trustpilot", pub: "", pubType: "", videoId: "", videoTitle: "" },
      { type: "youtube",  name: "",          location: "", text: "",  rating: "", badge: "", pub: "", pubType: "", videoId: "P4N9Pi4QONE", videoTitle: "Review 1" },
      { type: "reel",     name: "",          location: "", text: "",  rating: "", badge: "", pub: "", pubType: "", videoId: "scTiMKfRwKs", videoTitle: "Review 2" },
      { type: "featured", name: "",          location: "", text: "Voltey is an affordable, easy-to-use, and sustainable eSIM service that gives reliable mobile and internet connections from anywhere in the world. That's why we recommend Voltey as our eSIM partner.", rating: "", badge: "", pub: "lonely planet", pubType: "lonely-planet", videoId: "", videoTitle: "" },
      { type: "youtube",  name: "",          location: "", text: "",  rating: "", badge: "", pub: "", pubType: "", videoId: "gG7uCskUOrA", videoTitle: "Review 3" },
      { type: "reel",     name: "",          location: "", text: "",  rating: "", badge: "", pub: "", pubType: "", videoId: "jNQXAC9IVRw", videoTitle: "Review 4" },
      { type: "reel",     name: "",          location: "", text: "",  rating: "", badge: "", pub: "", pubType: "", videoId: "7Q-k8zVG8sI", videoTitle: "Review 5" },
      { type: "review",   name: "Domas R.", location: "",  text: "Awesome — used Voltey across 3 countries already (UK, Netherlands and Belgium). Took me like 1min to buy eSIM and activate it. My internet was way better than my friends' who remained connected to their local providers and used roaming plans instead.", rating: "5", badge: "trustpilot", pub: "", pubType: "", videoId: "", videoTitle: "" },
      { type: "youtube",  name: "",          location: "", text: "",  rating: "", badge: "", pub: "", pubType: "", videoId: "BQ0mxQXmLsk", videoTitle: "Review 6" },
      { type: "press",    name: "",          location: "", text: "With comprehensive coverage and affordable prices, Voltey is the best eSIM for Europe. Activating Voltey is straightforward. Download the app, choose your plan, and surf the internet. You can contact the Voltey customer support team via live chat or email if you encounter any issues.", rating: "", badge: "", pub: "cybernews", pubType: "cybernews", videoId: "", videoTitle: "" },
      { type: "reel",     name: "",          location: "", text: "",  rating: "", badge: "", pub: "", pubType: "", videoId: "dQw4w9WgXcQ", videoTitle: "Review 7" },
      { type: "press",    name: "",          location: "", text: "As a product backed by the reputable NordVPN brand, Voltey benefits from the company's focus on security and privacy. Users praise its easy installation process, affordable pricing, and reliable coverage across the world.", rating: "", badge: "", pub: "techradar", pubType: "techradar", videoId: "", videoTitle: "" },
      { type: "youtube",  name: "",          location: "", text: "",  rating: "", badge: "", pub: "", pubType: "", videoId: "9bZkp7q19f0", videoTitle: "Review 8" },
    ] as any[],
  },
  faq: {
    heading: "Frequently asked questions",
    headingSize: 40,
    questionSize: 15,
    answerSize: 14,
    items: [
      { question: "After getting an eSIM, do I need to turn anything on?", answer: "Once your eSIM is installed, it will activate automatically when you arrive at your destination. Just make sure mobile data is turned on and your eSIM line is selected in your phone settings." },
      { question: "Does Voltey detect when I arrive at my destination?", answer: "Yes — your Voltey eSIM data plan activates automatically when you land at your destination, or up to 30 days after purchase, whichever comes first." },
      { question: "Do I keep my number with a Voltey eSIM data plan?", answer: "Yes! Your primary SIM and phone number remain active. The Voltey eSIM is a separate data line — you stay reachable on your normal number while using Voltey for mobile data abroad." },
      { question: "What's the best eSIM for international travel?", answer: "Voltey offers coverage in 190+ destinations with instant delivery, fast 4G/5G speeds, and affordable plans starting from just a few dollars. It's consistently rated one of the top eSIM services for travelers." },
      { question: "What is a tourist eSIM?", answer: "A tourist eSIM is a short-term digital SIM designed for travelers. It gives you local data rates without needing a physical SIM swap, so you stay connected the moment you land." },
      { question: "Is the Voltey eSIM app legit?", answer: "Absolutely. Voltey is a trusted eSIM provider backed by years of experience in mobile connectivity. It's used by millions of travelers and recommended by major publications including Lonely Planet and Forbes." },
      { question: "Does the Voltey app offer cheap eSIM options?", answer: "Yes — plans start from just $1.99 per trip, and you can find options for every budget. Regional and global plans offer even more savings if you're visiting multiple countries." },
      { question: "Does Voltey work in the US?", answer: "Yes! Voltey offers plans for the United States, with coverage across all major networks. You can purchase a US plan and activate it as soon as you arrive." },
      { question: "How do I install my Voltey eSIM?", answer: "After purchasing, you'll receive a QR code by email. Simply open your phone's Settings → Cellular → Add eSIM, then scan the QR code. The whole process takes under 2 minutes." },
      { question: "Can I use my Voltey eSIM on multiple trips?", answer: "Yes — once installed, your Voltey eSIM stays on your device. You can top up or add new destination plans for future trips without reinstalling anything." },
    ] as { question: string; answer: string }[],
  },
  app: {
    heading: "Download the Voltey eSIM app",
    headingSize: 40,
    bodySize: 14,
    description: "You can get Voltey on Google Play and the App Store or by scanning the QR code.",
    appStoreHref: "#",
    playStoreHref: "#",
    photo: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&h=500&q=80",
  },
};

function renderBold(text: string) {
  if (!text) return null;
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="text-gray-900 font-bold">{part}</strong>
      : <span key={i}>{part}</span>
  );
}

function YouTubeVideo({ videoId, title }: { videoId: string; title: string }) {
  const [active, setActive] = useState(false);
  const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  if (active) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=1&playsinline=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
        style={{ border: 0, display: "block" }}
      />
    );
  }
  return (
    <div
      className="relative w-full h-full cursor-pointer group"
      onClick={() => setActive(true)}
    >
      <img
        src={thumb}
        alt={title}
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
          (e.target as HTMLImageElement).parentElement!.style.background =
            "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)";
        }}
      />
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-lg transition-all group-hover:scale-110">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 4.5l10 5.5-10 5.5V4.5z" fill="#111" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* Inline star rating */
function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill={i < n ? "#f5a623" : "#e5e7eb"}>
          <path d="M12 2l2.9 8.9H23l-7.5 5.5 2.9 8.9L12 20l-7.5 5.5 2.9-8.9L0 10.9h8.1z"/>
        </svg>
      ))}
    </div>
  );
}

/* ── Publication badge renderer ── */
function PubBadge({ pubType, pub }: { pubType?: string; pub?: string }) {
  if (pubType === "trustpilot") return (
    <div className="flex items-center gap-1">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#00b67a"><path d="M12 2l2.9 8.9H23l-7.5 5.5 2.9 8.9L12 20l-7.5 5.5 2.9-8.9L0 10.9h8.1z"/></svg>
      <span className="text-[12px] text-gray-500 font-medium">Trustpilot</span>
    </div>
  );
  if (pubType === "cybernews") return (
    <div className="flex items-center gap-1.5">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 5 3.6 9.7 8 11 4.4-1.3 8-6 8-11V6L12 2z" fill="#111" opacity=".9"/><path d="M9 12l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
      <span className="font-bold text-gray-900 text-[14px] tracking-tight">cybernews<span className="text-gray-400 font-normal text-[11px]">°</span></span>
    </div>
  );
  if (pubType === "techradar") return (
    <div className="flex items-center gap-1.5">
      <span className="font-bold text-gray-900 text-[15px] tracking-tight">techradar</span>
      <svg width="16" height="14" viewBox="0 0 20 18" fill="none"><path d="M3 15 Q10 2 17 15" stroke="#e02020" strokeWidth="2.2" strokeLinecap="round" fill="none"/><path d="M6 15 Q10 7 14 15" stroke="#e02020" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".7"/><circle cx="10" cy="15" r="1.8" fill="#e02020"/></svg>
    </div>
  );
  if (pubType === "lonely-planet") return (
    <div className="flex items-center gap-2">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#006CB7" strokeWidth="2"/><ellipse cx="12" cy="12" rx="4" ry="10" stroke="#006CB7" strokeWidth="1.5"/><line x1="2" y1="12" x2="22" y2="12" stroke="#006CB7" strokeWidth="1.5"/></svg>
      <span style={{ color: "#006CB7", fontWeight: 700, fontSize: 15 }}>lonely planet</span>
    </div>
  );
  if (pub) return <span className="font-semibold text-gray-700 text-[13px]">{pub}</span>;
  return null;
}

/* ── Single masonry card renderer ── */
function MasonryCard({ item, i }: { item: any; i: string }) {
  if (item.type === "youtube") {
    return (
      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ aspectRatio: "16/9" }}>
        <YouTubeVideo videoId={item.videoId} title={item.videoTitle || ""} />
      </div>
    );
  }
  if (item.type === "reel") {
    return (
      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ aspectRatio: "9/16" }}>
        <YouTubeVideo videoId={item.videoId} title={item.videoTitle || ""} />
      </div>
    );
  }
  if (item.type === "review") {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-gray-900 text-[14px]">{item.name}</span>
          {item.badge === "trustpilot" && <PubBadge pubType="trustpilot" />}
        </div>
        <p className="text-gray-600 text-[13px] leading-relaxed mb-4">{item.text}</p>
        <Stars n={Number(item.rating) || 5} />
      </div>
    );
  }
  if (item.type === "featured") {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col">
        <div className="text-[4rem] leading-none text-gray-800 mb-4" style={{ fontFamily: "Georgia, serif", lineHeight: 1 }}>"</div>
        <p className="text-[1.55rem] font-bold text-gray-900 leading-snug flex-1">{item.text}</p>
        <div className="mt-8">
          <PubBadge pubType={item.pubType} pub={item.pub} />
        </div>
      </div>
    );
  }
  if (item.type === "press") {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-1.5 mb-4">
          <PubBadge pubType={item.pubType} pub={item.pub} />
        </div>
        <p className="text-gray-600 text-[13px] leading-relaxed">{item.text}</p>
      </div>
    );
  }
  return null;
}

/* ── Press logo fallback renders (keyed by normalized name) ── */
function PressLogoFallback({ name }: { name: string }) {
  const key = name.toLowerCase().replace(/\s+/g, "");
  if (key === "lonelyplanet") return (
    <span className="flex items-center gap-1.5" style={{ color: "#006CB7", fontWeight: 700, fontSize: 15 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#006CB7" strokeWidth="2"/><ellipse cx="12" cy="12" rx="4" ry="10" stroke="#006CB7" strokeWidth="1.5"/><line x1="2" y1="12" x2="22" y2="12" stroke="#006CB7" strokeWidth="1.5"/></svg>
      lonely planet
    </span>
  );
  if (key === "nationaltraveler") return (
    <span className="flex flex-col items-center leading-none" style={{ color: "#1a1a1a" }}>
      <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", color: "#555" }}>NATIONAL</span>
      <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.14em" }}>TRAVELER</span>
    </span>
  );
  if (key === "forbes") return (
    <span style={{ color: "#00A651", fontWeight: 700, fontStyle: "italic", fontSize: 20 }}>Forbes</span>
  );
  if (key === "cnn") return (
    <span className="font-black px-2.5 py-1 rounded-[3px]" style={{ background: "#CC0000", color: "white", fontSize: 14, letterSpacing: "0.05em" }}>CNN</span>
  );
  if (key === "pcmagazine") return (
    <span className="flex flex-col items-center leading-none">
      <span style={{ color: "#CC0000", fontWeight: 900, fontSize: 20, lineHeight: 1 }}>PC</span>
      <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.1em", color: "#555" }}>MAGAZINE</span>
    </span>
  );
  if (key === "techradar") return (
    <span className="flex items-center gap-0.5" style={{ color: "#1a1a1a", fontSize: 15, fontWeight: 500 }}>
      tech<strong>radar</strong>
      <svg width="16" height="14" viewBox="0 0 20 18" fill="none" className="ml-0.5"><path d="M3 15 Q10 2 17 15" stroke="#e02020" strokeWidth="2.2" strokeLinecap="round" fill="none"/><path d="M6 15 Q10 7 14 15" stroke="#e02020" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".7"/><circle cx="10" cy="15" r="1.8" fill="#e02020"/></svg>
    </span>
  );
  // Generic styled text fallback
  return <span className="font-bold text-gray-700 text-[15px]">{name}</span>;
}

/* SVG icons for features section (6 fixed icons matching the 6 feature types) */
const FEATURE_ICONS = [
  <svg key={0} width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="20" width="24" height="5" rx="1.5"/><rect x="7" y="14" width="18" height="5" rx="1.5"/><rect x="10" y="8" width="12" height="5" rx="1.5"/></svg>,
  <svg key={1} width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="16" cy="16" r="11"/><polyline points="11 16.5 14.5 20 21 13"/></svg>,
  <svg key={2} width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="20" height="24" rx="2"/><line x1="10" y1="11" x2="22" y2="11"/><line x1="10" y1="16" x2="22" y2="16"/><line x1="10" y1="21" x2="16" y2="21"/></svg>,
  <svg key={3} width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="4" width="16" height="24" rx="2"/><line x1="12" y1="10" x2="20" y2="10"/><line x1="12" y1="14" x2="20" y2="14"/><line x1="12" y1="18" x2="17" y2="18"/><circle cx="20" cy="22" r="4"/><line x1="20" y1="20" x2="20" y2="22"/><line x1="20" y1="22" x2="21.5" y2="22"/></svg>,
  <svg key={4} width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 6 C10 6 8 11 8 15 L8 20 L24 20 L24 15 C24 11 22 6 16 6Z"/><line x1="13" y1="20" x2="19" y2="20"/><path d="M13 22 Q16 26 19 22"/><circle cx="23" cy="8" r="4" fill="#111" stroke="none"/><line x1="23" y1="6.5" x2="23" y2="8.5" stroke="white" strokeWidth="1.4"/><circle cx="23" cy="9.8" r="0.6" fill="white" stroke="none"/></svg>,
  <svg key={5} width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="16" cy="16" r="11"/><ellipse cx="16" cy="16" rx="5" ry="11"/><line x1="5" y1="16" x2="27" y2="16"/><line x1="7" y1="11" x2="25" y2="11"/><line x1="7" y1="21" x2="25" y2="21"/></svg>,
];

export default function Home() {
  const { fmt } = useCurrency();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const { data: destinationsData, isLoading } = useListDestinations();

  const [activeDestTab, setActiveDestTab] = useState<"country" | "region" | "ultra">("country");
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeEsimSlide, setActiveEsimSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activePromoCard, setActivePromoCard] = useState(0);

  /* ── CMS content ── */
  const [cms, setCms] = useState(HOME_DEFAULT);

  useEffect(() => {
    fetch(`${BASE}/api/content/home`)
      .then(r => r.json())
      .then(d => {
        if (d && typeof d === "object") {
          setCms(prev => ({
            ...prev,
            ...d,
            press:         d.press         ? { ...HOME_DEFAULT.press, ...(prev.press ?? {}), ...d.press } : (prev.press ?? HOME_DEFAULT.press),
            featureSlides: d.featureSlides ? d.featureSlides : (prev.featureSlides ?? HOME_DEFAULT.featureSlides),
            hero:          d.hero          ? { ...prev.hero,          ...d.hero          } : prev.hero,
            slides:        d.slides        ? d.slides                                     : prev.slides,
            destinations: d.destinations ? { ...prev.destinations, ...d.destinations } : prev.destinations,
            esimInfo:     d.esimInfo     ? { ...prev.esimInfo,     ...d.esimInfo     } : prev.esimInfo,
            features:     d.features     ? { ...prev.features,     ...d.features     } : prev.features,
            steps:        d.steps        ? { ...prev.steps,        ...d.steps        } : prev.steps,
            reviews:      d.reviews      ? { ...prev.reviews,      ...d.reviews      } : prev.reviews,
            faq:          d.faq          ? { ...prev.faq,          ...d.faq          } : prev.faq,
            app:              d.app              ? { ...prev.app,              ...d.app              } : prev.app,
            searchModal:  d.searchModal  ? { ...prev.searchModal,  ...d.searchModal  } : prev.searchModal,
            featureSlidesSizes: d.featureSlidesSizes ? { ...HOME_DEFAULT.featureSlidesSizes, ...d.featureSlidesSizes } : (prev.featureSlidesSizes ?? HOME_DEFAULT.featureSlidesSizes),
            slidesSizes:        d.slidesSizes        ? { ...HOME_DEFAULT.slidesSizes,        ...d.slidesSizes        } : (prev.slidesSizes        ?? HOME_DEFAULT.slidesSizes),
          }));
        }
      })
      .catch(() => {});
  }, []);

  const PROMO_CARDS = cms.slides;
  const ESIM_SLIDE_COUNT = 3;

  const SLIDES = cms.featureSlides ?? HOME_DEFAULT.featureSlides;

  const prev = useCallback(() => setActiveSlide(i => (i - 1 + SLIDES.length) % SLIDES.length), [SLIDES.length]);
  const next = useCallback(() => setActiveSlide(i => (i + 1) % SLIDES.length), [SLIDES.length]);

  useEffect(() => {
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next]);

  const nextEsim = useCallback(() => setActiveEsimSlide(i => (i + 1) % ESIM_SLIDE_COUNT), [ESIM_SLIDE_COUNT]);
  useEffect(() => {
    const t = setInterval(nextEsim, 6000);
    return () => clearInterval(t);
  }, [nextEsim]);

  const nextPromoCard = useCallback(() => setActivePromoCard(i => (i + 1) % PROMO_CARDS.length), [PROMO_CARDS.length]);
  useEffect(() => {
    const t = setInterval(nextPromoCard, 5000);
    return () => clearInterval(t);
  }, [nextPromoCard]);

  /* ── Popular countries from admin overrides (max 20 for home grid) ── */
  const DEFAULT_POPULAR_CODES = ["ES", "GR", "IT", "TR", "GB", "PT", "FR", "DE", "NL"];
  function getPopularCodesHome(): string[] {
    try {
      const raw = localStorage.getItem("voltey-country-overrides");
      if (!raw) return [];
      const ovs: Record<string, { status?: boolean; popular?: boolean }> = JSON.parse(raw);
      return Object.entries(ovs).filter(([, v]) => v.popular === true).map(([c]) => c).slice(0, 30);
    } catch { return []; }
  }
  const [popularCodes, setPopularCodes] = useState<string[]>(() => {
    const admin = getPopularCodesHome();
    return admin.length > 0 ? admin : DEFAULT_POPULAR_CODES;
  });
  useEffect(() => {
    function refresh() {
      const admin = getPopularCodesHome();
      setPopularCodes(admin.length > 0 ? admin : DEFAULT_POPULAR_CODES);
    }
    window.addEventListener("voltey-country-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("voltey-country-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const popularDestinations =
    destinationsData?.destinations
      ?.filter((d) => popularCodes.includes(d.locationCode))
      .sort((a, b) => popularCodes.indexOf(a.locationCode) - popularCodes.indexOf(b.locationCode))
      .slice(0, 20) || [];

  const regionDestinations =
    destinationsData?.destinations
      ?.filter((d) => d.isRegion && !d.locationCode.startsWith("GL"))
      .slice(0, 9) || [];

  const globalDestinations =
    destinationsData?.destinations
      ?.filter((d) => d.locationCode.startsWith("GL"))
      .slice(0, 9) || [];

  const shownDestinations =
    activeDestTab === "country" ? popularDestinations :
    activeDestTab === "region"  ? regionDestinations  :
    globalDestinations;

  /* Derived feature items — pad/truncate to exactly 6 */
  const featureItems = (() => {
    const src = cms.features.items ?? [];
    const defaults = HOME_DEFAULT.features.items;
    return Array.from({ length: 6 }, (_, i) => src[i] ?? defaults[i] ?? { title: "", desc: "" });
  })();

  /* Derived steps — pad/truncate to exactly 3 */
  const stepItems = (() => {
    const src = cms.steps.items ?? [];
    const defaults = HOME_DEFAULT.steps.items;
    return Array.from({ length: 3 }, (_, i) => src[i] ?? defaults[i] ?? { num: String(i + 1), title: "", desc: "" });
  })();

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Destination Search Modal ── */}
      {searchModalOpen && (
        <DestinationSearchModal
          onClose={() => setSearchModalOpen(false)}
          title={cms.searchModal?.title}
          placeholder={cms.searchModal?.placeholder}
          popularLabel={cms.searchModal?.popularLabel}
          popularCodes={cms.searchModal?.popularCodes}
        />
      )}

      {/* ════════════════════════════════════════════════════
          HERO  —  CMS-driven background + content
      ════════════════════════════════════════════════════ */}
      <section
        className="relative flex items-center overflow-hidden mt-[-116px] min-h-[calc(640px+116px)]"
      >
        {/* Full-bleed background — video takes priority over image */}
        {cms.hero.backgroundVideo ? (
          <video
            key={cms.hero.backgroundVideo}
            src={cms.hero.backgroundVideo}
            autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        ) : (
          <img
            src={cms.hero.backgroundImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 sm:hidden"
          style={{
            background: "rgba(255,255,255,0.88)",
          }}
        />
        <div
          className="absolute inset-0 hidden sm:block"
          style={{
            background:
              "linear-gradient(to right, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.93) 25%, rgba(255,255,255,0.7) 45%, rgba(255,255,255,0.15) 65%, rgba(255,255,255,0) 80%)",
          }}
        />

        {/* ── Left-side content ── */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-8 w-full pt-[116px] pb-10">
          <div className="max-w-[490px] space-y-4">

            {/* Eyebrow */}
            <p className="text-[13px] text-gray-700 font-normal">
              Powered by the world's fastest eSIM network
            </p>

            {/* Headline */}
            <h1 className="text-gray-900 text-[34px] sm:text-[48px] font-medium leading-tight" style={{ fontSize: (cms.hero.headingSize || 48) + 'px' }}>
              {cms.hero.heading}
            </h1>

            {/* Benefit block */}
            <div className="space-y-2 pt-1">
              {cms.hero.badge && (
                <div className="flex items-center gap-2 font-bold text-gray-900 text-[15px]">
                  <LottieIcon src="/icons/tag.json" size={18} autoplay loop />
                  {cms.hero.badge}
                </div>
              )}
              <ul className="space-y-[5px]">
                {cms.hero.bullets.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-[14.5px] text-gray-800">
                    <Check className="w-[14px] h-[14px] shrink-0 text-gray-800" strokeWidth={3} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Search */}
            <div className="space-y-2 pt-2">
              <p className="font-semibold text-gray-900 text-[15px]">
                Where do you need mobile data?
              </p>
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="flex items-center bg-white rounded-xl overflow-hidden border border-white/80 shadow-sm text-left cursor-text"
                style={{ maxWidth: 390, width: "100%" }}
              >
                <span className="flex-1 px-4 py-[14px] text-gray-400 text-[14px]">
                  {cms.hero.searchPlaceholder}
                </span>
                <span className="m-1.5 w-[40px] h-[40px] rounded-[10px] bg-[#0da976] flex items-center justify-center shrink-0">
                  <Search className="w-[16px] h-[16px] text-white" />
                </span>
              </button>
              <p className="text-[12.5px] text-gray-600">
                Take a look at our{" "}
                <Link
                  href="/destinations"
                  className="underline underline-offset-2 hover:text-gray-800 transition-colors"
                >
                  {cms.hero.planLinkText}
                </Link>
                .
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          PRESS LOGOS BAR  — CMS-driven
      ════════════════════════════════════ */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 text-center">
          <p className="font-medium text-gray-900 mb-8" style={{ fontSize: (cms.press.headingSize || 17) + 'px' }}>{cms.press.heading}</p>
          <div className="flex items-center justify-center gap-6 sm:gap-14 flex-wrap">
            {cms.press.items.map((item, i) => {
              const node = item.logo ? (
                <img
                  src={item.logo}
                  alt={item.name}
                  className="h-8 max-w-[130px] object-contain"
                />
              ) : (
                <PressLogoFallback name={item.name} />
              );
              return item.href && item.href !== "#" ? (
                <a key={i} href={item.href} target="_blank" rel="noopener noreferrer" className="flex items-center hover:opacity-75 transition-opacity">
                  {node}
                </a>
              ) : (
                <span key={i} className="flex items-center">{node}</span>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          PROMO SLIDER — 3 feature slides
      ════════════════════════════════════ */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div
            className="relative rounded-[28px] overflow-hidden"
            style={{ minHeight: 420 }}
          >
            {SLIDES.map((slide, i) => {
              const hex = slide.bgColor || "#edeef8";
              const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
              const rgb = `${r},${g},${b}`;
              return (
              <div
                key={i}
                className="absolute inset-0 flex items-center transition-opacity duration-700"
                style={{ opacity: i === activeSlide ? 1 : 0, pointerEvents: i === activeSlide ? "auto" : "none" }}
              >
                {slide.video ? (
                  <video
                    src={slide.video}
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    autoPlay muted loop playsInline
                  />
                ) : (
                  <img
                    src={slide.photo}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                )}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(to right, rgba(${rgb},1) 0%, rgba(${rgb},0.95) 28%, rgba(${rgb},0.6) 52%, rgba(${rgb},0) 70%)`,
                  }}
                />
                <div className="relative z-10 px-6 py-8 sm:pl-16 sm:py-16 max-w-[480px]">
                  <h2 className="text-gray-900 mb-4 text-[26px] sm:text-[40px] font-medium leading-tight sm:leading-[52px]" style={{ fontSize: (cms.featureSlidesSizes?.heading1Size || 40) + 'px' }}>
                    {slide.heading1}<br />{slide.heading2}
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-5" style={{ fontSize: (cms.featureSlidesSizes?.bodySize || 14) + 'px' }}>
                    {slide.body}
                  </p>
                  <p className="font-extrabold text-gray-900 mb-6 leading-none" style={{ fontSize: (cms.featureSlidesSizes?.priceSize || 32) + 'px' }}>
                    {slide.price}
                    <span className="text-[1.1rem] font-semibold text-gray-500">{slide.unit}</span>
                  </p>
                  <div>
                    <Link href={slide.ctaHref || "/destinations"}>
                      <button className="bg-gray-900 hover:bg-gray-700 transition-colors text-white font-semibold text-[15px] px-8 py-3.5 rounded-full">
                        {slide.cta}
                      </button>
                    </Link>
                  </div>
                  <p className="flex items-center gap-1.5 mt-5 text-[12.5px] text-gray-600">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {slide.note}
                  </p>
                </div>
              </div>
            );})}

            <div className="invisible px-6 py-8 sm:pl-16 sm:py-16 max-w-[480px]" aria-hidden>
              <div className="text-[2rem] font-bold leading-tight mb-4">placeholder<br />line</div>
              <div className="text-[14.5px] mb-5">placeholder body text goes here to match height</div>
              <div className="text-[2rem] font-extrabold mb-6">US$0.00<span className="text-[1.1rem]">/mo</span></div>
              <div className="px-8 py-3.5 rounded-full inline-block">btn</div>
              <div className="mt-5 text-[12.5px]">note</div>
            </div>

            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`block rounded-full transition-all duration-300 ${
                    i === activeSlide
                      ? "w-6 h-[8px] bg-gray-900"
                      : "w-[8px] h-[8px] bg-gray-400/60 hover:bg-gray-600"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          CHOOSE YOUR TRAVEL DESTINATION
      ════════════════════════════════════ */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">

          <div className="flex items-center justify-between mb-7">
            <div>
              <p className="text-[13.5px] text-gray-400 font-normal mb-2">Where are you traveling to?</p>
              <h2 className="text-gray-900 text-[26px] sm:text-[40px] font-medium leading-tight sm:leading-[52px]" style={{ fontSize: (cms.destinations.headingSize || 40) + 'px' }}>
                {cms.destinations.heading}
              </h2>
              <p className="text-gray-500 mt-2" style={{ fontSize: (cms.destinations.subheadingSize || 15) + 'px' }}>{cms.destinations.subheading}</p>
            </div>
            <Link href="/destinations">
              <button className="hidden sm:block whitespace-nowrap bg-[#0da976] hover:bg-[#0b9068] transition-colors text-white font-bold text-[15px] px-8 py-4 rounded-full shrink-0">
                View All Destinations
              </button>
            </Link>
          </div>

          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-7">
          <div className="flex items-center gap-2 min-w-max">
            <button
              onClick={() => setActiveDestTab("country")}
              className={`px-5 py-2.5 rounded-full text-[15px] font-semibold transition-colors whitespace-nowrap ${
                activeDestTab === "country"
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Country
            </button>
            <button
              onClick={() => setActiveDestTab("region")}
              className={`px-5 py-2.5 rounded-full text-[15px] font-semibold transition-colors whitespace-nowrap ${
                activeDestTab === "region"
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Region
            </button>
            <button
              onClick={() => setActiveDestTab("ultra")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[15px] font-semibold transition-colors whitespace-nowrap ${
                activeDestTab === "ultra"
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Ultra Plan
              <span className="bg-[#0da976] text-white text-[10px] font-bold px-1.5 py-[3px] rounded-full leading-none">
                New
              </span>
            </button>
          </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {isLoading
              ? Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-[#f5f5f5] rounded-2xl px-5 py-4 flex items-center gap-4">
                    <Skeleton className="w-11 h-11 rounded-full shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-2/5" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))
              : shownDestinations.length === 0 ? (
                  <div className="col-span-3 py-10 text-center text-gray-400 text-[14px]">
                    No plans found for this category.
                  </div>
                )
              : shownDestinations.map((dest) => (
                  <Link key={dest.locationCode} href={`/destination/${dest.locationCode}`}>
                    <div className="group flex items-center gap-4 bg-[#f5f5f5] hover:bg-[#eaeaea] transition-colors rounded-2xl px-5 py-4 cursor-pointer">
                      <img
                        src={dest.flagUrl}
                        alt={`${dest.locationName} flag`}
                        className="w-[52px] h-[34px] rounded-[5px] object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-[15.5px] leading-tight truncate">
                          {dest.locationName}
                        </p>
                        <p className="text-gray-500 text-[13px] mt-0.5">
                          From {fmt(dest.lowestPrice)}
                        </p>
                      </div>
                      <ChevronRight className="w-[17px] h-[17px] text-gray-400 group-hover:text-gray-600 shrink-0" />
                    </div>
                  </Link>
                ))}
          </div>

          <Link href="/destinations">
            <button className="w-full mt-5 sm:hidden bg-[#0da976] hover:bg-[#0b9068] transition-colors text-white font-bold text-[15px] py-4 rounded-full">
              View All Destinations
            </button>
          </Link>

        </div>
      </section>

      {/* ════════════════════════════════════
          eSIM INFO CAROUSEL — 3 slides (slide 1 CMS-driven)
      ════════════════════════════════════ */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="relative rounded-[28px] overflow-hidden" style={{ minHeight: 420 }}>

            {/* ── SLIDE 1: What is an eSIM? (CMS-driven) ── */}
            {(() => {
              const hex = cms.esimInfo.bgColor || "#dcf0f5";
              const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
              const rgb = `${r},${g},${b}`;
              return (
            <div
              className="absolute inset-0 flex items-center transition-opacity duration-700"
              style={{ opacity: activeEsimSlide === 0 ? 1 : 0, pointerEvents: activeEsimSlide === 0 ? "auto" : "none" }}
            >
              {cms.esimInfo.video ? (
                <video src={cms.esimInfo.video} className="absolute inset-0 w-full h-full object-cover object-center" autoPlay muted loop playsInline />
              ) : (
                <img src={cms.esimInfo.photo || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1400&h=700&q=85"} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
              )}
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(to right, rgba(${rgb},1) 0%, rgba(${rgb},0.96) 28%, rgba(${rgb},0.65) 52%, rgba(${rgb},0) 70%)` }}
              />
              <div className="relative z-10 px-6 py-8 sm:pl-16 sm:py-16 max-w-[500px]">
                <h2 className="text-gray-900 mb-4 text-[26px] sm:text-[40px] font-medium leading-tight sm:leading-[52px]" style={{ fontSize: (cms.esimInfo.headingSize || 40) + 'px' }}>{cms.esimInfo.heading}</h2>
                <p className="text-gray-700 leading-relaxed mb-6" style={{ maxWidth: 400, fontSize: (cms.esimInfo.descSize || 14) + 'px' }}>
                  {cms.esimInfo.description}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-gray-600 mb-7">
                  <span className="flex items-center gap-1.5"><Smartphone className="w-[13px] h-[13px]" />{cms.esimInfo.badge1}</span>
                  <span className="text-gray-400">|</span>
                  <span className="flex items-center gap-1.5"><Download className="w-[13px] h-[13px]" />{cms.esimInfo.badge2}</span>
                  <span className="text-gray-400">|</span>
                  <span className="flex items-center gap-1.5"><Smile className="w-[13px] h-[13px]" />{cms.esimInfo.badge3}</span>
                </div>
                <Link href={cms.esimInfo.btnHref || "/destinations"}>
                  <button className="bg-gray-900 hover:bg-gray-700 transition-colors text-white font-semibold text-[15px] px-8 py-3.5 rounded-full">{cms.esimInfo.btnLabel}</button>
                </Link>
              </div>
              <div className="hidden sm:flex absolute z-10 right-[18%] top-[14%] w-[52px] h-[52px] bg-white rounded-2xl shadow-lg items-center justify-center">
                <QrCode className="w-[26px] h-[26px] text-gray-700" />
              </div>
              <div className="hidden sm:flex absolute z-10 right-[26%] bottom-[18%] w-[46px] h-[46px] bg-white rounded-full shadow-lg items-center justify-center">
                <Wifi className="w-[22px] h-[22px] text-gray-700" />
              </div>
            </div>
            );})()}

            {/* ── SLIDE 2: Enjoy unlimited data in 3 steps (CMS) ── */}
            <div
              className="absolute inset-0 flex items-center transition-opacity duration-700"
              style={{ opacity: activeEsimSlide === 1 ? 1 : 0, pointerEvents: activeEsimSlide === 1 ? "auto" : "none", background: cms.esimInfo.slide2BgColor || "#fef9f2" }}
            >
              <div className="absolute top-0 right-0 w-[260px] h-[260px] opacity-10 pointer-events-none overflow-hidden">
                <svg viewBox="0 0 260 260" fill="none" className="w-full h-full">
                  <text x="10" y="200" fontFamily="Georgia, serif" fontSize="180" fill="#c8a96e" fontStyle="italic">Lo</text>
                </svg>
              </div>

              <div className="relative z-10 px-5 py-8 sm:pl-14 sm:py-12 w-full sm:w-[46%] flex flex-col justify-center">
                <h2 className="text-gray-900 mb-1 text-[26px] sm:text-[40px] font-medium leading-tight sm:leading-[52px]" style={{ fontSize: (cms.esimInfo.slide2HeadingSize || 40) + 'px' }}>
                  {cms.esimInfo.slide2Heading || "Enjoy unlimited data in 3 steps"}
                </h2>
                <svg width="90" height="14" viewBox="0 0 90 14" fill="none" className="mb-8">
                  <path d="M2 9 Q12 2 22 9 Q32 16 42 9 Q52 2 62 9 Q72 16 82 9" stroke="#111" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                </svg>
                <div className="hidden sm:block relative h-[200px] w-[320px]">
                  <img
                    src={cms.esimInfo.slide2Photo1 || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=320&h=200&q=80"}
                    alt=""
                    className="absolute left-0 top-0 w-[160px] h-[180px] object-cover rounded-[18px] shadow-md"
                  />
                  <img
                    src={cms.esimInfo.slide2Photo2 || "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=320&h=200&q=80"}
                    alt=""
                    className="absolute right-0 bottom-0 w-[175px] h-[195px] object-cover rounded-[18px] shadow-lg"
                    style={{ objectPosition: "center top" }}
                  />
                </div>
              </div>

              <div className="relative z-10 flex-1 px-5 py-8 sm:pr-14 sm:py-12 flex flex-col gap-3">
                {(cms.esimInfo.slide2Steps ?? []).map((step, idx) => {
                  const icons = ["/icons/map.json", "/icons/simcard.json", "/icons/wifi.json"];
                  return (
                    <div key={idx} className="bg-white rounded-2xl px-5 py-4 flex items-start gap-4 shadow-sm">
                      <span className="text-[#d63154] font-bold text-[15px] shrink-0 mt-0.5 w-8">{step.num}</span>
                      <div className="w-[46px] h-[46px] rounded-[14px] border border-gray-200 flex items-center justify-center shrink-0">
                        <LottieIcon src={step.icon || icons[idx] || "/icons/map.json"} size={28} playOnHover />
                      </div>
                      <div className="flex-1">
                        <p className="text-[13.5px] text-gray-800 leading-snug">
                          {step.title} {step.body}
                        </p>
                        {idx === 0 && (
                          <Link href="/destinations">
                            <span className="text-[12.5px] text-gray-500 hover:text-gray-800 underline underline-offset-2 cursor-pointer flex items-center gap-1 mt-1">
                              Check compatibility list <span>→</span>
                            </span>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── SLIDE 3: Compatible with your device (CMS) ── */}
            {(() => {
              const hex3 = cms.esimInfo.slide3BgColor || "#e8f4ea";
              const r3 = parseInt(hex3.slice(1,3),16), g3 = parseInt(hex3.slice(3,5),16), b3 = parseInt(hex3.slice(5,7),16);
              const rgb3 = `${r3},${g3},${b3}`;
              return (
              <div
                className="absolute inset-0 flex items-center transition-opacity duration-700"
                style={{ opacity: activeEsimSlide === 2 ? 1 : 0, pointerEvents: activeEsimSlide === 2 ? "auto" : "none" }}
              >
                {cms.esimInfo.slide3Video ? (
                  <video src={cms.esimInfo.slide3Video} className="absolute inset-0 w-full h-full object-cover object-center" autoPlay muted loop playsInline />
                ) : (
                  <img src={cms.esimInfo.slide3Photo || "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1400&h=700&q=85"} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
                )}
                <div className="absolute inset-0" style={{ background: `linear-gradient(to right, rgba(${rgb3},1) 0%, rgba(${rgb3},0.96) 28%, rgba(${rgb3},0.65) 52%, rgba(${rgb3},0) 70%)` }} />
                <div className="relative z-10 px-6 py-8 sm:pl-16 sm:py-16 max-w-[500px]">
                  <h2 className="text-gray-900 mb-4 text-[26px] sm:text-[40px] font-medium leading-tight sm:leading-[52px]" style={{ fontSize: (cms.esimInfo.slide3HeadingSize || 40) + 'px' }}>
                    {cms.esimInfo.slide3Heading1 || "Works on your"}<br />{cms.esimInfo.slide3Heading2 || "device"}
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-6" style={{ maxWidth: 400, fontSize: (cms.esimInfo.slide3DescSize || 14) + 'px' }}>
                    {cms.esimInfo.slide3Description}
                  </p>
                  <div className="flex flex-col gap-2.5 mb-7">
                    {(cms.esimInfo.slide3Bullets ?? []).map((d, i) => (
                      <span key={i} className="flex items-center gap-2 text-[13.5px] text-gray-700">
                        <Check className="w-4 h-4 text-green-600 shrink-0" />{d}
                      </span>
                    ))}
                  </div>
                  <Link href={cms.esimInfo.slide3BtnHref || "/destinations"}>
                    <button className="bg-gray-900 hover:bg-gray-700 transition-colors text-white font-semibold text-[15px] px-8 py-3.5 rounded-full">
                      {cms.esimInfo.slide3BtnLabel || "Check compatibility"}
                    </button>
                  </Link>
                </div>
              </div>
              );
            })()}

            {/* Spacer for container height */}
            <div className="invisible px-6 py-8 sm:pl-16 sm:py-16 max-w-[500px]" aria-hidden>
              <div className="text-[2rem] font-bold mb-4">placeholder<br />line</div>
              <div className="text-[14.5px] mb-6">placeholder body text placeholder body text placeholder body</div>
              <div className="flex gap-4 mb-7"><span>tag</span><span>|</span><span>tag</span></div>
              <div className="px-8 py-3.5 rounded-full inline-block">btn</div>
            </div>

            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {Array.from({ length: ESIM_SLIDE_COUNT }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveEsimSlide(i)}
                  className={`block rounded-full transition-all duration-300 ${
                    i === activeEsimSlide
                      ? "w-6 h-[8px] bg-gray-900"
                      : "w-[8px] h-[8px] bg-gray-400/60 hover:bg-gray-600"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          WHY CHOOSE VOLTEY? (CMS-driven)
      ════════════════════════════════════ */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <p className="text-gray-400 font-normal mb-3" style={{ fontSize: (cms.features.badgeSize || 12) + 'px' }}>{cms.features.sectionBadge}</p>
          <h2 className="text-gray-900 mb-12 text-[26px] sm:text-[40px] font-medium leading-tight sm:leading-[52px]" style={{ fontSize: (cms.features.headingSize || 40) + 'px' }}>
            {cms.features.heading}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-10">
            {featureItems.map((feat, idx) => (
              <div key={idx}>
                <div className="mb-3">
                  {FEATURE_ICONS[idx]}
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5" style={{ fontSize: (cms.features.itemTitleSize || 15) + 'px' }}>{feat.title}</h3>
                <p className="text-gray-500 leading-relaxed" style={{ fontSize: (cms.features.itemBodySize || 13) + 'px' }}>
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          GOT YOU COVERED — 3×2 feature grid
      ════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">

          <h2 className="text-gray-900 text-center text-[26px] sm:text-[40px] font-medium leading-tight sm:leading-[52px] whitespace-pre-line" style={{ maxWidth: 620, margin: "0 auto 3.5rem", fontSize: ((cms.features as any).gotYouCoveredHeadingSize || 40) + 'px' }}>
            {(cms.features as any).gotYouCoveredHeading || "Enjoy reliable and affordable internet\nin your trips. We got you covered."}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-12">

            <div>
              <div className="mb-5 h-[90px] flex items-end">
                {cms.features.gotYouCoveredImages?.[0]
                  ? <img src={cms.features.gotYouCoveredImages[0]} className="h-[80px] w-auto object-contain" alt="" />
                  : <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { bg: "#25D366", label: "WA",  icon: "M" },
                    { bg: "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)", label: "IG", icon: "I" },
                    { bg: "#1877F2", label: "FB",  icon: "f" },
                    { bg: "#000000", label: "TT",  icon: "♪" },
                    { bg: "#1DB954", label: "SP",  icon: "♬" },
                    { bg: "#000000", label: "UB",  icon: "U" },
                    { bg: "#4285F4", label: "MP",  icon: "📍" },
                    { bg: "#EA4335", label: "GM",  icon: "M" },
                  ].map(({ bg, label, icon }, i) => (
                    <div
                      key={i}
                      className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center text-white text-[15px] font-bold select-none"
                      style={{ background: bg, fontSize: 16 }}
                      title={label}
                    >
                      {icon}
                    </div>
                  ))}
                </div>
                }
              </div>
              <h3 className="font-bold text-gray-900 text-[19px] mb-2 leading-snug">{((cms.features as any).gotYouCoveredItems?.[0] || {}).title || "Keep using your favorite Apps"}</h3>
              <p className="text-gray-500 text-[13.5px] leading-relaxed">{renderBold(((cms.features as any).gotYouCoveredItems?.[0] || {}).desc || "Get that safe ride home, find that great restaurant, and pin the local attractions, **all while staying connected with your loved ones.**")}</p>
            </div>

            <div>
              <div className="mb-5 h-[90px] flex items-end">
                {cms.features.gotYouCoveredImages?.[1]
                  ? <img src={cms.features.gotYouCoveredImages[1]} className="h-[80px] w-auto object-contain" alt="" />
                  : <svg width="84" height="80" viewBox="0 0 84 80" fill="none">
                  <ellipse cx="42" cy="64" rx="28" ry="8" fill="#F5C518" opacity=".4"/>
                  <ellipse cx="42" cy="58" rx="28" ry="8" fill="#F5C518"/>
                  <rect x="14" y="50" width="56" height="8" fill="#E8B800"/>
                  <ellipse cx="42" cy="50" rx="28" ry="8" fill="#FFD95A"/>
                  <rect x="14" y="42" width="56" height="8" fill="#E8B800"/>
                  <ellipse cx="42" cy="42" rx="28" ry="8" fill="#FFD95A"/>
                  <rect x="14" y="34" width="56" height="8" fill="#D4A800"/>
                  <ellipse cx="42" cy="34" rx="28" ry="8" fill="#F5C518"/>
                  <path d="M72 14 L74 10 L76 14 L80 16 L76 18 L74 22 L72 18 L68 16Z" fill="#FFD95A"/>
                  <path d="M8 8 L9.5 5 L11 8 L14 9.5 L11 11 L9.5 14 L8 11 L5 9.5Z" fill="#F5C518"/>
                  <circle cx="66" cy="6" r="3" fill="#FFD95A" opacity=".7"/>
                </svg>}
              </div>
              <h3 className="font-bold text-gray-900 text-[19px] mb-2 leading-snug">{((cms.features as any).gotYouCoveredItems?.[1] || {}).title || "Earn Voltey Rewards after buying"}</h3>
              <p className="text-gray-500 text-[13.5px] leading-relaxed">{renderBold(((cms.features as any).gotYouCoveredItems?.[1] || {}).desc || "**Earn reward points** when you buy an eSIM or refer a friend, and use them on future purchases!")}</p>
            </div>

            <div>
              <div className="mb-5 h-[90px] flex items-end">
                {cms.features.gotYouCoveredImages?.[2]
                  ? <img src={cms.features.gotYouCoveredImages[2]} className="h-[80px] w-auto object-contain" alt="" />
                  : <svg width="90" height="80" viewBox="0 0 90 80" fill="none">
                  <rect x="22" y="8" width="36" height="62" rx="6" fill="#f0f0f0" stroke="#ddd" strokeWidth="1.5"/>
                  <rect x="26" y="16" width="28" height="46" rx="3" fill="white"/>
                  <rect x="28" y="26" width="22" height="14" rx="5" fill="#25D366"/>
                  <path d="M28 40 L24 44 L32 40" fill="#25D366"/>
                  <circle cx="33" cy="33" r="2" fill="white" opacity=".8"/>
                  <circle cx="39" cy="33" r="2" fill="white" opacity=".8"/>
                  <circle cx="45" cy="33" r="2" fill="white" opacity=".8"/>
                  <rect x="28" y="46" width="16" height="10" rx="4" fill="#eee"/>
                  <circle cx="68" cy="24" r="16" fill="#25D366"/>
                  <path d="M68 14C62.5 14 58 18.5 58 24C58 25.9 58.6 27.6 59.5 29L58 34L63.2 32.5C64.6 33.4 66.2 34 68 34C73.5 34 78 29.5 78 24C78 18.5 73.5 14 68 14Z" fill="white" opacity=".2"/>
                  <path d="M63 21.5C63.2 21 63.6 20 64.3 20C64.6 20 64.9 20 65.1 20.6L65.9 22.5C66 22.8 65.9 23 65.7 23.3L65.1 24C64.9 24.2 64.8 24.5 64.9 24.8C65.3 25.8 66.1 27 67.3 27.9C68.1 28.5 68.9 28.9 69.3 29.1C69.6 29.2 69.9 29.1 70.1 28.9L70.7 28.2C71 27.9 71.3 27.8 71.6 27.9L73.6 28.8C74.3 29.1 74.3 29.6 74.1 30C73.7 31 72.8 32 71.7 32.1C70.1 32.3 67.6 31.8 64.9 29.1C62.3 26.5 61.8 24.1 62 22.5C62.1 21.5 63 21.5 63 21.5Z" fill="white"/>
                </svg>}
              </div>
              <h3 className="font-bold text-gray-900 text-[19px] mb-2 leading-snug">{((cms.features as any).gotYouCoveredItems?.[2] || {}).title || "Keep your WhatsApp number"}</h3>
              <p className="text-gray-500 text-[13.5px] leading-relaxed">{renderBold(((cms.features as any).gotYouCoveredItems?.[2] || {}).desc || "You can call and message all your contacts on WhatsApp, **like you're in the same country.** Don't lose touch with family and friends.")}</p>
            </div>

            <div>
              <div className="mb-5 h-[90px] flex items-end">
                {cms.features.gotYouCoveredImages?.[3]
                  ? <img src={cms.features.gotYouCoveredImages[3]} className="h-[80px] w-auto object-contain" alt="" />
                  : <svg width="90" height="88" viewBox="0 0 90 88" fill="none">
                  <circle cx="44" cy="50" r="36" fill="#fde8e8"/>
                  <rect x="30" y="58" width="28" height="20" rx="6" fill="#e05555"/>
                  <circle cx="44" cy="48" r="12" fill="#f9c5a0"/>
                  <path d="M32 46C32 38 36 34 44 34C52 34 56 38 56 46" fill="#4a2e1a"/>
                  <path d="M30 46C30 34 36 28 44 28C52 28 58 34 58 46" stroke="#333" strokeWidth="3" fill="none"/>
                  <rect x="27" y="44" width="6" height="10" rx="3" fill="#333"/>
                  <rect x="57" y="44" width="6" height="10" rx="3" fill="#333"/>
                  <path d="M58 52 L62 52 L62 56" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <rect x="34" y="62" width="20" height="8" rx="4" fill="#fff" opacity=".6"/>
                  <text x="44" y="69" fontSize="5" fill="#e05555" textAnchor="middle" fontWeight="bold">Voltey</text>
                </svg>}
              </div>
              <h3 className="font-bold text-gray-900 text-[19px] mb-2 leading-snug">{((cms.features as any).gotYouCoveredItems?.[3] || {}).title || "24/7 Customer support"}</h3>
              <p className="text-gray-500 text-[13.5px] leading-relaxed">{renderBold(((cms.features as any).gotYouCoveredItems?.[3] || {}).desc || "In need of assistance? **Our 24/7 chat support** is just a message away to keep you connected and **help you** with everything you need.")}</p>
            </div>

            <div>
              <div className="mb-5 h-[90px] flex items-end">
                {cms.features.gotYouCoveredImages?.[4]
                  ? <img src={cms.features.gotYouCoveredImages[4]} className="h-[80px] w-auto object-contain" alt="" />
                  : <svg width="90" height="80" viewBox="0 0 90 80" fill="none">
                  <rect x="8" y="28" width="56" height="36" rx="6" fill="#e8f4ea" stroke="#b6debb" strokeWidth="1.5" transform="rotate(-8 8 28)"/>
                  <rect x="12" y="26" width="56" height="36" rx="6" fill="#d0ecd4" stroke="#a3d4a8" strokeWidth="1.5" transform="rotate(-3 12 26)"/>
                  <rect x="16" y="24" width="56" height="36" rx="6" fill="white" stroke="#c5e0c9" strokeWidth="1.5"/>
                  <rect x="16" y="34" width="56" height="10" fill="#25D366" opacity=".15"/>
                  <rect x="22" y="38" width="20" height="4" rx="2" fill="#25D366" opacity=".5"/>
                  <rect x="52" y="37" width="14" height="6" rx="3" fill="#25D366" opacity=".4"/>
                  <circle cx="68" cy="22" r="16" fill="#25D366"/>
                  <path d="M62 22 C62 18 65 15 68 15 C71 15 74 18 74 22" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  <path d="M60 20 L62 22 L64 20" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>}
              </div>
              <h3 className="font-bold text-gray-900 text-[19px] mb-2 leading-snug">{((cms.features as any).gotYouCoveredItems?.[4] || {}).title || "Money-back guarantee"}</h3>
              <p className="text-gray-500 text-[13.5px] leading-relaxed">
                {renderBold(((cms.features as any).gotYouCoveredItems?.[4] || {}).desc || "Purchase your Voltey eSIM with **peace of mind.** If your plans change, **you'll have up to 7 days** to request a refund.")}
                {((cms.features as any).gotYouCoveredItems?.[4] || {}).learnMoreHref && (
                  <>{" "}<Link href={((cms.features as any).gotYouCoveredItems?.[4] || {}).learnMoreHref} className="underline underline-offset-2 text-gray-600 hover:text-gray-900">Learn more</Link></>
                )}
              </p>
            </div>

            <div>
              <div className="mb-5 h-[90px] flex items-end">
                {cms.features.gotYouCoveredImages?.[5]
                  ? <img src={cms.features.gotYouCoveredImages[5]} className="h-[80px] w-auto object-contain" alt="" />
                  : <svg width="90" height="80" viewBox="0 0 90 80" fill="none">
                  <rect x="10" y="50" width="14" height="22" rx="3" fill="#d1e8fb"/>
                  <rect x="30" y="36" width="14" height="36" rx="3" fill="#7ec8f5"/>
                  <rect x="50" y="20" width="14" height="52" rx="3" fill="#2fa8e0"/>
                  <g transform="translate(58 6) rotate(30)">
                    <path d="M10 0 C10 0 20 8 20 20 L10 26 L0 20 C0 8 10 0 10 0Z" fill="#2fa8e0" opacity=".9"/>
                    <circle cx="10" cy="14" r="4" fill="white" opacity=".8"/>
                    <path d="M4 22 L0 28 L6 26Z" fill="#e05555" opacity=".8"/>
                    <path d="M16 22 L20 28 L14 26Z" fill="#e05555" opacity=".8"/>
                  </g>
                  <line x1="72" y1="30" x2="82" y2="24" stroke="#2fa8e0" strokeWidth="2" strokeLinecap="round" opacity=".5"/>
                  <line x1="74" y1="36" x2="86" y2="34" stroke="#2fa8e0" strokeWidth="2" strokeLinecap="round" opacity=".3"/>
                </svg>}
              </div>
              <h3 className="font-bold text-gray-900 text-[19px] mb-2 leading-snug">{((cms.features as any).gotYouCoveredItems?.[5] || {}).title || "Fast and reliable Internet connection"}</h3>
              <p className="text-gray-500 text-[13.5px] leading-relaxed">{renderBold(((cms.features as any).gotYouCoveredItems?.[5] || {}).desc || "Connect to the **best networks at your destination** and get internet that is consistent and high-speed.")}</p>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          HOW DOES VOLTEY WORK? (CMS-driven)
      ════════════════════════════════════ */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">

          <p className="text-[13px] text-gray-400 font-normal mb-3">How to use the Voltey eSIM service</p>

          <h2 className="text-gray-900 mb-3 text-[26px] sm:text-[40px] font-medium leading-tight sm:leading-[52px]" style={{ fontSize: (cms.steps.headingSize || 40) + 'px' }}>
            {cms.steps.heading}
          </h2>

          <p className="text-gray-500 text-[15px] mb-12">
            Don't have the Voltey eSIM app yet? Download it from the App Store or Google Play.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Card 1 */}
            <div className="bg-[#f5f5f5] rounded-2xl p-6 flex flex-col" style={{ minHeight: 400 }}>
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white border border-gray-200 text-[13px] text-gray-500 font-medium mb-5 self-start">1</span>
              <h3 className="font-bold text-gray-900 leading-snug mb-2" style={{ fontSize: (cms.steps.itemTitleSize || 17) + 'px' }}>
                {stepItems[0]?.title}
              </h3>
              <p className="text-gray-500 leading-relaxed mb-6" style={{ fontSize: (cms.steps.itemBodySize || 13) + 'px' }}>
                {stepItems[0]?.desc}
              </p>
              <div className="mt-auto mx-auto w-full max-w-[240px]">
                <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}>
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-200 shrink-0" />
                    <div className="flex-1">
                      <div className="h-2.5 bg-gray-100 rounded-full w-14 mb-1.5" />
                      <div className="h-2 bg-gray-100 rounded-full w-10" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-3 mx-1 my-1 border-2 border-gray-900 rounded-xl">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-900 shrink-0 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-gray-900" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-[12px] leading-none mb-0.5">50 GB</p>
                      <p className="text-gray-500 text-[11px]">30 days</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-100">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-200 shrink-0" />
                    <div className="flex-1">
                      <div className="h-2.5 bg-gray-100 rounded-full w-14 mb-1.5" />
                      <div className="h-2 bg-gray-100 rounded-full w-10" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-[#f5f5f5] rounded-2xl p-6 flex flex-col" style={{ minHeight: 400 }}>
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white border border-gray-200 text-[13px] text-gray-500 font-medium mb-5 self-start">2</span>
              <h3 className="font-bold text-gray-900 leading-snug mb-2" style={{ fontSize: (cms.steps.itemTitleSize || 17) + 'px' }}>
                {stepItems[1]?.title}
              </h3>
              <p className="text-gray-500 leading-relaxed mb-6" style={{ fontSize: (cms.steps.itemBodySize || 13) + 'px' }}>
                {stepItems[1]?.desc}
              </p>
              <div className="mt-auto flex flex-col items-center pb-8">
                <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center mb-3" style={{ background: "#f5c842" }}>
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <polyline points="8,18 15,26 28,10" stroke="#111" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-gray-600 font-medium text-[13px]">eSIM installed</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-[#f5f5f5] rounded-2xl p-6 flex flex-col" style={{ minHeight: 400 }}>
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white border border-gray-200 text-[13px] text-gray-500 font-medium mb-5 self-start">3</span>
              <h3 className="font-bold text-gray-900 leading-snug mb-2" style={{ fontSize: (cms.steps.itemTitleSize || 17) + 'px' }}>
                {stepItems[2]?.title}
              </h3>
              <p className="text-gray-500 leading-relaxed mb-6" style={{ fontSize: (cms.steps.itemBodySize || 13) + 'px' }}>
                {stepItems[2]?.desc}
              </p>
              <div className="mt-auto mx-auto w-full max-w-[240px]">
                <div className="bg-white rounded-2xl px-4 py-4" style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <img src="https://flagcdn.com/w160/es.png" alt="Spain" className="w-6 h-[14px] object-cover rounded-[3px]" />
                      <span className="font-semibold text-gray-900 text-[13px]">Spain</span>
                    </div>
                    <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Active</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px] mb-2">
                    <span className="text-gray-400">Remaining data</span>
                    <span className="font-semibold text-gray-900">50 GB / 50 GB</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-gray-400">Expires in</span>
                    <span className="font-semibold text-gray-900">30 days</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          REVIEWS FROM TRAVELERS (CMS heading + hardcoded masonry)
      ════════════════════════════════════ */}
      <section className="py-20" style={{ background: "#eaecf4" }}>
        <div className="max-w-[1160px] mx-auto px-4 sm:px-8">

          <div className="text-center mb-12">
            <h2 className="text-gray-900 mb-3 text-[26px] sm:text-[40px] font-medium leading-tight sm:leading-[52px]" style={{ fontSize: (cms.reviews.headingSize || 40) + 'px' }}>
              {cms.reviews.heading}
            </h2>
            <p className="text-gray-400 text-[15px]">
              Check out what fellow travelers are saying about Voltey!
            </p>
          </div>

          {/* CMS-added text reviews (shown first if any) */}
          {cms.reviews.items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {cms.reviews.items.filter(r => !r.youtubeId).map((r, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-gray-900" style={{ fontSize: (cms.reviews.nameSize || 14) + 'px' }}>{r.name}</span>
                    <span className="text-[12px] text-gray-400">{r.location}</span>
                  </div>
                  <p className="text-gray-600 leading-relaxed mb-4" style={{ fontSize: (cms.reviews.bodySize || 13) + 'px' }}>{r.text}</p>
                  <Stars n={Number(r.rating) || 5} />
                </div>
              ))}
              {cms.reviews.items.filter(r => r.youtubeId).map((r, i) => (
                <div key={`yt-${i}`} className="rounded-2xl overflow-hidden shadow-sm" style={{ aspectRatio: "16/9" }}>
                  <YouTubeVideo videoId={r.youtubeId} title={r.name} />
                </div>
              ))}
            </div>
          )}

          {/* ── CMS-driven masonry layout ── */}
          {(function renderMasonry() {
            const items: any[] = cms.reviews.masonryItems || [];
            const n = items.length;
            if (n === 0) return null;
            const colSize = Math.floor(n / 4);
            const cols = [
              items.slice(0, colSize),
              items.slice(colSize, 2 * colSize),
              items.slice(2 * colSize, 3 * colSize),
              items.slice(3 * colSize),
            ];
            return (
              <div
                className="flex gap-4 items-start overflow-x-auto pb-4 sm:pb-0 sm:grid sm:overflow-visible"
                style={{ gridTemplateColumns: "1fr 1.3fr 1fr 1fr" }}
              >
                {cols.map((col, ci) => (
                  <div key={ci} className="flex flex-col gap-4 w-[80vw] sm:w-auto shrink-0 sm:shrink">
                    {col.map((item, ii) => <MasonryCard key={`${ci}-${ii}`} item={item} i={`${ci}-${ii}`} />)}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </section>

      {/* ════════════════════════════════════
          PROMO CARD SLIDER (CMS-driven)
      ════════════════════════════════════ */}
      {PROMO_CARDS.length > 0 && (
        <section className="py-8 bg-white mt-[40px] mb-[40px]">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="relative rounded-3xl overflow-hidden min-h-[320px] sm:h-[440px]" style={{ background: "#eef1f8" }}>

              {PROMO_CARDS.map((card, i) => (
                <div
                  key={i}
                  className="absolute inset-0 transition-opacity duration-700"
                  style={{
                    opacity: i === activePromoCard ? 1 : 0,
                    pointerEvents: i === activePromoCard ? "auto" : "none",
                    ...(!card.video && card.photo ? { backgroundImage: `url(${card.photo})`, backgroundSize: "cover", backgroundPosition: "center" } : {}),
                  }}
                >
                  {/* Video background (overrides photo) */}
                  {card.video && (
                    <video
                      key={card.video}
                      src={card.video}
                      autoPlay muted loop playsInline
                      className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                  )}
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to right, rgba(238,241,248,0.97) 0%, rgba(238,241,248,0.88) 45%, rgba(238,241,248,0.0) 100%)" }}
                  />

                  <div className="relative z-10 flex flex-col justify-center h-full px-6 sm:px-14 w-full sm:w-1/2">
                    <h2 className="text-gray-900 mb-3 whitespace-pre-line text-[24px] sm:text-[40px] font-medium leading-tight sm:leading-[52px]" style={{ fontSize: (cms.slidesSizes?.headingSize || 40) + 'px' }}>
                      {card.heading || (card as any).title || ""}
                    </h2>
                    <p className="text-gray-600 leading-relaxed mb-6" style={{ maxWidth: 340, fontSize: (cms.slidesSizes?.bodySize || 13) + 'px' }}>
                      {card.body || (card as any).subtitle || ""}
                    </p>
                    <div>
                      <Link href={card.ctaHref || (card as any).btnHref || "/destinations"}>
                        <button className="border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors text-[14px] font-semibold px-6 py-2.5 rounded-full">
                          {card.cta || (card as any).btnLabel || ""}
                        </button>
                      </Link>
                    </div>
                  </div>

                  {card.icon && (
                    <div className="absolute bottom-7 right-10 text-[3rem] drop-shadow-lg select-none">
                      {card.icon}
                    </div>
                  )}
                </div>
              ))}

              {PROMO_CARDS.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {PROMO_CARDS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePromoCard(i)}
                      className={`block rounded-full transition-all duration-300 ${
                        i === activePromoCard
                          ? "w-6 h-[7px] bg-gray-900"
                          : "w-[7px] h-[7px] bg-gray-400/60 hover:bg-gray-600"
                      }`}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}

            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════
          FAQ (CMS-driven)
      ════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-[900px] mx-auto px-4 sm:px-8">

          <h2 className="text-gray-900 text-center mb-10 text-[26px] sm:text-[40px] font-medium leading-tight sm:leading-[52px]" style={{ fontSize: (cms.faq.headingSize || 40) + 'px' }}>
            {cms.faq.heading}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cms.faq.items.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className={`rounded-xl border cursor-pointer transition-all duration-200 ${
                    isOpen ? "border-gray-900" : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                >
                  <div className="flex items-center justify-between px-5 py-4 gap-4">
                    <span className="text-gray-900 leading-snug font-normal" style={{ fontSize: (cms.faq.questionSize || 15) + 'px' }}>
                      {item.question}
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    >
                      <path d="M3 6l5 5 5-5" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {isOpen && (
                    <div className="px-5 pb-5">
                      <p className="text-gray-500 leading-relaxed" style={{ fontSize: (cms.faq.answerSize || 14) + 'px' }}>
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════
          DOWNLOAD APP SECTION (CMS-driven)
      ════════════════════════════════════ */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row items-center py-10 sm:py-0" style={{ minHeight: 440 }}>

            <div className="w-full sm:w-1/2 sm:pr-16 flex flex-col justify-center pb-8 sm:pb-0">

              <div className="flex items-center gap-2 mb-5">
                <span className="text-[14px] font-bold text-gray-900">Excellent</span>
                <span className="text-[14px] text-gray-600">4.7 out of 5</span>
                <Star size={14} className="fill-green-500 text-green-500" />
                <span className="text-[14px] font-semibold text-gray-700">Trustpilot</span>
              </div>

              <h2 className="text-gray-900 mb-4 text-[26px] sm:text-[40px] font-medium leading-tight sm:leading-[52px]" style={{ fontSize: (cms.app.headingSize || 40) + 'px' }}>
                {cms.app.heading}
              </h2>

              <p className="font-normal text-gray-500 leading-relaxed mb-7" style={{ maxWidth: 420, fontSize: (cms.app.bodySize || 14) + 'px' }}>
                {cms.app.description}
              </p>

              <div className="flex items-center gap-4">
                <a href={cms.app.appStoreHref || "#"} className="block">
                  <img src={appStoreSvg} alt="Download on the App Store" className="h-[44px] w-auto" />
                </a>
                <a href={cms.app.playStoreHref || "#"} className="block">
                  <img src={googlePlaySvg} alt="Get it on Google Play" className="h-[44px] w-auto" />
                </a>
              </div>
            </div>

            <div className="w-full sm:w-1/2 flex items-center justify-center h-[320px] sm:h-full py-4 sm:py-8">
              <div
                className="relative w-full h-full rounded-3xl overflow-hidden flex items-center justify-end"
                style={{
                  backgroundImage: `url(${cms.app.photo || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&h=500&q=80"})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div
                  className="absolute"
                  style={{
                    width: 320,
                    height: 320,
                    background: "#0da976",
                    borderRadius: "60% 40% 55% 45%",
                    top: "50%",
                    right: -40,
                    transform: "translateY(-50%)",
                    opacity: 0.88,
                  }}
                />

                <div
                  className="relative z-10 mr-16 flex flex-col items-center justify-center bg-[#0da976] rounded-[2rem] shadow-2xl"
                  style={{ width: 180, height: 300 }}
                >
                  <div className="bg-white rounded-[1.4rem] flex items-center justify-center" style={{ width: 150, height: 260 }}>
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://voltey.app&bgcolor=ffffff&color=000000&format=png&margin=4"
                      alt="QR Code"
                      className="w-[130px] h-[130px]"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}

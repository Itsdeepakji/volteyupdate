import { Link } from "wouter";
import { Home, Globe } from "lucide-react";
import { LottieIcon } from "@/components/LottieIcon";

export default function NotFound() {
  return (
    <div
      className="min-h-[calc(100vh-116px)] relative overflow-hidden flex items-center"
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      <style>{`
        @keyframes nf-float1 {
          0%,100% { transform: translateY(0px) rotate(-3deg); }
          50%      { transform: translateY(-18px) rotate(3deg); }
        }
        @keyframes nf-float2 {
          0%,100% { transform: translateY(-10px) rotate(4deg); }
          50%      { transform: translateY(10px) rotate(-4deg); }
        }
        @keyframes nf-float3 {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-22px); }
        }
        @keyframes nf-ring {
          0%,100% { opacity:0.25; transform:scale(1); }
          50%      { opacity:0.08; transform:scale(1.14); }
        }
        @keyframes nf-dot {
          0%,100% { opacity:0.5; transform:scale(1); }
          50%      { opacity:0.2; transform:scale(1.4); }
        }
        .nf-float1 { animation: nf-float1 4.2s ease-in-out infinite; }
        .nf-float2 { animation: nf-float2 5.1s ease-in-out infinite; }
        .nf-float3 { animation: nf-float3 3.6s ease-in-out infinite; }
        .nf-ring   { animation: nf-ring   3.2s ease-in-out infinite; }
        .nf-dot    { animation: nf-dot    2.8s ease-in-out infinite; }
      `}</style>

      {/* ── Background gradient ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 50%, #f0fdf9 0%, #e6faf3 40%, #f0f9ff 100%)",
        }}
      />

      {/* ── Giant watermark "404" ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span
          className="font-black"
          style={{
            fontSize: "clamp(160px, 26vw, 360px)",
            color: "#0da976",
            opacity: 0.07,
            lineHeight: 1,
            letterSpacing: "-0.05em",
          }}
        >
          404
        </span>
      </div>

      {/* ── Main content row ── */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-8 py-20 flex items-center gap-12 lg:gap-20">

        {/* ── LEFT: animated icon cluster ── */}
        <div className="hidden lg:flex flex-1 items-center justify-center shrink-0">
          <div className="relative w-[380px] h-[380px]">

            {/* Pulse rings */}
            <div
              className="nf-ring absolute rounded-full border-2 border-[#0da976]"
              style={{ inset: "52px" }}
            />
            <div
              className="nf-ring absolute rounded-full border border-[#0da976]"
              style={{ inset: "34px", animationDelay: "0.6s" }}
            />

            {/* Centre: large globe */}
            <div className="nf-float3 absolute inset-0 flex items-center justify-center">
              <div
                className="w-40 h-40 rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/80"
                style={{
                  background:
                    "linear-gradient(135deg, #ffffff 0%, #e8faf3 100%)",
                  boxShadow:
                    "0 20px 60px rgba(13,169,118,0.18), 0 4px 16px rgba(0,0,0,0.06)",
                }}
              >
                <LottieIcon src="/icons/global.json" size={92} autoplay loop />
              </div>
            </div>

            {/* Top-left: wifi */}
            <div className="nf-float1 absolute top-8 left-8">
              <div
                className="w-[58px] h-[58px] rounded-2xl flex items-center justify-center shadow-lg border border-white/90"
                style={{ background: "#fff" }}
              >
                <LottieIcon src="/icons/wifi.json" size={32} autoplay loop />
              </div>
            </div>

            {/* Top-right: SIM card */}
            <div className="nf-float2 absolute top-4 right-10">
              <div
                className="w-[64px] h-[64px] rounded-2xl flex items-center justify-center shadow-lg border border-white/90"
                style={{ background: "#fff" }}
              >
                <LottieIcon src="/icons/simcard.json" size={36} autoplay loop />
              </div>
            </div>

            {/* Bottom-left: map */}
            <div className="nf-float2 absolute bottom-10 left-4">
              <div
                className="w-[58px] h-[58px] rounded-2xl flex items-center justify-center shadow-lg border border-white/90"
                style={{ background: "#fff" }}
              >
                <LottieIcon src="/icons/map.json" size={32} autoplay loop />
              </div>
            </div>

            {/* Bottom-right: notification */}
            <div className="nf-float1 absolute bottom-8 right-6">
              <div
                className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center shadow-md border border-white/90"
                style={{ background: "#fff" }}
              >
                <LottieIcon src="/icons/notification.json" size={28} autoplay loop />
              </div>
            </div>

            {/* Mid-right: people */}
            <div className="nf-float3 absolute top-1/2 -translate-y-1/2 right-0">
              <div
                className="w-[48px] h-[48px] rounded-2xl flex items-center justify-center shadow-md border border-white/90"
                style={{ background: "#fff" }}
              >
                <LottieIcon src="/icons/people.json" size={26} autoplay loop />
              </div>
            </div>

            {/* Dot accents */}
            <div
              className="nf-dot absolute top-[22%] right-[8%] w-3 h-3 rounded-full"
              style={{ background: "#0da976" }}
            />
            <div
              className="nf-dot absolute bottom-[22%] left-[8%] w-2.5 h-2.5 rounded-full"
              style={{ background: "#0da976", animationDelay: "0.4s" }}
            />
            <div
              className="nf-dot absolute top-[72%] right-[20%] w-2 h-2 rounded-full"
              style={{ background: "#0da976", opacity: 0.35, animationDelay: "0.8s" }}
            />
          </div>
        </div>

        {/* ── RIGHT: text & CTAs ── */}
        <div className="flex-1 max-w-[480px]">

          {/* Mobile icon */}
          <div className="flex lg:hidden justify-start mb-6">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl border border-white/80"
              style={{ background: "linear-gradient(135deg, #fff, #e8faf3)" }}
            >
              <LottieIcon src="/icons/global.json" size={48} autoplay loop />
            </div>
          </div>

          {/* Status badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 border border-[#0da976]/20"
            style={{ background: "#f0fdf9" }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#0da976] animate-pulse shrink-0" />
            <span className="text-[12.5px] font-semibold" style={{ color: "#0da976" }}>
              Error 404 — Page not found
            </span>
          </div>

          <h1 className="font-black text-gray-900 leading-[1.1] mb-5"
            style={{ fontSize: "clamp(32px, 4vw, 46px)" }}>
            Oops! You've gone<br />
            <span style={{ color: "#0da976" }}>off the grid.</span>
          </h1>

          <p className="text-[15.5px] text-gray-400 leading-relaxed mb-8 max-w-sm">
            The page you're looking for doesn't exist or may have moved.{" "}
            <span className="font-semibold text-gray-600">But don't worry</span>
            {" "}— let's get you reconnected.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3 mb-10">
            <Link href="/"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-[15px] font-bold text-white transition-all"
              style={{
                background: "#0da976",
                boxShadow: "0 8px 24px rgba(13,169,118,0.28)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 12px 32px rgba(13,169,118,0.4)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 8px 24px rgba(13,169,118,0.28)")}
            >
              <Home className="w-4 h-4" /> Back to Home
            </Link>
            <Link href="/destinations"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-[15px] font-bold border-2 border-gray-200 text-gray-700 hover:border-[#0da976] hover:text-[#0da976] hover:bg-[#f0fdf9] transition-all">
              <Globe className="w-4 h-4" /> Browse Destinations
            </Link>
          </div>

          {/* Quick links */}
          <div className="border-t border-gray-100/80 pt-6">
            <p className="text-[11.5px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Quick Links
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Home",         href: "/",             icon: "/icons/home-trend-up.json" },
                { label: "Destinations", href: "/destinations",  icon: "/icons/global.json"       },
                { label: "My Account",   href: "/account",       icon: "/icons/user.json"         },
                { label: "My eSIMs",     href: "/account",       icon: "/icons/simcard.json"      },
              ].map(({ label, href, icon }) => (
                <Link
                  key={label}
                  href={href}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-600 hover:border-[#0da976] hover:text-[#0da976] hover:bg-[#f0fdf9] transition-all"
                >
                  <LottieIcon src={icon} size={15} autoplay loop />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

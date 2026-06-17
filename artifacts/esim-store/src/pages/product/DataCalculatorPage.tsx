import { useState, useEffect } from "react";
import { Link } from "wouter";
import { LottieIcon } from "@/components/LottieIcon";
import { ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API  = import.meta.env.VITE_API_BASE ?? "";

/* ─── Activity definitions ─── */
const ACTIVITIES = [
  { key: "social",     label: "Social media",              subLabel: "Scrolling feeds 1 hour",          mbPerHour: 150,   icon: "/icons/message.json",            defaultHours: 1,   color: "#4ade80" },
  { key: "video360",   label: "Social video (360p at 0.5 FPS)", subLabel: "Videos on social media",     mbPerHour: 250,   icon: "/icons/lottie/camera.json",      defaultHours: 0,   color: "#60a5fa" },
  { key: "videoHD",    label: "Full HD video (1080p at 60 FPS)", subLabel: "Streaming or downloaded",  mbPerHour: 2500,  icon: "/icons/lottie/camera.json",      defaultHours: 0,   color: "#f59e0b" },
  { key: "music",      label: "Music",                      subLabel: "Streaming music",                 mbPerHour: 50,    icon: "/icons/notification.json",       defaultHours: 0,   color: "#a78bfa" },
  { key: "navigation", label: "Navigation",                 subLabel: "GPS & map routing",               mbPerHour: 10,    icon: "/icons/map.json",                defaultHours: 0.5, color: "#34d399" },
  { key: "browsing",   label: "Web browsing",               subLabel: "Websites, articles",              mbPerHour: 80,    icon: "/icons/global.json",             defaultHours: 1,   color: "#fb923c" },
  { key: "email",      label: "Emails and messaging",       subLabel: "Gmail, WhatsApp, Slack",          mbPerHour: 10,    icon: "/icons/message.json",            defaultHours: 0.5, color: "#38bdf8" },
  { key: "calls",      label: "Video calling (VoIP)",       subLabel: "Zoom, FaceTime, Meet",            mbPerHour: 350,   icon: "/icons/lottie/call.json",        defaultHours: 0,   color: "#f472b6" },
  { key: "downloads",  label: "Downloading and updating apps", subLabel: "App store downloads",          mbPerHour: 500,   icon: "/icons/lottie/global refresh.json", defaultHours: 0, color: "#818cf8" },
];

const PROFILES = [
  {
    key: "casual",
    label: "Casual use",
    icon: "/icons/user.json",
    preset: { social: 1, video360: 0, videoHD: 0, music: 0, navigation: 0.5, browsing: 1, email: 0.5, calls: 0, downloads: 0 },
  },
  {
    key: "remote",
    label: "Remote everyday use",
    icon: "/icons/bag.json",
    preset: { social: 1, video360: 1, videoHD: 0.5, music: 1, navigation: 0.5, browsing: 2, email: 1, calls: 1, downloads: 0.5 },
  },
  {
    key: "custom",
    label: "Personalized",
    icon: "/icons/chart.json",
    preset: null,
  },
];

function calcGB(hours: Record<string, number>): number {
  return ACTIVITIES.reduce((sum, a) => sum + (hours[a.key] ?? 0) * a.mbPerHour, 0) / 1024;
}

function recommendPlan(gb: number): string {
  if (gb < 0.5) return "500 MB";
  if (gb < 1)   return "1 GB";
  if (gb < 2)   return "2 GB";
  if (gb < 3)   return "3 GB";
  if (gb < 5)   return "5 GB";
  if (gb < 10)  return "10 GB";
  if (gb < 20)  return "20 GB";
  return "50 GB";
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left gap-4">
        <span className="font-semibold text-gray-900 text-[15px]">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && <div className="pb-4 text-[14px] text-gray-500 leading-relaxed">{a}</div>}
    </div>
  );
}

const DEFAULT_FAQS = [
  { q: "What is data throttling and how does it affect my experience?",            a: "Data throttling is when your carrier intentionally slows your internet speed after you use a set amount of data. Voltey plans never throttle — you get full speed until your plan is used." },
  { q: "How much mobile data does the average person use per day?",                a: "On average, smartphone users consume between 300 MB and 2 GB per day, depending on streaming, social media, and app usage patterns." },
  { q: "How many GB of mobile data does the average person use per month?",        a: "The average mobile data consumption is approximately 8–12 GB per month for a typical user with moderate streaming and social media use." },
  { q: "What activities consume the most data?",                                   a: "Video streaming is by far the largest data consumer — a single hour of HD video can use 2–3 GB. After that, video calls, music streaming, and social media are the biggest consumers." },
  { q: "Does browsing the internet use more data than using social media apps?",   a: "Social media actually consumes more data than web browsing in most cases, because of auto-playing videos and image-heavy feeds. Web browsing typically uses 50–100 MB per hour." },
];

const DATA_TABLE = [
  { activity: "Browsing social media",                    perHour: "50 MB" },
  { activity: "Streaming content (360p at 0.5 FPS)",      perHour: "1 GB" },
  { activity: "Streaming full video (1080p at 60 FPS)",   perHour: "2.5 GB" },
  { activity: "Watching the web",                         perHour: "50 MB" },
  { activity: "Sending email (through Gmail)",            perHour: "10 MB" },
  { activity: "Sending file via email",                   perHour: "300 MB" },
  { activity: "Working in the cloud",                     perHour: "50 MB" },
  { activity: "Sending an app update",                    perHour: "200 MB" },
];

/* ─── Donut center label ─── */
function DonutCenter({ gb }: { gb: number }) {
  const plan = recommendPlan(gb);
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <p className="text-[11px] text-gray-400 font-medium mb-0.5">Estimated</p>
      <p className="font-black text-gray-900" style={{ fontSize: gb >= 10 ? 28 : 34 }}>{plan}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">{gb.toFixed(1)} GB/trip</p>
    </div>
  );
}

export default function DataCalculatorPage() {
  const defaultHours = Object.fromEntries(ACTIVITIES.map((a) => [a.key, a.defaultHours]));
  const [hours, setHours] = useState<Record<string, number>>(defaultHours);
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(ACTIVITIES.map((a) => [a.key, a.defaultHours > 0]))
  );
  const [profile, setProfile] = useState("casual");
  const [days, setDays] = useState(7);
  const [faqs] = useState(DEFAULT_FAQS);

  /* Apply profile preset */
  const applyProfile = (pKey: string) => {
    setProfile(pKey);
    const p = PROFILES.find((x) => x.key === pKey);
    if (!p || !p.preset) return;
    const preset = p.preset as Record<string, number>;
    setHours(preset);
    setEnabled(Object.fromEntries(Object.entries(preset).map(([k, v]) => [k, v > 0])));
  };

  const setHour = (key: string, val: number) => {
    setHours((prev) => ({ ...prev, [key]: val }));
    setProfile("custom");
  };

  const toggleActivity = (key: string) => {
    const next = !enabled[key];
    setEnabled((prev) => ({ ...prev, [key]: next }));
    if (!next) setHours((prev) => ({ ...prev, [key]: 0 }));
    else setHours((prev) => ({ ...prev, [key]: ACTIVITIES.find((a) => a.key === key)?.defaultHours || 0.5 }));
    setProfile("custom");
  };

  /* Chart data */
  const chartData = ACTIVITIES
    .filter((a) => enabled[a.key] && (hours[a.key] ?? 0) > 0)
    .map((a) => ({
      name: a.label,
      value: parseFloat(((hours[a.key] ?? 0) * a.mbPerHour * days / 1024).toFixed(2)),
      color: a.color,
    }))
    .filter((d) => d.value > 0);

  const totalGB = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ fontFamily: "Poppins, sans-serif" }}>

      {/* ── HEADER ── */}
      <section className="bg-white border-b border-gray-100 py-12 px-6 text-center">
        <h1 className="font-black text-gray-900 mb-2" style={{ fontSize: "clamp(26px,4vw,44px)" }}>
          Data usage calculator
        </h1>
        <p className="text-gray-400 text-[15px] max-w-lg mx-auto">
          Estimate how much mobile data you'll need on your trip, based on your daily habits.
        </p>
      </section>

      {/* ── MAIN CALCULATOR ── */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_320px] gap-8 items-start">

          {/* LEFT — inputs */}
          <div>
            {/* Trip days */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-gray-800 text-[14px]">Trip duration</p>
                <span className="font-black text-[20px]" style={{ color: "#0da976" }}>{days} {days === 1 ? "day" : "days"}</span>
              </div>
              <input type="range" min={1} max={30} value={days} onChange={(e) => setDays(Number(e.target.value))}
                className="w-full accent-green-500" />
              <div className="flex justify-between text-[11px] text-gray-300 mt-1.5">
                <span>1 day</span><span>30 days</span>
              </div>
            </div>

            {/* Profile selector */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
              <p className="font-bold text-gray-800 text-[14px] mb-4">Pick a profile that matches your habits</p>
              <div className="grid grid-cols-3 gap-3">
                {PROFILES.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => applyProfile(p.key)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center"
                    style={{
                      borderColor: profile === p.key ? "#0da976" : "#e5e7eb",
                      background: profile === p.key ? "#f0fdf9" : "#fafafa",
                    }}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: profile === p.key ? "#0da976" : "#f3f4f6" }}>
                      <LottieIcon src={p.icon} size={22} autoplay loop />
                    </div>
                    <span className="text-[12px] font-bold" style={{ color: profile === p.key ? "#0da976" : "#6b7280" }}>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Activities */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <p className="font-bold text-gray-800 text-[14px] mb-1">Select how many hours you use each activity per day</p>
              <p className="text-[12px] text-gray-400 mb-5">Adjust sliders to match your daily usage.</p>
              <div className="space-y-5">
                {ACTIVITIES.map((act) => (
                  <div key={act.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <button onClick={() => toggleActivity(act.key)}
                        className="flex items-center gap-2.5 group">
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${enabled[act.key] ? "border-green-500 bg-green-500" : "border-gray-300"}`}>
                          {enabled[act.key] && <span className="text-white text-[11px] font-black">✓</span>}
                        </div>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: enabled[act.key] ? "#f0fdf9" : "#f9fafb" }}>
                          <LottieIcon src={act.icon} size={16} autoplay loop />
                        </div>
                        <div className="text-left">
                          <p className="text-[13.5px] font-bold text-gray-800">{act.label}</p>
                          <p className="text-[11px] text-gray-400">{act.subLabel}</p>
                        </div>
                      </button>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => setHour(act.key, Math.max(0, (hours[act.key] ?? 0) - 0.5))}
                          className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-green-400 hover:text-green-600 transition-all text-[16px] font-bold">
                          −
                        </button>
                        <span className="text-[13px] font-bold text-gray-700 w-10 text-center">
                          {(hours[act.key] ?? 0).toFixed(1)}h
                        </span>
                        <button onClick={() => setHour(act.key, (hours[act.key] ?? 0) + 0.5)}
                          className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-green-400 hover:text-green-600 transition-all text-[16px] font-bold">
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range" min={0} max={12} step={0.5}
                      value={hours[act.key] ?? 0}
                      onChange={(e) => setHour(act.key, Number(e.target.value))}
                      disabled={!enabled[act.key]}
                      className="w-full accent-green-500"
                      style={{ opacity: enabled[act.key] ? 1 : 0.3 }}
                    />
                    <div className="flex justify-between text-[10px] text-gray-300 mt-0.5">
                      <span>0h</span>
                      <span>{((hours[act.key] ?? 0) * act.mbPerHour / 1024).toFixed(2)} GB/day</span>
                      <span>12h</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — results */}
          <div className="lg:sticky lg:top-32">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <p className="font-bold text-gray-800 text-[14px] mb-5">Your estimated data usage</p>

              {/* Donut chart */}
              <div className="relative" style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData.length > 0 ? chartData : [{ name: "No activity", value: 1, color: "#e5e7eb" }]}
                      cx="50%" cy="50%"
                      innerRadius={68} outerRadius={95}
                      dataKey="value"
                      startAngle={90} endAngle={-270}>
                      {(chartData.length > 0 ? chartData : [{ color: "#e5e7eb" }]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value.toFixed(2)} GB`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
                <DonutCenter gb={totalGB * days === 0 ? 0 : totalGB} />
              </div>

              {/* Breakdown list */}
              <div className="mt-4 space-y-2">
                {chartData.length === 0 ? (
                  <p className="text-[13px] text-gray-400 text-center py-4">Select some activities above to see your estimate.</p>
                ) : (
                  chartData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                        <span className="text-[12.5px] text-gray-600 truncate">{item.name}</span>
                      </div>
                      <span className="text-[12.5px] font-bold text-gray-800 shrink-0">{item.value.toFixed(2)} GB</span>
                    </div>
                  ))
                )}
              </div>

              {chartData.length > 0 && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[13px] font-bold text-gray-600">Total for {days} days</span>
                    <span className="font-black text-[20px]" style={{ color: "#0da976" }}>{totalGB.toFixed(1)} GB</span>
                  </div>
                  <Link href={`${BASE}/destinations`}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-[14px] font-bold text-white"
                    style={{ background: "#0da976" }}>
                    Find Plan <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT IS MOBILE DATA ── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 max-w-lg">
            <h2 className="font-black text-gray-900 mb-4" style={{ fontSize: "clamp(24px,3vw,36px)" }}>
              What is mobile data usage?
            </h2>
            <p className="text-[14.5px] text-gray-500 leading-relaxed mb-4">
              Mobile data usage is how much internet data you're burning through when you're not connected to Wi-Fi. Every time you check social media, scroll through Instagram, stream through music from your home router. It all speeds through cellular data instead of Wi-Fi. However, it's pretty important since you're often relying on cellular data instead of Wi-Fi connections.
            </p>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&q=80"
                alt="Mobile data"
                className="rounded-3xl shadow-xl object-cover"
                style={{ width: 320, height: 360 }}
              />
              {/* Floating plan cards */}
              {["1 GB", "3 GB", "5 GB"].map((plan, i) => (
                <div key={plan}
                  className="absolute bg-white rounded-xl shadow-lg px-3 py-2 font-black text-gray-900"
                  style={{
                    top: `${25 + i * 28}%`,
                    left: i % 2 === 0 ? "-30px" : "auto",
                    right: i % 2 === 1 ? "-30px" : "auto",
                    fontSize: 15,
                  }}>
                  {plan}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW TO CALCULATE ── */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 flex justify-center">
            <img
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80"
              alt="Calculate"
              className="rounded-3xl shadow-xl object-cover"
              style={{ width: 340, height: 320 }}
            />
          </div>
          <div className="flex-1 max-w-lg">
            <h2 className="font-black text-gray-900 mb-4" style={{ fontSize: "clamp(22px,3vw,32px)" }}>
              How to calculate data usage
            </h2>
            <p className="text-[14px] text-gray-500 leading-relaxed mb-4">
              Figuring out how much data you'll actually need doesn't have to be guesswork. Our data usage calculator is personalized — simply select "Personalized" to input exactly how much time you spend on different activities each day. Then, select the number of days you plan to travel. Voltey will show you an estimated monthly data usage that gives you an idea of what plan size works best for your trip.
            </p>
          </div>
        </div>
      </section>

      {/* ── DATA TABLE ── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-black text-gray-900 mb-2 text-center" style={{ fontSize: "clamp(22px,3vw,32px)" }}>
            How we calculate your data usage
          </h2>
          <p className="text-center text-gray-400 text-[14px] mb-8">Reference values used in our calculator.</p>
          <div className="rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th className="text-left px-6 py-4 font-bold text-gray-500">Activity</th>
                  <th className="text-right px-6 py-4 font-bold text-gray-500">Data per hour</th>
                </tr>
              </thead>
              <tbody>
                {DATA_TABLE.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-6 py-3.5 text-gray-700">{row.activity}</td>
                    <td className="px-6 py-3.5 text-right font-bold text-gray-900">{row.perHour}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-black text-gray-900 mb-10 text-center" style={{ fontSize: "clamp(22px,3vw,34px)" }}>
            Frequently asked questions
          </h2>
          <div className="space-y-0">
            {faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>
    </div>
  );
}

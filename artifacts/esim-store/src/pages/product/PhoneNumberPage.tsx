import { useState, useEffect } from "react";
import { Link } from "wouter";
import { LottieIcon } from "@/components/LottieIcon";
import { Check, X, ChevronDown, ChevronUp, Info } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API  = import.meta.env.VITE_API_BASE ?? "";

/* ─────────────────────────────────────────────────────────
   Shared style tokens (Saily measurements)
   Container : maxWidth 1152, padding 0 40px
   Section   : padding 80px 0
   h2        : 36px / 900 / lh 1.08 / #0a0a0a
   body      : 15px / 400 / lh 1.6  / #6b7280
   ───────────────────────────────────────────────────────── */
const CONT  = { maxWidth: 1152, margin: "0 auto", padding: "0 40px" } as const;
const FONT  = "Poppins, sans-serif";

/* ─── FAQ accordion card ─── */
function FaqCard({ q, a, open, toggle }: { q: string; a: string; open: boolean; toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      style={{
        width: "100%", textAlign: "left", display: "block",
        borderRadius: 16, border: `2px solid ${open ? "#0a0a0a" : "#e5e7eb"}`,
        padding: "20px 24px", background: "#fff",
        fontFamily: FONT, cursor: "pointer", transition: "border-color .15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: "#0a0a0a" }}>{q}</span>
        {open ? <ChevronUp style={{ width: 16, height: 16, color: "#9ca3af", flexShrink: 0 }} />
               : <ChevronDown style={{ width: 16, height: 16, color: "#9ca3af", flexShrink: 0 }} />}
      </div>
      {open && (
        <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 400, color: "#6b7280", lineHeight: 1.6, marginTop: 12 }}>
          {a}
        </p>
      )}
    </button>
  );
}

/* ─── CMS defaults ─── */
const DEFAULT = {
  hero: {
    title: "One phone number|that works everywhere",
    subtitle: "Get a US phone number, add it to your Voltey eSIM app in a few taps, pair it with mobile data, and you're all set.",
    price: "US$0.99",
    note: "Identity verification is required in the Voltey app after purchase.",
  },
  faqs: [
    { q: "How to get an eSIM with a phone number?",              a: "Download the Voltey app, go to the Phone Number tab, choose your country, and subscribe. Your number is ready in seconds." },
    { q: "How to get an eSIM with a US phone number?",           a: "Select United States from the number country picker in the Voltey app and choose a US phone number plan starting at US$0.99/month." },
    { q: "How to transfer a number to a new phone with eSIM?",   a: "Log in to your Voltey account on your new device. Your number is tied to your account, not the hardware, so it transfers automatically." },
    { q: "How to transfer a phone number with eSIM?",            a: "Your Voltey number moves when you move. Sign in on any new eSIM-compatible device and your number is instantly available." },
    { q: "Is there an eSIM that comes with a phone number?",     a: "Yes — Voltey eSIM includes an optional phone number add-on from US$0.99/month. One app handles both data and your phone number." },
  ],
};

export default function PhoneNumberPage() {
  const [cms, setCms] = useState(DEFAULT);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API}/api/content/product-phone-number`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setCms({ ...DEFAULT, ...d }); })
      .catch(() => {});
  }, []);

  const [seoVersion, setSeoVersion] = useState(0);
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "voltey-seo-product-phone-number") setSeoVersion(v => v + 1);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    fetch(`${API}/api/content/seo:product:phone-number`, { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(seo => {
        if (seo?.metaTitle) document.title = seo.metaTitle;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute("content", seo?.metaDesc || "");
        const metaKw = document.querySelector('meta[name="keywords"]');
        if (metaKw) metaKw.setAttribute("content", seo?.metaKw || "");
      })
      .catch(() => {});
    return () => { document.title = "Voltey eSIM | Global Travel eSIM"; };
  }, [seoVersion]);

  return (
    <div style={{ fontFamily: FONT }}>

      {/* ══════════════════════════════════════════════════════
          S1 — HERO
          h≈524 | left col maxW=520 pt=90 pb=56
          h1: 44px/900/lh1.08 | sub: 15px/400 | price: 36px/900
          img: 420×400 t=90 l=30 r=22 | badge: w=248 t=62 l=-5
      ══════════════════════════════════════════════════════ */}
      <section style={{ background: "#fff", borderBottom: "1px solid #ebebeb" }}>
        <div style={CONT}>
          <div style={{ display: "flex", alignItems: "flex-start" }}>

            {/* LEFT */}
            <div style={{ flex: "1 1 0", maxWidth: 520, paddingTop: 90, paddingBottom: 56 }}>
              <h1 style={{ fontFamily: FONT, fontSize: 44, fontWeight: 900, lineHeight: 1.08, color: "#0a0a0a", margin: 0, marginBottom: 20 }}>
                {cms.hero.title.split("|").map((line, i) => (
                  <span key={i} style={{ display: "block" }}>{line}</span>
                ))}
              </h1>
              <p style={{ fontFamily: FONT, fontSize: 15, fontWeight: 400, lineHeight: 1.6, color: "#6b7280", margin: 0, marginBottom: 20, maxWidth: 370 }}>
                {cms.hero.subtitle}
              </p>
              <p style={{ fontFamily: FONT, fontSize: 36, fontWeight: 900, lineHeight: 1, color: "#0a0a0a", margin: 0, marginBottom: 24 }}>
                {cms.hero.price}
                <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 500, color: "#9ca3af" }}>/mo</span>
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
                <Link href={`${BASE}/destinations`} style={{
                  fontFamily: FONT, display: "inline-flex", alignItems: "center",
                  padding: "13px 24px", borderRadius: 9999, fontSize: 15, fontWeight: 700,
                  background: "#0a0a0a", color: "#fff", textDecoration: "none",
                }}>Get a Phone Number</Link>
                <Link href={`${BASE}/product/compatibility`} style={{
                  fontFamily: FONT, display: "inline-flex", alignItems: "center",
                  padding: "13px 24px", borderRadius: 9999, fontSize: 15, fontWeight: 600,
                  background: "#fff", color: "#0a0a0a", border: "1.5px solid #d1d5db", textDecoration: "none",
                }}>Device Compatibility</Link>
              </div>
              <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 400, color: "#9ca3af", margin: 0, display: "flex", alignItems: "center", gap: 5 }}>
                <Info style={{ width: 14, height: 14, flexShrink: 0 }} />{cms.hero.note}
              </p>
            </div>

            {/* RIGHT */}
            <div className="hidden lg:block" style={{ flex: 1, position: "relative", minHeight: 524 }}>
              {/* Badge: center-Y = img top(90) → top=62; left=img left(30)−35=−5 */}
              <div style={{
                position: "absolute", top: 62, left: -5, zIndex: 10,
                background: "#fff", borderRadius: 14, padding: "11px 14px",
                boxShadow: "0 6px 28px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
                width: 248, display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#fef08a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <LottieIcon src="/icons/lottie/call.json" size={22} autoplay loop />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 10, width: 108, borderRadius: 999, background: "#e5e7eb", marginBottom: 7 }} />
                  <div style={{ height: 8, width: 70, borderRadius: 999, background: "#f3f4f6" }} />
                </div>
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
              </div>
              {/* Image: 420×400, all-4-corners rounded 22px */}
              <img
                src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=900&q=85"
                alt="Person smiling outdoors"
                style={{ position: "absolute", top: 90, left: 30, width: 420, height: 400, objectFit: "cover", objectPosition: "center 20%", borderRadius: 22, display: "block" }}
              />
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          S2 — WHY
          bg #fff | py=80 | img LEFT 400×460 r=24 | text RIGHT
          h2: 36px/900/lh1.08 | list: 15px/400 green check
          badge inside img: bottom=24 left=24 w=240
      ══════════════════════════════════════════════════════ */}
      <section style={{ background: "#fff", borderBottom: "1px solid #ebebeb" }}>
        <div style={{ ...CONT, paddingTop: 80, paddingBottom: 80 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 56 }}>

            {/* LEFT: image with badge inside */}
            <div className="hidden lg:block" style={{ flexShrink: 0, position: "relative", width: 400, height: 460 }}>
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&q=85"
                alt="Man using phone outdoors"
                style={{ width: 400, height: 460, objectFit: "cover", objectPosition: "center top", borderRadius: 24, display: "block" }}
              />
              {/* Badge inside image at bottom-left — same card style as hero */}
              <div style={{
                position: "absolute", bottom: 24, left: 24, zIndex: 10,
                background: "#fff", borderRadius: 14, padding: "11px 14px",
                boxShadow: "0 6px 28px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.07)",
                width: 240, display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#fef08a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <LottieIcon src="/icons/lottie/call.json" size={20} autoplay loop />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 9, width: 100, borderRadius: 999, background: "#e5e7eb", marginBottom: 6 }} />
                  <div style={{ height: 7, width: 66, borderRadius: 999, background: "#f3f4f6" }} />
                </div>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
              </div>
            </div>

            {/* RIGHT: text */}
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: FONT, fontSize: 36, fontWeight: 900, lineHeight: 1.08, color: "#0a0a0a", margin: 0, marginBottom: 28 }}>
                Why should you get a Voltey phone number?
              </h2>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 18 }}>
                {[
                  { bold: "Affordable rates in 150+ countries.", rest: " Keep your travel budget in check — calls, texts and data in one affordable plan." },
                  { bold: "Stay reachable, no matter where you are.", rest: " Incoming calls and texts follow you globally at no extra charge." },
                  { bold: "Privacy for your digital life.", rest: " Use a dedicated number for apps, sign-ups, and services. Keep your main number private." },
                  { bold: "Data and a phone number in one app.", rest: " Manage your eSIM data plan and phone number together in the Voltey app." },
                ].map((item, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <Check style={{ width: 13, height: 13, color: "#16a34a" }} />
                    </div>
                    <p style={{ fontFamily: FONT, fontSize: 15, fontWeight: 400, lineHeight: 1.6, color: "#374151", margin: 0 }}>
                      <strong style={{ fontWeight: 700, color: "#0a0a0a" }}>{item.bold}</strong>{item.rest}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          S3 — HOW IT WORKS
          bg #f9fafb | py=80 | h2 36/900 | subtitle 15/400
          3 cards: bg white r=20 p=24
          Step circle: 28px border | Title 17/700 | Desc 13/400
          Mock UI in each card
      ══════════════════════════════════════════════════════ */}
      <section style={{ background: "#f9fafb", borderBottom: "1px solid #ebebeb" }}>
        <div style={{ ...CONT, paddingTop: 80, paddingBottom: 80 }}>

          <h2 style={{ fontFamily: FONT, fontSize: 36, fontWeight: 900, lineHeight: 1.08, color: "#0a0a0a", margin: 0, marginBottom: 10 }}>
            How does getting the Voltey phone number work?
          </h2>
          <p style={{ fontFamily: FONT, fontSize: 15, fontWeight: 400, color: "#9ca3af", margin: 0, marginBottom: 40 }}>
            Choose your number, activate your plan, and start calling and texting from the Voltey eSIM app!
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>

            {/* Card 1 — Get your number */}
            <div style={{ background: "#fff", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: "#374151" }}>1</span>
              </div>
              <div>
                <h3 style={{ fontFamily: FONT, fontSize: 17, fontWeight: 700, color: "#0a0a0a", margin: 0, marginBottom: 6 }}>Get your number</h3>
                <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 400, color: "#9ca3af", margin: 0, lineHeight: 1.5 }}>Open the Voltey app, tap "Get phone number," and pick your plan.</p>
              </div>
              {/* Mock: country + plan selector */}
              <div style={{ background: "#f9fafb", borderRadius: 14, padding: 16, border: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 18 }}>🇺🇸</span>
                  <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#0a0a0a" }}>United States</span>
                </div>
                <div style={{ borderRadius: 10, border: "2px solid #0a0a0a", padding: "10px 12px", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0a0a0a" }} />
                    </div>
                    <div>
                      <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: "#0a0a0a", margin: 0, lineHeight: 1 }}>100 MIN</p>
                      <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: "#0a0a0a", margin: 0, lineHeight: 1 }}>100 SMS</p>
                    </div>
                  </div>
                  <p style={{ fontFamily: FONT, fontSize: 10, fontWeight: 400, color: "#9ca3af", margin: 0 }}>30 days · US$2.99</p>
                </div>
                <div style={{ height: 8, width: "80%", borderRadius: 999, background: "#e5e7eb", marginBottom: 6 }} />
                <div style={{ height: 8, width: "60%", borderRadius: 999, background: "#e5e7eb" }} />
              </div>
            </div>

            {/* Card 2 — Set as primary line */}
            <div style={{ background: "#fff", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: "#374151" }}>2</span>
              </div>
              <div>
                <h3 style={{ fontFamily: FONT, fontSize: 17, fontWeight: 700, color: "#0a0a0a", margin: 0, marginBottom: 6 }}>Set Voltey as your primary line</h3>
                <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 400, color: "#9ca3af", margin: 0, lineHeight: 1.5 }}>Follow the in-app instructions to activate your number as the primary line.</p>
              </div>
              {/* Mock: line selector UI */}
              <div style={{ background: "#f9fafb", borderRadius: 14, padding: 16, border: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#fff", borderRadius: 10, marginBottom: 10, border: "1px solid #f3f4f6" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0da976", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 14, color: "#fff" }}>V</span>
                    </div>
                    <div>
                      <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: "#0a0a0a", margin: 0 }}>Voltey</p>
                      <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 400, color: "#9ca3af", margin: 0 }}>+1 (XXX) XXX-XXXX</p>
                    </div>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#0da976", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check style={{ width: 12, height: 12, color: "#fff" }} />
                  </div>
                </div>
                <div style={{ height: 8, width: "70%", borderRadius: 999, background: "#e5e7eb", marginBottom: 6 }} />
                <div style={{ height: 8, width: "50%", borderRadius: 999, background: "#e5e7eb" }} />
              </div>
            </div>

            {/* Card 3 — Start calling & texting */}
            <div style={{ background: "#fff", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: "#374151" }}>3</span>
              </div>
              <div>
                <h3 style={{ fontFamily: FONT, fontSize: 17, fontWeight: 700, color: "#0a0a0a", margin: 0, marginBottom: 6 }}>Start calling and texting</h3>
                <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 400, color: "#9ca3af", margin: 0, lineHeight: 1.5 }}>You're all set! Call minutes cover both incoming and outgoing calls.</p>
              </div>
              {/* Mock: call/text usage UI */}
              <div style={{ background: "#f9fafb", borderRadius: 14, padding: 16, border: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f0fdf9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <LottieIcon src="/icons/lottie/call.json" size={14} autoplay loop />
                    </div>
                    <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "#0a0a0a" }}>Active</span>
                  </div>
                  <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: "#0da976", background: "#f0fdf9", padding: "3px 8px", borderRadius: 999 }}>Active</span>
                </div>
                {[
                  { label: "MIN used", val: "28 / 100", pct: 28 },
                  { label: "SMS used", val: "12 / 100", pct: 12 },
                ].map((row) => (
                  <div key={row.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 400, color: "#9ca3af" }}>{row.label}</span>
                      <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: "#0a0a0a" }}>{row.val}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 999, background: "#e5e7eb" }}>
                      <div style={{ height: "100%", width: `${row.pct}%`, borderRadius: 999, background: "#0da976" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          S4 — GET MORE
          bg #fff | py=80 | text LEFT, img RIGHT 400×460 r=24
          h2: 36/900 | feature list: yellow border (first) + gray (rest)
          badge: yellow shield TOP-RIGHT of image
      ══════════════════════════════════════════════════════ */}
      <section style={{ background: "#fff", borderBottom: "1px solid #ebebeb" }}>
        <div style={{ ...CONT, paddingTop: 80, paddingBottom: 80 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 56 }}>

            {/* LEFT: text */}
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: FONT, fontSize: 36, fontWeight: 900, lineHeight: 1.08, color: "#0a0a0a", margin: 0, marginBottom: 28 }}>
                Get more out of your Voltey phone number
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Primary feature — yellow left border + description */}
                <div style={{ borderLeft: "4px solid #eab308", paddingLeft: 16 }}>
                  <p style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: "#0a0a0a", margin: 0, marginBottom: 6 }}>Privacy for your digital life</p>
                  <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 400, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
                    Food delivery, marketplaces, dating apps, newsletters — they all want your number. Use your Voltey number for those sign-ups and keep your main number private.
                  </p>
                </div>
                {/* Secondary features — gray left border */}
                {[
                  "Secure access and 2-factor verification",
                  "Stay connected to US services while abroad",
                  "Hassle-free travel — no roaming surprises",
                ].map((label, i) => (
                  <div key={i} style={{ borderLeft: "3px solid #e5e7eb", paddingLeft: 16 }}>
                    <p style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: "#374151", margin: 0 }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: image + shield badge */}
            <div className="hidden lg:block" style={{ flexShrink: 0, position: "relative", width: 400, height: 460 }}>
              <img
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=700&q=85"
                alt="Person using phone"
                style={{ width: 400, height: 460, objectFit: "cover", objectPosition: "center top", borderRadius: 24, display: "block" }}
              />
              {/* Yellow shield badge at top-right */}
              <div style={{
                position: "absolute", top: 24, right: 24,
                width: 54, height: 54, borderRadius: 14,
                background: "#fef08a", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              }}>
                <LottieIcon src="/icons/lottie/safe-home.json" size={30} autoplay loop />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          S5 — BUNDLE
          bg #f9fafb | py=80 | img LEFT 400×460 r=24, text RIGHT
          Two overlapping icon badges on img (call + message)
          h2: 36/900 | pricing table rounded-20 border
          Two CTA buttons + note
      ══════════════════════════════════════════════════════ */}
      <section style={{ background: "#f9fafb", borderBottom: "1px solid #ebebeb" }}>
        <div style={{ ...CONT, paddingTop: 80, paddingBottom: 80 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 56 }}>

            {/* LEFT: image + two icon badges overlapping at top-right */}
            <div className="hidden lg:block" style={{ flexShrink: 0, position: "relative", width: 400, height: 460 }}>
              <img
                src="https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=700&q=85"
                alt="Traveler with phone"
                style={{ width: 400, height: 460, objectFit: "cover", objectPosition: "center 30%", borderRadius: 24, display: "block" }}
              />
              {/* Call icon badge — top-right */}
              <div style={{
                position: "absolute", top: 28, right: 28,
                width: 52, height: 52, borderRadius: 14, background: "#fef08a",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 20px rgba(0,0,0,0.14)",
              }}>
                <LottieIcon src="/icons/lottie/call.json" size={26} autoplay loop />
              </div>
              {/* Message icon badge — second, slightly below */}
              <div style={{
                position: "absolute", top: 90, right: 52,
                width: 48, height: 48, borderRadius: 12, background: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
                border: "1px solid #f3f4f6",
              }}>
                <LottieIcon src="/icons/lottie/message.json" size={24} autoplay loop />
              </div>
            </div>

            {/* RIGHT: text + pricing + buttons */}
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: FONT, fontSize: 36, fontWeight: 900, lineHeight: 1.08, color: "#0a0a0a", margin: 0, marginBottom: 12 }}>
                Get your phone number bundle
              </h2>
              <p style={{ fontFamily: FONT, fontSize: 15, fontWeight: 400, lineHeight: 1.6, color: "#6b7280", margin: 0, marginBottom: 28 }}>
                Pick your destination and choose your plan on the Voltey eSIM app. Your subscription renews monthly and you can cancel anytime.
              </p>

              {/* Pricing table */}
              <div style={{ borderRadius: 20, border: "1.5px solid #e5e7eb", overflow: "hidden", marginBottom: 24 }}>
                {/* Row 1 */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f3f4f6", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0fdf9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <LottieIcon src="/icons/lottie/call.json" size={18} autoplay loop />
                    </div>
                    <div>
                      <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: "#0a0a0a", margin: 0 }}>Phone number subscription</p>
                      <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 400, color: "#9ca3af", margin: 0 }}>From US$0.99/mo · Renews monthly</p>
                    </div>
                  </div>
                  <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 900, color: "#0a0a0a", margin: 0, flexShrink: 0 }}>US$0.99/mo</p>
                </div>
                {/* Row 2 */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0fdf9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <LottieIcon src="/icons/lottie/message.json" size={18} autoplay loop />
                    </div>
                    <div>
                      <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: "#0a0a0a", margin: 0 }}>Call and text plan</p>
                      <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 400, color: "#9ca3af", margin: 0 }}>Choose a plan that works for you</p>
                    </div>
                  </div>
                  <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 900, color: "#0a0a0a", margin: 0, flexShrink: 0 }}>From US$0.99</p>
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
                <Link href={`${BASE}/destinations`} style={{
                  fontFamily: FONT, display: "inline-flex", alignItems: "center",
                  padding: "13px 24px", borderRadius: 9999, fontSize: 15, fontWeight: 700,
                  background: "#0a0a0a", color: "#fff", textDecoration: "none",
                }}>Get a Bundle</Link>
                <Link href={`${BASE}/product/compatibility`} style={{
                  fontFamily: FONT, display: "inline-flex", alignItems: "center",
                  padding: "13px 24px", borderRadius: 9999, fontSize: 15, fontWeight: 600,
                  background: "#fff", color: "#0a0a0a", border: "1.5px solid #d1d5db", textDecoration: "none",
                }}>Device Compatibility</Link>
              </div>
              <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 400, color: "#9ca3af", margin: 0, display: "flex", alignItems: "center", gap: 5 }}>
                <Info style={{ width: 13, height: 13, flexShrink: 0 }} />Identity verification is required in the Voltey app after purchase.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          S6 — COMPARISON TABLE
          bg #fff | py=80
          h2: 36/900 | left-col feature labels | Voltey dark col
          Competitors: Airalo, Holafly, Nomad, Ubigi
          Voltey col: bg #0a0a0a (dark), rounded top+bottom
      ══════════════════════════════════════════════════════ */}
      <section style={{ background: "#fff", borderBottom: "1px solid #ebebeb" }}>
        <div style={{ ...CONT, paddingTop: 80, paddingBottom: 80 }}>
          <h2 style={{ fontFamily: FONT, fontSize: 36, fontWeight: 900, lineHeight: 1.08, color: "#0a0a0a", margin: 0, marginBottom: 32 }}>
            Voltey vs. other eSIM services
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 640 }}>
              <thead>
                <tr>
                  <th style={{ width: "34%", paddingBottom: 16 }} />
                  {/* Voltey dark header */}
                  <th style={{ paddingBottom: 0, paddingLeft: 8, paddingRight: 8, verticalAlign: "bottom" }}>
                    <div style={{ background: "#0a0a0a", borderRadius: "16px 16px 0 0", padding: "16px 12px 12px", textAlign: "center" }}>
                      <p style={{ fontFamily: FONT, fontSize: 15, fontWeight: 900, color: "#fff", margin: 0 }}>Voltey</p>
                    </div>
                  </th>
                  {["Airalo", "Holafly", "Nomad", "Ubigi"].map((name) => (
                    <th key={name} style={{ paddingBottom: 16, paddingLeft: 12, textAlign: "center" }}>
                      <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: "#9ca3af", margin: 0 }}>{name}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "One eSIM for all destinations",   vals: [true,  false, false, false, true]  },
                  { feature: "Phone number (SMS & calls)",       vals: [true,  true,  false, false, false] },
                  { feature: "24/7 live chat support",           vals: [true,  true,  true,  true,  false] },
                  { feature: "Refunds",                          vals: [true,  true,  true,  true,  true]  },
                  { feature: "Security features",                vals: [true,  false, false, false, false] },
                  { feature: "Virtual locations",                vals: ["115+","0",  "0",   "0",   "0"]   },
                  { feature: "Blocks malicious URLs",            vals: [true,  false, false, false, false] },
                  { feature: "Data saver (ad blocker)",          vals: [true,  false, false, false, false] },
                ].map((row, ri, arr) => {
                  const isLast = ri === arr.length - 1;
                  return (
                    <tr key={ri}>
                      <td style={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, color: "#4b5563", padding: "14px 16px 14px 0", borderBottom: isLast ? "none" : "1px solid #f3f4f6" }}>
                        {row.feature}
                      </td>
                      {/* Voltey cell */}
                      <td style={{ padding: "14px 8px", textAlign: "center", background: "#0a0a0a", borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.06)", borderRadius: isLast ? "0 0 16px 16px" : undefined }}>
                        {typeof row.vals[0] === "boolean"
                          ? row.vals[0]
                            ? <Check style={{ width: 18, height: 18, margin: "0 auto", display: "block", color: "#0da976" }} />
                            : <X style={{ width: 15, height: 15, margin: "0 auto", display: "block", color: "rgba(255,255,255,0.2)" }} />
                          : <span style={{ fontFamily: FONT, fontWeight: 700, color: "#fff" }}>{row.vals[0]}</span>
                        }
                      </td>
                      {/* Competitor cells */}
                      {[1,2,3,4].map((ci) => (
                        <td key={ci} style={{ padding: "14px 12px", textAlign: "center", borderBottom: isLast ? "none" : "1px solid #f3f4f6" }}>
                          {typeof row.vals[ci] === "boolean"
                            ? row.vals[ci]
                              ? <Check style={{ width: 18, height: 18, margin: "0 auto", display: "block", color: "#d1d5db" }} />
                              : <X style={{ width: 15, height: 15, margin: "0 auto", display: "block", color: "#e5e7eb" }} />
                            : <span style={{ fontFamily: FONT, fontSize: 13, color: "#9ca3af" }}>{row.vals[ci]}</span>
                          }
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          S7 — REVIEWS / WHY TRAVELERS CHOOSE
          bg #f9fafb | py=80
          h2 centered 36/900 | subtitle 15/400
          4-col masonry grid: Trustpilot, YouTube, press, Lonely Planet
      ══════════════════════════════════════════════════════ */}
      <section style={{ background: "#f9fafb", borderBottom: "1px solid #ebebeb" }}>
        <div style={{ ...CONT, paddingTop: 80, paddingBottom: 80 }}>

          <h2 style={{ fontFamily: FONT, fontSize: 36, fontWeight: 900, lineHeight: 1.08, color: "#0a0a0a", margin: 0, marginBottom: 8, textAlign: "center" }}>
            Why travelers choose the Voltey eSIM app
          </h2>
          <p style={{ fontFamily: FONT, fontSize: 15, fontWeight: 400, color: "#9ca3af", textAlign: "center", margin: 0, marginBottom: 40 }}>
            Hear what fellow travelers are saying about Voltey!
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, alignItems: "start" }}>

            {/* COL 1 — two review cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Trustpilot card */}
              <div style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 900, color: "#374151" }}>J</span>
                    </div>
                    <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: "#0a0a0a", margin: 0 }}>Jorge A.</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 16, height: 16, borderRadius: 3, background: "#00b67a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: "#fff", fontSize: 8, fontWeight: 900 }}>✓</span>
                    </div>
                    <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: "#6b7280" }}>Trustpilot</span>
                  </div>
                </div>
                <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 400, color: "#4b5563", lineHeight: 1.6, margin: 0, marginBottom: 10 }}>Easy, cheap and fast. Easy step-by-step setup, super fast speed (~100 mbps). Cheap, great coverage, and helpful live chat. Keep up the good work.</p>
                <p style={{ fontFamily: FONT, fontSize: 13, color: "#fbbf24", margin: 0 }}>★★★★★ <strong style={{ color: "#374151", fontSize: 12 }}>5.0</strong></p>
              </div>
              {/* YouTube card */}
              <div style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 900, color: "#ef4444" }}>P</span>
                    </div>
                    <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: "#0a0a0a", margin: 0 }}>PewDiePie</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 16, height: 16, borderRadius: 3, background: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: "#fff", fontSize: 7, fontWeight: 900 }}>▶</span>
                    </div>
                    <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: "#6b7280" }}>YouTube</span>
                  </div>
                </div>
                <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 400, color: "#4b5563", lineHeight: 1.6, margin: 0 }}>Set it up at home, activate it when ready — takes literally just a couple of minutes. Boom! Internet on your phone when traveling, as it should be. I recommend Voltey for every trip — it's a must!</p>
              </div>
            </div>

            {/* COL 2 — big Lonely Planet quote */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#fff", borderRadius: 20, padding: 24, border: "1px solid #f3f4f6", minHeight: 340, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontFamily: FONT, fontSize: 52, lineHeight: 1, color: "#e5e7eb", fontWeight: 900, margin: 0, marginBottom: 4 }}>"</p>
                  <p style={{ fontFamily: FONT, fontSize: 16, fontWeight: 900, color: "#0a0a0a", lineHeight: 1.4, margin: 0, marginBottom: 20 }}>
                    Voltey is an affordable, easy-to-use, and sustainable eSIM service that gives reliable mobile connections from anywhere in the world. That's why we recommend Voltey as our eSIM partner.
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <LottieIcon src="/icons/lottie/global.json" size={20} autoplay loop />
                  <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 14, color: "#2563eb" }}>lonely planet</span>
                </div>
              </div>
            </div>

            {/* COL 3 — two more review cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 900, color: "#7c3aed" }}>D</span>
                    </div>
                    <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: "#0a0a0a", margin: 0 }}>DutchPilotGirl</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 16, height: 16, borderRadius: 3, background: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: "#fff", fontSize: 7, fontWeight: 900 }}>▶</span>
                    </div>
                    <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: "#6b7280" }}>YouTube</span>
                  </div>
                </div>
                <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 400, color: "#4b5563", lineHeight: 1.6, margin: 0 }}>There's so much you can't do abroad without proper internet. Voltey takes care of everything. Simple to buy, easy to install. I love it.</p>
              </div>
              <div style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 900, color: "#1d4ed8" }}>D</span>
                    </div>
                    <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: "#0a0a0a", margin: 0 }}>Domas R.</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 16, height: 16, borderRadius: 3, background: "#00b67a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: "#fff", fontSize: 8, fontWeight: 900 }}>✓</span>
                    </div>
                    <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: "#6b7280" }}>Trustpilot</span>
                  </div>
                </div>
                <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 400, color: "#4b5563", lineHeight: 1.6, margin: 0, marginBottom: 8 }}>Used Voltey across UK, Netherlands, and Belgium. Took me 1 min to buy and activate. My internet was way better than friends who stayed on roaming plans.</p>
                <p style={{ fontFamily: FONT, fontSize: 13, color: "#fbbf24", margin: 0 }}>★★★★★ <strong style={{ color: "#374151", fontSize: 12 }}>5.0</strong></p>
              </div>
            </div>

            {/* COL 4 — press cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid #f3f4f6" }}>
                <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 900, color: "#0a0a0a", margin: 0, marginBottom: 8 }}>
                  cybernews<sup style={{ fontWeight: 400, fontSize: 9, color: "#9ca3af" }}>®</sup>
                </p>
                <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 400, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>With comprehensive coverage and affordable prices, Voltey is the best eSIM for Europe. Activating is straightforward — download, choose your plan, surf. Live chat support available.</p>
              </div>
              <div style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid #f3f4f6" }}>
                <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 900, color: "#0a0a0a", margin: 0, marginBottom: 8 }}>
                  tech<span style={{ color: "#ef4444" }}>radar</span>
                </p>
                <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 400, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>Backed by a reputable brand with a focus on security and privacy. Users praise its easy installation, affordable pricing, and reliable global coverage.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          S8 — FAQ
          bg #fff | py=80 | centered maxW=640
          h2: 36/900 centered | accordion cards
      ══════════════════════════════════════════════════════ */}
      <section style={{ background: "#fff" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "80px 40px" }}>
          <h2 style={{ fontFamily: FONT, fontSize: 36, fontWeight: 900, lineHeight: 1.08, color: "#0a0a0a", margin: 0, marginBottom: 32, textAlign: "center" }}>
            Frequently asked questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {cms.faqs.map((f, i) => (
              <FaqCard key={i} q={f.q} a={f.a} open={faqOpen === i} toggle={() => setFaqOpen(faqOpen === i ? null : i)} />
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

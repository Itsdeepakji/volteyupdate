import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Mail, Lock, Eye, EyeOff, User, Phone,
  LogOut, Plus, AlertCircle, RefreshCw, CheckCircle,
  Globe, Zap, Search, Copy, ExternalLink, ChevronRight, Camera,
} from "lucide-react";
import { LottieIcon } from "@/components/LottieIcon";

/* ─────────────────────────────────────────────────
   Types & Storage Helpers
───────────────────────────────────────────────── */
type UserAccount = { name: string; email: string; password: string; phone: string; createdAt: string };
type ClaimedOrder = { transactionId: string; addedAt: string };
type OrderDetail  = { transactionId: string; status: string; iccid?: string; qrCodeUrl?: string };
type DashTab      = "overview" | "my-esims" | "orders" | "profile" | "security" | "kyc" | "referrals" | "support" | "topup";

const USERS_KEY   = "voltey-users";
const SESSION_KEY = "voltey-user-session";
const ordersKey   = (email: string) => `voltey-user-orders:${email}`;

function getUsers(): UserAccount[] { return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]"); }
function saveUsers(u: UserAccount[]) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
function getSession(): UserAccount | null {
  const s = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
  return s ? (JSON.parse(s) as UserAccount) : null;
}
function saveSession(acc: UserAccount, remember: boolean) {
  const s = JSON.stringify(acc);
  if (remember) localStorage.setItem(SESSION_KEY, s);
  else sessionStorage.setItem(SESSION_KEY, s);
}
function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
}
function getClaimedOrders(email: string): ClaimedOrder[] {
  return JSON.parse(localStorage.getItem(ordersKey(email)) ?? "[]");
}
function claimOrder(email: string, txId: string) {
  const all = getClaimedOrders(email);
  if (!all.find((o) => o.transactionId === txId)) {
    all.unshift({ transactionId: txId, addedAt: new Date().toISOString() });
    localStorage.setItem(ordersKey(email), JSON.stringify(all));
  }
}

/* ─────────────────────────────────────────────────
   User Login / Register Page
───────────────────────────────────────────────── */
function UserLoginPage({ onLogin }: { onLogin: (acc: UserAccount, remember: boolean) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPwd,   setLoginPwd]   = useState("");
  const [remember,   setRemember]   = useState(false);
  const [showLPwd,   setShowLPwd]   = useState(false);
  const [loginErr,   setLoginErr]   = useState("");
  const [loginLoad,  setLoginLoad]  = useState(false);

  // Register state
  const [regName,    setRegName]    = useState("");
  const [regEmail,   setRegEmail]   = useState("");
  const [regPwd,     setRegPwd]     = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRPwd,   setShowRPwd]   = useState(false);
  const [regErr,     setRegErr]     = useState("");
  const [regLoad,    setRegLoad]    = useState(false);

  function doLogin() {
    if (!loginEmail.includes("@")) { setLoginErr("Please enter a valid email."); return; }
    if (!loginPwd) { setLoginErr("Please enter your password."); return; }
    setLoginErr(""); setLoginLoad(true);
    setTimeout(() => {
      const u = getUsers().find(
        (x) => x.email.toLowerCase() === loginEmail.toLowerCase() && x.password === loginPwd,
      );
      if (u) { onLogin(u, remember); }
      else { setLoginErr("Invalid email or password."); setLoginLoad(false); }
    }, 700);
  }

  function doRegister() {
    if (!regName.trim()) { setRegErr("Please enter your full name."); return; }
    if (!regEmail.includes("@")) { setRegErr("Please enter a valid email."); return; }
    if (regPwd.length < 8) { setRegErr("Password must be at least 8 characters."); return; }
    if (regPwd !== regConfirm) { setRegErr("Passwords do not match."); return; }
    setRegErr(""); setRegLoad(true);
    setTimeout(() => {
      const users = getUsers();
      if (users.find((x) => x.email.toLowerCase() === regEmail.toLowerCase())) {
        setRegErr("An account with this email already exists."); setRegLoad(false); return;
      }
      const newAcc: UserAccount = {
        name: regName.trim(), email: regEmail.toLowerCase(),
        password: regPwd, phone: "", createdAt: new Date().toISOString(),
      };
      saveUsers([...users, newAcc]);
      onLogin(newAcc, false);
    }, 800);
  }

  const year = new Date().getFullYear();

  const inp = "w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-[14px] text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all bg-white";
  const inpNoIcon = "w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all bg-white";

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "Poppins, sans-serif" }}>

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex flex-col w-[54%] relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/destination-bg.png')" }} />
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(10,47,90,0.94) 0%, rgba(0,0,0,0.38) 55%, rgba(67,20,120,0.93) 100%)" }} />

        {/* Top logo */}
        <div className="relative z-10 p-10 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/logo-white.png" alt="Voltey" className="h-9 w-auto" />
            <span className="text-[10.5px] font-bold tracking-[0.2em] uppercase mt-0.5"
              style={{ color: "rgba(255,255,255,0.4)" }}>My Account</span>
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-14 text-center">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 border border-white/20"
            style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(16px)" }}>
            <LottieIcon src="/icons/global.json" size={54} autoplay loop />
          </div>
          <h1 className="text-[40px] font-black text-white leading-none mb-3">
            Your eSIM <span style={{ color: "#a78bfa" }}>Hub</span>
          </h1>
          <p className="text-[16px] font-semibold text-white/85 mb-2">Stay connected everywhere</p>
          <p className="text-[14px] text-white/75 leading-relaxed max-w-xs">
            Manage all your eSIMs, track orders, and stay connected in 190+ countries.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-10 w-full max-w-md">
            {[
              { icon: "/icons/global.json",        val: "190+",    lbl: "Countries" },
              { icon: "/icons/simcard.json",        val: "Instant", lbl: "Delivery"  },
              { icon: "/icons/security-card.json",  val: "24/7",    lbl: "Support"   },
            ].map(({ icon, val, lbl }) => (
              <div key={lbl} className="rounded-2xl p-4 text-center border border-white/10"
                style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)" }}>
                <div className="flex justify-center mb-2">
                  <LottieIcon src={icon} size={30} autoplay loop />
                </div>
                <p className="text-[18px] font-black text-white">{val}</p>
                <p className="text-[11px] text-white/75 mt-0.5">{lbl}</p>
              </div>
            ))}
          </div>

          {/* Feature list */}
          <div className="mt-8 space-y-2.5 text-left w-full max-w-xs">
            {[
              { icon: "/icons/simcard.json",       text: "View & manage all your eSIMs" },
              { icon: "/icons/shopping-cart.json", text: "Track orders & download QR codes" },
              { icon: "/icons/people.json",        text: "Personal profile & preferences" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border border-white/10"
                  style={{ background: "rgba(255,255,255,0.1)" }}>
                  <LottieIcon src={icon} size={20} autoplay loop />
                </div>
                <span className="text-[13px] text-white/85">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 p-10">
          <p className="text-[12.5px] font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
            © {year} Voltey Technology Ltd. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col bg-white min-h-screen">
        <div className="lg:hidden px-6 pt-8 pb-4">
          <img src="/logo-green.png" alt="Voltey" className="h-8 w-auto" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-8 py-10">
          <div className="w-full max-w-[360px]">

            <div className="hidden lg:block mb-8">
              <img src="/logo-green.png" alt="Voltey" className="h-10 w-auto" />
            </div>

            {/* Mode tab switcher */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-7">
              {(["login", "register"] as const).map((m) => (
                <button key={m} onClick={() => { setMode(m); setLoginErr(""); setRegErr(""); }}
                  className="flex-1 py-2.5 rounded-lg text-[13.5px] font-semibold transition-all"
                  style={{
                    background: mode === m ? "#fff" : "transparent",
                    color: mode === m ? "#111" : "#6b7280",
                    boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  }}>
                  {m === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            {mode === "login" ? (
              <div>
                <div className="mb-6">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                    <LottieIcon src="/icons/profile-tick.json" size={26} autoplay loop />
                  </div>
                  <h2 className="text-[24px] font-black text-gray-900 mb-1">Welcome back 👋</h2>
                  <p className="text-[14px] text-gray-400">Sign in to your Voltey account</p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); doLogin(); }} className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input value={loginEmail} onChange={(e) => { setLoginEmail(e.target.value); setLoginErr(""); }}
                        type="email" placeholder="you@example.com" className={inp} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input value={loginPwd} onChange={(e) => { setLoginPwd(e.target.value); setLoginErr(""); }}
                        type={showLPwd ? "text" : "password"} placeholder="Your password"
                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 text-[14px] text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all bg-white" />
                      <button type="button" onClick={() => setShowLPwd((p) => !p)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                        {showLPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {loginErr && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-[13px] text-red-600">{loginErr}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setRemember((p) => !p)}>
                      <div className="rounded-full flex items-center p-0.5 transition-all shrink-0"
                        style={{ width: 36, height: 20, background: remember ? "#22c55e" : "#d1d5db" }}>
                        <div className="w-4 h-4 rounded-full bg-white shadow-sm transition-all"
                          style={{ transform: remember ? "translateX(16px)" : "translateX(0)" }} />
                      </div>
                      <span className="text-[13px] text-gray-600">Remember me</span>
                    </label>
                    <button type="button" className="text-[13px] font-semibold" style={{ color: "#22c55e" }}>Forgot?</button>
                  </div>

                  <button type="submit" disabled={loginLoad}
                    className="w-full py-3.5 rounded-xl text-[15px] font-bold text-white flex items-center justify-center gap-2 transition-all mt-1 shadow-sm"
                    style={{ background: loginLoad ? "#86efac" : "#22c55e", cursor: loginLoad ? "wait" : "pointer" }}>
                    {loginLoad ? <><RefreshCw className="w-4 h-4 animate-spin" /> Signing in...</> : "Sign In"}
                  </button>
                </form>

                <p className="mt-5 text-center text-[13px] text-gray-500">
                  No account?{" "}
                  <button onClick={() => setMode("register")} className="font-semibold" style={{ color: "#22c55e" }}>
                    Create one free →
                  </button>
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                    <LottieIcon src="/icons/user-add.json" size={26} autoplay loop />
                  </div>
                  <h2 className="text-[24px] font-black text-gray-900 mb-1">Create account ✨</h2>
                  <p className="text-[14px] text-gray-400">Join Voltey and stay connected globally</p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); doRegister(); }} className="space-y-3.5">
                  <div>
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input value={regName} onChange={(e) => { setRegName(e.target.value); setRegErr(""); }}
                        type="text" placeholder="John Doe" className={inp} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input value={regEmail} onChange={(e) => { setRegEmail(e.target.value); setRegErr(""); }}
                        type="email" placeholder="you@example.com" className={inp} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input value={regPwd} onChange={(e) => { setRegPwd(e.target.value); setRegErr(""); }}
                        type={showRPwd ? "text" : "password"} placeholder="Min. 8 characters"
                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 text-[14px] text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all bg-white" />
                      <button type="button" onClick={() => setShowRPwd((p) => !p)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                        {showRPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input value={regConfirm} onChange={(e) => { setRegConfirm(e.target.value); setRegErr(""); }}
                        type="password" placeholder="Repeat password"
                        className={inp} />
                    </div>
                  </div>

                  {regErr && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-[13px] text-red-600">{regErr}</p>
                    </div>
                  )}

                  <button type="submit" disabled={regLoad}
                    className="w-full py-3.5 rounded-xl text-[15px] font-bold text-white flex items-center justify-center gap-2 transition-all shadow-sm"
                    style={{ background: regLoad ? "#86efac" : "#22c55e", cursor: regLoad ? "wait" : "pointer" }}>
                    {regLoad ? <><RefreshCw className="w-4 h-4 animate-spin" /> Creating...</> : "Create Account"}
                  </button>
                </form>

                <p className="mt-4 text-center text-[12.5px] text-gray-400">
                  By signing up you agree to our{" "}
                  <span className="font-medium text-gray-600 underline cursor-pointer">Terms</span> &{" "}
                  <span className="font-medium text-gray-600 underline cursor-pointer">Privacy Policy</span>.
                </p>
                <p className="mt-3 text-center text-[13px] text-gray-500">
                  Have an account?{" "}
                  <button onClick={() => setMode("login")} className="font-semibold" style={{ color: "#22c55e" }}>
                    Sign in →
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="px-8 py-5 text-center border-t border-gray-100">
          <p className="text-[12.5px] font-medium text-gray-500">© {year} Powered by Voltey · All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Overview Tab
───────────────────────────────────────────────── */
type QuickAction = { icon: string; label: string; desc: string; bg: string; href?: string; tab?: DashTab };

const QUICK_ACTIONS: QuickAction[] = [
  { icon: "/icons/global.json",        label: "Browse Destinations", desc: "Find your next plan",       bg: "#f0fdf4", href: "/destinations" },
  { icon: "/icons/simcard.json",       label: "My eSIMs",            desc: "View active eSIMs",         bg: "#eff6ff", tab: "my-esims"  },
  { icon: "/icons/shopping-cart.json", label: "Order History",       desc: "Track all orders",          bg: "#faf5ff", tab: "orders"    },
  { icon: "/icons/wallet-add.json",    label: "Top-up Wallet",       desc: "Add funds to wallet",       bg: "#f0fdf4", tab: "topup"     },
  { icon: "/icons/people.json",        label: "Referrals",           desc: "Earn referral rewards",     bg: "#fefce8", tab: "referrals" },
  { icon: "/icons/security-card.json", label: "KYC Verify",          desc: "Verify your identity",      bg: "#fff7ed", tab: "kyc"       },
];

function OverviewTab({ user, claimedCount, onNavigate, avatarUrl }: { user: UserAccount; claimedCount: number; onNavigate: (t: DashTab) => void; avatarUrl?: string }) {
  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const since    = new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div>
      {/* Welcome banner */}
      <div className="rounded-2xl p-6 mb-6 text-white"
        style={{ background: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)" }}>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-[22px] font-black text-white shrink-0 overflow-hidden">
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              : initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-[13px] font-medium">Welcome back</p>
            <h2 className="text-[22px] font-black text-white">{user.name} 👋</h2>
            <p className="text-white/60 text-[12.5px] mt-0.5">Member since {since}</p>
          </div>
          <Link href="/destinations"
            className="px-5 py-2.5 rounded-xl bg-white text-[13.5px] font-bold text-emerald-700 hover:bg-emerald-50 transition-colors whitespace-nowrap shrink-0">
            Buy eSIM →
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: "/icons/simcard.json",       val: String(claimedCount), lbl: "My eSIMs",          bg: "#f0fdf4" },
          { icon: "/icons/shopping-cart.json", val: String(claimedCount), lbl: "Total Orders",       bg: "#eff6ff" },
          { icon: "/icons/global.json",        val: "190+",               lbl: "Countries Available", bg: "#faf5ff" },
        ].map(({ icon, val, lbl, bg }) => (
          <div key={lbl} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
              <LottieIcon src={icon} size={24} autoplay loop />
            </div>
            <p className="text-[26px] font-black text-gray-900">{val}</p>
            <p className="text-[12.5px] text-gray-400 mt-0.5">{lbl}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-[15px] font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map(({ icon, label, desc, bg, href, tab }) =>
            href ? (
              <Link key={label} href={href}
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                  <LottieIcon src={icon} size={24} autoplay loop />
                </div>
                <div>
                  <p className="text-[13.5px] font-semibold text-gray-900">{label}</p>
                  <p className="text-[12px] text-gray-400 mt-0.5">{desc}</p>
                </div>
              </Link>
            ) : (
              <button key={label} onClick={() => onNavigate(tab!)}
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all text-left">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                  <LottieIcon src={icon} size={24} autoplay loop />
                </div>
                <div>
                  <p className="text-[13.5px] font-semibold text-gray-900">{label}</p>
                  <p className="text-[12px] text-gray-400 mt-0.5">{desc}</p>
                </div>
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   My eSIMs Tab
───────────────────────────────────────────────── */
function MyEsimsTab({ email }: { email: string }) {
  const [claimed,    setClaimed]    = useState<ClaimedOrder[]>(getClaimedOrders(email));
  const [details,    setDetails]    = useState<Record<string, OrderDetail>>({});
  const [loadingSet, setLoadingSet] = useState<Set<string>>(new Set());
  const [claimInput, setClaimInput] = useState("");
  const [claimErr,   setClaimErr]   = useState("");
  const [claimLoad,  setClaimLoad]  = useState(false);
  const [copied,     setCopied]     = useState<string | null>(null);

  useEffect(() => {
    claimed.forEach(({ transactionId }) => {
      if (!details[transactionId] && !loadingSet.has(transactionId)) {
        setLoadingSet((p) => new Set(p).add(transactionId));
        fetch(`/api/orders/${transactionId}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (d) setDetails((p) => ({ ...p, [transactionId]: d as OrderDetail }));
            setLoadingSet((p) => { const s = new Set(p); s.delete(transactionId); return s; });
          })
          .catch(() => setLoadingSet((p) => { const s = new Set(p); s.delete(transactionId); return s; }));
      }
    });
  }, [claimed]);

  function handleClaim() {
    const txId = claimInput.trim();
    if (!txId) { setClaimErr("Please enter a Transaction ID."); return; }
    setClaimErr(""); setClaimLoad(true);
    fetch(`/api/orders/${txId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(() => {
        claimOrder(email, txId);
        setClaimed(getClaimedOrders(email));
        setClaimInput(""); setClaimLoad(false);
      })
      .catch(() => { setClaimErr("Order not found. Check your Transaction ID."); setClaimLoad(false); });
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(text); setTimeout(() => setCopied(null), 2000);
  }

  const statusCls = (s?: string) =>
    s === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
    s === "pending"   ? "bg-amber-50 text-amber-700 border-amber-200" :
    "bg-gray-50 text-gray-500 border-gray-200";

  return (
    <div>
      {/* Claim box */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <h3 className="text-[15px] font-bold text-gray-900 mb-1">Add an Order</h3>
        <p className="text-[13px] text-gray-400 mb-4">Enter the Transaction ID from your confirmation email.</p>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input value={claimInput} onChange={(e) => { setClaimInput(e.target.value); setClaimErr(""); }}
              placeholder="e.g. TXN-XXXXXXXX" type="text"
              onKeyDown={(e) => e.key === "Enter" && handleClaim()}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-[14px] outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
          </div>
          <button onClick={handleClaim} disabled={claimLoad}
            className="px-5 py-2.5 rounded-xl text-[14px] font-bold text-white flex items-center gap-1.5 transition-all"
            style={{ background: claimLoad ? "#86efac" : "#22c55e" }}>
            {claimLoad ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {claimLoad ? "..." : "Add"}
          </button>
        </div>
        {claimErr && (
          <p className="mt-2 text-[12.5px] text-red-600 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />{claimErr}
          </p>
        )}
      </div>

      {claimed.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <LottieIcon src="/icons/simcard.json" size={38} autoplay loop />
          </div>
          <h3 className="text-[17px] font-bold text-gray-900 mb-2">No eSIMs yet</h3>
          <p className="text-[13.5px] text-gray-400 max-w-xs mx-auto mb-5">
            Purchase a plan and enter your Transaction ID above to track your eSIM here.
          </p>
          <Link href="/destinations"
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-[14px] font-bold text-white"
            style={{ background: "#22c55e" }}>
            Browse Plans →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {claimed.map(({ transactionId, addedAt }) => {
            const d = details[transactionId];
            const loading = loadingSet.has(transactionId);
            return (
              <div key={transactionId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                {loading ? (
                  <div className="flex items-center gap-3 animate-pulse">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-1/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <LottieIcon src="/icons/simcard.json" size={28} autoplay loop />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-[14px] font-bold text-gray-900 truncate font-mono">{transactionId}</p>
                        <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${statusCls(d?.status)}`}>
                          {d?.status ?? "Loading…"}
                        </span>
                      </div>
                      {d?.iccid && (
                        <p className="text-[12.5px] text-gray-400 mb-1">
                          ICCID: <span className="font-mono text-gray-600">••••••••{d.iccid.slice(-6)}</span>
                        </p>
                      )}
                      <p className="text-[12px] text-gray-400">
                        Added {new Date(addedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {d?.iccid && (
                        <button onClick={() => copy(d.iccid!)} title="Copy ICCID"
                          className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors">
                          {copied === d.iccid ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}
                      <Link href={`/esim/${transactionId}`}
                        className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white flex items-center gap-1.5"
                        style={{ background: "#22c55e" }}>
                        View <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Orders Tab
───────────────────────────────────────────────── */
function OrdersTab({ email }: { email: string }) {
  const claimed = getClaimedOrders(email);
  if (claimed.length === 0) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
        <LottieIcon src="/icons/shopping-cart.json" size={38} autoplay loop />
      </div>
      <h3 className="text-[17px] font-bold text-gray-900 mb-2">No orders yet</h3>
      <p className="text-[13.5px] text-gray-400 max-w-xs mx-auto">
        Your eSIM orders will appear here. Head to <strong>My eSIMs</strong> to add one.
      </p>
    </div>
  );
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-[13.5px]">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left px-5 py-3.5 font-semibold text-gray-500">Transaction ID</th>
            <th className="text-left px-5 py-3.5 font-semibold text-gray-500">Added</th>
            <th className="text-right px-5 py-3.5 font-semibold text-gray-500">Action</th>
          </tr>
        </thead>
        <tbody>
          {claimed.map(({ transactionId, addedAt }) => (
            <tr key={transactionId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3.5 font-mono text-gray-800">{transactionId}</td>
              <td className="px-5 py-3.5 text-gray-500">
                {new Date(addedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </td>
              <td className="px-5 py-3.5 text-right">
                <Link href={`/esim/${transactionId}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors">
                  View eSIM <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Profile Tab
───────────────────────────────────────────────── */
function ProfileTab({ user, onUpdate, onNavigate, avatarUrl, onAvatarChange }: {
  user: UserAccount;
  onUpdate: (u: UserAccount) => void;
  onNavigate: (t: DashTab) => void;
  avatarUrl: string;
  onAvatarChange: (url: string) => void;
}) {
  const kycKey   = `voltey-kyc:${user.email}`;
  const profKey  = `voltey-profile:${user.email}`;
  const notifKey = `voltey-notif:${user.email}`;

  type ExtProfile = { address: string; country: string; currency: string };
  type NotifPrefs = { lowData: boolean; expiry: boolean };

  const [name,       setName]       = useState(user.name);
  const [phone,      setPhone]      = useState(user.phone ?? "");
  const [phoneCode,  setPhoneCode]  = useState("+1");
  const [extProfile, setExtProfile] = useState<ExtProfile>(() =>
    JSON.parse(localStorage.getItem(profKey) ?? '{"address":"","country":"","currency":""}')
  );
  const [notif, setNotif] = useState<NotifPrefs>(() =>
    JSON.parse(localStorage.getItem(notifKey) ?? '{"lowData":true,"expiry":true}')
  );
  const [saved, setSaved] = useState(false);

  const kycStatus = (localStorage.getItem(kycKey) ?? "not_submitted") as
    "not_submitted" | "pending" | "approved" | "rejected";
  const initials = (user.name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const kycBadgeMeta = {
    not_submitted: { label: "Not Submitted", color: "#6b7280", bg: "#f9fafb" },
    pending:       { label: "Pending",        color: "#d97706", bg: "#fff7ed" },
    approved:      { label: "Verified",       color: "#16a34a", bg: "#f0fdf4" },
    rejected:      { label: "Rejected",       color: "#dc2626", bg: "#fef2f2" },
  }[kycStatus];

  function save() {
    const updated = { ...user, name: name.trim() || user.name, phone: phone.trim() };
    saveUsers(getUsers().map((u) => (u.email === user.email ? updated : u)));
    onUpdate(updated);
    localStorage.setItem(profKey, JSON.stringify(extProfile));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function toggleNotif(key: keyof NotifPrefs) {
    const updated = { ...notif, [key]: !notif[key] };
    setNotif(updated);
    localStorage.setItem(notifKey, JSON.stringify(updated));
  }

  const COUNTRIES = [
    "United Kingdom","United States","Germany","France","Spain","Italy",
    "Netherlands","Turkey","Japan","Australia","Canada","India","UAE","Singapore","South Korea",
  ];
  const CURRENCIES = [
    "USD – US Dollar","EUR – Euro","GBP – British Pound","AED – UAE Dirham",
    "JPY – Japanese Yen","AUD – Australian Dollar","CAD – Canadian Dollar","SGD – Singapore Dollar",
  ];
  const PHONE_CODES = [
    { code: "+1",   flag: "🇺🇸" }, { code: "+44",  flag: "🇬🇧" },
    { code: "+49",  flag: "🇩🇪" }, { code: "+33",  flag: "🇫🇷" },
    { code: "+34",  flag: "🇪🇸" }, { code: "+81",  flag: "🇯🇵" },
    { code: "+61",  flag: "🇦🇺" }, { code: "+971", flag: "🇦🇪" },
    { code: "+65",  flag: "🇸🇬" }, { code: "+82",  flag: "🇰🇷" },
  ];

  return (
    <div className="max-w-2xl space-y-5">

      {/* Page heading */}
      <div>
        <h1 className="text-[24px] font-bold text-gray-900 mb-0.5">My Profile</h1>
        <p className="text-[13px] text-gray-400">Manage your account information and settings</p>
      </div>

      {/* ── Account Overview ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-[14.5px] font-semibold text-gray-900 mb-0.5">Account Overview</h3>
        <p className="text-[12.5px] text-gray-400 mb-4">Your account status and verification information</p>

        {/* Avatar + name */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-50">
          <div className="relative shrink-0 group">
            {/* Avatar circle */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-[20px] font-black text-white overflow-hidden"
              style={{
                background: avatarUrl ? "transparent" : "linear-gradient(135deg, #0da976 0%, #0b7a56 100%)",
                boxShadow: "0 0 0 3px #d1fae5",
              }}
            >
              {avatarUrl
                ? <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                : initials}
            </div>

            {/* Camera overlay button */}
            <label className="cursor-pointer absolute inset-0 rounded-full flex items-end justify-end">
              <div
                className="w-[22px] h-[22px] rounded-full flex items-center justify-center mb-[1px] mr-[1px] transition-transform group-hover:scale-110"
                style={{ background: "#0da976", border: "2px solid white" }}
              >
                <Camera className="w-2.5 h-2.5 text-white" />
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const reader = new FileReader();
                  reader.onload = ev => {
                    const url = ev.target?.result as string;
                    localStorage.setItem(`voltey-avatar:${user.email}`, url);
                    onAvatarChange(url);
                  };
                  reader.readAsDataURL(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          <div>
            <p className="text-[15px] font-semibold text-gray-900">{user.name || "No name set"}</p>
            <p className="text-[12.5px] text-gray-400 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3 h-3 shrink-0" />
              {user.email}
            </p>
            <p className="text-[11px] text-[#0da976] mt-1 font-medium">Click photo to change</p>
          </div>
        </div>

        {/* KYC row */}
        <div
          className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-100"
          style={{ background: "#fafafa" }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: kycBadgeMeta.bg }}
            >
              <LottieIcon src="/icons/security-card.json" size={17} autoplay loop />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-gray-900">KYC Verification</p>
              <p className="text-[11.5px] text-gray-400">Identity verification status</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap"
              style={{ background: kycBadgeMeta.bg, color: kycBadgeMeta.color }}
            >
              {kycBadgeMeta.label}
            </span>
            {kycStatus !== "approved" && (
              <button
                onClick={() => onNavigate("kyc")}
                className="text-[11.5px] font-bold px-3 py-1.5 rounded-lg text-white whitespace-nowrap transition-colors hover:opacity-90"
                style={{ background: "#0da976" }}
              >
                Submit KYC
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Profile Information ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-[14.5px] font-semibold text-gray-900 mb-0.5">Profile Information</h3>
        <p className="text-[12.5px] text-gray-400 mb-4">Update your personal details</p>

        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="text-[13px] font-medium text-gray-700 block mb-1.5">Full Name</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              type="text" placeholder="John Doe"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13.5px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#0da976]"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-[13px] font-medium text-gray-700 block mb-1.5">Phone Number</label>
            <div className="flex gap-2">
              <select
                value={phoneCode} onChange={e => setPhoneCode(e.target.value)}
                className="border border-gray-200 rounded-xl px-2.5 py-2.5 text-[13px] bg-white text-gray-700 focus:outline-none focus:border-[#0da976] shrink-0"
              >
                {PHONE_CODES.map(({ code, flag }) => (
                  <option key={code} value={code}>{flag} {code}</option>
                ))}
              </select>
              <input
                value={phone} onChange={e => setPhone(e.target.value)}
                type="tel" placeholder="+1 234 567 8800"
                className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13.5px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#0da976]"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-[13px] font-medium text-gray-700 block mb-1.5">Address</label>
            <textarea
              value={extProfile.address}
              onChange={e => setExtProfile(p => ({ ...p, address: e.target.value }))}
              placeholder="123 Main St, City, Country" rows={2}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13.5px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#0da976] resize-none"
            />
          </div>

          {/* Country */}
          <div>
            <label className="text-[13px] font-medium text-gray-700 block mb-1.5">Country</label>
            <select
              value={extProfile.country}
              onChange={e => setExtProfile(p => ({ ...p, country: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13.5px] text-gray-700 bg-white focus:outline-none focus:border-[#0da976]"
            >
              <option value="">Select country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Currency */}
          <div>
            <label className="text-[13px] font-medium text-gray-700 block mb-1.5">Currency</label>
            <select
              value={extProfile.currency}
              onChange={e => setExtProfile(p => ({ ...p, currency: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13.5px] text-gray-700 bg-white focus:outline-none focus:border-[#0da976]"
            >
              <option value="">Select currency</option>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={save}
            className="px-6 py-2.5 rounded-xl text-[13.5px] font-bold text-white transition-all hover:opacity-90"
            style={{ background: "#0da976" }}
          >
            {saved ? "✓ Saved!" : "Save Changes"}
          </button>
          <button
            onClick={() => { setName(user.name); setPhone(user.phone ?? ""); }}
            className="px-6 py-2.5 rounded-xl text-[13.5px] font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* ── Notification Preferences ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2.5 mb-1">
          <LottieIcon src="/icons/notification-bing.json" size={20} autoplay loop />
          <h3 className="text-[14.5px] font-semibold text-gray-900">Notification Preferences</h3>
        </div>
        <p className="text-[12.5px] text-gray-400 mb-4 pl-8">Manage how you receive alerts about your eSIMs</p>

        <div className="space-y-2.5">
          {/* Low Data Alerts */}
          <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-gray-100">
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-gray-900">Low Data Alerts</p>
              <p className="text-[12px] text-gray-400 mt-0.5 leading-snug">
                Receive email notifications when your eSIM reaches 75% or 90% data usage
              </p>
            </div>
            <button
              onClick={() => toggleNotif("lowData")}
              className="w-11 h-6 rounded-full relative shrink-0 transition-colors"
              style={{ background: notif.lowData ? "#0da976" : "#d1d5db" }}
            >
              <div
                className="w-[18px] h-[18px] rounded-full bg-white shadow-sm absolute top-[3px] transition-all duration-200"
                style={{ left: notif.lowData ? "calc(100% - 21px)" : "3px" }}
              />
            </button>
          </div>

          {/* Expiry Alerts */}
          <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-gray-100">
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-gray-900">Expiry Alerts</p>
              <p className="text-[12px] text-gray-400 mt-0.5 leading-snug">
                Get notified when your eSIM is about to expire (3 days and 1 day before expiration)
              </p>
            </div>
            <button
              onClick={() => toggleNotif("expiry")}
              className="w-11 h-6 rounded-full relative shrink-0 transition-colors"
              style={{ background: notif.expiry ? "#0da976" : "#d1d5db" }}
            >
              <div
                className="w-[18px] h-[18px] rounded-full bg-white shadow-sm absolute top-[3px] transition-all duration-200"
                style={{ left: notif.expiry ? "calc(100% - 21px)" : "3px" }}
              />
            </button>
          </div>
        </div>

        {/* Info note */}
        <div
          className="flex items-start gap-2.5 mt-3 p-3.5 rounded-xl border"
          style={{ background: "#f0fdf9", borderColor: "#d1fae5" }}
        >
          <LottieIcon src="/icons/notification.json" size={16} autoplay loop />
          <p className="text-[12px] text-gray-500 leading-relaxed">
            These notifications help you manage your data usage and avoid service interruptions.
            You can change these preferences at any time.
          </p>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-[14.5px] font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button
            onClick={() => onNavigate("orders")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#f0fdf9" }}>
              <LottieIcon src="/icons/shopping-cart.json" size={18} autoplay loop />
            </div>
            <span className="flex-1 text-[13.5px] font-medium text-gray-700">View My Orders</span>
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
          </button>
          <button
            onClick={() => onNavigate("support")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#f0fdf9" }}>
              <LottieIcon src="/icons/message.json" size={18} autoplay loop />
            </div>
            <span className="flex-1 text-[13.5px] font-medium text-gray-700">Contact Support</span>
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
          </button>
        </div>
      </div>

    </div>
  );
}

/* ─────────────────────────────────────────────────
   Security Tab
───────────────────────────────────────────────── */
function SecurityTab({ user, onUpdate }: { user: UserAccount; onUpdate: (u: UserAccount) => void }) {
  const [cur,      setCur]      = useState("");
  const [newPwd,   setNewPwd]   = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [err,      setErr]      = useState("");
  const [saved,    setSaved]    = useState(false);

  function changePwd() {
    if (!cur) { setErr("Please enter your current password."); return; }
    if (cur !== user.password) { setErr("Current password is incorrect."); return; }
    if (newPwd.length < 8) { setErr("New password must be at least 8 characters."); return; }
    if (newPwd !== confirm) { setErr("Passwords do not match."); return; }
    setErr("");
    const updated = { ...user, password: newPwd };
    saveUsers(getUsers().map((u) => (u.email === user.email ? updated : u)));
    onUpdate(updated);
    setCur(""); setNewPwd(""); setConfirm("");
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  }

  const pwdInp = (val: string, set: (v: string) => void, show: boolean, setShow: (v: boolean) => void, ph: string) => (
    <div className="relative">
      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input value={val} onChange={(e) => { set(e.target.value); setErr(""); }}
        type={show ? "text" : "password"} placeholder={ph}
        className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 text-[14px] outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
      <button type="button" onClick={() => setShow(!show)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <div className="max-w-lg space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <LottieIcon src="/icons/security-card.json" size={24} autoplay loop />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-gray-900">Change Password</h3>
            <p className="text-[12.5px] text-gray-400">Keep your account secure</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Current Password</label>
            {pwdInp(cur, setCur, showCur, setShowCur, "Current password")}
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">New Password</label>
            {pwdInp(newPwd, setNewPwd, showNew, setShowNew, "Min. 8 characters")}
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Confirm New Password</label>
            <input value={confirm} onChange={(e) => { setConfirm(e.target.value); setErr(""); }}
              type="password" placeholder="Repeat new password"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
          </div>
          {err && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-[13px] text-red-600">{err}</p>
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-[13px] text-emerald-700">Password updated successfully!</p>
            </div>
          )}
        </div>
        <button onClick={changePwd}
          className="mt-5 px-6 py-2.5 rounded-xl text-[14px] font-bold text-white"
          style={{ background: "#22c55e" }}>
          Update Password
        </button>
      </div>

      {/* 2FA card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <LottieIcon src="/icons/profile-tick.json" size={24} autoplay loop />
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-bold text-gray-900">Two-Factor Authentication</h3>
            <p className="text-[12.5px] text-gray-400">Extra layer of security for your account</p>
          </div>
          <span className="text-[11.5px] font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full whitespace-nowrap">Coming Soon</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   KYC Tab
───────────────────────────────────────────────── */
function KycTab({ user }: { user: UserAccount }) {
  const kycKey = `voltey-kyc:${user.email}`;
  type KycStatus = "not_submitted" | "pending" | "approved" | "rejected";
  const [status, setStatus] = useState<KycStatus>(
    () => (localStorage.getItem(kycKey) as KycStatus | null) ?? "not_submitted"
  );
  const [docType, setDocType] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const statusMeta: Record<KycStatus, { label: string; color: string; bg: string; desc: string }> = {
    not_submitted: { label: "Not Submitted",  color: "#6b7280", bg: "#f9fafb", desc: "Submit your documents to get verified" },
    pending:       { label: "Pending Review", color: "#d97706", bg: "#fff7ed", desc: "Your documents are under review (2–3 business days)" },
    approved:      { label: "Verified",       color: "#16a34a", bg: "#f0fdf4", desc: "Your identity has been verified" },
    rejected:      { label: "Rejected",       color: "#dc2626", bg: "#fef2f2", desc: "Your submission was rejected — please resubmit" },
  };

  const meta = statusMeta[status];

  function handleSubmit() {
    if (!docType || !fileName) return;
    setSubmitting(true);
    setTimeout(() => {
      setStatus("pending");
      localStorage.setItem(kycKey, "pending");
      setSubmitting(false);
    }, 1500);
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Status Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-[15px] font-semibold text-gray-900 mb-0.5">Verification Status</h3>
        <p className="text-[12.5px] text-gray-400 mb-4">Current status of your KYC verification</p>
        <div className="flex items-center gap-3 p-4 rounded-xl"
          style={{ background: meta.bg, border: `1px solid ${meta.color}25` }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: `${meta.color}18` }}>
            <LottieIcon src="/icons/security-card.json" size={22} autoplay loop />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-gray-900">{meta.label}</p>
            <p className="text-[12px] text-gray-400 leading-snug">{meta.desc}</p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0"
            style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}30` }}>
            {meta.label}
          </span>
        </div>
      </div>

      {/* Upload Form */}
      {status !== "approved" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-[15px] font-semibold text-gray-900 mb-0.5">Upload Documents</h3>
          <p className="text-[12.5px] text-gray-400 mb-4">Upload a clear photo or scan of your government-issued ID</p>

          <div className="mb-4">
            <label className="text-[13px] font-medium text-gray-700 block mb-1.5">Document Type</label>
            <select value={docType} onChange={e => setDocType(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13.5px] text-gray-700 focus:outline-none focus:border-[#0da976] bg-white">
              <option value="">Select document type</option>
              <option value="passport">Passport</option>
              <option value="id_card">National ID Card</option>
              <option value="drivers_license">Driver's License</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="text-[13px] font-medium text-gray-700 block mb-1.5">Upload File</label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#0da976] transition-colors bg-gray-50">
              <LottieIcon src="/icons/note-text.json" size={28} autoplay loop />
              {fileName ? (
                <p className="text-[13px] font-medium text-gray-700 mt-2">{fileName}</p>
              ) : (
                <>
                  <p className="text-[13px] text-gray-400 mt-1.5">
                    <span className="font-semibold" style={{ color: "#0da976" }}>Click to upload</span> or drag and drop
                  </p>
                  <p className="text-[11.5px] text-gray-400">PNG, JPG, PDF up to 10 MB</p>
                </>
              )}
              <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.pdf"
                onChange={e => setFileName(e.target.files?.[0]?.name ?? null)} />
            </label>
          </div>

          <div className="rounded-xl p-3.5 mb-4 border" style={{ background: "#f0fdf9", borderColor: "#d1fae5" }}>
            <p className="text-[12.5px] font-semibold mb-2" style={{ color: "#0da976" }}>Document Requirements:</p>
            {[
              "Must be a government-issued ID",
              "Photo should be clear and readable",
              "All corners of the document must be visible",
              "No glare or shadows covering text",
            ].map(req => (
              <div key={req} className="flex items-start gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "#0da976" }} />
                <p className="text-[12.5px]" style={{ color: "#047857" }}>{req}</p>
              </div>
            ))}
          </div>

          <button onClick={handleSubmit} disabled={!docType || !fileName || submitting}
            className="w-full py-3 rounded-xl text-[14px] font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#0da976" }}>
            {submitting ? "Submitting…" : "Submit for Review"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Referrals Tab
───────────────────────────────────────────────── */
function ReferralsTab({ user }: { user: UserAccount }) {
  const seed = user.email.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const refCode = "VOLT" + (seed % 9000 + 1000);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [refTab, setRefTab] = useState<"history" | "gifts">("history");
  const [termsOpen, setTermsOpen] = useState(false);

  function copy(type: "code" | "link") {
    const text = type === "code" ? refCode : `https://voltey.uk/ref/${refCode}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(type);
    setTimeout(() => setCopied(null), 2200);
  }

  const stats = [
    { label: "Total Referrals",      value: "0",    icon: "/icons/people.json"        },
    { label: "Successful Referrals", value: "0",    icon: "/icons/profile-tick.json"  },
    { label: "Total Earnings",       value: "$0.00", icon: "/icons/money-receive.json" },
    { label: "Pending Rewards",      value: "$0.00", icon: "/icons/empty-wallet.json"  },
  ];

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#f0fdf9" }}>
          <LottieIcon src="/icons/people.json" size={22} autoplay loop />
        </div>
        <div>
          <h2 className="text-[18px] font-bold text-gray-900">Referral Program</h2>
          <p className="text-[12.5px] text-gray-400">Refer friends and earn rewards together</p>
        </div>
      </div>

      {/* Referral Code Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-[14px] font-semibold text-gray-700 mb-3">Your Referral Code</h3>
        <div className="rounded-xl p-4 mb-3" style={{ background: "#f8f9fc", border: "1px solid #e5e7eb" }}>
          <p className="text-[11px] text-gray-400 font-medium mb-1 tracking-wide uppercase">Referral Code</p>
          <p className="text-[28px] font-black text-gray-900 tracking-widest">{refCode}</p>
        </div>
        <div className="flex gap-2 mb-3">
          <button onClick={() => copy("code")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            <Copy className="w-3.5 h-3.5" /> {copied === "code" ? "Copied!" : "Copy Code"}
          </button>
          <button onClick={() => copy("link")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold text-white"
            style={{ background: "#0da976" }}>
            <ExternalLink className="w-3.5 h-3.5" /> {copied === "link" ? "Copied!" : "Copy Link"}
          </button>
        </div>
        {/* Share row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Email",     emoji: "📧", href: `mailto:?subject=Join Voltey&body=Use my code: ${refCode}` },
            { label: "WhatsApp",  emoji: "💬", href: `https://wa.me/?text=Get eSIM with Voltey! Use code ${refCode}` },
            { label: "X",        emoji: "𝕏",  href: `https://twitter.com/intent/tweet?text=Get affordable eSIM! Use code ${refCode} on Voltey` },
            { label: "Facebook",  emoji: "f",  href: `https://facebook.com/sharer/sharer.php?u=https://voltey.uk/ref/${refCode}` },
          ].map(({ label, emoji, href }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <span className="text-[16px] leading-none">{emoji}</span>
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11.5px] text-gray-400 font-medium leading-snug">{label}</p>
              <LottieIcon src={icon} size={18} autoplay loop />
            </div>
            <p className="text-[22px] font-black text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-4">How It Works</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { icon: "/icons/people.json",         title: "Share Your Code",  desc: "Share your unique referral code with friends and family" },
            { icon: "/icons/notification-bing.json", title: "They Sign Up",  desc: "Your friend signs up and makes their first purchase" },
            { icon: "/icons/empty-wallet.json",   title: "You Earn Rewards", desc: "Get 10% reward for each successful referral" },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-2 flex items-center justify-center" style={{ background: "#f0fdf9" }}>
                <LottieIcon src={icon} size={26} autoplay loop />
              </div>
              <p className="text-[13px] font-semibold text-gray-900 mb-1">{title}</p>
              <p className="text-[11.5px] text-gray-400 leading-snug">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* History / Gift Cards tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {(["history", "gifts"] as const).map(t => (
            <button key={t} onClick={() => setRefTab(t)}
              className="flex-1 py-3 text-[13px] font-semibold transition-colors"
              style={{
                color: refTab === t ? "#0da976" : "#6b7280",
                borderBottom: refTab === t ? "2px solid #0da976" : "2px solid transparent",
              }}>
              {t === "history" ? "Referral History" : "My Gift Cards"}
            </button>
          ))}
        </div>
        <div className="p-8 text-center">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: "#f0fdf9" }}>
            <LottieIcon src={refTab === "history" ? "/icons/people.json" : "/icons/ticket.json"} size={24} autoplay loop />
          </div>
          <p className="text-[14px] font-semibold text-gray-700 mb-1">
            {refTab === "history" ? "No referrals yet" : "No gift cards yet"}
          </p>
          <p className="text-[12.5px] text-gray-400">
            {refTab === "history" ? "Share your code to start earning rewards!" : "Gift cards will appear here once earned."}
          </p>
        </div>
      </div>

      {/* Terms */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <button onClick={() => setTermsOpen(!termsOpen)}
          className="w-full flex items-center justify-between px-5 py-4 text-[14px] font-semibold text-gray-900">
          Terms &amp; Conditions
          <span className="text-gray-400 text-[11px]">{termsOpen ? "▲" : "▼"}</span>
        </button>
        {termsOpen && (
          <div className="px-5 pb-5 text-[12.5px] text-gray-500 leading-relaxed space-y-2 border-t border-gray-50">
            <p className="pt-3">• Rewards are credited after the referred user completes their first purchase.</p>
            <p>• Rewards are subject to a 30-day holding period before withdrawal.</p>
            <p>• Voltey reserves the right to modify or cancel the program at any time.</p>
            <p>• Self-referrals or fraudulent activity will result in account suspension.</p>
            <p>• Maximum reward per referral cycle: US$50 in gift cards + US$50 in Voltey credits.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Customer Support Tab
───────────────────────────────────────────────── */
function SupportTab({ user }: { user: UserAccount }) {
  const [category, setCategory] = useState<string | null>(null);
  const [subject, setSubject]   = useState("");
  const [message, setMessage]   = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  const categories = [
    { id: "account",  icon: "/icons/user.json",         label: "Account Issues",     desc: "Login, password, profile" },
    { id: "esim",     icon: "/icons/simcard.json",      label: "eSIM Support",       desc: "Activation, connectivity" },
    { id: "billing",  icon: "/icons/empty-wallet.json", label: "Billing & Payments", desc: "Refunds, charges" },
    { id: "other",    icon: "/icons/message.json",      label: "Other",              desc: "General inquiries" },
  ];

  const faqs = [
    { q: "How do I activate my eSIM?",            a: "Go to Settings → Cellular → Add eSIM and scan the QR code from your order confirmation email." },
    { q: "What if my eSIM is not working?",       a: "Try toggling Airplane mode. Go to Settings → Cellular and ensure the eSIM line is selected as active. Contact support if the issue persists." },
    { q: "Can I get a refund for unused data?",   a: "Unactivated eSIMs can be refunded within 30 days of purchase. Contact support with your order ID." },
    { q: "How do I check my remaining data?",     a: "Go to Settings → Cellular → your eSIM plan name to see current data usage directly on your device." },
    { q: "Which devices are eSIM compatible?",    a: "Most iPhones XS and later, and many modern Android flagships support eSIM. Check our compatibility page for the full list." },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !subject || !message) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="max-w-2xl">
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "#f0fdf9" }}>
            <LottieIcon src="/icons/profile-tick.json" size={36} autoplay loop />
          </div>
          <h3 className="text-[18px] font-bold text-gray-900 mb-2">Ticket Submitted!</h3>
          <p className="text-[13.5px] text-gray-500 mb-5 max-w-sm mx-auto">
            We've received your request and will respond within 24–48 hours to <strong>{user.email}</strong>.
          </p>
          <button onClick={() => { setSubmitted(false); setSubject(""); setMessage(""); setCategory(null); }}
            className="px-6 py-2.5 rounded-xl text-[13.5px] font-bold text-white"
            style={{ background: "#0da976" }}>
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#f0fdf9" }}>
          <LottieIcon src="/icons/message.json" size={22} autoplay loop />
        </div>
        <div>
          <h2 className="text-[18px] font-bold text-gray-900">Customer Support</h2>
          <p className="text-[12.5px] text-gray-400">We typically reply within 24 hours</p>
        </div>
      </div>

      {/* Category picker */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-3">What do you need help with?</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {categories.map(({ id, icon, label, desc }) => (
            <button key={id} onClick={() => setCategory(id)}
              className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
              style={{
                borderColor: category === id ? "#0da976" : "#e5e7eb",
                background:  category === id ? "#f0fdf9" : "#fff",
              }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: category === id ? "#0da976" : "#f5f5f7" }}>
                <LottieIcon src={icon} size={20} autoplay loop
                  style={{ filter: category === id ? "brightness(0) invert(1)" : "none" }} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-gray-900 leading-snug">{label}</p>
                <p className="text-[11px] text-gray-400 truncate">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Contact form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h3 className="text-[14px] font-semibold text-gray-900">Send us a message</h3>
        <div>
          <label className="text-[13px] font-medium text-gray-700 block mb-1.5">Subject</label>
          <input value={subject} onChange={e => setSubject(e.target.value)}
            placeholder="Briefly describe your issue"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13.5px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#0da976]" />
        </div>
        <div>
          <label className="text-[13px] font-medium text-gray-700 block mb-1.5">Message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Please describe your issue in detail…"
            rows={5}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13.5px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#0da976] resize-none" />
        </div>
        <button type="submit" disabled={!category || !subject || !message}
          className="w-full py-3 rounded-xl text-[14px] font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "#0da976" }}>
          Send Message
        </button>
      </form>

      {/* FAQ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-3">Frequently Asked Questions</h3>
        <div className="space-y-2">
          {faqs.map(({ q, a }, i) => (
            <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
              <button onClick={() => setOpenFaqIdx(openFaqIdx === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-[13.5px] font-medium text-gray-900 text-left gap-3">
                <span>{q}</span>
                <span className="text-gray-400 text-[11px] shrink-0">{openFaqIdx === i ? "▲" : "▼"}</span>
              </button>
              {openFaqIdx === i && (
                <div className="px-4 pb-3.5 text-[12.5px] text-gray-500 leading-relaxed border-t border-gray-50">{a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Top-up Tab
───────────────────────────────────────────────── */
function TopupTab({ user }: { user: UserAccount }) {
  const balKey = `voltey-balance:${user.email}`;
  const txKey  = `voltey-topup-tx:${user.email}`;
  type Tx = { id: string; amount: number; date: string; method: string };

  const [balance, setBalance]     = useState(() => parseFloat(localStorage.getItem(balKey) ?? "0"));
  const [txs, setTxs]             = useState<Tx[]>(() => JSON.parse(localStorage.getItem(txKey) ?? "[]"));
  const [preset, setPreset]       = useState<number | null>(null);
  const [custom, setCustom]       = useState("");
  const [method, setMethod]       = useState("card");
  const [processing, setProcessing] = useState(false);
  const [successAmt, setSuccessAmt] = useState<number | null>(null);

  const finalAmount = preset ?? (parseFloat(custom) || 0);

  function handleTopup() {
    if (!finalAmount || finalAmount < 1) return;
    setProcessing(true);
    setTimeout(() => {
      const newBal = balance + finalAmount;
      setBalance(newBal);
      localStorage.setItem(balKey, String(newBal));
      const tx: Tx = { id: "TX" + Date.now(), amount: finalAmount, date: new Date().toISOString(), method };
      const newTxs = [tx, ...txs];
      setTxs(newTxs);
      localStorage.setItem(txKey, JSON.stringify(newTxs));
      setProcessing(false);
      setSuccessAmt(finalAmount);
      setPreset(null);
      setCustom("");
      setTimeout(() => setSuccessAmt(null), 3500);
    }, 1800);
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Balance Card */}
      <div className="rounded-2xl p-6 text-white"
        style={{ background: "linear-gradient(135deg, #0da976 0%, #0b7a56 100%)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
            <LottieIcon src="/icons/empty-wallet.json" size={24} autoplay loop
              style={{ filter: "brightness(0) invert(1)" }} />
          </div>
          <div>
            <p className="text-[11.5px] text-white/70 font-medium uppercase tracking-wide">Voltey Wallet Balance</p>
            <p className="text-[32px] font-black leading-none">US${balance.toFixed(2)}</p>
          </div>
        </div>
        <p className="text-[12px] text-white/60">Use your balance to purchase eSIM plans instantly at checkout</p>
      </div>

      {/* Top-up Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Add Funds</h3>

        <p className="text-[12.5px] text-gray-400 font-medium mb-2">Select Amount</p>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[5, 10, 25, 50].map(p => (
            <button key={p} onClick={() => { setPreset(p); setCustom(""); }}
              className="py-2.5 rounded-xl border text-[15px] font-bold transition-all"
              style={{
                borderColor: preset === p ? "#0da976" : "#e5e7eb",
                background:  preset === p ? "#f0fdf9" : "#fff",
                color:       preset === p ? "#0da976" : "#374151",
              }}>
              ${p}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label className="text-[12.5px] text-gray-400 font-medium block mb-1.5">Or enter custom amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-gray-400">$</span>
            <input type="number" min="1" max="500" placeholder="0.00" value={custom}
              onChange={e => { setCustom(e.target.value); setPreset(null); }}
              className="w-full border border-gray-200 rounded-xl pl-7 pr-3 py-2.5 text-[14px] font-semibold text-gray-700 focus:outline-none focus:border-[#0da976]" />
          </div>
        </div>

        <p className="text-[12.5px] text-gray-400 font-medium mb-2">Payment Method</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { id: "card",   label: "Credit Card",    icon: "/icons/card.json"          },
            { id: "wallet", label: "Digital Wallet", icon: "/icons/empty-wallet.json"  },
            { id: "crypto", label: "Crypto",         icon: "/icons/chart.json"         },
          ].map(({ id, label, icon }) => (
            <button key={id} onClick={() => setMethod(id)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl border text-[12px] font-medium transition-all"
              style={{
                borderColor: method === id ? "#0da976" : "#e5e7eb",
                background:  method === id ? "#f0fdf9" : "#fff",
                color:       method === id ? "#0da976" : "#6b7280",
              }}>
              <LottieIcon src={icon} size={20} autoplay loop />
              {label}
            </button>
          ))}
        </div>

        {successAmt !== null && (
          <div className="mb-3 rounded-xl p-3 flex items-center gap-2 border" style={{ background: "#f0fdf9", borderColor: "#d1fae5" }}>
            <LottieIcon src="/icons/profile-tick.json" size={18} autoplay loop />
            <p className="text-[13px] font-semibold" style={{ color: "#0da976" }}>
              US${successAmt.toFixed(2)} added to your wallet!
            </p>
          </div>
        )}

        <button onClick={handleTopup} disabled={!finalAmount || finalAmount < 1 || processing}
          className="w-full py-3 rounded-xl text-[14px] font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "#0da976" }}>
          {processing ? "Processing…" : `Add US$${finalAmount > 0 ? finalAmount.toFixed(2) : "0.00"} to Wallet`}
        </button>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-3">Transaction History</h3>
        {txs.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: "#f0fdf9" }}>
              <LottieIcon src="/icons/empty-wallet.json" size={26} autoplay loop />
            </div>
            <p className="text-[13.5px] font-semibold text-gray-600">No transactions yet</p>
            <p className="text-[12px] text-gray-400">Your top-up history will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {txs.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#f0fdf9" }}>
                    <LottieIcon src="/icons/money-receive.json" size={16} autoplay loop />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">Wallet Top-up</p>
                    <p className="text-[11.5px] text-gray-400">
                      {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <p className="text-[14px] font-bold" style={{ color: "#0da976" }}>+US${tx.amount.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Dashboard Shell
───────────────────────────────────────────────── */
const TABS: { id: DashTab; icon: string; label: string }[] = [
  { id: "overview",   icon: "/icons/home-trend-up.json",  label: "Overview"            },
  { id: "profile",    icon: "/icons/user.json",           label: "Account Information"  },
  { id: "my-esims",   icon: "/icons/simcard.json",        label: "My eSIM Details"      },
  { id: "orders",     icon: "/icons/shopping-cart.json",  label: "Order History"        },
  { id: "kyc",        icon: "/icons/security-card.json",  label: "KYC Verification"     },
  { id: "referrals",  icon: "/icons/people.json",         label: "Referrals"            },
  { id: "support",    icon: "/icons/message.json",        label: "Customer Support"     },
  { id: "topup",      icon: "/icons/empty-wallet.json",   label: "Top-up Wallet"        },
  { id: "security",   icon: "/icons/setting.json",        label: "Security"             },
];

const TITLES: Record<DashTab, { title: string; sub: string }> = {
  overview:   { title: "Overview",             sub: "Welcome to your Voltey account"        },
  profile:    { title: "Account Information",  sub: "Manage your personal details"          },
  "my-esims": { title: "My eSIM Details",      sub: "View and manage your eSIM cards"       },
  orders:     { title: "Order History",        sub: "Your purchase history"                 },
  kyc:        { title: "KYC Verification",     sub: "Complete your identity verification"   },
  referrals:  { title: "Referral Program",     sub: "Refer friends and earn rewards"        },
  support:    { title: "Customer Support",     sub: "Get help from our support team"        },
  topup:      { title: "Top-up Wallet",        sub: "Add funds to your Voltey wallet"       },
  security:   { title: "Security",             sub: "Password and account security"         },
};

function UserDashboard({ user, onLogout, onUpdate }: { user: UserAccount; onLogout: () => void; onUpdate: (u: UserAccount) => void }) {
  const [tab, setTab] = useState<DashTab>("overview");
  const claimed = getClaimedOrders(user.email);
  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const [avatarUrl, setAvatarUrl] = useState<string>(
    () => localStorage.getItem(`voltey-avatar:${user.email}`) ?? ""
  );

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "Poppins, sans-serif", background: "#f8f9fc" }}>

      {/* Sidebar */}
      <div className="hidden lg:flex flex-col w-[260px] bg-white border-r border-gray-100 shrink-0 overflow-y-auto">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100 shrink-0">
          <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
            <img src="/logo-green.png" alt="Voltey" className="h-8 w-auto" />
          </Link>
        </div>

        {/* User */}
        <div className="px-4 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-black text-white shrink-0 overflow-hidden"
              style={{ background: avatarUrl ? "transparent" : "linear-gradient(135deg, #0da976 0%, #0b7a56 100%)" }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : initials}
            </div>
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">Account Settings</p>
          <div className="space-y-0.5">
            {TABS.map(({ id, icon, label }) => {
              const active = tab === id;
              return (
                <button key={id} onClick={() => setTab(id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all"
                  style={{
                    background: active ? "#f0fdf9" : "transparent",
                    color:      active ? "#0da976" : "#4b5563",
                  }}>
                  <div className="w-5 h-5 shrink-0">
                    <LottieIcon src={icon} size={20} autoplay loop />
                  </div>
                  <span className="flex-1 text-left truncate">{label}</span>
                  {active && <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#0da976" }} />}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 border-t border-gray-100 space-y-0.5 shrink-0">
          <Link href="/destinations"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all">
            <Globe className="w-[17px] h-[17px] shrink-0" />
            Browse Plans
          </Link>
          <button onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-red-500 hover:bg-red-50 transition-all">
            <LogOut className="w-[17px] h-[17px] shrink-0" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 h-[64px] px-4 sm:px-7 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-[17px] font-bold text-gray-900">{TITLES[tab].title}</h1>
            <p className="text-[11.5px] text-gray-400 mt-0.5 hidden sm:block">{TITLES[tab].sub}</p>
          </div>
          <Link href="/destinations"
            className="px-4 py-2 rounded-xl text-[13.5px] font-bold text-white flex items-center gap-1.5"
            style={{ background: "#22c55e" }}>
            <Zap className="w-3.5 h-3.5" /> Buy eSIM
          </Link>
        </header>

        {/* Mobile tab navigation */}
        <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-2">
          <select
            value={tab}
            onChange={(e) => setTab(e.target.value as DashTab)}
            className="w-full text-[14px] font-medium text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5"
          >
            {TABS.map(({ id, label }) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-7 overflow-y-auto">
          {tab === "overview"  && <OverviewTab user={user} claimedCount={claimed.length} onNavigate={setTab} avatarUrl={avatarUrl} />}
          {tab === "my-esims"  && <MyEsimsTab email={user.email} />}
          {tab === "orders"    && <OrdersTab email={user.email} />}
          {tab === "profile"   && <ProfileTab user={user} onUpdate={onUpdate} onNavigate={setTab} avatarUrl={avatarUrl} onAvatarChange={setAvatarUrl} />}
          {tab === "security"  && <SecurityTab user={user} onUpdate={onUpdate} />}
          {tab === "kyc"       && <KycTab user={user} />}
          {tab === "referrals" && <ReferralsTab user={user} />}
          {tab === "support"   && <SupportTab user={user} />}
          {tab === "topup"     && <TopupTab user={user} />}
        </main>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Root
───────────────────────────────────────────────── */
export default function Account() {
  const [user, setUser] = useState<UserAccount | null>(getSession);

  function handleLogin(acc: UserAccount, remember: boolean) {
    saveSession(acc, remember);
    setUser(acc);
  }

  function handleLogout() {
    clearSession();
    setUser(null);
  }

  function handleUpdate(updated: UserAccount) {
    setUser(updated);
    const isLocal = !!localStorage.getItem(SESSION_KEY);
    const data = JSON.stringify(updated);
    if (isLocal) localStorage.setItem(SESSION_KEY, data);
    else sessionStorage.setItem(SESSION_KEY, data);
  }

  if (!user) return <UserLoginPage onLogin={handleLogin} />;
  return <UserDashboard user={user} onLogout={handleLogout} onUpdate={handleUpdate} />;
}

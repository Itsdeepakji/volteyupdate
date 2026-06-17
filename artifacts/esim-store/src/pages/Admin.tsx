import { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HeaderFooterEditor, HomePageEditor, ProductPageEditor, DestinationPageEditor } from "./AdminContentEditors";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import {
  ShoppingCart, Users,
  Bell, BarChart2, TrendingUp, Settings,
  CheckCircle, Clock, Search, RefreshCw, Mail, ExternalLink,
  ChevronDown, ChevronRight, AlertCircle, ArrowLeft,
  Download, MoreVertical, Plus, Eye, Pencil, Trash2, PackageOpen,
  X, UserCheck, Phone, Star, Package, Plug, Wifi,
  Copy, Check,
  Globe, Lock, ShieldCheck, Smartphone, Zap, Wrench,
  Database, LayoutGrid, Palette, EyeOff, LogOut, Upload,
} from "lucide-react";
import { LottieIcon } from "@/components/LottieIcon";

/* ─────────────────────────────────────────────────
   Types
───────────────────────────────────────────────── */
type Order = {
  id: number; transactionId: string; orderNo: string | null;
  customerEmail: string; packageCode: string; packageName: string;
  price: number; quantity: number; status: string;
  esimProfiles: { iccid?: string; ac?: string; qrCodeUrl?: string }[] | null;
  emailSent: string; createdAt: string; updatedAt: string;
};
type Stats = {
  totalOrders: number; totalRevenue: number;
  completedOrders: number; pendingOrders: number; failedOrders: number;
};
type ApiCustomer = {
  id: number; uid: string; name: string; email: string;
  phone: string | null; kycStatus: string; userStatus: string;
  notes: string | null; createdAt: string; updatedAt: string;
};
type CustomerStats = { total: number; verified: number; pendingKyc: number };
type Tab = string;

/* ─────────────────────────────────────────────────
   Sidebar config (matches reference UI exactly)
───────────────────────────────────────────────── */
type NavItem  = { id: Tab; iconSrc: string; label: string };
type NavGroup = { id: string; heading: string; iconSrc: string; items: NavItem[]; defaultOpen?: boolean };
type NavEntry = { type: "item"; item: NavItem } | { type: "group"; group: NavGroup };

const I = (n: string) => `/icons/${n}.json`;

const NAV: NavEntry[] = [
  { type: "item",  item: { id: "dashboard", iconSrc: I("element-4"), label: "Dashboard" } },
  { type: "group", group: { id: "orders-mgmt", heading: "Order Management", iconSrc: I("shopping-cart"), defaultOpen: true,
    items: [
      { id: "orders",        iconSrc: I("shopping-cart"), label: "Orders" },
      { id: "custom-orders", iconSrc: I("bag"),           label: "Custom Orders" },
      { id: "topup-orders",  iconSrc: I("wallet-add"),    label: "Top-up Orders" },
    ],
  }},
  { type: "group", group: { id: "user-mgmt", heading: "User Management", iconSrc: I("people"), defaultOpen: true,
    items: [
      { id: "customers", iconSrc: I("people"),       label: "Customers" },
      { id: "kyc",       iconSrc: I("profile-tick"), label: "KYC Verification" },
    ],
  }},
  { type: "group", group: { id: "esim-packages", heading: "Master eSIM Packages", iconSrc: I("simcard"), defaultOpen: false,
    items: [
      { id: "providers",        iconSrc: I("simcard"),    label: "Providers" },
      { id: "esim-catalog",     iconSrc: I("category"),   label: "eSIM Catalog" },
      { id: "topup-packages",   iconSrc: I("wallet-add"), label: "Topup Packages" },
      { id: "regions",          iconSrc: I("global"),     label: "Regions" },
      { id: "countries",        iconSrc: I("global"),     label: "Countries" },
    ],
  }},
  { type: "group", group: { id: "marketing", heading: "Marketing", iconSrc: I("tag"), defaultOpen: false,
    items: [
      { id: "vouchers",  iconSrc: I("ticket"),   label: "Vouchers" },
      { id: "giftcards", iconSrc: I("tag"),       label: "Gift Cards" },
      { id: "referral",  iconSrc: I("user-add"),  label: "Referral Program" },
    ],
  }},
  { type: "group", group: { id: "support", heading: "Support System", iconSrc: I("message"), defaultOpen: false,
    items: [{ id: "support-tickets", iconSrc: I("message"), label: "Support" }],
  }},
  { type: "item",  item: { id: "in-app-purchases", iconSrc: I("bag"),  label: "In App Purchases" } },
  { type: "group", group: { id: "payment-gateways-grp", heading: "Payment Gateways", iconSrc: I("card"), defaultOpen: true,
    items: [
      { id: "gateways", iconSrc: I("card"), label: "Gateways" },
    ],
  }},
  { type: "group", group: { id: "alerts", heading: "Alerts", iconSrc: I("notification-bing"), defaultOpen: false,
    items: [{ id: "notifications", iconSrc: I("notification-bing"), label: "Notifications" }],
  }},
  { type: "group", group: { id: "reporting", heading: "Reporting", iconSrc: I("chart-presentation"), defaultOpen: false,
    items: [
      { id: "analytics",          iconSrc: I("chart-presentation"), label: "Analytics & Reports" },
      { id: "advanced-analytics", iconSrc: I("graph"),              label: "Advanced Analytics" },
      { id: "reviews",            iconSrc: I("home-trend-up"),      label: "Reviews" },
    ],
  }},
  { type: "group", group: { id: "platform", heading: "Platform Setup", iconSrc: I("setting"), defaultOpen: false,
    items: [
      { id: "settings",          iconSrc: I("setting"),      label: "Settings" },
      { id: "currencies",        iconSrc: I("empty-wallet"), label: "Currencies" },
      { id: "failover-api",      iconSrc: I("code"),         label: "Failover & API" },
      { id: "banner-management", iconSrc: I("note-text"),    label: "Banner Management" },
      { id: "pages-management",  iconSrc: I("note-text"),    label: "Pages Management" },
      { id: "faq-management",    iconSrc: I("message"),      label: "FAQ Management" },
      { id: "maintenance",       iconSrc: I("setting"),      label: "Maintenance" },
    ],
  }},
  { type: "item", item: { id: "internationalization", iconSrc: I("global"),   label: "Internationalization" } },
  { type: "item", item: { id: "blog",                 iconSrc: I("book"),     label: "Blog" } },
  { type: "item", item: { id: "api-docs",             iconSrc: I("code"),     label: "API Docs" } },
  { type: "group", group: { id: "website-content", heading: "Website Content", iconSrc: I("note-text"), defaultOpen: false,
    items: [
      { id: "wc-header-footer",   iconSrc: I("note-text"),      label: "Header & Footer" },
      { id: "wc-home-page",       iconSrc: I("home-trend-up"),  label: "Home Page" },
      { id: "wc-product-page",    iconSrc: I("category"),       label: "Product Page" },
      { id: "wc-destination-page",iconSrc: I("global"),         label: "Destination Page" },
    ],
  }},
];

const TAB_LABELS: Record<string, string> = Object.fromEntries(
  NAV.flatMap((e) =>
    e.type === "item" ? [[e.item.id, e.item.label]] : e.group.items.map((i) => [i.id, i.label])
  )
);

/* ─────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────── */
function fmtUsd(raw: number) { return (raw / 10000).toFixed(2); }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
function fmtRelTime(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  return `about ${months} month${months !== 1 ? "s" : ""} ago`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    completed: { label: "Completed", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    pending:   { label: "Pending",   cls: "bg-amber-50 text-amber-700 border-amber-200" },
    failed:    { label: "Failed",    cls: "bg-red-50 text-red-600 border-red-200" },
  };
  const s = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-500 border-gray-200" };
  return (
    <span className={`inline-flex items-center text-[11.5px] font-semibold px-2.5 py-1 rounded-full border ${s.cls}`}>
      {s.label}
    </span>
  );
}

/* ─────────────────────────────────────────────────
   KYC Verification page
───────────────────────────────────────────────── */
type DocType = "national_id" | "passport" | "proof_of_address" | "drivers_license" | "other";
type KycStatus = "pending" | "approved" | "rejected";

interface KycSubmission {
  id: string; customerName: string; customerEmail: string;
  documentType: DocType; documentNumber: string;
  documentImageUrl: string; backImageUrl: string; selfieUrl: string;
  status: KycStatus; rejectionReason: string; notes: string;
  submittedAt: string; reviewedAt: string; reviewedBy: string;
}

const DOC_TYPE_LABELS: Record<DocType, string> = {
  national_id:      "National ID",
  passport:         "Passport",
  proof_of_address: "Proof Of Address",
  drivers_license:  "Driver's Licence",
  other:            "Other",
};

function KycBadgeStatus({ status }: { status: KycStatus }) {
  if (status === "approved") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <LottieIcon src="/icons/lottie/tick-circle.json" size={14} autoplay loop />
      Approved
    </span>
  );
  if (status === "rejected") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-600 border border-red-200">
      <LottieIcon src="/icons/lottie/close-circle.json" size={14} autoplay loop />
      Rejected
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
      <LottieIcon src="/icons/lottie/clock.json" size={14} autoplay loop />
      Pending
    </span>
  );
}

function KycVerificationPage() {
  const queryClient = useQueryClient();
  const [activeTab,    setActiveTab]    = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [searchKyc,    setSearchKyc]    = useState("");
  const [drawer,       setDrawer]       = useState<KycSubmission | null>(null);
  const [rejectModal,  setRejectModal]  = useState<KycSubmission | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [addModal,     setAddModal]     = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [addForm, setAddForm] = useState({
    customerName: "", customerEmail: "", documentType: "national_id" as DocType, documentNumber: "", notes: "",
  });

  const statsQ = useQuery<{ total: number; pending: number; approved: number; rejected: number }>({
    queryKey: ["kyc-stats"],
    queryFn: () => fetch("/api/admin/kyc/stats").then(r => r.json()),
    staleTime: 15_000,
  });
  const stats = statsQ.data ?? { total: 0, pending: 0, approved: 0, rejected: 0 };

  const listQ = useQuery<{ submissions: KycSubmission[] }>({
    queryKey: ["kyc-list", activeTab, searchKyc],
    queryFn: () => {
      const p = new URLSearchParams();
      if (activeTab !== "all") p.set("status", activeTab);
      if (searchKyc) p.set("search", searchKyc);
      return fetch(`/api/admin/kyc?${p}`).then(r => r.json());
    },
    staleTime: 15_000,
  });
  const submissions = listQ.data?.submissions ?? [];

  function refetchAll() {
    queryClient.invalidateQueries({ queryKey: ["kyc-stats"] });
    queryClient.invalidateQueries({ queryKey: ["kyc-list"] });
  }

  async function handleApprove(item: KycSubmission) {
    setSaving(true);
    await fetch(`/api/admin/kyc/${item.id}/approve`, { method: "PATCH" });
    refetchAll(); setSaving(false);
    if (drawer?.id === item.id) setDrawer(s => s ? { ...s, status: "approved", reviewedAt: new Date().toISOString() } : s);
  }

  async function handleReject() {
    if (!rejectModal) return;
    setSaving(true);
    await fetch(`/api/admin/kyc/${rejectModal.id}/reject`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason || "Does not meet verification requirements." }),
    });
    refetchAll(); setSaving(false); setRejectModal(null); setRejectReason("");
    if (drawer?.id === rejectModal.id) setDrawer(s => s ? { ...s, status: "rejected" } : s);
  }

  async function handleReset(item: KycSubmission) {
    await fetch(`/api/admin/kyc/${item.id}/reset`, { method: "PATCH" });
    refetchAll();
    if (drawer?.id === item.id) setDrawer(s => s ? { ...s, status: "pending", reviewedAt: "" } : s);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/kyc/${id}`, { method: "DELETE" });
    refetchAll(); if (drawer?.id === id) setDrawer(null);
  }

  async function handleAdd() {
    if (!addForm.customerName || !addForm.customerEmail) return;
    setSaving(true);
    await fetch("/api/admin/kyc", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(addForm),
    });
    refetchAll(); setSaving(false); setAddModal(false);
    setAddForm({ customerName: "", customerEmail: "", documentType: "national_id", documentNumber: "", notes: "" });
  }

  const fmtDate = (s: string) => s ? new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  const tabCounts: Record<string, number> = {
    pending: stats.pending, approved: stats.approved, rejected: stats.rejected, all: stats.total,
  };
  const TABS: { id: "pending" | "approved" | "rejected" | "all"; label: string; color: string }[] = [
    { id: "pending",  label: "Pending",  color: "#f59e0b" },
    { id: "approved", label: "Approved", color: "#22c55e" },
    { id: "rejected", label: "Rejected", color: "#ef4444" },
    { id: "all",      label: "All",      color: "#6b7280" },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
            <LottieIcon src="/icons/profile-tick.json" size={26} autoplay loop />
          </div>
          <div>
            <h1 className="text-[26px] font-bold text-gray-900">KYC Verification Queue</h1>
            <p className="text-[13.5px] text-gray-400 mt-0.5">Review and approve customer identity documents</p>
          </div>
        </div>
        <button onClick={() => setAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13.5px] font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: "#22c55e" }}>
          <span className="text-[16px] leading-none">+</span>
          Add Submission
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Pending Reviews",   val: stats.pending,  bg: "#fffbeb", accent: "#f59e0b", icon: "/icons/lottie/clock.json" },
          { label: "Approved",          val: stats.approved, bg: "#f0fdf4", accent: "#22c55e", icon: "/icons/lottie/tick-circle.json" },
          { label: "Rejected",          val: stats.rejected, bg: "#fff1f2", accent: "#ef4444", icon: "/icons/lottie/close-circle.json" },
          { label: "Total Submissions", val: stats.total,    bg: "#f0f9ff", accent: "#3b82f6", icon: "/icons/lottie/document-text.json" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
              <LottieIcon src={s.icon} size={30} autoplay loop />
            </div>
            <div>
              <p className="text-[26px] font-extrabold leading-none" style={{ color: s.accent }}>{s.val}</p>
              <p className="text-[11.5px] text-gray-400 mt-1 leading-tight">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs + search */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${activeTab === t.id ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
              {t.label}
              <span className={`text-[10.5px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === t.id ? "text-white" : "text-gray-400 bg-gray-200"}`}
                style={activeTab === t.id ? { background: t.color } : {}}>
                {tabCounts[t.id]}
              </span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={searchKyc} onChange={e => setSearchKyc(e.target.value)}
            placeholder="Search by name or email…"
            className="pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 outline-none focus:border-green-400 transition-colors w-64" />
        </div>
      </div>

      {/* Main table card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-[16px] font-bold text-gray-900 capitalize">
            {activeTab === "all" ? "All Submissions" : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Requests`}
          </h2>
          <p className="text-[12.5px] text-gray-400 mt-0.5">
            {activeTab === "pending" ? "Review and process KYC documents" :
             activeTab === "approved" ? "Verified customer identities" :
             activeTab === "rejected" ? "Submissions that did not pass review" :
             "All customer identity submissions"}
          </p>
        </div>

        {listQ.isLoading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-gray-300" />
            <p className="text-[13.5px] text-gray-400">Loading submissions…</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
              <LottieIcon src="/icons/lottie/document-text.json" size={36} autoplay loop />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-gray-700">No {activeTab !== "all" ? activeTab : ""} submissions</p>
              <p className="text-[13px] text-gray-400 mt-1">
                {activeTab === "pending" ? "All documents have been reviewed." : "No submissions match this filter."}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {submissions.map(item => (
              <div key={item.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/40 transition-colors flex-wrap">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
                  <span className="text-[15px] font-bold text-white">{item.customerName.charAt(0).toUpperCase()}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-gray-900 truncate">{item.customerName}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[12px] text-gray-500">{DOC_TYPE_LABELS[item.documentType]}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-[11.5px] text-gray-400 flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="13" rx="2" stroke="#9ca3af" strokeWidth="1.2" /><path d="M5 1v2M11 1v2M1 6h14" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" /></svg>
                      {fmtDate(item.submittedAt)}
                    </span>
                    {item.documentNumber && <span className="text-[11px] text-gray-400 font-mono">#{item.documentNumber}</span>}
                  </div>
                </div>

                {/* Status badge (always visible) */}
                <KycBadgeStatus status={item.status} />

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setDrawer(item)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-[12.5px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                    <Eye className="w-3.5 h-3.5" /> Review
                  </button>
                  {item.status !== "approved" && (
                    <button onClick={() => handleApprove(item)} disabled={saving}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                      style={{ background: "#22c55e" }}>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="7" fill="rgba(255,255,255,0.3)" /><path d="M4 7l2.5 2.5 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      Approve
                    </button>
                  )}
                  {item.status !== "rejected" && (
                    <button onClick={() => { setRejectModal(item); setRejectReason(""); }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="7" fill="rgba(255,255,255,0.3)" /><path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" /></svg>
                      Reject
                    </button>
                  )}
                  {(item.status === "approved" || item.status === "rejected") && (
                    <button onClick={() => handleReset(item)}
                      className="p-2 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors" title="Reset to Pending">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Review Drawer ── */}
      {drawer && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setDrawer(null)}>
          <div className="flex-1 bg-black/40" />
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-[16px] font-bold text-gray-900">KYC Review</h3>
                <p className="text-[12px] text-gray-400">{drawer.customerName}</p>
              </div>
              <button onClick={() => setDrawer(null)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 flex-1">
              {/* Customer info */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                  <span className="text-[22px] font-bold text-white">{drawer.customerName.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-[16px] font-bold text-gray-900">{drawer.customerName}</p>
                  <p className="text-[13px] text-gray-500">{drawer.customerEmail}</p>
                  <div className="mt-1"><KycBadgeStatus status={drawer.status} /></div>
                </div>
              </div>

              {/* Document details */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Document Details</p>
                {[
                  { label: "Document Type",  value: DOC_TYPE_LABELS[drawer.documentType] },
                  { label: "Document Number", value: drawer.documentNumber || "—" },
                  { label: "Submitted",      value: fmtDate(drawer.submittedAt) },
                  { label: "Submission ID",  value: drawer.id },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-start">
                    <p className="text-[12px] font-semibold text-gray-500">{row.label}</p>
                    <p className="text-[12.5px] font-bold text-gray-800 text-right max-w-[55%] break-all">{row.value}</p>
                  </div>
                ))}
              </div>

              {/* Document image placeholder */}
              <div>
                <p className="text-[12px] font-bold text-gray-500 mb-2 uppercase tracking-wide">Document Image</p>
                <div className="w-full h-44 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2">
                  <LottieIcon
                    src={drawer.documentType === "passport" ? "/icons/lottie/personalcard.json" :
                         drawer.documentType === "proof_of_address" ? "/icons/lottie/home.json" :
                         drawer.documentType === "drivers_license" ? "/icons/lottie/personalcard.json" :
                         "/icons/security-card.json"}
                    size={52} autoplay loop
                  />
                  <p className="text-[12.5px] font-semibold text-gray-400">{DOC_TYPE_LABELS[drawer.documentType]}</p>
                  {drawer.documentImageUrl
                    ? <img src={drawer.documentImageUrl} alt="document" className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
                    : <p className="text-[11px] text-gray-400">No image uploaded</p>}
                </div>
              </div>

              {/* Review info */}
              {drawer.reviewedAt && (
                <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Review Information</p>
                  <div className="flex justify-between">
                    <p className="text-[12px] font-semibold text-gray-500">Reviewed By</p>
                    <p className="text-[12.5px] font-bold text-gray-800">{drawer.reviewedBy || "—"}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-[12px] font-semibold text-gray-500">Reviewed At</p>
                    <p className="text-[12.5px] font-bold text-gray-800">{fmtDate(drawer.reviewedAt)}</p>
                  </div>
                  {drawer.rejectionReason && (
                    <div>
                      <p className="text-[12px] font-semibold text-gray-500 mb-1">Rejection Reason</p>
                      <p className="text-[12.5px] text-red-600 bg-red-50 rounded-xl px-3 py-2 border border-red-100">{drawer.rejectionReason}</p>
                    </div>
                  )}
                </div>
              )}

              {drawer.notes && (
                <div>
                  <p className="text-[12px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Notes</p>
                  <p className="text-[13px] text-gray-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">{drawer.notes}</p>
                </div>
              )}
            </div>

            {/* Drawer actions (sticky footer) */}
            {drawer.status === "pending" && (
              <div className="px-6 py-4 border-t border-gray-100 bg-white sticky bottom-0 flex gap-3">
                <button onClick={() => { setRejectModal(drawer); setRejectReason(""); setDrawer(null); }}
                  className="flex-1 py-2.5 rounded-xl text-[13.5px] font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors">
                  Reject
                </button>
                <button onClick={() => handleApprove(drawer)} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-[13.5px] font-semibold text-white disabled:opacity-60 transition-colors"
                  style={{ background: "#22c55e" }}>
                  {saving ? "Approving…" : "Approve"}
                </button>
              </div>
            )}
            {drawer.status !== "pending" && (
              <div className="px-6 py-4 border-t border-gray-100 bg-white sticky bottom-0">
                <button onClick={() => handleReset(drawer)}
                  className="w-full py-2.5 rounded-xl text-[13.5px] font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                  Reset to Pending
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Reject Modal ── */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setRejectModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center gap-2 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                <LottieIcon src="/icons/lottie/close-circle.json" size={32} autoplay loop />
              </div>
              <h3 className="text-[16px] font-bold text-gray-900">Reject Submission</h3>
              <p className="text-[13px] text-gray-500">Provide a reason for <b>{rejectModal.customerName}</b></p>
            </div>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Document image is blurry and unreadable. Please re-upload."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 outline-none focus:border-red-400 transition-colors resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleReject} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-[13.5px] font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60">
                {saving ? "Rejecting…" : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Submission Modal ── */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <LottieIcon src="/icons/lottie/profile-add.json" size={22} autoplay loop />
                </div>
                <h3 className="text-[16px] font-bold text-gray-900">Add KYC Submission</h3>
              </div>
              <button onClick={() => setAddModal(false)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                { label: "Customer Name",  key: "customerName",  placeholder: "Full name" },
                { label: "Customer Email", key: "customerEmail", placeholder: "email@example.com" },
                { label: "Document Number", key: "documentNumber", placeholder: "ID / Reference number" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">{f.label}</label>
                  <input value={(addForm as Record<string,string>)[f.key]}
                    onChange={e => setAddForm(fm => ({ ...fm, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 outline-none focus:border-green-400 transition-colors" />
                </div>
              ))}
              <div>
                <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Document Type</label>
                <select value={addForm.documentType} onChange={e => setAddForm(fm => ({ ...fm, documentType: e.target.value as DocType }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 outline-none focus:border-green-400 transition-colors">
                  {Object.entries(DOC_TYPE_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Notes <span className="font-normal text-gray-400">(optional)</span></label>
                <textarea value={addForm.notes} onChange={e => setAddForm(fm => ({ ...fm, notes: e.target.value }))}
                  placeholder="Any additional context…" rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 outline-none focus:border-green-400 transition-colors resize-none" />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
              <button onClick={() => setAddModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-semibold text-gray-700 hover:bg-white transition-colors">
                Cancel
              </button>
              <button onClick={handleAdd} disabled={saving || !addForm.customerName || !addForm.customerEmail}
                className="flex-1 py-2.5 rounded-xl text-[13.5px] font-semibold text-white disabled:opacity-60 transition-colors"
                style={{ background: "#22c55e" }}>
                {saving ? "Adding…" : "Add Submission"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Payment Gateways page
───────────────────────────────────────────────── */
type GatewayConfig = {
  id: string; provider: string; displayName: string; enabled: boolean;
  publishableKey: string; secretKey: string; webhookSecret: string;
  testMode: boolean; createdAt: string; updatedAt: string;
};

const PROVIDERS_LIST = [
  { id: "stripe",      label: "Stripe",          icon: "/icons/card.json",                   note: "Credit / Debit cards via Stripe" },
  { id: "paypal",      label: "PayPal",           icon: "/icons/lottie/card tick.json",       note: "PayPal checkout (client + secret)" },
  { id: "apple_pay",   label: "Apple Pay",        icon: "/icons/lottie/apple.json",           note: "Apple Pay via Stripe or custom" },
  { id: "google_pay",  label: "Google Pay",       icon: "/icons/lottie/card pos.json",        note: "Google Pay via Stripe or custom" },
  { id: "razorpay",    label: "Razorpay",         icon: "/icons/money-receive.json",          note: "Razorpay for INR payments" },
  { id: "cod",         label: "Cash on Delivery", icon: "/icons/empty-wallet.json",           note: "Manual / offline payment" },
];

const PROVIDER_FIELDS: Record<string, { publishable?: boolean; secret?: boolean; webhook?: boolean }> = {
  stripe:     { publishable: true, secret: true, webhook: true },
  paypal:     { publishable: true, secret: true, webhook: true },
  apple_pay:  { publishable: true, secret: true },
  google_pay: { publishable: true, secret: true },
  razorpay:   { publishable: true, secret: true, webhook: true },
  cod:        {},
};

const EMPTY_FORM = { provider: "stripe", displayName: "Card", publishableKey: "", secretKey: "", webhookSecret: "", testMode: true };

function PaymentGatewaysPage() {
  const queryClient = useQueryClient();
  const [modal, setModal]   = useState<"add" | "edit" | "delete" | null>(null);
  const [target, setTarget] = useState<GatewayConfig | null>(null);
  const [form, setForm]     = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret]  = useState(false);
  const [showWebhook, setShowWebhook] = useState(false);

  const { data, isLoading } = useQuery<{ gateways: GatewayConfig[] }>({
    queryKey: ["payment-gateways"],
    queryFn: () => fetch("/api/admin/payment-gateways").then(r => r.json()),
    staleTime: 30_000,
  });
  const gateways = data?.gateways ?? [];

  function openAdd() {
    setForm(EMPTY_FORM);
    setTarget(null);
    setShowSecret(false); setShowWebhook(false);
    setModal("add");
  }

  function openEdit(gw: GatewayConfig) {
    setForm({ provider: gw.provider, displayName: gw.displayName, publishableKey: gw.publishableKey,
      secretKey: gw.secretKey, webhookSecret: gw.webhookSecret, testMode: gw.testMode });
    setTarget(gw);
    setShowSecret(false); setShowWebhook(false);
    setModal("edit");
  }

  async function handleSave() {
    setSaving(true);
    try {
      const url    = modal === "edit" ? `/api/admin/payment-gateways/${target!.id}` : "/api/admin/payment-gateways";
      const method = modal === "edit" ? "PUT" : "POST";
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      await queryClient.invalidateQueries({ queryKey: ["payment-gateways"] });
      setModal(null);
    } finally { setSaving(false); }
  }

  async function handleToggle(gw: GatewayConfig) {
    await fetch(`/api/admin/payment-gateways/${gw.id}/toggle`, { method: "PATCH" });
    queryClient.invalidateQueries({ queryKey: ["payment-gateways"] });
  }

  async function handleDelete() {
    if (!target) return;
    setSaving(true);
    await fetch(`/api/admin/payment-gateways/${target.id}`, { method: "DELETE" });
    await queryClient.invalidateQueries({ queryKey: ["payment-gateways"] });
    setSaving(false); setModal(null);
  }

  const providerMeta = (id: string) => PROVIDERS_LIST.find(p => p.id === id) ?? { id, label: id, icon: "/icons/card.json", note: "" };
  const fields       = PROVIDER_FIELDS[form.provider] ?? {};

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
            <LottieIcon src="/icons/card.json" size={26} autoplay loop />
          </div>
          <div>
            <h1 className="text-[26px] font-bold text-gray-900">Payment Gateways</h1>
            <p className="text-[13.5px] text-gray-400 mt-0.5">Configure payment providers and options</p>
          </div>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13.5px] font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: "#22c55e" }}>
          <span className="text-[16px] leading-none">+</span>
          Add Gateway
        </button>
      </div>

      {/* Active gateway highlight */}
      {gateways.filter(g => g.enabled).length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <p className="text-[13px] font-semibold text-emerald-800">
            {gateways.filter(g => g.enabled).length} active gateway{gateways.filter(g => g.enabled).length !== 1 ? "s" : ""} —&nbsp;
            <span className="font-normal text-emerald-700">
              {gateways.filter(g => g.enabled).map(g => providerMeta(g.provider).label).join(", ")}
            </span>
          </p>
        </div>
      )}

      {/* Configured Gateways table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-[16px] font-bold text-gray-900">Configured Gateways</h2>
          <p className="text-[12.5px] text-gray-400 mt-0.5">Each row represents one user-visible payment option</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-gray-300" />
            <p className="text-[13.5px] text-gray-400">Loading gateways…</p>
          </div>
        ) : gateways.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
              <LottieIcon src="/icons/card.json" size={36} autoplay loop />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-gray-700">No gateways configured</p>
              <p className="text-[13px] text-gray-400 mt-1">Click "Add Gateway" to connect your first payment provider</p>
            </div>
            <button onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white"
              style={{ background: "#22c55e" }}>
              + Add Gateway
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {["Provider","Display Name","Mode","Status","Actions"].map(h => (
                    <th key={h} className="px-6 py-3.5 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {gateways.map(gw => {
                  const meta = providerMeta(gw.provider);
                  return (
                    <tr key={gw.id} className="hover:bg-gray-50/40 transition-colors">
                      {/* Provider */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                            <LottieIcon src={meta.icon} size={22} autoplay loop />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{meta.label}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{meta.note}</p>
                          </div>
                        </div>
                      </td>
                      {/* Display name */}
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-800">{gw.displayName}</span>
                      </td>
                      {/* Mode */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full border ${gw.testMode ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                          {gw.testMode ? "Test" : "Live"}
                        </span>
                      </td>
                      {/* Status toggle */}
                      <td className="px-6 py-4">
                        <CatalogToggle checked={gw.enabled} onChange={() => handleToggle(gw)} activeColor="#22c55e" />
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(gw)}
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setTarget(gw); setModal("delete"); }}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provider info cards */}
      <div>
        <h2 className="text-[15px] font-bold text-gray-900 mb-3">Available Providers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROVIDERS_LIST.map(p => {
            const active = gateways.find(g => g.provider === p.id && g.enabled);
            return (
              <div key={p.id} className={`bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-3 ${active ? "border-emerald-200" : "border-gray-200"}`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${active ? "bg-emerald-50" : "bg-gray-50"}`}>
                  <LottieIcon src={p.icon} size={26} autoplay loop />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-[13.5px]">{p.label}</p>
                  <p className="text-[11.5px] text-gray-400 mt-0.5 truncate">{p.note}</p>
                </div>
                {active
                  ? <span className="inline-flex text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0">Active</span>
                  : <button onClick={() => { setForm({ ...EMPTY_FORM, provider: p.id, displayName: p.label }); setTarget(null); setModal("add"); }}
                      className="inline-flex text-[10.5px] font-semibold px-2.5 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shrink-0">
                      Configure
                    </button>
                }
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {(modal === "add" || modal === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <LottieIcon src={providerMeta(form.provider).icon} size={22} autoplay loop />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-gray-900">{modal === "add" ? "Add Payment Gateway" : "Edit Gateway"}</h3>
                  <p className="text-[12px] text-gray-400">{providerMeta(form.provider).note}</p>
                </div>
              </div>
              <button onClick={() => setModal(null)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* Provider selector */}
              <div>
                <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Payment Provider</label>
                <div className="grid grid-cols-2 gap-2">
                  {PROVIDERS_LIST.map(p => (
                    <button key={p.id} type="button"
                      onClick={() => setForm(f => ({ ...f, provider: p.id }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${form.provider === p.id ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}>
                      <span className="shrink-0"><LottieIcon src={p.icon} size={20} autoplay loop /></span>
                      <span className={`text-[12.5px] font-semibold ${form.provider === p.id ? "text-green-700" : "text-gray-700"}`}>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Display name */}
              <div>
                <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">
                  Display Name <span className="font-normal text-gray-400">(shown to customers)</span>
                </label>
                <input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                  placeholder="e.g. Card, PayPal, Credit Card…"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-100 transition-colors" />
              </div>

              {/* Publishable key */}
              {fields.publishable && (
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">
                    Publishable Key <span className="font-normal text-gray-400">(used in browser)</span>
                  </label>
                  <input value={form.publishableKey} onChange={e => setForm(f => ({ ...f, publishableKey: e.target.value }))}
                    placeholder={form.provider === "stripe" ? "pk_test_…" : "Publishable / Client ID…"}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[12.5px] font-mono text-gray-800 outline-none focus:border-green-400 transition-colors" />
                </div>
              )}

              {/* Secret key */}
              {fields.secret && (
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                    <span>Secret Key <span className="font-normal text-gray-400">(server-side only)</span></span>
                    <button type="button" onClick={() => setShowSecret(s => !s)} className="text-[11px] text-blue-500 hover:text-blue-700">
                      {showSecret ? "Hide" : "Show"}
                    </button>
                  </label>
                  <input value={form.secretKey} onChange={e => setForm(f => ({ ...f, secretKey: e.target.value }))}
                    type={showSecret ? "text" : "password"}
                    placeholder={form.provider === "stripe" ? "sk_test_…" : "Secret / API Key…"}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[12.5px] font-mono text-gray-800 outline-none focus:border-green-400 transition-colors" />
                </div>
              )}

              {/* Webhook secret */}
              {fields.webhook && (
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                    <span>Webhook Secret <span className="font-normal text-gray-400">(optional — verifies events)</span></span>
                    <button type="button" onClick={() => setShowWebhook(s => !s)} className="text-[11px] text-blue-500 hover:text-blue-700">
                      {showWebhook ? "Hide" : "Show"}
                    </button>
                  </label>
                  <input value={form.webhookSecret} onChange={e => setForm(f => ({ ...f, webhookSecret: e.target.value }))}
                    type={showWebhook ? "text" : "password"}
                    placeholder={form.provider === "stripe" ? "whsec_…" : "Webhook signing secret…"}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[12.5px] font-mono text-gray-800 outline-none focus:border-green-400 transition-colors" />
                </div>
              )}

              {/* Test mode */}
              <div className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <div>
                  <p className="text-[13px] font-semibold text-gray-800">Test Mode</p>
                  <p className="text-[11.5px] text-gray-400">Use test/sandbox keys — no real charges</p>
                </div>
                <CatalogToggle checked={form.testMode} onChange={v => setForm(f => ({ ...f, testMode: v }))} activeColor="#f59e0b" />
              </div>

              {/* Info box for Stripe */}
              {form.provider === "stripe" && (
                <div className="px-4 py-3 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-[12px] font-semibold text-blue-800 mb-1">Where to find Stripe keys</p>
                  <ol className="text-[11.5px] text-blue-700 space-y-0.5 list-decimal list-inside">
                    <li>Go to <span className="font-mono">dashboard.stripe.com</span></li>
                    <li>Click <b>Developers → API Keys</b></li>
                    <li>Copy the <b>Publishable</b> and <b>Secret</b> keys</li>
                    <li>For webhooks: go to <b>Developers → Webhooks</b></li>
                  </ol>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
              <button onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-semibold text-gray-700 hover:bg-white transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !form.displayName || !form.provider}
                className="flex-1 py-2.5 rounded-xl text-[13.5px] font-semibold text-white disabled:opacity-60 transition-colors"
                style={{ background: "#22c55e" }}>
                {saving ? "Saving…" : modal === "edit" ? "Save Changes" : "Add Gateway"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ── */}
      {modal === "delete" && target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                <LottieIcon src={providerMeta(target.provider).icon} size={36} autoplay loop />
              </div>
              <h3 className="text-[16px] font-bold text-gray-900">Remove {providerMeta(target.provider).label}?</h3>
              <p className="text-[13px] text-gray-500">
                This will remove <b>{target.displayName}</b> as a payment option. Customers will no longer see it at checkout.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-[13.5px] font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60">
                {saving ? "Removing…" : "Remove Gateway"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   NOTIFICATIONS PAGE
══════════════════════════════════════════════════════════════════════ */
function NotificationsPage() {
  const API = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";
  const queryClient = useQueryClient();

  /* ── sub-navigation ── */
  const [subTab, setSubTab] = useState<"history" | "templates">("history");

  /* ── filters ── */
  const [filterSource, setFilterSource] = useState("all");
  const [filterType,   setFilterType]   = useState("all");
  const [filterIccid,  setFilterIccid]  = useState("");
  const [fProcessed,   setFProcessed]   = useState(false);
  const [fNotProcessed,setFNotProcessed]= useState(false);
  const [fSent,        setFSent]        = useState(false);
  const [fNotSent,     setFNotSent]     = useState(false);

  /* ── modals ── */
  const [newModal,     setNewModal]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [previewTpl,   setPreviewTpl]   = useState<Record<string, unknown> | null>(null);
  const [builderOpen,  setBuilderOpen]  = useState(false);
  const [editingTpl,   setEditingTpl]   = useState<Record<string, unknown> | null>(null);

  /* ── new notification form ── */
  const blankNotif = { title: "", body: "", type: "order", source: "manual", customerName: "", customerEmail: "", iccid: "", processingStatus: "not_processed", emailStatus: "not_sent", templateId: "" };
  const [newForm, setNewForm] = useState({ ...blankNotif });

  /* ── template builder form ── */
  const blankTpl = { name: "", subject: "", category: "transactional", description: "", htmlBody: "", accentColor: "#10b981" };
  const [buildForm, setBuildForm] = useState({ ...blankTpl });
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);

  /* ── queries ── */
  const statsQ = useQuery<{ total: number; unread: number; emailsSent: number; emailsFailed: number }>({
    queryKey: ["notif-stats"],
    queryFn: async () => { const r = await fetch(`${API}/api/admin/notifications/stats`); return r.json(); },
    refetchInterval: 30000,
  });
  const notifQ = useQuery<Record<string, unknown>[]>({
    queryKey: ["notifs", filterSource, filterType, filterIccid, fProcessed, fNotProcessed, fSent, fNotSent],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (filterSource !== "all") p.set("source", filterSource);
      if (filterType   !== "all") p.set("type",   filterType);
      if (filterIccid)            p.set("iccid",  filterIccid);
      if (fProcessed && !fNotProcessed) p.set("processingStatus", "processed");
      if (!fProcessed && fNotProcessed) p.set("processingStatus", "not_processed");
      if (fSent && !fNotSent)           p.set("emailStatus", "sent");
      if (!fSent && fNotSent)           p.set("emailStatus", "not_sent");
      const r = await fetch(`${API}/api/admin/notifications?${p}`);
      return r.json();
    },
  });
  const templatesQ = useQuery<Record<string, unknown>[]>({
    queryKey: ["notif-templates"],
    queryFn: async () => { const r = await fetch(`${API}/api/admin/notification-templates`); return r.json(); },
  });

  /* ── mutations ── */
  const invalidate = () => { queryClient.invalidateQueries({ queryKey: ["notifs"] }); queryClient.invalidateQueries({ queryKey: ["notif-stats"] }); };
  const markRead = async (id: string) => { await fetch(`${API}/api/admin/notifications/${id}/read`, { method: "PATCH" }); invalidate(); };
  const sendEmail = async (id: string) => { await fetch(`${API}/api/admin/notifications/${id}/send`, { method: "PATCH" }); invalidate(); };
  const markAllRead = async () => { await fetch(`${API}/api/admin/notifications/mark-all-read`, { method: "PATCH" }); invalidate(); };
  const deleteNotif = async (id: string) => { await fetch(`${API}/api/admin/notifications/${id}`, { method: "DELETE" }); setDeleteTarget(null); invalidate(); };
  const [saving, setSaving] = useState(false);
  const createNotif = async () => {
    setSaving(true);
    await fetch(`${API}/api/admin/notifications`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newForm) });
    setSaving(false); setNewModal(false); setNewForm({ ...blankNotif }); invalidate();
  };
  const deleteTpl = async (id: string) => { await fetch(`${API}/api/admin/notification-templates/${id}`, { method: "DELETE" }); queryClient.invalidateQueries({ queryKey: ["notif-templates"] }); };
  const saveTpl = async () => {
    setSaving(true);
    const vars: string[] = [];
    const re = /\{\{([^}]+)\}\}/g; let m: RegExpExecArray | null;
    while ((m = re.exec(buildForm.htmlBody + buildForm.subject)) !== null) { if (!vars.includes(`{{${m[1]}}}`)) vars.push(`{{${m[1]}}}`); }
    const body = JSON.stringify({ ...buildForm, variables: vars });
    if (editingTpl) {
      await fetch(`${API}/api/admin/notification-templates/${editingTpl.id as string}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body });
    } else {
      await fetch(`${API}/api/admin/notification-templates`, { method: "POST", headers: { "Content-Type": "application/json" }, body });
    }
    setSaving(false); setBuilderOpen(false); setEditingTpl(null); setBuildForm({ ...blankTpl }); queryClient.invalidateQueries({ queryKey: ["notif-templates"] });
  };
  const openBuilder = (tpl?: Record<string, unknown>) => {
    if (tpl) { setEditingTpl(tpl); setBuildForm({ name: String(tpl.name ?? ""), subject: String(tpl.subject ?? ""), category: String(tpl.category ?? "transactional"), description: String(tpl.description ?? ""), htmlBody: String(tpl.htmlBody ?? ""), accentColor: String(tpl.accentColor ?? "#10b981") }); }
    else     { setEditingTpl(null); setBuildForm({ ...blankTpl }); }
    setBuilderOpen(true);
  };

  /* ── helpers ── */
  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  const TYPE_ICON: Record<string, string> = {
    order:           "/icons/lottie/bag tick.json",
    esim_activation: "/icons/simcard-2.json",
    data_alert:      "/icons/lottie/notification.json",
    expiry_reminder: "/icons/lottie/timer-start.json",
    topup:           "/icons/lottie/empty wallet tick.json",
    kyc_update:      "/icons/lottie/profile-tick.json",
    promotion:       "/icons/lottie/ticket discount.json",
    system:          "/icons/lottie/notification-status.json",
  };
  const TYPE_COLOR: Record<string, string> = {
    order:"#3b82f6", esim_activation:"#8b5cf6", data_alert:"#f59e0b",
    expiry_reminder:"#f97316", topup:"#10b981", kyc_update:"#06b6d4",
    promotion:"#ec4899", system:"#64748b",
  };
  const TYPE_BG: Record<string, string> = {
    order:"#eff6ff", esim_activation:"#f5f3ff", data_alert:"#fffbeb",
    expiry_reminder:"#fff7ed", topup:"#f0fdf4", kyc_update:"#ecfeff",
    promotion:"#fdf2f8", system:"#f8fafc",
  };
  const TYPE_LABELS: Record<string, string> = {
    order:"Order", esim_activation:"eSIM Activation", data_alert:"Data Alert",
    expiry_reminder:"Expiry Reminder", topup:"Topup", kyc_update:"KYC Update",
    promotion:"Promotion", system:"System",
  };
  const CAT_COLORS: Record<string, { bg: string; text: string }> = {
    transactional: { bg:"#eff6ff", text:"#2563eb" },
    marketing:     { bg:"#fdf2f8", text:"#be185d" },
    kyc:           { bg:"#f0fdf4", text:"#15803d" },
    system:        { bg:"#f8fafc", text:"#475569" },
    custom:        { bg:"#f5f3ff", text:"#7c3aed" },
  };
  const ACCENT_SWATCHES = ["#10b981","#3b82f6","#8b5cf6","#f59e0b","#ef4444","#ec4899","#f97316","#06b6d4","#64748b"];

  const stats = statsQ.data;
  const notifs = notifQ.data ?? [];
  const templates = (templatesQ.data ?? []) as Record<string, unknown>[];

  return (
    <div className="space-y-0">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md">
            <LottieIcon src="/icons/lottie/notification-bing.json" size={24} autoplay loop />
          </div>
          <div>
            <h1 className="text-[20px] font-black text-gray-900 tracking-tight">Notifications</h1>
            <p className="text-[12.5px] text-gray-400 mt-0.5">View history and manage email notification templates</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.open(`${API}/api/admin/notifications/export-csv`, "_blank")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[13px] font-semibold text-gray-600 hover:bg-gray-50 shadow-sm transition-all">
            <LottieIcon src="/icons/lottie/export.json" size={16} autoplay loop />
            Export CSV
          </button>
          <button onClick={() => setNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white shadow-md transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
            <LottieIcon src="/icons/lottie/notification 1.json" size={16} autoplay loop />
            New Notification
          </button>
        </div>
      </div>

      {/* ── Sub-tab nav ── */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-2xl w-fit mb-6">
        {([
          { id: "history",   label: "Notification History", icon: "/icons/lottie/notification-status.json" },
          { id: "templates", label: "Email Templates",      icon: "/icons/lottie/message text.json" },
        ] as { id: "history" | "templates"; label: string; icon: string }[]).map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${subTab === t.id ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            <LottieIcon src={t.icon} size={15} autoplay={subTab === t.id} loop />
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════ HISTORY TAB ══════════ */}
      {subTab === "history" && (
        <div className="space-y-5">
          {/* stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label:"Total Notifications", value: stats?.total     ?? 0, icon:"/icons/lottie/notification-bing.json", color:"#3b82f6", bg:"#eff6ff" },
              { label:"Unread",              value: stats?.unread     ?? 0, icon:"/icons/lottie/notification.json",      color:"#f59e0b", bg:"#fffbeb" },
              { label:"Emails Sent",         value: stats?.emailsSent ?? 0, icon:"/icons/lottie/tick-circle.json",       color:"#10b981", bg:"#f0fdf4" },
              { label:"Emails Failed",       value: stats?.emailsFailed ?? 0, icon:"/icons/lottie/close-circle.json",   color:"#ef4444", bg:"#fef2f2" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                  <LottieIcon src={s.icon} size={28} autoplay loop />
                </div>
                <div>
                  <p className="text-[11.5px] font-semibold text-gray-400 uppercase tracking-wide">{s.label}</p>
                  <p className="text-[26px] font-black leading-none mt-1" style={{ color: s.color }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* filter bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <LottieIcon src="/icons/lottie/filter.json" size={16} autoplay loop />
              <span className="text-[13px] font-bold text-gray-800">Filters</span>
              <span className="text-[11.5px] text-gray-400 ml-1">Filter notification history by type, status, and ICCID</span>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <div>
                <label className="block text-[10.5px] font-bold text-gray-400 mb-1 uppercase tracking-wide">Notification Source</label>
                <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
                  className="text-[13px] font-medium border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white">
                  <option value="all">All Sources</option>
                  <option value="system">System</option>
                  <option value="manual">Manual</option>
                  <option value="api">API</option>
                </select>
              </div>
              <div>
                <label className="block text-[10.5px] font-bold text-gray-400 mb-1 uppercase tracking-wide">Notification Type</label>
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                  className="text-[13px] font-medium border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white">
                  <option value="all">All Types</option>
                  <option value="order">Order</option>
                  <option value="esim_activation">eSIM Activation</option>
                  <option value="data_alert">Data Alert</option>
                  <option value="expiry_reminder">Expiry Reminder</option>
                  <option value="topup">Topup</option>
                  <option value="kyc_update">KYC Update</option>
                  <option value="promotion">Promotion</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div>
                <label className="block text-[10.5px] font-bold text-gray-400 mb-1 uppercase tracking-wide">ICCID</label>
                <input value={filterIccid} onChange={e => setFilterIccid(e.target.value)} placeholder="Search by ICCID…"
                  className="text-[13px] font-medium border border-gray-200 rounded-lg px-3 py-2 w-48 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>
              <div>
                <label className="block text-[10.5px] font-bold text-gray-400 mb-1 uppercase tracking-wide">Processing Status</label>
                <div className="flex items-center gap-3 pt-1">
                  {[{ key: "p", label: "Processed", val: fProcessed, set: setFProcessed }, { key: "np", label: "Not Processed", val: fNotProcessed, set: setFNotProcessed }].map(c => (
                    <label key={c.key} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={c.val} onChange={e => c.set(e.target.checked)} className="w-3.5 h-3.5 accent-emerald-500" />
                      <span className="text-[12.5px] text-gray-600">{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10.5px] font-bold text-gray-400 mb-1 uppercase tracking-wide">Email Status</label>
                <div className="flex items-center gap-3 pt-1">
                  {[{ key: "s", label: "Sent", val: fSent, set: setFSent }, { key: "ns", label: "Not Sent", val: fNotSent, set: setFNotSent }].map(c => (
                    <label key={c.key} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={c.val} onChange={e => c.set(e.target.checked)} className="w-3.5 h-3.5 accent-emerald-500" />
                      <span className="text-[12.5px] text-gray-600">{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {(stats?.unread ?? 0) > 0 && (
                <button onClick={markAllRead} className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-semibold text-emerald-600 hover:bg-emerald-50 transition-all">
                  <LottieIcon src="/icons/lottie/tick-circle.json" size={14} autoplay loop />
                  Mark All Read
                </button>
              )}
            </div>
          </div>

          {/* notification list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {notifQ.isLoading ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <RefreshCw className="w-5 h-5 animate-spin text-gray-300" />
                <p className="text-[13.5px] text-gray-400">Loading notifications…</p>
              </div>
            ) : notifs.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
                  <LottieIcon src="/icons/lottie/notification-bing.json" size={40} autoplay loop />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-gray-700">No Notifications Found</p>
                  <p className="text-[13px] text-gray-400 mt-1">No notification history matches your current filters.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifs.map((n) => {
                  const type = String(n.type ?? "system");
                  const color = TYPE_COLOR[type] ?? "#64748b";
                  const bg    = TYPE_BG[type]    ?? "#f8fafc";
                  const icon  = TYPE_ICON[type]  ?? "/icons/lottie/notification-status.json";
                  const isUnread = n.status === "unread";
                  return (
                    <div key={String(n.id)} className={`flex items-start gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors group ${isUnread ? "border-l-4" : "border-l-4 border-l-transparent"}`}
                      style={isUnread ? { borderLeftColor: color } : {}}>
                      {/* type icon */}
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: bg }}>
                        <LottieIcon src={icon} size={24} autoplay loop />
                      </div>
                      {/* content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {isUnread && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />}
                              <p className={`text-[13.5px] leading-snug truncate ${isUnread ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>{String(n.title)}</p>
                            </div>
                            <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-1">{String(n.body)}</p>
                          </div>
                          <span className="text-[11px] text-gray-400 shrink-0 mt-0.5">{timeAgo(String(n.createdAt))}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {/* type badge */}
                          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold" style={{ background: bg, color }}>{TYPE_LABELS[type] ?? type}</span>
                          {/* source badge */}
                          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-gray-100 text-gray-500 capitalize">{String(n.source)}</span>
                          {/* customer */}
                          {String(n.customerName) && (
                            <span className="flex items-center gap-1 text-[11px] text-gray-500">
                              <LottieIcon src="/icons/lottie/profile-tick.json" size={12} autoplay loop />
                              {String(n.customerName)}
                            </span>
                          )}
                          {/* ICCID */}
                          {String(n.iccid) && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-gray-100 text-gray-500">{String(n.iccid)}</span>
                          )}
                          {/* processing */}
                          <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${n.processingStatus === "processed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                            {n.processingStatus === "processed" ? "Processed" : "Not Processed"}
                          </span>
                          {/* email status */}
                          <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${n.emailStatus === "sent" ? "bg-blue-50 text-blue-600" : n.emailStatus === "failed" ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-500"}`}>
                            {n.emailStatus === "sent" ? "Email Sent" : n.emailStatus === "failed" ? "Email Failed" : "Not Sent"}
                          </span>
                        </div>
                      </div>
                      {/* actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {isUnread && (
                          <button onClick={() => markRead(String(n.id))} title="Mark as Read"
                            className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors">
                            <LottieIcon src="/icons/lottie/tick-circle.json" size={16} autoplay loop />
                          </button>
                        )}
                        {n.emailStatus !== "sent" && (
                          <button onClick={() => sendEmail(String(n.id))} title="Send Email"
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors">
                            <LottieIcon src="/icons/lottie/send.json" size={16} autoplay loop />
                          </button>
                        )}
                        <button onClick={() => setDeleteTarget(String(n.id))} title="Delete"
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                          <LottieIcon src="/icons/lottie/close-circle.json" size={16} autoplay loop />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════ TEMPLATES TAB ══════════ */}
      {subTab === "templates" && (
        <div className="space-y-5">
          {/* header row */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">Email Notification Templates</h2>
              <p className="text-[12.5px] text-gray-400 mt-0.5">{templates.length} templates · {templates.filter(t => t.prebuilt).length} pre-built · {templates.filter(t => !t.prebuilt).length} custom</p>
            </div>
            <button onClick={() => openBuilder()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white shadow-md transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }}>
              <LottieIcon src="/icons/lottie/message add.json" size={16} autoplay loop />
              New Template
            </button>
          </div>

          {/* legend */}
          <div className="flex items-center gap-4 flex-wrap">
            {Object.entries(CAT_COLORS).map(([cat, clr]) => (
              <span key={cat} className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1 rounded-full" style={{ background: clr.bg, color: clr.text }}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </span>
            ))}
          </div>

          {/* template cards grid */}
          {templatesQ.isLoading ? (
            <div className="flex items-center gap-3 py-12 justify-center">
              <RefreshCw className="w-5 h-5 animate-spin text-gray-300" />
              <span className="text-[13.5px] text-gray-400">Loading templates…</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {templates.map((tpl) => {
                const cat = String(tpl.category ?? "transactional");
                const clr = CAT_COLORS[cat] ?? CAT_COLORS.transactional;
                const vars = (tpl.variables as string[]) ?? [];
                return (
                  <div key={String(tpl.id)} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                    {/* colored header */}
                    <div className="h-20 flex items-center justify-center relative" style={{ background: String(tpl.accentColor ?? "#10b981") }}>
                      <div className="absolute inset-0 opacity-20" style={{ background: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3C/g%3E%3C/svg%3E\")" }} />
                      <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                        <LottieIcon src="/icons/lottie/message text.json" size={28} autoplay loop />
                      </div>
                      {tpl.prebuilt && (
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/25 text-white backdrop-blur-sm">Pre-built</span>
                      )}
                    </div>
                    {/* body */}
                    <div className="p-4 flex-1 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[14px] font-bold text-gray-900 leading-snug">{String(tpl.name)}</p>
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold shrink-0" style={{ background: clr.bg, color: clr.text }}>{cat}</span>
                      </div>
                      <p className="text-[12px] text-gray-500 leading-relaxed">{String(tpl.description)}</p>
                      <p className="text-[11.5px] text-gray-600 font-medium truncate">Subject: <span className="text-gray-400 font-normal">{String(tpl.subject)}</span></p>
                      {vars.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {vars.slice(0, 4).map(v => (
                            <span key={v} className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-gray-100 text-gray-500">{v}</span>
                          ))}
                          {vars.length > 4 && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">+{vars.length - 4} more</span>}
                        </div>
                      )}
                    </div>
                    {/* actions */}
                    <div className="px-4 pb-4 flex items-center gap-2">
                      <button onClick={() => setPreviewTpl(tpl)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-[12.5px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                        <LottieIcon src="/icons/lottie/sticker.json" size={14} autoplay loop />
                        Preview
                      </button>
                      <button onClick={() => openBuilder(tpl)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12.5px] font-bold text-white transition-opacity hover:opacity-90"
                        style={{ background: String(tpl.accentColor ?? "#10b981") }}>
                        <LottieIcon src="/icons/lottie/edit.json" size={14} autoplay loop />
                        {tpl.prebuilt ? "Duplicate" : "Edit"}
                      </button>
                      {!tpl.prebuilt && (
                        <button onClick={() => deleteTpl(String(tpl.id))}
                          className="p-2 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 transition-colors">
                          <LottieIcon src="/icons/lottie/close-circle.json" size={14} autoplay loop />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ NEW NOTIFICATION MODAL ══ */}
      {newModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setNewModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <LottieIcon src="/icons/lottie/notification 1.json" size={22} autoplay loop />
                </div>
                <h3 className="text-[16px] font-bold text-gray-900">New Notification</h3>
              </div>
              <button onClick={() => setNewModal(false)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {[
                { label: "Title",          key: "title",         placeholder: "Notification title" },
                { label: "Message Body",   key: "body",          placeholder: "Notification message content" },
                { label: "Customer Name",  key: "customerName",  placeholder: "Full name" },
                { label: "Customer Email", key: "customerEmail", placeholder: "email@example.com" },
                { label: "ICCID",          key: "iccid",         placeholder: "Optional — eSIM ICCID" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[12px] font-bold text-gray-600 mb-1">{f.label}</label>
                  {f.key === "body" ? (
                    <textarea value={(newForm as Record<string, string>)[f.key]} onChange={e => setNewForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder} rows={3}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" />
                  ) : (
                    <input value={(newForm as Record<string, string>)[f.key]} onChange={e => setNewForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                  )}
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-gray-600 mb-1">Type</label>
                  <select value={newForm.type} onChange={e => setNewForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white">
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-gray-600 mb-1">Source</label>
                  <select value={newForm.source} onChange={e => setNewForm(p => ({ ...p, source: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white">
                    <option value="manual">Manual</option>
                    <option value="system">System</option>
                    <option value="api">API</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setNewModal(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={createNotif} disabled={saving || !newForm.title}
                className="px-5 py-2 rounded-xl text-[13px] font-bold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
                {saving ? "Sending…" : "Create Notification"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE NOTIFICATION MODAL ══ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                <LottieIcon src="/icons/lottie/close-circle.json" size={36} autoplay loop />
              </div>
              <h3 className="text-[16px] font-bold text-gray-900">Delete Notification?</h3>
              <p className="text-[13px] text-gray-500">This will permanently remove the notification from the history.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => deleteNotif(deleteTarget)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13px] font-bold hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ HTML PREVIEW MODAL ══ */}
      {previewTpl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.65)" }} onClick={() => setPreviewTpl(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: String(previewTpl.accentColor ?? "#10b981") + "22" }}>
                  <LottieIcon src="/icons/lottie/message text.json" size={20} autoplay loop />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">{String(previewTpl.name)}</h3>
                  <p className="text-[11.5px] text-gray-400">{String(previewTpl.subject)}</p>
                </div>
              </div>
              <button onClick={() => setPreviewTpl(null)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-100 p-4">
              <iframe
                title="Email preview"
                srcDoc={String(previewTpl.htmlBody ?? "")}
                className="w-full h-full rounded-xl bg-white border border-gray-200"
                style={{ minHeight: "500px" }}
                sandbox="allow-same-origin"
              />
            </div>
            <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-2">
              <div className="flex flex-wrap gap-1 flex-1">
                {((previewTpl.variables as string[]) ?? []).map(v => (
                  <span key={v} className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-gray-100 text-gray-500">{v}</span>
                ))}
              </div>
              <button onClick={() => { setPreviewTpl(null); openBuilder(previewTpl); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold text-white"
                style={{ background: String(previewTpl.accentColor ?? "#10b981") }}>
                <LottieIcon src="/icons/lottie/edit.json" size={14} autoplay loop />
                Edit Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ TEMPLATE BUILDER MODAL ══ */}
      {builderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }} onClick={() => setBuilderOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
            {/* builder header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: buildForm.accentColor + "22" }}>
                  <LottieIcon src="/icons/lottie/message add.json" size={22} autoplay loop />
                </div>
                <h3 className="text-[16px] font-bold text-gray-900">{editingTpl ? (editingTpl.prebuilt ? "Duplicate Template" : "Edit Template") : "Build New Template"}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowHtmlPreview(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all ${showHtmlPreview ? "bg-purple-100 text-purple-700" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  <LottieIcon src="/icons/lottie/sticker.json" size={14} autoplay loop />
                  {showHtmlPreview ? "Hide Preview" : "Live Preview"}
                </button>
                <button onClick={() => setBuilderOpen(false)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
              </div>
            </div>
            {/* builder body */}
            <div className="flex-1 overflow-y-auto">
              <div className={`grid ${showHtmlPreview ? "grid-cols-2" : "grid-cols-1"} divide-x divide-gray-100 h-full`}>
                {/* form */}
                <div className="p-6 space-y-4 overflow-y-auto">
                  <div>
                    <label className="block text-[12px] font-bold text-gray-600 mb-1">Template Name *</label>
                    <input value={buildForm.name} onChange={e => setBuildForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Welcome Email"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-purple-300" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-gray-600 mb-1">Email Subject *</label>
                    <input value={buildForm.subject} onChange={e => setBuildForm(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Welcome to Voltey, {{customer_name}}!"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-purple-300 font-mono" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-bold text-gray-600 mb-1">Category</label>
                      <select value={buildForm.category} onChange={e => setBuildForm(p => ({ ...p, category: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white">
                        <option value="transactional">Transactional</option>
                        <option value="marketing">Marketing</option>
                        <option value="kyc">KYC</option>
                        <option value="system">System</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-gray-600 mb-1">Accent Color</label>
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {ACCENT_SWATCHES.map(c => (
                          <button key={c} onClick={() => setBuildForm(p => ({ ...p, accentColor: c }))}
                            className={`w-6 h-6 rounded-full transition-transform ${buildForm.accentColor === c ? "scale-125 ring-2 ring-offset-1 ring-gray-400" : "hover:scale-110"}`}
                            style={{ background: c }} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-gray-600 mb-1">Description</label>
                    <input value={buildForm.description} onChange={e => setBuildForm(p => ({ ...p, description: e.target.value }))} placeholder="Short description of when this template is used"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-purple-300" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[12px] font-bold text-gray-600">HTML Email Body</label>
                      <span className="text-[10.5px] text-gray-400">Use {"{{variable_name}}"} for dynamic values</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {["{{customer_name}}", "{{order_id}}", "{{iccid}}", "{{destination}}", "{{expiry_date}}", "{{support_email}}"].map(v => (
                        <button key={v} onClick={() => setBuildForm(p => ({ ...p, htmlBody: p.htmlBody + v }))}
                          className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors">{v}</button>
                      ))}
                    </div>
                    <textarea value={buildForm.htmlBody} onChange={e => setBuildForm(p => ({ ...p, htmlBody: e.target.value }))} rows={16}
                      placeholder="Paste or write your HTML email here…&#10;&#10;Tip: Use inline styles for email client compatibility."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[11.5px] font-mono focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none leading-relaxed" />
                  </div>
                </div>
                {/* live preview */}
                {showHtmlPreview && (
                  <div className="flex flex-col">
                    <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                      <p className="text-[11.5px] font-semibold text-gray-500 flex items-center gap-1.5">
                        <LottieIcon src="/icons/lottie/sticker.json" size={13} autoplay loop />
                        Live Preview
                      </p>
                    </div>
                    <div className="flex-1 bg-gray-100 p-3">
                      <iframe title="Template preview" srcDoc={buildForm.htmlBody || "<div style='display:flex;align-items:center;justify-content:center;height:200px;color:#aaa;font-family:sans-serif;font-size:14px;'>Start writing HTML to see the preview</div>"}
                        className="w-full rounded-xl bg-white border border-gray-200" style={{ minHeight: "400px" }} sandbox="allow-same-origin" />
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* builder footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setBuilderOpen(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={saveTpl} disabled={saving || !buildForm.name || !buildForm.subject}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-bold text-white disabled:opacity-50"
                style={{ background: buildForm.accentColor }}>
                <LottieIcon src="/icons/lottie/send.json" size={15} autoplay loop />
                {saving ? "Saving…" : editingTpl && !editingTpl.prebuilt ? "Save Changes" : "Create Template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ComingSoon({ tab }: { tab: string }) {
  const label = TAB_LABELS[tab] ?? tab;
  const iconMap: Record<string, string> = {
    "custom-orders": I("bag"),           "topup-orders": I("wallet-add"),
    kyc: I("profile-tick"),              providers: I("simcard"),
    "esim-catalog": I("category"),       "topup-packages": I("wallet-add"),
    regions: I("global"),                countries: I("global"),
    vouchers: I("ticket"),               giftcards: I("tag"),
    referral: I("user-add"),             "support-tickets": I("message"),
    "in-app-purchases": I("bag"),        "payment-gateways": I("card"),       gateways: I("card"),
    notifications: I("notification-bing"), "advanced-analytics": I("graph"),
    reviews: I("home-trend-up"),         currencies: I("empty-wallet"),
    "failover-api": I("code"),           "banner-management": I("note-text"),
    "pages-management": I("note-text"),  "faq-management": I("message"),
    maintenance: I("setting"),           internationalization: I("global"),
    blog: I("book"),                     "api-docs": I("code"),
  };
  const iconSrc = iconMap[tab] ?? I("setting");
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
        <LottieIcon src={iconSrc} size={38} autoplay loop />
      </div>
      <h2 className="text-[22px] font-semibold text-gray-900 mb-2">{label}</h2>
      <p className="text-[14px] text-gray-400 max-w-xs leading-relaxed">
        This section is under development and will be available in a future update.
      </p>
      <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-[12.5px] font-medium text-gray-500">
        <Clock className="w-3.5 h-3.5" /> Coming soon
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Admin Login Page
───────────────────────────────────────────────── */
function AdminLoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleLogin() {
    if (!email.includes("@")) { setError("Please enter a valid email address."); return; }
    if (!pwd) { setError("Please enter your password."); return; }
    setError(""); setLoading(true);
    setTimeout(() => {
      if (email === "admin@voltey.uk" && pwd === "@vijha1210A") {
        const key = "voltey-admin-auth";
        if (remember) localStorage.setItem(key, "1");
        else sessionStorage.setItem(key, "1");
        onLogin();
      } else {
        setError("Invalid email or password. Please try again.");
        setLoading(false);
      }
    }, 900);
  }

  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "Poppins, sans-serif" }}>

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex flex-col w-[56%] relative overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/hero-bg.jpg')" }} />
        {/* Gradient overlay */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(5,78,55,0.92) 0%, rgba(0,0,0,0.45) 55%, rgba(6,60,45,0.95) 100%)" }} />

        {/* Top logo */}
        <div className="relative z-10 p-10 flex items-center gap-3">
          <img src="/logo-white.png" alt="Voltey" className="h-9 w-auto" />
          <span className="text-[10.5px] font-bold tracking-[0.2em] uppercase mt-0.5"
            style={{ color: "rgba(255,255,255,0.4)" }}>Admin Portal</span>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-14 text-center">
          {/* Animated hero icon */}
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 border border-white/20"
            style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(16px)" }}>
            <LottieIcon src="/icons/simcard.json" size={54} autoplay loop />
          </div>
          <h1 className="text-[40px] font-black text-white leading-none mb-3">
            Voltey <span style={{ color: "#6ee7b7" }}>eSIM</span>
          </h1>
          <p className="text-[16px] font-semibold text-white/80 mb-2">Admin Dashboard</p>
          <p className="text-[14px] text-white/80 leading-relaxed max-w-xs">
            Manage your global eSIM marketplace with real-time insights and full control.
          </p>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 mt-10 w-full max-w-md">
            {[
              { icon: "/icons/global.json",        val: "190+",  lbl: "Countries" },
              { icon: "/icons/simcard.json",       val: "1000+", lbl: "Packages"  },
              { icon: "/icons/security-card.json", val: "24/7",  lbl: "Support"   },
            ].map(({ icon, val, lbl }) => (
              <div key={lbl} className="rounded-2xl p-4 text-center border border-white/10"
                style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)" }}>
                <div className="flex justify-center mb-2">
                  <LottieIcon src={icon} size={30} autoplay loop />
                </div>
                <p className="text-[21px] font-black text-white">{val}</p>
                <p className="text-[11px] text-white/75 mt-0.5">{lbl}</p>
              </div>
            ))}
          </div>

          {/* Feature list */}
          <div className="mt-8 space-y-2.5 text-left w-full max-w-xs">
            {[
              { icon: "/icons/chart.json",       text: "Real-time analytics & revenue tracking" },
              { icon: "/icons/people.json",      text: "Full customer lifecycle management" },
              { icon: "/icons/security-card.json", text: "Enterprise-grade secure platform" },
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
        {/* Mobile header */}
        <div className="lg:hidden px-6 pt-8 pb-4">
          <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
            <img src="/logo-green.png" alt="Voltey" className="h-8 w-auto" />
          </Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-10">
          <div className="w-full max-w-[340px]">

            {/* Desktop logo */}
            <div className="hidden lg:block mb-10">
              <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
                <img src="/logo-green.png" alt="Voltey" className="h-10 w-auto" />
              </Link>
            </div>

            {/* Greeting */}
            <div className="mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
                <LottieIcon src="/icons/profile-tick.json" size={28} autoplay loop />
              </div>
              <h2 className="text-[26px] font-black text-gray-900 leading-tight mb-1.5">
                Welcome back,<br />Admin 👋
              </h2>
              <p className="text-[14px] text-gray-400">Sign in to your Voltey admin panel</p>
            </div>

            {/* Form */}
            <form onSubmit={e => { e.preventDefault(); handleLogin(); }} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
                    type="email" placeholder="admin@voltey.com" autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-[14px] text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all bg-white" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input value={pwd} onChange={e => { setPwd(e.target.value); setError(""); }}
                    type={showPwd ? "text" : "password"} placeholder="Enter your password" autoComplete="current-password"
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 text-[14px] text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all bg-white" />
                  <button type="button" onClick={() => setShowPwd(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-[13px] text-red-600">{error}</p>
                </div>
              )}

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setRemember(p => !p)}>
                  <div className="rounded-full transition-all flex items-center p-0.5 shrink-0"
                    style={{ width: 36, height: 20, background: remember ? "#22c55e" : "#d1d5db" }}>
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm transition-all"
                      style={{ transform: remember ? "translateX(16px)" : "translateX(0)" }} />
                  </div>
                  <span className="text-[13px] text-gray-600">Remember me</span>
                </label>
                <button type="button" className="text-[13px] font-semibold" style={{ color: "#22c55e" }}>
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl text-[15px] font-bold text-white flex items-center justify-center gap-2 transition-all mt-1 shadow-sm"
                style={{ background: loading ? "#86efac" : "#22c55e", cursor: loading ? "wait" : "pointer" }}>
                {loading
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Signing in...</>
                  : "Sign in to Admin"
                }
              </button>
            </form>

          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 text-center border-t border-gray-100">
          <p className="text-[12.5px] font-medium text-gray-500">© {year} Powered by Voltey · All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Root
───────────────────────────────────────────────── */
export default function Admin() {
  const [isAuth, setIsAuth] = useState(() =>
    !!(sessionStorage.getItem("voltey-admin-auth") || localStorage.getItem("voltey-admin-auth"))
  );
  const [tab, setTab] = useState<Tab>("dashboard");

  function handleLogout() {
    sessionStorage.removeItem("voltey-admin-auth");
    localStorage.removeItem("voltey-admin-auth");
    setIsAuth(false);
  }

  if (!isAuth) return <AdminLoginPage onLogin={() => setIsAuth(true)} />;

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "Poppins, sans-serif", background: "#f8f9fc" }}>
      <Sidebar tab={tab} setTab={setTab} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar tab={tab} onLogout={handleLogout} />
        <main className="flex-1 p-7 overflow-y-auto">
          {tab === "dashboard"      && <DashboardPage />}
          {tab === "orders"         && <OrdersPage />}
          {tab === "custom-orders"  && <CustomOrdersPage onOrderMore={() => setTab("order-esims")} />}
          {tab === "order-esims"    && <OrderEsimsPage onBack={() => setTab("custom-orders")} />}
          {tab === "topup-orders"   && <TopupOrdersPage />}
          {tab === "customers"      && <CustomersPage />}
          {tab === "analytics"      && <AnalyticsPage />}
          {tab === "settings"       && <SettingsPage />}
          {tab === "providers"      && <ProvidersPage />}
          {tab === "esim-catalog"   && <EsimCatalogPage />}
          {tab === "topup-packages" && <TopupPackagesPage />}
          {tab === "regions"        && <RegionsPage />}
          {tab === "countries"      && <CountriesPage />}
          {tab === "vouchers"       && <VouchersPage />}
          {tab === "giftcards"      && <GiftCardsPage />}
          {tab === "referral"       && <ReferralProgramPage />}
          {tab === "gateways"       && <PaymentGatewaysPage />}
          {tab === "kyc"            && <KycVerificationPage />}
          {tab === "notifications"      && <NotificationsPage />}
          {tab === "advanced-analytics" && <AdvancedAnalyticsPage />}
          {tab === "reviews"            && <ReviewsPage />}
          {tab === "currencies"         && <CurrenciesPage />}
          {tab === "failover-api"       && <FailoverApiPage />}
          {tab === "wc-header-footer"    && <HeaderFooterEditor />}
          {tab === "wc-home-page"        && <HomePageEditor />}
          {tab === "wc-product-page"     && <ProductPageEditor />}
          {tab === "wc-destination-page" && <DestinationPageEditor />}
          {!["dashboard","orders","custom-orders","order-esims","topup-orders","customers","analytics","advanced-analytics","reviews","currencies","failover-api","settings","providers","esim-catalog","topup-packages","regions","countries","vouchers","giftcards","referral","gateways","kyc","notifications","wc-header-footer","wc-home-page","wc-product-page","wc-destination-page"].includes(tab) && (
            <ComingSoon tab={tab} />
          )}
        </main>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Sidebar
───────────────────────────────────────────────── */
function Sidebar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const defaultOpen = new Set(
    NAV.filter((e) => e.type === "group" && e.group.defaultOpen).map((e) =>
      e.type === "group" ? e.group.id : ""
    )
  );
  const [openGroups, setOpenGroups] = useState<Set<string>>(defaultOpen);

  function toggle(id: string) {
    setOpenGroups((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  return (
    <aside
      className="w-[248px] shrink-0 flex flex-col border-r border-gray-200 overflow-y-auto"
      style={{ background: "#fff", minHeight: "100vh", maxHeight: "100vh", position: "sticky", top: 0 }}
    >
      {/* ── Brand block ── */}
      <div className="px-5 pt-5 pb-4 shrink-0 flex items-center">
        <img src="/logo-dark.png" alt="Voltey" className="h-8 w-auto" />
      </div>

      <div className="mx-4 border-b border-gray-100 mb-2" />

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 pb-3 space-y-1">
        {NAV.map((entry) => {

          /* ── Standalone item ── */
          if (entry.type === "item") {
            const { id, iconSrc, label } = entry.item;
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all text-left"
                style={active
                  ? { background: "#18181b", color: "#fff" }
                  : { background: "transparent", color: "#374151" }
                }
              >
                <LottieIcon
                  src={iconSrc}
                  size={20}
                  playOnHover={!active}
                  autoplay={active}
                  loop={active}
                  style={{ opacity: active ? 1 : 0.6, filter: active ? "brightness(0) invert(1)" : "none" }}
                />
                <span className="flex-1 truncate leading-none">{label}</span>
              </button>
            );
          }

          /* ── Collapsible group ── */
          const { id: gid, heading, iconSrc: gIconSrc, items } = entry.group;
          const isOpen      = openGroups.has(gid);
          const groupActive = items.some((i) => i.id === tab);

          return (
            <div key={gid} className="space-y-1 pt-1">
              {/* Group header */}
              <button
                onClick={() => toggle(gid)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all text-left"
                style={groupActive
                  ? { background: "#18181b", color: "#fff" }
                  : { background: "transparent", color: "#374151" }
                }
              >
                <LottieIcon
                  src={gIconSrc}
                  size={20}
                  playOnHover
                  style={{ opacity: groupActive ? 1 : 0.6, filter: groupActive ? "brightness(0) invert(1)" : "none" }}
                />
                <span className="flex-1 truncate leading-none font-semibold">{heading}</span>
                {isOpen
                  ? <ChevronDown  className="w-3.5 h-3.5 shrink-0 opacity-40" />
                  : <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-40" />
                }
              </button>

              {/* Sub-items */}
              {isOpen && (
                <div className="space-y-1 pl-3 pb-1">
                  {items.map(({ id, iconSrc, label }) => {
                    const active = tab === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setTab(id)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all text-left"
                        style={active
                          ? { background: "#18181b", color: "#fff" }
                          : { background: "transparent", color: "#374151" }
                        }
                      >
                        <LottieIcon
                          src={iconSrc}
                          size={20}
                          playOnHover={!active}
                          autoplay={active}
                          loop={active}
                          style={{ opacity: active ? 1 : 0.6, filter: active ? "brightness(0) invert(1)" : "none" }}
                        />
                        <span className="flex-1 truncate leading-none">{label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Back to store ── */}
      <div className="px-3 pb-4 shrink-0 border-t border-gray-100 pt-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[14px] font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
        >
          <ArrowLeft className="w-[13px] h-[13px] shrink-0" />
          Back to Store
        </Link>
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────────
   Top bar
───────────────────────────────────────────────── */
function TopBar({ tab, onLogout }: { tab: Tab; onLogout: () => void }) {
  const label = TAB_LABELS[tab] ?? "Admin";
  const now = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  return (
    <header className="bg-white border-b border-gray-200 px-7 h-[64px] flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-gray-900 text-[18px]" style={{ fontWeight: 600 }}>{label}</h1>
        <p className="text-[11.5px] text-gray-400 mt-0.5">{now}</p>
      </div>
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors border border-gray-200">
          <Bell className="w-[16px] h-[16px]" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: "#22c55e" }} />
        </button>
        {/* Avatar */}
        <div className="flex items-center gap-2.5 pl-1">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-bold text-white shrink-0"
            style={{ background: "#22c55e" }}
          >
            A
          </div>
          <div>
            <p className="text-[13px] font-semibold text-gray-900 leading-none">Admin</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Voltey eSIM</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
        {/* Logout */}
        <button onClick={onLogout} title="Sign out"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors border border-gray-200 ml-1">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────
   SVG Smooth Line Chart  (Substance-style)
───────────────────────────────────────────────── */
type SeriesConfig = { key: string; color: string; label: string };
type ChartPoint   = { label: string; [key: string]: number | string };

function SmoothLineChart({ data, series }: { data: ChartPoint[]; series: SeriesConfig[] }) {
  const W = 520; const H = 195;
  const P = { t: 16, r: 16, b: 28, l: 38 };
  const cW = W - P.l - P.r; const cH = H - P.t - P.b;
  const GRID = 4;

  if (!data.length || series.length === 0) return (
    <div className="flex flex-col items-center justify-center h-36 text-gray-300">
      <BarChart2 className="w-10 h-10 mb-2" strokeWidth={1} />
      <p className="text-[12px]">No data yet</p>
    </div>
  );

  const maxOf = (key: string) => Math.max(...data.map((d) => (d[key] as number) ?? 0), 1);
  const xPos  = (i: number)   => P.l + (data.length <= 1 ? cW / 2 : (i / (data.length - 1)) * cW);
  const yPos  = (v: number, max: number) => P.t + (1 - v / max) * cH;

  function bezierPath(pts: [number, number][]) {
    return pts.reduce((acc, [x, y], i) => {
      if (i === 0) return `M ${x},${y}`;
      const [px, py] = pts[i - 1];
      const cp = (x - px) * 0.45;
      return `${acc} C ${px + cp},${py} ${x - cp},${y} ${x},${y}`;
    }, "");
  }

  const primaryMax  = maxOf(series[0].key);
  const gridLabels  = Array.from({ length: GRID + 1 }, (_, i) =>
    Math.round((primaryMax * (GRID - i)) / GRID)
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: "visible" }}>
      <defs>
        {series.map((s) => (
          <linearGradient key={s.key} id={`lg-${s.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={s.color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0.01" />
          </linearGradient>
        ))}
      </defs>

      {/* Horizontal grid lines + Y labels */}
      {gridLabels.map((val, i) => {
        const y = P.t + (i / GRID) * cH;
        return (
          <g key={i}>
            <line x1={P.l} y1={y} x2={W - P.r} y2={y}
              stroke="#e2e8f0" strokeWidth="1" strokeDasharray={i === GRID ? "0" : "4 4"} />
            <text x={P.l - 7} y={y + 3.5} textAnchor="end" fontSize="9.5" fill="#94a3b8">{val}</text>
          </g>
        );
      })}

      {/* Per-series: area fill + smooth line + dots */}
      {series.map((s) => {
        const max  = maxOf(s.key);
        const pts: [number, number][] = data.map((d, i) => [xPos(i), yPos((d[s.key] as number) ?? 0, max)]);
        const line = bezierPath(pts);
        const bot  = P.t + cH;
        const area = `${line} L ${pts[pts.length - 1][0]},${bot} L ${pts[0][0]},${bot} Z`;
        return (
          <g key={s.key}>
            <path d={area} fill={`url(#lg-${s.key})`} />
            <path d={line} fill="none" stroke={s.color} strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" />
            {pts.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="3.5" fill="#fff" stroke={s.color} strokeWidth="2" />
            ))}
          </g>
        );
      })}

      {/* X labels */}
      {data.map((d, i) => (
        <text key={i} x={xPos(i)} y={H - 4} textAnchor="middle" fontSize="9.5" fill="#94a3b8">
          {d.label}
        </text>
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────────────
   SVG Donut Chart  (Substance Traffic Channels style)
───────────────────────────────────────────────── */
function DonutChart({ segments, total }: {
  segments: { label: string; value: number; color: string }[];
  total: number;
}) {
  const R = 40; const CX = 52; const CY = 52;
  const C = 2 * Math.PI * R;
  let accDash = 0;

  return (
    <div className="flex items-center gap-5">
      <svg width="104" height="104" viewBox="0 0 104 104" className="shrink-0">
        {total === 0
          ? <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth="13" />
          : segments.map(({ label, value, color }) => {
              const dash = (value / total) * C;
              const off  = -(C * 0.25) + accDash;
              accDash   += dash;
              return (
                <circle key={label} cx={CX} cy={CY} r={R} fill="none"
                  stroke={color} strokeWidth="13"
                  strokeDasharray={`${dash} ${C - dash}`}
                  strokeDashoffset={-off}
                  style={{ transition: "all 0.8s ease" }}
                />
              );
            })
        }
        <text x={CX} y={CY - 3} textAnchor="middle" fontSize="15" fontWeight="700" fill="#111827">{total}</text>
        <text x={CX} y={CY + 13} textAnchor="middle" fontSize="9" fill="#9ca3af">orders</text>
      </svg>
      <div className="space-y-3">
        {segments.map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
            <span className="text-[12px] text-gray-600">{label}</span>
            <span className="ml-auto text-[12px] font-bold text-gray-900">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Dashboard page  (Substance-inspired layout)
───────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────
   Dashboard helpers
───────────────────────────────────────────────── */
function StatCard({
  label, value, sub, icon, gradient, accent, bg, loading,
}: {
  label: string; value: string; sub: string;
  icon: React.ReactNode;
  gradient?: string; accent?: string; bg?: string; loading?: boolean;
}) {
  if (gradient) {
    return (
      <div className="rounded-2xl p-5 shadow-sm flex flex-col gap-4" style={{ background: gradient }}>
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">{icon}</div>
          <span className="text-[11px] font-semibold bg-white/15 text-white/80 px-2.5 py-0.5 rounded-full">{sub}</span>
        </div>
        <div>
          <p className="text-[26px] font-bold text-white leading-none">{loading ? "—" : value}</p>
          <p className="text-[12px] text-white/70 mt-1">{label}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>{icon}</div>
        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full" style={{ background: bg, color: accent }}>{sub}</span>
      </div>
      <div>
        <p className="text-[26px] font-bold text-gray-900 leading-none">{loading ? "—" : value}</p>
        <p className="text-[12px] text-gray-400 mt-1">{label}</p>
      </div>
    </div>
  );
}

/* extract leading country name from package name e.g. "Japan 1GB 7Days" → "Japan" */
function countryFromPackage(name: string): string {
  // multi-word countries first
  for (const c of ["South Korea","Saudi Arabia","United Arab Emirates","United States","United Kingdom","New Zealand","Hong Kong","Costa Rica","Puerto Rico"]) {
    if (name.startsWith(c)) return c;
  }
  return name.split(" ")[0] ?? name;
}

/* country name → ISO-2 code map for flagcdn */
const COUNTRY_CODE: Record<string, string> = {
  "Afghanistan":"af","Albania":"al","Algeria":"dz","Argentina":"ar","Armenia":"am","Australia":"au",
  "Austria":"at","Azerbaijan":"az","Bahrain":"bh","Bangladesh":"bd","Belgium":"be","Bolivia":"bo",
  "Brazil":"br","Bulgaria":"bg","Cambodia":"kh","Canada":"ca","Chile":"cl","China":"cn","Colombia":"co",
  "Costa Rica":"cr","Croatia":"hr","Cyprus":"cy","Czech":"cz","Denmark":"dk","Ecuador":"ec","Egypt":"eg",
  "Estonia":"ee","Ethiopia":"et","Finland":"fi","France":"fr","Georgia":"ge","Germany":"de","Ghana":"gh",
  "Greece":"gr","Guatemala":"gt","Honduras":"hn","Hong Kong":"hk","Hungary":"hu","India":"in",
  "Indonesia":"id","Iran":"ir","Iraq":"iq","Ireland":"ie","Israel":"il","Italy":"it","Japan":"jp",
  "Jordan":"jo","Kazakhstan":"kz","Kenya":"ke","Kuwait":"kw","Kyrgyzstan":"kg","Latvia":"lv",
  "Lebanon":"lb","Lithuania":"lt","Luxembourg":"lu","Malaysia":"my","Malta":"mt","Mexico":"mx",
  "Moldova":"md","Mongolia":"mn","Montenegro":"me","Morocco":"ma","Mozambique":"mz","Myanmar":"mm",
  "Nepal":"np","Netherlands":"nl","New Zealand":"nz","Nicaragua":"ni","Nigeria":"ng","Norway":"no",
  "Oman":"om","Pakistan":"pk","Panama":"pa","Paraguay":"py","Peru":"pe","Philippines":"ph","Poland":"pl",
  "Portugal":"pt","Puerto Rico":"pr","Qatar":"qa","Romania":"ro","Russia":"ru","Saudi Arabia":"sa",
  "Senegal":"sn","Serbia":"rs","Singapore":"sg","Slovakia":"sk","Slovenia":"si","Somalia":"so",
  "South Africa":"za","South Korea":"kr","Spain":"es","Sri Lanka":"lk","Sweden":"se","Switzerland":"ch",
  "Taiwan":"tw","Tajikistan":"tj","Tanzania":"tz","Thailand":"th","Tunisia":"tn","Turkey":"tr",
  "Uganda":"ug","Ukraine":"ua","United Arab Emirates":"ae","United Kingdom":"gb","United States":"us",
  "Uruguay":"uy","Uzbekistan":"uz","Venezuela":"ve","Vietnam":"vn","Yemen":"ye","Zambia":"zm",
  "Zimbabwe":"zw","Europe":"eu","Global":"un","Caribbean":"","Africa":"","Asia":"","Americas":"",
};

function FlagImg({ country }: { country: string }) {
  const code = COUNTRY_CODE[country];
  if (!code) return <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">🌐</span>;
  return (
    <img
      src={`https://flagcdn.com/w160/${code}.png`}
      alt={country}
      className="w-6 h-6 rounded-full object-cover border border-gray-100"
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
}

function DashboardPage() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["admin-stats"],
    queryFn: () => fetch("/api/admin/stats").then((r) => r.json()),
  });
  const { data: ordersData } = useQuery<{ orders: Order[] }>({
    queryKey: ["admin-orders"],
    queryFn: () => fetch("/api/admin/orders").then((r) => r.json()),
  });
  const { data: destsData } = useQuery<{ destinations: { locationCode: string; locationName: string }[] }>({
    queryKey: ["admin-destinations"],
    queryFn: () => fetch("/api/destinations").then((r) => r.json()),
  });

  const orders = ordersData?.orders ?? [];
  const s = stats;
  const totalOrd = s?.totalOrders ?? 0;

  /* Monthly chart data */
  const chartData = useMemo<ChartPoint[]>(() => {
    type M = { label: string; orders: number; revenue: number };
    const months: Record<string, M> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[key] = { label: d.toLocaleDateString("en-US", { month: "short" }), orders: 0, revenue: 0 };
    }
    for (const o of orders) {
      const d   = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (months[key]) { months[key].orders++; months[key].revenue += o.price / 10000; }
    }
    return Object.values(months) as ChartPoint[];
  }, [orders]);

  /* Top destinations derived from orders */
  const topDests = useMemo(() => {
    const map = new Map<string, { country: string; orders: number; revenue: number }>();
    for (const o of orders) {
      const country = countryFromPackage(o.packageName);
      const e = map.get(country);
      if (e) { e.orders++; e.revenue += o.price / 10000; }
      else map.set(country, { country, orders: 1, revenue: o.price / 10000 });
    }
    return Array.from(map.values()).sort((a, b) => b.orders - a.orders).slice(0, 8);
  }, [orders]);

  /* Latest customers — unique emails, sorted by first order */
  const latestCustomers = useMemo(() => {
    const seen = new Map<string, { email: string; joinedAt: string; orderCount: number; status: string }>();
    const sorted = [...orders].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    for (const o of sorted) {
      if (!seen.has(o.customerEmail)) {
        seen.set(o.customerEmail, { email: o.customerEmail, joinedAt: o.createdAt, orderCount: 1, status: o.status });
      } else {
        seen.get(o.customerEmail)!.orderCount++;
      }
    }
    return Array.from(seen.values()).sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()).slice(0, 7);
  }, [orders]);

  const recentOrders = useMemo(() => [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 7), [orders]);
  const uniqueCustomers = useMemo(() => new Set(orders.map(o => o.customerEmail)).size, [orders]);
  const totalRevenue = s?.totalRevenue ?? 0;
  const providerCost = Math.round(totalRevenue * 0.65); // ~65% wholesale estimate
  const activePackages = destsData?.destinations?.length ?? 0;

  const ACCENT = ["#22c55e","#3b82f6","#0da976","#8b5cf6","#ef4444","#06b6d4","#ec4899","#14b8a6"];

  function avatarBg(email: string) {
    const colors = ["#6366f1","#8b5cf6","#ec4899","#0da976","#22c55e","#3b82f6","#ef4444","#06b6d4"];
    let h = 0; for (const c of email) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
    return colors[h % colors.length];
  }

  return (
    <div className="space-y-5">

      {/* ── Welcome header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-gray-900">Dashboard</h2>
          <p className="text-[13px] text-gray-400 mt-0.5">Welcome back! Here's what's happening with your eSIM marketplace today.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[12.5px] font-medium text-gray-600 shadow-sm">
          All time <ChevronDown className="w-3.5 h-3.5 ml-1 text-gray-400" />
        </div>
      </div>

      {/* ── 5 KPI cards ── */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard loading={isLoading} label="Total Revenue" value={`US$${fmtUsd(totalRevenue)}`} sub="All time"
          gradient="linear-gradient(135deg,#16a34a 0%,#22c55e 100%)"
          icon={<TrendingUp className="w-4.5 h-4.5 text-white" strokeWidth={2} />} />
        <StatCard loading={isLoading} label="Due to Providers" value={`US$${fmtUsd(providerCost)}`} sub="Est. cost"
          accent="#8b5cf6" bg="#f5f3ff"
          icon={<BarChart2 className="w-4 h-4" style={{ color: "#8b5cf6" }} strokeWidth={2} />} />
        <StatCard loading={isLoading} label="Total Orders" value={String(totalOrd)} sub="e-SIMs sold"
          accent="#3b82f6" bg="#eff6ff"
          icon={<ShoppingCart className="w-4 h-4" style={{ color: "#3b82f6" }} strokeWidth={2} />} />
        <StatCard loading={isLoading} label="Customers" value={String(uniqueCustomers)} sub="Unique buyers"
          accent="#0da976" bg="#f0faf7"
          icon={<Users className="w-4 h-4" style={{ color: "#0da976" }} strokeWidth={2} />} />
        <StatCard loading={!destsData} label="Active Packages" value={activePackages ? `${activePackages}` : "—"} sub="Destinations"
          accent="#06b6d4" bg="#ecfeff"
          icon={<Bell className="w-4 h-4" style={{ color: "#06b6d4" }} strokeWidth={2} />} />
      </div>

      {/* ── Revenue Trend + Order Status ── */}
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-3 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[14.5px] font-semibold text-gray-900">Revenue Trend</h3>
              <p className="text-[12px] text-gray-400 mt-0.5">Last 6 months performance</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#3b82f6" }} />
                <span className="text-[12px] text-gray-500">Revenue (USD)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#22c55e" }} />
                <span className="text-[12px] text-gray-500">Orders</span>
              </div>
            </div>
          </div>
          <SmoothLineChart
            data={chartData}
            series={[
              { key: "revenue", color: "#3b82f6", label: "Revenue" },
              { key: "orders",  color: "#22c55e", label: "Orders" },
            ]}
          />
        </div>

        <div className="col-span-1 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col">
          <h3 className="text-[14px] font-semibold text-gray-900">Order Status</h3>
          <p className="text-[12px] text-gray-400 mb-4 mt-0.5">Distribution overview</p>
          <div className="flex-1 flex items-center justify-center">
            <DonutChart
              total={totalOrd}
              segments={[
                { label: "Completed", value: s?.completedOrders ?? 0, color: "#22c55e" },
                { label: "Pending",   value: s?.pendingOrders   ?? 0, color: "#0da976" },
                { label: "Failed",    value: s?.failedOrders    ?? 0, color: "#ef4444" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* ── Top Destinations ── */}
      {topDests.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h3 className="text-[14.5px] font-semibold text-gray-900">Top Destinations</h3>
              <p className="text-[12px] text-gray-400 mt-0.5">Most popular packages by country</p>
            </div>
            <span className="text-[12px] font-medium px-3 py-1.5 rounded-xl" style={{ background: "#f0fdf4", color: "#16a34a" }}>
              Top {topDests.length}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {topDests.map((d, i) => {
              const maxOrd = topDests[0].orders;
              const pct = maxOrd > 0 ? (d.orders / maxOrd) * 100 : 0;
              return (
                <div key={d.country} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50/60 transition-colors">
                  <span className="w-5 text-[12px] font-bold text-gray-300 shrink-0">{i + 1}</span>
                  <FlagImg country={d.country} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[13px] font-semibold text-gray-800">{d.country}</p>
                      <p className="text-[12px] font-bold text-gray-900">US${fmtUsd(d.revenue)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: ACCENT[i % ACCENT.length] }} />
                      </div>
                      <span className="text-[11px] text-gray-400 shrink-0 w-14 text-right">{d.orders} order{d.orders !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Latest Orders + Latest Customers ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Latest Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-gray-900">Latest Orders</h3>
            <span className="text-[12px] text-gray-400">Recent eSIM purchases</span>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-gray-400">No orders yet</p>
            ) : recentOrders.map((o) => (
              <div key={o.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 transition-colors">
                <StatusBadge status={o.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold text-gray-900 truncate">{o.packageName}</p>
                  <p className="text-[11.5px] text-gray-400 truncate mt-0.5">{o.customerEmail}</p>
                  <p className="text-[11px] text-gray-300 mt-0.5">{new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
                <span className="text-[12.5px] font-bold text-gray-900 shrink-0">US${fmtUsd(o.price)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Customers */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-gray-900">Latest Customers</h3>
            <span className="text-[12px] text-gray-400">Recently registered users</span>
          </div>
          <div className="divide-y divide-gray-50">
            {latestCustomers.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-gray-400">No customers yet</p>
            ) : latestCustomers.map((c) => {
              const initials = c.email.slice(0, 2).toUpperCase();
              const bg = avatarBg(c.email);
              return (
                <div key={c.email} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 transition-colors">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[12px] font-bold text-white"
                    style={{ background: bg }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold text-gray-900 truncate">{c.email.split("@")[0]}</p>
                    <p className="text-[11.5px] text-gray-400 truncate">{c.email}</p>
                    <p className="text-[11px] text-gray-300 mt-0.5">
                      Joined {new Date(c.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={c.status} />
                    <span className="text-[11px] text-gray-400">{c.orderCount} order{c.orderCount !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}

/* ─────────────────────────────────────────────────
   Orders page
───────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────
   Order management shared helpers
───────────────────────────────────────────────── */
function parsePackageName(name: string): { country: string; data: string; duration: string } {
  const country = countryFromPackage(name);
  const rest    = name.slice(country.length).trim();
  const m = rest.match(/(\d+(?:\.\d+)?(?:MB|GB|TB))\s*[x×]?\s*(\d+\s*(?:Day|Month|Year)s?)/i);
  if (m) return { country, data: m[1], duration: m[2] };
  const parts = rest.split(/\s+/);
  return { country, data: parts[0] ?? "—", duration: parts[1] ?? "—" };
}

/* Three-dot actions dropdown */
function ActionsMenu({ actions }: { actions: { label: string; icon: React.ReactNode; danger?: boolean; onClick: () => void }[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!btnRef.current?.contains(e.target as Node) && !menuRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + window.scrollY + 4, right: window.innerWidth - r.right });
    setOpen((o) => !o);
  };

  return (
    <div className="relative inline-block">
      <button ref={btnRef} onClick={handleOpen}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700">
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div ref={menuRef}
          className="z-[9999] w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1"
          style={{ position: "fixed", top: pos.top, right: pos.right }}>
          {actions.map((a) => (
            <button key={a.label} onClick={() => { a.onClick(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium hover:bg-gray-50 transition-colors text-left"
              style={{ color: a.danger ? "#ef4444" : "#374151" }}>
              {a.icon}{a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* Searchable status filter dropdown */
function StatusSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const OPTIONS = ["All Statuses","completed","pending","failed","permanently_failed"];
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const label = value === "all" ? "All Statuses" : value.replace(/_/g," ").replace(/\b\w/g,(c)=>c.toUpperCase());
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm min-w-[150px] justify-between">
        {label}<ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>
      {open && (
        <div className="absolute left-0 top-11 z-50 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1">
          {OPTIONS.map((o) => {
            const v = o === "All Statuses" ? "all" : o;
            return (
              <button key={v} onClick={() => { onChange(v); setOpen(false); }}
                className="w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50 transition-colors"
                style={{ color: value === v ? "#22c55e" : "#374151", fontWeight: value === v ? 600 : 400 }}>
                {o}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* CSV export helper */
function exportCsv(filename: string, rows: string[][], headers: string[]) {
  const lines = [headers, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g,'""')}"`).join(","));
  const blob  = new Blob([lines.join("\n")], { type: "text/csv" });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ─────────────────────────────────────────────────
   Orders page  (redesigned to match reference)
───────────────────────────────────────────────── */
function OrdersPage() {
  const { data, isLoading, refetch, isFetching } = useQuery<{ orders: Order[] }>({
    queryKey: ["admin-orders"],
    queryFn: () => fetch("/api/admin/orders").then((r) => r.json()),
  });
  const [search, setSearch]   = useState("");
  const [status, setStatus]   = useState("all");
  const [page, setPage]       = useState(1);
  const PER_PAGE = 15;

  const filtered = useMemo(() => {
    let list = data?.orders ?? [];
    if (status !== "all") list = list.filter((o) => o.status === status);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((o) =>
        o.customerEmail.toLowerCase().includes(q) ||
        o.packageName.toLowerCase().includes(q) ||
        o.transactionId.toLowerCase().includes(q) ||
        (o.orderNo ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [data, status, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function handleExport() {
    exportCsv("orders.csv",
      (data?.orders ?? []).map((o) => [
        o.orderNo ?? o.transactionId, o.customerEmail, o.packageName,
        `$${fmtUsd(o.price)}`, o.status, fmtDate(o.createdAt),
      ]),
      ["Order ID","Customer","Package","Amount","Status","Date"]
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-gray-900">Order Management</h2>
          <p className="text-[13px] text-gray-400 mt-0.5">View and manage all orders</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Fetch Pending
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ background: "#22c55e" }}>
            <LottieIcon src="/icons/shopping-cart.json" size={16} autoplay loop />
            Order eSIMs
          </button>
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
            <Download className="w-3.5 h-3.5" />
            Export Orders {filtered.length > 0 ? filtered.length : ""}
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-[380px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by email, order ID, or destination…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-[13.5px] text-gray-700 placeholder-gray-400 outline-none focus:border-green-400 bg-white transition-colors shadow-sm"
          />
        </div>
        <StatusSelect value={status} onChange={(v) => { setStatus(v); setPage(1); }} />
        <span className="ml-auto text-[13px] font-medium text-gray-500 bg-white border border-gray-200 px-3.5 py-2.5 rounded-xl shadow-sm">
          {filtered.length} order{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-gray-300">
            <RefreshCw className="w-7 h-7 animate-spin" />
            <p className="text-[13px]">Loading orders…</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
              <LottieIcon src="/icons/shopping-cart.json" size={36} autoplay loop />
            </div>
            <div className="text-center">
              <p className="text-[15px] font-semibold text-gray-800">No orders found</p>
              <p className="text-[13px] text-gray-400 mt-1">Try adjusting your search or filter</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {["Order ID","Customer","Destination","Package","Amount","Status","Date","Actions"].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((o) => {
                  const { country, data: dataAmt, duration } = parsePackageName(o.packageName);
                  return (
                    <tr key={o.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className="font-bold text-gray-900 text-[13px]">{o.orderNo ? `OID${String(o.orderNo).padStart(3,"0")}` : `#${o.id}`}</p>
                        <p className="text-[10.5px] text-gray-400 font-mono mt-0.5">{o.transactionId.slice(0,10)}…</p>
                      </td>
                      <td className="px-5 py-3.5 max-w-[160px]">
                        <p className="font-medium text-gray-900 truncate">{o.customerEmail.split("@")[0]}</p>
                        <p className="text-[11.5px] text-gray-400 truncate">{o.customerEmail}</p>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FlagImg country={country} />
                          <span className="font-medium text-gray-800">{country}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className="font-semibold text-gray-900">{dataAmt}</p>
                        <p className="text-[11.5px] text-gray-400">{duration}</p>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-[14px]" style={{ color: "#22c55e" }}>
                        ${fmtUsd(o.price)}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap"><StatusBadge status={o.status} /></td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 text-[12.5px]">{fmtDate(o.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <ActionsMenu actions={[
                          { label: "View Details",  icon: <Eye     className="w-3.5 h-3.5" />, onClick: () => {} },
                          { label: "Edit Order",    icon: <Pencil  className="w-3.5 h-3.5" />, onClick: () => {} },
                          { label: "Delete",        icon: <Trash2  className="w-3.5 h-3.5" />, danger: true, onClick: () => {} },
                        ]} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="text-[13px] font-medium text-gray-500 hover:text-gray-900 disabled:opacity-30 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">← Prev</button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((pg) => (
                <button key={pg} onClick={() => setPage(pg)}
                  className="w-8 h-8 rounded-lg text-[13px] font-medium transition-colors"
                  style={page === pg ? { background: "#22c55e", color: "#fff" } : { color: "#64748b" }}
                >{pg}</button>
              ))}
            </div>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="text-[13px] font-medium text-gray-500 hover:text-gray-900 disabled:opacity-30 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Custom Orders page
───────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────
   Order eSIMs — browse + order ESIMAccess packages
───────────────────────────────────────────────── */
interface AdminPackage {
  packageCode: string;
  name: string;
  locationCode: string;
  locationName: string;
  locationSubtitle: string;
  dataGb: string;
  durationDays: number;
  durationLabel: string;
  retailPriceCents: number;
  wholesalePriceCents: number;
  operator: string;
  provider: string;
  flagUrl: string;
  isRegional: boolean;
}

interface AdminPackagesResponse {
  packages: AdminPackage[];
  total: number;
  page: number;
  pageSize: number;
}

interface OrderResult {
  transactionId: string;
  orderNo?: string;
  status: string;
  esimProfiles: { iccid: string; qrCodeUrl?: string }[];
  quantity: number;
}

function OrderModal({
  pkg,
  onClose,
  onSuccess,
}: {
  pkg: AdminPackage;
  onClose: () => void;
  onSuccess: (result: OrderResult) => void;
}) {
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [done, setDone] = useState<OrderResult | null>(null);

  const totalDollars = ((pkg.retailPriceCents * quantity) / 100).toFixed(2);

  const mutation = useMutation<OrderResult, Error>({
    mutationFn: async () => {
      const res = await fetch("/api/admin/custom-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageCode: pkg.packageCode,
          packageName: pkg.name,
          price: pkg.retailPriceCents * quantity,
          quantity,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? "Order failed");
      }
      return res.json() as Promise<OrderResult>;
    },
    onSuccess: (result) => {
      setDone(result);
      void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      onSuccess(result);
    },
  });

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[440px] p-8 flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#f0fdf4" }}>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <div className="text-center">
            <p className="text-[18px] font-bold text-gray-900">Order Placed!</p>
            <p className="text-[13px] text-gray-400 mt-1">
              {done.quantity} eSIM{done.quantity > 1 ? "s" : ""} purchased and stored as unassigned stock.
            </p>
            {done.orderNo && (
              <p className="text-[12px] font-mono text-gray-500 mt-2">Order #{done.orderNo}</p>
            )}
          </div>
          <button onClick={onClose}
            className="w-full py-3 rounded-xl text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "#22c55e" }}>
            View Custom Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[460px] overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-green-600 uppercase tracking-wider mb-1">Order eSIMs</p>
              <h3 className="text-[17px] font-bold text-gray-900">Confirm Order</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Package info */}
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <img
              src={pkg.flagUrl}
              alt=""
              className="w-9 h-6 object-cover rounded-sm shadow-sm flex-shrink-0"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://flagcdn.com/w160/un.png"; }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-gray-900 truncate">{pkg.locationName}</p>
              <p className="text-[12px] text-gray-400">{pkg.dataGb} · {pkg.durationLabel}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[15px] font-bold text-green-600">${(pkg.retailPriceCents / 100).toFixed(2)}</p>
              <p className="text-[11px] text-gray-400">per eSIM</p>
            </div>
          </div>

          {/* Package name */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Package</p>
            <p className="text-[13px] text-gray-700 leading-relaxed">{pkg.name}</p>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Quantity (1–100 eSIMs)
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors font-bold text-lg"
              >−</button>
              <input
                type="number"
                min={1}
                max={100}
                value={quantity}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v)) setQuantity(Math.min(100, Math.max(1, v)));
                }}
                className="w-20 text-center py-2 rounded-lg border border-gray-200 text-[15px] font-semibold text-gray-900 outline-none focus:border-green-400"
              />
              <button
                onClick={() => setQuantity((q) => Math.min(100, q + 1))}
                className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors font-bold text-lg"
              >+</button>
            </div>
            <p className="text-[11.5px] text-gray-400 mt-2">
              Single order · synchronous · instant provisioning
            </p>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-green-100 bg-green-50/50">
            <p className="text-[13px] font-semibold text-gray-700">Total Price</p>
            <p className="text-[20px] font-bold text-green-600">${totalDollars}</p>
          </div>

          {mutation.isError && (
            <p className="text-[12.5px] text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">
              {mutation.error.message}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} disabled={mutation.isPending}
            className="flex-1 py-3 rounded-xl text-[14px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-150 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 py-3 rounded-xl text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "#22c55e" }}
          >
            {mutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Placing Order…
              </>
            ) : (
              "Place Order"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderEsimsPage({ onBack }: { onBack: () => void }) {
  /* country grid */
  const [countrySearch, setCountrySearch]   = useState("");
  const [countrySearchQ, setCountrySearchQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setCountrySearchQ(countrySearch), 300);
    return () => clearTimeout(t);
  }, [countrySearch]);

  /* selected country drawer */
  const [selectedCountry, setSelectedCountry] = useState<CountryGroup | null>(null);
  const [drawerSearch, setDrawerSearch]       = useState("");
  const [drawerSearchQ, setDrawerSearchQ]     = useState("");
  const [drawerSort, setDrawerSort]           = useState("default");
  useEffect(() => {
    const t = setTimeout(() => setDrawerSearchQ(drawerSearch), 300);
    return () => clearTimeout(t);
  }, [drawerSearch]);

  /* order modal */
  const [selectedPkg, setSelectedPkg] = useState<AdminPackage | null>(null);

  /* country list */
  const cParams = new URLSearchParams();
  if (countrySearchQ) cParams.set("search", countrySearchQ);
  const { data: countriesData, isLoading: countriesLoading } = useQuery<{ countries: CountryGroup[]; total: number }>({
    queryKey: ["order-esims-countries", countrySearchQ],
    queryFn: () => fetch(`/api/admin/catalog-countries?${cParams}`).then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });
  const countries = countriesData?.countries ?? [];

  /* drawer packages */
  const dParams = new URLSearchParams({ pageSize: "100" });
  if (selectedCountry) dParams.set("locationCode", selectedCountry.locationCode);
  if (drawerSearchQ)   dParams.set("search", drawerSearchQ);
  if (drawerSort !== "default") dParams.set("sortBy", drawerSort);
  const { data: drawerData, isLoading: drawerLoading } = useQuery<AdminPackagesResponse>({
    queryKey: ["order-esims-drawer", selectedCountry?.locationCode, drawerSearchQ, drawerSort],
    queryFn: () => fetch(`/api/admin/packages?${dParams}`).then(r => r.json()),
    enabled: !!selectedCountry,
  });
  const drawerPkgs = drawerData?.packages ?? [];

  const fmt$ = (c: number) => `$${(c / 100).toFixed(2)}`;
  const typePillStyle = (t: string) =>
    t === "local" ? "bg-blue-100 text-blue-700 border-blue-200"
    : t === "regional" ? "bg-purple-100 text-purple-700 border-purple-200"
    : "bg-amber-100 text-amber-700 border-amber-200";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors shadow-sm">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <h2 className="text-[22px] font-bold text-gray-900">Order eSIMs</h2>
            <p className="text-[13px] text-gray-400 mt-0.5">Select a destination, pick a plan, and order for your inventory</p>
          </div>
        </div>
        <button onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
          <LottieIcon src="/icons/bag.json" size={15} autoplay loop />
          View Custom Orders
        </button>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-[400px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={countrySearch} onChange={e => setCountrySearch(e.target.value)}
            placeholder="Search destinations…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 placeholder-gray-400 outline-none focus:border-green-400 bg-white transition-colors shadow-sm" />
        </div>
        <span className="ml-auto text-[12.5px] text-gray-400 whitespace-nowrap">{countries.length} destinations</span>
      </div>

      {/* Country grid */}
      {countriesLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl overflow-hidden border border-gray-200 bg-white">
              <div className="h-32 bg-gray-100" />
              <div className="p-3 space-y-2"><div className="h-3 bg-gray-100 rounded w-3/4" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>
            </div>
          ))}
        </div>
      ) : countries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center bg-white rounded-2xl border border-gray-200">
          <LottieIcon src="/icons/global.json" size={40} autoplay loop />
          <p className="text-[15px] font-semibold text-gray-600">No destinations found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {countries.map(country => (
            <button key={country.locationCode}
              onClick={() => { setSelectedCountry(country); setDrawerSearch(""); setDrawerSearchQ(""); setDrawerSort("default"); }}
              className="group relative rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-left">
              <div className="relative h-32 overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
                <img src={`https://source.unsplash.com/featured/480x260/?${encodeURIComponent(country.locationName)},travel,landscape`}
                  alt={country.locationName}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => { const img = e.target as HTMLImageElement; if (!img.dataset.f) { img.dataset.f="1"; img.src=country.flagUrl; } }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                <div className="absolute top-2.5 right-2.5">
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-1 rounded-lg bg-white/90 text-gray-800 backdrop-blur-sm shadow-sm">
                    <Package className="w-3 h-3" />{country.planCount}
                  </span>
                </div>
                <div className="absolute top-2.5 left-2.5">
                  <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-lg px-1.5 py-1">
                    <img src={country.flagUrl} alt="" className="w-5 h-3.5 object-cover rounded-[3px] shrink-0"
                      onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                  <p className="text-white font-bold text-[13.5px] leading-snug truncate drop-shadow-sm">{country.locationName}</p>
                  <p className="text-white/60 text-[10px] font-mono">{country.locationCode}</p>
                </div>
              </div>
              <div className="px-3 py-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">From</span>
                  <span className="text-[12.5px] font-bold text-emerald-600">{fmt$(country.minPriceCents)}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {country.packageTypes.map(t => (
                    <span key={t} className={`inline-flex text-[9.5px] font-bold px-1.5 py-0.5 rounded-md border capitalize ${typePillStyle(t)}`}>{t}</span>
                  ))}
                </div>
              </div>
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-green-400 transition-colors pointer-events-none" />
            </button>
          ))}
        </div>
      )}

      {/* Plans drawer */}
      {selectedCountry && (
        <div>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]" onClick={() => setSelectedCountry(null)} />
          <div className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-white shadow-2xl" style={{ width: 500 }}>
            {/* Banner header */}
            <div className="shrink-0 border-b border-gray-100">
              <div className="relative h-24 overflow-hidden">
                <img src={selectedCountry.flagUrl} alt={selectedCountry.locationName}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = "https://flagcdn.com/w640/un.png"; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <button onClick={() => setSelectedCountry(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
                  <h2 className="text-white font-bold text-[18px] leading-tight drop-shadow">{selectedCountry.locationName}</h2>
                  <p className="text-white/70 text-[12px] mt-0.5">{drawerData?.total ?? selectedCountry.planCount} plans — click Order to purchase</p>
                </div>
              </div>
              <div className="px-4 py-3 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input value={drawerSearch} onChange={e => setDrawerSearch(e.target.value)} placeholder="Search plans…"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-[12.5px] text-gray-700 outline-none focus:border-green-400 bg-gray-50 focus:bg-white transition-colors" />
                </div>
                <select value={drawerSort} onChange={e => setDrawerSort(e.target.value)}
                  className="px-2.5 py-2 rounded-xl border border-gray-200 text-[12px] text-gray-600 bg-gray-50 outline-none focus:border-green-400 cursor-pointer">
                  <option value="default">Default</option>
                  <option value="price_asc">Price ↑</option>
                  <option value="price_desc">Price ↓</option>
                  <option value="data_desc">Data ↓</option>
                </select>
              </div>
            </div>

            {/* Plan list */}
            <div className="flex-1 overflow-y-auto py-2 px-3 space-y-2">
              {drawerLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-gray-100 p-4">
                    <div className="h-3.5 bg-gray-100 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                  </div>
                ))
              ) : drawerPkgs.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <p className="text-[13.5px] font-semibold text-gray-500">No plans found</p>
                </div>
              ) : drawerPkgs.map(pkg => (
                <div key={pkg.packageCode} className="rounded-xl border border-gray-200 bg-white p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-[13px] leading-snug mb-1.5">{pkg.name}</p>
                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                          <Wifi className="w-2.5 h-2.5" />{pkg.dataGb}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-gray-50 text-gray-600 border border-gray-100">
                          <Clock className="w-2.5 h-2.5" />{pkg.durationLabel}
                        </span>
                        <span className={`inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded-md border capitalize ${typePillStyle(pkg.isRegional ? "regional" : "local")}`}>
                          {pkg.isRegional ? "regional" : "local"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-400">
                        <span>Cost <span className="font-medium text-gray-600">{fmt$(pkg.wholesalePriceCents)}</span></span>
                        <span className="text-gray-200">•</span>
                        <span>Sell <span className="font-bold text-emerald-600">{fmt$(pkg.retailPriceCents)}</span></span>
                        {pkg.operator && <span className="text-gray-200">•</span>}
                        {pkg.operator && <span className="truncate max-w-[80px]">{pkg.operator}</span>}
                      </div>
                    </div>
                    <button onClick={() => setSelectedPkg(pkg)}
                      className="shrink-0 px-4 py-2 rounded-xl text-[12.5px] font-bold text-white hover:opacity-90 transition-opacity"
                      style={{ background: "#22c55e" }}>
                      Order
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="shrink-0 border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-gray-50/50">
              <p className="text-[12px] text-gray-400">{drawerPkgs.length} plans available</p>
              <button onClick={() => setSelectedCountry(null)}
                className="px-4 py-2 rounded-xl bg-gray-900 text-white text-[12.5px] font-semibold hover:bg-gray-700 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order confirmation modal */}
      {selectedPkg && (
        <OrderModal
          pkg={selectedPkg}
          onClose={() => setSelectedPkg(null)}
          onSuccess={() => setSelectedPkg(null)}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   eSIM PDF generator — landscape card design
───────────────────────────────────────────────── */
const GREEN  = [34, 197, 94]   as [number, number, number];
const DARK   = [24, 24, 27]    as [number, number, number];
const GRAY   = [107, 114, 128] as [number, number, number];
const LIGHT  = [249, 250, 251] as [number, number, number];
const WHITE  = [255, 255, 255] as [number, number, number];

async function fetchImgDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror   = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

async function generateEsimPdf(order: Order): Promise<void> {
  const { country, data: dataAmt, duration } = parsePackageName(order.packageName);
  const cc = COUNTRY_CODE[country] ?? "un";

  const bgData = await fetchImgDataUrl(`https://flagcdn.com/w1280/${cc}.png`);
  const shortUrl = `${window.location.origin}/esim/${order.transactionId}`;
  const qrDataUrl = await QRCode.toDataURL(shortUrl, {
    width: 400, margin: 2, color: { dark: "#000000", light: "#ffffff" },
  });

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297, H = 210;

  /* helper: draw background on current page */
  const drawBg = () => {
    if (bgData) {
      doc.addImage(bgData, "PNG", 0, 0, W, H);
      doc.setGState(new (doc as any).GState({ opacity: 0.62 }));
      doc.setFillColor(...WHITE);
      doc.rect(0, 0, W, H, "F");
      doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
    } else {
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, W, H, "F");
    }
  };

  /* ── Page 1: eSIM card ── */
  drawBg();

  // "voltey." logo — top left
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...GREEN);
  doc.text("voltey.", 14, 19);

  // Plan name — top center
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...DARK);
  doc.text(`${country}  ${dataAmt}  ${duration}`, W / 2, 19, { align: "center" });

  // Expires — top right (two lines)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 90);
  doc.text("Expires:", W - 14, 13, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`After ${duration}`, W - 14, 20, { align: "right" });

  // White card behind QR
  const cardW = 100, cardH = 100;
  const cardX = (W - cardW) / 2, cardY = 26;
  doc.setFillColor(...WHITE);
  doc.setDrawColor(215, 215, 215);
  doc.roundedRect(cardX, cardY, cardW, cardH, 6, 6, "FD");

  // QR image (encodes short URL — links to EsimCard landing page)
  const qrPad = 6;
  doc.addImage(qrDataUrl, "PNG", cardX + qrPad, cardY + qrPad, cardW - qrPad * 2, cardH - qrPad * 2);

  // "SCAN or Click the QR"
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...DARK);
  doc.text("SCAN or Click the QR", W / 2, 143, { align: "center" });

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text("Open the Voltey page to view & activate your eSIM", W / 2, 151, { align: "center" });

  // "Issued in" — bottom right
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 90);
  doc.text(`Issued in ${country}`, W - 14, H - 5, { align: "right" });

  /* ── Page 2: Installation Guide ── */
  doc.addPage();
  drawBg();

  // "voltey." logo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...GREEN);
  doc.text("voltey.", 14, 19);

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...DARK);
  doc.text("Installation Guide", W / 2, 19, { align: "center" });

  // Plan name — top right
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text(`${country}  ${dataAmt}  ${duration}`, W - 14, 19, { align: "right" });

  const iosSteps = [
    "Settings → General → VPN & Device Management → Add eSIM",
    "Tap 'Use QR Code' and scan the QR from your Voltey eSIM page",
    "Or select 'Enter Details Manually' for SM-DP+ and Activation Code",
    "Tap Continue and follow the on-screen prompts",
    "Give the eSIM a label (e.g. Voltey Travel) and confirm",
    "Settings → Cellular → enable Voltey eSIM and turn on Data Roaming",
  ];
  const androidSteps = [
    "Settings → Connections → SIM Manager → Add eSIM (varies by brand)",
    "Tap 'Scan QR code' and scan the QR from your Voltey eSIM page",
    "Or enter the SM-DP+ address and activation code manually",
    "Confirm carrier details and tap Activate",
    "Name your eSIM (e.g. Voltey Travel) and confirm",
    "Go to Mobile Networks and select Voltey eSIM for mobile data",
  ];

  const drawStepsCol = (
    title: string,
    subtitle: string,
    steps: string[],
    x: number,
    y: number,
    colW2: number
  ) => {
    doc.setFillColor(...GREEN);
    doc.roundedRect(x, y, colW2, 13, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...WHITE);
    doc.text(title, x + colW2 / 2, y + 7, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(200, 255, 200);
    doc.text(subtitle, x + colW2 / 2, y + 11.5, { align: "center" });

    let sy = y + 20;
    steps.forEach((step, idx) => {
      doc.setFillColor(...GREEN);
      doc.circle(x + 6, sy + 3.5, 4, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...WHITE);
      doc.text(String(idx + 1), x + 6, sy + 5.0, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...DARK);
      const lines = doc.splitTextToSize(step, colW2 - 16);
      doc.text(lines, x + 14, sy + 4);
      sy += Math.max(10, lines.length * 5) + 5;
    });
  };

  const margin = 14, gap = 10;
  const colW2 = (W - margin * 2 - gap) / 2;
  drawStepsCol("🍎  iPhone / iOS", "iOS 13 or later", iosSteps, margin, 28, colW2);
  drawStepsCol("🤖  Android", "Android 9 or later", androidSteps, margin + colW2 + gap, 28, colW2);

  // Warning strip
  const warnY = 172;
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(251, 191, 36);
  doc.roundedRect(margin, warnY, W - margin * 2, 12, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(120, 53, 15);
  doc.text("⚠  Your device must be unlocked and eSIM-compatible. Once deleted the eSIM cannot be re-installed.", margin + 4, warnY + 7.5);

  // Tips line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text("• Enable Data Roaming for your Voltey eSIM   • You can keep your physical SIM for calls while using Voltey eSIM for data", margin, 192);
  doc.text(`• Need help? email support@voltey.app with Transaction ID: ${order.transactionId.slice(0, 20)}…`, margin, 199);

  // "Issued in" — bottom right
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 90);
  doc.text(`Issued in ${country}`, W - 14, H - 5, { align: "right" });

  const filename = `${order.packageName.replace(/\s+/g, "_")}_eSIM.pdf`;
  doc.save(filename);
}

/* ─────────────────────────────────────────────────
   QR Code image component (generates from LPA string)
───────────────────────────────────────────────── */
function QrCodeImage({ value, size = 160 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!value) return;
    QRCode.toDataURL(value, { width: size * 2, margin: 2 })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [value, size]);
  if (!dataUrl) return (
    <div style={{ width: size, height: size }} className="rounded-lg bg-gray-100 flex items-center justify-center">
      <RefreshCw className="w-5 h-5 text-gray-300 animate-spin" />
    </div>
  );
  return <img src={dataUrl} alt="QR Code" style={{ width: size, height: size }} className="rounded-lg" />;
}

/* ─────────────────────────────────────────────────
   Assign to Customer modal
───────────────────────────────────────────────── */
function AssignCustomerModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const profiles = (order.esimProfiles ?? []) as Array<{ iccid?: string }>;

  const mutation = useMutation<{ emailSent: boolean; warning?: string }, Error>({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/custom-orders/${order.transactionId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerEmail: email }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Failed to assign");
      }
      return res.json() as Promise<{ emailSent: boolean; warning?: string }>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });

  const done = mutation.isSuccess;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[460px] overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold text-green-600 uppercase tracking-wider mb-1">Custom Orders</p>
            <h3 className="text-[17px] font-bold text-gray-900">Assign to Customer</h3>
            <p className="text-[12.5px] text-gray-400 mt-0.5">{order.packageName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-0.5">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {done ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-500" />
              </div>
              <div className="text-center">
                <p className="text-[16px] font-bold text-gray-900">eSIM Assigned!</p>
                <p className="text-[13px] text-gray-400 mt-1">
                  {mutation.data?.emailSent
                    ? `Confirmation email sent to ${email}`
                    : mutation.data?.warning ?? "Assigned but email could not be sent"}
                </p>
              </div>
              <button onClick={onClose}
                className="w-full py-3 rounded-xl text-[14px] font-semibold text-white hover:opacity-90"
                style={{ background: "#22c55e" }}>
                Done
              </button>
            </div>
          ) : (
            <>
              {/* eSIM preview */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">eSIM Stock</p>
                {profiles.length > 0 ? profiles.map((p, i) => (
                  <p key={i} className="font-mono text-[12px] text-gray-700">
                    {p.iccid ?? `Profile ${i + 1}`}
                  </p>
                )) : (
                  <p className="text-[12px] text-gray-400">No ICCID available</p>
                )}
              </div>

              {/* Email input */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Customer Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-[13.5px] text-gray-700 placeholder-gray-400 outline-none focus:border-green-400 transition-colors"
                  />
                </div>
                <p className="text-[11.5px] text-gray-400 mt-1.5">
                  The eSIM QR code and activation details will be emailed to this address.
                </p>
              </div>

              {mutation.isError && (
                <p className="text-[12.5px] text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">
                  {mutation.error.message}
                </p>
              )}
            </>
          )}
        </div>

        {!done && (
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={onClose} disabled={mutation.isPending}
              className="flex-1 py-3 rounded-xl text-[14px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !email.includes("@")}
              className="flex-1 py-3 rounded-xl text-[14px] font-semibold text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "#22c55e" }}>
              {mutation.isPending ? <><RefreshCw className="w-4 h-4 animate-spin" />Assigning…</> : "Assign & Send Email"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   View Details modal
───────────────────────────────────────────────── */
function ViewDetailsModal({
  order,
  onClose,
  onAssign,
}: {
  order: Order;
  onClose: () => void;
  onAssign: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const { country, data: dataAmt, duration } = parsePackageName(order.packageName);
  const profiles = (order.esimProfiles ?? []) as Array<{
    iccid?: string; ac?: string; qrCodeUrl?: string; smdpAddress?: string; matchingId?: string;
  }>;

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try { await generateEsimPdf(order); }
    finally { setDownloading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[600px] max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between z-10 rounded-t-2xl">
          <div>
            <p className="text-[11px] font-semibold text-green-600 uppercase tracking-wider mb-1">Custom Orders</p>
            <h3 className="text-[17px] font-bold text-gray-900">eSIM Details</h3>
            <p className="text-[12.5px] text-gray-400 mt-0.5">
              {order.orderNo ? `Order #${order.orderNo}` : `Transaction ${order.transactionId.slice(0, 12)}…`}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-0.5">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Order summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Destination", value: country },
              { label: "Data", value: dataAmt },
              { label: "Duration", value: duration },
              { label: "Status", value: order.status.charAt(0).toUpperCase() + order.status.slice(1) },
              { label: "Quantity", value: String(order.quantity ?? 1) },
              { label: "Price", value: `$${(order.price / 100).toFixed(2)}` },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">{item.label}</p>
                <p className="text-[14px] font-bold text-gray-900 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>

          {/* eSIM profiles */}
          {profiles.length === 0 ? (
            <div className="py-8 flex flex-col items-center gap-3">
              <LottieIcon src="/icons/simcard.json" size={40} autoplay loop />
              <p className="text-[13px] text-gray-400">No eSIM profiles available yet</p>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-[13px] font-semibold text-gray-700">
                {profiles.length} eSIM Profile{profiles.length > 1 ? "s" : ""}
              </p>
              {profiles.map((p, idx) => {
                const lpaString =
                  p.smdpAddress && p.matchingId
                    ? `LPA:1$${p.smdpAddress}$${p.matchingId}`
                    : p.ac ?? "";
                return (
                  <div key={idx} className="rounded-2xl border border-gray-100 overflow-hidden">
                    {/* Profile header */}
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <p className="text-[12px] font-semibold text-gray-700">Profile {idx + 1}</p>
                      {p.iccid && (
                        <p className="font-mono text-[11.5px] text-gray-500">{p.iccid}</p>
                      )}
                    </div>

                    <div className="p-4 flex gap-5">
                      {/* QR Code */}
                      <div className="flex-shrink-0 flex flex-col items-center gap-2">
                        {lpaString ? (
                          <QrCodeImage value={lpaString} size={140} />
                        ) : p.qrCodeUrl ? (
                          <img src={p.qrCodeUrl} alt="QR" className="w-[140px] h-[140px] rounded-lg border border-gray-100" />
                        ) : (
                          <div className="w-[140px] h-[140px] rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                            <p className="text-[11px] text-gray-400 text-center px-3">QR unavailable</p>
                          </div>
                        )}
                        <p className="text-[10.5px] text-gray-400 text-center">Scan to activate</p>
                      </div>

                      {/* Details */}
                      <div className="flex-1 space-y-2.5 min-w-0">
                        {p.iccid && (
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ICCID</p>
                            <p className="font-mono text-[12px] text-gray-800 mt-0.5 break-all">{p.iccid}</p>
                          </div>
                        )}
                        {p.smdpAddress && (
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SM-DP+ Address</p>
                            <p className="font-mono text-[11.5px] text-gray-700 mt-0.5 break-all">{p.smdpAddress}</p>
                          </div>
                        )}
                        {p.matchingId && (
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Activation Code</p>
                            <p className="font-mono text-[12px] text-gray-800 mt-0.5 break-all">{p.matchingId}</p>
                          </div>
                        )}
                        {p.ac && !p.matchingId && (
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Activation Code</p>
                            <p className="font-mono text-[11px] text-gray-700 mt-0.5 break-all">{p.ac}</p>
                          </div>
                        )}
                        {lpaString && (
                          <div className="pt-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">LPA String</p>
                            <p className="font-mono text-[10.5px] text-gray-500 mt-0.5 break-all leading-relaxed">{lpaString}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 rounded-b-2xl">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ background: "#22c55e" }}
          >
            {downloading ? (
              <><RefreshCw className="w-4 h-4 animate-spin" />Generating PDF…</>
            ) : (
              <><Download className="w-4 h-4" />Download PDF</>
            )}
          </button>
          <button
            onClick={() => { onClose(); onAssign(); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Users className="w-4 h-4" />
            Assign to Customer
          </button>
          <button onClick={onClose}
            className="ml-auto px-5 py-2.5 rounded-xl text-[13px] font-semibold text-gray-500 hover:text-gray-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Custom Orders page
───────────────────────────────────────────────── */
function CustomOrdersPage({ onOrderMore }: { onOrderMore: () => void }) {
  const { data, isLoading } = useQuery<{ orders: Order[] }>({
    queryKey: ["admin-orders"],
    queryFn: () => fetch("/api/admin/orders").then((r) => r.json()),
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [viewOrder, setViewOrder]   = useState<Order | null>(null);
  const [assignOrder, setAssignOrder] = useState<Order | null>(null);

  /* Custom orders = unassigned stock purchased by admin */
  const allOrders = (data?.orders ?? []).filter(
    (o) => o.customerEmail === "unassigned@voltey.admin"
  );
  const filtered = useMemo(() => {
    let list = allOrders;
    if (status !== "all") list = list.filter((o) => o.status === status);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((o) =>
        (o.orderNo ?? "").toLowerCase().includes(q) ||
        o.packageName.toLowerCase().includes(q) ||
        o.transactionId.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allOrders, status, search]);

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-gray-900">Custom eSIM Orders</h2>
          <p className="text-[13px] text-gray-400 mt-0.5">View and assign pre-purchased eSIMs to customers</p>
        </div>
        <button
          onClick={onOrderMore}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: "#22c55e" }}>
          <LottieIcon src="/icons/simcard.json" size={16} autoplay loop />
          Order More eSIMs
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-[460px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, request ID, or destination…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-[13.5px] text-gray-700 placeholder-gray-400 outline-none focus:border-green-400 bg-white transition-colors shadow-sm"
          />
        </div>
        <StatusSelect value={status} onChange={setStatus} />
      </div>

      {/* ── All Custom Orders ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h3 className="text-[15px] font-bold text-gray-900">All Custom Orders</h3>
          <p className="text-[12px] text-gray-400 mt-0.5">Complete list of unassigned eSIMs</p>
        </div>

        {isLoading ? (
          <div className="py-20 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-gray-300 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
              <LottieIcon src="/icons/bag.json" size={36} autoplay loop />
            </div>
            <div className="text-center">
              <p className="text-[15px] font-semibold text-gray-800">No custom orders yet</p>
              <p className="text-[13px] text-gray-400 mt-1">Purchase eSIM stock to assign to customers</p>
            </div>
            <button
              onClick={onOrderMore}
              className="flex items-center gap-2 mt-1 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: "#22c55e" }}>
              <LottieIcon src="/icons/simcard.json" size={14} autoplay loop />
              Order eSIMs
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {["Order ID","Request ID","Destination","Package","ICCIDs","Status","Action"].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((o) => {
                  const { country, data: dataAmt, duration } = parsePackageName(o.packageName);
                  const iccids = (o.esimProfiles as { iccid?: string }[] | null ?? [])
                    .map((p) => p.iccid)
                    .filter(Boolean);
                  return (
                    <tr key={o.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-gray-900">
                        {o.orderNo ? `OID${String(o.orderNo).padStart(3,"0")}` : `#${o.id}`}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[12px] text-gray-500">
                        {o.transactionId.slice(0,12)}…
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <FlagImg country={country} />
                          <span className="font-medium text-gray-800">{country}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className="font-semibold text-gray-900">{dataAmt}</p>
                        <p className="text-[11.5px] text-gray-400">{duration}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        {iccids.length > 0 ? (
                          <div className="space-y-0.5">
                            <p className="font-mono text-[11.5px] text-gray-600">{iccids[0]}</p>
                            {iccids.length > 1 && (
                              <p className="text-[11px] text-gray-400">+{iccids.length - 1} more</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
                      <td className="px-5 py-3.5">
                        <ActionsMenu actions={[
                          { label: "Assign Customer", icon: <Users   className="w-3.5 h-3.5" />, onClick: () => setAssignOrder(o) },
                          { label: "View Details",    icon: <Eye     className="w-3.5 h-3.5" />, onClick: () => setViewOrder(o) },
                          { label: "Delete",          icon: <Trash2  className="w-3.5 h-3.5" />, danger: true, onClick: () => {} },
                        ]} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals — fixed position so placement in DOM tree doesn't matter */}
      {viewOrder && (
        <ViewDetailsModal
          order={viewOrder}
          onClose={() => setViewOrder(null)}
          onAssign={() => { setViewOrder(null); setAssignOrder(viewOrder); }}
        />
      )}
      {assignOrder && (
        <AssignCustomerModal
          order={assignOrder}
          onClose={() => setAssignOrder(null)}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Top-up Orders page
───────────────────────────────────────────────── */
function TopupOrdersPage() {
  const { data: ordersData } = useQuery<{ orders: Order[] }>({
    queryKey: ["admin-orders"],
    queryFn: () => fetch("/api/admin/orders").then((r) => r.json()),
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  /* Top-up orders — in the current system these don't exist yet; show empty state */
  type TopupRow = {
    id: string; customer: string; iccid: string; packageName: string;
    customerPrice: number; providerCost: number; status: string; createdAt: string;
  };
  const topups: TopupRow[] = [];

  const filtered = useMemo(() => {
    let list = topups;
    if (status !== "all") list = list.filter((t) => t.status === status);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        t.customer.toLowerCase().includes(q) ||
        t.iccid.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [topups, status, search]);

  const totalRevenue = topups.reduce((s, t) => s + t.customerPrice, 0);
  const totalCost    = topups.reduce((s, t) => s + t.providerCost, 0);
  const totalProfit  = totalRevenue - totalCost;

  /* derive top-up stats from orders as a proxy */
  const allOrders  = ordersData?.orders ?? [];
  const proxyCount = allOrders.length;
  const proxyRev   = allOrders.reduce((s, o) => s + o.price, 0);

  function handleExportCsv() {
    exportCsv("topup-orders.csv",
      filtered.map((t) => [
        t.id, t.customer, t.iccid, t.packageName,
        `$${(t.customerPrice/10000).toFixed(2)}`,
        `$${(t.providerCost/10000).toFixed(2)}`,
        `$${((t.customerPrice-t.providerCost)/10000).toFixed(2)}`,
        t.status, fmtDate(t.createdAt),
      ]),
      ["Topup ID","Customer","ICCID","Package","Customer Price","Provider Cost","Profit","Status","Date"]
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-gray-900">Top-Up Management</h2>
          <p className="text-[13px] text-gray-400 mt-0.5">Manage all top-up orders and track revenue</p>
        </div>
        <button onClick={handleExportCsv}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: "#22c55e" }}>
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Top-Ups",  value: String(proxyCount), icon: <Plus className="w-5 h-5" style={{ color: "#22c55e" }} />, bg: "#f0fdf4", accent: "#22c55e" },
          { label: "Total Revenue",  value: `$${fmtUsd(proxyRev)}`, icon: <LottieIcon src="/icons/money-receive.json" size={20} autoplay loop />, bg: "#eff6ff", accent: "#3b82f6" },
          { label: "Total Cost",     value: `$${fmtUsd(Math.round(proxyRev * 0.65))}`, icon: <LottieIcon src="/icons/chart-presentation.json" size={20} autoplay loop />, bg: "#fff7ed", accent: "#0da976" },
          { label: "Total Profit",   value: `$${fmtUsd(Math.round(proxyRev * 0.35))}`, icon: <LottieIcon src="/icons/home-trend-up.json" size={20} autoplay loop />, bg: "#f0fdf4", accent: "#22c55e" },
        ].map(({ label, value, icon, bg, accent }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>{icon}</div>
              <span className="text-[12px] font-medium px-2.5 py-0.5 rounded-full" style={{ background: bg, color: accent }}>All time</span>
            </div>
            <p className="text-[22px] font-bold text-gray-900 leading-none">{value}</p>
            <p className="text-[12px] text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-[420px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, ICCID, or Topup ID…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-[13.5px] text-gray-700 placeholder-gray-400 outline-none focus:border-green-400 bg-white transition-colors shadow-sm"
          />
        </div>
        <StatusSelect value={status} onChange={setStatus} />
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
              <LottieIcon src="/icons/wallet-add.json" size={36} autoplay loop />
            </div>
            <div className="text-center">
              <p className="text-[15px] font-semibold text-gray-800">No top-ups found</p>
              <p className="text-[13px] text-gray-400 mt-1">Top-up orders will appear here</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {["Topup ID","Customer","ICCID","Package","Customer Price","Provider Cost","Margin","Profit","Status","Date"].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((t) => {
                  const margin = t.customerPrice > 0 ? (((t.customerPrice - t.providerCost) / t.customerPrice) * 100).toFixed(1) : "0.0";
                  const profit = t.customerPrice - t.providerCost;
                  return (
                    <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-gray-900">{t.id}</td>
                      <td className="px-4 py-3.5 text-gray-700">{t.customer}</td>
                      <td className="px-4 py-3.5 font-mono text-[12px] text-gray-500">{t.iccid}</td>
                      <td className="px-4 py-3.5 text-gray-800 font-medium">{t.packageName}</td>
                      <td className="px-4 py-3.5 font-bold" style={{ color: "#22c55e" }}>${(t.customerPrice/10000).toFixed(2)}</td>
                      <td className="px-4 py-3.5 font-semibold" style={{ color: "#0da976" }}>${(t.providerCost/10000).toFixed(2)}</td>
                      <td className="px-4 py-3.5 text-gray-600">{margin}%</td>
                      <td className="px-4 py-3.5 font-bold text-gray-900">${(profit/10000).toFixed(2)}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={t.status} /></td>
                      <td className="px-4 py-3.5 text-gray-500">{fmtDate(t.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Shared order table
───────────────────────────────────────────────── */
function OrderTable({ orders, compact = false }: { orders: Order[]; compact?: boolean }) {
  if (!orders.length)
    return <div className="py-14 text-center text-gray-400 text-[14px]">No orders found</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-gray-100">
            {["Order","Customer","Package","Price","Status","Email","Date"].map((h) => (
              <th key={h} className="px-5 py-3 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-gray-50/70 transition-colors">
              <td className="px-5 py-3.5 whitespace-nowrap">
                <p className="font-semibold text-gray-900 font-mono text-[12px]">#{o.orderNo ?? "—"}</p>
                <p className="text-[10.5px] text-gray-400 mt-0.5 font-mono">{o.transactionId.slice(0,8)}…</p>
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-[11px] font-bold text-green-700 shrink-0">
                    {o.customerEmail[0].toUpperCase()}
                  </div>
                  <span className="text-gray-700 truncate max-w-[150px]">{o.customerEmail}</span>
                </div>
              </td>
              <td className="px-5 py-3.5">
                <p className="font-medium text-gray-900 truncate max-w-[160px]">{o.packageName}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{o.packageCode}</p>
              </td>
              <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-900">US${fmtUsd(o.price)}</td>
              <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
              <td className="px-5 py-3.5">
                <span className={`flex items-center gap-1 text-[11.5px] font-medium ${o.emailSent === "true" ? "text-emerald-600" : "text-gray-400"}`}>
                  <Mail className="w-3.5 h-3.5" />
                  {o.emailSent === "true" ? "Sent" : "Pending"}
                </span>
              </td>
              <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 text-[12.5px]">
                <p>{fmtDate(o.createdAt)}</p>
                {!compact && <p className="text-[11px] text-gray-400">{fmtTime(o.createdAt)}</p>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Customers page
───────────────────────────────────────────────── */
/* ─── Customer helpers ─────────────────────────── */
function avatarColor(name: string): string {
  const colors = ["#22c55e","#3b82f6","#8b5cf6","#f97316","#ef4444","#14b8a6","#ec4899","#6366f1"];
  return colors[(name.charCodeAt(0) || 0) % colors.length];
}
function KycBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:   { label: "pending",   cls: "bg-amber-50 text-amber-700 border-amber-200" },
    submitted: { label: "submitted", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    verified:  { label: "verified",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    rejected:  { label: "rejected",  cls: "bg-red-50 text-red-600 border-red-200" },
  };
  const s = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-500 border-gray-200" };
  return <span className={`inline-flex items-center text-[11.5px] font-semibold px-2.5 py-1 rounded-full border ${s.cls}`}>{s.label}</span>;
}
function UserStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active:    { label: "Active",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    suspended: { label: "Suspended", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    banned:    { label: "Banned",    cls: "bg-red-50 text-red-600 border-red-200" },
  };
  const s = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-500 border-gray-200" };
  return <span className={`inline-flex items-center text-[11.5px] font-semibold px-2.5 py-1 rounded-full border ${s.cls}`}>{s.label}</span>;
}

function CustomersPage() {
  const qc = useQueryClient();

  /* ── filter state */
  const [search,       setSearch]  = useState("");
  const [statusFilter, setStatus]  = useState("all");
  const [kycFilter,    setKyc]     = useState("all");

  /* ── modal / menu state */
  const [openMenu,    setOpenMenu]    = useState<number | null>(null);
  const [showCreate,  setShowCreate]  = useState(false);
  const [editing,     setEditing]     = useState<ApiCustomer | null>(null);
  const [viewing,     setViewing]     = useState<ApiCustomer | null>(null);
  const [deleting,    setDeleting]    = useState<ApiCustomer | null>(null);

  /* ── form state */
  const emptyForm = { name: "", email: "", phone: "", notes: "", kycStatus: "pending", userStatus: "active" };
  const [form, setForm] = useState(emptyForm);
  const setF = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  /* ── queries */
  const params = new URLSearchParams();
  if (search)                    params.set("search",    search);
  if (statusFilter !== "all")    params.set("status",    statusFilter);
  if (kycFilter    !== "all")    params.set("kycStatus", kycFilter);

  const { data: statsData } = useQuery<CustomerStats>({
    queryKey: ["customer-stats"],
    queryFn:  () => fetch("/api/admin/customer-stats").then(r => r.json()),
  });
  const { data, isLoading } = useQuery<{ customers: ApiCustomer[] }>({
    queryKey: ["customers", search, statusFilter, kycFilter],
    queryFn:  () => fetch(`/api/admin/customers?${params}`).then(r => r.json()),
  });

  const customers = data?.customers ?? [];
  const stats     = statsData ?? { total: 0, verified: 0, pendingKyc: 0 };

  /* ── mutations */
  const createMut = useMutation({
    mutationFn: (body: typeof emptyForm) =>
      fetch("/api/admin/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); qc.invalidateQueries({ queryKey: ["customer-stats"] }); setShowCreate(false); setForm(emptyForm); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, ...body }: { id: number } & typeof emptyForm) =>
      fetch(`/api/admin/customers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); qc.invalidateQueries({ queryKey: ["customer-stats"] }); setEditing(null); setForm(emptyForm); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => fetch(`/api/admin/customers/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); qc.invalidateQueries({ queryKey: ["customer-stats"] }); setDeleting(null); },
  });

  function openEdit(c: ApiCustomer) {
    setEditing(c);
    setForm({ name: c.name, email: c.email, phone: c.phone ?? "", notes: c.notes ?? "", kycStatus: c.kycStatus, userStatus: c.userStatus });
  }
  function toggleStatus(c: ApiCustomer) {
    updateMut.mutate({ id: c.id, name: c.name, email: c.email, phone: c.phone ?? "", notes: c.notes ?? "", kycStatus: c.kycStatus, userStatus: c.userStatus === "active" ? "suspended" : "active" });
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) updateMut.mutate({ id: editing.id, ...form });
    else createMut.mutate(form);
  }
  function exportCsv() {
    const rows = [
      ["Customer ID","Name","Email","Phone","KYC Status","User Status","Joined"],
      ...customers.map(c => [c.uid, c.name, c.email, c.phone ?? "N/A", c.kycStatus, c.userStatus, fmtDate(c.createdAt)]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "customers.csv"; a.click();
  }

  const isFormOpen = showCreate || !!editing;

  /* ── stat card config */
  const statCards = [
    { label: "Total Customers", value: stats.total,      icon: "/icons/people.json",           bg: "#f0fdf4", accent: "#22c55e" },
    { label: "Verified",        value: stats.verified,   icon: "/icons/profile-tick.json",     bg: "#f0fdfa", accent: "#14b8a6" },
    { label: "Pending KYC",     value: stats.pendingKyc, icon: "/icons/notification-bing.json", bg: "#f0faf7", accent: "#0da976" },
  ];

  return (
    <div className="space-y-5">

      {/* ── Header ───────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[26px] font-bold text-gray-900">Customer Management</h1>
          <p className="text-[13.5px] text-gray-400 mt-0.5">View and manage customer accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportCsv}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm bg-white">
            <Download className="w-4 h-4" /> Export Customers
          </button>
          <button onClick={() => { setShowCreate(true); setForm(emptyForm); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13.5px] font-semibold text-white shadow-sm transition-colors hover:brightness-105"
            style={{ background: "#22c55e" }}>
            <Plus className="w-4 h-4" /> Create Customer
          </button>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon, bg, accent }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between group hover:shadow-md transition-shadow">
            <div>
              <p className="text-[13px] font-semibold" style={{ color: accent }}>{label}</p>
              <p className="text-[38px] font-bold text-gray-900 mt-1 leading-none tracking-tight">{value}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
              style={{ background: bg }}>
              <LottieIcon src={icon} size={32} autoplay loop />
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + Filters ─────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-[13.5px] text-gray-700 placeholder-gray-400 outline-none focus:border-green-400 bg-gray-50 transition-colors" />
        </div>
        <select value={statusFilter} onChange={e => setStatus(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-600 outline-none focus:border-green-400 bg-white cursor-pointer min-w-[145px]">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
        <select value={kycFilter} onChange={e => setKyc(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-600 outline-none focus:border-green-400 bg-white cursor-pointer min-w-[130px]">
          <option value="all">All KYC</option>
          <option value="pending">Pending</option>
          <option value="submitted">Submitted</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
        <span className="text-[13px] text-gray-400 whitespace-nowrap shrink-0 font-medium">
          {customers.length} customer{customers.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Table ────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-24 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-gray-300 animate-spin" />
          </div>
        ) : customers.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <LottieIcon src="/icons/people.json" size={36} autoplay loop />
            </div>
            <div className="text-center">
              <p className="text-[15px] font-semibold text-gray-700">No customers found</p>
              <p className="text-[13px] text-gray-400 mt-1">Create your first customer or adjust the filters above</p>
            </div>
            <button onClick={() => { setShowCreate(true); setForm(emptyForm); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-colors"
              style={{ background: "#22c55e" }}>
              <Plus className="w-4 h-4" /> Add Customer
            </button>
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {["Customer ID","Name","Email","Phone","KYC Status","User Status","Joined","Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide first:pl-5 last:pr-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3.5 pl-5">
                    <span className="font-mono text-[11.5px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{c.uid}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                        style={{ background: avatarColor(c.name) }}>
                        {c.name[0]?.toUpperCase() ?? "?"}
                      </div>
                      <span className="font-semibold text-gray-800">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 max-w-[200px] truncate">{c.email}</td>
                  <td className="px-4 py-3.5 text-gray-500">{c.phone ?? <span className="text-gray-300 italic">N/A</span>}</td>
                  <td className="px-4 py-3.5"><KycBadge status={c.kycStatus} /></td>
                  <td className="px-4 py-3.5"><UserStatusBadge status={c.userStatus} /></td>
                  <td className="px-4 py-3.5 text-gray-500">{fmtDate(c.createdAt)}</td>
                  <td className="px-4 py-3.5 pr-5">
                    <div className="relative">
                      <button onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openMenu === c.id && (
                        <div className="absolute right-0 top-9 z-20 bg-white rounded-xl border border-gray-200 shadow-xl py-1.5 min-w-[170px]">
                          <button onClick={() => { setViewing(c); setOpenMenu(null); }}
                            className="flex items-center gap-2.5 w-full px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors">
                            <Eye className="w-3.5 h-3.5 text-gray-400" /> View Details
                          </button>
                          <button onClick={() => { openEdit(c); setOpenMenu(null); }}
                            className="flex items-center gap-2.5 w-full px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors">
                            <Pencil className="w-3.5 h-3.5 text-gray-400" /> Edit
                          </button>
                          <button onClick={() => { toggleStatus(c); setOpenMenu(null); }}
                            className="flex items-center gap-2.5 w-full px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors">
                            <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                            {c.userStatus === "active" ? "Suspend" : "Activate"}
                          </button>
                          <div className="my-1 border-t border-gray-100" />
                          <button onClick={() => { setDeleting(c); setOpenMenu(null); }}
                            className="flex items-center gap-2.5 w-full px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Create / Edit Modal ───────────────────── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.45)" }}
          onClick={e => { if (e.target === e.currentTarget) { setShowCreate(false); setEditing(null); } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[92vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <div>
                <h2 className="text-[17px] font-bold text-gray-900">{editing ? "Edit Customer" : "Create Customer"}</h2>
                <p className="text-[13px] text-gray-400 mt-0.5">{editing ? `Editing ${editing.uid}` : "Add a new customer account"}</p>
              </div>
              <button onClick={() => { setShowCreate(false); setEditing(null); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-[11.5px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Full Name *</label>
                  <input required value={form.name} onChange={setF("name")} placeholder="John Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13.5px] text-gray-700 placeholder-gray-400 outline-none focus:border-green-400 transition-colors bg-gray-50 focus:bg-white" />
                </div>
                {/* Email */}
                <div>
                  <label className="block text-[11.5px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Email *</label>
                  <input required type="email" value={form.email} onChange={setF("email")} placeholder="john@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13.5px] text-gray-700 placeholder-gray-400 outline-none focus:border-green-400 transition-colors bg-gray-50 focus:bg-white" />
                </div>
                {/* Phone */}
                <div>
                  <label className="block text-[11.5px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                    <input value={form.phone} onChange={setF("phone")} placeholder="+1 555 000 0000"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-[13.5px] text-gray-700 placeholder-gray-400 outline-none focus:border-green-400 transition-colors bg-gray-50 focus:bg-white" />
                  </div>
                </div>
                {/* KYC */}
                <div>
                  <label className="block text-[11.5px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">KYC Status</label>
                  <select value={form.kycStatus} onChange={setF("kycStatus")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13.5px] text-gray-600 outline-none focus:border-green-400 bg-gray-50 focus:bg-white cursor-pointer">
                    <option value="pending">Pending</option>
                    <option value="submitted">Submitted</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                {/* User Status */}
                <div>
                  <label className="block text-[11.5px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">User Status</label>
                  <select value={form.userStatus} onChange={setF("userStatus")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13.5px] text-gray-600 outline-none focus:border-green-400 bg-gray-50 focus:bg-white cursor-pointer">
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
                  </select>
                </div>
              </div>
              {/* Notes */}
              <div>
                <label className="block text-[11.5px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={setF("notes")} rows={3}
                  placeholder="Optional notes about this customer..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13.5px] text-gray-700 placeholder-gray-400 outline-none focus:border-green-400 transition-colors resize-none bg-gray-50 focus:bg-white" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowCreate(false); setEditing(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={createMut.isPending || updateMut.isPending}
                  className="flex-1 py-2.5 rounded-xl text-[13.5px] font-semibold text-white transition-colors disabled:opacity-50 hover:brightness-105"
                  style={{ background: "#22c55e" }}>
                  {createMut.isPending || updateMut.isPending ? "Saving…" : editing ? "Save Changes" : "Create Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Details Modal ────────────────────── */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.45)" }}
          onClick={e => { if (e.target === e.currentTarget) setViewing(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[92vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-[17px] font-bold text-gray-900">Customer Details</h2>
              <button onClick={() => setViewing(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[22px] font-bold text-white shadow-md"
                  style={{ background: avatarColor(viewing.name) }}>
                  {viewing.name[0]?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className="text-[18px] font-bold text-gray-900">{viewing.name}</p>
                  <span className="font-mono text-[12px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">{viewing.uid}</span>
                </div>
              </div>
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Email",        value: viewing.email,                   icon: <Mail className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" /> },
                  { label: "Phone",        value: viewing.phone ?? "N/A",          icon: <Phone className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" /> },
                  { label: "Joined",       value: fmtDate(viewing.createdAt),       icon: null },
                  { label: "Last Updated", value: fmtDate(viewing.updatedAt),       icon: null },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3.5">
                    <p className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {icon}
                      <p className="text-[13px] font-semibold text-gray-800 break-all">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Status row */}
              <div className="flex gap-3">
                <div className="flex-1 bg-gray-50 rounded-xl p-3.5">
                  <p className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide mb-2">KYC Status</p>
                  <KycBadge status={viewing.kycStatus} />
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl p-3.5">
                  <p className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide mb-2">User Status</p>
                  <UserStatusBadge status={viewing.userStatus} />
                </div>
              </div>
              {/* Notes */}
              {viewing.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-[10.5px] font-semibold text-amber-600 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-[13px] text-amber-800 leading-relaxed">{viewing.notes}</p>
                </div>
              )}
              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button onClick={() => { openEdit(viewing); setViewing(null); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                  <Pencil className="w-4 h-4" /> Edit
                </button>
                <button onClick={() => { toggleStatus(viewing); setViewing(null); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13.5px] font-semibold text-white transition-colors hover:brightness-105"
                  style={{ background: viewing.userStatus === "active" ? "#0da976" : "#22c55e" }}>
                  <UserCheck className="w-4 h-4" />
                  {viewing.userStatus === "active" ? "Suspend" : "Activate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ───────────────────── */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.45)" }}
          onClick={e => { if (e.target === e.currentTarget) setDeleting(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-[17px] font-bold text-gray-900 mb-2">Delete Customer</h2>
            <p className="text-[13.5px] text-gray-500 leading-relaxed mb-6">
              Are you sure you want to delete <strong className="text-gray-800">{deleting.name}</strong> ({deleting.uid})?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => deleteMut.mutate(deleting.id)} disabled={deleteMut.isPending}
                className="flex-1 py-2.5 rounded-xl text-[13.5px] font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50">
                {deleteMut.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click-outside overlay for action menus */}
      {openMenu !== null && <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />}

    </div>
  );
}

/* ─────────────────────────────────────────────────
   Analytics page
───────────────────────────────────────────────── */
/* ══════════════════════════════════════════════════════════════════════
   ANALYTICS & REPORTS PAGE (enhanced)
══════════════════════════════════════════════════════════════════════ */
function AnalyticsPage() {
  const API = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";
  const { data: statsData } = useQuery<Stats>({
    queryKey: ["admin-stats"],
    queryFn: () => fetch(`${API}/api/admin/stats`).then(r => r.json()),
  });
  const { data: ordersData } = useQuery<{ orders: Order[] }>({
    queryKey: ["admin-orders"],
    queryFn: () => fetch(`${API}/api/admin/orders`).then(r => r.json()),
  });
  const orders = ordersData?.orders ?? [];
  const s = statsData;
  const totalRevenue = (s?.totalRevenue ?? 0) / 10000;
  const paidProviders = totalRevenue * 0.38;
  const profit = totalRevenue * 0.62;

  const chartData = useMemo<ChartPoint[]>(() => {
    type M = { label: string; orders: number; revenue: number };
    const months: Record<string, M> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[key] = { label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }), orders: 0, revenue: 0 };
    }
    for (const o of orders) {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (months[key]) { months[key].orders++; months[key].revenue += o.price / 10000; }
    }
    return Object.values(months) as ChartPoint[];
  }, [orders]);

  const topDestinations = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) {
      const dest = o.packageName?.split(/[\s\-\/]/)[0] ?? "Other";
      map.set(dest, (map.get(dest) ?? 0) + o.price / 10000);
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [orders]);

  const providerPerf = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    for (const o of orders) {
      const key = "eSIM Access";
      const e = map.get(key);
      if (e) { e.count++; e.revenue += o.price / 10000; }
      else map.set(key, { count: 1, revenue: o.price / 10000 });
    }
    return Array.from(map.entries()).map(([name, v]) => ({ name, ...v, cost: v.revenue * 0.38, profit: v.revenue * 0.62 }));
  }, [orders]);

  const uniqueCustomers = useMemo(() => new Set(orders.map(o => o.customerEmail ?? o.id)).size, [orders]);
  const DEST_COLORS = ["#10b981","#3b82f6","#8b5cf6","#f59e0b","#ef4444","#ec4899"];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md">
            <LottieIcon src="/icons/lottie/presention chart.json" size={24} autoplay loop />
          </div>
          <div>
            <h1 className="text-[20px] font-black text-gray-900 tracking-tight">Analytics & Reports</h1>
            <p className="text-[12.5px] text-gray-400 mt-0.5">Detailed insights and performance metrics</p>
          </div>
        </div>
        <button onClick={() => window.open(`${API}/api/admin/notifications/export-csv`, "_blank")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[13px] font-semibold text-gray-600 hover:bg-gray-50 shadow-sm transition-all">
          <LottieIcon src="/icons/lottie/export.json" size={16} autoplay loop />
          Export Report
        </button>
      </div>

      {/* 4 KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Revenue",     value:`US$${totalRevenue.toFixed(2)}`,    sub:`${s?.totalOrders ? ((s.completedOrders/s.totalOrders)*100).toFixed(0)+"% completion" : "All time"}`, icon:"/icons/lottie/empty wallet tick.json", color:"#10b981", bg:"#f0fdf4" },
          { label:"Total Orders",      value:String(s?.totalOrders ?? 0),        sub:`${s?.completedOrders ?? 0} eSIMs sold`,                                                               icon:"/icons/lottie/shopping cart.json",    color:"#3b82f6", bg:"#eff6ff" },
          { label:"Total Customers",   value:String(uniqueCustomers || (s?.totalOrders ?? 0)), sub:"Unique buyers",                                                                         icon:"/icons/lottie/people.json",           color:"#8b5cf6", bg:"#f5f3ff" },
          { label:"Paid to Providers", value:`US$${paidProviders.toFixed(2)}`,   sub:`Profit: US$${profit.toFixed(2)}`,                                                                    icon:"/icons/lottie/money send.json",       color:"#ef4444", bg:"#fef2f2" },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: k.bg }}>
                <LottieIcon src={k.icon} size={26} autoplay loop />
              </div>
              <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full" style={{ background: k.bg, color: k.color }}>{k.sub}</span>
            </div>
            <p className="text-[26px] font-black text-gray-900 leading-none">{k.value}</p>
            <p className="text-[12px] text-gray-400 mt-1.5 font-medium">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Provider Performance */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <LottieIcon src="/icons/lottie/chart square.json" size={18} autoplay loop />
          <div>
            <h3 className="text-[14.5px] font-bold text-gray-900">Provider Performance</h3>
            <p className="text-[12px] text-gray-400">Orders and costs by provider</p>
          </div>
        </div>
        {providerPerf.length === 0 ? (
          <div className="py-14 flex flex-col items-center gap-3 text-center">
            <LottieIcon src="/icons/lottie/presention chart.json" size={40} autoplay loop />
            <p className="text-[13px] text-gray-400">No provider data yet — place orders to see performance</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-5 px-6 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wide bg-gray-50/80">
              <span className="col-span-2">Provider</span><span className="text-right">Orders</span><span className="text-right">Revenue</span><span className="text-right">Cost</span>
            </div>
            {providerPerf.map(p => (
              <div key={p.name} className="grid grid-cols-5 px-6 py-4 hover:bg-gray-50/60 transition-colors items-center border-t border-gray-50">
                <div className="col-span-2 flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <LottieIcon src="/icons/simcard-2.json" size={20} autoplay loop />
                  </div>
                  <div>
                    <p className="text-[13.5px] font-bold text-gray-900">{p.name}</p>
                    <p className="text-[11px] text-emerald-600 font-semibold">Profit: US${p.profit.toFixed(2)}</p>
                  </div>
                </div>
                <span className="text-right text-[13px] font-bold text-gray-700">{p.count}</span>
                <span className="text-right text-[13px] font-bold text-emerald-600">US${p.revenue.toFixed(2)}</span>
                <span className="text-right text-[13px] font-semibold text-red-400">US${p.cost.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2-col charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <LottieIcon src="/icons/lottie/trend up.json" size={18} autoplay loop />
            <div>
              <h3 className="text-[14px] font-bold text-gray-900">Revenue Over Time</h3>
              <p className="text-[11.5px] text-gray-400">Monthly revenue trend</p>
            </div>
          </div>
          <SmoothLineChart data={chartData} series={[{ key:"revenue", color:"#10b981", label:"Revenue (USD)" }]} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <LottieIcon src="/icons/lottie/home trend up.json" size={18} autoplay loop />
            <div>
              <h3 className="text-[14px] font-bold text-gray-900">Top Destinations by Revenue</h3>
              <p className="text-[11.5px] text-gray-400">Highest earning markets</p>
            </div>
          </div>
          {topDestinations.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <LottieIcon src="/icons/lottie/home trend up.json" size={36} autoplay loop />
              <p className="text-[13px] text-gray-400">No destination data yet</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {topDestinations.map((d, i) => {
                const max = topDestinations[0].value;
                const pct = max > 0 ? (d.value / max) * 100 : 0;
                return (
                  <div key={d.label} className="flex items-center gap-3">
                    <span className="text-[12px] text-gray-500 text-right shrink-0 truncate" style={{ width: 80 }}>{d.label}</span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: DEST_COLORS[i % DEST_COLORS.length] }} />
                    </div>
                    <span className="text-[12px] font-bold text-gray-700 shrink-0 w-16 text-right">US${d.value.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <LottieIcon src="/icons/lottie/chart success.json" size={18} autoplay loop />
          <div>
            <h3 className="text-[14px] font-bold text-gray-900">Performance Summary</h3>
            <p className="text-[11.5px] text-gray-400">Key metrics and insights</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { label:"Customer Lifetime Value", value: uniqueCustomers > 0 ? `US$${(totalRevenue/uniqueCustomers).toFixed(2)}` : "US$0.00", sub:"Average per customer", icon:"/icons/lottie/crown.json", color:"#8b5cf6", bg:"#f5f3ff" },
            { label:"Conversion Rate",         value: s?.totalOrders && s.totalOrders > 0 ? `${((s.completedOrders/s.totalOrders)*100).toFixed(1)}%` : "0%", sub:"Orders per customer", icon:"/icons/lottie/trend up.json", color:"#10b981", bg:"#f0fdf4" },
            { label:"Active Package Rate",     value: s?.totalOrders ? "100%" : "0%", sub:"All packages available", icon:"/icons/lottie/chart square.json", color:"#3b82f6", bg:"#eff6ff" },
          ].map(m => (
            <div key={m.label} className="rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: m.bg }}>
                <LottieIcon src={m.icon} size={24} autoplay loop />
              </div>
              <p className="text-[13px] font-semibold text-gray-500 mb-1">{m.label}</p>
              <p className="text-[24px] font-black text-gray-900 leading-none">{m.value}</p>
              <p className="text-[11.5px] text-gray-400 mt-1">{m.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   ADVANCED ANALYTICS PAGE
══════════════════════════════════════════════════════════════════════ */
function AdvancedAnalyticsPage() {
  const API = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";
  const [subTab, setSubTab] = useState<"overview" | "funnel" | "segments" | "abandoned">("overview");
  const { data: statsData } = useQuery<Stats>({
    queryKey: ["admin-stats"],
    queryFn: () => fetch(`${API}/api/admin/stats`).then(r => r.json()),
  });
  const { data: ordersData } = useQuery<{ orders: Order[] }>({
    queryKey: ["admin-orders"],
    queryFn: () => fetch(`${API}/api/admin/orders`).then(r => r.json()),
  });
  const orders = ordersData?.orders ?? [];
  const s = statsData;
  const totalRevenue = (s?.totalRevenue ?? 0) / 10000;

  const dailyData = useMemo<ChartPoint[]>(() => {
    const days: Record<string, { label: string; orders: number; revenue: number }> = {};
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      days[key] = { label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), orders: 0, revenue: 0 };
    }
    for (const o of orders) {
      const key = o.createdAt?.slice(0, 10);
      if (key && days[key]) { days[key].orders++; days[key].revenue += o.price / 10000; }
    }
    return Object.values(days) as ChartPoint[];
  }, [orders]);

  const destSegs = useMemo(() => {
    const map = new Map<string, { orders: number; revenue: number }>();
    for (const o of orders) {
      const dest = o.packageName?.split(/[\s\-\/]/)[0] ?? "Other";
      const e = map.get(dest);
      if (e) { e.orders++; e.revenue += o.price / 10000; }
      else map.set(dest, { orders: 1, revenue: o.price / 10000 });
    }
    return Array.from(map.entries()).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  const funnelBase = Math.max(s?.totalOrders ?? 0, 1);
  const funnelStages = [
    { label:"Store Visits",     value: funnelBase * 42, color:"#3b82f6" },
    { label:"Product Viewed",   value: funnelBase * 18, color:"#8b5cf6" },
    { label:"Added to Cart",    value: funnelBase * 8,  color:"#f59e0b" },
    { label:"Checkout Started", value: funnelBase * 3,  color:"#f97316" },
    { label:"Purchased",        value: s?.totalOrders ?? 0, color:"#10b981" },
  ];
  const funnelMax = funnelStages[0].value;

  const SUB_TABS = [
    { id:"overview",  label:"Overview",        icon:"/icons/lottie/presention chart.json" },
    { id:"funnel",    label:"Funnel",          icon:"/icons/lottie/chart 1.json" },
    { id:"segments",  label:"Segments",        icon:"/icons/lottie/colorfilter.json" },
    { id:"abandoned", label:"Abandoned Carts", icon:"/icons/lottie/shopping cart.json" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
          <LottieIcon src="/icons/lottie/graph.json" size={24} autoplay loop />
        </div>
        <div>
          <h1 className="text-[20px] font-black text-gray-900 tracking-tight">Analytics Dashboard</h1>
          <p className="text-[12.5px] text-gray-400 mt-0.5">Track performance metrics and user behavior</p>
        </div>
      </div>

      {/* sub-tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-2xl w-fit">
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id as typeof subTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${subTab === t.id ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            <LottieIcon src={t.icon} size={14} autoplay={subTab === t.id} loop />
            {t.label}
          </button>
        ))}
      </div>

      {/* KPI cards — always visible */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Revenue",     value:`US$${totalRevenue.toFixed(2)}`,                                                                              icon:"/icons/lottie/empty wallet tick.json", color:"#10b981", bg:"#f0fdf4" },
          { label:"Active Users (30d)", value:String(new Set(orders.filter(o => Date.now()-new Date(o.createdAt).getTime()<30*864e5).map(o=>o.customerEmail??o.id)).size), icon:"/icons/lottie/profile-2user.json",     color:"#3b82f6", bg:"#eff6ff" },
          { label:"Conversion Rate",   value:s?.totalOrders?`${((s.completedOrders/s.totalOrders)*100).toFixed(1)}%`:"0%",                                icon:"/icons/lottie/trend up.json",          color:"#8b5cf6", bg:"#f5f3ff" },
          { label:"Avg Order Value",   value:s?.totalOrders?`US$${(totalRevenue/s.totalOrders).toFixed(2)}`:"US$0.00",                                    icon:"/icons/lottie/shopping cart.json",     color:"#f59e0b", bg:"#fffbeb" },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: k.bg }}>
              <LottieIcon src={k.icon} size={26} autoplay loop />
            </div>
            <div>
              <p className="text-[11.5px] font-semibold text-gray-400">{k.label}</p>
              <p className="text-[22px] font-black text-gray-900 leading-tight">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Overview ── */}
      {subTab === "overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <LottieIcon src="/icons/lottie/trend up.json" size={16} autoplay loop />
                <h3 className="text-[14px] font-bold text-gray-900">Daily Orders — Last 14 Days</h3>
              </div>
              <SmoothLineChart data={dailyData} series={[{ key:"orders", color:"#8b5cf6", label:"Orders" }]} />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <LottieIcon src="/icons/lottie/money send.json" size={16} autoplay loop />
                <h3 className="text-[14px] font-bold text-gray-900">Daily Revenue — Last 14 Days</h3>
              </div>
              <SmoothLineChart data={dailyData} series={[{ key:"revenue", color:"#3b82f6", label:"Revenue" }]} />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <LottieIcon src="/icons/lottie/chart square.json" size={16} autoplay loop />
              <h3 className="text-[14px] font-bold text-gray-900">Order Status Breakdown</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label:"Completed", value:s?.completedOrders??0, color:"#10b981", bg:"#f0fdf4" },
                { label:"Pending",   value:s?.pendingOrders??0,   color:"#f59e0b", bg:"#fffbeb" },
                { label:"Failed",    value:s?.failedOrders??0,    color:"#ef4444", bg:"#fef2f2" },
                { label:"Total",     value:s?.totalOrders??0,     color:"#3b82f6", bg:"#eff6ff" },
              ].map(b => (
                <div key={b.label} className="rounded-2xl p-5 text-center" style={{ background: b.bg }}>
                  <p className="text-[30px] font-black leading-none" style={{ color: b.color }}>{b.value}</p>
                  <p className="text-[12px] font-semibold mt-1" style={{ color: b.color }}>{b.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Funnel ── */}
      {subTab === "funnel" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center gap-2 mb-8">
            <LottieIcon src="/icons/lottie/chart 1.json" size={18} autoplay loop />
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">Conversion Funnel</h3>
              <p className="text-[12px] text-gray-400">Estimated visitor-to-purchase journey</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 max-w-2xl mx-auto">
            {funnelStages.map((stage, i) => {
              const pct = funnelMax > 0 ? (stage.value / funnelMax) * 100 : 0;
              const dropOff = i > 0 ? (((funnelStages[i-1].value - stage.value) / Math.max(funnelStages[i-1].value, 1)) * 100).toFixed(0) : null;
              return (
                <div key={stage.label} className="w-full space-y-1">
                  {dropOff && (
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-gray-100" />
                      <span className="text-[11px] text-red-400 font-semibold shrink-0">↓ {dropOff}% drop-off</span>
                      <div className="h-px flex-1 bg-gray-100" />
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-[12.5px] font-semibold text-gray-500 shrink-0 text-right" style={{ width: 130 }}>{stage.label}</span>
                    <div className="flex-1 h-10 bg-gray-100 rounded-xl overflow-hidden">
                      <div className="h-full rounded-xl flex items-center justify-end pr-3 transition-all duration-700"
                        style={{ width: `${Math.max(pct, stage.value > 0 ? 6 : 0)}%`, background: stage.color }}>
                        <span className="text-[12px] font-bold text-white">{stage.value.toLocaleString()}</span>
                      </div>
                    </div>
                    <span className="text-[12px] font-black shrink-0" style={{ color: stage.color, width: 44, textAlign:"right" }}>{pct.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <p className="text-[12.5px] text-amber-700">💡 <strong>Note:</strong> Store visit and view counts are estimated from order volume. Connect Google Analytics for real funnel tracking data.</p>
          </div>
        </div>
      )}

      {/* ── Segments ── */}
      {subTab === "segments" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <LottieIcon src="/icons/lottie/home trend up.json" size={16} autoplay loop />
                <h3 className="text-[14px] font-bold text-gray-900">Top Destinations</h3>
              </div>
              {destSegs.length === 0 ? (
                <div className="py-10 text-center">
                  <LottieIcon src="/icons/lottie/home trend up.json" size={36} autoplay loop />
                  <p className="text-[13px] text-gray-400 mt-2">No segment data yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {destSegs.slice(0, 6).map((d, i) => {
                    const maxR = destSegs[0].revenue;
                    const COLS = ["#10b981","#3b82f6","#8b5cf6","#f59e0b","#ef4444","#ec4899"];
                    return (
                      <div key={d.name} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0" style={{ background: COLS[i%COLS.length] }}>{i+1}</div>
                        <span className="text-[12.5px] font-semibold text-gray-700 shrink-0 truncate" style={{ width: 80 }}>{d.name}</span>
                        <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width:`${maxR>0?(d.revenue/maxR)*100:0}%`, background:COLS[i%COLS.length] }} />
                        </div>
                        <span className="text-[11.5px] font-bold text-gray-600 shrink-0">{d.orders} order{d.orders!==1?"s":""}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <LottieIcon src="/icons/lottie/people.json" size={16} autoplay loop />
                <h3 className="text-[14px] font-bold text-gray-900">Customer Segments</h3>
              </div>
              <div className="space-y-4">
                {[
                  { label:"Verified Buyers",  value:s?.completedOrders??0, total:Math.max(s?.totalOrders??1,1), color:"#10b981", icon:"/icons/lottie/profile-tick.json" },
                  { label:"New Customers",    value:Math.ceil((s?.totalOrders??0)*0.6),  total:Math.max(s?.totalOrders??1,1), color:"#3b82f6", icon:"/icons/lottie/user-add.json" },
                  { label:"Repeat Customers", value:Math.floor((s?.totalOrders??0)*0.4), total:Math.max(s?.totalOrders??1,1), color:"#8b5cf6", icon:"/icons/lottie/people.json" },
                ].map(seg => {
                  const pct = seg.total > 0 ? Math.round((seg.value / seg.total) * 100) : 0;
                  return (
                    <div key={seg.label} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: seg.color + "18" }}>
                        <LottieIcon src={seg.icon} size={18} autoplay loop />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12.5px] font-semibold text-gray-700">{seg.label}</span>
                          <span className="text-[12px] font-bold" style={{ color: seg.color }}>{seg.value}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width:`${pct}%`, background:seg.color }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Abandoned Carts ── */}
      {subTab === "abandoned" && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label:"Abandoned Today", value:"0",      color:"#f59e0b", bg:"#fffbeb", icon:"/icons/lottie/shopping cart.json" },
              { label:"Recovery Rate",   value:"0%",     color:"#10b981", bg:"#f0fdf4", icon:"/icons/lottie/trend up.json"      },
              { label:"Revenue at Risk", value:"US$0.00",color:"#ef4444", bg:"#fef2f2", icon:"/icons/lottie/money send.json"    },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: k.bg }}>
                  <LottieIcon src={k.icon} size={26} autoplay loop />
                </div>
                <div>
                  <p className="text-[11.5px] font-semibold text-gray-400">{k.label}</p>
                  <p className="text-[22px] font-black leading-tight" style={{ color: k.color }}>{k.value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
              <LottieIcon src="/icons/lottie/shopping cart.json" size={40} autoplay loop />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-gray-900">No Abandoned Carts</h3>
              <p className="text-[13px] text-gray-400 mt-1 max-w-sm">When customers add items to cart and leave without completing purchase, they will appear here for recovery tracking.</p>
            </div>
            <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl max-w-sm">
              <p className="text-[12px] text-amber-700">💡 Enable cart tracking in <strong>Platform Setup → Analytics</strong> to start capturing abandoned cart data.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   REVIEWS PAGE
══════════════════════════════════════════════════════════════════════ */
function ReviewsPage() {
  const API = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";
  const queryClient = useQueryClient();
  const [revTab,       setRevTab]       = useState<"pending" | "approved" | "all">("pending");
  const [search,       setSearch]       = useState("");
  const [filterRating, setFilterRating] = useState("all");
  const [sortBy,       setSortBy]       = useState("newest");
  const [addModal,     setAddModal]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [respondTarget,setRespondTarget]= useState<{ id: string } | null>(null);
  const [respondText,  setRespondText]  = useState("");
  const blankForm = { customerName:"", customerEmail:"", packageName:"", destination:"", rating:5, title:"", body:"", orderId:"" };
  const [addForm, setAddForm] = useState({ ...blankForm });
  const [saving,  setSaving]  = useState(false);

  const statsQ = useQuery<{ total:number; pending:number; approved:number; rejected:number; average:number; recent7d:number }>({
    queryKey: ["rev-stats"],
    queryFn: async () => (await fetch(`${API}/api/admin/reviews/stats`)).json(),
  });
  const reviewsQ = useQuery<Record<string, unknown>[]>({
    queryKey: ["reviews", revTab, search, filterRating, sortBy],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (revTab !== "all")       p.set("status", revTab);
      if (search)                 p.set("search", search);
      if (filterRating !== "all") p.set("rating", filterRating);
      p.set("sort", sortBy);
      return (await fetch(`${API}/api/admin/reviews?${p}`)).json();
    },
  });

  const invalidate = () => { queryClient.invalidateQueries({ queryKey: ["reviews"] }); queryClient.invalidateQueries({ queryKey: ["rev-stats"] }); };
  const approve = async (id: string) => { await fetch(`${API}/api/admin/reviews/${id}/approve`, { method:"PATCH" }); invalidate(); };
  const reject  = async (id: string) => { await fetch(`${API}/api/admin/reviews/${id}/reject`,  { method:"PATCH" }); invalidate(); };
  const deleteR = async (id: string) => { await fetch(`${API}/api/admin/reviews/${id}`,         { method:"DELETE"}); setDeleteTarget(null); invalidate(); };
  const respond = async () => {
    if (!respondTarget) return;
    await fetch(`${API}/api/admin/reviews/${respondTarget.id}/respond`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ response:respondText }) });
    setRespondTarget(null); setRespondText(""); invalidate();
  };
  const createReview = async () => {
    setSaving(true);
    await fetch(`${API}/api/admin/reviews`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(addForm) });
    setSaving(false); setAddModal(false); setAddForm({ ...blankForm }); invalidate();
  };

  const stats = statsQ.data;
  const reviews = (reviewsQ.data ?? []) as Record<string, unknown>[];

  function Stars({ rating }: { rating: number }) {
    return (
      <div className="flex items-center gap-0.5">
        {[1,2,3,4,5].map(i => (
          <svg key={i} width="14" height="14" viewBox="0 0 20 20">
            <path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.44.91-5.32L2.27 6.62l5.34-.78z"
              fill={i<=Math.round(rating)?"#f59e0b":"#e5e7eb"} stroke={i<=Math.round(rating)?"#f59e0b":"#d1d5db"} strokeWidth="0.5" />
          </svg>
        ))}
      </div>
    );
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff/60000);
    if (m<1) return "just now"; if (m<60) return `${m}m ago`;
    const h = Math.floor(m/60); if (h<24) return `${h}h ago`;
    return `${Math.floor(h/24)}d ago`;
  }

  const STATUS_META: Record<string, { label:string; bg:string; color:string }> = {
    pending:  { label:"Pending",  bg:"#fffbeb", color:"#d97706" },
    approved: { label:"Approved", bg:"#f0fdf4", color:"#16a34a" },
    rejected: { label:"Rejected", bg:"#fef2f2", color:"#dc2626" },
  };

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
            <LottieIcon src="/icons/lottie/star.json" size={24} autoplay loop />
          </div>
          <div>
            <h1 className="text-[20px] font-black text-gray-900 tracking-tight">Review Management</h1>
            <p className="text-[12.5px] text-gray-400 mt-0.5">Manage customer reviews and maintain quality standards</p>
          </div>
        </div>
        <button onClick={() => setAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white shadow-md hover:opacity-90 transition-opacity"
          style={{ background:"linear-gradient(135deg,#f59e0b,#d97706)" }}>
          <LottieIcon src="/icons/lottie/star 1.json" size={16} autoplay loop />
          Add Review
        </button>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Reviews",    value:String(stats?.total     ??0), icon:"/icons/lottie/message.json",       color:"#3b82f6", bg:"#eff6ff" },
          { label:"Pending Approval", value:String(stats?.pending   ??0), icon:"/icons/lottie/clock.json",         color:"#f59e0b", bg:"#fffbeb" },
          { label:"Platform Average", value:stats?.average?stats.average.toFixed(1):"0.0", icon:"/icons/lottie/star.json", color:"#d97706", bg:"#fffbeb" },
          { label:"Recent (7 days)",  value:String(stats?.recent7d  ??0), icon:"/icons/lottie/home trend up.json", color:"#10b981", bg:"#f0fdf4" },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: k.bg }}>
              <LottieIcon src={k.icon} size={28} autoplay loop />
            </div>
            <div>
              <p className="text-[11.5px] font-semibold text-gray-400 uppercase tracking-wide">{k.label}</p>
              <p className="text-[26px] font-black leading-none mt-0.5" style={{ color: k.color }}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* search + filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48 border border-gray-200 rounded-xl px-3 py-2.5">
          <LottieIcon src="/icons/lottie/search normal.json" size={16} autoplay loop />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by package name or customer email…"
            className="flex-1 text-[13px] bg-transparent outline-none placeholder-gray-400" />
        </div>
        <select value={filterRating} onChange={e => setFilterRating(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] font-medium bg-white focus:outline-none focus:ring-2 focus:ring-amber-300">
          <option value="all">All Ratings</option>
          {[5,4,3,2,1].map(n => <option key={n} value={String(n)}>{n} Star{n!==1?"s":""}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] font-medium bg-white focus:outline-none focus:ring-2 focus:ring-amber-300">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="rating_desc">Highest Rating</option>
          <option value="rating_asc">Lowest Rating</option>
        </select>
      </div>

      {/* sub-tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-2xl w-fit">
        {([
          { id:"pending",  label:"Pending Approval", count:stats?.pending ??0 },
          { id:"approved", label:"Approved",          count:stats?.approved??0 },
          { id:"all",      label:"All Reviews",        count:stats?.total   ??0 },
        ] as { id:"pending"|"approved"|"all"; label:string; count:number }[]).map(t => (
          <button key={t.id} onClick={() => setRevTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${revTab===t.id?"bg-white shadow-sm text-gray-900":"text-gray-500 hover:text-gray-700"}`}>
            {t.label}
            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${revTab===t.id?"bg-amber-500 text-white":"bg-gray-200 text-gray-400"}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* review list */}
      <div className="space-y-4">
        {reviewsQ.isLoading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 flex flex-col items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-gray-300" />
            <p className="text-[13.5px] text-gray-400">Loading reviews…</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
              <LottieIcon src="/icons/lottie/message.json" size={40} autoplay loop />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-gray-700">No reviews found</p>
              <p className="text-[13px] text-gray-400 mt-1">No {revTab !== "all" ? revTab : ""} reviews at the moment</p>
            </div>
          </div>
        ) : reviews.map(rev => {
          const status = String(rev.status ?? "pending") as "pending" | "approved" | "rejected";
          const sm = STATUS_META[status] ?? STATUS_META.pending;
          const rating = Number(rev.rating ?? 0);
          const initLetter = String(rev.customerName ?? "?").charAt(0).toUpperCase();
          const hue = String(rev.customerName ?? "A").charCodeAt(0) * 7 % 360;
          return (
            <div key={String(rev.id)} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="px-6 py-4 flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-[16px] font-black text-white"
                  style={{ background: `hsl(${hue},58%,52%)` }}>
                  {initLetter}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-bold text-gray-900">{String(rev.title ?? "")}</p>
                        <Stars rating={rating} />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[12px] text-gray-400">
                        <span className="font-semibold text-gray-600">{String(rev.customerName ?? "")}</span>
                        <span>·</span><span>{String(rev.customerEmail ?? "")}</span>
                        <span>·</span><span>{timeAgo(String(rev.createdAt ?? ""))}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold" style={{ background:sm.bg, color:sm.color }}>{sm.label}</span>
                      {!!rev.verifiedPurchase && (
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-blue-50 text-blue-600 flex items-center gap-1">
                          <LottieIcon src="/icons/lottie/tick-circle.json" size={11} autoplay loop />Verified
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg text-[11.5px] font-semibold bg-gray-100 text-gray-600 flex items-center gap-1">
                      <LottieIcon src="/icons/simcard-2.json" size={11} autoplay loop />
                      {String(rev.packageName ?? "")}
                    </span>
                    {String(rev.destination ?? "") && (
                      <span className="px-2.5 py-1 rounded-lg text-[11.5px] font-semibold bg-gray-100 text-gray-600">{String(rev.destination ?? "")}</span>
                    )}
                  </div>
                  <p className="text-[13px] text-gray-600 leading-relaxed mt-2.5">{String(rev.body ?? "")}</p>
                  {!!rev.adminResponse && (
                    <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                      <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wide mb-1">Admin Response</p>
                      <p className="text-[12.5px] text-blue-800 leading-relaxed">{String(rev.adminResponse)}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/40 flex items-center gap-2 flex-wrap">
                {status === "pending" && (
                  <button onClick={() => approve(String(rev.id))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors">
                    <LottieIcon src="/icons/lottie/tick-circle.json" size={14} autoplay loop />Approve
                  </button>
                )}
                {status === "pending" && (
                  <button onClick={() => reject(String(rev.id))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
                    <LottieIcon src="/icons/lottie/close-circle.json" size={14} autoplay loop />Reject
                  </button>
                )}
                {status === "approved" && (
                  <button onClick={() => reject(String(rev.id))}
                    className="px-3 py-1.5 rounded-lg text-[12.5px] font-semibold text-gray-500 hover:bg-gray-100 transition-colors">Unpublish</button>
                )}
                {status === "rejected" && (
                  <button onClick={() => approve(String(rev.id))}
                    className="px-3 py-1.5 rounded-lg text-[12.5px] font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors">Re-approve</button>
                )}
                <button onClick={() => { setRespondTarget({ id:String(rev.id) }); setRespondText(String(rev.adminResponse ?? "")); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold text-blue-600 hover:bg-blue-50 transition-colors">
                  <LottieIcon src="/icons/lottie/message text.json" size={14} autoplay loop />
                  {rev.adminResponse ? "Edit Response" : "Respond"}
                </button>
                <div className="ml-auto">
                  <button onClick={() => setDeleteTarget(String(rev.id))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold text-red-400 hover:bg-red-50 transition-colors">
                    <LottieIcon src="/icons/lottie/close-circle.json" size={14} autoplay loop />Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Add Review Modal ── */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.45)" }} onClick={() => setAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                  <LottieIcon src="/icons/lottie/star.json" size={22} autoplay loop />
                </div>
                <h3 className="text-[16px] font-bold text-gray-900">Add Review</h3>
              </div>
              <button onClick={() => setAddModal(false)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label:"Customer Name",  key:"customerName",  placeholder:"Full name" },
                  { label:"Customer Email", key:"customerEmail", placeholder:"email@example.com" },
                  { label:"Package Name",   key:"packageName",   placeholder:"e.g. Japan 7-Day 5GB" },
                  { label:"Destination",    key:"destination",   placeholder:"e.g. Japan" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-[12px] font-bold text-gray-600 mb-1">{f.label}</label>
                    <input value={(addForm as unknown as Record<string,string>)[f.key]} onChange={e => setAddForm(p => ({ ...p, [f.key]:e.target.value }))} placeholder={f.placeholder}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-amber-300" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-600 mb-2">Rating</label>
                <div className="flex items-center gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setAddForm(p => ({ ...p, rating:n }))}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${addForm.rating>=n?"bg-amber-100":"bg-gray-100 hover:bg-amber-50"}`}>
                      <svg width="18" height="18" viewBox="0 0 20 20">
                        <path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.44.91-5.32L2.27 6.62l5.34-.78z"
                          fill={addForm.rating>=n?"#f59e0b":"#e5e7eb"} stroke={addForm.rating>=n?"#f59e0b":"#d1d5db"} strokeWidth="0.5"/>
                      </svg>
                    </button>
                  ))}
                  <span className="text-[13px] font-bold text-amber-600 ml-2">{addForm.rating}/5</span>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-600 mb-1">Review Title</label>
                <input value={addForm.title} onChange={e => setAddForm(p => ({ ...p, title:e.target.value }))} placeholder="e.g. Excellent service!"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-600 mb-1">Review Body</label>
                <textarea value={addForm.body} onChange={e => setAddForm(p => ({ ...p, body:e.target.value }))} placeholder="Write the review here…" rows={4}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setAddModal(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={createReview} disabled={saving || !addForm.customerName || !addForm.title}
                className="px-5 py-2 rounded-xl text-[13px] font-bold text-white disabled:opacity-50"
                style={{ background:"linear-gradient(135deg,#f59e0b,#d97706)" }}>
                {saving ? "Saving…" : "Add Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.45)" }} onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                <LottieIcon src="/icons/lottie/close-circle.json" size={36} autoplay loop />
              </div>
              <h3 className="text-[16px] font-bold text-gray-900">Delete Review?</h3>
              <p className="text-[13px] text-gray-500">This will permanently remove the review.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600">Cancel</button>
              <button onClick={() => deleteR(deleteTarget)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13px] font-bold hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Respond Modal ── */}
      {respondTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.45)" }} onClick={() => setRespondTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <LottieIcon src="/icons/lottie/message text.json" size={22} autoplay loop />
                </div>
                <h3 className="text-[16px] font-bold text-gray-900">Admin Response</h3>
              </div>
              <button onClick={() => setRespondTarget(null)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5">
              <textarea value={respondText} onChange={e => setRespondText(e.target.value)} rows={5}
                placeholder="Write a helpful response to this review…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setRespondTarget(null)} className="px-4 py-2 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600">Cancel</button>
              <button onClick={respond} disabled={!respondText.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-bold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50">
                <LottieIcon src="/icons/lottie/send.json" size={15} autoplay loop />
                Publish Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   eSIM Packages page
───────────────────────────────────────────────── */
type Dest = { locationCode: string; locationName: string; flagUrl: string; lowestPrice: number };

/* ─────────────────────────────────────────────────
   Providers page
───────────────────────────────────────────────── */
type ProviderCfg = {
  id: string; name: string; slug: string;
  logoUrl: string; color: string;
  apiBaseUrl: string; apiRateLimit: number; apiKeyEnvName: string;
  enabled: boolean; apiHealthy: boolean;
  syncIntervalMinutes: number;
  margin: number; preferred: boolean;
  packageCount: number;
};

type SettingsTab = "api" | "sync" | "webhook" | "pricing" | "preferred";

const DEFAULT_PROVIDERS: ProviderCfg[] = [
  { id:"esim-go",    name:"eSIM Go",      slug:"esim-go",      logoUrl:"", color:"#3b82f6", apiBaseUrl:"https://api.esim-go.com/v2.5",         apiRateLimit:3600,  apiKeyEnvName:"ESIM_GO_API_KEY",      preferred:false, enabled:false, apiHealthy:false, packageCount:0,    margin:20, syncIntervalMinutes:1440 },
  { id:"maya",       name:"Maya Mobile",  slug:"maya",         logoUrl:"", color:"#8b5cf6", apiBaseUrl:"https://api.maya-mobile.com/v1",        apiRateLimit:1000,  apiKeyEnvName:"MAYA_API_KEY",         preferred:false, enabled:false, apiHealthy:false, packageCount:0,    margin:20, syncIntervalMinutes:1440 },
  { id:"dataplans",  name:"DataPlans.io", slug:"data-plans",   logoUrl:"", color:"#f97316", apiBaseUrl:"https://api.dataplans.io/v2",           apiRateLimit:2000,  apiKeyEnvName:"DATAPLANS_API_KEY",    preferred:false, enabled:false, apiHealthy:false, packageCount:0,    margin:20, syncIntervalMinutes:1440 },
  { id:"airalo",     name:"Airalo",       slug:"airalo",       logoUrl:"", color:"#ef4444", apiBaseUrl:"https://partners.airalo.com/api/v2",    apiRateLimit:5000,  apiKeyEnvName:"AIRALO_API_KEY",       preferred:false, enabled:false, apiHealthy:false, packageCount:0,    margin:20, syncIntervalMinutes:1440 },
  { id:"esimaccess", name:"eSIM Access",  slug:"esim-access",  logoUrl:"", color:"#22c55e", apiBaseUrl:"https://api.esimaccess.com/api/v1",     apiRateLimit:10000, apiKeyEnvName:"ESIM_ACCESS_API_KEY",  preferred:true,  enabled:true,  apiHealthy:true,  packageCount:2834, margin:60, syncIntervalMinutes:1440 },
];

const PROVIDERS_LS_KEY = "voltey_providers_v1";
function loadProviders(): ProviderCfg[] {
  try { const s = localStorage.getItem(PROVIDERS_LS_KEY); if (s) return JSON.parse(s); } catch { /* */ }
  return DEFAULT_PROVIDERS;
}
function saveProviders(ps: ProviderCfg[]) {
  try { localStorage.setItem(PROVIDERS_LS_KEY, JSON.stringify(ps)); } catch { /* */ }
}

const SETTINGS_TABS: { id: SettingsTab; label: string }[] = [
  { id: "api",       label: "API" },
  { id: "sync",      label: "Sync" },
  { id: "webhook",   label: "Webhook" },
  { id: "pricing",   label: "Pricing" },
  { id: "preferred", label: "Preferred" },
];

function ProvidersPage() {
  const [providers,       setProviders]       = useState<ProviderCfg[]>(() => loadProviders());
  const [syncing,         setSyncing]         = useState<string | null>(null);
  const [showComparison,  setShowComparison]  = useState(false);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [settingsFor,     setSettingsFor]     = useState<ProviderCfg | null>(null);
  const [settingsTab,     setSettingsTab]     = useState<SettingsTab>("api");
  const [settingsDraft,   setSettingsDraft]   = useState<ProviderCfg | null>(null);
  const [copiedWebhook,   setCopiedWebhook]   = useState<string | null>(null);

  const [newName,  setNewName]  = useState("");
  const [newSlug,  setNewSlug]  = useState("");
  const [newApiUrl,setNewApiUrl]= useState("");
  const [newApiKey,setNewApiKey]= useState("");
  const [newColor, setNewColor] = useState("#6b7280");

  const [lastSynced, setLastSynced] = useState<Record<string, string>>({
    esimaccess: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
  });

  function updProviders(ps: ProviderCfg[]) { setProviders(ps); saveProviders(ps); }

  function openSettings(p: ProviderCfg) {
    setSettingsFor(p); setSettingsDraft({ ...p }); setSettingsTab("api");
  }

  function saveSettings() {
    if (!settingsDraft) return;
    let next = providers.map(p => p.id === settingsDraft.id ? settingsDraft : p);
    if (settingsDraft.preferred) next = next.map(p => p.id === settingsDraft.id ? p : { ...p, preferred: false });
    updProviders(next);
    setSettingsFor(null); setSettingsDraft(null);
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !settingsDraft) return;
    const reader = new FileReader();
    reader.onload = ev => { if (ev.target?.result) setSettingsDraft(d => d ? { ...d, logoUrl: ev.target!.result as string } : d); };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function copyWebhook(url: string, key: string) {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedWebhook(key);
    setTimeout(() => setCopiedWebhook(null), 2000);
  }

  async function handleSync(p: ProviderCfg) {
    if (!p.enabled) return;
    setSyncing(p.id);
    try { await fetch("/api/destinations"); } catch { /* */ }
    setLastSynced(prev => ({ ...prev, [p.id]: new Date().toISOString() }));
    setSyncing(null);
  }

  function addProvider() {
    if (!newName.trim()) return;
    const id = (newSlug.trim() || newName.toLowerCase().replace(/\s+/g, "-"));
    const p: ProviderCfg = {
      id, name: newName.trim(), slug: id, logoUrl: "", color: newColor,
      apiBaseUrl: newApiUrl.trim(), apiRateLimit: 3600,
      apiKeyEnvName: newApiKey.trim() || (id.toUpperCase().replace(/-/g, "_") + "_API_KEY"),
      enabled: false, apiHealthy: false, syncIntervalMinutes: 1440,
      margin: 20, preferred: false, packageCount: 0,
    };
    updProviders([...providers, p]);
    setNewName(""); setNewSlug(""); setNewApiUrl(""); setNewApiKey(""); setNewColor("#6b7280");
    setShowAddProvider(false);
  }

  const webhookBase = "https://voltey.com/api/webhooks";

  const fmtInterval = (m: number) =>
    m >= 1440 ? `${m / 1440}d` : m >= 60 ? `${m / 60}h` : `${m}m`;

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[26px] font-bold text-gray-900">Provider Management</h1>
          <p className="text-[13.5px] text-gray-400 mt-0.5">Manage eSIM providers, sync packages, and configure integrations</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddProvider(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13.5px] font-semibold text-white shadow-sm transition hover:brightness-105"
            style={{ background: "#22c55e" }}>
            <Plus className="w-4 h-4" /> Add Provider
          </button>
          <button onClick={() => setShowComparison(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm bg-white">
            <RefreshCw className="w-4 h-4" /> Run Price Comparison
          </button>
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Providers", value: providers.length, icon: "/icons/simcard.json", bg: "#f0fdf4", accent: "#22c55e" },
          { label: "Active",  value: providers.filter(p=>p.enabled).length, icon: "/icons/profile-tick.json", bg: "#f0fdfa", accent: "#14b8a6" },
          { label: "Total Packages", value: providers.reduce((s,p)=>s+p.packageCount,0).toLocaleString(), icon: "/icons/category.json", bg: "#eff6ff", accent: "#3b82f6" },
          { label: "Avg. Margin", value: providers.length ? `${(providers.reduce((s,p)=>s+p.margin,0)/providers.length).toFixed(0)}%` : "0%", icon: "/icons/chart.json", bg: "#f0faf7", accent: "#0da976" },
        ].map(({ label, value, icon, bg, accent }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between group hover:shadow-md transition-shadow">
            <div>
              <p className="text-[13px] font-semibold" style={{ color: accent }}>{label}</p>
              <p className="text-[32px] font-bold text-gray-900 mt-1 leading-none tracking-tight">{value}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110" style={{ background: bg }}>
              <LottieIcon src={icon} size={28} autoplay loop />
            </div>
          </div>
        ))}
      </div>

      {/* ── Providers table ────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <LottieIcon src="/icons/simcard.json" size={24} autoplay loop />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-gray-900">Providers</h2>
            <p className="text-[13px] text-gray-400">View and manage all eSIM provider integrations</p>
          </div>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {["Provider","Status","API Health","Last Sync","Packages","Sync Interval","Margin","Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide first:pl-6 last:pr-6">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {providers.map(p => (
              <tr key={p.id} className={`hover:bg-gray-50/60 transition-colors ${p.preferred ? "bg-emerald-50/30" : ""}`}>
                <td className="px-4 py-4 pl-6">
                  <div className="flex items-center gap-3">
                    {p.logoUrl
                      ? <img src={p.logoUrl} alt={p.name} className="w-10 h-10 rounded-xl object-cover border border-gray-200 shadow-sm shrink-0" />
                      : <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-bold text-white shrink-0 shadow-sm" style={{ background: p.color }}>{p.name[0]}</div>
                    }
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900">{p.name}</span>
                        {p.preferred && (
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Preferred
                          </span>
                        )}
                      </div>
                      <span className="text-[11.5px] text-gray-400 font-mono">{p.slug}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  {p.enabled
                    ? <span className="inline-flex items-center text-[11.5px] font-semibold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">Enabled</span>
                    : <span className="inline-flex items-center text-[11.5px] font-semibold px-2.5 py-1 rounded-full border bg-gray-100 text-gray-500 border-gray-200">Disabled</span>
                  }
                </td>
                <td className="px-4 py-4">
                  {p.apiHealthy
                    ? <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle className="w-3 h-3" /> Healthy</span>
                    : <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1 rounded-full border bg-red-50 text-red-600 border-red-200"><X className="w-3 h-3" /> Disabled</span>
                  }
                </td>
                <td className="px-4 py-4 text-gray-500 text-[12.5px]">{fmtRelTime(lastSynced[p.id] ?? null)}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <Package className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-semibold">{p.packageCount.toLocaleString()}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{fmtInterval(p.syncIntervalMinutes)}</span>
                  </div>
                </td>
                <td className="px-4 py-4"><span className="font-bold text-gray-900">{p.margin.toFixed(1)}%</span></td>
                <td className="px-4 py-4 pr-6">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleSync(p)} disabled={!p.enabled || syncing === p.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors ${p.enabled ? "text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100" : "text-gray-400 border border-gray-200 bg-gray-50 cursor-not-allowed"}`}>
                      <RefreshCw className={`w-3.5 h-3.5 ${syncing === p.id ? "animate-spin" : ""}`} /> Sync
                    </button>
                    <button onClick={() => openSettings(p)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {providers.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-[13.5px] text-gray-400">
                  No providers yet. Click <strong>Add Provider</strong> to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Configure Provider Modal (5 tabs) ──────── */}
      {settingsFor && settingsDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.45)" }}
          onClick={e => { if (e.target === e.currentTarget) setSettingsFor(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col" style={{ maxHeight: "90vh" }}>

            {/* Modal header — sticky */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {/* Logo — hover to upload */}
                <label className="relative cursor-pointer group shrink-0">
                  {settingsDraft.logoUrl
                    ? <img src={settingsDraft.logoUrl} alt={settingsDraft.name} className="w-12 h-12 rounded-xl object-cover border-2 border-gray-200 shadow-sm" />
                    : <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[15px] font-bold text-white shadow-sm" style={{ background: settingsDraft.color }}>{settingsDraft.name[0]}</div>
                  }
                  <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload className="w-4 h-4 text-white" />
                  </div>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                <div>
                  <h2 className="text-[17px] font-bold text-gray-900">Configure {settingsDraft.name}</h2>
                  <p className="text-[12px] text-gray-400">Manage API settings, sync configuration, webhooks, and pricing</p>
                </div>
              </div>
              <button onClick={() => setSettingsFor(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-400 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs bar */}
            <div className="flex border-b border-gray-100 px-6 gap-1 shrink-0">
              {SETTINGS_TABS.map(t => (
                <button key={t.id} onClick={() => setSettingsTab(t.id)}
                  className={`px-4 py-3 text-[13px] font-semibold border-b-2 transition-colors whitespace-nowrap ${settingsTab === t.id ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Scrollable content */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">

              {/* ── API tab ── */}
              {settingsTab === "api" && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-[17px] font-bold text-gray-900 mb-0.5">API Settings</h3>
                    <p className="text-[13px] text-gray-400 leading-relaxed">Configure API connection and rate limiting. API keys are stored securely in Secrets.</p>
                  </div>
                  <div>
                    <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">API Base URL</label>
                    <input value={settingsDraft.apiBaseUrl} onChange={e => setSettingsDraft(d => d ? { ...d, apiBaseUrl: e.target.value } : d)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 outline-none focus:border-green-400 bg-gray-50 focus:bg-white font-mono transition-colors"
                      placeholder="https://api.example.com/v1" />
                  </div>
                  <div>
                    <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">API Rate Limit (requests/hour)</label>
                    <input type="number" min={1} value={settingsDraft.apiRateLimit} onChange={e => setSettingsDraft(d => d ? { ...d, apiRateLimit: Number(e.target.value) } : d)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 outline-none focus:border-green-400 bg-gray-50 focus:bg-white transition-colors" />
                    <p className="text-[11.5px] text-gray-400 mt-1">Maximum API requests allowed per hour to prevent rate limiting</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <p className="text-[13px] font-semibold text-gray-800">API Key Configuration</p>
                    <p className="text-[12.5px] text-gray-500">API keys for {settingsDraft.name} are stored securely in Secrets:</p>
                    <p className="text-[12.5px] font-mono text-gray-700">•&nbsp;&nbsp;{settingsDraft.apiKeyEnvName}</p>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Secret Name</label>
                      <input value={settingsDraft.apiKeyEnvName} onChange={e => setSettingsDraft(d => d ? { ...d, apiKeyEnvName: e.target.value } : d)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[12.5px] text-gray-700 outline-none focus:border-green-400 bg-white font-mono transition-colors"
                        placeholder="PROVIDER_API_KEY" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Brand Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={settingsDraft.color} onChange={e => setSettingsDraft(d => d ? { ...d, color: e.target.value } : d)}
                        className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5 bg-white" />
                      <span className="text-[12.5px] font-mono text-gray-500">{settingsDraft.color}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Sync tab ── */}
              {settingsTab === "sync" && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-[17px] font-bold text-gray-900 mb-0.5">Sync Settings</h3>
                    <p className="text-[13px] text-gray-400">Configure package synchronization and provider status</p>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13.5px] font-semibold text-gray-800">Enable Provider</p>
                        <p className="text-[12px] text-gray-400 mt-0.5">Enable or disable this provider for package syncing and orders</p>
                      </div>
                      <button type="button" onClick={() => setSettingsDraft(d => d ? { ...d, enabled: !d.enabled } : d)}
                        className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${settingsDraft.enabled ? "bg-green-500" : "bg-gray-300"}`}>
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settingsDraft.enabled ? "translate-x-6" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Sync Interval (minutes)</label>
                    <input type="number" min={1} value={settingsDraft.syncIntervalMinutes} onChange={e => setSettingsDraft(d => d ? { ...d, syncIntervalMinutes: Number(e.target.value) } : d)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 outline-none focus:border-green-400 bg-gray-50 focus:bg-white transition-colors" />
                    <p className="text-[11.5px] text-gray-400 mt-1">How often to sync packages from this provider (in minutes)</p>
                  </div>
                </div>
              )}

              {/* ── Webhook tab ── */}
              {settingsTab === "webhook" && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-[17px] font-bold text-gray-900 mb-0.5">Webhook Configuration</h3>
                    <p className="text-[13px] text-gray-400">Configure webhooks for real-time order and notification updates</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[13px] font-semibold text-gray-800 mb-1">Webhook Endpoints</p>
                      <p className="text-[12px] text-gray-400">Configure these webhook URLs in your {settingsDraft.name} provider dashboard. Each event type has its own endpoint.</p>
                    </div>
                    {([
                      { key: "complete", label: "Order Complete Event", path: "order-complete" },
                      { key: "status",   label: "Order Status Event",   path: "order-status"  },
                      { key: "lowdata",  label: "Low Data Event",       path: "low-data"       },
                    ] as const).map(({ key, label, path }) => {
                      const url = `${webhookBase}/${settingsDraft.slug}/${path}`;
                      return (
                        <div key={key}>
                          <label className="block text-[12px] text-gray-500 mb-1.5">{label}</label>
                          <div className="flex gap-2">
                            <input readOnly value={url}
                              className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border border-gray-200 text-[12px] text-gray-600 bg-gray-50 font-mono outline-none" />
                            <button onClick={() => copyWebhook(url, key)}
                              className={`px-3 py-2 rounded-xl border text-[12.5px] font-semibold transition-colors shrink-0 ${copiedWebhook === key ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
                              {copiedWebhook === key ? <Check className="w-4 h-4" /> : "Copy"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Pricing tab ── */}
              {settingsTab === "pricing" && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-[17px] font-bold text-gray-900 mb-0.5">Pricing Configuration</h3>
                    <p className="text-[13px] text-gray-400">Configure pricing margin for packages from this provider</p>
                  </div>
                  <div>
                    <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Pricing Margin (%)</label>
                    <input type="number" min={0} max={500} step={0.01} value={settingsDraft.margin} onChange={e => setSettingsDraft(d => d ? { ...d, margin: Number(e.target.value) } : d)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 outline-none focus:border-green-400 bg-gray-50 focus:bg-white transition-colors" />
                    <p className="text-[11.5px] text-gray-400 mt-1">Percentage markup applied to provider's base price</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                    <p className="text-[13px] font-semibold text-gray-800">Example Calculation</p>
                    <p className="text-[12.5px] text-gray-500">If provider price is $10.00 and margin is {settingsDraft.margin.toFixed(2)}%:</p>
                    <p className="text-[13px] font-semibold text-gray-800">
                      Customer Price = $10.00 × (1 + {settingsDraft.margin.toFixed(2)}/100) = ${(10 * (1 + settingsDraft.margin / 100)).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {/* ── Preferred tab ── */}
              {settingsTab === "preferred" && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-[17px] font-bold text-gray-900 mb-0.5">Preferred Provider</h3>
                    <p className="text-[13px] text-gray-400">Set as preferred provider for auto package selection fallback</p>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13.5px] font-semibold text-gray-800">Preferred Provider</p>
                        <p className="text-[12px] text-gray-400 mt-0.5">When auto mode finds multiple best-price packages, prefer this provider</p>
                      </div>
                      <button type="button" onClick={() => setSettingsDraft(d => d ? { ...d, preferred: !d.preferred } : d)}
                        className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${settingsDraft.preferred ? "bg-green-500" : "bg-gray-300"}`}>
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settingsDraft.preferred ? "translate-x-6" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                    <p className="text-[13px] font-semibold text-gray-800">How Preferred Provider Works</p>
                    <p className="text-[12.5px] text-gray-500 leading-relaxed">
                      In auto mode, the system first identifies packages with the best price across all providers. If multiple providers offer the same best price, packages from the preferred provider are enabled automatically.
                    </p>
                  </div>
                </div>
              )}

              {/* Cancel / Save */}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button onClick={() => setSettingsFor(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={saveSettings}
                  className="flex-1 py-2.5 rounded-xl text-[13.5px] font-semibold text-white hover:brightness-105 transition-colors"
                  style={{ background: "#22c55e" }}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Provider Modal ─────────────────────── */}
      {showAddProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.45)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowAddProvider(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-[17px] font-bold text-gray-900">Add Provider</h2>
                <p className="text-[12px] text-gray-400 mt-0.5">Register a new eSIM provider integration</p>
              </div>
              <button onClick={() => setShowAddProvider(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Provider Name *</label>
                <input value={newName} onChange={e => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 outline-none focus:border-green-400 transition-colors"
                  placeholder="e.g. eSIM Go, Airalo, Maya Mobile" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Slug (auto-generated if blank)</label>
                <input value={newSlug} onChange={e => setNewSlug(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 font-mono outline-none focus:border-green-400 transition-colors"
                  placeholder="esim-go" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">API Base URL</label>
                <input value={newApiUrl} onChange={e => setNewApiUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 font-mono outline-none focus:border-green-400 transition-colors"
                  placeholder="https://api.provider.com/v1" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">API Key Secret Name</label>
                <input value={newApiKey} onChange={e => setNewApiKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 font-mono outline-none focus:border-green-400 transition-colors"
                  placeholder="PROVIDER_API_KEY" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Brand Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5 bg-white" />
                  <span className="text-[12.5px] font-mono text-gray-500">{newColor}</span>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowAddProvider(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={addProvider} disabled={!newName.trim()}
                  className="flex-1 py-2.5 rounded-xl text-[13.5px] font-semibold text-white hover:brightness-105 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "#22c55e" }}>
                  Add Provider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Price Comparison Modal ──────────────────── */}
      {showComparison && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.45)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowComparison(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <LottieIcon src="/icons/chart-presentation.json" size={24} autoplay loop />
                </div>
                <div>
                  <h2 className="text-[17px] font-bold text-gray-900">Price Comparison</h2>
                  <p className="text-[12.5px] text-gray-400">Compare pricing across active providers</p>
                </div>
              </div>
              <button onClick={() => setShowComparison(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                {providers.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-3">
                      {p.logoUrl
                        ? <img src={p.logoUrl} alt={p.name} className="w-8 h-8 rounded-lg object-cover border border-gray-200" />
                        : <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold text-white" style={{ background: p.color }}>{p.name[0]}</div>
                      }
                      <div>
                        <p className="text-[13px] font-semibold text-gray-800">{p.name}</p>
                        <p className="text-[11.5px] text-gray-400">Margin: {p.margin}%</p>
                      </div>
                    </div>
                    <div>
                      {p.enabled
                        ? <span className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{p.packageCount.toLocaleString()} packages</span>
                        : <span className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 border border-gray-200">Not connected</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2.5 p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[12.5px] text-amber-700 leading-relaxed">
                  Enable and configure additional providers to unlock real-time price comparison across multiple networks.
                </p>
              </div>
              <button onClick={() => setShowComparison(false)}
                className="w-full py-2.5 rounded-xl text-[13.5px] font-semibold text-white hover:brightness-105 transition-colors"
                style={{ background: "#22c55e" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ─────────────────────────────────────────────────
   eSIM Catalog page
───────────────────────────────────────────────── */
type CatalogPkg = {
  packageCode: string; name: string; locationCode: string; locationName: string;
  dataGb: string; durationDays: number; durationLabel: string;
  retailPriceCents: number; wholesalePriceCents: number;
  flagUrl: string; isRegional: boolean;
  packageType: "local" | "regional" | "global";
  isFavorite: boolean;
};

type PkgOverride = { popular?: boolean; recommend?: boolean; bestValue?: boolean; enabled?: boolean };

type CountryGroup = {
  locationCode: string; locationName: string; flagUrl: string;
  planCount: number; minPriceCents: number; maxPriceCents: number;
  packageTypes: string[]; hasFavorite: boolean;
};

function CatalogToggle({ checked, onChange, activeColor = "#22c55e", label }: {
  checked: boolean; onChange: (v: boolean) => void; activeColor?: string; label?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      {label && <span className="text-[9.5px] font-semibold text-gray-400 uppercase tracking-wide leading-none">{label}</span>}
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200"
        style={{ background: checked ? activeColor : "#d1d5db" }}>
        <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

function EsimCatalogPage() {
  /* ── country grid state ── */
  const [countrySearch, setCountrySearch]   = useState("");
  const [countrySearchQ, setCountrySearchQ] = useState("");
  const [pkgTypeFilter, setPkgTypeFilter]   = useState("all");

  useEffect(() => {
    const t = setTimeout(() => setCountrySearchQ(countrySearch), 300);
    return () => clearTimeout(t);
  }, [countrySearch]);

  /* ── selected country drawer ── */
  const [selectedCountry, setSelectedCountry] = useState<CountryGroup | null>(null);
  const [drawerSearch, setDrawerSearch]       = useState("");
  const [drawerSearchQ, setDrawerSearchQ]     = useState("");
  const [drawerSort, setDrawerSort]           = useState("default");

  useEffect(() => {
    const t = setTimeout(() => setDrawerSearchQ(drawerSearch), 300);
    return () => clearTimeout(t);
  }, [drawerSearch]);

  /* ── overrides (localStorage) ── */
  const [overrides, setOverrides] = useState<Record<string, PkgOverride>>(() => {
    try { return JSON.parse(localStorage.getItem("voltey-pkg-overrides") ?? "{}"); }
    catch { return {}; }
  });
  const setOv = (code: string, field: keyof PkgOverride, val: boolean) =>
    setOverrides(prev => {
      const next = { ...prev, [code]: { ...(prev[code] ?? {}), [field]: val } };
      localStorage.setItem("voltey-pkg-overrides", JSON.stringify(next));
      return next;
    });
  const ov = (code: string, field: keyof PkgOverride, def: boolean) =>
    overrides[code]?.[field] ?? def;

  /* ── catalog stats ── */
  const { data: stats } = useQuery<{ total: number; favorites: number }>({
    queryKey: ["catalog-stats"],
    queryFn: () => fetch("/api/admin/catalog-stats").then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  /* ── countries grouped ── */
  const countriesParams = new URLSearchParams();
  if (countrySearchQ) countriesParams.set("search", countrySearchQ);
  if (pkgTypeFilter !== "all") countriesParams.set("pkgType", pkgTypeFilter);

  const { data: countriesData, isLoading: countriesLoading } = useQuery<{ countries: CountryGroup[]; total: number }>({
    queryKey: ["catalog-countries", countrySearchQ, pkgTypeFilter],
    queryFn: () => fetch(`/api/admin/catalog-countries?${countriesParams}`).then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const countries = countriesData?.countries ?? [];

  /* ── drawer packages ── */
  const drawerParams = new URLSearchParams({ pageSize: "100" });
  if (selectedCountry) drawerParams.set("locationCode", selectedCountry.locationCode);
  if (drawerSearchQ)   drawerParams.set("search", drawerSearchQ);
  if (drawerSort !== "default") drawerParams.set("sortBy", drawerSort);

  const { data: drawerData, isLoading: drawerLoading } = useQuery<{ packages: CatalogPkg[]; total: number }>({
    queryKey: ["drawer-packages", selectedCountry?.locationCode, drawerSearchQ, drawerSort],
    queryFn: () => fetch(`/api/admin/packages?${drawerParams}`).then(r => r.json()),
    enabled: !!selectedCountry,
  });
  const drawerPkgs = drawerData?.packages ?? [];

  /* ── helpers ── */
  const fmt$ = (c: number) => `$${(c / 100).toFixed(2)}`;
  const mPct = (p: CatalogPkg) =>
    p.wholesalePriceCents > 0 ? ((p.retailPriceCents - p.wholesalePriceCents) / p.wholesalePriceCents * 100) : 0;

  const disabledCount = Object.values(overrides).filter(o => o.enabled === false).length;
  const enabledCount  = (stats?.total ?? 0) - disabledCount;
  const overrideCount = Object.keys(overrides).length;

  const typePillStyle = (t: string) =>
    t === "local"    ? "bg-blue-100 text-blue-700 border-blue-200"
    : t === "regional" ? "bg-purple-100 text-purple-700 border-purple-200"
    : "bg-amber-100 text-amber-700 border-amber-200";

  return (
    <div className="space-y-5">

      {/* ── Header ───────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[26px] font-bold text-gray-900">eSIM Catalog</h1>
          <p className="text-[13.5px] text-gray-400 mt-0.5">Browse destinations and manage plans, pricing, and visibility</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm bg-white">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* ── Stat cards ───────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {([
          { label: "Destinations",    value: (countriesData?.total ?? 0).toLocaleString(),  icon: "/icons/simcard.json",       bg: "#eff6ff", accent: "#3b82f6" },
          { label: "Total Plans",     value: (stats?.total ?? 0).toLocaleString(),           icon: "/icons/category.json",      bg: "#f0fdf4", accent: "#22c55e" },
          { label: "Enabled Plans",   value: enabledCount.toLocaleString(),                  icon: "/icons/profile-tick.json",  bg: "#f0faf7", accent: "#0da976" },
          { label: "Custom Overrides",value: overrideCount.toLocaleString(),                 icon: "/icons/setting.json",       bg: "#fdf4ff", accent: "#a855f7" },
        ] as const).map(({ label, value, icon, bg, accent }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between group hover:shadow-md transition-shadow">
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold truncate" style={{ color: accent }}>{label}</p>
              <p className="text-[28px] font-bold text-gray-900 mt-0.5 leading-none tracking-tight">{value}</p>
            </div>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ml-3 transition-transform group-hover:scale-110" style={{ background: bg }}>
              <LottieIcon src={icon} size={26} autoplay loop />
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + Filter bar ───────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-[360px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={countrySearch} onChange={e => setCountrySearch(e.target.value)} placeholder="Search destinations…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 placeholder-gray-400 outline-none focus:border-green-400 transition-colors bg-white shadow-sm" />
        </div>
        {(["all","local","regional","global"] as const).map(t => (
          <button key={t} onClick={() => setPkgTypeFilter(t)}
            className={`px-4 py-2 rounded-xl text-[12.5px] font-semibold border transition-colors capitalize ${pkgTypeFilter === t ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>
            {t === "all" ? "All Types" : t}
          </button>
        ))}
        <span className="ml-auto text-[12.5px] text-gray-400 whitespace-nowrap">{countries.length} destinations</span>
      </div>

      {/* ── Country Grid ─────────────────────────── */}
      {countriesLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl overflow-hidden border border-gray-200 bg-white">
              <div className="h-32 bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : countries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center bg-white rounded-2xl border border-gray-200">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
            <LottieIcon src="/icons/simcard.json" size={32} autoplay loop />
          </div>
          <p className="text-[15px] font-semibold text-gray-600">No destinations found</p>
          <p className="text-[13px] text-gray-400">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {countries.map(country => {
            const enabledPlans = country.planCount - Object.entries(overrides).filter(([k, v]) => v.enabled === false && drawerPkgs.find(p => p.packageCode === k && p.locationCode === country.locationCode)).length;
            const hasPopular  = Object.entries(overrides).some(([k, v]) => v.popular && drawerPkgs.find(p => p.packageCode === k && p.locationCode === country.locationCode));
            return (
              <button key={country.locationCode} onClick={() => { setSelectedCountry(country); setDrawerSearch(""); setDrawerSearchQ(""); setDrawerSort("default"); }}
                className="group relative rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-left">

                {/* Photo banner — scenic country photo as BG, flag as small badge */}
                <div className="relative h-32 overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
                  {/* Scenic country photo (Unsplash keyed by country name) */}
                  <img
                    src={`https://source.unsplash.com/featured/480x260/?${encodeURIComponent(country.locationName)},travel,landscape,city`}
                    alt={country.locationName}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => {
                      const img = e.target as HTMLImageElement;
                      // fallback to the flag image if Unsplash unavailable
                      if (!img.dataset.flagFallback) {
                        img.dataset.flagFallback = "1";
                        img.src = country.flagUrl;
                      }
                    }}
                  />
                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

                  {/* Plan count badge */}
                  <div className="absolute top-2.5 right-2.5">
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-1 rounded-lg bg-white/90 text-gray-800 backdrop-blur-sm shadow-sm">
                      <Package className="w-3 h-3" />
                      {country.planCount}
                    </span>
                  </div>

                  {/* Flag badge — top left */}
                  <div className="absolute top-2.5 left-2.5">
                    <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-lg px-1.5 py-1">
                      <img src={country.flagUrl} alt=""
                        className="w-5 h-3.5 object-cover rounded-[3px] shrink-0"
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  </div>

                  {/* Favorite star */}
                  {country.hasFavorite && (
                    <div className="absolute top-2.5 left-11">
                      <span className="text-[11px] drop-shadow">⭐</span>
                    </div>
                  )}

                  {/* Country name over gradient */}
                  <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                    <p className="text-white font-bold text-[13.5px] leading-snug truncate drop-shadow-sm">{country.locationName}</p>
                    <p className="text-white/60 text-[10px] font-mono tracking-wide">{country.locationCode}</p>
                  </div>
                </div>

                {/* Card body */}
                <div className="px-3 py-2.5 space-y-2">
                  {/* Price range */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">From</span>
                    <span className="text-[12.5px] font-bold text-emerald-600">{fmt$(country.minPriceCents)}</span>
                  </div>
                  {/* Type pills */}
                  <div className="flex flex-wrap gap-1">
                    {country.packageTypes.map(t => (
                      <span key={t} className={`inline-flex text-[9.5px] font-bold px-1.5 py-0.5 rounded-md border capitalize ${typePillStyle(t)}`}>{t}</span>
                    ))}
                  </div>
                </div>

                {/* Hover caret */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-green-400 transition-colors pointer-events-none" />
              </button>
            );
          })}
        </div>
      )}

      {/* ── Plans Drawer ─────────────────────────── */}
      {selectedCountry && (
        <div>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
            onClick={() => setSelectedCountry(null)} />

          {/* Slide-in panel */}
          <div className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-white shadow-2xl" style={{ width: 480 }}>

            {/* Panel header */}
            <div className="shrink-0 border-b border-gray-100">
              {/* Flag banner */}
              <div className="relative h-24 overflow-hidden">
                <img src={selectedCountry.flagUrl} alt={selectedCountry.locationName}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = "https://flagcdn.com/w160/un.png"; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <button onClick={() => setSelectedCountry(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
                  <h2 className="text-white font-bold text-[18px] leading-tight drop-shadow">{selectedCountry.locationName}</h2>
                  <p className="text-white/70 text-[12px] mt-0.5">{drawerData?.total ?? selectedCountry.planCount} plans available</p>
                </div>
              </div>

              {/* Search + sort inside drawer */}
              <div className="px-4 py-3 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input value={drawerSearch} onChange={e => setDrawerSearch(e.target.value)} placeholder="Search plans…"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-[12.5px] text-gray-700 outline-none focus:border-green-400 bg-gray-50 focus:bg-white transition-colors" />
                </div>
                <select value={drawerSort} onChange={e => setDrawerSort(e.target.value)}
                  className="px-2.5 py-2 rounded-xl border border-gray-200 text-[12px] text-gray-600 bg-gray-50 outline-none focus:border-green-400 cursor-pointer">
                  <option value="default">Default</option>
                  <option value="price_asc">Price ↑</option>
                  <option value="price_desc">Price ↓</option>
                  <option value="data_desc">Data ↓</option>
                </select>
              </div>

              {/* Column labels */}
              <div className="grid px-4 pb-2" style={{ gridTemplateColumns: "1fr auto" }}>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Plan</span>
                <div className="flex items-center gap-3 pr-1">
                  {["On","Pop","Rec","Best"].map(l => (
                    <span key={l} className="text-[9.5px] font-semibold text-gray-400 uppercase tracking-wide w-8 text-center">{l}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Plan list */}
            <div className="flex-1 overflow-y-auto py-2 px-3 space-y-2">
              {drawerLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-gray-100 p-4">
                    <div className="h-3.5 bg-gray-100 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                  </div>
                ))
              ) : drawerPkgs.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <p className="text-[13.5px] font-semibold text-gray-500">No plans found</p>
                  <p className="text-[12.5px] text-gray-400">Try adjusting your search</p>
                </div>
              ) : drawerPkgs.map(pkg => {
                const enabled   = ov(pkg.packageCode, "enabled",   true);
                const popular   = ov(pkg.packageCode, "popular",   false);
                const recommend = ov(pkg.packageCode, "recommend", false);
                const bestVal   = ov(pkg.packageCode, "bestValue", false);
                const mp        = mPct(pkg);
                const isBP      = pkg.isFavorite || bestVal;

                return (
                  <div key={pkg.packageCode}
                    className={`rounded-xl border transition-all ${enabled ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50/50 opacity-60"}`}>
                    <div className="p-3 flex items-start gap-3">
                      {/* Plan info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                          <span className="font-bold text-gray-900 text-[13px] leading-snug">{pkg.name}</span>
                          {isBP && <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">⭐ Best</span>}
                          {popular && <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">Popular</span>}
                        </div>

                        {/* Data + duration chips */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                            <Wifi className="w-2.5 h-2.5" />{pkg.dataGb}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-gray-50 text-gray-600 border border-gray-100">
                            <Clock className="w-2.5 h-2.5" />{pkg.durationLabel}
                          </span>
                          <span className={`inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded-md border capitalize ${typePillStyle(pkg.packageType)}`}>{pkg.packageType}</span>
                        </div>

                        {/* Pricing */}
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="text-gray-400">Cost <span className="font-medium text-gray-600">{fmt$(pkg.wholesalePriceCents)}</span></span>
                          <span className="text-gray-300">•</span>
                          <span className="text-gray-400">Sell <span className="font-bold text-emerald-600">{fmt$(pkg.retailPriceCents)}</span></span>
                          <span className="text-gray-300">•</span>
                          <span className="text-gray-400">Margin <span className="font-medium text-gray-600">{mp.toFixed(0)}%</span></span>
                        </div>
                      </div>

                      {/* Toggles */}
                      <div className="flex items-center gap-3 shrink-0 pt-0.5">
                        <CatalogToggle checked={enabled}   onChange={v => setOv(pkg.packageCode, "enabled",   v)} activeColor="#22c55e" label="On" />
                        <CatalogToggle checked={popular}   onChange={v => setOv(pkg.packageCode, "popular",   v)} activeColor="#f97316" label="Pop" />
                        <CatalogToggle checked={recommend} onChange={v => setOv(pkg.packageCode, "recommend", v)} activeColor="#14b8a6" label="Rec" />
                        <CatalogToggle checked={bestVal}   onChange={v => setOv(pkg.packageCode, "bestValue", v)} activeColor="#8b5cf6" label="Best" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Panel footer */}
            <div className="shrink-0 border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-gray-50/50">
              <p className="text-[12px] text-gray-400">
                {drawerPkgs.filter(p => ov(p.packageCode, "enabled", true)).length} of {drawerPkgs.length} plans enabled
              </p>
              <button onClick={() => setSelectedCountry(null)}
                className="px-4 py-2 rounded-xl bg-gray-900 text-white text-[12.5px] font-semibold hover:bg-gray-700 transition-colors">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Topup Packages page
───────────────────────────────────────────────── */
type TopupPkg = {
  packageCode: string; name: string; locationCode: string; locationName: string;
  dataGb: string; durationDays: number; durationLabel: string;
  retailPriceCents: number; wholesalePriceCents: number; flagUrl: string;
  packageType: "local" | "regional" | "global"; supportTopUpType: number;
};

function TopupPackagesPage() {
  const [lastSync, setLastSync] = useState<Record<string, string | null>>({
    esimaccess: null, airalo: null, "esim-go": null, maya: null,
  });
  const [syncing, setSyncing] = useState<string | null>(null);

  /* country grid */
  const [countrySearch, setCountrySearch]   = useState("");
  const [countrySearchQ, setCountrySearchQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setCountrySearchQ(countrySearch), 300);
    return () => clearTimeout(t);
  }, [countrySearch]);

  /* selected country drawer */
  const [selectedCountry, setSelectedCountry] = useState<CountryGroup | null>(null);
  const [drawerSearch, setDrawerSearch]       = useState("");
  const [drawerSearchQ, setDrawerSearchQ]     = useState("");
  const [drawerSort, setDrawerSort]           = useState("default");
  useEffect(() => {
    const t = setTimeout(() => setDrawerSearchQ(drawerSearch), 300);
    return () => clearTimeout(t);
  }, [drawerSearch]);

  /* country list (topup-only) */
  const cParams = new URLSearchParams({ topupOnly: "1" });
  if (countrySearchQ) cParams.set("search", countrySearchQ);
  const { data: countriesData, isLoading: countriesLoading, refetch: refetchCountries } = useQuery<{ countries: CountryGroup[]; total: number }>({
    queryKey: ["topup-countries", countrySearchQ],
    queryFn: () => fetch(`/api/admin/catalog-countries?${cParams}`).then(r => r.json()),
    staleTime: 2 * 60 * 1000,
  });
  const countries = countriesData?.countries ?? [];

  /* drawer packages (topup) */
  const dParams = new URLSearchParams({ pageSize: "100" });
  if (selectedCountry) dParams.set("locationCode", selectedCountry.locationCode);
  if (drawerSearchQ)   dParams.set("search", drawerSearchQ);
  if (drawerSort !== "default") dParams.set("sortBy", drawerSort);
  const { data: drawerData, isLoading: drawerLoading } = useQuery<{ packages: TopupPkg[]; total: number }>({
    queryKey: ["topup-drawer", selectedCountry?.locationCode, drawerSearchQ, drawerSort],
    queryFn: () => fetch(`/api/admin/topup-packages?${dParams}`).then(r => r.json()),
    enabled: !!selectedCountry,
  });
  const drawerPkgs = drawerData?.packages ?? [];

  async function handleSync(providerId: string) {
    if (syncing) return;
    setSyncing(providerId);
    await refetchCountries();
    setLastSync(prev => ({ ...prev, [providerId]: new Date().toISOString() }));
    setSyncing(null);
  }

  const PROVIDERS = [
    { id: "airalo",     full: "Airalo Topups",      letter: "A", active: false },
    { id: "esimaccess", full: "eSIM Access Topups", letter: "E", active: true  },
    { id: "esim-go",    full: "eSIM Go Topups",     letter: "G", active: false },
    { id: "maya",       full: "Maya Mobile Topups", letter: "M", active: false },
  ];

  const fmt$ = (c: number) => `$${(c / 100).toFixed(2)}`;

  const topupBadge = (t: number) =>
    t === 1
      ? <span className="inline-flex text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 border border-blue-200">Same Data</span>
      : <span className="inline-flex text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200">Any Topup</span>;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <LottieIcon src="/icons/wallet-add.json" size={24} autoplay loop />
          </div>
          <div>
            <h1 className="text-[26px] font-bold text-gray-900">Topup Packages</h1>
            <p className="text-[13.5px] text-gray-400 mt-0.5">Browse destinations and manage topup plans by country</p>
          </div>
        </div>
        <button onClick={() => handleSync("esimaccess")} disabled={syncing !== null}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm bg-white disabled:opacity-60">
          <RefreshCw className={`w-4 h-4 ${syncing !== null ? "animate-spin text-emerald-500" : ""}`} />
          Sync All
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {([
          { label: "Topup Destinations", value: (countriesData?.total ?? 0).toLocaleString(), icon: "/icons/wallet-add.json",          bg: "#f0fdf4", accent: "#22c55e" },
          { label: "eSIM Access Topups", value: (drawerData?.total ?? 0).toLocaleString(),    icon: "/icons/chart-presentation.json",   bg: "#f0fdf4", accent: "#10b981" },
          { label: "Airalo Topups",      value: "0",                                           icon: "/icons/simcard.json",              bg: "#eff6ff", accent: "#3b82f6" },
          { label: "Maya Mobile Topups", value: "0",                                           icon: "/icons/money-receive.json",        bg: "#fff7ed", accent: "#f97316" },
        ] as const).map(({ label, value, icon, bg, accent }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between group hover:shadow-md transition-shadow">
            <div className="min-w-0">
              <p className="text-[11.5px] font-semibold leading-snug truncate" style={{ color: accent }}>{label}</p>
              <p className="text-[28px] font-bold text-gray-900 mt-0.5 leading-none tracking-tight">{value}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ml-2 transition-transform group-hover:scale-110" style={{ background: bg }}>
              <LottieIcon src={icon} size={24} autoplay loop />
            </div>
          </div>
        ))}
      </div>

      {/* ── Sync status ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-[15px] font-bold text-gray-900 mb-3">Provider Sync Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {PROVIDERS.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-gray-50/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                  style={{ background: p.active ? "#22c55e" : "#94a3b8" }}>{p.letter}</div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-bold text-gray-800 truncate">{p.full}</p>
                  <p className="text-[11px] text-gray-400">Last: <span className="font-medium">{fmtRelTime(lastSync[p.id] ?? null)}</span></p>
                </div>
              </div>
              <button onClick={() => handleSync(p.id)} disabled={!p.active || syncing !== null}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold transition-colors shrink-0 ml-2 ${p.active ? "text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-60" : "text-gray-400 border border-gray-200 bg-white cursor-not-allowed"}`}>
                <RefreshCw className={`w-3 h-3 ${syncing === p.id ? "animate-spin" : ""}`} />
                Sync
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-[400px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={countrySearch} onChange={e => setCountrySearch(e.target.value)}
            placeholder="Search topup destinations…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 placeholder-gray-400 outline-none focus:border-green-400 bg-white transition-colors shadow-sm" />
        </div>
        <span className="ml-auto text-[12.5px] text-gray-400 whitespace-nowrap">{countries.length} destinations</span>
      </div>

      {/* ── Country grid ── */}
      {countriesLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl overflow-hidden border border-gray-200 bg-white">
              <div className="h-32 bg-gray-100" />
              <div className="p-3 space-y-2"><div className="h-3 bg-gray-100 rounded w-3/4" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>
            </div>
          ))}
        </div>
      ) : countries.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center bg-white rounded-2xl border border-gray-200">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
            <LottieIcon src="/icons/wallet-add.json" size={32} autoplay loop />
          </div>
          <p className="text-[15px] font-semibold text-gray-600">No topup destinations found</p>
          <p className="text-[13px] text-gray-400">Sync providers to fetch topup packages</p>
          <button onClick={() => handleSync("esimaccess")} disabled={syncing !== null}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-60"
            style={{ background: "#22c55e" }}>
            <RefreshCw className={`w-4 h-4 ${syncing !== null ? "animate-spin" : ""}`} />
            Sync eSIM Access Topups
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {countries.map(country => (
            <button key={country.locationCode}
              onClick={() => { setSelectedCountry(country); setDrawerSearch(""); setDrawerSearchQ(""); setDrawerSort("default"); }}
              className="group relative rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-left">
              <div className="relative h-32 overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
                <img src={`https://source.unsplash.com/featured/480x260/?${encodeURIComponent(country.locationName)},travel,landscape`}
                  alt={country.locationName}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => { const img = e.target as HTMLImageElement; if (!img.dataset.f) { img.dataset.f="1"; img.src=country.flagUrl; } }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                <div className="absolute top-2.5 right-2.5">
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-1 rounded-lg bg-white/90 text-gray-800 backdrop-blur-sm shadow-sm">
                    <RefreshCw className="w-2.5 h-2.5" />{country.planCount}
                  </span>
                </div>
                <div className="absolute top-2.5 left-2.5">
                  <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-lg px-1.5 py-1">
                    <img src={country.flagUrl} alt="" className="w-5 h-3.5 object-cover rounded-[3px] shrink-0"
                      onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                  <p className="text-white font-bold text-[13.5px] leading-snug truncate drop-shadow-sm">{country.locationName}</p>
                  <p className="text-white/60 text-[10px] font-mono">{country.locationCode}</p>
                </div>
              </div>
              <div className="px-3 py-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">From</span>
                  <span className="text-[12.5px] font-bold text-emerald-600">{fmt$(country.minPriceCents)}</span>
                </div>
                <span className="inline-flex text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">Topup Ready</span>
              </div>
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-emerald-400 transition-colors pointer-events-none" />
            </button>
          ))}
        </div>
      )}

      {/* ── Plans drawer ── */}
      {selectedCountry && (
        <div>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]" onClick={() => setSelectedCountry(null)} />
          <div className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-white shadow-2xl" style={{ width: 500 }}>
            <div className="shrink-0 border-b border-gray-100">
              <div className="relative h-24 overflow-hidden">
                <img src={selectedCountry.flagUrl} alt={selectedCountry.locationName}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = "https://flagcdn.com/w640/un.png"; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <button onClick={() => setSelectedCountry(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
                  <h2 className="text-white font-bold text-[18px] drop-shadow">{selectedCountry.locationName}</h2>
                  <p className="text-white/70 text-[12px]">{drawerData?.total ?? selectedCountry.planCount} topup plans</p>
                </div>
              </div>
              <div className="px-4 py-3 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input value={drawerSearch} onChange={e => setDrawerSearch(e.target.value)} placeholder="Search topup plans…"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-[12.5px] text-gray-700 outline-none focus:border-emerald-400 bg-gray-50 focus:bg-white transition-colors" />
                </div>
                <select value={drawerSort} onChange={e => setDrawerSort(e.target.value)}
                  className="px-2.5 py-2 rounded-xl border border-gray-200 text-[12px] text-gray-600 bg-gray-50 outline-none cursor-pointer">
                  <option value="default">Default</option>
                  <option value="price_asc">Price ↑</option>
                  <option value="data_desc">Data ↓</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2 px-3 space-y-2">
              {drawerLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-gray-100 p-4">
                    <div className="h-3.5 bg-gray-100 rounded w-1/2 mb-2" /><div className="h-3 bg-gray-100 rounded w-3/4" />
                  </div>
                ))
              ) : drawerPkgs.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <p className="text-[13.5px] font-semibold text-gray-500">No topup plans found</p>
                  <p className="text-[12.5px] text-gray-400">Try syncing providers first</p>
                </div>
              ) : drawerPkgs.map(pkg => (
                <div key={pkg.packageCode} className="rounded-xl border border-gray-200 bg-white p-3">
                  <p className="font-bold text-gray-900 text-[13px] leading-snug mb-1.5">{pkg.name}</p>
                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                      <Wifi className="w-2.5 h-2.5" />{pkg.dataGb}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-gray-50 text-gray-600 border border-gray-100">
                      <Clock className="w-2.5 h-2.5" />{pkg.durationLabel}
                    </span>
                    {topupBadge(pkg.supportTopUpType)}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      <span>Cost <span className="font-medium text-gray-600">{fmt$(pkg.wholesalePriceCents)}</span></span>
                      <span className="text-gray-200">•</span>
                      <span>Sell <span className="font-bold text-emerald-600">{fmt$(pkg.retailPriceCents)}</span></span>
                    </div>
                    <span className="inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="shrink-0 border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-gray-50/50">
              <p className="text-[12px] text-gray-400">{drawerPkgs.length} topup plans</p>
              <button onClick={() => setSelectedCountry(null)}
                className="px-4 py-2 rounded-xl bg-gray-900 text-white text-[12.5px] font-semibold hover:bg-gray-700 transition-colors">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Regions page
───────────────────────────────────────────────── */
type RegionItem = {
  prefix: string; name: string; slug: string;
  packageCount: number; countriesCount: number;
  esimAccessCount: number; airaloCount: number; esimGoCount: number;
};

type RegionOverride = { status?: boolean; popular?: boolean };

function RegionsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch]     = useState("");
  const [searchQ, setSearchQ]   = useState("");
  const [syncing, setSyncing]   = useState(false);
  const [selected, setSelected] = useState<RegionItem | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearchQ(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const [overrides, setOverrides] = useState<Record<string, RegionOverride>>(() => {
    try { return JSON.parse(localStorage.getItem("voltey-region-overrides") ?? "{}"); }
    catch { return {}; }
  });

  const setOv = (slug: string, field: keyof RegionOverride, val: boolean) =>
    setOverrides(prev => {
      const next = { ...prev, [slug]: { ...(prev[slug] ?? {}), [field]: val } };
      localStorage.setItem("voltey-region-overrides", JSON.stringify(next));
      return next;
    });

  const ov = (slug: string, field: keyof RegionOverride, def: boolean) =>
    overrides[slug]?.[field] ?? def;

  const { data, isLoading } = useQuery<{ regions: RegionItem[]; total: number; totalPackages: number }>({
    queryKey: ["admin-regions"],
    queryFn: () => fetch("/api/admin/regions").then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const allRegions  = data?.regions ?? [];
  const totalPkgs   = data?.totalPackages ?? 0;
  const activeCount = allRegions.filter(r => ov(r.slug, "status", true)).length;

  const filtered = searchQ.trim()
    ? allRegions.filter(r =>
        r.name.toLowerCase().includes(searchQ.toLowerCase()) ||
        r.slug.toLowerCase().includes(searchQ.toLowerCase()) ||
        r.prefix.toLowerCase().includes(searchQ.toLowerCase()))
    : allRegions;

  async function handleSync() {
    setSyncing(true);
    await queryClient.invalidateQueries({ queryKey: ["admin-regions"] });
    setSyncing(false);
  }

  /* Region → scenic keyword map for Unsplash */
  const regionPhoto = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("europe"))      return "europe,city,architecture";
    if (n.includes("asia"))        return "asia,city,landscape";
    if (n.includes("africa"))      return "africa,savanna,landscape";
    if (n.includes("middle east")) return "dubai,desert,city";
    if (n.includes("caribbean"))   return "caribbean,beach,ocean";
    if (n.includes("pacific"))     return "pacific,ocean,island";
    if (n.includes("latin") || n.includes("south america")) return "south+america,landscape,city";
    if (n.includes("north america")) return "north+america,city,landscape";
    if (n.includes("central asia")) return "central+asia,steppe,mountains";
    if (n.includes("scandinavia")) return "scandinavia,fjord,landscape";
    if (n.includes("balkan"))      return "balkans,city,landscape";
    return `${encodeURIComponent(name)},travel,landscape`;
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
            <LottieIcon src="/icons/global.json" size={32} autoplay loop />
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-gray-900">Regions</h1>
            <p className="text-[13.5px] text-gray-400 mt-0.5">Manage multi-country regional packages</p>
          </div>
        </div>
        <button onClick={handleSync} disabled={syncing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13.5px] font-semibold text-white transition-colors disabled:opacity-60 shadow-sm"
          style={{ background: "#22c55e" }}>
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          Sync Regions
        </button>
      </div>

      {/* ── 3 stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {([
          { label: "Total Regions",  value: allRegions.length, icon: "/icons/global.json",       bg: "#eff6ff", accent: "#3b82f6" },
          { label: "Active Regions", value: activeCount,        icon: "/icons/profile-tick.json", bg: "#f0fdf4", accent: "#22c55e" },
          { label: "Total Packages", value: totalPkgs,          icon: "/icons/category.json",     bg: "#fdf4ff", accent: "#a855f7" },
        ] as const).map(({ label, value, icon, bg, accent }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center justify-between group hover:shadow-md transition-shadow">
            <div>
              <p className="text-[13px] font-semibold mb-2" style={{ color: accent }}>{label}</p>
              <p className="text-[40px] font-bold text-gray-900 leading-none tracking-tight">{(value as number).toLocaleString()}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110" style={{ background: bg }}>
              <LottieIcon src={icon} size={32} autoplay loop />
            </div>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-[400px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search regions…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 placeholder-gray-400 outline-none focus:border-blue-400 bg-white transition-colors shadow-sm" />
        </div>
        <span className="ml-auto text-[12.5px] text-gray-400 whitespace-nowrap">{filtered.length} regions</span>
      </div>

      {/* ── Region grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl overflow-hidden border border-gray-200 bg-white">
              <div className="h-32 bg-gray-100" />
              <div className="p-3 space-y-2"><div className="h-3 bg-gray-100 rounded w-3/4" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center bg-white rounded-2xl border border-gray-200">
          <LottieIcon src="/icons/global.json" size={40} autoplay loop />
          <p className="text-[15px] font-semibold text-gray-600">No regions found</p>
          <p className="text-[12.5px] text-gray-400">Try syncing or adjusting your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(region => {
            const status  = ov(region.slug, "status",  true);
            const popular = ov(region.slug, "popular", false);
            return (
              <button key={region.prefix}
                onClick={() => setSelected(region)}
                className="group relative rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-left">
                {/* Card photo */}
                <div className="relative h-32 overflow-hidden bg-gradient-to-br from-blue-200 to-blue-400">
                  <img src={`https://source.unsplash.com/featured/480x260/?${regionPhoto(region.name)}`}
                    alt={region.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => { (e.target as HTMLImageElement).style.opacity = "0"; }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                  {/* Status dot */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className={`inline-flex w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${status ? "bg-emerald-400" : "bg-gray-400"}`} />
                  </div>
                  {/* Plan count */}
                  <div className="absolute top-2.5 right-2.5">
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-1 rounded-lg bg-white/90 text-gray-800 backdrop-blur-sm shadow-sm">
                      <Package className="w-3 h-3" />{region.packageCount}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                    <p className="text-white font-bold text-[13.5px] leading-snug truncate drop-shadow-sm">{region.name}</p>
                    <p className="text-white/60 text-[10px] font-mono">{region.prefix}</p>
                  </div>
                </div>
                {/* Card body */}
                <div className="px-3 py-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">{region.countriesCount} countries</span>
                    {popular && <span className="inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-600 border border-orange-200">Popular</span>}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className={`inline-flex text-[9.5px] font-bold px-1.5 py-0.5 rounded-md border ${status ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                      {status ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-blue-400 transition-colors pointer-events-none" />
              </button>
            );
          })}
        </div>
      )}

      {/* ── Region drawer ── */}
      {selected && (
        <div>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]" onClick={() => setSelected(null)} />
          <div className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-white shadow-2xl" style={{ width: 460 }}>
            {/* Banner */}
            <div className="shrink-0">
              <div className="relative h-28 overflow-hidden bg-gradient-to-br from-blue-400 to-blue-700">
                <img src={`https://source.unsplash.com/featured/920x260/?${regionPhoto(selected.name)}`}
                  alt={selected.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.opacity = "0"; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <button onClick={() => setSelected(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
                  <h2 className="text-white font-bold text-[20px] drop-shadow">{selected.name}</h2>
                  <p className="text-white/70 text-[12px] font-mono">{selected.prefix} · {selected.slug}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto py-4 px-4 space-y-4">

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Countries", value: selected.countriesCount, color: "#3b82f6" },
                  { label: "Packages",  value: selected.packageCount,   color: "#22c55e" },
                  { label: "eSIM Access", value: selected.esimAccessCount, color: "#a855f7" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                    <p className="text-[22px] font-bold leading-none" style={{ color }}>{value}</p>
                    <p className="text-[11px] text-gray-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {/* Provider breakdown */}
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 space-y-2">
                <p className="text-[12px] font-bold text-gray-700 mb-2">Provider Breakdown</p>
                {[
                  { name: "eSIM Access", count: selected.esimAccessCount, color: "#22c55e",  letter: "E" },
                  { name: "Airalo",      count: selected.airaloCount,     color: "#3b82f6",  letter: "A" },
                  { name: "eSIM Go",     count: selected.esimGoCount,     color: "#a855f7",  letter: "G" },
                ].map(({ name, count, color, letter }) => (
                  <div key={name} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ background: color }}>{letter}</div>
                    <span className="text-[12.5px] text-gray-700 flex-1">{name}</span>
                    <span className="text-[12.5px] font-bold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>

              {/* Toggles */}
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="text-[13.5px] font-semibold text-gray-800">Active in Storefront</p>
                    <p className="text-[12px] text-gray-400">Show this region to customers</p>
                  </div>
                  <CatalogToggle checked={ov(selected.slug, "status", true)} onChange={v => setOv(selected.slug, "status", v)} activeColor="#22c55e" />
                </div>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="text-[13.5px] font-semibold text-gray-800">Mark as Popular</p>
                    <p className="text-[12px] text-gray-400">Feature in popular destinations</p>
                  </div>
                  <CatalogToggle checked={ov(selected.slug, "popular", false)} onChange={v => setOv(selected.slug, "popular", v)} activeColor="#f97316" />
                </div>
              </div>

              {/* Info rows */}
              <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100">
                {[
                  { label: "Slug",        value: selected.slug },
                  { label: "Prefix Code", value: selected.prefix },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3">
                    <span className="text-[12.5px] text-gray-500">{label}</span>
                    <span className="text-[12.5px] font-mono font-semibold text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="shrink-0 border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-gray-50/50">
              <p className="text-[12px] text-gray-400">{selected.packageCount} packages · {selected.countriesCount} countries</p>
              <button onClick={() => setSelected(null)}
                className="px-4 py-2 rounded-xl bg-gray-900 text-white text-[12.5px] font-semibold hover:bg-gray-700 transition-colors">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Referral Program page
───────────────────────────────────────────────── */
type ReferralSettings = {
  enabled: boolean;
  rewardType: "percentage" | "fixed";
  rewardValue: number;
  referredDiscount: number;
  minOrderAmount: number;
  expiryDays: number;
  termsAndConditions: string;
};

const DEFAULT_REFERRAL_SETTINGS: ReferralSettings = {
  enabled: true, rewardType: "percentage", rewardValue: 10,
  referredDiscount: 10, minOrderAmount: 0, expiryDays: 90, termsAndConditions: "",
};

function ReferralProgramPage() {
  const [activeTab, setActiveTab] = useState<"settings" | "referrals" | "analytics">("settings");

  const [settings, setSettings] = useState<ReferralSettings>(() => {
    try {
      return { ...DEFAULT_REFERRAL_SETTINGS, ...JSON.parse(localStorage.getItem("voltey-referral-settings") ?? "{}") };
    } catch { return DEFAULT_REFERRAL_SETTINGS; }
  });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const setS = (k: keyof ReferralSettings, v: ReferralSettings[keyof ReferralSettings]) =>
    setSettings(p => ({ ...p, [k]: v }));

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    localStorage.setItem("voltey-referral-settings", JSON.stringify(settings));
    setTimeout(() => { setSaving(false); setSavedMsg(true); }, 400);
    setTimeout(() => setSavedMsg(false), 2500);
  }

  const STAT_CARDS = [
    { label: "Total Referrals",  value: "0",     icon: "/icons/category.json",      bg: "#f0fdf4" },
    { label: "Successful",       value: "0",     icon: "/icons/profile-tick.json",  bg: "#eff6ff" },
    { label: "Pending Rewards",  value: "0",     icon: "/icons/note-text.json",     bg: "#f0faf7" },
    { label: "Total Rewards Paid", value: "$0.00", icon: "/icons/money-receive.json", bg: "#fdf4ff" },
  ];

  const INNER_TABS = [
    { id: "settings",   label: "Settings",   Icon: Settings   },
    { id: "referrals",  label: "Referrals",  Icon: Users      },
    { id: "analytics",  label: "Analytics",  Icon: BarChart2  },
  ] as const;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
            <LottieIcon src="/icons/user-add.json" size={32} autoplay loop />
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-gray-900">Referral Program</h1>
            <p className="text-[13.5px] text-gray-400 mt-0.5">Manage and track your referral program</p>
          </div>
        </div>
        {/* Enabled pill */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 shadow-sm">
          <span className="text-[13px] font-semibold text-gray-700">Program Status</span>
          <CatalogToggle checked={settings.enabled} onChange={v => setS("enabled", v)} activeColor="#22c55e" />
          <span className={`text-[12.5px] font-bold ${settings.enabled ? "text-emerald-600" : "text-gray-400"}`}>
            {settings.enabled ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* ── Inner tab bar ── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          {INNER_TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-6 py-4 text-[13.5px] font-semibold transition-colors border-b-2 ${
                activeTab === id
                  ? "border-emerald-500 text-emerald-700 bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-white/60"
              }`}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Settings tab ── */}
        {activeTab === "settings" && (
          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div>
              <h2 className="text-[17px] font-bold text-gray-900">Program Settings</h2>
              <p className="text-[13px] text-gray-400 mt-0.5">Configure the referral program settings</p>
            </div>

            {/* Enable toggle */}
            <div className="flex items-center justify-between py-4 border-b border-gray-100">
              <div>
                <p className="text-[14px] font-bold text-gray-800">Enable Referral Program</p>
                <p className="text-[13px] text-gray-400 mt-0.5">Enable or disable the referral program</p>
              </div>
              <CatalogToggle checked={settings.enabled} onChange={v => setS("enabled", v)} activeColor="#22c55e" />
            </div>

            {/* Reward Type */}
            <div>
              <p className="text-[14px] font-bold text-gray-800 mb-3">Reward Type</p>
              <div className="flex gap-6">
                {([
                  ["percentage", "Percentage (%)"],
                  ["fixed",      "Fixed Amount ($)"],
                ] as [ReferralSettings["rewardType"], string][]).map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2.5 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${settings.rewardType === val ? "border-emerald-500" : "border-gray-300 group-hover:border-emerald-300"}`}>
                      {settings.rewardType === val && (
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#22c55e" }} />
                      )}
                    </div>
                    <input type="radio" className="hidden" checked={settings.rewardType === val} onChange={() => setS("rewardType", val)} />
                    <span className={`text-[14px] font-semibold ${settings.rewardType === val ? "text-gray-900" : "text-gray-500"}`}>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 2-col grid: Reward Value + Referred Discount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[13.5px] font-bold text-gray-800 mb-2">
                  Reward Value {settings.rewardType === "percentage" ? "(%)" : "($)"}
                </label>
                <div className="relative">
                  <input value={settings.rewardValue}
                    onChange={e => setS("rewardValue", parseFloat(e.target.value) || 0)}
                    type="number" min="0" step="0.1"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] font-semibold text-gray-900 outline-none focus:border-green-400 transition-colors bg-white" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-bold text-gray-400">
                    {settings.rewardType === "percentage" ? "%" : "$"}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-[13.5px] font-bold text-gray-800 mb-2">Referred User Discount (%)</label>
                <div className="relative">
                  <input value={settings.referredDiscount}
                    onChange={e => setS("referredDiscount", parseFloat(e.target.value) || 0)}
                    type="number" min="0" step="0.1"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] font-semibold text-gray-900 outline-none focus:border-green-400 transition-colors bg-white" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-bold text-gray-400">%</span>
                </div>
              </div>
            </div>

            {/* 2-col grid: Min Order + Expiry Days */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[13.5px] font-bold text-gray-800 mb-2">Minimum Order Amount ($)</label>
                <div className="relative">
                  <input value={settings.minOrderAmount}
                    onChange={e => setS("minOrderAmount", parseFloat(e.target.value) || 0)}
                    type="number" min="0" step="0.01"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] font-semibold text-gray-900 outline-none focus:border-green-400 transition-colors bg-white" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-bold text-gray-400">$</span>
                </div>
              </div>
              <div>
                <label className="block text-[13.5px] font-bold text-gray-800 mb-2">Reward Expiry Days</label>
                <input value={settings.expiryDays}
                  onChange={e => setS("expiryDays", parseInt(e.target.value) || 0)}
                  type="number" min="1" step="1"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] font-semibold text-gray-900 outline-none focus:border-green-400 transition-colors bg-white" />
              </div>
            </div>

            {/* Terms & Conditions */}
            <div>
              <label className="block text-[13.5px] font-bold text-gray-800 mb-2">Terms & Conditions <span className="font-normal text-gray-400">(optional)</span></label>
              <textarea value={settings.termsAndConditions}
                onChange={e => setS("termsAndConditions", e.target.value)}
                rows={4} placeholder="Enter terms and conditions…"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[13.5px] text-gray-700 outline-none focus:border-green-400 transition-colors bg-white resize-none placeholder-gray-400" />
            </div>

            {/* Save button */}
            <div className="flex items-center gap-4">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-bold text-white disabled:opacity-60 shadow-sm transition-colors"
                style={{ background: "#22c55e" }}>
                {saving
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</>
                  : <><CheckCircle className="w-4 h-4" /> Save Settings</>
                }
              </button>
              {savedMsg && (
                <div className="flex items-center gap-2 text-[13.5px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                  <Check className="w-4 h-4" /> Settings saved successfully
                </div>
              )}
            </div>
          </form>
        )}

        {/* ── Referrals tab ── */}
        {activeTab === "referrals" && (
          <div className="p-6 space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {STAT_CARDS.map(({ label, value, icon, bg }) => (
                <div key={label} className="bg-gray-50 rounded-2xl border border-gray-100 p-5 flex items-center justify-between group hover:shadow-sm transition-shadow">
                  <div>
                    <p className="text-[12px] font-semibold text-gray-500 mb-1.5 leading-tight">{label}</p>
                    <p className="text-[32px] font-bold text-gray-900 leading-none tracking-tight">{value}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                    style={{ background: bg }}>
                    <LottieIcon src={icon} size={28} autoplay loop />
                  </div>
                </div>
              ))}
            </div>

            {/* Referrals table header */}
            <div>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h3 className="text-[16px] font-bold text-gray-900">All Referrals</h3>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input placeholder="Search referrals…"
                    className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-[13px] placeholder-gray-400 outline-none focus:border-green-400 transition-colors bg-gray-50 focus:bg-white w-52" />
                </div>
              </div>
              {/* Empty state */}
              <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 py-20 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center">
                  <LottieIcon src="/icons/category.json" size={36} autoplay loop />
                </div>
                <p className="text-[16px] font-bold text-gray-500">No referrals yet</p>
                <p className="text-[13px] text-gray-400 text-center max-w-xs">
                  Once customers start using referral codes, their referrals will appear here
                </p>
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 mt-1">
                  <span className="text-[12.5px] text-gray-500">Share link format:</span>
                  <code className="text-[12.5px] font-mono font-bold text-gray-700">?ref=CODE</code>
                  <button className="p-1 rounded text-gray-400 hover:text-gray-700 transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Analytics tab ── */}
        {activeTab === "analytics" && (
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-[17px] font-bold text-gray-900">Referral Analytics</h2>
              <p className="text-[13px] text-gray-400 mt-0.5">Track referral performance and reward distribution</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
              {STAT_CARDS.map(({ label, value, icon, bg }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center justify-between group hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-[13px] font-semibold text-gray-500 mb-2">{label}</p>
                    <p className="text-[38px] font-bold text-gray-900 leading-none tracking-tight">{value}</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                    style={{ background: bg }}>
                    <LottieIcon src={icon} size={32} autoplay loop />
                  </div>
                </div>
              ))}
            </div>

            {/* Program summary */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-[16px] font-bold text-gray-900">Program Configuration</h3>
                <p className="text-[12.5px] text-gray-400 mt-0.5">Current active settings</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Status",             value: settings.enabled ? "Active" : "Inactive",             color: settings.enabled ? "text-emerald-600" : "text-gray-400" },
                    { label: "Reward Type",         value: settings.rewardType === "percentage" ? "Percentage" : "Fixed Amount", color: "text-gray-900" },
                    { label: "Reward Value",        value: settings.rewardType === "percentage" ? `${settings.rewardValue}%` : `$${settings.rewardValue}`, color: "text-gray-900" },
                    { label: "Referred Discount",   value: `${settings.referredDiscount}%`,                     color: "text-gray-900" },
                    { label: "Min Order Amount",    value: `$${settings.minOrderAmount.toFixed(2)}`,            color: "text-gray-900" },
                    { label: "Reward Expiry",       value: `${settings.expiryDays} days`,                       color: "text-gray-900" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-4">
                      <p className="text-[11.5px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{label}</p>
                      <p className={`text-[15px] font-bold ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Empty chart placeholder */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-[16px] font-bold text-gray-900">Referral Trend</h3>
                <p className="text-[12.5px] text-gray-400 mt-0.5">Monthly referral activity</p>
              </div>
              <div className="py-20 flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                  <LottieIcon src="/icons/chart.json" size={32} autoplay loop />
                </div>
                <p className="text-[15px] font-bold text-gray-400">No data yet</p>
                <p className="text-[13px] text-gray-400">Referral trend data will appear here once the program is active</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Gift Cards page
───────────────────────────────────────────────── */
type GiftCardRow = {
  id: string; code: string; amount: string; balance: string; theme: string;
  recipientName: string | null; recipientEmail: string | null; personalMessage: string | null;
  status: string; redeemedAt: string | null; sentAt: string | null;
  expiresAt: string; createdAt: string;
};
type GiftCardStats = { total: number; active: number; totalValue: string; redeemed: string; pendingDelivery: number };
type GiftCardsResp  = { cards: GiftCardRow[]; total: number; stats: GiftCardStats };

const emptyGCStats: GiftCardStats = { total: 0, active: 0, totalValue: "0", redeemed: "0", pendingDelivery: 0 };

const QUICK_AMTS = ["10", "25", "50", "100", "200"];
const GC_THEMES  = ["Default", "Birthday", "Anniversary", "Travel", "Business"];

function genGiftCode() {
  const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const s = () => Array.from({ length: 4 }, () => c[Math.floor(Math.random() * c.length)]).join("");
  return `GC-${s()}-${s()}-${s()}-${s()}`;
}

function gcEffectiveStatus(card: GiftCardRow) {
  if (new Date(card.expiresAt) < new Date()) return "expired";
  return card.status;
}

function GcStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    active:   "bg-emerald-50 text-emerald-700 border-emerald-200",
    redeemed: "bg-blue-50 text-blue-700 border-blue-200",
    inactive: "bg-gray-50 text-gray-500 border-gray-200",
    expired:  "bg-red-50 text-red-600 border-red-200",
  };
  return (
    <span className={`inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full border capitalize ${cfg[status] ?? cfg.inactive}`}>
      {status}
    </span>
  );
}

function GiftCardsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch]       = useState("");
  const [searchQ, setSearchQ]     = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showBulk, setShowBulk]   = useState(false);
  const [viewCard, setViewCard]   = useState<GiftCardRow | null>(null);
  const [creating, setCreating]   = useState(false);
  const [bulkGenning, setBulkGenning] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);
  const [bulkErr, setBulkErr]     = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [copyMsg, setCopyMsg]     = useState<string | null>(null);

  /* create form */
  const yearFromNow = new Date(); yearFromNow.setFullYear(yearFromNow.getFullYear() + 1);
  const [selAmt, setSelAmt]   = useState("10");
  const [custAmt, setCustAmt] = useState("");
  const [theme, setTheme]     = useState("Default");
  const [rcptName, setRcptName]   = useState("");
  const [rcptEmail, setRcptEmail] = useState("");
  const [message, setMessage]   = useState("");
  const [expiresAt, setExpiresAt] = useState(yearFromNow.toISOString().split("T")[0]);

  /* bulk form */
  const [bulkCount, setBulkCount]   = useState("10");
  const [bulkAmount, setBulkAmount] = useState("25");

  useEffect(() => {
    const t = setTimeout(() => setSearchQ(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const qp = new URLSearchParams();
  if (searchQ)                qp.set("search", searchQ);
  if (statusFilter !== "all") qp.set("status", statusFilter);

  const { data, isLoading } = useQuery<GiftCardsResp>({
    queryKey: ["admin-gift-cards", searchQ, statusFilter],
    queryFn: () => fetch(`/api/admin/gift-cards?${qp}`).then(r => r.json()),
    placeholderData: prev => prev,
    staleTime: 60_000,
  });

  const cards = data?.cards ?? [];
  const stats = data?.stats ?? emptyGCStats;

  function resetCreate() {
    setSelAmt("10"); setCustAmt(""); setTheme("Default");
    setRcptName(""); setRcptEmail(""); setMessage("");
    const d = new Date(); d.setFullYear(d.getFullYear() + 1);
    setExpiresAt(d.toISOString().split("T")[0]);
    setCreateErr(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const amount = selAmt === "custom" ? custAmt : selAmt;
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setCreateErr("Please enter a valid amount"); return;
    }
    setCreating(true); setCreateErr(null);
    try {
      const res = await fetch("/api/admin/gift-cards", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount, theme,
          recipientName:   rcptName   || null,
          recipientEmail:  rcptEmail  || null,
          personalMessage: message    || null,
          expiresAt: new Date(expiresAt).toISOString(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      await queryClient.invalidateQueries({ queryKey: ["admin-gift-cards"] });
      setShowCreate(false); resetCreate();
    } catch (err: unknown) {
      setCreateErr(err instanceof Error ? err.message : "Unknown error");
    } finally { setCreating(false); }
  }

  async function handleBulk(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(bulkCount) || 0;
    const a = parseFloat(bulkAmount) || 0;
    if (n < 1 || n > 500) { setBulkErr("Number must be 1–500"); return; }
    if (a <= 0)            { setBulkErr("Amount must be > 0"); return; }
    setBulkGenning(true); setBulkErr(null);
    try {
      const res = await fetch("/api/admin/gift-cards/bulk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: n, amount: a }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      await queryClient.invalidateQueries({ queryKey: ["admin-gift-cards"] });
      setShowBulk(false); setBulkCount("10"); setBulkAmount("25");
    } catch (err: unknown) {
      setBulkErr(err instanceof Error ? err.message : "Unknown error");
    } finally { setBulkGenning(false); }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/admin/gift-cards/${id}`, { method: "DELETE" });
    await queryClient.invalidateQueries({ queryKey: ["admin-gift-cards"] });
    setDeletingId(null);
  }

  async function handleToggle(card: GiftCardRow) {
    const next = card.status === "active" ? "inactive" : "active";
    setTogglingId(card.id);
    await fetch(`/api/admin/gift-cards/${card.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    await queryClient.invalidateQueries({ queryKey: ["admin-gift-cards"] });
    setTogglingId(null);
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopyMsg(code); setTimeout(() => setCopyMsg(null), 1800);
    });
  }

  const STAT_CARDS = [
    { label: "Total Cards",       value: stats.total.toLocaleString(),                              icon: "/icons/category.json",      bg: "#f0fdf4" },
    { label: "Active Cards",      value: stats.active.toLocaleString(),                             icon: "/icons/profile-tick.json",  bg: "#eff6ff" },
    { label: "Total Value",       value: `$${parseFloat(stats.totalValue || "0").toFixed(2)}`,      icon: "/icons/money-receive.json", bg: "#fdf4ff" },
    { label: "Redeemed",          value: `$${parseFloat(stats.redeemed  || "0").toFixed(2)}`,       icon: "/icons/chart.json",         bg: "#f0faf7" },
    { label: "Pending Delivery",  value: stats.pendingDelivery.toLocaleString(),                    icon: "/icons/note-text.json",     bg: "#fff1f2" },
  ];

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
            <LottieIcon src="/icons/category.json" size={32} autoplay loop />
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-gray-900">Gift Card Management</h1>
            <p className="text-[13.5px] text-gray-400 mt-0.5">Create and manage gift cards</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowBulk(true); setBulkErr(null); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            <Users className="w-4 h-4" /> Bulk Generate
          </button>
          <button onClick={() => { setShowCreate(true); resetCreate(); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13.5px] font-semibold text-white shadow-sm transition-colors"
            style={{ background: "#22c55e" }}>
            <Plus className="w-4 h-4" /> Create Gift Card
          </button>
        </div>
      </div>

      {/* ── 5 stat cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {STAT_CARDS.map(({ label, value, icon, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between group hover:shadow-md transition-shadow">
            <div>
              <p className="text-[12px] font-semibold text-gray-500 mb-1.5 leading-tight">{label}</p>
              <p className="text-[32px] font-bold text-gray-900 leading-none tracking-tight">{value}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
              style={{ background: bg }}>
              <LottieIcon src={icon} size={28} autoplay loop />
            </div>
          </div>
        ))}
      </div>

      {/* ── Gift Cards card ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">

        {/* Card header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-[18px] font-bold text-gray-900">Gift Cards</h2>
            <p className="text-[13px] text-gray-400 mt-0.5">{stats.total} card{stats.total !== 1 ? "s" : ""} generated</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by code, email, or name…"
                className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-[13px] placeholder-gray-400 outline-none focus:border-green-400 transition-colors bg-gray-50 focus:bg-white w-64" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-[12.5px] text-gray-600 bg-gray-50 outline-none focus:border-green-400 cursor-pointer">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="redeemed">Redeemed</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Table / empty */}
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="py-24 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <LottieIcon src="/icons/category.json" size={36} autoplay loop />
            </div>
            <p className="text-[16px] font-bold text-gray-500">No gift cards found</p>
            <p className="text-[13px] text-gray-400">Create your first gift card to get started</p>
            <button onClick={() => { setShowCreate(true); resetCreate(); }}
              className="mt-1 px-5 py-2.5 rounded-xl text-[13.5px] font-semibold text-white shadow-sm"
              style={{ background: "#22c55e" }}>
              + Create Gift Card
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px] min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {["Code", "Amount / Balance", "Recipient", "Theme", "Expires", "Status", "Actions"].map(h => (
                    <th key={h} className="py-3.5 px-4 first:pl-6 last:pr-6 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cards.map(card => {
                  const es = gcEffectiveStatus(card);
                  return (
                    <tr key={card.id} className="hover:bg-gray-50/40 transition-colors">
                      {/* Code */}
                      <td className="pl-6 pr-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11.5px] font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded-lg tracking-wide">{card.code}</span>
                          <button onClick={() => copyCode(card.code)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0">
                            {copyMsg === card.code ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      {/* Amount / Balance */}
                      <td className="px-4 py-4">
                        <p className="text-[13px] font-bold text-gray-900">
                          ${parseFloat(card.amount).toFixed(2)} / ${parseFloat(card.balance).toFixed(2)}
                        </p>
                      </td>
                      {/* Recipient */}
                      <td className="px-4 py-4">
                        {card.recipientName || card.recipientEmail
                          ? (
                            <div>
                              <p className="font-semibold text-gray-800">{card.recipientName || "—"}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">{card.recipientEmail || ""}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Not assigned</span>
                          )
                        }
                      </td>
                      {/* Theme */}
                      <td className="px-4 py-4">
                        <span className="inline-flex text-[11.5px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{card.theme}</span>
                      </td>
                      {/* Expires */}
                      <td className="px-4 py-4">
                        <span className="text-[13px] font-semibold text-gray-700">{fmtDate(card.expiresAt)}</span>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-4">
                        <GcStatusBadge status={es} />
                      </td>
                      {/* Actions */}
                      <td className="px-4 pr-6 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setViewCard(card)} title="View details"
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          {es !== "redeemed" && es !== "expired" && (
                            <button onClick={() => handleToggle(card)} title={card.status === "active" ? "Deactivate" : "Activate"}
                              disabled={togglingId === card.id}
                              className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${card.status === "active" ? "text-amber-500 hover:bg-amber-50" : "text-green-500 hover:bg-green-50"}`}>
                              {togglingId === card.id
                                ? <RefreshCw className="w-4 h-4 animate-spin" />
                                : <AlertCircle className="w-4 h-4" />
                              }
                            </button>
                          )}
                          <button onClick={() => handleDelete(card.id)} disabled={deletingId === card.id} title="Delete"
                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40">
                            {deletingId === card.id
                              ? <RefreshCw className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── View Card modal ── */}
      {viewCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setViewCard(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <LottieIcon src="/icons/category.json" size={24} autoplay loop />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-gray-900">Gift Card Details</h3>
                  <GcStatusBadge status={gcEffectiveStatus(viewCard)} />
                </div>
              </div>
              <button onClick={() => setViewCard(null)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5">
              {/* Code */}
              <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between mb-5">
                <span className="font-mono text-[15px] font-bold text-gray-900 tracking-widest">{viewCard.code}</span>
                <button onClick={() => copyCode(viewCard.code)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white transition-colors">
                  {copyMsg === viewCard.code ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {/* Details grid */}
              <div className="space-y-0">
                {[
                  { label: "Amount",    value: `$${parseFloat(viewCard.amount).toFixed(2)}` },
                  { label: "Balance",   value: `$${parseFloat(viewCard.balance).toFixed(2)}` },
                  { label: "Theme",     value: viewCard.theme },
                  { label: "Recipient", value: viewCard.recipientName ?? viewCard.recipientEmail ?? "Not assigned" },
                  { label: "Expires",   value: fmtDate(viewCard.expiresAt) },
                  { label: "Created",   value: fmtDate(viewCard.createdAt) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <span className="text-[12.5px] font-semibold text-gray-500">{label}</span>
                    <span className="text-[13px] font-bold text-gray-900">{value}</span>
                  </div>
                ))}
                {viewCard.personalMessage && (
                  <div className="pt-3">
                    <p className="text-[12px] font-semibold text-gray-500 mb-1.5">Personal Message</p>
                    <p className="text-[13px] text-gray-700 bg-gray-50 rounded-xl p-3 italic">{viewCard.personalMessage}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 pb-5">
              <button onClick={() => setViewCard(null)}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Gift Card modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => !creating && setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <LottieIcon src="/icons/category.json" size={24} autoplay loop />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-gray-900">Create Gift Card</h3>
                  <p className="text-[12.5px] text-gray-400">Create a new gift card for a customer or promotion</p>
                </div>
              </div>
              <button onClick={() => !creating && setShowCreate(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              {/* Amount quick-picks */}
              <div>
                <label className="block text-[12.5px] font-semibold text-gray-700 mb-2.5">Amount ($)</label>
                <div className="flex flex-wrap gap-2 mb-2.5">
                  {QUICK_AMTS.map(a => (
                    <button key={a} type="button" onClick={() => setSelAmt(a)}
                      className={`px-4 py-2 rounded-xl text-[13px] font-bold border transition-colors ${selAmt === a ? "text-white border-transparent" : "border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50"}`}
                      style={selAmt === a ? { background: "#22c55e", borderColor: "#22c55e" } : {}}>
                      ${a}
                    </button>
                  ))}
                  <button type="button" onClick={() => setSelAmt("custom")}
                    className={`px-4 py-2 rounded-xl text-[13px] font-bold border transition-colors ${selAmt === "custom" ? "text-white border-transparent" : "border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50"}`}
                    style={selAmt === "custom" ? { background: "#22c55e", borderColor: "#22c55e" } : {}}>
                    Custom
                  </button>
                </div>
                <input value={custAmt} onChange={e => { setCustAmt(e.target.value); setSelAmt("custom"); }}
                  type="number" min="0.01" step="0.01" placeholder="Custom amount"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-[13px] text-gray-700 outline-none transition-colors bg-gray-50 focus:bg-white ${selAmt === "custom" ? "border-green-400" : "border-gray-200"}`} />
              </div>
              {/* Theme */}
              <div>
                <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Theme</label>
                <select value={theme} onChange={e => setTheme(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 bg-gray-50 outline-none focus:border-green-400 transition-colors cursor-pointer">
                  {GC_THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {/* Recipient Name + Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Recipient Name <span className="font-normal text-gray-400">(optional)</span></label>
                  <input value={rcptName} onChange={e => setRcptName(e.target.value)} placeholder="John Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 outline-none focus:border-green-400 transition-colors bg-gray-50 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Recipient Email <span className="font-normal text-gray-400">(optional)</span></label>
                  <input value={rcptEmail} onChange={e => setRcptEmail(e.target.value)} type="email" placeholder="john@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 outline-none focus:border-green-400 transition-colors bg-gray-50 focus:bg-white" />
                </div>
              </div>
              {/* Personal Message */}
              <div>
                <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Personal Message <span className="font-normal text-gray-400">(optional)</span></label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2}
                  placeholder="Enjoy your eSIM gift card!"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 outline-none focus:border-green-400 transition-colors bg-gray-50 focus:bg-white resize-none" />
              </div>
              {/* Expires On */}
              <div>
                <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Expires On</label>
                <input value={expiresAt} onChange={e => setExpiresAt(e.target.value)} type="date" required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 outline-none focus:border-green-400 transition-colors bg-gray-50 focus:bg-white" />
              </div>
              {createErr && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-[12.5px] text-red-600 font-medium">{createErr}</div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => !creating && setShowCreate(false)} disabled={creating}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-[13.5px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-3 rounded-xl text-[13.5px] font-semibold text-white disabled:opacity-60 shadow-sm flex items-center justify-center gap-2 transition-colors"
                  style={{ background: "#22c55e" }}>
                  {creating && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {creating ? "Creating…" : "Create Gift Card"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Bulk Generate modal ── */}
      {showBulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => !bulkGenning && setShowBulk(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <LottieIcon src="/icons/category.json" size={24} autoplay loop />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-gray-900">Bulk Generate Gift Cards</h3>
                  <p className="text-[12.5px] text-gray-400">Create multiple gift cards at once for promotions</p>
                </div>
              </div>
              <button onClick={() => !bulkGenning && setShowBulk(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleBulk} className="p-6 space-y-5">
              <div>
                <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Number of Cards</label>
                <input value={bulkCount} onChange={e => setBulkCount(e.target.value)}
                  type="number" min="1" max="500" required
                  className="w-full px-3.5 py-3 rounded-xl border-2 border-green-400 text-[14px] font-semibold text-gray-900 outline-none transition-colors bg-white" />
              </div>
              <div>
                <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Amount per Card ($)</label>
                <input value={bulkAmount} onChange={e => setBulkAmount(e.target.value)}
                  type="number" min="0.01" step="0.01" required
                  className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-[14px] font-semibold text-gray-900 outline-none focus:border-green-400 transition-colors bg-gray-50 focus:bg-white" />
              </div>
              {bulkErr && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-[12.5px] text-red-600 font-medium">{bulkErr}</div>
              )}
              <button type="submit" disabled={bulkGenning}
                className="w-full py-3 rounded-xl text-[13.5px] font-semibold text-white disabled:opacity-60 shadow-sm flex items-center justify-center gap-2 transition-colors"
                style={{ background: "#22c55e" }}>
                {bulkGenning && <RefreshCw className="w-4 h-4 animate-spin" />}
                {bulkGenning ? "Generating…" : `Generate ${parseInt(bulkCount) || 0} Card${parseInt(bulkCount) !== 1 ? "s" : ""}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Vouchers page
───────────────────────────────────────────────── */
type VoucherRow = {
  id: string; code: string; description: string | null;
  discountType: string; discountValue: string; status: string;
  minPurchaseAmount: string; maxDiscountCap: string | null;
  totalUsageLimit: number | null; perUserLimit: number;
  validFrom: string; validUntil: string;
  firstTimeOnly: boolean; stackable: boolean;
  usageCount: number; totalDiscountGiven: string; createdAt: string;
};
type VoucherStats = { total: number; active: number; totalUsage: number; totalDiscountGiven: string };
type VouchersResp = { vouchers: VoucherRow[]; total: number; stats: VoucherStats };

const emptyStats: VoucherStats = { total: 0, active: 0, totalUsage: 0, totalDiscountGiven: "0" };

function genCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function effectiveStatus(v: VoucherRow) {
  if (new Date(v.validUntil) < new Date()) return "expired";
  return v.status;
}

function VoucherStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    active:   "bg-emerald-50 text-emerald-700 border-emerald-200",
    inactive: "bg-gray-50 text-gray-500 border-gray-200",
    expired:  "bg-red-50 text-red-600 border-red-200",
  };
  return (
    <span className={`inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full border capitalize ${cfg[status] ?? cfg.inactive}`}>
      {status}
    </span>
  );
}

function VouchersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch]           = useState("");
  const [searchQ, setSearchQ]         = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter]   = useState("all");
  const [showCreate, setShowCreate]   = useState(false);
  const [creating, setCreating]       = useState(false);
  const [createErr, setCreateErr]     = useState<string | null>(null);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [copyMsg, setCopyMsg]         = useState<string | null>(null);

  /* form */
  const now = new Date(); const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const toLocal = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const [form, setForm] = useState({
    code: genCode(), status: "active", discountType: "percentage", discountValue: "20",
    description: "", minPurchaseAmount: "0", maxDiscountCap: "", totalUsageLimit: "",
    perUserLimit: "1", validFrom: toLocal(now), validUntil: toLocal(future),
    firstTimeOnly: false, stackable: false,
  });
  const setF = (k: keyof typeof form, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    const t = setTimeout(() => { setSearchQ(search); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const qp = new URLSearchParams();
  if (searchQ)                qp.set("search", searchQ);
  if (statusFilter !== "all") qp.set("status", statusFilter);
  if (typeFilter   !== "all") qp.set("type", typeFilter);

  const { data, isLoading } = useQuery<VouchersResp>({
    queryKey: ["admin-vouchers", searchQ, statusFilter, typeFilter],
    queryFn: () => fetch(`/api/admin/vouchers?${qp}`).then(r => r.json()),
    placeholderData: prev => prev,
    staleTime: 60_000,
  });

  const vouchers = data?.vouchers ?? [];
  const stats    = data?.stats ?? emptyStats;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true); setCreateErr(null);
    try {
      const body = {
        code: form.code.trim().toUpperCase(),
        description:         form.description || null,
        discountType:        form.discountType,
        discountValue:       form.discountValue,
        status:              form.status,
        minPurchaseAmount:   form.minPurchaseAmount || "0",
        maxDiscountCap:      form.maxDiscountCap   || null,
        totalUsageLimit:     form.totalUsageLimit  ? parseInt(form.totalUsageLimit) : null,
        perUserLimit:        parseInt(form.perUserLimit) || 1,
        validFrom:           new Date(form.validFrom).toISOString(),
        validUntil:          new Date(form.validUntil).toISOString(),
        firstTimeOnly:       form.firstTimeOnly,
        stackable:           form.stackable,
      };
      const res = await fetch("/api/admin/vouchers", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create voucher");
      await queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
      setShowCreate(false);
      setForm(p => ({ ...p, code: genCode() }));
    } catch (err: unknown) {
      setCreateErr(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/admin/vouchers/${id}`, { method: "DELETE" });
    await queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
    setDeletingId(null);
  }

  async function toggleStatus(v: VoucherRow) {
    const next = v.status === "active" ? "inactive" : "active";
    await fetch(`/api/admin/vouchers/${v.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }),
    });
    queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopyMsg(code);
      setTimeout(() => setCopyMsg(null), 1800);
    });
  }

  const STAT_CARDS = [
    { label: "Total Vouchers",       value: stats.total.toLocaleString(),               icon: "/icons/ticket.json",        bg: "#f0fdf4", accent: "#22c55e" },
    { label: "Active Vouchers",      value: stats.active.toLocaleString(),              icon: "/icons/profile-tick.json",  bg: "#eff6ff", accent: "#3b82f6" },
    { label: "Total Usage",          value: stats.totalUsage.toLocaleString(),          icon: "/icons/chart.json",         bg: "#f0faf7", accent: "#0da976" },
    { label: "Total Discount Given", value: `$${parseFloat(stats.totalDiscountGiven || "0").toFixed(2)}`, icon: "/icons/money-receive.json", bg: "#fdf4ff", accent: "#a855f7" },
  ];

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
            <LottieIcon src="/icons/ticket.json" size={32} autoplay loop />
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-gray-900">Voucher Management</h1>
            <p className="text-[13.5px] text-gray-400 mt-0.5">Create and manage discount vouchers</p>
          </div>
        </div>
        <button onClick={() => { setShowCreate(true); setCreateErr(null); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13.5px] font-semibold text-white shadow-sm transition-colors"
          style={{ background: "#22c55e" }}>
          <Plus className="w-4 h-4" /> Create Voucher
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        {STAT_CARDS.map(({ label, value, icon, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center justify-between group hover:shadow-md transition-shadow">
            <div>
              <p className="text-[13px] font-semibold text-gray-500 mb-2">{label}</p>
              <p className="text-[38px] font-bold text-gray-900 leading-none tracking-tight">{value}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
              style={{ background: bg }}>
              <LottieIcon src={icon} size={32} autoplay loop />
            </div>
          </div>
        ))}
      </div>

      {/* ── Vouchers card ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">

        {/* Card header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-[18px] font-bold text-gray-900">Vouchers</h2>
            <p className="text-[13px] text-gray-400 mt-0.5">{stats.total} voucher{stats.total !== 1 ? "s" : ""} created</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by code or description…"
                className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-[13px] text-gray-700 placeholder-gray-400 outline-none focus:border-green-400 transition-colors bg-gray-50 focus:bg-white w-60" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-[12.5px] text-gray-600 bg-gray-50 outline-none focus:border-green-400 cursor-pointer">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-[12.5px] text-gray-600 bg-gray-50 outline-none focus:border-green-400 cursor-pointer">
              <option value="all">All Types</option>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
        </div>

        {/* Table / empty */}
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : vouchers.length === 0 ? (
          <div className="py-24 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <LottieIcon src="/icons/ticket.json" size={36} autoplay loop />
            </div>
            <p className="text-[16px] font-bold text-gray-500">No vouchers found</p>
            <p className="text-[13px] text-gray-400">Create your first voucher to start offering discounts</p>
            <button onClick={() => { setShowCreate(true); setCreateErr(null); }}
              className="mt-1 px-5 py-2.5 rounded-xl text-[13.5px] font-semibold text-white shadow-sm"
              style={{ background: "#22c55e" }}>
              + Create Voucher
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px] min-w-[860px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {["Code", "Discount", "Usage", "Min Purchase", "Valid Until", "Status", "Actions"].map(h => (
                    <th key={h} className="py-3.5 px-4 first:pl-6 last:pr-6 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vouchers.map(v => {
                  const es = effectiveStatus(v);
                  return (
                    <tr key={v.id} className="hover:bg-gray-50/40 transition-colors">
                      {/* Code */}
                      <td className="pl-6 pr-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[13px] font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">{v.code}</span>
                          <button onClick={() => copyCode(v.code)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
                            title="Copy code">
                            {copyMsg === v.code
                              ? <Check className="w-3.5 h-3.5 text-green-500" />
                              : <Copy className="w-3.5 h-3.5" />
                            }
                          </button>
                        </div>
                        {v.description && <p className="text-[11.5px] text-gray-400 mt-1 max-w-[160px] truncate">{v.description}</p>}
                      </td>
                      {/* Discount */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex text-[12px] font-bold px-2.5 py-1 rounded-full ${v.discountType === "percentage" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
                          {v.discountType === "percentage"
                            ? `${parseFloat(v.discountValue)}% OFF`
                            : `$${parseFloat(v.discountValue).toFixed(2)} OFF`}
                        </span>
                      </td>
                      {/* Usage */}
                      <td className="px-4 py-4">
                        <p className="text-[13px] font-bold text-gray-900">
                          {v.usageCount} / {v.totalUsageLimit ?? "∞"}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">per user: {v.perUserLimit}</p>
                      </td>
                      {/* Min Purchase */}
                      <td className="px-4 py-4">
                        <span className="text-[13px] font-semibold text-gray-700">
                          {parseFloat(v.minPurchaseAmount) === 0 ? "None" : `$${parseFloat(v.minPurchaseAmount).toFixed(2)}`}
                        </span>
                      </td>
                      {/* Valid Until */}
                      <td className="px-4 py-4">
                        <p className="text-[13px] font-semibold text-gray-700">{fmtDate(v.validUntil)}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">from {fmtDate(v.validFrom)}</p>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-4">
                        <VoucherStatusBadge status={es} />
                      </td>
                      {/* Actions */}
                      <td className="px-4 pr-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {es !== "expired" && (
                            <button onClick={() => toggleStatus(v)}
                              className={`px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold transition-colors border ${v.status === "active" ? "border-gray-200 text-gray-600 hover:bg-gray-50" : "border-green-200 text-green-700 hover:bg-green-50"}`}>
                              {v.status === "active" ? "Deactivate" : "Activate"}
                            </button>
                          )}
                          <button onClick={() => handleDelete(v.id)} disabled={deletingId === v.id}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40">
                            {deletingId === v.id
                              ? <RefreshCw className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create Voucher modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => !creating && setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8" onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <LottieIcon src="/icons/ticket.json" size={24} autoplay loop />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-gray-900">Create New Voucher</h3>
                  <p className="text-[12.5px] text-gray-400">Create a new discount voucher code</p>
                </div>
              </div>
              <button onClick={() => !creating && setShowCreate(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreate} className="p-6 space-y-5">

              {/* Code + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Voucher Code</label>
                  <div className="flex gap-2">
                    <input value={form.code} onChange={e => setF("code", e.target.value.toUpperCase())} required
                      maxLength={50} placeholder="e.g. SAVE20"
                      className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] font-mono font-bold text-gray-900 outline-none focus:border-green-400 transition-colors bg-gray-50 focus:bg-white" />
                    <button type="button" onClick={() => setF("code", genCode())}
                      className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-[12.5px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors shrink-0">
                      Generate
                    </button>
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setF("status", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 bg-gray-50 outline-none focus:border-green-400 transition-colors cursor-pointer">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Discount Type + Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Discount Type</label>
                  <select value={form.discountType} onChange={e => setF("discountType", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 bg-gray-50 outline-none focus:border-green-400 transition-colors cursor-pointer">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Discount Value</label>
                  <input value={form.discountValue} onChange={e => setF("discountValue", e.target.value)} required
                    type="number" min="0" step="0.01" placeholder="20"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 outline-none focus:border-green-400 transition-colors bg-gray-50 focus:bg-white" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Description <span className="font-normal text-gray-400">(optional)</span></label>
                <textarea value={form.description} onChange={e => setF("description", e.target.value)}
                  rows={2} placeholder="Summer sale discount…"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 outline-none focus:border-green-400 transition-colors bg-gray-50 focus:bg-white resize-none" />
              </div>

              {/* Min Purchase + Max Cap */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Minimum Purchase Amount ($)</label>
                  <input value={form.minPurchaseAmount} onChange={e => setF("minPurchaseAmount", e.target.value)}
                    type="number" min="0" step="0.01" placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 outline-none focus:border-green-400 transition-colors bg-gray-50 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Maximum Discount Cap ($)</label>
                  <input value={form.maxDiscountCap} onChange={e => setF("maxDiscountCap", e.target.value)}
                    type="number" min="0" step="0.01" placeholder="Leave empty for no cap"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 placeholder-gray-400 outline-none focus:border-green-400 transition-colors bg-gray-50 focus:bg-white" />
                </div>
              </div>

              {/* Total Usage Limit + Per User */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Total Usage Limit</label>
                  <input value={form.totalUsageLimit} onChange={e => setF("totalUsageLimit", e.target.value)}
                    type="number" min="1" step="1" placeholder="Leave empty for unlimited"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 placeholder-gray-400 outline-none focus:border-green-400 transition-colors bg-gray-50 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Per User Limit</label>
                  <input value={form.perUserLimit} onChange={e => setF("perUserLimit", e.target.value)}
                    type="number" min="1" step="1" placeholder="1"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 outline-none focus:border-green-400 transition-colors bg-gray-50 focus:bg-white" />
                </div>
              </div>

              {/* Valid From + Valid Until */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Valid From</label>
                  <input value={form.validFrom} onChange={e => setF("validFrom", e.target.value)}
                    type="datetime-local" required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 outline-none focus:border-green-400 transition-colors bg-gray-50 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Valid Until</label>
                  <input value={form.validUntil} onChange={e => setF("validUntil", e.target.value)}
                    type="datetime-local" required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 outline-none focus:border-green-400 transition-colors bg-gray-50 focus:bg-white" />
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-4">
                {([
                  ["firstTimeOnly", "First-time customers only"],
                  ["stackable",     "Stackable with other offers"],
                ] as [keyof typeof form, string][]).map(([key, label]) => (
                  <button key={key} type="button"
                    onClick={() => setF(key, !form[key])}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-left">
                    <div className={`w-10 h-6 rounded-full flex items-center transition-colors shrink-0 ${form[key] ? "justify-end" : "justify-start"}`}
                      style={{ background: form[key] ? "#22c55e" : "#e5e7eb", padding: "2px" }}>
                      <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                    </div>
                    <span className="text-[12.5px] font-semibold text-gray-700 leading-tight">{label}</span>
                  </button>
                ))}
              </div>

              {createErr && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-[12.5px] text-red-600 font-medium">
                  {createErr}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => !creating && setShowCreate(false)} disabled={creating}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-[13.5px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-3 rounded-xl text-[13.5px] font-semibold text-white disabled:opacity-60 transition-colors shadow-sm flex items-center justify-center gap-2"
                  style={{ background: "#22c55e" }}>
                  {creating && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {creating ? "Creating…" : "Create Voucher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Countries & Territories page
───────────────────────────────────────────────── */
type CountryItem = {
  code: string; name: string; flagUrl: string;
  packageCount: number; esimAccessCount: number; airaloCount: number; esimGoCount: number;
  type: "country" | "territory";
};

type CountryOverride = { status?: boolean; popular?: boolean };

function ProductSeoEditor() {
  const PAGES = [
    { id: "home",          label: "Home",          path: "/",                      defaultTitle: "Voltey eSIM | Global Travel eSIM",             defaultDesc: "Stay connected worldwide with Voltey eSIM. Fast, reliable mobile data in 200+ countries." },
    { id: "destinations",  label: "Destinations",  path: "/destinations",          defaultTitle: "Buy eSIM Online | 200+ Destinations | Voltey", defaultDesc: "Browse affordable eSIM data plans for 200+ countries and regions worldwide." },
    { id: "phone-number",  label: "Phone Number",  path: "/product/phone-number",  defaultTitle: "US Phone Number with eSIM | Voltey",           defaultDesc: "Get a real US phone number for calls and texts from just $0.99/mo. Pair it with any Voltey eSIM plan." },
    { id: "ultra-plan",    label: "Ultra Plan",    path: "/product/ultra-plan",    defaultTitle: "Global Ultra eSIM Plan | Voltey",             defaultDesc: "Our best global eSIM plan for heavy data users. High-speed internet in 115+ countries." },
    { id: "compatibility", label: "Compatibility", path: "/product/compatibility", defaultTitle: "eSIM Compatible Devices | Voltey",             defaultDesc: "Check if your device supports eSIM. Works with most modern iPhones, Android phones, and tablets." },
  ];
  const queryClient = useQueryClient();
  const [activePage, setActivePage] = useState("home");
  const [forms, setForms] = useState<Record<string, { metaTitle: string; metaDesc: string; metaKw: string; urlSlug: string }>>({});
  const [saving, setSaving]         = useState<string | null>(null);
  const [saved,  setSaved]          = useState<string | null>(null);

  const page = PAGES.find(p => p.id === activePage)!;
  const form = forms[activePage] ?? { metaTitle: page.defaultTitle, metaDesc: page.defaultDesc, metaKw: "", urlSlug: page.path };

  const { data: seoData } = useQuery<{ urlSlug?: string; metaTitle?: string; metaDesc?: string; metaKw?: string } | null>({
    queryKey: ["product-seo", activePage],
    queryFn: () => fetch(`/api/content/seo:product:${activePage}`).then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!forms[activePage]) {
      setForms(prev => ({
        ...prev,
        [activePage]: {
          metaTitle: seoData?.metaTitle ?? page.defaultTitle,
          metaDesc:  seoData?.metaDesc  ?? page.defaultDesc,
          metaKw:    seoData?.metaKw    ?? "",
          urlSlug:   seoData?.urlSlug   ?? page.path,
        },
      }));
    }
  }, [seoData, activePage]);

  function upd(field: string, val: string) {
    setForms(prev => ({
      ...prev,
      [activePage]: { ...(prev[activePage] ?? { metaTitle: "", metaDesc: "", metaKw: "", urlSlug: "" }), [field]: val },
    }));
  }

  async function savePage() {
    setSaving(activePage);
    try {
      await fetch(`/api/admin/content/seo:product:${activePage}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      await queryClient.invalidateQueries({ queryKey: ["product-seo", activePage] });
      setSaved(activePage);
      setTimeout(() => setSaved(null), 2500);
    } finally {
      setSaving(null);
    }
  }

  const inp = "w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] text-gray-800 outline-none focus:border-green-400 transition-colors bg-white";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
          <LottieIcon src="/icons/note-text.json" size={28} autoplay loop />
        </div>
        <div>
          <h2 className="text-[20px] font-bold text-emerald-500">Product &amp; Page SEO</h2>
          <p className="text-[13px] text-gray-500 mt-0.5">Configure URL slugs and meta tags for each product page</p>
        </div>
      </div>

      {/* Page selector */}
      <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 mb-6 overflow-x-auto">
        {PAGES.map(p => (
          <button key={p.id} onClick={() => setActivePage(p.id)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${activePage === p.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <p className="text-[13.5px] font-bold text-gray-800 mb-1.5">Page URL</p>
            <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden bg-white">
              <span className="px-3 py-3 text-[13px] text-gray-400 bg-gray-50 border-r border-gray-200 whitespace-nowrap">voltey.com</span>
              <input value={form.urlSlug} onChange={e => upd("urlSlug", e.target.value)} placeholder={page.path}
                className="flex-1 px-3 py-3 text-[13.5px] text-gray-800 outline-none font-mono" />
            </div>
            <p className="text-[11.5px] text-gray-400 mt-1">Full path for this page (e.g. /product/phone-number)</p>
          </div>
          <div>
            <p className="text-[13.5px] font-bold text-gray-800 mb-1.5">Meta Title</p>
            <input value={form.metaTitle} onChange={e => upd("metaTitle", e.target.value)} placeholder={page.defaultTitle} className={inp} />
            <p className="text-[11.5px] text-gray-400 mt-1">{form.metaTitle.length}/60 chars · keep under 60</p>
          </div>
          <div>
            <p className="text-[13.5px] font-bold text-gray-800 mb-1.5">Meta Description</p>
            <textarea value={form.metaDesc} onChange={e => upd("metaDesc", e.target.value)} rows={3} placeholder={page.defaultDesc}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] text-gray-800 outline-none focus:border-green-400 transition-colors resize-none bg-white" />
            <p className="text-[11.5px] text-gray-400 mt-1">{form.metaDesc.length}/160 chars · keep under 160</p>
          </div>
          <div>
            <p className="text-[13.5px] font-bold text-gray-800 mb-1.5">Keywords</p>
            <textarea value={form.metaKw} onChange={e => upd("metaKw", e.target.value)} rows={2}
              placeholder="esim, travel sim, global data plan"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] text-gray-800 outline-none focus:border-green-400 transition-colors resize-none bg-white" />
          </div>
          <button onClick={savePage} disabled={!!saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-bold text-white shadow-sm transition-all disabled:opacity-60"
            style={{ background: "#22c55e" }}>
            {saved === activePage ? <><Check className="w-4 h-4" /> Saved!</> : saving === activePage ? "Saving…" : <><CheckCircle className="w-4 h-4" /> Save Page SEO</>}
          </button>
        </div>

        {/* SERP Preview */}
        <div>
          <p className="text-[13.5px] font-bold text-gray-800 mb-3">SERP Preview</p>
          <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50">
            <p className="text-[12px] text-gray-400 mb-1.5">voltey.com{form.urlSlug || page.path} ▾</p>
            <p className="text-[16px] font-medium leading-snug mb-1 hover:underline cursor-pointer" style={{ color: "#1a0dab" }}>
              {form.metaTitle || page.defaultTitle}
            </p>
            <p className="text-[13px] leading-relaxed line-clamp-3" style={{ color: "#4d5156" }}>
              {form.metaDesc || page.defaultDesc}
            </p>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-[12px] text-blue-700 font-medium">These settings are saved to the database and applied live to the store frontend.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CountriesPage() {
  const PAGE_SIZE = 200;
  const queryClient = useQueryClient();
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState("");
  const [searchQ, setSearchQ]       = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "country" | "territory">("all");
  const [syncing, setSyncing]       = useState(false);
  const [selected, setSelected]     = useState<CountryItem | null>(null);
  const [drawerTab, setDrawerTab]   = useState<"plans" | "seo">("plans");
  const [seoForm, setSeoForm]       = useState({ urlSlug: "", metaTitle: "", metaDesc: "", metaKw: "", ogImage: "" });
  const [seoSaving, setSeoSaving]   = useState(false);
  const [seoSaved,  setSeoSaved]    = useState(false);

  /* pkg drawer inside country drawer */
  const [drawerSearch, setDrawerSearch]   = useState("");
  const [drawerSearchQ, setDrawerSearchQ] = useState("");
  const [drawerSort, setDrawerSort]       = useState("default");

  useEffect(() => {
    const t = setTimeout(() => { setSearchQ(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => setDrawerSearchQ(drawerSearch), 300);
    return () => clearTimeout(t);
  }, [drawerSearch]);

  const [overrides, setOverrides] = useState<Record<string, CountryOverride>>(() => {
    try { return JSON.parse(localStorage.getItem("voltey-country-overrides") ?? "{}"); }
    catch { return {}; }
  });

  const setOv = (code: string, field: keyof CountryOverride, val: boolean) =>
    setOverrides(prev => {
      const next = { ...prev, [code]: { ...(prev[code] ?? {}), [field]: val } };
      localStorage.setItem("voltey-country-overrides", JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("voltey-country-updated"));
      return next;
    });

  const ov = (code: string, field: keyof CountryOverride, def: boolean) =>
    overrides[code]?.[field] ?? def;

  const qp = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (searchQ)              qp.set("search", searchQ);
  if (typeFilter !== "all") qp.set("type", typeFilter);

  const { data, isLoading } = useQuery<{
    countries: CountryItem[]; total: number; page: number; pageSize: number;
    totalDestinations: number; countriesCount: number; territoriesCount: number; totalPackages: number;
  }>({
    queryKey: ["admin-countries", page, searchQ, typeFilter],
    queryFn: () => fetch(`/api/admin/countries?${qp}`).then(r => r.json()),
    placeholderData: prev => prev,
    staleTime: 5 * 60 * 1000,
  });

  const countries  = data?.countries ?? [];
  const total      = data?.total ?? 0;

  /* drawer packages */
  const dpParams = new URLSearchParams({ pageSize: "100" });
  if (selected)                  dpParams.set("locationCode", selected.code);
  if (drawerSearchQ)             dpParams.set("search", drawerSearchQ);
  if (drawerSort !== "default")  dpParams.set("sortBy", drawerSort);
  const { data: drawerData, isLoading: drawerLoading } = useQuery<AdminPackagesResponse>({
    queryKey: ["country-drawer-pkgs", selected?.code, drawerSearchQ, drawerSort],
    queryFn: () => fetch(`/api/admin/packages?${dpParams}`).then(r => r.json()),
    enabled: !!selected,
  });
  const drawerPkgs = drawerData?.packages ?? [];

  async function handleSync() {
    setSyncing(true);
    await queryClient.invalidateQueries({ queryKey: ["admin-countries"] });
    setSyncing(false);
  }

  const { data: countrySeoData } = useQuery<{ urlSlug?: string; metaTitle?: string; metaDesc?: string; metaKw?: string; ogImage?: string } | null>({
    queryKey: ["country-seo", selected?.code],
    queryFn: () => fetch(`/api/content/seo:country:${selected!.code}`).then(r => r.json()),
    enabled: !!selected,
    staleTime: 0,
  });

  useEffect(() => {
    if (!selected) return;
    const slug = selected.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    setSeoForm({
      urlSlug:   countrySeoData?.urlSlug   ?? slug,
      metaTitle: countrySeoData?.metaTitle ?? `${selected.name} eSIM | Voltey`,
      metaDesc:  countrySeoData?.metaDesc  ?? `Get an eSIM for ${selected.name} and stay connected on your travels. Fast, reliable mobile data from Voltey.`,
      metaKw:    countrySeoData?.metaKw    ?? `${selected.name} eSIM, ${selected.name} SIM card, travel eSIM`,
      ogImage:   countrySeoData?.ogImage   ?? "",
    });
  }, [selected?.code, countrySeoData]);

  async function saveCountrySeo() {
    if (!selected) return;
    setSeoSaving(true);
    try {
      await fetch(`/api/admin/content/seo:country:${selected.code}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(seoForm),
      });
      /* Broadcast to any open store tabs so they re-fetch immediately */
      localStorage.setItem(`voltey-seo-country-${selected.code}`, Date.now().toString());
      setSeoSaved(true);
      setTimeout(() => setSeoSaved(false), 2500);
    } finally {
      setSeoSaving(false);
    }
  }

  const [pkgOverrides, setPkgOverrides] = useState<Record<string, PkgOverride>>(() => {
    try { return JSON.parse(localStorage.getItem("voltey-pkg-overrides") ?? "{}"); }
    catch { return {}; }
  });
  const setPkgOv = (code: string, field: keyof PkgOverride, val: boolean) =>
    setPkgOverrides(prev => {
      const next = { ...prev, [code]: { ...(prev[code] ?? {}), [field]: val } };
      localStorage.setItem("voltey-pkg-overrides", JSON.stringify(next));
      return next;
    });
  const pkgOv = (code: string, field: keyof PkgOverride, def: boolean) =>
    pkgOverrides[code]?.[field] ?? def;

  const fmt$ = (c: number) => `$${(c / 100).toFixed(2)}`;
  const mPct = (p: { wholesalePriceCents: number; retailPriceCents: number }) =>
    p.wholesalePriceCents > 0
      ? ((p.retailPriceCents - p.wholesalePriceCents) / p.wholesalePriceCents * 100)
      : 0;
  const cTypePill = (isRegional: boolean) =>
    isRegional ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-blue-100 text-blue-700 border-blue-200";

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
            <LottieIcon src="/icons/global.json" size={32} autoplay loop />
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-gray-900">Countries &amp; Territories</h1>
            <p className="text-[13.5px] text-gray-400 mt-0.5">Manage destination countries and territories</p>
          </div>
        </div>
        <button onClick={handleSync} disabled={syncing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13.5px] font-semibold text-white transition-colors disabled:opacity-60 shadow-sm"
          style={{ background: "#22c55e" }}>
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          Sync Countries
        </button>
      </div>

      {/* ── 4 stat cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {([
          { label: "Total Destinations", value: (data?.totalDestinations ?? 0).toLocaleString(), icon: "/icons/global.json",    bg: "#eff6ff", accent: "#3b82f6" },
          { label: "Countries",          value: (data?.countriesCount    ?? 0).toLocaleString(), icon: "/icons/category.json",  bg: "#f0fdf4", accent: "#22c55e" },
          { label: "Territories",        value: (data?.territoriesCount  ?? 0).toLocaleString(), icon: "/icons/note-text.json", bg: "#f0faf7", accent: "#0da976" },
          { label: "Total Packages",     value: (data?.totalPackages     ?? 0).toLocaleString(), icon: "/icons/simcard.json",   bg: "#fdf4ff", accent: "#a855f7" },
        ] as const).map(({ label, value, icon, bg, accent }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between group hover:shadow-md transition-shadow">
            <div>
              <p className="text-[12px] font-semibold mb-1.5" style={{ color: accent }}>{label}</p>
              <p className="text-[36px] font-bold text-gray-900 leading-none tracking-tight">{value}</p>
            </div>
            <div className="w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110" style={{ background: bg }}>
              <LottieIcon src={icon} size={28} autoplay loop />
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + filter ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-[380px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search countries…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 placeholder-gray-400 outline-none focus:border-green-400 bg-white transition-colors shadow-sm" />
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value as typeof typeFilter); setPage(1); }}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-[12.5px] text-gray-600 bg-white outline-none focus:border-green-400 cursor-pointer shadow-sm">
          <option value="all">All Types</option>
          <option value="country">Countries only</option>
          <option value="territory">Territories only</option>
        </select>
        <span className="ml-auto text-[12.5px] text-gray-400 whitespace-nowrap">{total.toLocaleString()} destinations</span>
      </div>

      {/* ── Country grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl overflow-hidden border border-gray-200 bg-white">
              <div className="h-32 bg-gray-100" />
              <div className="p-3 space-y-2"><div className="h-3 bg-gray-100 rounded w-3/4" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>
            </div>
          ))}
        </div>
      ) : countries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center bg-white rounded-2xl border border-gray-200">
          <LottieIcon src="/icons/global.json" size={40} autoplay loop />
          <p className="text-[15px] font-semibold text-gray-600">No countries found</p>
          <p className="text-[12.5px] text-gray-400">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {countries.map(country => {
            const status  = ov(country.code, "status",  true);
            const popular = ov(country.code, "popular", false);
            return (
              <button key={country.code}
                onClick={() => { setSelected(country); setDrawerSearch(""); setDrawerSearchQ(""); setDrawerTab("plans"); setDrawerSort("default"); }}
                className="group relative rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-left">
                {/* Card photo */}
                <div className="relative h-32 overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
                  <img src={`https://source.unsplash.com/featured/480x260/?${encodeURIComponent(country.name)},travel,landscape,city`}
                    alt={country.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => { const img = e.target as HTMLImageElement; if (!img.dataset.f) { img.dataset.f="1"; img.src=country.flagUrl; } }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                  {/* Status dot */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-lg px-1.5 py-1">
                    <img src={country.flagUrl} alt="" className="w-5 h-3.5 object-cover rounded-[3px] shrink-0"
                      onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
                  </div>
                  {/* Package count + type badge */}
                  <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-white/90 text-gray-800 backdrop-blur-sm shadow-sm">
                      <Package className="w-2.5 h-2.5" />{country.packageCount}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                    <p className="text-white font-bold text-[13.5px] leading-snug truncate drop-shadow-sm">{country.name}</p>
                    <p className="text-white/60 text-[10px] font-mono">{country.code}</p>
                  </div>
                </div>
                {/* Card body */}
                <div className="px-3 py-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex text-[9.5px] font-bold px-1.5 py-0.5 rounded-md border ${country.type === "country" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                      {country.type === "country" ? "Country" : "Territory"}
                    </span>
                    {popular && <span className="inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-600 border border-orange-200">Popular</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex text-[9.5px] font-bold px-1.5 py-0.5 rounded-md border ${status ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                      {status ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-green-400 transition-colors pointer-events-none" />
              </button>
            );
          })}
        </div>
      )}

      {/* ── Country drawer ── */}
      {selected && (
        <div>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]" onClick={() => setSelected(null)} />
          <div className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-white shadow-2xl" style={{ width: 500 }}>
            {/* Banner */}
            <div className="shrink-0 border-b border-gray-100">
              <div className="relative h-28 overflow-hidden bg-gradient-to-br from-slate-300 to-slate-500">
                <img src={selected.flagUrl} alt={selected.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = "https://flagcdn.com/w640/un.png"; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <button onClick={() => setSelected(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 flex items-end gap-3">
                  <div>
                    <h2 className="text-white font-bold text-[20px] drop-shadow leading-tight">{selected.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-white/70 text-[12px]">{selected.code}</span>
                      <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${selected.type === "country" ? "bg-emerald-500/80 text-white border-emerald-300" : "bg-blue-500/80 text-white border-blue-300"}`}>
                        {selected.type === "country" ? "Country" : "Territory"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Toggles + tab switcher */}
              <div className="px-4 pt-3 pb-2 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                    <div>
                      <p className="text-[12px] font-semibold text-gray-800">Active</p>
                      <p className="text-[10.5px] text-gray-400">Show in store</p>
                    </div>
                    <CatalogToggle checked={ov(selected.code, "status", true)} onChange={v => setOv(selected.code, "status", v)} activeColor="#22c55e" />
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                    <div>
                      <p className="text-[12px] font-semibold text-gray-800">Popular</p>
                      <p className="text-[10.5px] text-gray-400">Feature it</p>
                    </div>
                    <CatalogToggle checked={ov(selected.code, "popular", false)} onChange={v => setOv(selected.code, "popular", v)} activeColor="#f97316" />
                  </div>
                </div>
                {/* Plans | SEO tab bar */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                  {(["plans", "seo"] as const).map(t => (
                    <button key={t} onClick={() => setDrawerTab(t)}
                      className={`flex-1 py-2 rounded-lg text-[12.5px] font-semibold transition-all ${drawerTab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                      {t === "plans" ? "Plans" : "SEO Settings"}
                    </button>
                  ))}
                </div>
                {/* Search + sort — only in Plans tab */}
                {drawerTab === "plans" && (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input value={drawerSearch} onChange={e => setDrawerSearch(e.target.value)} placeholder="Search plans…"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-[12.5px] text-gray-700 outline-none focus:border-green-400 bg-gray-50 focus:bg-white transition-colors" />
                    </div>
                    <select value={drawerSort} onChange={e => setDrawerSort(e.target.value)}
                      className="px-2.5 py-2 rounded-xl border border-gray-200 text-[12px] text-gray-600 bg-gray-50 outline-none focus:border-green-400 cursor-pointer">
                      <option value="default">Default</option>
                      <option value="price_asc">Price ↑</option>
                      <option value="price_desc">Price ↓</option>
                      <option value="data_desc">Data ↓</option>
                    </select>
                  </div>
                )}
              </div>
              {/* Column labels */}
              {drawerTab === "plans" && (
                <div className="grid px-4 pt-1 pb-2.5" style={{ gridTemplateColumns: "1fr auto" }}>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Plan</span>
                  <div className="flex items-center gap-3 pr-1">
                    {(["On","Pop","Rec","Best"] as const).map(l => (
                      <span key={l} className="text-[9.5px] font-semibold text-gray-400 uppercase tracking-wide w-8 text-center">{l}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Plans tab — package list */}
            {drawerTab === "plans" && (
              <div className="flex-1 overflow-y-auto py-2 px-3 space-y-2">
                {drawerLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse rounded-xl border border-gray-100 p-4">
                      <div className="h-3.5 bg-gray-100 rounded w-1/2 mb-2" /><div className="h-3 bg-gray-100 rounded w-3/4" />
                    </div>
                  ))
                ) : drawerPkgs.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <p className="text-[13.5px] font-semibold text-gray-500">No plans found</p>
                    <p className="text-[12.5px] text-gray-400">Try adjusting your search</p>
                  </div>
                ) : drawerPkgs.map(pkg => {
                  const enabled   = pkgOv(pkg.packageCode, "enabled",   true);
                  const popular   = pkgOv(pkg.packageCode, "popular",   false);
                  const recommend = pkgOv(pkg.packageCode, "recommend", false);
                  const bestVal   = pkgOv(pkg.packageCode, "bestValue", false);
                  const mp        = mPct(pkg);
                  return (
                    <div key={pkg.packageCode}
                      className={`rounded-xl border transition-all ${enabled ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50/50 opacity-60"}`}>
                      <div className="p-3 flex items-start gap-3">
                        {/* Plan info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                            <span className="font-bold text-gray-900 text-[13px] leading-snug">{pkg.name}</span>
                            {bestVal   && <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">⭐ Best</span>}
                            {popular   && <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">Popular</span>}
                            {recommend && <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">Rec</span>}
                          </div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                              <Wifi className="w-2.5 h-2.5" />{pkg.dataGb}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-gray-50 text-gray-600 border border-gray-100">
                              <Clock className="w-2.5 h-2.5" />{pkg.durationLabel}
                            </span>
                            <span className={`inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded-md border capitalize ${cTypePill(pkg.isRegional)}`}>
                              {pkg.isRegional ? "regional" : "local"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px]">
                            <span className="text-gray-400">Cost <span className="font-medium text-gray-600">{fmt$(pkg.wholesalePriceCents)}</span></span>
                            <span className="text-gray-200">•</span>
                            <span className="text-gray-400">Sell <span className="font-bold text-emerald-600">{fmt$(pkg.retailPriceCents)}</span></span>
                            <span className="text-gray-200">•</span>
                            <span className="text-gray-400">Margin <span className="font-medium text-gray-600">{mp.toFixed(0)}%</span></span>
                          </div>
                        </div>
                        {/* ON / POP / REC / BEST toggles */}
                        <div className="flex items-center gap-3 shrink-0 pt-0.5">
                          <CatalogToggle checked={enabled}   onChange={v => setPkgOv(pkg.packageCode, "enabled",   v)} activeColor="#22c55e" label="On" />
                          <CatalogToggle checked={popular}   onChange={v => setPkgOv(pkg.packageCode, "popular",   v)} activeColor="#f97316" label="Pop" />
                          <CatalogToggle checked={recommend} onChange={v => setPkgOv(pkg.packageCode, "recommend", v)} activeColor="#14b8a6" label="Rec" />
                          <CatalogToggle checked={bestVal}   onChange={v => setPkgOv(pkg.packageCode, "bestValue", v)} activeColor="#8b5cf6" label="Best" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* SEO Settings tab */}
            {drawerTab === "seo" && (
              <div className="flex-1 overflow-y-auto py-4 px-4 space-y-4">
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">URL Slug</p>
                  <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden bg-white">
                    <span className="px-3 py-3 text-[12px] text-gray-400 bg-gray-50 border-r border-gray-200 whitespace-nowrap">/destination/</span>
                    <input value={seoForm.urlSlug}
                      onChange={e => setSeoForm(p => ({ ...p, urlSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
                      placeholder="country-name"
                      className="flex-1 px-3 py-3 text-[13px] text-gray-800 outline-none font-mono" />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Custom URL for this country page. Lowercase letters, numbers, hyphens only.</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Meta Title</p>
                  <input value={seoForm.metaTitle}
                    onChange={e => setSeoForm(p => ({ ...p, metaTitle: e.target.value }))}
                    placeholder={`${selected.name} eSIM | Voltey`}
                    className="w-full px-3 py-3 rounded-xl border border-gray-200 text-[13px] text-gray-800 outline-none focus:border-green-400 transition-colors bg-white" />
                  <p className="text-[11px] text-gray-400 mt-1">{seoForm.metaTitle.length}/60 chars</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Meta Description</p>
                  <textarea value={seoForm.metaDesc}
                    onChange={e => setSeoForm(p => ({ ...p, metaDesc: e.target.value }))} rows={3}
                    placeholder={`Get an eSIM for ${selected.name}. Fast, reliable internet from Voltey.`}
                    className="w-full px-3 py-3 rounded-xl border border-gray-200 text-[13px] text-gray-800 outline-none focus:border-green-400 transition-colors resize-none bg-white" />
                  <p className="text-[11px] text-gray-400 mt-1">{seoForm.metaDesc.length}/160 chars</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Keywords</p>
                  <input value={seoForm.metaKw}
                    onChange={e => setSeoForm(p => ({ ...p, metaKw: e.target.value }))}
                    placeholder={`${selected.name} eSIM, travel SIM card`}
                    className="w-full px-3 py-3 rounded-xl border border-gray-200 text-[13px] text-gray-800 outline-none focus:border-green-400 transition-colors bg-white" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Feature Image (OG Image)</p>
                  <input value={seoForm.ogImage}
                    onChange={e => setSeoForm(p => ({ ...p, ogImage: e.target.value }))}
                    placeholder="https://voltey.com/images/albania-esim.jpg"
                    className="w-full px-3 py-3 rounded-xl border border-gray-200 text-[13px] text-gray-800 outline-none focus:border-green-400 transition-colors bg-white font-mono" />
                  <p className="text-[11px] text-gray-400 mt-1">Image shown when sharing this page on social media (og:image). Use a full URL, recommended 1200×630px.</p>
                  {seoForm.ogImage && (
                    <img src={seoForm.ogImage} alt="OG preview" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                      className="mt-2 rounded-lg border border-gray-200 object-cover w-full" style={{ maxHeight: 120 }} />
                  )}
                </div>
                {/* SERP preview */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">SERP Preview</p>
                  <p className="text-[11px] text-gray-400 mb-1">voltey.com › destination › {seoForm.urlSlug || selected.name.toLowerCase().replace(/\s+/g, "-")}</p>
                  <p className="text-[14px] font-medium hover:underline cursor-pointer mb-1 truncate" style={{ color: "#1a0dab" }}>{seoForm.metaTitle || `${selected.name} eSIM | Voltey`}</p>
                  <p className="text-[12px] text-gray-600 line-clamp-2 leading-relaxed">{seoForm.metaDesc || `Get an eSIM for ${selected.name}. Fast, reliable internet.`}</p>
                </div>
              </div>
            )}

            <div className="shrink-0 border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-gray-50/50">
              {drawerTab === "plans"
                ? <p className="text-[12px] text-gray-400">{drawerPkgs.filter(p => pkgOv(p.packageCode, "enabled", true)).length} of {drawerPkgs.length} plans enabled</p>
                : <p className="text-[11px] font-mono text-gray-400">seo:country:{selected.code}</p>
              }
              <div className="flex items-center gap-2">
                {drawerTab === "seo" && (
                  <button onClick={saveCountrySeo} disabled={seoSaving}
                    className="px-4 py-2 rounded-xl text-[12.5px] font-semibold text-white transition-colors disabled:opacity-60"
                    style={{ background: seoSaved ? "#22c55e" : "#111827" }}>
                    {seoSaved ? "Saved!" : seoSaving ? "Saving…" : "Save SEO"}
                  </button>
                )}
                <button onClick={() => setSelected(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-[12.5px] font-semibold hover:bg-gray-200 transition-colors">
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EsimPackagesPage() {
  const { data, isLoading } = useQuery<{ destinations: Dest[] }>({
    queryKey: ["admin-destinations"],
    queryFn: () => fetch("/api/destinations").then((r) => r.json()),
  });
  const [search, setSearch] = useState("");
  const all  = data?.destinations ?? [];
  const list = search.trim() ? all.filter((d) => d.locationName.toLowerCase().includes(search.toLowerCase())) : all;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-[340px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search destinations…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-[14px] text-gray-700 placeholder-gray-400 outline-none focus:border-green-400 bg-white transition-colors shadow-sm"
          />
        </div>
        <p className="text-[13px] text-gray-400">{list.length} packages</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        {isLoading
          ? <div className="grid grid-cols-4 gap-3">{Array.from({length:12}).map((_,i)=>(
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0"/>
                <div className="flex-1 space-y-2"><div className="h-3 bg-gray-200 rounded w-3/4"/><div className="h-2.5 bg-gray-200 rounded w-1/2"/></div>
              </div>
            ))}</div>
          : (
            <div className="grid grid-cols-4 gap-2">
              {list.map((d) => (
                <Link key={d.locationCode} href={`/destination/${d.locationCode}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <img src={d.flagUrl} alt={d.locationName} className="w-9 h-9 rounded-full object-cover shrink-0" style={{boxShadow:"0 0 0 1.5px #e5e7eb"}} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 truncate group-hover:text-green-600 transition-colors">{d.locationName}</p>
                    <p className="text-[11.5px] text-gray-400 mt-0.5">From US${fmtUsd(d.lowestPrice)}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Currencies page
───────────────────────────────────────────────── */
function CurrenciesPage() {
  const API = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

  interface CurrencyDef {
    code: string; name: string; symbol: string;
    rate: number; enabled: boolean; isDefault: boolean;
  }

  type CurrencyForm = {
    code: string; name: string; symbol: string;
    rate: string; enabled: boolean;
  };

  const [currencies,   setCurrencies]   = useState<CurrencyDef[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState<CurrencyDef | null>(null);
  const [form,         setForm]         = useState<CurrencyForm>({ code:"", name:"", symbol:"", rate:"1.000000", enabled:true });
  const [saving,       setSaving]       = useState(false);
  const [fetchingRate, setFetchingRate] = useState(false);
  const [delTarget,    setDelTarget]    = useState<CurrencyDef | null>(null);

  function loadCurrencies() {
    setLoading(true);
    fetch(`${API}/api/admin/currencies`)
      .then(r => r.ok ? r.json() : [])
      .then((d: CurrencyDef[]) => { setCurrencies(d); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { loadCurrencies(); }, []);

  async function fetchLiveRate(code: string) {
    if (!code || code.length < 3) return;
    setFetchingRate(true);
    try {
      const r = await fetch(`https://open.er-api.com/v6/latest/USD`);
      const data = await r.json() as { rates?: Record<string, number> };
      if (data.rates?.[code]) {
        setForm(p => ({ ...p, rate: data.rates![code].toFixed(6) }));
      }
    } catch { /* ignore */ }
    setFetchingRate(false);
  }

  async function saveCurrency() {
    setSaving(true);
    const method = editTarget ? "PUT" : "POST";
    const url = editTarget
      ? `${API}/api/admin/currencies/${editTarget.code}`
      : `${API}/api/admin/currencies`;
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, rate: parseFloat(form.rate) || 1 }),
    }).catch(() => {});
    setSaving(false);
    setModalOpen(false);
    loadCurrencies();
  }

  async function deleteCurrency(code: string) {
    await fetch(`${API}/api/admin/currencies/${code}`, { method: "DELETE" }).catch(() => {});
    setDelTarget(null);
    loadCurrencies();
  }

  async function toggleEnabled(c: CurrencyDef) {
    if (c.isDefault) return;
    await fetch(`${API}/api/admin/currencies/${c.code}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...c, enabled: !c.enabled }),
    }).catch(() => {});
    loadCurrencies();
  }

  async function setDefault(code: string) {
    await fetch(`${API}/api/admin/currencies/${code}/set-default`, { method: "POST" }).catch(() => {});
    loadCurrencies();
  }

  function openAdd() {
    setEditTarget(null);
    setForm({ code:"", name:"", symbol:"", rate:"1.000000", enabled:true });
    setModalOpen(true);
  }

  function openEdit(c: CurrencyDef) {
    setEditTarget(c);
    setForm({ code:c.code, name:c.name, symbol:c.symbol, rate:c.rate.toFixed(6), enabled:c.enabled });
    setModalOpen(true);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">Currency Management</h1>
          <p className="text-[14.5px] text-gray-500 mt-1">Manage currencies and conversion rates for your platform</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl font-semibold text-[13.5px] hover:bg-green-600 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Currency
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Database className="w-4 h-4 text-amber-600" />
            </div>
            <h2 className="text-[16px] font-bold text-gray-900">Currencies</h2>
          </div>
          <p className="text-[13px] text-gray-500 ml-[42px]">
            All prices are stored in USD. Conversion rates are multipliers from USD to target currency.
          </p>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 animate-spin text-gray-300" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/60">
                  <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Conversion Rate</th>
                  <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Default</th>
                  <th className="px-6 py-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currencies.map(c => (
                  <tr key={c.code} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-[20px] font-bold text-gray-700 leading-none">{c.symbol}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-[12.5px] font-bold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-lg">{c.code}</span>
                    </td>
                    <td className="px-6 py-4 text-[13.5px] text-gray-700 font-medium">{c.name}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-[12.5px] text-gray-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                        1 USD = {c.rate.toFixed(6)} {c.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleEnabled(c)}
                        disabled={c.isDefault}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          c.enabled ? "bg-green-500" : "bg-gray-200"
                        } ${c.isDefault ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${c.enabled ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      {c.isDefault ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold bg-green-50 text-green-700 border border-green-200">
                          <CheckCircle className="w-3.5 h-3.5" />Default
                        </span>
                      ) : (
                        <button
                          onClick={() => setDefault(c.code)}
                          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors"
                        >
                          Set Default
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(c)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors border border-gray-200 group-hover:border-gray-300"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {!c.isDefault && (
                          <button
                            onClick={() => setDelTarget(c)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors border border-gray-200 group-hover:border-gray-300"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {currencies.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-[14px] text-gray-400">No currencies configured. Add one to get started.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info banner */}
      <div className="mt-4 flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3.5">
        <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-semibold text-blue-800 mb-0.5">How currency conversion works</p>
          <p className="text-[12.5px] text-blue-700 leading-relaxed">
            All prices are stored in USD. When a customer selects a different currency in the storefront, all prices are multiplied by the conversion rate in real-time. Use the &quot;Fetch Live Rate&quot; button when adding currencies to auto-fill the current market rate.
          </p>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="text-[17px] font-bold text-gray-900">{editTarget ? "Edit Currency" : "Add Currency"}</h3>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Code + Live Rate */}
              <div>
                <label className="block text-[12px] font-bold text-gray-600 mb-1.5">Currency Code *</label>
                <div className="flex gap-2">
                  <input
                    value={form.code}
                    onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase().slice(0,3) }))}
                    disabled={!!editTarget}
                    placeholder="e.g. EUR"
                    maxLength={3}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-[13.5px] font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                  <button
                    onClick={() => fetchLiveRate(form.code)}
                    disabled={form.code.length < 3 || fetchingRate}
                    className="px-3 py-2 rounded-xl border border-gray-200 text-[12px] font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${fetchingRate ? "animate-spin" : ""}`} />
                    Live Rate
                  </button>
                </div>
                {editTarget && <p className="text-[11px] text-gray-400 mt-1">Currency code cannot be changed after creation.</p>}
              </div>

              {/* Name */}
              <div>
                <label className="block text-[12px] font-bold text-gray-600 mb-1.5">Currency Name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Euro"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>

              {/* Symbol */}
              <div>
                <label className="block text-[12px] font-bold text-gray-600 mb-1.5">Symbol *</label>
                <input
                  value={form.symbol}
                  onChange={e => setForm(p => ({ ...p, symbol: e.target.value }))}
                  placeholder="e.g. €"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>

              {/* Rate */}
              <div>
                <label className="block text-[12px] font-bold text-gray-600 mb-1.5">Conversion Rate (1 USD = ? {form.code || "…"}) *</label>
                <input
                  value={form.rate}
                  onChange={e => setForm(p => ({ ...p, rate: e.target.value }))}
                  placeholder="1.000000"
                  type="number"
                  step="0.000001"
                  min="0.000001"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13.5px] font-mono focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <p className="text-[11.5px] text-gray-400 mt-1">
                  Preview: US$10.00 → {form.symbol || "?"}{(10 * (parseFloat(form.rate) || 1)).toFixed(2)} {form.code || ""}
                </p>
              </div>

              {/* Enabled toggle */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-[13px] font-semibold text-gray-700">Enabled for customers</p>
                  <p className="text-[11.5px] text-gray-400 mt-0.5">Show this currency in the storefront selector</p>
                </div>
                <button
                  onClick={() => setForm(p => ({ ...p, enabled: !p.enabled }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.enabled ? "bg-green-500" : "bg-gray-200"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.enabled ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveCurrency}
                disabled={saving || !form.code || !form.name || !form.symbol || !form.rate}
                className="flex-1 py-2.5 rounded-xl bg-green-500 text-white text-[13.5px] font-semibold hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                {editTarget ? "Save Changes" : "Add Currency"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {delTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-[17px] font-bold text-gray-900 mb-2">Delete {delTarget.name}?</h3>
            <p className="text-[13.5px] text-gray-500 mb-6">
              This will remove <strong>{delTarget.code}</strong> from the platform. Customers using this currency will fall back to the default.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDelTarget(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => deleteCurrency(delTarget.code)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13.5px] font-semibold hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Failover & API page
───────────────────────────────────────────────── */
function FailoverApiPage() {
  const API = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

  type FTab = "failover" | "providers" | "api-keys";

  interface FailoverConfig { enabled: boolean; minMargin: number; maxAttempts: number; }
  interface Provider { id: string; name: string; priority: number; status: "active" | "disabled"; margin: number; preferred: boolean; }
  interface ApiKey { id: string; name: string; key: string; rateLimit: number; createdAt: string; lastUsed: string | null; usageCount: number; }

  const [fTab,         setFTab]         = useState<FTab>("failover");
  const [config,       setConfig]       = useState<FailoverConfig>({ enabled: false, minMargin: 15, maxAttempts: 3 });
  const [providers,    setProviders]    = useState<Provider[]>([]);
  const [apiKeys,      setApiKeys]      = useState<ApiKey[]>([]);
  const [loadingCfg,   setLoadingCfg]   = useState(true);
  const [loadingProv,  setLoadingProv]  = useState(true);
  const [loadingKeys,  setLoadingKeys]  = useState(true);

  // inline edit state for config fields
  const [marginVal,    setMarginVal]    = useState("15");
  const [attemptsVal,  setAttemptsVal]  = useState("3");
  const [savingMargin, setSavingMargin] = useState(false);
  const [savingAttempts, setSavingAttempts] = useState(false);

  // inline margin edit per provider
  const [provMargins,  setProvMargins]  = useState<Record<string, string>>({});
  const [savingProv,   setSavingProv]   = useState<Record<string, boolean>>({});

  // api key modal
  const [keyModal,     setKeyModal]     = useState(false);
  const [keyName,      setKeyName]      = useState("");
  const [keyRate,      setKeyRate]      = useState("1000");
  const [creatingKey,  setCreatingKey]  = useState(false);
  const [newKey,       setNewKey]       = useState<ApiKey | null>(null);
  const [copiedKey,    setCopiedKey]    = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);

  function loadConfig() {
    setLoadingCfg(true);
    fetch(`${API}/api/admin/failover/config`)
      .then(r => r.ok ? r.json() : config)
      .then((d: FailoverConfig) => {
        setConfig(d);
        setMarginVal(String(d.minMargin));
        setAttemptsVal(String(d.maxAttempts));
        setLoadingCfg(false);
      }).catch(() => setLoadingCfg(false));
  }

  function loadProviders() {
    setLoadingProv(true);
    fetch(`${API}/api/admin/failover/providers`)
      .then(r => r.ok ? r.json() : [])
      .then((d: Provider[]) => {
        setProviders(d);
        const m: Record<string, string> = {};
        d.forEach(p => { m[p.id] = String(p.margin); });
        setProvMargins(m);
        setLoadingProv(false);
      }).catch(() => setLoadingProv(false));
  }

  function loadApiKeys() {
    setLoadingKeys(true);
    fetch(`${API}/api/admin/failover/api-keys`)
      .then(r => r.ok ? r.json() : [])
      .then((d: ApiKey[]) => { setApiKeys(d); setLoadingKeys(false); })
      .catch(() => setLoadingKeys(false));
  }

  useEffect(() => { loadConfig(); loadProviders(); loadApiKeys(); }, []);

  async function toggleEnabled() {
    const next = { ...config, enabled: !config.enabled };
    setConfig(next);
    await fetch(`${API}/api/admin/failover/config`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    }).catch(() => {});
  }

  async function saveMargin() {
    setSavingMargin(true);
    const v = parseFloat(marginVal);
    if (!isNaN(v)) {
      const next = { ...config, minMargin: v };
      await fetch(`${API}/api/admin/failover/config`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).catch(() => {});
      setConfig(next);
    }
    setSavingMargin(false);
  }

  async function saveAttempts() {
    setSavingAttempts(true);
    const v = parseInt(attemptsVal);
    if (!isNaN(v)) {
      const next = { ...config, maxAttempts: v };
      await fetch(`${API}/api/admin/failover/config`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).catch(() => {});
      setConfig(next);
    }
    setSavingAttempts(false);
  }

  async function saveProvMargin(id: string) {
    setSavingProv(p => ({ ...p, [id]: true }));
    const v = parseFloat(provMargins[id] ?? "20");
    await fetch(`${API}/api/admin/failover/providers/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ margin: isNaN(v) ? 20 : v }),
    }).catch(() => {});
    loadProviders();
    setSavingProv(p => ({ ...p, [id]: false }));
  }

  async function toggleProvStatus(p: Provider) {
    const next = p.status === "active" ? "disabled" : "active";
    await fetch(`${API}/api/admin/failover/providers/${p.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    }).catch(() => {});
    loadProviders();
  }

  async function moveProvider(id: string, dir: "up" | "down") {
    await fetch(`${API}/api/admin/failover/providers/${id}/move`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction: dir }),
    }).catch(() => {});
    loadProviders();
  }

  async function createApiKey() {
    if (!keyName.trim()) return;
    setCreatingKey(true);
    const r = await fetch(`${API}/api/admin/failover/api-keys`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: keyName.trim(), rateLimit: parseInt(keyRate) || 1000 }),
    }).catch(() => null);
    if (r?.ok) {
      const k: ApiKey = await r.json();
      setNewKey(k);
      setKeyModal(false);
      setKeyName(""); setKeyRate("1000");
      loadApiKeys();
    }
    setCreatingKey(false);
  }

  async function revokeKey(id: string) {
    await fetch(`${API}/api/admin/failover/api-keys/${id}`, { method: "DELETE" }).catch(() => {});
    setRevokeTarget(null);
    loadApiKeys();
  }

  async function regenerateKey(id: string) {
    const r = await fetch(`${API}/api/admin/failover/api-keys/${id}/regenerate`, { method: "POST" }).catch(() => null);
    if (r?.ok) loadApiKeys();
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key).then(() => {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    });
  }

  const TABS: { id: FTab; label: string; icon: string }[] = [
    { id: "failover",   label: "Failover",          icon: "/icons/lottie/route square.json" },
    { id: "providers",  label: "Provider Priority",  icon: "/icons/lottie/3square.json" },
    { id: "api-keys",   label: "API Keys",           icon: "/icons/lottie/link 2.json" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <LottieIcon src="/icons/lottie/code.json" size={36} autoplay loop />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Smart Failover Settings</h1>
          <p className="text-[13.5px] text-gray-500 mt-0.5">Configure automatic order routing when providers fail</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setFTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-all -mb-px ${fTab === t.id ? "border-[#22c55e] text-[#16a34a]" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            <LottieIcon src={t.icon} size={16} autoplay={fTab === t.id} loop />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Failover ── */}
      {fTab === "failover" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <LottieIcon src="/icons/lottie/route square.json" size={22} autoplay loop />
            <div>
              <h2 className="text-[17px] font-bold text-gray-900">Smart Failover Configuration</h2>
              <p className="text-[12.5px] text-gray-500">When a provider fails to fulfill an order, the system can automatically try alternative providers</p>
            </div>
          </div>

          {/* Enable toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-[14px] font-semibold text-gray-800">Enable Smart Failover</p>
              <p className="text-[12.5px] text-gray-500">Automatically route orders to backup providers when primary fails</p>
            </div>
            <button onClick={toggleEnabled} disabled={loadingCfg}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${config.enabled ? "bg-[#22c55e]" : "bg-gray-300"}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${config.enabled ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          {/* Global Minimum Margin */}
          <div className="space-y-1.5">
            <p className="text-[13.5px] font-semibold text-gray-800">Global Minimum Margin (%)</p>
            <div className="flex items-center gap-2">
              <input type="number" value={marginVal} onChange={e => setMarginVal(e.target.value)}
                className="w-28 px-3 py-2 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#22c55e]/40" />
              <button onClick={saveMargin} disabled={savingMargin}
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] transition-colors">
                {savingMargin
                  ? <LottieIcon src="/icons/lottie/refresh-circle.json" size={18} autoplay loop />
                  : <LottieIcon src="/icons/lottie/document-download.json" size={18} autoplay loop />}
              </button>
            </div>
            <p className="text-[12px] text-gray-400">Minimum profit margin required for failover to proceed</p>
          </div>

          {/* Max Failover Attempts */}
          <div className="space-y-1.5">
            <p className="text-[13.5px] font-semibold text-gray-800">Maximum Failover Attempts</p>
            <div className="flex items-center gap-2">
              <input type="number" min={1} max={10} value={attemptsVal} onChange={e => setAttemptsVal(e.target.value)}
                className="w-28 px-3 py-2 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#22c55e]/40" />
              <button onClick={saveAttempts} disabled={savingAttempts}
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] transition-colors">
                {savingAttempts
                  ? <LottieIcon src="/icons/lottie/refresh-circle.json" size={18} autoplay loop />
                  : <LottieIcon src="/icons/lottie/document-download.json" size={18} autoplay loop />}
              </button>
            </div>
            <p className="text-[12px] text-gray-400">How many alternative providers to try before giving up</p>
          </div>

          {/* How Failover Works */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <LottieIcon src="/icons/lottie/danger.json" size={18} autoplay loop />
              <p className="text-[13.5px] font-bold text-amber-800">How Failover Works</p>
            </div>
            <ol className="space-y-1 pl-2">
              {[
                "Primary provider receives the order first",
                "If it fails, system checks alternative providers by priority",
                "Only providers with packages meeting margin requirements are used",
                "Order is routed to the first successful provider",
                "All attempts are logged for admin review",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-[12.5px] text-amber-700">
                  <span className="font-bold shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* ── Tab: Provider Priority ── */}
      {fTab === "providers" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <LottieIcon src="/icons/lottie/3square.json" size={22} autoplay loop />
            <div>
              <h2 className="text-[17px] font-bold text-gray-900">Provider Failover Priority</h2>
              <p className="text-[12.5px] text-gray-500">Order determines which provider is tried first during failover</p>
            </div>
          </div>

          {loadingProv ? (
            <div className="flex justify-center py-10">
              <LottieIcon src="/icons/lottie/refresh-circle.json" size={36} autoplay loop />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-gray-400 text-[11.5px] uppercase tracking-wide border-b border-gray-100">
                    <th className="pb-2 pr-4 font-semibold w-16">Priority</th>
                    <th className="pb-2 pr-4 font-semibold">Provider</th>
                    <th className="pb-2 pr-4 font-semibold">Status</th>
                    <th className="pb-2 pr-4 font-semibold text-right">Margin %</th>
                    <th className="pb-2 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {providers.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 pr-4 font-bold text-gray-700">{p.priority}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{p.name}</span>
                          {p.preferred && (
                            <span className="px-1.5 py-0.5 rounded-md bg-[#dcfce7] text-[#16a34a] text-[10.5px] font-bold">Preferred</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <button onClick={() => toggleProvStatus(p)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11.5px] font-bold transition-all ${p.status === "active" ? "bg-[#dcfce7] text-[#16a34a]" : "bg-gray-900 text-white"}`}>
                          {p.status === "active" && <LottieIcon src="/icons/lottie/tick-circle.json" size={12} autoplay loop />}
                          {p.status === "active" ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <input type="number" step="0.01" min={0} max={100}
                            value={provMargins[p.id] ?? String(p.margin)}
                            onChange={e => setProvMargins(m => ({ ...m, [p.id]: e.target.value }))}
                            className="w-20 px-2 py-1 rounded-lg border border-gray-200 text-right text-[13px] focus:outline-none focus:ring-2 focus:ring-[#22c55e]/40" />
                          <span className="text-gray-400 text-[12px]">%</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => saveProvMargin(p.id)} disabled={savingProv[p.id]}
                            title="Save margin"
                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-white transition-colors">
                            {savingProv[p.id]
                              ? <LottieIcon src="/icons/lottie/refresh-circle.json" size={14} autoplay loop />
                              : <LottieIcon src="/icons/lottie/document-download.json" size={14} autoplay loop />}
                          </button>
                          <button onClick={() => moveProvider(p.id, "up")} disabled={idx === 0}
                            className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M5 15l7-7 7 7"/></svg>
                          </button>
                          <button onClick={() => moveProvider(p.id, "down")} disabled={idx === providers.length - 1}
                            className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: API Keys ── */}
      {fTab === "api-keys" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <LottieIcon src="/icons/lottie/link 2.json" size={22} autoplay loop />
              <div>
                <h2 className="text-[17px] font-bold text-gray-900">External API Keys</h2>
                <p className="text-[12.5px] text-gray-500">Manage API keys for external partners and mobile applications</p>
              </div>
            </div>
            <button onClick={() => setKeyModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-white text-[13px] font-semibold transition-colors">
              <LottieIcon src="/icons/lottie/add-circle.json" size={16} autoplay loop />
              Create API Key
            </button>
          </div>

          {/* Newly created key banner */}
          {newKey && (
            <div className="rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] p-4 space-y-2">
              <div className="flex items-center gap-2">
                <LottieIcon src="/icons/lottie/tick-circle.json" size={18} autoplay loop />
                <p className="text-[13px] font-bold text-[#16a34a]">API Key created — copy it now, it won&apos;t be shown again</p>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-lg border border-[#bbf7d0] px-3 py-2">
                <code className="flex-1 text-[12px] text-gray-700 font-mono break-all">{newKey.key}</code>
                <button onClick={() => copyKey(newKey.key)}
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-[#22c55e] text-white text-[11.5px] font-bold hover:bg-[#16a34a] transition-colors">
                  {copiedKey ? "Copied!" : "Copy"}
                </button>
              </div>
              <button onClick={() => setNewKey(null)} className="text-[11.5px] text-gray-400 hover:text-gray-600">Dismiss</button>
            </div>
          )}

          {loadingKeys ? (
            <div className="flex justify-center py-10">
              <LottieIcon src="/icons/lottie/refresh-circle.json" size={36} autoplay loop />
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <LottieIcon src="/icons/lottie/link 2.json" size={48} autoplay loop />
              <p className="text-[14px] font-medium">No API keys created yet. Click &quot;Create API Key&quot; to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-gray-400 text-[11.5px] uppercase tracking-wide border-b border-gray-100">
                    <th className="pb-2 pr-4 font-semibold">Name</th>
                    <th className="pb-2 pr-4 font-semibold">Key (masked)</th>
                    <th className="pb-2 pr-4 font-semibold text-right">Rate Limit</th>
                    <th className="pb-2 pr-4 font-semibold">Created</th>
                    <th className="pb-2 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {apiKeys.map(k => (
                    <tr key={k.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 pr-4 font-semibold text-gray-800">{k.name}</td>
                      <td className="py-3 pr-4 font-mono text-[12px] text-gray-500">
                        {k.key.slice(0, 18)}{"•".repeat(12)}
                      </td>
                      <td className="py-3 pr-4 text-right text-gray-600">{k.rateLimit.toLocaleString()}/day</td>
                      <td className="py-3 pr-4 text-gray-400">{new Date(k.createdAt).toLocaleDateString()}</td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => regenerateKey(k.id)} title="Regenerate key"
                            className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors">
                            <LottieIcon src="/icons/lottie/refresh-circle.json" size={15} autoplay loop />
                          </button>
                          <button onClick={() => setRevokeTarget(k)} title="Revoke key"
                            className="flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 transition-colors">
                            <LottieIcon src="/icons/lottie/close-circle.json" size={15} autoplay loop />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Create API Key modal ── */}
      {keyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-gray-900">Create New API Key</h3>
                <p className="text-[12px] text-gray-500">Generate a new API key for external integrations</p>
              </div>
              <button onClick={() => { setKeyModal(false); setKeyName(""); setKeyRate("1000"); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[12.5px] font-semibold text-gray-700">Name</label>
                <input type="text" placeholder="e.g., Mobile App Production" value={keyName}
                  onChange={e => setKeyName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-[#22c55e]/40" />
              </div>
              <div className="space-y-1">
                <label className="text-[12.5px] font-semibold text-gray-700">Rate Limit (requests/day)</label>
                <input type="number" min={1} value={keyRate} onChange={e => setKeyRate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-[#22c55e]/40" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => { setKeyModal(false); setKeyName(""); setKeyRate("1000"); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={createApiKey} disabled={creatingKey || !keyName.trim()}
                className="flex-1 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-white text-[13.5px] font-semibold disabled:opacity-60 transition-colors">
                {creatingKey ? "Generating…" : "Generate Key"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Revoke confirm modal ── */}
      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <LottieIcon src="/icons/lottie/close-circle.json" size={28} autoplay loop />
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">Revoke API Key</h3>
                <p className="text-[12.5px] text-gray-500">This action cannot be undone. Any integrations using this key will stop working immediately.</p>
              </div>
            </div>
            <p className="text-[13px] text-gray-700">Revoke <span className="font-semibold">"{revokeTarget.name}"</span>?</p>
            <div className="flex gap-2">
              <button onClick={() => setRevokeTarget(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => revokeKey(revokeTarget.id)} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[13.5px] font-semibold transition-colors">Revoke Key</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Settings page
───────────────────────────────────────────────── */
function SettingsPage() {
  type PS = {
    platformName: string; tagline: string; email: string; phone: string;
    supportInfo: string; location: string; currency: string; copyright: string;
    packageMode: "auto" | "manual"; aiEnabled: boolean;
    smtpHost: string; smtpPort: string; smtpUser: string; smtpFrom: string; smtpPass: string;
    fbApiKey: string; fbAuthDomain: string; fbProjectId: string; fbBucket: string;
    fbSenderId: string; fbAppId: string; fbMeasId: string;
    fbClientEmail: string; fbPrivateKey: string;
    rcEnabled: boolean; rcSiteKey: string; rcSecretKey: string; rcVersion: "v2" | "v3";
    appleAppId: string; appleBundleId: string; appleKeyId: string;
    appleIssuerId: string; appleSharedSecret: string; applePrivKey: string;
    googlePkg: string; googleSvcJson: string;
    primaryColor: string; secondaryColor: string; lightColor: string; darkColor: string;
    headingFont: string; bodyFont: string;
    webUrl: string;
    fbSocUrl: string; fbSocOn: boolean;
    igUrl: string; igOn: boolean;
    twUrl: string; twOn: boolean;
    liUrl: string; liOn: boolean;
    ytUrl: string; ytOn: boolean;
    androidUrl: string; androidOn: boolean;
    iosUrl: string; iosOn: boolean;
    metaTitle: string; metaDesc: string; metaKw: string; twHandle: string;
    googleVerify: string; bingVerify: string;
    twoFA: boolean; sessionMin: string; pwdMinLen: string;
    popupOn: boolean; popupTitle: string; popupMsg: string; popupBtn: string; popupUrl: string;
    maintMode: boolean;
  };

  const DEF: PS = {
    platformName: "Voltey", tagline: "Connect anywhere. Power anyone",
    email: "info@voltey.com", phone: "+44 7411 527226",
    supportInfo: "24/7 Customer Support Available", location: "United Kingdom",
    currency: "USD", copyright: `${new Date().getFullYear()} Voltey`,
    packageMode: "auto", aiEnabled: false,
    smtpHost: "smtp.zeptomail.com", smtpPort: "587",
    smtpUser: "emailapikey", smtpFrom: "info@voltey.com", smtpPass: "",
    fbApiKey: "", fbAuthDomain: "", fbProjectId: "", fbBucket: "",
    fbSenderId: "", fbAppId: "", fbMeasId: "", fbClientEmail: "", fbPrivateKey: "",
    rcEnabled: false, rcSiteKey: "", rcSecretKey: "", rcVersion: "v3",
    appleAppId: "", appleBundleId: "", appleKeyId: "",
    appleIssuerId: "", appleSharedSecret: "", applePrivKey: "",
    googlePkg: "", googleSvcJson: "",
    primaryColor: "#148978", secondaryColor: "#0CAA77", lightColor: "#148C82", darkColor: "#0CAA77",
    headingFont: "Inter", bodyFont: "Inter",
    webUrl: "https://voltey.com/",
    fbSocUrl: "https://www.facebook.com/volteytel", fbSocOn: true,
    igUrl: "https://www.instagram.com/simfinityesim", igOn: true,
    twUrl: "https://x.com/Simfinitytel", twOn: true,
    liUrl: "https://www.linkedin.com/showcase/simfinityesim/", liOn: true,
    ytUrl: "https://www.youtube.com/@Simfinityesim", ytOn: true,
    androidUrl: "https://play.google.com/store/apps/details?id=com.yourapp", androidOn: true,
    iosUrl: "https://apps.apple.com/app/yourapp", iosOn: true,
    metaTitle: "Voltey eSIM | Global Travel eSIM for Seamless Connectivity",
    metaDesc: "Stay connected worldwide with Voltey eSIM. Enjoy fast, reliable mobile internet in any country without roaming hassle or physical SIM cards.",
    metaKw: "Voltey eSIM", twHandle: "@yourbrand", googleVerify: "", bingVerify: "",
    twoFA: false, sessionMin: "60", pwdMinLen: "8",
    popupOn: false, popupTitle: "", popupMsg: "", popupBtn: "Learn More", popupUrl: "",
    maintMode: false,
  };

  const [s, setS] = useState<PS>(() => {
    try { return { ...DEF, ...JSON.parse(localStorage.getItem("voltey-platform-settings") ?? "{}") }; }
    catch { return DEF; }
  });
  const [activeTab, setActiveTab] = useState("general");
  const [saved, setSaved] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  type LogoKey = "platform" | "white" | "favicon";
  const LOGO_STORE: Record<LogoKey, string> = {
    platform: "voltey-logo-platform",
    white:    "voltey-logo-white",
    favicon:  "voltey-logo-favicon",
  };
  const [logos, setLogos] = useState<Record<LogoKey, string>>(() => ({
    platform: localStorage.getItem("voltey-logo-platform") ?? "",
    white:    localStorage.getItem("voltey-logo-white")    ?? "",
    favicon:  localStorage.getItem("voltey-logo-favicon")  ?? "",
  }));
  const [logoNames, setLogoNames] = useState<Record<LogoKey, string>>({
    platform: "", white: "", favicon: "",
  });

  function handleLogoFile(key: LogoKey, file: File) {
    setLogoNames(p => ({ ...p, [key]: file.name }));
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setLogos(p => ({ ...p, [key]: dataUrl }));
      localStorage.setItem(LOGO_STORE[key], dataUrl);
      window.dispatchEvent(new CustomEvent("voltey-logo-changed"));
    };
    reader.readAsDataURL(file);
  }

  function removeLogo(key: LogoKey) {
    setLogos(p => ({ ...p, [key]: "" }));
    setLogoNames(p => ({ ...p, [key]: "" }));
    localStorage.removeItem(LOGO_STORE[key]);
    window.dispatchEvent(new CustomEvent("voltey-logo-changed"));
  }

  function upd<K extends keyof PS>(k: K, v: PS[K]) { setS(p => ({ ...p, [k]: v })); }

  function save(section: string) {
    localStorage.setItem("voltey-platform-settings", JSON.stringify(s));
    window.dispatchEvent(new CustomEvent("voltey-settings-changed"));
    setSaved(section);
    setTimeout(() => setSaved(null), 2500);
    if (section === "smtp") {
      fetch("/api/admin/smtp-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: s.smtpHost, port: s.smtpPort,
          username: s.smtpUser, password: s.smtpPass, fromEmail: s.smtpFrom,
        }),
      }).catch(console.error);
    }
  }

  /* ── Reusable micro-helpers ── */
  const inp = "w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] text-gray-800 outline-none focus:border-green-400 transition-colors bg-white";
  const inpSm = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[13.5px] text-gray-800 outline-none focus:border-green-400 transition-colors bg-white";

  const Lbl = ({ t, req }: { t: string; req?: boolean }) => (
    <div className="flex items-center gap-1.5 mb-1.5">
      {req && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 inline-block" />}
      <p className="text-[13.5px] font-bold text-gray-800">{t}</p>
    </div>
  );

  const SH = ({ src, title, sub, bg = "#f0fdf4" }: { src: string; title: string; sub: string; bg?: string }) => (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: bg }}>
        <LottieIcon src={src} size={28} autoplay loop />
      </div>
      <div>
        <h2 className="text-[20px] font-bold" style={{ color: "#22c55e" }}>{title}</h2>
        <p className="text-[13px] text-gray-500 mt-0.5">{sub}</p>
      </div>
    </div>
  );

  const SaveBtn = ({ id, label }: { id: string; label: string }) => (
    <button onClick={() => save(id)}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-bold text-white shadow-sm transition-all"
      style={{ background: "#22c55e" }}>
      {saved === id ? <><Check className="w-4 h-4" /> Saved!</> : <><CheckCircle className="w-4 h-4" /> {label}</>}
    </button>
  );

  const ColorField = ({ label, value, onChange, desc }: { label: string; value: string; onChange: (v: string) => void; desc: string }) => (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[13.5px] font-bold text-gray-800">{label}</p>
          <p className="text-[12px] text-gray-400 mt-0.5">{desc}</p>
        </div>
        <div className="w-9 h-9 rounded-xl border border-gray-200 shrink-0 overflow-hidden relative" style={{ background: value }}>
          <input type="color" value={value} onChange={e => onChange(e.target.value)}
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
        </div>
      </div>
      <p className="text-[12px] font-semibold text-gray-500 mb-1.5">Hex Code</p>
      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
        <input value={value} onChange={e => onChange(e.target.value)} placeholder="#148978"
          className="flex-1 px-3 py-2.5 text-[13.5px] font-mono text-gray-700 outline-none" />
        <Eye className="w-4 h-4 text-gray-400 mr-3 shrink-0" />
      </div>
      <div className="h-1.5 rounded-full mt-2.5" style={{ background: value }} />
    </div>
  );

  type SocialItem = {
    label: string;
    urlKey: "fbSocUrl" | "igUrl" | "twUrl" | "liUrl" | "ytUrl" | "androidUrl" | "iosUrl";
    activeKey: "fbSocOn" | "igOn" | "twOn" | "liOn" | "ytOn" | "androidOn" | "iosOn";
    ph: string;
  };
  const SOCIAL_ITEMS: SocialItem[] = [
    { label: "Facebook",    urlKey: "fbSocUrl",   activeKey: "fbSocOn",   ph: "https://facebook.com/yourpage" },
    { label: "Instagram",   urlKey: "igUrl",      activeKey: "igOn",      ph: "https://instagram.com/yourhandle" },
    { label: "Twitter / X", urlKey: "twUrl",      activeKey: "twOn",      ph: "https://x.com/yourhandle" },
    { label: "LinkedIn",    urlKey: "liUrl",      activeKey: "liOn",      ph: "https://linkedin.com/company/yourcompany" },
    { label: "YouTube",     urlKey: "ytUrl",      activeKey: "ytOn",      ph: "https://youtube.com/@yourchannel" },
    { label: "Android",     urlKey: "androidUrl", activeKey: "androidOn", ph: "https://play.google.com/store/apps/details?id=..." },
    { label: "iOS",         urlKey: "iosUrl",     activeKey: "iosOn",     ph: "https://apps.apple.com/app/yourapp" },
  ];

  const TABS = [
    { id: "general",     label: "General",            Icon: LayoutGrid  },
    { id: "smtp",        label: "SMTP",               Icon: Mail        },
    { id: "firebase",    label: "Firebase",           Icon: Database    },
    { id: "recaptcha",   label: "reCAPTCHA",          Icon: ShieldCheck },
    { id: "appstores",   label: "App Stores",         Icon: Smartphone  },
    { id: "appearance",  label: "Appearance",         Icon: Palette     },
    { id: "social",      label: "Social Media",       Icon: Globe       },
    { id: "seo",         label: "SEO & Meta",         Icon: Search      },
    { id: "account",     label: "Account & Security", Icon: Lock        },
    { id: "popup",       label: "Homepage Popup",     Icon: Bell        },
    { id: "maintenance", label: "Maintenance",        Icon: Wrench      },
  ] as const;

  const FONTS = ["Inter", "Poppins", "Nunito", "Roboto", "Open Sans", "Lato", "Montserrat", "DM Sans"];

  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
          <LottieIcon src="/icons/setting.json" size={32} autoplay loop />
        </div>
        <div>
          <h1 className="text-[28px] font-bold text-gray-900">Global Settings</h1>
          <p className="text-[13.5px] text-gray-400 mt-0.5">Configure system-wide settings</p>
        </div>
      </div>

      {/* ── Tab bar + content card ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Scrollable tab bar */}
        <div className="overflow-x-auto border-b border-gray-100 bg-gray-50/40">
          <div className="flex min-w-max">
            {TABS.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-3.5 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === id
                    ? "border-emerald-500 text-emerald-700 bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-white/60"
                }`}>
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ══════════ GENERAL ══════════ */}
        {activeTab === "general" && (
          <div className="p-6 space-y-10">

            {/* Platform Information */}
            <div>
              <SH src="/icons/category.json" title="Platform Information" sub="Configure your platform's basic information and branding" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Left: text fields */}
                <div className="space-y-4">
                  <div><Lbl t="Platform Name" /><input value={s.platformName} onChange={e => upd("platformName", e.target.value)} className={inp} /></div>
                  <div><Lbl t="Tagline" /><input value={s.tagline} onChange={e => upd("tagline", e.target.value)} className={inp} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Lbl t="Email" /><input value={s.email} onChange={e => upd("email", e.target.value)} type="email" className={inp} /></div>
                    <div><Lbl t="Phone" /><input value={s.phone} onChange={e => upd("phone", e.target.value)} className={inp} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Lbl t="Support Info" /><input value={s.supportInfo} onChange={e => upd("supportInfo", e.target.value)} className={inp} /></div>
                    <div><Lbl t="Location" /><input value={s.location} onChange={e => upd("location", e.target.value)} className={inp} /></div>
                  </div>
                  <div>
                    <Lbl t="Default Currency" />
                    <select value={s.currency} onChange={e => upd("currency", e.target.value)}
                      className={`${inp} cursor-pointer`}>
                      {[["USD","US Dollar"],["EUR","Euro"],["GBP","British Pound"],["CAD","Canadian Dollar"],["AUD","Australian Dollar"],["JPY","Japanese Yen"],["SGD","Singapore Dollar"]].map(([v,l]) => (
                        <option key={v} value={v}>$ {v} — {l}</option>
                      ))}
                    </select>
                    <p className="text-[12px] text-gray-400 mt-1.5">Select the default currency for your platform.</p>
                  </div>
                  <div><Lbl t="Copyright Text" /><input value={s.copyright} onChange={e => upd("copyright", e.target.value)} className={inp} /></div>
                  <SaveBtn id="general" label="Save General Settings" />
                </div>

                {/* Right: logos */}
                <div className="space-y-4">
                  {(([
                    { title: "Platform Logo",        desc: "Recommended: PNG or SVG, transparent background",    dark: false, key: "platform" },
                    { title: "White Logo (Dark Mode)", desc: "Recommended: White version for dark backgrounds",  dark: true,  key: "white"    },
                    { title: "Favicon",               desc: "Recommended: 32×32 or 48×48 PNG/ICO",              dark: false, key: "favicon"  },
                  ]) as { title: string; desc: string; dark: boolean; key: LogoKey }[]).map(({ title, desc, dark, key }) => (
                    <div key={key} className="bg-gray-50 rounded-2xl border border-gray-200 p-4">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-3">
                        <LottieIcon src="/icons/category.json" size={16} autoplay loop />
                        <p className="text-[13.5px] font-bold" style={{ color: "#22c55e" }}>{title}</p>
                      </div>

                      {/* Preview */}
                      <div className={`h-16 rounded-xl mb-3 flex items-center justify-center border border-gray-200 overflow-hidden ${dark ? "bg-gray-900" : "bg-white"}`}>
                        {logos[key] ? (
                          <img src={logos[key]} alt={title} className="max-h-full max-w-full object-contain p-2" />
                        ) : (
                          <span className={`text-[12.5px] ${dark ? "text-gray-500" : "text-gray-400"}`}>No image selected</span>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <label className="cursor-pointer shrink-0">
                          <span className="inline-block px-3 py-1.5 rounded-lg text-[12px] font-bold text-white transition-opacity hover:opacity-90"
                            style={{ background: "#22c55e" }}>
                            {logos[key] ? "Replace" : "Choose File"}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*,image/svg+xml"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoFile(key, f); e.target.value = ""; }}
                          />
                        </label>
                        {logos[key] ? (
                          <>
                            <span className="text-[12px] text-gray-600 truncate flex-1 min-w-0">
                              {logoNames[key] || "Uploaded ✓"}
                            </span>
                            <button
                              onClick={() => removeLogo(key)}
                              className="text-[11.5px] font-semibold text-red-500 hover:text-red-700 transition-colors shrink-0 ml-auto"
                            >
                              Remove
                            </button>
                          </>
                        ) : (
                          <span className="text-[12px] text-gray-400">No file chosen</span>
                        )}
                      </div>
                      <p className="text-[11.5px] text-gray-400 mt-2">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Package Selection Mode */}
            <div className="border-t border-gray-100 pt-8">
              <SH src="/icons/note-text.json" title="Package Selection Mode" sub="Configure how packages are automatically enabled from multiple providers" />
              <div className="space-y-3">
                {([
                  { val: "auto" as const, title: "Auto (Best Price)", badge: true,
                    desc: "Automatically enable packages with the best price across all providers. When multiple providers offer the same best price, packages from the preferred provider are enabled.",
                    feats: ["Price Comparison", "Preferred Provider Fallback", "Automatic Updates"] },
                  { val: "manual" as const, title: "Manual Selection", badge: false,
                    desc: "Full control over which packages are enabled. You manually choose which packages from which providers are visible to customers. Price comparison still runs but packages are not auto-enabled.",
                    feats: ["Manual Control", "No Auto Updates"] },
                ] as { val: "auto" | "manual"; title: string; badge: boolean; desc: string; feats: string[] }[]).map(({ val, title, badge, desc, feats }) => (
                  <label key={val} className={`flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-colors ${s.packageMode === val ? "border-emerald-400 bg-emerald-50/20" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors`}
                      style={{ borderColor: s.packageMode === val ? "#22c55e" : "#d1d5db" }}>
                      {s.packageMode === val && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#22c55e" }} />}
                    </div>
                    <input type="radio" className="hidden" checked={s.packageMode === val} onChange={() => upd("packageMode", val)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[14px] font-bold text-gray-900">{title}</p>
                        {badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "#22c55e" }}>BETA</span>}
                      </div>
                      <p className="text-[13px] text-gray-500 mb-2.5">{desc}</p>
                      <div className="flex flex-wrap gap-4">
                        {feats.map(f => (
                          <span key={f} className={`flex items-center gap-1.5 text-[12.5px] ${s.packageMode === val ? "text-emerald-700" : "text-gray-500"}`}>
                            <Check className="w-3.5 h-3.5" /> {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-[13px] font-bold text-emerald-700 mb-0.5">Current Mode</p>
                <p className="text-[13px] text-emerald-600">
                  {s.packageMode === "auto"
                    ? "Auto mode is active. Packages are automatically enabled based on best price. Configure your preferred provider in the Providers page to set the fallback when multiple providers have the same price."
                    : "Manual mode is active. You control which packages are visible to customers. Price comparison still runs but packages are not auto-enabled."}
                </p>
              </div>
              <div className="mt-4"><SaveBtn id="packageMode" label="Save Package Mode" /></div>
            </div>

            {/* AI-Enhanced Package Selection */}
            <div className="border-t border-gray-100 pt-8">
              <SH src="/icons/chart.json" title="AI-Enhanced Package Selection" sub="Use AI to intelligently select the best packages considering price, quality, and provider reliability" bg="#f0faf7" />
              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-500" />
                      <p className="text-[14.5px] font-bold text-gray-900">OpenAI Connection</p>
                    </div>
                    <span className="text-[11.5px] font-bold px-3 py-1 rounded-full bg-red-50 text-red-500 border border-red-100">Not Connected</span>
                  </div>
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-3">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[12.5px] text-amber-700">Add your OpenAI API key as a secret named <code className="font-mono font-bold">OPENAI_API_KEY</code> to enable AI features.</p>
                  </div>
                  <button className="flex items-center gap-2 text-[13px] font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" /> Test Connection
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 bg-gray-50">
                  <div>
                    <p className="text-[14px] font-bold text-gray-900">Enable AI Selection</p>
                    <p className="text-[12.5px] text-gray-400 mt-0.5">When enabled, AI analyzes packages and scores them based on value, not just price</p>
                  </div>
                  <CatalogToggle checked={s.aiEnabled} onChange={v => upd("aiEnabled", v)} activeColor="#22c55e" />
                </div>
                <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50">
                  <p className="text-[13.5px] font-bold text-gray-700 mb-3">AI-Powered Features</p>
                  {["Composite scoring combining price, quality, and provider reliability",
                    "Intelligent package analysis with value assessments",
                    "Automatic fallback to price-only mode if AI unavailable",
                    "24-hour result caching to minimize API costs"].map(f => (
                    <div key={f} className="flex items-center gap-2.5 py-2.5 border-b border-gray-100 last:border-0">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-[13px] text-gray-600">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ SMTP ══════════ */}
        {activeTab === "smtp" && (
          <div className="p-6 space-y-6">
            <div className="rounded-2xl border border-gray-200 p-6">
              <SH src="/icons/note-text.json" title="Email Configuration" sub="Configure SMTP settings for sending emails (OTP codes, order confirmations, etc.)" bg="#eff6ff" />
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div><Lbl t="SMTP Host" req /><input value={s.smtpHost} onChange={e => upd("smtpHost", e.target.value)} placeholder="smtp.example.com" className={inp} /></div>
                  <div><Lbl t="SMTP Port" req /><input value={s.smtpPort} onChange={e => upd("smtpPort", e.target.value)} placeholder="587" className={inp} /></div>
                </div>
                <div><Lbl t="SMTP Username" req /><input value={s.smtpUser} onChange={e => upd("smtpUser", e.target.value)} className={inp} /></div>
                <div>
                  <Lbl t="SMTP From Email" req />
                  <input value={s.smtpFrom} onChange={e => upd("smtpFrom", e.target.value)} type="email" className={inp} />
                  <div className="mt-2 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5">
                    <AlertCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <p className="text-[12.5px] text-gray-500">This email will appear as the sender when sending OTP or notifications.</p>
                  </div>
                </div>
                <div>
                  <Lbl t="SMTP Password" req />
                  <div className="relative">
                    <input value={s.smtpPass} onChange={e => upd("smtpPass", e.target.value)} type={showPwd ? "text" : "password"}
                      className={`${inp} pr-12`} placeholder="••••••••••••••••" />
                    <button type="button" onClick={() => setShowPwd(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5">
                    <AlertCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <p className="text-[12.5px] text-gray-500">For Gmail, use an App Password. For other providers, use your SMTP password.</p>
                  </div>
                </div>
                <SaveBtn id="smtp" label="Save SMTP Settings" />
              </div>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-amber-800 mb-1">Security Note</p>
                <p className="text-[13px] text-amber-700">SMTP credentials are stored securely. In development mode, emails are logged to console instead of being sent.</p>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-2 mb-5">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <h3 className="text-[16px] font-bold text-emerald-700">Quick Setup Guide</h3>
              </div>
              {[
                { num: 1, title: "Gmail Setup", host: "smtp.gmail.com", port: "587", desc: "Enable 2FA and create an App Password at", link: "myaccount.google.com/apppasswords", href: "https://myaccount.google.com/apppasswords" },
                { num: 2, title: "Outlook/Office 365", host: "smtp-mail.outlook.com", port: "587", desc: "Use your Outlook email and password", link: null, href: null },
                { num: 3, title: "Custom SMTP", host: null, port: null, desc: "Contact your email provider for SMTP server details (host, port, credentials)", link: null, href: null },
              ].map(({ num, title, host, port, desc, link, href }) => (
                <div key={num} className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0" style={{ background: "#22c55e" }}>{num}</div>
                  <div>
                    <p className="text-[14px] font-bold text-gray-900 mb-1">{title}</p>
                    {host && <p className="text-[12.5px] text-gray-600 mb-1">Host: <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[11.5px]">{host}</code> | Port: <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[11.5px]">{port}</code></p>}
                    <p className="text-[12.5px] text-gray-500">{desc}{link && href && <> at <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{link}</a></>}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════ FIREBASE ══════════ */}
        {activeTab === "firebase" && (
          <div className="p-6 space-y-5">
            <div className="rounded-2xl border border-gray-200 p-6">
              <SH src="/icons/chart.json" title="Firebase Configuration" sub="Configure Firebase credentials for Authentication, FCM, and Storage." bg="#fff7ed" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900 mb-5">Client App Settings</h3>
                  <div className="space-y-4">
                    {([
                      ["Firebase API Key","fbApiKey","AIzaSy..."],["Auth Domain","fbAuthDomain","your-app.firebaseapp.com"],
                      ["Project ID","fbProjectId","your-project-id"],["Storage Bucket","fbBucket","your-app.appspot.com"],
                      ["Messaging Sender ID","fbSenderId","123456789"],["App ID","fbAppId","1:123:web:abc"],
                      ["Measurement ID","fbMeasId","G-XXXXXXXXXX"],
                    ] as [string, keyof PS, string][]).map(([label, k, ph]) => (
                      <div key={String(k)}><Lbl t={label} /><input value={s[k] as string} onChange={e => setS(p => ({ ...p, [k]: e.target.value }))} placeholder={ph} className={inpSm} /></div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900 mb-1">Admin SDK (Server) Settings</h3>
                  <p className="text-[12.5px] text-gray-400 mb-5">Required for Google Login verification and Push Notifications. Get these from your service account JSON file.</p>
                  <div className="space-y-4">
                    <div><Lbl t="Client Email" /><input value={s.fbClientEmail} onChange={e => upd("fbClientEmail", e.target.value)} placeholder="firebase-adminsdk@project.iam.gserviceaccount.com" className={inpSm} /></div>
                    <div>
                      <Lbl t="Private Key" />
                      <textarea value={s.fbPrivateKey} onChange={e => upd("fbPrivateKey", e.target.value)} rows={9}
                        placeholder={"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[12.5px] font-mono text-gray-700 outline-none focus:border-green-400 transition-colors resize-none bg-white" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6"><SaveBtn id="firebase" label="Save Firebase Settings" /></div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-amber-100 bg-amber-50">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-[13px] text-amber-700">Firebase credentials are securely stored and used for authentication and push notifications.</p>
            </div>
          </div>
        )}

        {/* ══════════ reCAPTCHA ══════════ */}
        {activeTab === "recaptcha" && (
          <div className="p-6 space-y-5">
            <div className="rounded-2xl border border-gray-200 p-6">
              <SH src="/icons/profile-tick.json" title="reCAPTCHA Configuration" sub="Protect your platform from spam and bots with Google reCAPTCHA." bg="#eff6ff" />
              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 bg-gray-50">
                  <div>
                    <p className="text-[14px] font-bold text-gray-900">Enable reCAPTCHA</p>
                    <p className="text-[12.5px] text-gray-400 mt-0.5">Protect forms like sign-up, sign-in, and checkout from bots</p>
                  </div>
                  <CatalogToggle checked={s.rcEnabled} onChange={v => upd("rcEnabled", v)} activeColor="#22c55e" />
                </div>
                <div>
                  <Lbl t="reCAPTCHA Version" />
                  <select value={s.rcVersion} onChange={e => upd("rcVersion", e.target.value as "v2" | "v3")} className={`${inp} cursor-pointer`}>
                    <option value="v3">reCAPTCHA v3 — Invisible, score-based (recommended)</option>
                    <option value="v2">reCAPTCHA v2 — "I'm not a robot" checkbox</option>
                  </select>
                </div>
                <div><Lbl t="Site Key (Public)" req /><input value={s.rcSiteKey} onChange={e => upd("rcSiteKey", e.target.value)} placeholder="6Le..." className={inp} /></div>
                <div>
                  <Lbl t="Secret Key (Server)" req />
                  <input value={s.rcSecretKey} onChange={e => upd("rcSecretKey", e.target.value)} type="password" placeholder="6Le..." className={inp} />
                </div>
                <SaveBtn id="recaptcha" label="Save reCAPTCHA Settings" />
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-2xl border border-blue-100 bg-blue-50">
              <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <p className="text-[13px] text-blue-700">
                Visit <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noopener noreferrer" className="underline font-semibold">google.com/recaptcha/admin</a> to create a new site and get your Site Key and Secret Key.
              </p>
            </div>
          </div>
        )}

        {/* ══════════ APP STORES ══════════ */}
        {activeTab === "appstores" && (
          <div className="p-6 space-y-5">
            <div className="rounded-2xl border border-gray-200 p-6">
              <SH src="/icons/category.json" title="App Stores Configuration" sub="Configure credentials for Apple App Store and Google Play integration." bg="#f5f3ff" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900 mb-5">Apple Store Settings</h3>
                  <div className="space-y-4">
                    {([
                      ["App ID","appleAppId","e.g. 123456789"],["Bundle ID","appleBundleId","e.g. com.example.app"],
                      ["Key ID","appleKeyId","e.g. ABCDEFG123"],["Issuer ID","appleIssuerId","e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"],
                      ["Shared Secret","appleSharedSecret","App-Specific Shared Secret"],
                    ] as [string, keyof PS, string][]).map(([label, k, ph]) => (
                      <div key={String(k)}><Lbl t={label} /><input value={s[k] as string} onChange={e => setS(p => ({ ...p, [k]: e.target.value }))} placeholder={ph} className={inpSm} /></div>
                    ))}
                    <div>
                      <Lbl t="Private Key (.p8 contents)" />
                      <textarea value={s.applePrivKey} onChange={e => upd("applePrivKey", e.target.value)} rows={5}
                        placeholder={"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[12.5px] font-mono text-gray-700 outline-none focus:border-green-400 transition-colors resize-none bg-white" />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900 mb-5">Google Play Settings</h3>
                  <div className="space-y-4">
                    <div><Lbl t="Package Name" /><input value={s.googlePkg} onChange={e => upd("googlePkg", e.target.value)} placeholder="e.g. com.example.app" className={inpSm} /></div>
                    <div>
                      <Lbl t="Service Account JSON" />
                      <textarea value={s.googleSvcJson} onChange={e => upd("googleSvcJson", e.target.value)} rows={12}
                        placeholder={'{ "type": "service_account", "project_id": "...", ... }'}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[12.5px] font-mono text-gray-700 outline-none focus:border-green-400 transition-colors resize-none bg-white" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6"><SaveBtn id="appstores" label="Save App Stores Settings" /></div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-amber-100 bg-amber-50">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-[13px] text-amber-700">These credentials grant access to your Google Play Console and App Store Connect accounts. Keep them secure and do not share them.</p>
            </div>
          </div>
        )}

        {/* ══════════ APPEARANCE ══════════ */}
        {activeTab === "appearance" && (
          <div className="p-6 space-y-6">
            {/* Live Preview */}
            <div className="rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5" style={{ color: s.primaryColor }} />
                <h3 className="text-[18px] font-bold" style={{ color: s.primaryColor }}>Live Preview</h3>
              </div>
              <p className="text-[13px] text-gray-400 mb-5">See how your color scheme looks across different components</p>
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <button className="px-5 py-2.5 rounded-xl text-[14px] font-bold text-white" style={{ background: s.primaryColor }}>Primary Button</button>
                <button className="px-5 py-2.5 rounded-xl text-[14px] font-bold border-2" style={{ color: s.primaryColor, borderColor: s.primaryColor }}>Outline Button</button>
                <span className="px-4 py-1.5 rounded-full text-[13px] font-bold text-white" style={{ background: s.secondaryColor }}>Active Badge</span>
              </div>
              <h2 className="text-[28px] font-black text-gray-900 mb-1" style={{ fontFamily: s.headingFont }}>Heading Preview</h2>
              <p className="text-[14px] text-gray-500" style={{ fontFamily: s.bodyFont }}>Body text preview with current font selection</p>
            </div>
            {/* Color Customization */}
            <div className="rounded-2xl border border-gray-200 p-6">
              <SH src="/icons/category.json" title="Color Customization" sub="Customize your platform's color scheme" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ColorField label="Primary Color" value={s.primaryColor} onChange={v => upd("primaryColor", v)} desc="Main brand color used throughout the application" />
                <ColorField label="Secondary Color" value={s.secondaryColor} onChange={v => upd("secondaryColor", v)} desc="Complementary color for gradients and accents" />
                <ColorField label="Light Variant" value={s.lightColor} onChange={v => upd("lightColor", v)} desc="Lighter shade for backgrounds and hover states" />
                <ColorField label="Dark Variant" value={s.darkColor} onChange={v => upd("darkColor", v)} desc="Darker shade for text and borders" />
              </div>
            </div>
            {/* Typography */}
            <div className="rounded-2xl border border-gray-200 p-6">
              <SH src="/icons/note-text.json" title="Typography Settings" sub="Choose fonts for headings and body text" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Lbl t="Heading Font" />
                  <select value={s.headingFont} onChange={e => upd("headingFont", e.target.value)} className={`${inp} cursor-pointer`}>
                    {FONTS.map(f => <option key={f} value={f}>{f} — Sans-serif</option>)}
                  </select>
                  <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-100" style={{ fontFamily: s.headingFont }}>
                    <p className="text-[22px] font-black text-gray-900 mb-1">Sample Heading</p>
                    <p className="text-[16px] font-bold text-gray-700">Subheading Example</p>
                    <p className="text-[14px] font-medium text-gray-500">Smaller Heading</p>
                  </div>
                </div>
                <div>
                  <Lbl t="Body Font" />
                  <select value={s.bodyFont} onChange={e => upd("bodyFont", e.target.value)} className={`${inp} cursor-pointer`}>
                    {FONTS.map(f => <option key={f} value={f}>{f} — Sans-serif</option>)}
                  </select>
                  <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-100" style={{ fontFamily: s.bodyFont }}>
                    <p className="text-[14px] leading-relaxed text-gray-600">This is a sample paragraph text. The quick brown fox jumps over the lazy dog. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                    <p className="text-[12px] text-gray-400 mt-2">Smaller text example for captions and descriptions.</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-5 flex-wrap">
                <SaveBtn id="appearance" label="Save Theme (Colors + Fonts)" />
                <button onClick={() => setS(p => ({ ...p, primaryColor: DEF.primaryColor, secondaryColor: DEF.secondaryColor, lightColor: DEF.lightColor, darkColor: DEF.darkColor, headingFont: DEF.headingFont, bodyFont: DEF.bodyFont }))}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                  <RefreshCw className="w-4 h-4" /> Reset to Defaults
                </button>
              </div>
            </div>
            {/* Tips */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-blue-500" />
                <p className="text-[14px] font-bold text-blue-800">Theme Tips</p>
              </div>
              {["Changes apply instantly across the entire platform",
                "Save to server to persist colors and fonts together",
                "Use contrasting colors for better accessibility",
                "Test font combinations in both light and dark modes",
                "Google Fonts load automatically when selected"].map(t => (
                <p key={t} className="text-[13px] text-blue-700 flex items-start gap-2 mb-1.5 last:mb-0"><span className="mt-0.5 text-blue-400 shrink-0">•</span>{t}</p>
              ))}
            </div>
          </div>
        )}

        {/* ══════════ SOCIAL MEDIA ══════════ */}
        {activeTab === "social" && (
          <div className="p-6 space-y-5">
            <div className="rounded-2xl border border-gray-200 p-6">
              <SH src="/icons/category.json" title="Social Media Links" sub="Manage website and social media profile links" />
              <div className="space-y-5">
                <div>
                  <Lbl t="Website URL" />
                  <input value={s.webUrl} onChange={e => upd("webUrl", e.target.value)} placeholder="https://voltey.com/" className={inp} />
                </div>
                {SOCIAL_ITEMS.map(({ label, urlKey, activeKey, ph }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <Lbl t={label} />
                      <div className="flex items-center gap-2">
                        <span className="text-[12.5px] text-gray-500">{s[activeKey] ? "Active" : "Inactive"}</span>
                        <CatalogToggle checked={s[activeKey]} onChange={v => upd(activeKey, v)} activeColor="#22c55e" />
                      </div>
                    </div>
                    <input value={s[urlKey]} onChange={e => setS(p => ({ ...p, [urlKey]: e.target.value }))} placeholder={ph}
                      className={`${inp} ${!s[activeKey] ? "opacity-50 bg-gray-50" : ""}`} />
                  </div>
                ))}
                <SaveBtn id="social" label="Save Social Links" />
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-blue-100 bg-blue-50">
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
              <p className="text-[13px] text-blue-700">These links may be shown in the footer, contact page, or mobile app.</p>
            </div>
          </div>
        )}

        {/* ══════════ SEO & META ══════════ */}
        {activeTab === "seo" && (
          <div className="p-6 space-y-6">
            <div className="rounded-2xl border border-gray-200 p-6">
              <SH src="/icons/note-text.json" title="SEO & Meta Configuration" sub="Configure meta tags and search engine optimization settings" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <div>
                    <Lbl t="Meta Title" />
                    <input value={s.metaTitle} onChange={e => upd("metaTitle", e.target.value)} className={inp} />
                    <p className="text-[11.5px] text-gray-400 mt-1">{s.metaTitle.length}/60 characters recommended</p>
                  </div>
                  <div>
                    <Lbl t="Meta Description" />
                    <textarea value={s.metaDesc} onChange={e => upd("metaDesc", e.target.value)} rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] text-gray-800 outline-none focus:border-green-400 transition-colors resize-none bg-white" />
                    <p className="text-[11.5px] text-gray-400 mt-1">{s.metaDesc.length}/160 characters recommended</p>
                  </div>
                  <div>
                    <Lbl t="Default Keywords" />
                    <textarea value={s.metaKw} onChange={e => upd("metaKw", e.target.value)} rows={3} placeholder="keyword1, keyword2, ..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] text-gray-800 outline-none focus:border-green-400 transition-colors resize-none bg-white" />
                  </div>
                  <div>
                    <Lbl t="Twitter Handle" />
                    <input value={s.twHandle} onChange={e => upd("twHandle", e.target.value)} placeholder="@yourbrand" className={inp} />
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <LottieIcon src="/icons/category.json" size={16} autoplay loop />
                      <p className="text-[13.5px] font-bold" style={{ color: "#22c55e" }}>Default Sharing Image (OG Image)</p>
                    </div>
                    <div className="h-28 bg-white rounded-xl border border-gray-200 mb-3 flex items-center justify-center">
                      <span className="text-[12.5px] text-gray-400">No image selected</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer shrink-0">
                        <span className="inline-block px-3 py-1.5 rounded-lg text-[12px] font-bold text-white" style={{ background: "#22c55e" }}>Choose File</span>
                        <input type="file" className="hidden" accept="image/*" />
                      </label>
                      <span className="text-[12.5px] text-gray-400">No file chosen</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 space-y-4">
                    <p className="text-[14px] font-bold text-gray-800">Search Console Verification</p>
                    <div><Lbl t="Google Verification Code" /><input value={s.googleVerify} onChange={e => upd("googleVerify", e.target.value)} placeholder="e.g., google1234abcd5678" className={inpSm} /></div>
                    <div><Lbl t="Bing Verification Code" /><input value={s.bingVerify} onChange={e => upd("bingVerify", e.target.value)} placeholder="e.g., bing-123-abc" className={inpSm} /></div>
                  </div>
                  <SaveBtn id="seo" label="Save SEO Configuration" />
                </div>
              </div>
            </div>
            {/* SERP Preview */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-2 mb-2">
                <Search className="w-5 h-5 text-gray-500" />
                <h3 className="text-[16px] font-bold text-gray-900">SERP Preview</h3>
              </div>
              <p className="text-[13px] text-gray-400 mb-5">How your site might look in Google search results</p>
              <div className="border border-gray-200 rounded-xl p-5 max-w-2xl">
                <p className="text-[13px] text-gray-400 mb-1.5">{s.webUrl || "https://voltey.com/"} ▾</p>
                <p className="text-[17px] font-medium leading-tight mb-1.5 hover:underline cursor-pointer" style={{ color: "#1a0dab" }}>
                  {s.metaTitle || "Voltey eSIM | Global Travel eSIM for Seamless Connectivity"}
                </p>
                <p className="text-[14px] leading-relaxed line-clamp-2" style={{ color: "#4d5156" }}>
                  {s.metaDesc || "Stay connected worldwide with Voltey eSIM. Enjoy fast, reliable mobile internet in any country."}
                </p>
              </div>
            </div>
            <ProductSeoEditor />
          </div>
        )}

        {/* ══════════ ACCOUNT & SECURITY ══════════ */}
        {activeTab === "account" && (
          <div className="p-6 space-y-5">
            <div className="rounded-2xl border border-gray-200 p-6">
              <SH src="/icons/profile-tick.json" title="Account & Security" sub="Manage admin account security settings and access policies" bg="#fdf4ff" />
              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 bg-gray-50">
                  <div>
                    <p className="text-[14px] font-bold text-gray-900">Two-Factor Authentication</p>
                    <p className="text-[12.5px] text-gray-400 mt-0.5">Require 2FA for all admin panel logins</p>
                  </div>
                  <CatalogToggle checked={s.twoFA} onChange={v => upd("twoFA", v)} activeColor="#22c55e" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <Lbl t="Session Timeout (minutes)" />
                    <input value={s.sessionMin} onChange={e => upd("sessionMin", e.target.value)} type="number" min="5" max="1440" className={inp} />
                    <p className="text-[12px] text-gray-400 mt-1">Admin session expires after this period of inactivity</p>
                  </div>
                  <div>
                    <Lbl t="Minimum Password Length" />
                    <input value={s.pwdMinLen} onChange={e => upd("pwdMinLen", e.target.value)} type="number" min="6" max="32" className={inp} />
                    <p className="text-[12px] text-gray-400 mt-1">Minimum required characters for admin passwords</p>
                  </div>
                </div>
                <SaveBtn id="account" label="Save Security Settings" />
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <p className="text-[14px] font-bold text-gray-800">Security Best Practices</p>
              </div>
              {["Use a strong, unique password for your admin account",
                "Enable two-factor authentication for additional security",
                "Set a reasonable session timeout (30–120 minutes recommended)",
                "Regularly review and rotate admin access credentials"].map(t => (
                <div key={t} className="flex items-center gap-2.5 py-2.5 border-b border-gray-100 last:border-0">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-[13px] text-gray-600">{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════ HOMEPAGE POPUP ══════════ */}
        {activeTab === "popup" && (
          <div className="p-6 space-y-5">
            <div className="rounded-2xl border border-gray-200 p-6">
              <SH src="/icons/note-text.json" title="Homepage Popup" sub="Configure a promotional popup to display on the homepage" />
              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 bg-gray-50">
                  <div>
                    <p className="text-[14px] font-bold text-gray-900">Enable Homepage Popup</p>
                    <p className="text-[12.5px] text-gray-400 mt-0.5">Show a promotional popup when visitors land on the homepage</p>
                  </div>
                  <CatalogToggle checked={s.popupOn} onChange={v => upd("popupOn", v)} activeColor="#22c55e" />
                </div>
                <div><Lbl t="Popup Title" /><input value={s.popupTitle} onChange={e => upd("popupTitle", e.target.value)} placeholder="Special Offer: 20% off all eSIMs!" className={inp} /></div>
                <div>
                  <Lbl t="Popup Message" />
                  <textarea value={s.popupMsg} onChange={e => upd("popupMsg", e.target.value)} rows={3} placeholder="Use code TRAVEL20 at checkout to save 20% on your first eSIM purchase."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] text-gray-800 outline-none focus:border-green-400 transition-colors resize-none bg-white" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div><Lbl t="Button Text" /><input value={s.popupBtn} onChange={e => upd("popupBtn", e.target.value)} placeholder="Shop Now" className={inp} /></div>
                  <div><Lbl t="Button URL" /><input value={s.popupUrl} onChange={e => upd("popupUrl", e.target.value)} placeholder="https://voltey.com/destinations" className={inp} /></div>
                </div>
                {s.popupOn && s.popupTitle && (
                  <div className="p-5 rounded-2xl border-2 border-dashed border-green-300 bg-emerald-50/20">
                    <p className="text-[12px] font-bold text-emerald-600 mb-3 uppercase tracking-wide">Live Preview</p>
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 max-w-xs mx-auto">
                      <h3 className="text-[16px] font-bold text-gray-900 mb-2">{s.popupTitle}</h3>
                      <p className="text-[13.5px] text-gray-500 mb-4">{s.popupMsg}</p>
                      <button className="px-5 py-2 rounded-xl text-[13.5px] font-bold text-white w-full" style={{ background: "#22c55e" }}>{s.popupBtn || "Learn More"}</button>
                    </div>
                  </div>
                )}
                <SaveBtn id="popup" label="Save Popup Settings" />
              </div>
            </div>
          </div>
        )}

        {/* ══════════ MAINTENANCE ══════════ */}
        {activeTab === "maintenance" && (
          <div className="p-6 space-y-5">
            <div className="rounded-2xl border border-gray-200 p-6">
              <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <SH src="/icons/setting.json" title="Platform Visibility" sub="Control whether the platform is accessible to the public or in maintenance mode." />
                <span className={`text-[13px] font-bold px-4 py-2 rounded-full border shrink-0 ${s.maintMode ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                  {s.maintMode ? "Maintenance Active" : "System Live"}
                </span>
              </div>
              <div className={`rounded-2xl border-2 p-5 mb-6 transition-all ${s.maintMode ? "border-orange-300 bg-orange-50/20" : "border-gray-200 bg-white"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[16px] font-bold text-gray-900 mb-1.5">Maintenance Mode</p>
                    <p className="text-[13.5px] text-gray-500 leading-relaxed">When active, all visitors except administrators will be redirected to the "Web Under Maintenance" page.</p>
                  </div>
                  <CatalogToggle checked={s.maintMode} onChange={v => upd("maintMode", v)} activeColor="#f97316" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[
                  { title: "Admin Bypass", desc: "Administrators retain full access to all features and the frontend while maintenance is active.", icon: "/icons/profile-tick.json", bg: "#f0fdf4" },
                  { title: "Real-time Apply", desc: "Visibility changes are applied instantly across the entire platform without server restarts.", icon: "/icons/category.json", bg: "#eff6ff" },
                  { title: "Zero Latency", desc: "The maintenance check is highly optimized to ensure no impact on platform performance.", icon: "/icons/chart.json", bg: "#fdf4ff" },
                ].map(({ title, desc, icon, bg }) => (
                  <div key={title} className="rounded-2xl border border-gray-200 p-5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
                      <LottieIcon src={icon} size={24} autoplay loop />
                    </div>
                    <p className="text-[14px] font-bold text-gray-900 mb-1.5">{title}</p>
                    <p className="text-[12.5px] text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
              <SaveBtn id="maintenance" label="Save Configuration" />
            </div>
          </div>
        )}

        {/* ══════════ WEBSITE CONTENT ══════════ */}
        {activeTab === "wc-header-footer" && <HeaderFooterEditor />}
        {activeTab === "wc-home-page" && <HomePageEditor />}
        {activeTab === "wc-product-page" && <ProductPageEditor />}
        {activeTab === "wc-destination-page" && <DestinationPageEditor />}

      </div>
    </div>
  );
}

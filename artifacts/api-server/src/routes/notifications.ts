import { Router, type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { sendLowDataAlertEmail, sendExpireAlertEmail } from "../lib/mailer";

const router = Router();
const DATA_DIR = path.resolve("data");
const NOTIF_FILE  = path.join(DATA_DIR, "notifications.json");
const TPL_FILE    = path.join(DATA_DIR, "notification-templates.json");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

/* ─────────────────────────────── Types ─────────────────────────────── */
interface Notification {
  id: string; title: string; body: string; type: string; source: string;
  customerName: string; customerEmail: string; iccid: string;
  status: "read" | "unread"; processingStatus: "processed" | "not_processed";
  emailStatus: "sent" | "not_sent" | "failed"; templateId?: string;
  createdAt: string; sentAt?: string;
}
interface EmailTemplate {
  id: string; name: string; subject: string; category: string; description: string;
  htmlBody: string; variables: string[]; prebuilt: boolean; active: boolean;
  createdAt: string; updatedAt: string; usageCount: number; accentColor: string;
}

/* ─────────────────────────── HTML Templates ─────────────────────────── */
function wrapHtml(accentColor: string, heading: string, body: string, footer = "Voltey eSIM Global &bull; support@voltey.com"): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${heading}</title></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 16px;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
  <!-- Header -->
  <tr><td style="background:${accentColor};padding:32px 40px;text-align:center;">
    <div style="display:inline-block;background:rgba(255,255,255,0.18);border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;margin-bottom:12px;">⚡</div>
    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">${heading}</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.82);font-size:13px;">Voltey eSIM Global</p>
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:36px 40px 28px;">${body}</td></tr>
  <!-- Footer -->
  <tr><td style="padding:20px 40px 32px;border-top:1px solid #f0f0f0;text-align:center;">
    <p style="margin:0;color:#a0a0a0;font-size:11.5px;line-height:1.6;">${footer}</p>
    <p style="margin:8px 0 0;font-size:11px;color:#c0c0c0;">You received this email because you have an account with Voltey eSIM Global.<br>
    <a href="{{unsubscribe_url}}" style="color:#a0a0a0;text-decoration:underline;">Unsubscribe</a> &nbsp;&bull;&nbsp; <a href="{{privacy_url}}" style="color:#a0a0a0;text-decoration:underline;">Privacy Policy</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

const PREBUILT_TEMPLATES: EmailTemplate[] = [
  {
    id: "tpl-welcome",
    name: "Welcome Email",
    subject: "Welcome to Voltey eSIM, {{customer_name}}! 🎉",
    category: "transactional",
    description: "Sent when a new customer creates an account.",
    accentColor: "#10b981",
    prebuilt: true, active: true, usageCount: 0,
    variables: ["{{customer_name}}", "{{dashboard_url}}", "{{support_email}}", "{{unsubscribe_url}}", "{{privacy_url}}"],
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    htmlBody: wrapHtml("#10b981", "Welcome to Voltey eSIM! 🎉", `
<p style="margin:0 0 16px;font-size:15.5px;color:#1a1a1a;line-height:1.7;">Hi <strong>{{customer_name}}</strong>,</p>
<p style="margin:0 0 16px;font-size:14.5px;color:#444;line-height:1.75;">Welcome aboard! We're thrilled to have you join the Voltey eSIM family. With Voltey, you can stay connected in <strong>180+ countries</strong> — no SIM swapping, no roaming fees, just seamless connectivity.</p>
<table cellpadding="0" cellspacing="0" style="width:100%;background:#f8fffe;border:1px solid #d1fae5;border-radius:12px;margin:20px 0;padding:20px;">
  <tr><td style="font-size:14px;color:#065f46;line-height:1.75;">
    ✅ &nbsp;Instant eSIM delivery<br>
    ✅ &nbsp;No hidden fees or contracts<br>
    ✅ &nbsp;24/7 customer support<br>
    ✅ &nbsp;Compatible with 2000+ devices
  </td></tr>
</table>
<p style="margin:24px 0 8px;text-align:center;">
  <a href="{{dashboard_url}}" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:13px 32px;border-radius:10px;font-weight:700;font-size:14px;letter-spacing:0.2px;">Explore eSIM Plans →</a>
</p>
<p style="margin:20px 0 0;font-size:13.5px;color:#666;line-height:1.7;">Questions? Reply to this email or reach us at <a href="mailto:{{support_email}}" style="color:#10b981;text-decoration:none;">{{support_email}}</a>.</p>`)
  },
  {
    id: "tpl-order-confirm",
    name: "Order Confirmation",
    subject: "Your eSIM order #{{order_id}} is confirmed ✅",
    category: "transactional",
    description: "Sent immediately after a successful purchase.",
    accentColor: "#3b82f6",
    prebuilt: true, active: true, usageCount: 0,
    variables: ["{{customer_name}}", "{{order_id}}", "{{plan_name}}", "{{destination}}", "{{data_amount}}", "{{validity_days}}", "{{price}}", "{{iccid}}", "{{activation_url}}", "{{unsubscribe_url}}", "{{privacy_url}}"],
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    htmlBody: wrapHtml("#3b82f6", "Order Confirmed!", `
<p style="margin:0 0 16px;font-size:15.5px;color:#1a1a1a;line-height:1.7;">Hi <strong>{{customer_name}}</strong>, your order is confirmed and your eSIM is ready!</p>
<table cellpadding="0" cellspacing="0" style="width:100%;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;margin:16px 0;padding:20px;">
<tr><td>
  <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#3b82f6;text-transform:uppercase;letter-spacing:0.8px;">Order Details</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
    <tr><td style="font-size:13.5px;color:#444;padding:5px 0;">Order ID</td><td style="font-size:13.5px;color:#1e293b;font-weight:700;text-align:right;">#{{order_id}}</td></tr>
    <tr><td style="font-size:13.5px;color:#444;padding:5px 0;">Plan</td><td style="font-size:13.5px;color:#1e293b;font-weight:700;text-align:right;">{{plan_name}}</td></tr>
    <tr><td style="font-size:13.5px;color:#444;padding:5px 0;">Destination</td><td style="font-size:13.5px;color:#1e293b;font-weight:700;text-align:right;">{{destination}}</td></tr>
    <tr><td style="font-size:13.5px;color:#444;padding:5px 0;">Data</td><td style="font-size:13.5px;color:#1e293b;font-weight:700;text-align:right;">{{data_amount}}</td></tr>
    <tr><td style="font-size:13.5px;color:#444;padding:5px 0;">Validity</td><td style="font-size:13.5px;color:#1e293b;font-weight:700;text-align:right;">{{validity_days}} days</td></tr>
    <tr style="border-top:1px solid #bfdbfe;"><td style="font-size:14px;color:#1e40af;font-weight:700;padding-top:10px;">Total Paid</td><td style="font-size:14px;color:#1e40af;font-weight:700;text-align:right;padding-top:10px;">{{price}}</td></tr>
  </table>
</td></tr>
</table>
<p style="margin:20px 0 8px;text-align:center;">
  <a href="{{activation_url}}" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:13px 32px;border-radius:10px;font-weight:700;font-size:14px;">Activate My eSIM →</a>
</p>
<p style="margin:16px 0 0;font-size:12.5px;color:#888;line-height:1.7;">ICCID: <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:12px;">{{iccid}}</code></p>`)
  },
  {
    id: "tpl-esim-activated",
    name: "eSIM Activated",
    subject: "Your eSIM is now active in {{destination}} 🌐",
    category: "transactional",
    description: "Sent when the eSIM is successfully installed and activated.",
    accentColor: "#8b5cf6",
    prebuilt: true, active: true, usageCount: 0,
    variables: ["{{customer_name}}", "{{destination}}", "{{data_amount}}", "{{validity_days}}", "{{expiry_date}}", "{{iccid}}", "{{support_url}}", "{{unsubscribe_url}}", "{{privacy_url}}"],
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    htmlBody: wrapHtml("#8b5cf6", "eSIM Activated! 🌐", `
<p style="margin:0 0 16px;font-size:15.5px;color:#1a1a1a;line-height:1.7;">Great news, <strong>{{customer_name}}</strong>! Your eSIM is now active and you're connected in <strong>{{destination}}</strong>.</p>
<table cellpadding="0" cellspacing="0" style="width:100%;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;margin:16px 0;padding:20px;">
<tr><td>
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="font-size:13.5px;color:#5b21b6;padding:5px 0;font-weight:600;">📍 Destination</td><td style="font-size:13.5px;color:#1e293b;font-weight:700;text-align:right;">{{destination}}</td></tr>
    <tr><td style="font-size:13.5px;color:#5b21b6;padding:5px 0;font-weight:600;">📶 Data Remaining</td><td style="font-size:13.5px;color:#1e293b;font-weight:700;text-align:right;">{{data_amount}}</td></tr>
    <tr><td style="font-size:13.5px;color:#5b21b6;padding:5px 0;font-weight:600;">📅 Valid Until</td><td style="font-size:13.5px;color:#1e293b;font-weight:700;text-align:right;">{{expiry_date}}</td></tr>
  </table>
</td></tr>
</table>
<div style="background:#faf5ff;border-left:4px solid #8b5cf6;padding:14px 18px;border-radius:0 8px 8px 0;margin:16px 0;">
  <p style="margin:0;font-size:13px;color:#5b21b6;line-height:1.7;"><strong>Pro tip:</strong> Enable Data Roaming in your device Settings → Cellular → Data Roaming to start using your eSIM.</p>
</div>
<p style="margin:20px 0 0;font-size:13.5px;color:#666;line-height:1.7;">Need help? Visit our <a href="{{support_url}}" style="color:#8b5cf6;text-decoration:none;font-weight:600;">support centre</a>.</p>`)
  },
  {
    id: "tpl-low-data",
    name: "Low Data Warning",
    subject: "⚠️ You've used 80% of your data in {{destination}}",
    category: "transactional",
    description: "Alert sent when customer has used 80% of their data allowance.",
    accentColor: "#f59e0b",
    prebuilt: true, active: true, usageCount: 0,
    variables: ["{{customer_name}}", "{{destination}}", "{{data_used}}", "{{data_total}}", "{{percent_used}}", "{{data_remaining}}", "{{expiry_date}}", "{{topup_url}}", "{{unsubscribe_url}}", "{{privacy_url}}"],
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    htmlBody: wrapHtml("#f59e0b", "Running Low on Data ⚠️", `
<p style="margin:0 0 16px;font-size:15.5px;color:#1a1a1a;line-height:1.7;">Hi <strong>{{customer_name}}</strong>, you've used <strong>{{percent_used}}%</strong> of your data for <strong>{{destination}}</strong>.</p>
<table cellpadding="0" cellspacing="0" style="width:100%;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;margin:16px 0;padding:20px;">
<tr><td>
  <p style="margin:0 0 10px;font-size:13px;color:#92400e;font-weight:600;">Data Usage</p>
  <div style="background:#fef3c7;border-radius:999px;height:10px;width:100%;overflow:hidden;">
    <div style="background:#f59e0b;height:10px;border-radius:999px;width:{{percent_used}}%;"></div>
  </div>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
    <tr>
      <td style="font-size:12.5px;color:#92400e;">Used: <strong>{{data_used}}</strong></td>
      <td style="font-size:12.5px;color:#92400e;text-align:right;">Remaining: <strong>{{data_remaining}}</strong></td>
    </tr>
  </table>
</td></tr>
</table>
<p style="margin:0 0 16px;font-size:14px;color:#444;line-height:1.75;">Your plan expires on <strong>{{expiry_date}}</strong>. Top up now to avoid interruptions.</p>
<p style="margin:16px 0 8px;text-align:center;">
  <a href="{{topup_url}}" style="display:inline-block;background:#f59e0b;color:#fff;text-decoration:none;padding:13px 32px;border-radius:10px;font-weight:700;font-size:14px;">Top Up Data →</a>
</p>`)
  },
  {
    id: "tpl-data-exhausted",
    name: "Data Exhausted",
    subject: "Your data is exhausted in {{destination}} — Top up now",
    category: "transactional",
    description: "Sent when customer's data balance reaches 0.",
    accentColor: "#ef4444",
    prebuilt: true, active: true, usageCount: 0,
    variables: ["{{customer_name}}", "{{destination}}", "{{topup_url}}", "{{new_plan_url}}", "{{unsubscribe_url}}", "{{privacy_url}}"],
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    htmlBody: wrapHtml("#ef4444", "Data Exhausted", `
<p style="margin:0 0 16px;font-size:15.5px;color:#1a1a1a;line-height:1.7;">Hi <strong>{{customer_name}}</strong>, your eSIM data for <strong>{{destination}}</strong> has been fully used.</p>
<div style="text-align:center;padding:24px 0;">
  <div style="display:inline-block;background:#fee2e2;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:30px;">📵</div>
  <p style="margin:12px 0 0;font-size:16px;font-weight:700;color:#b91c1c;">No Data Remaining</p>
  <p style="margin:6px 0 0;font-size:13px;color:#888;">You are currently disconnected from data services</p>
</div>
<table cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;">
<tr>
  <td style="width:48%;padding-right:8px;">
    <a href="{{topup_url}}" style="display:block;text-align:center;background:#ef4444;color:#fff;text-decoration:none;padding:13px 16px;border-radius:10px;font-weight:700;font-size:13.5px;">Add Top-Up</a>
  </td>
  <td style="width:48%;padding-left:8px;">
    <a href="{{new_plan_url}}" style="display:block;text-align:center;background:#1e293b;color:#fff;text-decoration:none;padding:13px 16px;border-radius:10px;font-weight:700;font-size:13.5px;">New Plan</a>
  </td>
</tr>
</table>`)
  },
  {
    id: "tpl-expiry-reminder",
    name: "eSIM Expiry Reminder",
    subject: "Your eSIM expires in {{days_remaining}} days — {{destination}}",
    category: "transactional",
    description: "Reminder sent 3 days before the eSIM plan expires.",
    accentColor: "#f97316",
    prebuilt: true, active: true, usageCount: 0,
    variables: ["{{customer_name}}", "{{destination}}", "{{expiry_date}}", "{{days_remaining}}", "{{data_remaining}}", "{{renew_url}}", "{{unsubscribe_url}}", "{{privacy_url}}"],
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    htmlBody: wrapHtml("#f97316", "Your eSIM Expires Soon ⏰", `
<p style="margin:0 0 16px;font-size:15.5px;color:#1a1a1a;line-height:1.7;">Hi <strong>{{customer_name}}</strong>, your eSIM plan for <strong>{{destination}}</strong> expires in <strong>{{days_remaining}} days</strong> on <strong>{{expiry_date}}</strong>.</p>
<table cellpadding="0" cellspacing="0" style="width:100%;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;margin:16px 0;padding:20px;">
<tr><td>
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="font-size:13.5px;color:#c2410c;padding:5px 0;font-weight:600;">📅 Expiry Date</td><td style="font-size:13.5px;color:#1e293b;font-weight:700;text-align:right;">{{expiry_date}}</td></tr>
    <tr><td style="font-size:13.5px;color:#c2410c;padding:5px 0;font-weight:600;">⏱ Days Left</td><td style="font-size:13.5px;color:#1e293b;font-weight:700;text-align:right;">{{days_remaining}} days</td></tr>
    <tr><td style="font-size:13.5px;color:#c2410c;padding:5px 0;font-weight:600;">📶 Data Remaining</td><td style="font-size:13.5px;color:#1e293b;font-weight:700;text-align:right;">{{data_remaining}}</td></tr>
  </table>
</td></tr>
</table>
<p style="margin:16px 0 8px;text-align:center;">
  <a href="{{renew_url}}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:13px 32px;border-radius:10px;font-weight:700;font-size:14px;">Renew My Plan →</a>
</p>`)
  },
  {
    id: "tpl-topup-success",
    name: "Topup Successful",
    subject: "Top-up successful — {{data_added}} added to your eSIM ✅",
    category: "transactional",
    description: "Confirmation sent after a successful data top-up.",
    accentColor: "#10b981",
    prebuilt: true, active: true, usageCount: 0,
    variables: ["{{customer_name}}", "{{data_added}}", "{{new_balance}}", "{{destination}}", "{{topup_amount}}", "{{order_id}}", "{{dashboard_url}}", "{{unsubscribe_url}}", "{{privacy_url}}"],
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    htmlBody: wrapHtml("#10b981", "Top-Up Successful! ✅", `
<p style="margin:0 0 16px;font-size:15.5px;color:#1a1a1a;line-height:1.7;">Hi <strong>{{customer_name}}</strong>, your top-up was successful and your eSIM is recharged!</p>
<table cellpadding="0" cellspacing="0" style="width:100%;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;margin:16px 0;padding:20px;">
<tr><td>
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="font-size:13.5px;color:#166534;padding:5px 0;font-weight:600;">📍 Destination</td><td style="font-size:13.5px;color:#1e293b;font-weight:700;text-align:right;">{{destination}}</td></tr>
    <tr><td style="font-size:13.5px;color:#166534;padding:5px 0;font-weight:600;">➕ Data Added</td><td style="font-size:13.5px;color:#1e293b;font-weight:700;text-align:right;">{{data_added}}</td></tr>
    <tr><td style="font-size:13.5px;color:#166534;padding:5px 0;font-weight:600;">📶 New Balance</td><td style="font-size:13.5px;color:#1e293b;font-weight:700;text-align:right;">{{new_balance}}</td></tr>
    <tr style="border-top:1px solid #bbf7d0;"><td style="font-size:13.5px;color:#166534;padding-top:10px;font-weight:600;">💳 Amount Charged</td><td style="font-size:14px;color:#15803d;font-weight:700;text-align:right;padding-top:10px;">{{topup_amount}}</td></tr>
  </table>
</td></tr>
</table>
<p style="margin:16px 0 8px;text-align:center;">
  <a href="{{dashboard_url}}" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:13px 32px;border-radius:10px;font-weight:700;font-size:14px;">View My eSIM →</a>
</p>`)
  },
  {
    id: "tpl-kyc-approved",
    name: "KYC Approved",
    subject: "Your identity has been verified ✅",
    category: "kyc",
    description: "Sent when a customer's KYC submission is approved.",
    accentColor: "#10b981",
    prebuilt: true, active: true, usageCount: 0,
    variables: ["{{customer_name}}", "{{document_type}}", "{{verified_at}}", "{{dashboard_url}}", "{{unsubscribe_url}}", "{{privacy_url}}"],
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    htmlBody: wrapHtml("#10b981", "Identity Verified ✅", `
<p style="margin:0 0 16px;font-size:15.5px;color:#1a1a1a;line-height:1.7;">Congratulations, <strong>{{customer_name}}</strong>! Your identity has been successfully verified.</p>
<div style="text-align:center;padding:20px 0;">
  <div style="display:inline-block;background:#d1fae5;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:28px;">✅</div>
  <p style="margin:10px 0 0;font-size:16px;font-weight:700;color:#065f46;">KYC Verified</p>
  <p style="margin:4px 0 0;font-size:13px;color:#888;">{{document_type}} — verified on {{verified_at}}</p>
</div>
<table cellpadding="0" cellspacing="0" style="width:100%;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;margin:16px 0;padding:16px 20px;">
<tr><td style="font-size:14px;color:#065f46;line-height:1.75;">
  ✅ &nbsp;Full access to all Voltey features<br>
  ✅ &nbsp;Higher purchase limits enabled<br>
  ✅ &nbsp;Priority customer support
</td></tr>
</table>
<p style="margin:16px 0 8px;text-align:center;">
  <a href="{{dashboard_url}}" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:13px 32px;border-radius:10px;font-weight:700;font-size:14px;">Go to Dashboard →</a>
</p>`)
  },
  {
    id: "tpl-kyc-rejected",
    name: "KYC Rejected",
    subject: "Action required: Identity verification unsuccessful",
    category: "kyc",
    description: "Sent when a customer's KYC submission is rejected with reasons.",
    accentColor: "#ef4444",
    prebuilt: true, active: true, usageCount: 0,
    variables: ["{{customer_name}}", "{{rejection_reason}}", "{{document_type}}", "{{resubmit_url}}", "{{support_email}}", "{{unsubscribe_url}}", "{{privacy_url}}"],
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    htmlBody: wrapHtml("#ef4444", "Verification Unsuccessful", `
<p style="margin:0 0 16px;font-size:15.5px;color:#1a1a1a;line-height:1.7;">Hi <strong>{{customer_name}}</strong>, unfortunately we were unable to verify your identity.</p>
<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px 20px;margin:16px 0;">
  <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.8px;">Reason for Rejection</p>
  <p style="margin:0;font-size:14px;color:#7f1d1d;line-height:1.7;">{{rejection_reason}}</p>
</div>
<p style="margin:16px 0;font-size:14px;color:#444;line-height:1.75;">Please re-submit your <strong>{{document_type}}</strong> with a clear, legible, unobstructed image and try again.</p>
<p style="margin:16px 0 8px;text-align:center;">
  <a href="{{resubmit_url}}" style="display:inline-block;background:#ef4444;color:#fff;text-decoration:none;padding:13px 32px;border-radius:10px;font-weight:700;font-size:14px;">Re-Submit Documents →</a>
</p>
<p style="margin:20px 0 0;font-size:13px;color:#666;line-height:1.7;">Need assistance? Contact us at <a href="mailto:{{support_email}}" style="color:#ef4444;text-decoration:none;font-weight:600;">{{support_email}}</a>.</p>`)
  },
  {
    id: "tpl-promo",
    name: "Promotional Offer",
    subject: "🎁 Exclusive offer: {{discount}}% off all {{destination}} eSIMs",
    category: "marketing",
    description: "Marketing email for promotions and seasonal offers.",
    accentColor: "#ec4899",
    prebuilt: true, active: true, usageCount: 0,
    variables: ["{{customer_name}}", "{{destination}}", "{{discount}}", "{{promo_code}}", "{{expiry_date}}", "{{shop_url}}", "{{unsubscribe_url}}", "{{privacy_url}}"],
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    htmlBody: wrapHtml("linear-gradient(135deg,#ec4899,#8b5cf6)", "Exclusive Offer Just for You 🎁", `
<p style="margin:0 0 16px;font-size:15.5px;color:#1a1a1a;line-height:1.7;">Hi <strong>{{customer_name}}</strong>, you've unlocked a limited-time exclusive offer!</p>
<div style="text-align:center;background:linear-gradient(135deg,#fdf2f8,#f5f3ff);border:1px solid #f9a8d4;border-radius:16px;padding:28px 20px;margin:16px 0;">
  <p style="margin:0;font-size:14px;color:#9d174d;font-weight:600;">Limited Time Offer</p>
  <p style="margin:8px 0;font-size:48px;font-weight:900;color:#be185d;line-height:1;">{{discount}}%<span style="font-size:20px;"> OFF</span></p>
  <p style="margin:4px 0 16px;font-size:14px;color:#6d28d9;">All {{destination}} eSIM Plans</p>
  <div style="display:inline-block;background:#fff;border:2px dashed #ec4899;border-radius:10px;padding:10px 24px;">
    <p style="margin:0;font-size:11px;color:#9d174d;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Promo Code</p>
    <p style="margin:4px 0 0;font-size:22px;font-weight:900;color:#be185d;font-family:monospace;letter-spacing:2px;">{{promo_code}}</p>
  </div>
  <p style="margin:14px 0 0;font-size:12px;color:#a78bfa;">Expires {{expiry_date}}</p>
</div>
<p style="margin:16px 0 8px;text-align:center;">
  <a href="{{shop_url}}" style="display:inline-block;background:linear-gradient(135deg,#ec4899,#8b5cf6);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:14px;">Shop Now →</a>
</p>`)
  },
  {
    id: "tpl-system-alert",
    name: "System Alert",
    subject: "[Action Required] {{alert_title}} — Voltey eSIM",
    category: "system",
    description: "General-purpose system notification for admin or service alerts.",
    accentColor: "#64748b",
    prebuilt: true, active: true, usageCount: 0,
    variables: ["{{customer_name}}", "{{alert_title}}", "{{alert_body}}", "{{action_label}}", "{{action_url}}", "{{support_email}}", "{{unsubscribe_url}}", "{{privacy_url}}"],
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    htmlBody: wrapHtml("#64748b", "{{alert_title}}", `
<p style="margin:0 0 16px;font-size:15.5px;color:#1a1a1a;line-height:1.7;">Hi <strong>{{customer_name}}</strong>,</p>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:16px 0;">
  <p style="margin:0;font-size:14.5px;color:#334155;line-height:1.75;">{{alert_body}}</p>
</div>
<p style="margin:20px 0 8px;text-align:center;">
  <a href="{{action_url}}" style="display:inline-block;background:#64748b;color:#fff;text-decoration:none;padding:13px 32px;border-radius:10px;font-weight:700;font-size:14px;">{{action_label}} →</a>
</p>
<p style="margin:20px 0 0;font-size:13px;color:#666;">Questions? Contact <a href="mailto:{{support_email}}" style="color:#64748b;font-weight:600;text-decoration:none;">{{support_email}}</a></p>`)
  },
];

const SEED_NOTIFICATIONS: Notification[] = [
  { id:"notif-001", title:"Order Confirmed — #ORD-2843", body:"Your eSIM for Japan (7-Day 5GB) has been confirmed and is ready to activate.", type:"order", source:"system", customerName:"Arjun Mehta", customerEmail:"arjun.mehta@gmail.com", iccid:"894530001234567890", status:"unread", processingStatus:"processed", emailStatus:"sent", templateId:"tpl-order-confirm", createdAt:"2026-06-15T09:12:00.000Z", sentAt:"2026-06-15T09:12:05.000Z" },
  { id:"notif-002", title:"eSIM Activated — Japan", body:"Your eSIM is now active. Safe travels, Priya!", type:"esim_activation", source:"system", customerName:"Priya Sharma", customerEmail:"priya.sharma@outlook.com", iccid:"894530009876543210", status:"unread", processingStatus:"processed", emailStatus:"sent", templateId:"tpl-esim-activated", createdAt:"2026-06-15T11:45:00.000Z", sentAt:"2026-06-15T11:45:10.000Z" },
  { id:"notif-003", title:"Low Data Alert — 80% used", body:"You have only 1GB remaining on your Singapore eSIM.", type:"data_alert", source:"system", customerName:"Lucas Martin", customerEmail:"lucas.martin@gmail.com", iccid:"894530004567890123", status:"unread", processingStatus:"processed", emailStatus:"sent", templateId:"tpl-low-data", createdAt:"2026-06-14T14:30:00.000Z", sentAt:"2026-06-14T14:30:30.000Z" },
  { id:"notif-004", title:"KYC Approved — Aisha Okonkwo", body:"Identity verification approved for Aisha Okonkwo.", type:"kyc_update", source:"system", customerName:"Aisha Okonkwo", customerEmail:"aisha.okonkwo@yahoo.com", iccid:"", status:"read", processingStatus:"processed", emailStatus:"sent", templateId:"tpl-kyc-approved", createdAt:"2026-06-14T10:05:00.000Z", sentAt:"2026-06-14T10:05:15.000Z" },
  { id:"notif-005", title:"eSIM Expiry Reminder — 3 days", body:"Your France eSIM expires in 3 days. Renew to stay connected.", type:"expiry_reminder", source:"system", customerName:"Sophie Bernard", customerEmail:"sophie.bernard@live.fr", iccid:"894530007890123456", status:"unread", processingStatus:"processed", emailStatus:"sent", templateId:"tpl-expiry-reminder", createdAt:"2026-06-13T08:00:00.000Z", sentAt:"2026-06-13T08:00:20.000Z" },
  { id:"notif-006", title:"Topup Successful — 3GB added", body:"Your top-up of 3GB was successful for your Dubai eSIM.", type:"topup", source:"system", customerName:"Ravi Patel", customerEmail:"ravi.patel@gmail.com", iccid:"894530002345678901", status:"read", processingStatus:"processed", emailStatus:"sent", templateId:"tpl-topup-success", createdAt:"2026-06-12T16:22:00.000Z", sentAt:"2026-06-12T16:22:08.000Z" },
  { id:"notif-007", title:"Promotional Campaign — Summer Sale", body:"20% off all European eSIM plans this weekend only!", type:"promotion", source:"manual", customerName:"All Customers", customerEmail:"", iccid:"", status:"unread", processingStatus:"not_processed", emailStatus:"not_sent", templateId:"tpl-promo", createdAt:"2026-06-12T09:00:00.000Z" },
  { id:"notif-008", title:"KYC Rejected — Document Blurry", body:"Identity verification failed for Carlos Rivera — image quality too low.", type:"kyc_update", source:"system", customerName:"Carlos Rivera", customerEmail:"carlos.rivera@gmail.com", iccid:"", status:"unread", processingStatus:"processed", emailStatus:"failed", templateId:"tpl-kyc-rejected", createdAt:"2026-06-11T12:40:00.000Z" },
  { id:"notif-009", title:"Data Exhausted — Thailand", body:"Your Thailand eSIM data has been fully used.", type:"data_alert", source:"system", customerName:"Yuki Tanaka", customerEmail:"yuki.tanaka@gmail.com", iccid:"894530005678901234", status:"read", processingStatus:"processed", emailStatus:"sent", templateId:"tpl-data-exhausted", createdAt:"2026-06-10T19:15:00.000Z", sentAt:"2026-06-10T19:15:25.000Z" },
  { id:"notif-010", title:"New Customer Welcome — Amara Diallo", body:"Welcome email sent to new customer Amara Diallo.", type:"order", source:"system", customerName:"Amara Diallo", customerEmail:"amara.diallo@gmail.com", iccid:"", status:"read", processingStatus:"processed", emailStatus:"sent", templateId:"tpl-welcome", createdAt:"2026-06-10T08:30:00.000Z", sentAt:"2026-06-10T08:30:05.000Z" },
  { id:"notif-011", title:"System Maintenance Alert", body:"Scheduled maintenance on June 18, 00:00–02:00 UTC.", type:"system", source:"manual", customerName:"All Customers", customerEmail:"", iccid:"", status:"unread", processingStatus:"not_processed", emailStatus:"not_sent", templateId:"tpl-system-alert", createdAt:"2026-06-09T15:00:00.000Z" },
  { id:"notif-012", title:"Order Confirmed — #ORD-2791", body:"Your eSIM for USA (30-Day Unlimited) has been confirmed.", type:"order", source:"system", customerName:"Emma Wilson", customerEmail:"emma.wilson@icloud.com", iccid:"894530008901234567", status:"read", processingStatus:"processed", emailStatus:"sent", templateId:"tpl-order-confirm", createdAt:"2026-06-08T13:20:00.000Z", sentAt:"2026-06-08T13:20:10.000Z" },
  { id:"notif-013", title:"eSIM Activated — USA", body:"Your US eSIM is now active. Enjoy your trip!", type:"esim_activation", source:"system", customerName:"Emma Wilson", customerEmail:"emma.wilson@icloud.com", iccid:"894530008901234567", status:"read", processingStatus:"processed", emailStatus:"sent", templateId:"tpl-esim-activated", createdAt:"2026-06-08T14:05:00.000Z", sentAt:"2026-06-08T14:05:08.000Z" },
  { id:"notif-014", title:"Low Data Alert — Australia", body:"80% of your Australia eSIM data has been used.", type:"data_alert", source:"system", customerName:"Oliver Chen", customerEmail:"oliver.chen@gmail.com", iccid:"894530003456789012", status:"unread", processingStatus:"processed", emailStatus:"sent", templateId:"tpl-low-data", createdAt:"2026-06-07T10:00:00.000Z", sentAt:"2026-06-07T10:00:18.000Z" },
];

/* ─────────────────────────── File I/O ─────────────────────────── */
function loadNotifications(): Notification[] {
  if (!fs.existsSync(NOTIF_FILE)) {
    fs.writeFileSync(NOTIF_FILE, JSON.stringify(SEED_NOTIFICATIONS, null, 2));
    return SEED_NOTIFICATIONS;
  }
  return JSON.parse(fs.readFileSync(NOTIF_FILE, "utf8")) as Notification[];
}
function saveNotifications(list: Notification[]): void {
  fs.writeFileSync(NOTIF_FILE, JSON.stringify(list, null, 2));
}
function loadTemplates(): EmailTemplate[] {
  if (!fs.existsSync(TPL_FILE)) {
    fs.writeFileSync(TPL_FILE, JSON.stringify(PREBUILT_TEMPLATES, null, 2));
    return PREBUILT_TEMPLATES;
  }
  return JSON.parse(fs.readFileSync(TPL_FILE, "utf8")) as EmailTemplate[];
}
function saveTemplates(list: EmailTemplate[]): void {
  fs.writeFileSync(TPL_FILE, JSON.stringify(list, null, 2));
}

/* ─────────────────── Notification Routes ─────────────────── */
router.get("/admin/notifications", (req: Request, res: Response): void => {
  let list = loadNotifications();
  const { source, type, iccid, processingStatus, emailStatus, status } = req.query as Record<string, string>;
  if (source  && source  !== "all") list = list.filter(n => n.source === source);
  if (type    && type    !== "all") list = list.filter(n => n.type   === type);
  if (status  && status  !== "all") list = list.filter(n => n.status === status);
  if (iccid)  list = list.filter(n => n.iccid.includes(iccid));
  if (processingStatus === "processed")     list = list.filter(n => n.processingStatus === "processed");
  if (processingStatus === "not_processed") list = list.filter(n => n.processingStatus === "not_processed");
  if (emailStatus === "sent")     list = list.filter(n => n.emailStatus === "sent");
  if (emailStatus === "not_sent") list = list.filter(n => n.emailStatus === "not_sent" || n.emailStatus === "failed");
  list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(list);
});

router.get("/admin/notifications/stats", (_req: Request, res: Response): void => {
  const list = loadNotifications();
  res.json({
    total:       list.length,
    unread:      list.filter(n => n.status === "unread").length,
    emailsSent:  list.filter(n => n.emailStatus === "sent").length,
    emailsFailed:list.filter(n => n.emailStatus === "failed").length,
  });
});

router.post("/admin/notifications", (req: Request, res: Response): void => {
  const list = loadNotifications();
  const body = req.body as Partial<Notification>;
  const now  = new Date().toISOString();
  const notif: Notification = {
    id:                `notif-${Date.now()}`,
    title:             body.title             ?? "Untitled",
    body:              body.body              ?? "",
    type:              body.type              ?? "system",
    source:            body.source            ?? "manual",
    customerName:      body.customerName      ?? "",
    customerEmail:     body.customerEmail     ?? "",
    iccid:             body.iccid             ?? "",
    status:            "unread",
    processingStatus:  body.processingStatus  ?? "not_processed",
    emailStatus:       body.emailStatus       ?? "not_sent",
    templateId:        body.templateId,
    createdAt:         now,
  };
  list.unshift(notif);
  saveNotifications(list);
  res.status(201).json(notif);
});

router.patch("/admin/notifications/:id/read", (req: Request, res: Response): void => {
  const list = loadNotifications();
  const idx  = list.findIndex(n => n.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  list[idx].status = "read";
  saveNotifications(list);
  res.json(list[idx]);
});

router.patch("/admin/notifications/:id/send", (req: Request, res: Response): void => {
  const list = loadNotifications();
  const idx  = list.findIndex(n => n.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  list[idx].emailStatus      = "sent";
  list[idx].processingStatus = "processed";
  list[idx].sentAt           = new Date().toISOString();
  saveNotifications(list);
  res.json(list[idx]);
});

router.patch("/admin/notifications/mark-all-read", (_req: Request, res: Response): void => {
  const list = loadNotifications().map(n => ({ ...n, status: "read" as const }));
  saveNotifications(list);
  res.json({ success: true, updated: list.length });
});

router.delete("/admin/notifications/:id", (req: Request, res: Response): void => {
  const list = loadNotifications();
  const idx  = list.findIndex(n => n.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  list.splice(idx, 1);
  saveNotifications(list);
  res.status(204).end();
});

router.get("/admin/notifications/export-csv", (_req: Request, res: Response): void => {
  const list = loadNotifications();
  const header = "ID,Title,Type,Source,Customer,Email,ICCID,Status,Processing,Email Status,Created At";
  const rows = list.map(n =>
    `"${n.id}","${n.title}","${n.type}","${n.source}","${n.customerName}","${n.customerEmail}","${n.iccid}","${n.status}","${n.processingStatus}","${n.emailStatus}","${n.createdAt}"`
  );
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="notifications-${Date.now()}.csv"`);
  res.send([header, ...rows].join("\n"));
});

/* ─────────────────── Template Routes ─────────────────── */
router.get("/admin/notification-templates", (_req: Request, res: Response): void => {
  res.json(loadTemplates());
});

router.get("/admin/notification-templates/:id", (req: Request, res: Response): void => {
  const list = loadTemplates();
  const tpl  = list.find(t => t.id === req.params.id);
  if (!tpl) { res.status(404).json({ error: "Not found" }); return; }
  res.json(tpl);
});

router.post("/admin/notification-templates", (req: Request, res: Response): void => {
  const list = loadTemplates();
  const body = req.body as Partial<EmailTemplate>;
  const now  = new Date().toISOString();
  const tpl: EmailTemplate = {
    id:           `tpl-custom-${Date.now()}`,
    name:         body.name         ?? "Untitled Template",
    subject:      body.subject      ?? "",
    category:     body.category     ?? "transactional",
    description:  body.description  ?? "",
    htmlBody:     body.htmlBody     ?? "",
    variables:    body.variables    ?? [],
    prebuilt:     false,
    active:       true,
    accentColor:  body.accentColor  ?? "#10b981",
    usageCount:   0,
    createdAt:    now,
    updatedAt:    now,
  };
  list.push(tpl);
  saveTemplates(list);
  res.status(201).json(tpl);
});

router.put("/admin/notification-templates/:id", (req: Request, res: Response): void => {
  const list = loadTemplates();
  const idx  = list.findIndex(t => t.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  const body = req.body as Partial<EmailTemplate>;
  list[idx] = { ...list[idx], ...body, id: list[idx].id, prebuilt: list[idx].prebuilt, updatedAt: new Date().toISOString() };
  saveTemplates(list);
  res.json(list[idx]);
});

router.delete("/admin/notification-templates/:id", (req: Request, res: Response): void => {
  const list = loadTemplates();
  const idx  = list.findIndex(t => t.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  if (list[idx].prebuilt) { res.status(400).json({ error: "Cannot delete built-in templates" }); return; }
  list.splice(idx, 1);
  saveTemplates(list);
  res.status(204).end();
});

/* ─────────────────── Real Email Send Endpoints ─────────────────── */

router.post("/admin/notifications/send-low-data", async (req: Request, res: Response): Promise<void> => {
  const {
    to, customerName, packageName, orderNo, destination,
    dataUsedMb, dataTotalMb, dataRemainingMb, percentUsed,
    expiryDate, topupUrl,
  } = req.body as Record<string, string | number | undefined>;

  if (!to || !packageName) {
    res.status(400).json({ error: "to and packageName are required" });
    return;
  }

  try {
    await sendLowDataAlertEmail({
      to: String(to),
      customerName: customerName ? String(customerName) : undefined,
      packageName: String(packageName),
      orderNo: orderNo ? String(orderNo) : undefined,
      destination: destination ? String(destination) : undefined,
      dataUsedMb: dataUsedMb != null ? Number(dataUsedMb) : undefined,
      dataTotalMb: dataTotalMb != null ? Number(dataTotalMb) : undefined,
      dataRemainingMb: dataRemainingMb != null ? Number(dataRemainingMb) : undefined,
      percentUsed: percentUsed != null ? Number(percentUsed) : undefined,
      expiryDate: expiryDate ? String(expiryDate) : undefined,
      topupUrl: topupUrl ? String(topupUrl) : undefined,
    });

    const list = loadNotifications();
    list.unshift({
      id: `notif-${Date.now()}`,
      title: `Low Data Alert — ${destination ?? packageName}`,
      body: `Low data alert sent to ${to}`,
      type: "data_alert", source: "manual",
      customerName: customerName ? String(customerName) : String(to),
      customerEmail: String(to),
      iccid: "",
      status: "unread",
      processingStatus: "processed",
      emailStatus: "sent",
      templateId: "tpl-low-data",
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
    });
    saveNotifications(list);

    res.json({ success: true, message: "Low data alert email sent" });
  } catch (err) {
    res.status(500).json({ error: "Failed to send email", detail: err instanceof Error ? err.message : String(err) });
  }
});

router.post("/admin/notifications/send-expire-alert", async (req: Request, res: Response): Promise<void> => {
  const {
    to, customerName, packageName, orderNo, destination,
    expiryDate, daysRemaining, dataRemainingMb, renewUrl,
  } = req.body as Record<string, string | number | undefined>;

  if (!to || !packageName || !expiryDate || daysRemaining == null) {
    res.status(400).json({ error: "to, packageName, expiryDate, and daysRemaining are required" });
    return;
  }

  try {
    await sendExpireAlertEmail({
      to: String(to),
      customerName: customerName ? String(customerName) : undefined,
      packageName: String(packageName),
      orderNo: orderNo ? String(orderNo) : undefined,
      destination: destination ? String(destination) : undefined,
      expiryDate: String(expiryDate),
      daysRemaining: Number(daysRemaining),
      dataRemainingMb: dataRemainingMb != null ? Number(dataRemainingMb) : undefined,
      renewUrl: renewUrl ? String(renewUrl) : undefined,
    });

    const list = loadNotifications();
    list.unshift({
      id: `notif-${Date.now()}`,
      title: `Expiry Reminder — ${destination ?? packageName} (${daysRemaining}d)`,
      body: `Expiry alert sent to ${to}, expires ${expiryDate}`,
      type: "expiry_reminder", source: "manual",
      customerName: customerName ? String(customerName) : String(to),
      customerEmail: String(to),
      iccid: "",
      status: "unread",
      processingStatus: "processed",
      emailStatus: "sent",
      templateId: "tpl-expiry-reminder",
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
    });
    saveNotifications(list);

    res.json({ success: true, message: "Expire alert email sent" });
  } catch (err) {
    res.status(500).json({ error: "Failed to send email", detail: err instanceof Error ? err.message : String(err) });
  }
});

export default router;

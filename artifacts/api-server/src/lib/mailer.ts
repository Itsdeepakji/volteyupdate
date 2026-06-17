import nodemailer from "nodemailer";
import { logger } from "./logger";
import { loadSmtpConfig } from "../routes/smtpSettings";

interface EsimProfile {
  iccid: string;
  ac?: string;
  qrCodeUrl?: string;
  smdpAddress?: string;
  matchingId?: string;
  apn?: string;
  expiredTime?: string;
}

async function createTransporter() {
  const db = await loadSmtpConfig();
  return nodemailer.createTransport({
    host:   db?.host     ?? process.env.SMTP_HOST     ?? "smtp.zeptomail.com",
    port:   Number(db?.port ?? process.env.SMTP_PORT  ?? "587"),
    secure: (db?.port ?? process.env.SMTP_PORT)       === "465",
    auth: {
      user: db?.username ?? process.env.SMTP_USERNAME ?? "emailapikey",
      pass: db?.password ?? process.env.SMTP_PASSWORD ?? "",
    },
  });
}

async function getFromEmail(): Promise<string> {
  const db = await loadSmtpConfig();
  return db?.fromEmail ?? process.env.SMTP_FROM_EMAIL ?? "info@voltey.ai";
}

const SITE_URL = (process.env.SITE_URL ?? "").replace(/\/$/, "");

function logoBlock(): string {
  if (SITE_URL) {
    return `<img src="${SITE_URL}/logo-white.png" alt="Voltey" height="32" style="display:block;height:32px;width:auto;" />`;
  }
  return `<span style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-1px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">voltey</span>`;
}

function baseLayout(bodyHtml: string, footerLine: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Voltey</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.10);">

        <!-- ─── Header ─── -->
        <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:32px 40px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>${logoBlock()}</td>
            </tr>
          </table>
        </td></tr>

        <!-- ─── Body ─── -->
        <tr><td style="padding:36px 40px 28px;">${bodyHtml}</td></tr>

        <!-- ─── Footer ─── -->
        <tr><td style="background:#f8fafc;border-top:1px solid #e8edf3;padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">${footerLine}</p>
          <p style="margin:6px 0 0;font-size:11px;color:#cbd5e1;">© ${new Date().getFullYear()} Voltey. All rights reserved.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ─────────────────────────────────────────────────────────────────────
   ORDER CONFIRMATION EMAIL
───────────────────────────────────────────────────────────────────── */
export async function sendEsimConfirmationEmail(params: {
  to: string;
  packageName: string;
  transactionId: string;
  orderNo?: string;
  esimProfiles: EsimProfile[];
}): Promise<void> {
  const { to, packageName, transactionId, orderNo, esimProfiles } = params;
  const fromEmail = await getFromEmail();
  const ref = orderNo ?? transactionId;

  const profilesHtml = esimProfiles
    .map((profile, i) => {
      const isMulti = esimProfiles.length > 1;
      const smdp = profile.smdpAddress ?? (profile.ac ? profile.ac.split("$")[1] : null);
      const matchId = profile.matchingId ?? (profile.ac ? profile.ac.split("$")[2] : null);

      const qrHtml = profile.qrCodeUrl
        ? `<div style="text-align:center;margin:20px 0 12px;">
             <div style="display:inline-block;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:16px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
               <img src="${profile.qrCodeUrl}" alt="QR Code" width="160" height="160" style="display:block;width:160px;height:160px;" />
             </div>
             <p style="margin:10px 0 0;font-size:12px;color:#94a3b8;">Scan on your eSIM-compatible device</p>
           </div>`
        : profile.ac
        ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;margin:16px 0;word-break:break-all;font-family:monospace;font-size:12px;color:#334155;">${profile.ac}</div>`
        : "";

      return `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;margin-bottom:${isMulti ? "20px" : "0"};overflow:hidden;">
        ${isMulti ? `
        <div style="background:linear-gradient(90deg,#1e3a5f,#2d5a8e);padding:12px 20px;">
          <p style="margin:0;font-size:13px;font-weight:700;color:#ffffff;letter-spacing:0.2px;">📱 eSIM ${i + 1} of ${esimProfiles.length}</p>
        </div>` : ""}
        <div style="padding:20px;">
          ${qrHtml}
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;">
            <tr>
              <td style="padding:6px 0;border-bottom:1px solid #e8edf3;">
                <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">ICCID</span><br/>
                <span style="font-family:monospace;font-size:13px;color:#1e293b;font-weight:600;">${profile.iccid}</span>
              </td>
            </tr>
            ${smdp ? `<tr>
              <td style="padding:6px 0;border-bottom:1px solid #e8edf3;">
                <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">SM-DP+ Address</span><br/>
                <span style="font-family:monospace;font-size:12px;color:#334155;">${smdp}</span>
              </td>
            </tr>` : ""}
            ${matchId ? `<tr>
              <td style="padding:6px 0;">
                <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Activation Code</span><br/>
                <span style="font-family:monospace;font-size:12px;color:#334155;word-break:break-all;">${matchId}</span>
              </td>
            </tr>` : ""}
          </table>
        </div>
      </div>`;
    })
    .join("");

  const body = `
    <!-- Success badge -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#dcfce7;border-radius:50%;width:60px;height:60px;line-height:60px;font-size:28px;margin-bottom:12px;">✅</div>
      <h1 style="margin:0;font-size:24px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">Your eSIM is Ready!</h1>
      <p style="margin:6px 0 0;font-size:14px;color:#64748b;">Successfully activated and ready to install</p>
    </div>

    <!-- Plan name -->
    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
      Your eSIM for <strong style="color:#0f172a;">${packageName}</strong> has been successfully activated.
      ${esimProfiles.length > 1 ? `You ordered <strong>${esimProfiles.length} eSIMs</strong> — details for all ${esimProfiles.length} are included below.` : ""}
    </p>

    <!-- Order reference -->
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:14px 18px;margin-bottom:28px;">
      <p style="margin:0;font-size:11px;font-weight:700;color:#3b82f6;text-transform:uppercase;letter-spacing:0.8px;">Order Reference</p>
      <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#1e40af;font-family:monospace;">${ref}</p>
    </div>

    <!-- eSIM profiles -->
    <h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#0f172a;">Your eSIM Detail${esimProfiles.length > 1 ? "s" : ""}</h2>
    ${profilesHtml}

    <!-- Installation guide -->
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:20px;margin-top:24px;">
      <h3 style="margin:0 0 14px;font-size:14px;font-weight:700;color:#166534;">📲 How to install your eSIM</h3>
      <ol style="margin:0;padding-left:20px;color:#166534;font-size:13.5px;line-height:2;">
        <li>Go to <strong>Settings → Cellular / Mobile Data</strong></li>
        <li>Tap <strong>Add eSIM</strong> or <strong>Add Data Plan</strong></li>
        <li>Scan the QR code or enter the activation code manually</li>
        <li>Follow the on-screen instructions to complete installation</li>
        <li>Enable data roaming before you travel</li>
      </ol>
    </div>

    <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;line-height:1.7;">
      Need help? Reply to this email or contact us at
      <a href="mailto:${fromEmail}" style="color:#3b82f6;text-decoration:none;font-weight:600;">${fromEmail}</a>
    </p>`;

  const html = baseLayout(
    body,
    `Voltey &bull; <a href="mailto:${fromEmail}" style="color:#94a3b8;text-decoration:none;">${fromEmail}</a>`
  );

  const transport = await createTransporter();
  try {
    await transport.sendMail({
      from: `"Voltey" <${fromEmail}>`,
      to,
      subject: `Your eSIM${esimProfiles.length > 1 ? "s are" : " is"} ready — ${packageName}`,
      html,
    });
    logger.info({ to, packageName }, "eSIM confirmation email sent");
  } catch (err) {
    logger.error({ err, to }, "Failed to send eSIM confirmation email");
    throw err;
  }
}

/* ─────────────────────────────────────────────────────────────────────
   LOW DATA ALERT EMAIL
───────────────────────────────────────────────────────────────────── */
export async function sendLowDataAlertEmail(params: {
  to: string;
  customerName?: string;
  packageName: string;
  orderNo?: string;
  destination?: string;
  dataUsedMb?: number;
  dataTotalMb?: number;
  dataRemainingMb?: number;
  percentUsed?: number;
  expiryDate?: string;
  topupUrl?: string;
}): Promise<void> {
  const {
    to, customerName, packageName, orderNo, destination,
    dataUsedMb, dataTotalMb, dataRemainingMb, percentUsed = 80,
    expiryDate, topupUrl,
  } = params;

  const fromEmail = await getFromEmail();
  const name = customerName ?? "there";
  const dest = destination ?? packageName;
  const pct = Math.min(100, Math.round(percentUsed));
  const barFill = `${pct}%`;
  const barColor = pct >= 90 ? "#ef4444" : "#f59e0b";

  function fmtMb(mb?: number): string {
    if (mb == null) return "—";
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb} MB`;
  }

  const body = `
    <!-- Alert badge -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#fef3c7;border-radius:50%;width:60px;height:60px;line-height:60px;font-size:28px;margin-bottom:12px;">⚠️</div>
      <h1 style="margin:0;font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">Running Low on Data</h1>
      <p style="margin:6px 0 0;font-size:14px;color:#64748b;">You've used <strong style="color:#d97706;">${pct}%</strong> of your data</p>
    </div>

    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
      Hi <strong>${name}</strong>, your eSIM for <strong style="color:#0f172a;">${dest}</strong> is running low on data.
      ${orderNo ? `<br/><span style="font-size:13px;color:#94a3b8;">Order: ${orderNo}</span>` : ""}
    </p>

    <!-- Data usage bar -->
    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:14px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.8px;">Data Usage</p>
      <div style="background:#fef3c7;border-radius:999px;height:12px;width:100%;overflow:hidden;margin-bottom:10px;">
        <div style="background:${barColor};height:12px;border-radius:999px;width:${barFill};transition:width 0.3s;"></div>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:13px;color:#92400e;">
            Used: <strong>${fmtMb(dataUsedMb)}${dataTotalMb ? ` of ${fmtMb(dataTotalMb)}` : ""}</strong>
          </td>
          <td style="font-size:13px;color:#92400e;text-align:right;">
            Remaining: <strong>${fmtMb(dataRemainingMb)}</strong>
          </td>
        </tr>
      </table>
      ${expiryDate ? `<p style="margin:12px 0 0;font-size:12.5px;color:#b45309;">Plan expires: <strong>${expiryDate}</strong></p>` : ""}
    </div>

    <p style="margin:0 0 20px;font-size:14.5px;color:#334155;line-height:1.7;">
      Don't get caught without data — top up now to stay connected throughout your trip.
    </p>

    <!-- CTA button -->
    <div style="text-align:center;margin:24px 0;">
      <a href="${topupUrl ?? (SITE_URL || "https://voltey.uk")}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:0.2px;">
        Buy More Data →
      </a>
    </div>

    <p style="margin:20px 0 0;font-size:13px;color:#94a3b8;line-height:1.7;">
      Questions? Contact us at
      <a href="mailto:${fromEmail}" style="color:#f59e0b;text-decoration:none;font-weight:600;">${fromEmail}</a>
    </p>`;

  const html = baseLayout(
    body,
    `Voltey &bull; <a href="mailto:${fromEmail}" style="color:#94a3b8;text-decoration:none;">${fromEmail}</a>`
  );

  const transport = await createTransporter();
  try {
    await transport.sendMail({
      from: `"Voltey" <${fromEmail}>`,
      to,
      subject: `⚠️ Low data alert — ${dest} (${pct}% used)`,
      html,
    });
    logger.info({ to, packageName, pct }, "Low data alert email sent");
  } catch (err) {
    logger.error({ err, to }, "Failed to send low data alert email");
    throw err;
  }
}

/* ─────────────────────────────────────────────────────────────────────
   EXPIRE ALERT EMAIL
───────────────────────────────────────────────────────────────────── */
export async function sendExpireAlertEmail(params: {
  to: string;
  customerName?: string;
  packageName: string;
  orderNo?: string;
  destination?: string;
  expiryDate: string;
  daysRemaining: number;
  dataRemainingMb?: number;
  renewUrl?: string;
}): Promise<void> {
  const {
    to, customerName, packageName, orderNo, destination,
    expiryDate, daysRemaining, dataRemainingMb, renewUrl,
  } = params;

  const fromEmail = await getFromEmail();
  const name = customerName ?? "there";
  const dest = destination ?? packageName;
  const urgency = daysRemaining <= 1 ? "#ef4444" : daysRemaining <= 3 ? "#f97316" : "#f59e0b";
  const urgencyBg = daysRemaining <= 1 ? "#fef2f2" : daysRemaining <= 3 ? "#fff7ed" : "#fefce8";
  const urgencyBorder = daysRemaining <= 1 ? "#fecaca" : daysRemaining <= 3 ? "#fed7aa" : "#fde68a";

  function fmtMb(mb?: number): string {
    if (mb == null) return "—";
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb} MB`;
  }

  const urgencyLabel =
    daysRemaining <= 0 ? "Expires Today!" :
    daysRemaining === 1 ? "Expires Tomorrow!" :
    `Expires in ${daysRemaining} Days`;

  const body = `
    <!-- Alert badge -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:${urgencyBg};border-radius:50%;width:60px;height:60px;line-height:60px;font-size:28px;margin-bottom:12px;">⏰</div>
      <h1 style="margin:0;font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">Your eSIM Expires Soon</h1>
      <p style="margin:6px 0 0;font-size:14px;color:${urgency};font-weight:700;">${urgencyLabel}</p>
    </div>

    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
      Hi <strong>${name}</strong>, your eSIM plan for <strong style="color:#0f172a;">${dest}</strong>
      will expire soon. Renew now to avoid losing connectivity.
      ${orderNo ? `<br/><span style="font-size:13px;color:#94a3b8;">Order: ${orderNo}</span>` : ""}
    </p>

    <!-- Expiry details -->
    <div style="background:${urgencyBg};border:1px solid ${urgencyBorder};border-radius:14px;padding:20px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid ${urgencyBorder};">
            <span style="font-size:12px;font-weight:700;color:${urgency};text-transform:uppercase;letter-spacing:0.8px;">Expiry Date</span><br/>
            <span style="font-size:16px;font-weight:800;color:#0f172a;">${expiryDate}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;${dataRemainingMb != null ? "border-bottom:1px solid " + urgencyBorder + ";" : ""}">
            <span style="font-size:12px;font-weight:700;color:${urgency};text-transform:uppercase;letter-spacing:0.8px;">Days Remaining</span><br/>
            <span style="font-size:16px;font-weight:800;color:#0f172a;">${daysRemaining <= 0 ? "Expires today" : `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`}</span>
          </td>
        </tr>
        ${dataRemainingMb != null ? `<tr>
          <td style="padding:8px 0;">
            <span style="font-size:12px;font-weight:700;color:${urgency};text-transform:uppercase;letter-spacing:0.8px;">Data Remaining</span><br/>
            <span style="font-size:16px;font-weight:800;color:#0f172a;">${fmtMb(dataRemainingMb)}</span>
          </td>
        </tr>` : ""}
      </table>
    </div>

    <p style="margin:0 0 20px;font-size:14.5px;color:#334155;line-height:1.7;">
      Renew your plan now to continue enjoying seamless connectivity in <strong>${dest}</strong>.
    </p>

    <!-- CTA button -->
    <div style="text-align:center;margin:24px 0;">
      <a href="${renewUrl ?? (SITE_URL || "https://voltey.uk")}" style="display:inline-block;background:linear-gradient(135deg,${urgency},${daysRemaining <= 1 ? "#b91c1c" : daysRemaining <= 3 ? "#c2410c" : "#d97706"});color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:0.2px;">
        Renew My Plan →
      </a>
    </div>

    <p style="margin:20px 0 0;font-size:13px;color:#94a3b8;line-height:1.7;">
      Questions? Contact us at
      <a href="mailto:${fromEmail}" style="color:${urgency};text-decoration:none;font-weight:600;">${fromEmail}</a>
    </p>`;

  const html = baseLayout(
    body,
    `Voltey &bull; <a href="mailto:${fromEmail}" style="color:#94a3b8;text-decoration:none;">${fromEmail}</a>`
  );

  const transport = await createTransporter();
  try {
    await transport.sendMail({
      from: `"Voltey" <${fromEmail}>`,
      to,
      subject: `⏰ ${urgencyLabel} — ${dest} eSIM`,
      html,
    });
    logger.info({ to, packageName, daysRemaining }, "Expire alert email sent");
  } catch (err) {
    logger.error({ err, to }, "Failed to send expire alert email");
    throw err;
  }
}

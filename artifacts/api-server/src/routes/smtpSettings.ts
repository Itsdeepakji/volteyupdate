import { Router } from "express";
import { pool } from "@workspace/db";

export const DB_KEY_SMTP = "system:smtp-settings";

export interface SmtpConfig {
  host: string;
  port: string;
  username: string;
  password: string;
  fromEmail: string;
}

async function ensureTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS content_sections (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function loadSmtpConfig(): Promise<SmtpConfig | null> {
  try {
    await ensureTable();
    const r = await pool.query<{ value: SmtpConfig }>(
      `SELECT value FROM content_sections WHERE key = $1`,
      [DB_KEY_SMTP]
    );
    return r.rows[0]?.value ?? null;
  } catch {
    return null;
  }
}

async function saveSmtpConfig(cfg: SmtpConfig): Promise<void> {
  await ensureTable();
  await pool.query(
    `INSERT INTO content_sections (key, value, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = NOW()`,
    [DB_KEY_SMTP, JSON.stringify(cfg)]
  );
}

const router = Router();

router.get("/admin/smtp-settings", async (_req, res) => {
  const cfg = await loadSmtpConfig();
  res.json(cfg ?? {});
});

router.post("/admin/smtp-settings", async (req, res) => {
  const { host, port, username, password, fromEmail } = req.body as Partial<SmtpConfig>;
  if (!host || !port || !username || !fromEmail) {
    return res.status(400).json({ error: "host, port, username and fromEmail are required" });
  }
  await saveSmtpConfig({ host, port, username, password: password ?? "", fromEmail });
  return res.status(200).json({ ok: true });
});

export default router;

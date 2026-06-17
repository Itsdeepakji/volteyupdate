import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { pool } from "@workspace/db";

export interface GatewayConfig {
  id: string;
  provider: string;
  displayName: string;
  enabled: boolean;
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  testMode: boolean;
  createdAt: string;
  updatedAt: string;
}

const DB_KEY = "system:payment-gateways";

async function ensureTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS content_sections (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function loadGateways(): Promise<GatewayConfig[]> {
  try {
    await ensureTable();
    const r = await pool.query<{ value: GatewayConfig[] }>(
      `SELECT value FROM content_sections WHERE key = $1`,
      [DB_KEY]
    );
    return r.rows[0]?.value ?? [];
  } catch {
    return [];
  }
}

async function saveGateways(list: GatewayConfig[]): Promise<void> {
  await ensureTable();
  await pool.query(
    `INSERT INTO content_sections (key, value, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = NOW()`,
    [DB_KEY, JSON.stringify(list)]
  );
}

/** Used by stripe.ts to fall back to stored keys when env vars are absent. */
export async function getActiveGatewayConfig(provider: string): Promise<GatewayConfig | null> {
  const list = await loadGateways();
  return list.find(g => g.provider === provider && g.enabled) ?? null;
}

const router: IRouter = Router();

router.get("/admin/payment-gateways", async (_req: Request, res: Response): Promise<void> => {
  res.json({ gateways: await loadGateways() });
});

router.post("/admin/payment-gateways", async (req: Request, res: Response): Promise<void> => {
  const { provider, displayName, publishableKey = "", secretKey = "", webhookSecret = "", testMode = false } = req.body as Partial<GatewayConfig>;
  if (!provider || !displayName) {
    res.status(400).json({ error: "provider and displayName are required" });
    return;
  }
  const list = await loadGateways();
  const now = new Date().toISOString();
  const gw: GatewayConfig = {
    id: randomUUID(), provider, displayName, enabled: true,
    publishableKey, secretKey, webhookSecret, testMode, createdAt: now, updatedAt: now,
  };
  list.push(gw);
  await saveGateways(list);
  res.status(201).json(gw);
});

router.put("/admin/payment-gateways/:id", async (req: Request, res: Response): Promise<void> => {
  const list = await loadGateways();
  const idx  = list.findIndex(g => g.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Gateway not found" }); return; }
  const body = req.body as Partial<GatewayConfig>;
  list[idx] = { ...list[idx], ...body, id: list[idx].id, updatedAt: new Date().toISOString() };
  await saveGateways(list);
  res.json(list[idx]);
});

router.patch("/admin/payment-gateways/:id/toggle", async (req: Request, res: Response): Promise<void> => {
  const list = await loadGateways();
  const idx  = list.findIndex(g => g.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Gateway not found" }); return; }
  list[idx].enabled   = !list[idx].enabled;
  list[idx].updatedAt = new Date().toISOString();
  await saveGateways(list);
  res.json(list[idx]);
});

router.delete("/admin/payment-gateways/:id", async (req: Request, res: Response): Promise<void> => {
  const list = await loadGateways();
  const idx  = list.findIndex(g => g.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Gateway not found" }); return; }
  list.splice(idx, 1);
  await saveGateways(list);
  res.status(204).end();
});

export default router;

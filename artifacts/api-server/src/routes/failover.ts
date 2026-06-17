import { Router } from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const router = Router();

const CONFIG_FILE    = path.join(process.cwd(), "data", "failover-config.json");
const PROVIDERS_FILE = path.join(process.cwd(), "data", "failover-providers.json");
const APIKEYS_FILE   = path.join(process.cwd(), "data", "failover-api-keys.json");

/* ── types ─────────────────────────────────────────── */
interface FailoverConfig {
  enabled: boolean;
  minMargin: number;
  maxAttempts: number;
}

interface Provider {
  id: string;
  name: string;
  priority: number;
  status: "active" | "disabled";
  margin: number;
  preferred: boolean;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  rateLimit: number;
  createdAt: string;
  lastUsed: string | null;
  usageCount: number;
}

/* ── helpers ───────────────────────────────────────── */
const DEFAULT_CONFIG: FailoverConfig = { enabled: false, minMargin: 15, maxAttempts: 3 };

const DEFAULT_PROVIDERS: Provider[] = [
  { id: "esim-go",      name: "eSIM Go",      priority: 1, status: "disabled", margin: 20, preferred: false },
  { id: "maya-mobile",  name: "Maya Mobile",  priority: 2, status: "disabled", margin: 20, preferred: false },
  { id: "dataplans",    name: "DataPlans.io", priority: 3, status: "disabled", margin: 20, preferred: false },
  { id: "airalo",       name: "Airalo",       priority: 4, status: "disabled", margin: 20, preferred: false },
  { id: "esim-access",  name: "eSIM Access",  priority: 5, status: "active",   margin: 60, preferred: true  },
];

function loadConfig(): FailoverConfig {
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8")); }
  catch { return { ...DEFAULT_CONFIG }; }
}

function saveConfig(d: FailoverConfig) {
  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(d, null, 2));
}

function loadProviders(): Provider[] {
  try { return JSON.parse(fs.readFileSync(PROVIDERS_FILE, "utf8")); }
  catch { return DEFAULT_PROVIDERS.map(p => ({ ...p })); }
}

function saveProviders(d: Provider[]) {
  fs.mkdirSync(path.dirname(PROVIDERS_FILE), { recursive: true });
  fs.writeFileSync(PROVIDERS_FILE, JSON.stringify(d, null, 2));
}

function loadApiKeys(): ApiKey[] {
  try { return JSON.parse(fs.readFileSync(APIKEYS_FILE, "utf8")); }
  catch { return []; }
}

function saveApiKeys(d: ApiKey[]) {
  fs.mkdirSync(path.dirname(APIKEYS_FILE), { recursive: true });
  fs.writeFileSync(APIKEYS_FILE, JSON.stringify(d, null, 2));
}

/* ── Failover config ───────────────────────────────── */
router.get("/admin/failover/config", (_req, res) => {
  res.json(loadConfig());
});

router.put("/admin/failover/config", (req, res) => {
  const cfg = loadConfig();
  const { enabled, minMargin, maxAttempts } = req.body as Partial<FailoverConfig>;
  if (typeof enabled     === "boolean") cfg.enabled     = enabled;
  if (typeof minMargin   === "number")  cfg.minMargin   = minMargin;
  if (typeof maxAttempts === "number")  cfg.maxAttempts = maxAttempts;
  saveConfig(cfg);
  res.json(cfg);
});

/* ── Providers ─────────────────────────────────────── */
router.get("/admin/failover/providers", (_req, res) => {
  res.json(loadProviders().sort((a, b) => a.priority - b.priority));
});

router.put("/admin/failover/providers/:id", (req, res) => {
  const providers = loadProviders();
  const idx = providers.findIndex(p => p.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Provider not found" }); return; }
  const { margin, status, preferred } = req.body as Partial<Provider>;
  if (typeof margin    === "number")  providers[idx].margin    = margin;
  if (status === "active" || status === "disabled") providers[idx].status = status;
  if (typeof preferred === "boolean") {
    providers.forEach(p => { p.preferred = false; });
    providers[idx].preferred = preferred;
  }
  saveProviders(providers);
  res.json(providers[idx]);
});

router.post("/admin/failover/providers/:id/move", (req, res) => {
  const { direction } = req.body as { direction: "up" | "down" };
  const providers = loadProviders().sort((a, b) => a.priority - b.priority);
  const idx = providers.findIndex(p => p.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= providers.length) { res.json(providers); return; }
  const tmp = providers[idx].priority;
  providers[idx].priority = providers[swapIdx].priority;
  providers[swapIdx].priority = tmp;
  saveProviders(providers);
  res.json(providers.sort((a, b) => a.priority - b.priority));
});

/* ── API Keys ──────────────────────────────────────── */
router.get("/admin/failover/api-keys", (_req, res) => {
  res.json(loadApiKeys());
});

router.post("/admin/failover/api-keys", (req, res) => {
  const { name, rateLimit } = req.body as { name: string; rateLimit?: number };
  if (!name?.trim()) { res.status(400).json({ error: "Name required" }); return; }
  const keys = loadApiKeys();
  const rawKey = "vltey_live_" + crypto.randomBytes(24).toString("hex");
  const newKey: ApiKey = {
    id: crypto.randomUUID(),
    name: name.trim(),
    key: rawKey,
    rateLimit: Number(rateLimit) || 1000,
    createdAt: new Date().toISOString(),
    lastUsed: null,
    usageCount: 0,
  };
  keys.push(newKey);
  saveApiKeys(keys);
  res.status(201).json(newKey);
});

router.delete("/admin/failover/api-keys/:id", (req, res) => {
  const keys = loadApiKeys();
  const idx = keys.findIndex(k => k.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  keys.splice(idx, 1);
  saveApiKeys(keys);
  res.json({ ok: true });
});

router.post("/admin/failover/api-keys/:id/regenerate", (req, res) => {
  const keys = loadApiKeys();
  const k = keys.find(k => k.id === req.params.id);
  if (!k) { res.status(404).json({ error: "Not found" }); return; }
  k.key = "vltey_live_" + crypto.randomBytes(24).toString("hex");
  saveApiKeys(keys);
  res.json(k);
});

export default router;

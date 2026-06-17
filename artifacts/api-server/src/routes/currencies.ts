import { Router } from "express";
import fs from "fs";
import path from "path";

const router = Router();
const DATA_FILE = path.join(process.cwd(), "data", "currencies.json");

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number;
  enabled: boolean;
  isDefault: boolean;
}

const SEED: Currency[] = [
  { code:"USD", name:"US Dollar",        symbol:"$",   rate:1.000000, enabled:true, isDefault:true  },
  { code:"EUR", name:"Euro",             symbol:"€",   rate:0.920000, enabled:true, isDefault:false },
  { code:"GBP", name:"British Pound",    symbol:"£",   rate:0.790000, enabled:true, isDefault:false },
  { code:"AED", name:"UAE Dirham",       symbol:"د.إ", rate:3.673000, enabled:true, isDefault:false },
  { code:"SGD", name:"Singapore Dollar", symbol:"S$",  rate:1.350000, enabled:true, isDefault:false },
  { code:"JPY", name:"Japanese Yen",     symbol:"¥",   rate:149.500000,enabled:true,isDefault:false },
  { code:"AUD", name:"Australian Dollar",symbol:"A$",  rate:1.540000, enabled:true, isDefault:false },
  { code:"INR", name:"Indian Rupee",     symbol:"₹",   rate:83.120000, enabled:true,isDefault:false },
  { code:"CAD", name:"Canadian Dollar",  symbol:"C$",  rate:1.360000, enabled:true, isDefault:false },
];

function load(): Currency[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return SEED;
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Currency[];
    return parsed.length ? parsed : SEED;
  } catch {
    return SEED;
  }
}

function save(data: Currency[]) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

router.get("/currencies", (_req, res) => {
  const all = load();
  res.json(all.filter(c => c.enabled));
});

router.get("/admin/currencies", (_req, res) => {
  res.json(load());
});

router.post("/admin/currencies", (req, res) => {
  const all = load();
  const body = req.body as Partial<Currency>;
  if (!body.code || !body.name || !body.symbol) {
    return res.status(400).json({ error: "code, name and symbol are required" });
  }
  const code = body.code.toUpperCase();
  if (all.find(c => c.code === code)) {
    return res.status(409).json({ error: `Currency ${code} already exists` });
  }
  const newCurrency: Currency = {
    code,
    name: body.name,
    symbol: body.symbol,
    rate: Number(body.rate ?? 1),
    enabled: body.enabled !== false,
    isDefault: false,
  };
  all.push(newCurrency);
  save(all);
  res.status(201).json(newCurrency);
});

router.put("/admin/currencies/:code", (req, res) => {
  const all = load();
  const idx = all.findIndex(c => c.code === req.params.code);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const body = req.body as Partial<Currency>;
  all[idx] = {
    ...all[idx],
    name: body.name ?? all[idx].name,
    symbol: body.symbol ?? all[idx].symbol,
    rate: body.rate !== undefined ? Number(body.rate) : all[idx].rate,
    enabled: body.enabled !== undefined ? Boolean(body.enabled) : all[idx].enabled,
  };
  save(all);
  res.json(all[idx]);
});

router.delete("/admin/currencies/:code", (req, res) => {
  const all = load();
  const target = all.find(c => c.code === req.params.code);
  if (!target) return res.status(404).json({ error: "Not found" });
  if (target.isDefault) return res.status(400).json({ error: "Cannot delete the default currency" });
  const filtered = all.filter(c => c.code !== req.params.code);
  save(filtered);
  res.json({ ok: true });
});

router.post("/admin/currencies/:code/set-default", (req, res) => {
  const all = load();
  const target = all.find(c => c.code === req.params.code);
  if (!target) return res.status(404).json({ error: "Not found" });
  const updated = all.map(c => ({ ...c, isDefault: c.code === req.params.code, enabled: c.code === req.params.code ? true : c.enabled }));
  save(updated);
  res.json({ ok: true });
});

export default router;

import { Router, type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";

const router = Router();
const DATA_DIR   = path.resolve("data");
const REV_FILE   = path.join(DATA_DIR, "reviews.json");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

interface Review {
  id: string; customerName: string; customerEmail: string;
  packageName: string; destination: string; rating: number;
  title: string; body: string; status: "pending" | "approved" | "rejected";
  source: "store" | "manual" | "import"; verifiedPurchase: boolean;
  orderId?: string; adminResponse?: string;
  createdAt: string; updatedAt: string; approvedAt?: string;
}

const SEED: Review[] = [
  { id:"rev-001", customerName:"Arjun Mehta",     customerEmail:"arjun.mehta@gmail.com",    packageName:"Japan 7-Day 5GB",       destination:"Japan",        rating:5, title:"Perfect for Tokyo trip!", body:"Connected the moment I landed at Narita. Blazing fast 5G speeds and no interruptions throughout my 7-day stay. Will absolutely buy again.", status:"approved", source:"store", verifiedPurchase:true,  orderId:"ORD-2843", createdAt:"2026-06-15T10:00:00.000Z", updatedAt:"2026-06-15T11:00:00.000Z", approvedAt:"2026-06-15T11:00:00.000Z" },
  { id:"rev-002", customerName:"Priya Sharma",     customerEmail:"priya.sharma@outlook.com",  packageName:"Singapore 14-Day 10GB", destination:"Singapore",    rating:5, title:"Seamless connectivity!",   body:"Arrived in Changi and my eSIM was active within minutes. Incredibly easy setup. Speeds were excellent across the MRT and everywhere I went.", status:"approved", source:"store", verifiedPurchase:true,  orderId:"ORD-2791", createdAt:"2026-06-12T14:30:00.000Z", updatedAt:"2026-06-12T16:00:00.000Z", approvedAt:"2026-06-12T16:00:00.000Z" },
  { id:"rev-003", customerName:"Lucas Martin",     customerEmail:"lucas.martin@gmail.com",    packageName:"France 30-Day 20GB",    destination:"France",       rating:4, title:"Great value for Paris",    body:"Excellent coverage in Paris and Versailles. Had a slight hiccup setting up but customer support resolved it quickly. Overall very satisfied.", status:"approved", source:"store", verifiedPurchase:true,  orderId:"ORD-2756", createdAt:"2026-06-10T09:15:00.000Z", updatedAt:"2026-06-10T10:30:00.000Z", approvedAt:"2026-06-10T10:30:00.000Z", adminResponse:"Thank you for your kind words, Lucas! We're glad our support team was able to help." },
  { id:"rev-004", customerName:"Aisha Okonkwo",    customerEmail:"aisha.okonkwo@yahoo.com",   packageName:"UAE 7-Day 5GB",         destination:"UAE",          rating:5, title:"Dubai trip sorted!",       body:"Bought for my Dubai business trip. Setup took 2 minutes and worked perfectly at the conference center, hotels, and malls. No dropped calls.", status:"approved", source:"store", verifiedPurchase:true,  orderId:"ORD-2701", createdAt:"2026-06-08T11:00:00.000Z", updatedAt:"2026-06-08T12:00:00.000Z", approvedAt:"2026-06-08T12:00:00.000Z" },
  { id:"rev-005", customerName:"Sophie Bernard",   customerEmail:"sophie.bernard@live.fr",    packageName:"Thailand 10-Day 10GB",  destination:"Thailand",     rating:4, title:"Good but speeds vary",     body:"Works well in Bangkok and Phuket. Speeds dipped a bit in rural areas but that's expected. Would recommend for city travel.", status:"pending",  source:"store", verifiedPurchase:true,  orderId:"ORD-2665", createdAt:"2026-06-16T07:30:00.000Z", updatedAt:"2026-06-16T07:30:00.000Z" },
  { id:"rev-006", customerName:"Ravi Patel",       customerEmail:"ravi.patel@gmail.com",      packageName:"UK 30-Day Unlimited",   destination:"UK",           rating:3, title:"Decent but not amazing",   body:"Coverage was fine in London but patchy in the countryside. For the price I expected better. Customer support was responsive though.", status:"pending",  source:"store", verifiedPurchase:true,  orderId:"ORD-2620", createdAt:"2026-06-15T18:00:00.000Z", updatedAt:"2026-06-15T18:00:00.000Z" },
  { id:"rev-007", customerName:"Carlos Rivera",    customerEmail:"carlos.rivera@gmail.com",   packageName:"USA 30-Day Unlimited",  destination:"USA",          rating:5, title:"Essential for US travel",  body:"Used across New York, LA, and Chicago. Never had a connectivity issue. This is my go-to for US business trips now.", status:"approved", source:"store", verifiedPurchase:true,  orderId:"ORD-2580", createdAt:"2026-06-05T13:00:00.000Z", updatedAt:"2026-06-05T14:00:00.000Z", approvedAt:"2026-06-05T14:00:00.000Z" },
  { id:"rev-008", customerName:"Yuki Tanaka",      customerEmail:"yuki.tanaka@gmail.com",     packageName:"South Korea 7-Day 5GB", destination:"South Korea",  rating:2, title:"Disappointing experience",  body:"Had significant trouble activating the eSIM and speeds were very slow in Seoul. Expected much better based on the description.", status:"rejected", source:"store", verifiedPurchase:false, orderId:"ORD-2501", createdAt:"2026-06-01T09:00:00.000Z", updatedAt:"2026-06-02T10:00:00.000Z" },
  { id:"rev-009", customerName:"Emma Wilson",      customerEmail:"emma.wilson@icloud.com",    packageName:"Australia 14-Day 15GB", destination:"Australia",    rating:4, title:"Reliable down under",      body:"Used in Sydney and Melbourne. Rock solid coverage and good speeds. The 15GB was plenty for two weeks of maps, streaming and calls.", status:"approved", source:"store", verifiedPurchase:true,  orderId:"ORD-2455", createdAt:"2026-05-28T10:30:00.000Z", updatedAt:"2026-05-28T11:30:00.000Z", approvedAt:"2026-05-28T11:30:00.000Z" },
  { id:"rev-010", customerName:"Amara Diallo",     customerEmail:"amara.diallo@gmail.com",    packageName:"Indonesia 7-Day 7GB",   destination:"Indonesia",    rating:5, title:"Bali trip made easy",      body:"Activated before boarding and was connected as soon as I landed in Denpasar. Coverage everywhere in Bali and Lombok was excellent.", status:"pending",  source:"store", verifiedPurchase:true,  orderId:"ORD-2400", createdAt:"2026-06-16T05:00:00.000Z", updatedAt:"2026-06-16T05:00:00.000Z" },
];

function load(): Review[] {
  if (!fs.existsSync(REV_FILE)) { fs.writeFileSync(REV_FILE, JSON.stringify(SEED, null, 2)); return SEED; }
  return JSON.parse(fs.readFileSync(REV_FILE, "utf8")) as Review[];
}
function save(list: Review[]) { fs.writeFileSync(REV_FILE, JSON.stringify(list, null, 2)); }

/* ─── Public endpoints (no auth) ─── */

router.get("/reviews", (_req: Request, res: Response): void => {
  const list = load()
    .filter(r => r.status === "approved")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(list.map(r => ({
    id: r.id, customerName: r.customerName, packageName: r.packageName,
    destination: r.destination, rating: r.rating, title: r.title,
    body: r.body, adminResponse: r.adminResponse,
    verifiedPurchase: r.verifiedPurchase, createdAt: r.createdAt,
  })));
});

router.post("/reviews", (req: Request, res: Response): void => {
  const b = req.body as Partial<Review>;
  if (!b.customerName || !b.customerEmail || !b.body) {
    res.status(400).json({ error: "customerName, customerEmail and body are required" });
    return;
  }
  const list = load();
  const now = new Date().toISOString();
  const r: Review = {
    id: `rev-${Date.now()}`, customerName: b.customerName, customerEmail: b.customerEmail,
    packageName: b.packageName ?? "", destination: b.destination ?? "",
    rating: Math.min(5, Math.max(1, Number(b.rating ?? 5))),
    title: b.title ?? "", body: b.body, status: "pending",
    source: "store", verifiedPurchase: !!(b.orderId),
    orderId: b.orderId, createdAt: now, updatedAt: now,
  };
  list.unshift(r); save(list);
  res.status(201).json({ success: true, id: r.id, message: "Review submitted for approval" });
});

/* stats */
router.get("/admin/reviews/stats", (_req: Request, res: Response): void => {
  const list = load();
  const now  = new Date();
  const week = new Date(now.getTime() - 7 * 864e5);
  const avg  = list.filter(r => r.status === "approved").reduce((s, r) => s + r.rating, 0) / (list.filter(r => r.status === "approved").length || 1);
  res.json({
    total:   list.length,
    pending: list.filter(r => r.status === "pending").length,
    approved:list.filter(r => r.status === "approved").length,
    rejected:list.filter(r => r.status === "rejected").length,
    average: Math.round(avg * 10) / 10,
    recent7d:list.filter(r => new Date(r.createdAt) >= week).length,
  });
});

/* list with filters */
router.get("/admin/reviews", (req: Request, res: Response): void => {
  let list = load();
  const { status, rating, search, sort } = req.query as Record<string, string>;
  if (status && status !== "all") list = list.filter(r => r.status === status);
  if (rating && rating !== "all") list = list.filter(r => String(r.rating) === rating);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(r => r.customerName.toLowerCase().includes(q) || r.customerEmail.toLowerCase().includes(q) || r.packageName.toLowerCase().includes(q) || r.destination.toLowerCase().includes(q) || r.title.toLowerCase().includes(q));
  }
  list = [...list].sort((a, b) =>
    sort === "oldest"     ? a.createdAt.localeCompare(b.createdAt)  :
    sort === "rating_asc" ? a.rating - b.rating :
    sort === "rating_desc"? b.rating - a.rating :
    b.createdAt.localeCompare(a.createdAt)
  );
  res.json(list);
});

/* create */
router.post("/admin/reviews", (req: Request, res: Response): void => {
  const list = load();
  const b = req.body as Partial<Review>;
  const now = new Date().toISOString();
  const r: Review = {
    id: `rev-${Date.now()}`, customerName: b.customerName ?? "", customerEmail: b.customerEmail ?? "",
    packageName: b.packageName ?? "", destination: b.destination ?? "",
    rating: Number(b.rating ?? 5), title: b.title ?? "", body: b.body ?? "",
    status: "pending", source: "manual", verifiedPurchase: false,
    orderId: b.orderId, createdAt: now, updatedAt: now,
  };
  list.unshift(r); save(list); res.status(201).json(r);
});

/* approve */
router.patch("/admin/reviews/:id/approve", (req: Request, res: Response): void => {
  const list = load(); const idx = list.findIndex(r => r.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  list[idx].status = "approved"; list[idx].approvedAt = new Date().toISOString(); list[idx].updatedAt = new Date().toISOString();
  save(list); res.json(list[idx]);
});

/* reject */
router.patch("/admin/reviews/:id/reject", (req: Request, res: Response): void => {
  const list = load(); const idx = list.findIndex(r => r.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  list[idx].status = "rejected"; list[idx].updatedAt = new Date().toISOString();
  save(list); res.json(list[idx]);
});

/* admin response */
router.patch("/admin/reviews/:id/respond", (req: Request, res: Response): void => {
  const list = load(); const idx = list.findIndex(r => r.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  list[idx].adminResponse = (req.body as { response: string }).response ?? "";
  list[idx].updatedAt = new Date().toISOString();
  save(list); res.json(list[idx]);
});

/* delete */
router.delete("/admin/reviews/:id", (req: Request, res: Response): void => {
  const list = load(); const idx = list.findIndex(r => r.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  list.splice(idx, 1); save(list); res.status(204).end();
});

export default router;

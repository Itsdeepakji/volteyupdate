import { Router, type IRouter } from "express";
import { desc, count, sum, eq, ilike, or, and, sql, isNull, isNotNull } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db, ordersTable, customersTable, vouchersTable, giftCardsTable } from "@workspace/db";
import {
  listPackages,
  createOrder as createEsimOrder,
  queryOrder,
  type EsimPackage,
} from "../lib/esimaccess";

const router: IRouter = Router();

/* ─────────────────────────────────────────────────
   Package catalogue helpers  (admin-only)
───────────────────────────────────────────────── */
const GB = 1_073_741_824;

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
  packageType: "local" | "regional" | "global";
  isFavorite: boolean;
  supportTopUpType: number;
}

function enrichAdminPackage(pkg: EsimPackage): AdminPackage {
  const isRegional = pkg.locationCode.includes("-");
  const gbVal = pkg.volume > 0 ? pkg.volume / GB : 0;
  const dataGb =
    gbVal === 0
      ? "Unlimited"
      : gbVal < 1
      ? `${Math.round(gbVal * 1024)}MB`
      : `${Number(gbVal.toFixed(1)).toString()}GB`;

  const durationDays =
    pkg.durationUnit === "DAY" ? pkg.duration : pkg.duration * 30;
  const durationLabel =
    durationDays === 1 ? "1 day" : `${durationDays} days`;

  const nets = pkg.locationNetworkList ?? [];
  const locationName =
    nets.length === 1
      ? nets[0].locationName
      : isRegional
      ? pkg.name.split(" ").slice(0, 2).join(" ")
      : nets[0]?.locationName ?? pkg.locationCode;

  const locationSubtitle = isRegional ? "Regional Package" : pkg.locationCode;

  const operator =
    nets[0]?.operatorList?.[0]?.operatorName ?? "—";

  const flagUrl = isRegional
    ? "https://flagcdn.com/w640/un.png"
    : `https://flagcdn.com/w640/${pkg.locationCode.split(",")[0].toLowerCase().trim()}.png`;

  const packageType: "local" | "regional" | "global" =
    pkg.locationCode.startsWith("GL") ? "global"
    : isRegional ? "regional"
    : "local";

  return {
    packageCode: pkg.packageCode,
    name: pkg.name,
    locationCode: pkg.locationCode,
    locationName,
    locationSubtitle,
    dataGb,
    durationDays,
    durationLabel,
    retailPriceCents: Math.round((pkg.retailPrice ?? pkg.price) / 100),
    wholesalePriceCents: Math.round(pkg.price / 100),
    operator,
    provider: "esim_access_packages",
    flagUrl,
    isRegional,
    packageType,
    isFavorite: pkg.favorite ?? false,
    supportTopUpType: pkg.supportTopUpType ?? 0,
  };
}

/* In-memory package cache (10-min TTL) */
let pkgCache: AdminPackage[] | null = null;
let pkgCacheTs = 0;
const PKG_CACHE_TTL = 10 * 60 * 1000;

/* ── GET /api/admin/packages — all ESIMAccess packages with search+pagination ── */
router.get("/admin/packages", async (req, res): Promise<void> => {
  try {
    const now = Date.now();
    if (!pkgCache || now - pkgCacheTs > PKG_CACHE_TTL) {
      const raw = await listPackages();
      pkgCache = raw.map(enrichAdminPackage);
      pkgCacheTs = now;
    }

    let list = pkgCache;

    const {
      search, locationCode,
      page = "1", pageSize = "20",
      pkgType, priceRange, sortBy,
    } = req.query;

    if (typeof locationCode === "string" && locationCode.trim()) {
      const lc = locationCode.trim().toLowerCase();
      list = list.filter((p) => p.locationCode.toLowerCase() === lc);
    }

    if (typeof search === "string" && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.locationName.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.locationCode.toLowerCase().includes(q) ||
          p.dataGb.toLowerCase().includes(q) ||
          p.packageCode.toLowerCase().includes(q)
      );
    }

    if (typeof pkgType === "string" && pkgType !== "all") {
      list = list.filter((p) => p.packageType === pkgType);
    }

    if (typeof priceRange === "string" && priceRange !== "all") {
      if (priceRange === "0-10")  list = list.filter(p => p.retailPriceCents < 1000);
      if (priceRange === "10-20") list = list.filter(p => p.retailPriceCents >= 1000 && p.retailPriceCents < 2000);
      if (priceRange === "20-50") list = list.filter(p => p.retailPriceCents >= 2000 && p.retailPriceCents < 5000);
      if (priceRange === "50+")   list = list.filter(p => p.retailPriceCents >= 5000);
    }

    if (typeof sortBy === "string" && sortBy !== "default") {
      list = [...list];
      if (sortBy === "price_asc")  list.sort((a, b) => a.retailPriceCents - b.retailPriceCents);
      if (sortBy === "price_desc") list.sort((a, b) => b.retailPriceCents - a.retailPriceCents);
      if (sortBy === "name_asc")   list.sort((a, b) => a.locationName.localeCompare(b.locationName));
      if (sortBy === "data_desc")  list.sort((a, b) => parseFloat(b.dataGb) - parseFloat(a.dataGb));
    }

    const total = list.length;
    const pg = Math.max(1, parseInt(page as string, 10) || 1);
    const ps = Math.min(100, Math.max(1, parseInt(pageSize as string, 10) || 20));
    const items = list.slice((pg - 1) * ps, pg * ps);

    res.json({ packages: items, total, page: pg, pageSize: ps });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch admin packages");
    res.status(500).json({ error: "Failed to fetch packages" });
  }
});

/* ── GET /api/admin/countries — local packages grouped by country ── */
const TERRITORY_CODES = new Set([
  "AS","GU","PR","VI","MP",     // US territories
  "HK","MO","TW",               // China SARs / Taiwan
  "FO","GI","FK","BM","KY",     // British & Danish territories
  "AW","CW","SX","BQ",          // Dutch territories
  "NC","PF","GF","RE","YT",     // French territories
  "GG","JE","IM",               // Crown dependencies
  "AI","MS","TC","VG","SH",     // More British OT
  "CK","NU","TK",               // NZ associated
  "AQ","EH","GS","WF","PM","PN","TF",
]);

router.get("/admin/countries", async (req, res): Promise<void> => {
  try {
    const now = Date.now();
    if (!pkgCache || now - pkgCacheTs > PKG_CACHE_TTL) {
      const raw = await listPackages();
      pkgCache = raw.map(enrichAdminPackage);
      pkgCacheTs = now;
    }

    const locals = pkgCache.filter(p => p.packageType === "local");

    type CountryEntry = {
      code: string; name: string; flagUrl: string;
      packageCount: number; esimAccessCount: number; airaloCount: number; esimGoCount: number;
      type: "country" | "territory";
    };

    const countryMap = new Map<string, CountryEntry>();
    for (const pkg of locals) {
      const code = pkg.locationCode.toUpperCase();
      const existing = countryMap.get(code);
      if (!existing) {
        countryMap.set(code, {
          code, name: pkg.locationName, flagUrl: pkg.flagUrl,
          packageCount: 1, esimAccessCount: 1, airaloCount: 0, esimGoCount: 0,
          type: TERRITORY_CODES.has(code) ? "territory" : "country",
        });
      } else {
        existing.packageCount++;
        existing.esimAccessCount++;
      }
    }

    const { search, type, page = "1", pageSize = "50" } = req.query;

    let list = Array.from(countryMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    if (typeof search === "string" && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
    }

    if (typeof type === "string" && (type === "country" || type === "territory")) {
      list = list.filter(c => c.type === type);
    }

    const totalDestinations = countryMap.size;
    const countriesCount    = Array.from(countryMap.values()).filter(c => c.type === "country").length;
    const territoriesCount  = Array.from(countryMap.values()).filter(c => c.type === "territory").length;
    const totalPackages     = locals.length;

    const total = list.length;
    const pg = Math.max(1, parseInt(page as string, 10) || 1);
    const ps = Math.min(200, Math.max(1, parseInt(pageSize as string, 10) || 50));
    const items = list.slice((pg - 1) * ps, pg * ps);

    res.json({ countries: items, total, page: pg, pageSize: ps,
      totalDestinations, countriesCount, territoriesCount, totalPackages });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch countries");
    res.status(500).json({ error: "Failed to fetch countries" });
  }
});

/* ── GET /api/admin/regions — grouped regional / global packages ── */
const REGION_META: Record<string, { name: string; slug: string }> = {
  AF:      { name: "Africa",                           slug: "africa" },
  AS:      { name: "Asia",                             slug: "asia" },
  AU:      { name: "Australia",                        slug: "australia" },
  AUNZ:    { name: "Australia & New Zealand",          slug: "australia-nz" },
  AUKUS:   { name: "AUKUS",                            slug: "aukus" },
  BI:      { name: "Ireland & UK",                     slug: "ireland-uk" },
  CN:      { name: "China Mainland",                   slug: "china-mainland" },
  EU:      { name: "Europe",                           slug: "europe" },
  GL:      { name: "Global",                           slug: "global" },
  IESI:    { name: "Ireland & UK (eSIM)",              slug: "ireland-uk-esim" },
  ME:      { name: "Middle East",                      slug: "middle-east" },
  NA:      { name: "North America",                    slug: "north-america" },
  SA:      { name: "South America",                    slug: "south-america" },
  SGMYTH:  { name: "Singapore, Malaysia & Thailand",   slug: "sgmyth" },
};

router.get("/admin/regions", async (req, res): Promise<void> => {
  try {
    const now = Date.now();
    if (!pkgCache || now - pkgCacheTs > PKG_CACHE_TTL) {
      const raw = await listPackages();
      pkgCache = raw.map(enrichAdminPackage);
      pkgCacheTs = now;
    }

    const mixed = pkgCache.filter(p => p.packageType === "regional" || p.packageType === "global");

    type PrefixGroup = { packages: number; maxCountries: number };
    const groups = new Map<string, PrefixGroup>();

    for (const pkg of mixed) {
      const prefix = pkg.locationCode.split("-")[0].toUpperCase();
      const g = groups.get(prefix) ?? { packages: 0, maxCountries: 0 };
      g.packages++;
      const m = pkg.locationName.match(/\((\d+)/);
      if (m) { const n = parseInt(m[1]); if (n > g.maxCountries) g.maxCountries = n; }
      groups.set(prefix, g);
    }

    const regions = Array.from(groups.entries()).map(([prefix, g]) => {
      const meta = REGION_META[prefix] ?? {
        name: prefix,
        slug: prefix.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      };
      return {
        prefix,
        name: meta.name,
        slug: meta.slug,
        packageCount: g.packages,
        countriesCount: g.maxCountries,
        esimAccessCount: g.packages,
        airaloCount: 0,
        esimGoCount: 0,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    const totalPackages = regions.reduce((s, r) => s + r.packageCount, 0);
    res.json({ regions, total: regions.length, totalPackages });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch regions");
    res.status(500).json({ error: "Failed to fetch regions" });
  }
});

/* ── GET /api/admin/topup-packages — topup-capable packages only ── */
router.get("/admin/topup-packages", async (req, res): Promise<void> => {
  try {
    const now = Date.now();
    if (!pkgCache || now - pkgCacheTs > PKG_CACHE_TTL) {
      const raw = await listPackages();
      pkgCache = raw.map(enrichAdminPackage);
      pkgCacheTs = now;
    }

    let list = pkgCache.filter(p => p.supportTopUpType > 0);

    const { search, locationCode, page = "1", pageSize = "50" } = req.query;

    if (typeof locationCode === "string" && locationCode.trim()) {
      const lc = locationCode.trim().toLowerCase();
      list = list.filter(p => p.locationCode.toLowerCase() === lc);
    }

    if (typeof search === "string" && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        p => p.locationName.toLowerCase().includes(q) ||
             p.name.toLowerCase().includes(q) ||
             p.packageCode.toLowerCase().includes(q)
      );
    }

    const total = list.length;
    const pg = Math.max(1, parseInt(page as string, 10) || 1);
    const ps = Math.min(200, Math.max(1, parseInt(pageSize as string, 10) || 50));
    const items = list.slice((pg - 1) * ps, pg * ps);

    const byProvider = { esimaccess: list.length, airalo: 0, "esim-go": 0, maya: 0 };
    res.json({ packages: items, total, page: pg, pageSize: ps, byProvider });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch topup packages");
    res.status(500).json({ error: "Failed to fetch topup packages" });
  }
});

/* ── GET /api/admin/catalog-stats — fast stats for the catalog header ── */
router.get("/admin/catalog-stats", async (req, res): Promise<void> => {
  try {
    const now = Date.now();
    if (!pkgCache || now - pkgCacheTs > PKG_CACHE_TTL) {
      const raw = await listPackages();
      pkgCache = raw.map(enrichAdminPackage);
      pkgCacheTs = now;
    }
    const total     = pkgCache.length;
    const favorites = pkgCache.filter(p => p.isFavorite).length;
    const locals    = pkgCache.filter(p => p.packageType === "local").length;
    const regionals = pkgCache.filter(p => p.packageType === "regional").length;
    const globals   = pkgCache.filter(p => p.packageType === "global").length;
    res.json({ total, favorites, locals, regionals, globals });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch catalog stats");
    res.status(500).json({ error: "Failed to fetch catalog stats" });
  }
});

/* ── GET /api/admin/catalog-countries — packages grouped by country ── */
router.get("/admin/catalog-countries", async (req, res): Promise<void> => {
  try {
    const now = Date.now();
    if (!pkgCache || now - pkgCacheTs > PKG_CACHE_TTL) {
      const raw = await listPackages();
      pkgCache = raw.map(enrichAdminPackage);
      pkgCacheTs = now;
    }

    type CountryEntry = {
      locationCode: string; locationName: string; flagUrl: string;
      planCount: number; minPriceCents: number; maxPriceCents: number;
      packageTypes: Set<string>; hasFavorite: boolean;
    };

    const map = new Map<string, CountryEntry>();
    for (const pkg of pkgCache) {
      const ex = map.get(pkg.locationCode);
      if (ex) {
        ex.planCount++;
        if (pkg.retailPriceCents < ex.minPriceCents) ex.minPriceCents = pkg.retailPriceCents;
        if (pkg.retailPriceCents > ex.maxPriceCents) ex.maxPriceCents = pkg.retailPriceCents;
        ex.packageTypes.add(pkg.packageType);
        if (pkg.isFavorite) ex.hasFavorite = true;
      } else {
        map.set(pkg.locationCode, {
          locationCode: pkg.locationCode,
          locationName: pkg.locationName,
          flagUrl: pkg.flagUrl,
          planCount: 1,
          minPriceCents: pkg.retailPriceCents,
          maxPriceCents: pkg.retailPriceCents,
          packageTypes: new Set([pkg.packageType]),
          hasFavorite: pkg.isFavorite,
        });
      }
    }

    const countries = Array.from(map.values())
      .map(c => ({ ...c, packageTypes: Array.from(c.packageTypes) }))
      .sort((a, b) => a.locationName.localeCompare(b.locationName));

    const { search, pkgType, topupOnly } = req.query;
    let result = countries;
    if (topupOnly === "1") {
      // rebuild grouped map using only topup-capable packages
      const topupMap = new Map<string, CountryEntry>();
      for (const pkg of pkgCache) {
        if (!(pkg as any).supportTopUpType) continue;
        const ex = topupMap.get(pkg.locationCode);
        if (ex) {
          ex.planCount++;
          if (pkg.retailPriceCents < ex.minPriceCents) ex.minPriceCents = pkg.retailPriceCents;
          if (pkg.retailPriceCents > ex.maxPriceCents) ex.maxPriceCents = pkg.retailPriceCents;
          ex.packageTypes.add(pkg.packageType);
          if (pkg.isFavorite) ex.hasFavorite = true;
        } else {
          topupMap.set(pkg.locationCode, {
            locationCode: pkg.locationCode, locationName: pkg.locationName,
            flagUrl: pkg.flagUrl, planCount: 1,
            minPriceCents: pkg.retailPriceCents, maxPriceCents: pkg.retailPriceCents,
            packageTypes: new Set([pkg.packageType]), hasFavorite: pkg.isFavorite,
          });
        }
      }
      result = Array.from(topupMap.values())
        .map(c => ({ ...c, packageTypes: Array.from(c.packageTypes) }))
        .sort((a, b) => a.locationName.localeCompare(b.locationName));
    }
    if (typeof search === "string" && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(c => c.locationName.toLowerCase().includes(q) || c.locationCode.toLowerCase().includes(q));
    }
    if (typeof pkgType === "string" && pkgType !== "all") {
      result = result.filter(c => (c as any).packageTypes.includes(pkgType));
    }

    res.json({ countries: result, total: result.length });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch catalog countries");
    res.status(500).json({ error: "Failed to fetch catalog countries" });
  }
});

/* ── POST /api/admin/custom-orders — buy unassigned eSIM stock ── */
router.post("/admin/custom-orders", async (req, res): Promise<void> => {
  const { packageCode, packageName, price, quantity = 1 } = req.body as {
    packageCode?: string;
    packageName?: string;
    price?: number;
    quantity?: number;
  };

  if (!packageCode || !packageName || price == null) {
    res.status(400).json({ error: "packageCode, packageName and price are required" });
    return;
  }

  const transactionId = uuidv4();

  await db.insert(ordersTable).values({
    transactionId,
    customerEmail: "unassigned@voltey.admin",
    packageCode,
    packageName,
    price: Number(price),
    quantity: Math.min(100, Math.max(1, Number(quantity))),
    status: "pending",
    esimProfiles: [],
    emailSent: "false",
  });

  try {
    const result = await createEsimOrder({
      packageCode,
      quantity: Math.min(100, Math.max(1, Number(quantity))),
      transactionId,
    });

    let esimProfiles =
      result.packageInfoList?.flatMap((p) =>
        (p.esimList ?? []).map((e) => ({
          iccid: e.iccid,
          ac: e.ac,
          qrCodeUrl: e.qrCodeUrl,
          smdpAddress: e.smdpAddress,
          matchingId: e.matchingId,
          apn: e.apn,
          expiredTime: e.expiredTime,
        }))
      ) ?? [];

    if (esimProfiles.length === 0) {
      try {
        const qr = await queryOrder(transactionId);
        esimProfiles = (qr.esimList ?? []).map((e) => ({
          iccid: e.iccid,
          ac: e.ac,
          qrCodeUrl: e.qrCodeUrl,
          smdpAddress: e.smdpAddress,
          matchingId: e.matchingId,
          apn: e.apn,
          expiredTime: e.expiredTime,
        }));
      } catch (qErr) {
        req.log.warn({ qErr }, "Query after custom order returned nothing");
      }
    }

    await db
      .update(ordersTable)
      .set({ orderNo: result.orderNo, status: "completed", esimProfiles })
      .where(eq(ordersTable.transactionId, transactionId));

    res.json({
      transactionId,
      orderNo: result.orderNo,
      status: "completed",
      packageCode,
      packageName,
      esimProfiles,
      quantity: Number(quantity),
    });
  } catch (err) {
    req.log.error({ err }, "Custom order creation failed");
    await db
      .update(ordersTable)
      .set({ status: "failed" })
      .where(eq(ordersTable.transactionId, transactionId));
    const message = err instanceof Error ? err.message : "Order creation failed";
    res.status(500).json({ error: message });
  }
});

/* ── PATCH /api/admin/custom-orders/:transactionId/assign — assign eSIM to customer ── */
router.patch("/admin/custom-orders/:transactionId/assign", async (req, res): Promise<void> => {
  const { transactionId } = req.params;
  const { customerEmail } = req.body as { customerEmail?: string };

  if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    res.status(400).json({ error: "Valid customerEmail is required" });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.transactionId, transactionId))
    .limit(1);

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  await db
    .update(ordersTable)
    .set({ customerEmail })
    .where(eq(ordersTable.transactionId, transactionId));

  try {
    const esimProfiles = (order.esimProfiles ?? []) as Array<{
      iccid: string; ac?: string; qrCodeUrl?: string; smdpAddress?: string; matchingId?: string;
    }>;
    const { sendEsimConfirmationEmail } = await import("../lib/mailer");
    await sendEsimConfirmationEmail({
      to: customerEmail,
      packageName: order.packageName,
      transactionId: order.transactionId,
      orderNo: order.orderNo ?? undefined,
      esimProfiles,
    });
    await db
      .update(ordersTable)
      .set({ emailSent: "true" })
      .where(eq(ordersTable.transactionId, transactionId));
    res.json({ success: true, emailSent: true });
  } catch (emailErr) {
    req.log.error({ emailErr }, "Assign email failed");
    res.json({ success: true, emailSent: false, warning: "Order assigned but email failed to send" });
  }
});

/* ── GET /api/admin/orders — all orders newest-first ── */
router.get("/admin/orders", async (req, res): Promise<void> => {
  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt));
  res.json({ orders });
});

/* ── GET /api/admin/stats — aggregate overview ── */
router.get("/admin/stats", async (req, res): Promise<void> => {
  const [totals] = await db
    .select({ total: count(), revenue: sum(ordersTable.price) })
    .from(ordersTable);

  const [completed] = await db
    .select({ n: count() })
    .from(ordersTable)
    .where(eq(ordersTable.status, "completed"));

  const [pending] = await db
    .select({ n: count() })
    .from(ordersTable)
    .where(eq(ordersTable.status, "pending"));

  const [failed] = await db
    .select({ n: count() })
    .from(ordersTable)
    .where(eq(ordersTable.status, "failed"));

  res.json({
    totalOrders: Number(totals?.total ?? 0),
    totalRevenue: Number(totals?.revenue ?? 0),
    completedOrders: Number(completed?.n ?? 0),
    pendingOrders: Number(pending?.n ?? 0),
    failedOrders: Number(failed?.n ?? 0),
  });
});

/* ─────────────────────────────────────────────────
   Customer management
───────────────────────────────────────────────── */

function toCustomerResponse(c: typeof customersTable.$inferSelect) {
  return { ...c, uid: `UID${String(c.id).padStart(3, "0")}` };
}

router.get("/admin/customer-stats", async (_req, res) => {
  const [total]    = await db.select({ n: count() }).from(customersTable);
  const [verified] = await db.select({ n: count() }).from(customersTable).where(eq(customersTable.kycStatus, "verified"));
  const [pending]  = await db.select({ n: count() }).from(customersTable).where(eq(customersTable.kycStatus, "pending"));
  // Include customers who have placed orders but don't have an explicit record
  const explicitEmails = await db.select({ email: customersTable.email }).from(customersTable);
  const emailSet = new Set(explicitEmails.map(r => r.email.toLowerCase()));
  const orderEmails = await db.selectDistinct({ email: ordersTable.customerEmail }).from(ordersTable);
  const orderOnlyCount = orderEmails.filter(r => !emailSet.has(r.email.toLowerCase())).length;
  res.json({
    total:      Number(total?.n    ?? 0) + orderOnlyCount,
    verified:   Number(verified?.n ?? 0),
    pendingKyc: Number(pending?.n  ?? 0),
  });
});

router.get("/admin/customers", async (req, res) => {
  const { search, status, kycStatus } = req.query as Record<string, string | undefined>;
  const conditions = [];
  if (search)                          conditions.push(or(ilike(customersTable.name, `%${search}%`), ilike(customersTable.email, `%${search}%`)));
  if (status    && status    !== "all") conditions.push(eq(customersTable.userStatus, status));
  if (kycStatus && kycStatus !== "all") conditions.push(eq(customersTable.kycStatus,  kycStatus));
  const rows = await db
    .select()
    .from(customersTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(customersTable.createdAt));

  // Merge in order-derived customers (only when not filtering by status/kycStatus)
  let merged: (typeof customersTable.$inferSelect)[] = rows;
  if ((!status || status === "all") && (!kycStatus || kycStatus === "all")) {
    const emailSet = new Set(rows.map(r => r.email.toLowerCase()));
    const orderEmails = await db.selectDistinct({ email: ordersTable.customerEmail }).from(ordersTable);
    const unmatched = orderEmails.filter(r => !emailSet.has(r.email.toLowerCase()));
    if (unmatched.length > 0) {
      const searchLower = search?.toLowerCase();
      const derived = unmatched
        .filter(({ email }) => !searchLower || email.toLowerCase().includes(searchLower))
        .map(({ email }) => {
          const namePart = email.split("@")[0].replace(/[._+-]+/g, " ");
          const name = namePart.charAt(0).toUpperCase() + namePart.slice(1);
          return {
            id: 0,
            name,
            email,
            phone: null,
            kycStatus: "pending",
            userStatus: "active",
            notes: "Auto-detected from order history. Click Edit to save as a full customer record.",
            createdAt: new Date(),
            updatedAt: new Date(),
          } as typeof customersTable.$inferSelect;
        });
      merged = [...rows, ...derived];
    }
  }
  res.json({ customers: merged.map(toCustomerResponse) });
});

/* Sync customers from order history (backfill) */
router.post("/admin/customers/sync-from-orders", async (_req, res) => {
  const orderEmails = await db.selectDistinct({ email: ordersTable.customerEmail }).from(ordersTable);
  const explicitEmails = await db.select({ email: customersTable.email }).from(customersTable);
  const emailSet = new Set(explicitEmails.map(r => r.email.toLowerCase()));
  let created = 0;
  for (const { email } of orderEmails) {
    if (!emailSet.has(email.toLowerCase())) {
      const namePart = email.split("@")[0].replace(/[._+-]+/g, " ");
      const name = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      await db.insert(customersTable).values({ name, email });
      created++;
    }
  }
  res.json({ message: `Synced ${created} customer(s) from order history.`, created });
});

router.post("/admin/customers", async (req, res) => {
  const { name, email, phone, notes, kycStatus, userStatus } = req.body as Record<string, string | undefined>;
  if (!name || !email) { res.status(400).json({ error: "name and email are required" }); return; }
  const [row] = await db.insert(customersTable).values({
    name, email,
    phone:      phone      || null,
    notes:      notes      || null,
    kycStatus:  kycStatus  ?? "pending",
    userStatus: userStatus ?? "active",
  }).returning();
  res.json(toCustomerResponse(row));
});

router.patch("/admin/customers/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, email, phone, notes, kycStatus, userStatus } = req.body as Record<string, string | undefined>;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (name       !== undefined) updates.name       = name;
  if (email      !== undefined) updates.email      = email;
  if (phone      !== undefined) updates.phone      = phone || null;
  if (notes      !== undefined) updates.notes      = notes || null;
  if (kycStatus  !== undefined) updates.kycStatus  = kycStatus;
  if (userStatus !== undefined) updates.userStatus = userStatus;
  const [row] = await db.update(customersTable).set(updates).where(eq(customersTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "not found" }); return; }
  res.json(toCustomerResponse(row));
});

router.delete("/admin/customers/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await db.delete(customersTable).where(eq(customersTable.id, id));
  res.json({ ok: true });
});

/* ────────────── Vouchers ────────────── */

router.get("/admin/vouchers", async (req, res) => {
  const search  = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const status  = typeof req.query.status === "string" ? req.query.status : "all";
  const type    = typeof req.query.type   === "string" ? req.query.type   : "all";

  const filters = [];
  if (search) filters.push(or(ilike(vouchersTable.code, `%${search}%`), ilike(vouchersTable.description ?? vouchersTable.code, `%${search}%`)));
  if (status !== "all" && status !== "expired") filters.push(eq(vouchersTable.status, status));
  if (type   !== "all") filters.push(eq(vouchersTable.discountType, type));

  const whereClause = filters.length ? and(...filters) : undefined;

  const [vouchers, totalRows, activeRows, statsRow] = await Promise.all([
    db.select().from(vouchersTable)
      .where(whereClause)
      .orderBy(desc(vouchersTable.createdAt)),
    db.select({ count: count() }).from(vouchersTable),
    db.select({ count: count() }).from(vouchersTable).where(eq(vouchersTable.status, "active")),
    db.select({ totalUsage: sum(vouchersTable.usageCount), totalDiscount: sum(vouchersTable.totalDiscountGiven) }).from(vouchersTable),
  ]);

  let filtered = vouchers;
  if (status === "expired") {
    const now = new Date();
    filtered = filtered.filter(v => new Date(v.validUntil) < now);
  }

  res.json({
    vouchers: filtered,
    total: filtered.length,
    stats: {
      total:              totalRows[0]?.count   ?? 0,
      active:             activeRows[0]?.count  ?? 0,
      totalUsage:         Number(statsRow[0]?.totalUsage   ?? 0),
      totalDiscountGiven: statsRow[0]?.totalDiscount ?? "0",
    },
  });
});

router.post("/admin/vouchers", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  if (!code) { res.status(400).json({ error: "Voucher code is required" }); return; }
  const discountValue = String(body.discountValue ?? "0");
  if (isNaN(parseFloat(discountValue)) || parseFloat(discountValue) < 0) {
    res.status(400).json({ error: "Invalid discount value" }); return;
  }
  try {
    const [row] = await db.insert(vouchersTable).values({
      code,
      description:       body.description ? String(body.description) : null,
      discountType:      String(body.discountType ?? "percentage"),
      discountValue:     discountValue,
      status:            String(body.status ?? "active"),
      minPurchaseAmount: String(body.minPurchaseAmount ?? "0"),
      maxDiscountCap:    body.maxDiscountCap != null ? String(body.maxDiscountCap) : null,
      totalUsageLimit:   body.totalUsageLimit != null ? Number(body.totalUsageLimit) : null,
      perUserLimit:      Number(body.perUserLimit ?? 1),
      validFrom:         new Date(String(body.validFrom)),
      validUntil:        new Date(String(body.validUntil)),
      firstTimeOnly:     Boolean(body.firstTimeOnly),
      stackable:         Boolean(body.stackable),
    }).returning();
    res.status(201).json(row);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown error";
    if (msg.includes("unique")) { res.status(409).json({ error: `Voucher code "${code}" already exists` }); return; }
    res.status(500).json({ error: msg });
  }
});

router.patch("/admin/vouchers/:id", async (req, res) => {
  const { id } = req.params;
  const body = req.body as Record<string, unknown>;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.status      !== undefined) updates.status      = body.status;
  if (body.description !== undefined) updates.description = body.description;
  const [row] = await db.update(vouchersTable).set(updates).where(eq(vouchersTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "not found" }); return; }
  res.json(row);
});

router.delete("/admin/vouchers/:id", async (req, res) => {
  const { id } = req.params;
  await db.delete(vouchersTable).where(eq(vouchersTable.id, id));
  res.json({ ok: true });
});

/* ────────────── Gift Cards ────────────── */

function makeGiftCode() {
  const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const s = () => Array.from({ length: 4 }, () => c[Math.floor(Math.random() * c.length)]).join("");
  return `GC-${s()}-${s()}-${s()}-${s()}`;
}

router.get("/admin/gift-cards", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const status = typeof req.query.status === "string" ? req.query.status : "all";

  const filters = [];
  if (search) {
    filters.push(or(
      ilike(giftCardsTable.code, `%${search}%`),
      ilike(giftCardsTable.recipientEmail ?? giftCardsTable.code, `%${search}%`),
      ilike(giftCardsTable.recipientName  ?? giftCardsTable.code, `%${search}%`),
    ));
  }
  if (status !== "all" && status !== "expired") {
    filters.push(eq(giftCardsTable.status, status));
  }
  const whereClause = filters.length ? and(...filters) : undefined;

  const [cards, totalRows, activeRows, statsRows, pendingRows] = await Promise.all([
    db.select().from(giftCardsTable).where(whereClause).orderBy(desc(giftCardsTable.createdAt)),
    db.select({ count: count() }).from(giftCardsTable),
    db.select({ count: count() }).from(giftCardsTable).where(eq(giftCardsTable.status, "active")),
    db.select({
      totalValue:  sum(giftCardsTable.amount),
      redeemedRaw: sql<string>`COALESCE(SUM(${giftCardsTable.amount}::numeric - ${giftCardsTable.balance}::numeric), 0)`,
    }).from(giftCardsTable),
    db.select({ count: count() }).from(giftCardsTable)
      .where(and(isNotNull(giftCardsTable.recipientEmail), isNull(giftCardsTable.sentAt))),
  ]);

  let filtered = cards;
  if (status === "expired") {
    const now = new Date();
    filtered = filtered.filter(c => new Date(c.expiresAt) < now);
  }

  res.json({
    cards: filtered,
    total: filtered.length,
    stats: {
      total:           totalRows[0]?.count    ?? 0,
      active:          activeRows[0]?.count   ?? 0,
      totalValue:      statsRows[0]?.totalValue ?? "0",
      redeemed:        statsRows[0]?.redeemedRaw ?? "0",
      pendingDelivery: pendingRows[0]?.count  ?? 0,
    },
  });
});

router.post("/admin/gift-cards", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const amount = parseFloat(String(body.amount ?? "0"));
  if (!amount || amount <= 0) { res.status(400).json({ error: "Invalid amount" }); return; }

  const expiresAt = body.expiresAt ? new Date(String(body.expiresAt)) : (() => {
    const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d;
  })();

  const [row] = await db.insert(giftCardsTable).values({
    code:            makeGiftCode(),
    amount:          String(amount),
    balance:         String(amount),
    theme:           String(body.theme   ?? "Default"),
    recipientName:   body.recipientName  ? String(body.recipientName)  : null,
    recipientEmail:  body.recipientEmail ? String(body.recipientEmail) : null,
    personalMessage: body.personalMessage ? String(body.personalMessage) : null,
    expiresAt,
  }).returning();
  res.status(201).json(row);
});

router.post("/admin/gift-cards/bulk", async (req, res) => {
  const body  = req.body as Record<string, unknown>;
  const count = parseInt(String(body.count ?? "0"));
  const amount = parseFloat(String(body.amount ?? "0"));
  if (!count || count < 1 || count > 500) { res.status(400).json({ error: "Count must be 1–500" }); return; }
  if (!amount || amount <= 0)              { res.status(400).json({ error: "Invalid amount" }); return; }

  const expiresAt = (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d; })();
  const rows = Array.from({ length: count }, () => ({
    code: makeGiftCode(), amount: String(amount), balance: String(amount), expiresAt,
  }));
  const inserted = await db.insert(giftCardsTable).values(rows).returning();
  res.status(201).json({ created: inserted.length });
});

router.patch("/admin/gift-cards/:id", async (req, res) => {
  const { id } = req.params;
  const body   = req.body as Record<string, unknown>;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.status !== undefined) updates.status = body.status;
  const [row] = await db.update(giftCardsTable).set(updates).where(eq(giftCardsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "not found" }); return; }
  res.json(row);
});

router.delete("/admin/gift-cards/:id", async (req, res) => {
  const { id } = req.params;
  await db.delete(giftCardsTable).where(eq(giftCardsTable.id, id));
  res.json({ ok: true });
});

export default router;

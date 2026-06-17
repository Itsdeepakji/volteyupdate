import { Router, type IRouter } from "express";
import { listPackages, getFlagUrl, type EsimPackage } from "../lib/esimaccess";
import { ListPackagesQueryParams } from "@workspace/api-zod";

const GB = 1_073_741_824; // bytes per GiB

// The only 8 plan combos shown in the store
const ALLOWED_PLANS: Array<{ gb: number; days: number[] }> = [
  { gb: 1,  days: [7] },
  { gb: 3,  days: [15, 30] },
  { gb: 5,  days: [30] },
  { gb: 10, days: [30] },
  { gb: 20, days: [30] },
  { gb: 50, days: [30, 180] },
];

interface PlanKey { gb: number; days: number }

function getPlanKey(pkg: EsimPackage): PlanKey | null {
  if (!pkg.volume || pkg.volume === 0) return null;
  if (pkg.name.toLowerCase().includes("/day")) return null;

  const days = pkg.durationUnit === "DAY" ? pkg.duration : pkg.duration * 30;
  const volumeGb = pkg.volume / GB;

  for (const { gb, days: allowed } of ALLOWED_PLANS) {
    if (Math.abs(volumeGb - gb) / gb < 0.05 && allowed.includes(days)) {
      return { gb, days };
    }
  }
  return null;
}

/**
 * From all returned packages, pick exactly ONE plan per allowed (gb, days) combo:
 *   1. Cheapest plan whose locationCode === requestedCode (country-specific)
 *   2. Failing that, cheapest regional plan (locationCode contains "-", but NOT "GL-")
 *   No global plans (GL-*) are ever shown.
 */
function selectBestPlans(packages: EsimPackage[], requestedCode: string): EsimPackage[] {
  // Tier 0 = exact country, Tier 1 = regional, skip global
  const isGlobal = (code: string) => code.startsWith("GL-") || code.startsWith("GL");

  const byCombo = new Map<string, { tier: number; pkg: EsimPackage }>();

  for (const pkg of packages) {
    if (isGlobal(pkg.locationCode)) continue;

    const key = getPlanKey(pkg);
    if (!key) continue;

    const comboKey = `${key.gb}|${key.days}`;
    const tier = pkg.locationCode === requestedCode ? 0 : 1;
    const price = pkg.retailPrice ?? pkg.price;

    const existing = byCombo.get(comboKey);
    if (
      !existing ||
      tier < existing.tier ||
      (tier === existing.tier && price < (existing.pkg.retailPrice ?? existing.pkg.price))
    ) {
      byCombo.set(comboKey, { tier, pkg });
    }
  }

  // Return plans sorted by volume asc, then duration asc
  return Array.from(byCombo.values())
    .map((e) => e.pkg)
    .sort((a, b) => {
      if (a.volume !== b.volume) return a.volume - b.volume;
      const daysA = a.durationUnit === "DAY" ? a.duration : a.duration * 30;
      const daysB = b.durationUnit === "DAY" ? b.duration : b.duration * 30;
      return daysA - daysB;
    });
}

interface RelatedRegion {
  locationCode: string;
  locationName: string;
  lowestPrice: number;
  countryCount: number;
  flagUrl: string;
  isGlobal: boolean;
}

function computeRelatedRegions(packages: EsimPackage[]): RelatedRegion[] {
  const regionMap = new Map<string, { name: string; lowestPrice: number; countryCodes: Set<string>; isGlobal: boolean }>();

  for (const pkg of packages) {
    const code = pkg.locationCode;
    if (!code.includes("-")) continue; // skip country-specific

    const isGlobal = code.startsWith("GL-");
    const price = Math.round((pkg.retailPrice ?? pkg.price) / 100);

    if (!regionMap.has(code)) {
      // Derive a friendly region name by stripping data/duration tokens from package name
      const nameParts = pkg.name.split(" ").filter(
        (p) => !p.match(/^\d+([.,]\d+)?$/) && !p.includes("GB") && !p.includes("MB") && !p.includes("Day")
      );
      const regionName = isGlobal ? "Global" : (nameParts.join(" ").trim() || code);

      // Count unique country-level codes from locationNetworkList
      const countryCodes = new Set<string>();
      for (const net of pkg.locationNetworkList ?? []) {
        if (/^[A-Z]{2}$/.test(net.locationCode)) {
          countryCodes.add(net.locationCode);
        }
      }

      regionMap.set(code, { name: regionName, lowestPrice: price, countryCodes, isGlobal });
    } else {
      const existing = regionMap.get(code)!;
      if (price < existing.lowestPrice) existing.lowestPrice = price;
      // Union country codes from additional packages of same region
      for (const net of pkg.locationNetworkList ?? []) {
        if (/^[A-Z]{2}$/.test(net.locationCode)) existing.countryCodes.add(net.locationCode);
      }
    }
  }

  const all = Array.from(regionMap.entries()).map(([locationCode, d]) => ({
    locationCode,
    locationName: d.name,
    lowestPrice: d.lowestPrice,
    countryCount: d.countryCodes.size,
    flagUrl: getFlagUrl(locationCode),
    isGlobal: d.isGlobal,
  }));

  // For global plans: keep only the one with the most countries (or lowest price on tie)
  const globals = all.filter((r) => r.isGlobal);
  const bestGlobal = globals.sort((a, b) =>
    b.countryCount - a.countryCount || a.lowestPrice - b.lowestPrice
  )[0];

  // For regional plans: deduplicate by normalised name, keep cheapest per name
  const regionByName = new Map<string, typeof all[number]>();
  for (const r of all.filter((r) => !r.isGlobal)) {
    const key = r.locationName.toLowerCase().trim();
    const existing = regionByName.get(key);
    if (!existing || r.lowestPrice < existing.lowestPrice) regionByName.set(key, r);
  }

  const regions = Array.from(regionByName.values()).sort((a, b) =>
    a.locationName.localeCompare(b.locationName)
  );

  return bestGlobal ? [...regions, bestGlobal] : regions;
}

const router: IRouter = Router();

router.get("/packages", async (req, res): Promise<void> => {
  const parsed = ListPackagesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { locationCode } = parsed.data;

  try {
    const packages = await listPackages(locationCode);

    if (packages.length === 0) {
      res.status(404).json({ error: "No packages found for this destination" });
      return;
    }

    const best = selectBestPlans(packages, locationCode ?? "");

    if (best.length === 0) {
      res.status(404).json({ error: "No matching plans found for this destination" });
      return;
    }

    const enriched = best.map((pkg) => ({
      ...pkg,
      // ESIMAccess prices are already in USD cents; divide by 100 → dollars for frontend
      price: Math.round((pkg.retailPrice ?? pkg.price) / 100),
      retailPrice: Math.round(pkg.retailPrice / 100),
      flagUrl: getFlagUrl(pkg.locationCode),
      locationName: resolveDestinationName(packages, locationCode ?? ""),
    }));

    const locationName = resolveDestinationName(packages, locationCode ?? "");
    const relatedRegions = computeRelatedRegions(packages);

    res.json({ packages: enriched, locationName, locationCode, relatedRegions });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch packages");
    res.status(500).json({ error: "Failed to fetch packages" });
  }
});

function resolveDestinationName(packages: EsimPackage[], requestedCode: string): string {
  if (!requestedCode) return packages[0] ? getNameFromPkg(packages[0]) : "Unknown";

  const exactPkg = packages.find((p) => p.locationCode === requestedCode);
  if (exactPkg) {
    if (exactPkg.locationNetworkList?.length === 1) return exactPkg.locationNetworkList[0].locationName;
    return getNameFromPkg(exactPkg);
  }

  for (const pkg of packages) {
    const match = pkg.locationNetworkList?.find((n) => n.locationCode === requestedCode);
    if (match) return match.locationName;
  }

  return getNameFromPkg(packages[0]);
}

function getNameFromPkg(pkg: EsimPackage): string {
  const nets = pkg.locationNetworkList;
  if (nets?.length === 1) return nets[0].locationName;
  const parts = pkg.name.split(" ").filter(
    (p) => !p.match(/^\d+$/) && !p.includes("GB") && !p.includes("MB") && !p.includes("Days") && !p.includes("Day"),
  );
  return parts.join(" ").trim() || pkg.locationCode;
}

export default router;

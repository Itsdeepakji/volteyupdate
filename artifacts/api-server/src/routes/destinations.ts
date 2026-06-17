import { Router, type IRouter } from "express";
import { listPackages, getFlagUrl, type EsimPackage } from "../lib/esimaccess";

const router: IRouter = Router();

interface DestinationSummary {
  locationCode: string;
  locationName: string;
  flagUrl: string;
  lowestPrice: number;
  packageCount: number;
  isRegion: boolean;
}

router.get("/destinations", async (req, res): Promise<void> => {
  try {
    const packages = await listPackages();

    const destinationMap = new Map<string, DestinationSummary>();

    for (const pkg of packages) {
      const code = pkg.locationCode;
      // Only index country-level codes (no hyphen = not a regional bundle)
      // Region bundles like NA-3, EU-42, GL-139 are shown inside the destination detail, not as top-level entries
      const isRegion = code.includes("-");
      const flagUrl = getFlagUrl(code);
      // ESIMAccess prices are already in USD cents; the frontend divides by 100 to get dollars
      const priceInCents = Math.round((pkg.retailPrice ?? pkg.price) / 100);

      if (!destinationMap.has(code)) {
        destinationMap.set(code, {
          locationCode: code,
          locationName: resolveCountryName(pkg),
          flagUrl,
          lowestPrice: priceInCents,
          packageCount: 1,
          isRegion,
        });
      } else {
        const existing = destinationMap.get(code)!;
        existing.packageCount++;
        if (priceInCents < existing.lowestPrice) {
          existing.lowestPrice = priceInCents;
        }
      }
    }

    const destinations = Array.from(destinationMap.values()).sort((a, b) =>
      a.locationName.localeCompare(b.locationName)
    );

    res.json({ destinations });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch destinations");
    res.status(500).json({ error: "Failed to fetch destinations" });
  }
});

/**
 * Resolve the best human-readable country name for a package's locationCode.
 * For single-country packages the locationNetworkList has exactly one entry.
 * For regional packages we strip the data/duration suffix from the package name.
 */
function resolveCountryName(pkg: EsimPackage): string {
  const nets = pkg.locationNetworkList;

  // Exact single-country package → use the network entry name
  if (nets && nets.length === 1) {
    return nets[0].locationName;
  }

  // For multi-country packages, find the network entry whose code matches pkg.locationCode
  if (nets && nets.length > 1) {
    const match = nets.find((n) => n.locationCode === pkg.locationCode);
    if (match) return match.locationName;
  }

  // Strip numeric/data/duration tokens from the plan name
  const parts = pkg.name.split(" ").filter(
    (p) => !p.match(/^\d+$/) && !p.includes("GB") && !p.includes("MB") && !p.includes("Days") && !p.includes("Day"),
  );
  const stripped = parts.join(" ").trim();
  return stripped || pkg.locationCode;
}

export default router;

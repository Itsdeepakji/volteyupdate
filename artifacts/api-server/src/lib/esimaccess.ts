import crypto from "crypto";

const BASE_URL = process.env.ESIMACCESS_BASE_URL ?? "https://api.esimaccess.com";
const ACCESS_CODE = process.env.ESIMACCESS_ACCESS_CODE ?? "";
const SECRET_KEY = process.env.ESIMACCESS_SECRET_KEY ?? "";

function makeHeaders() {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(ACCESS_CODE + timestamp)
    .digest("hex");
  return {
    "Content-Type": "application/json",
    "RT-AccessCode": ACCESS_CODE,
    "RT-Timestamp": timestamp,
    "RT-Signature": signature,
  };
}

async function apiPost<T>(path: string, body: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: makeHeaders(),
    body: JSON.stringify(body),
  });
  const json = await res.json() as { success: boolean; errorCode: string | null; errorMsg: string | null; obj: T };
  if (!json.success) {
    throw new Error(`ESIMAccess error [${json.errorCode}]: ${json.errorMsg}`);
  }
  return json.obj;
}

export interface EsimPackage {
  packageCode: string;
  slug: string;
  name: string;
  price: number;
  retailPrice: number;
  currencyCode: string;
  volume: number;
  smsStatus: number;
  dataType: number;
  unusedValidTime: number;
  duration: number;
  durationUnit: string;
  location: string;
  locationCode: string;
  description: string;
  activeType: number;
  favorite: boolean;
  speed: string;
  ipExport: string;
  supportTopUpType: number;
  locationNetworkList: LocationNetwork[];
}

export interface LocationNetwork {
  locationName: string;
  locationLogo: string;
  locationCode: string;
  operatorList: Operator[];
}

export interface Operator {
  operatorName: string;
  networkType: string;
}

export interface EsimProfile {
  iccid: string;
  ac?: string;
  qrCodeUrl?: string;
  smdpAddress?: string;
  matchingId?: string;
}

export interface OrderResult {
  orderNo: string;
  transactionId: string;
  packageInfoList: Array<{
    packageCode: string;
    count: number;
    price: number;
    esimList: Array<{
      iccid: string;
      ac: string;
      qrCodeUrl?: string;
      smdpAddress?: string;
      matchingId?: string;
      apn?: string;
      expiredTime?: string;
    }>;
  }>;
}

/**
 * Shape returned by the /esim/query endpoint (different from /esim/order).
 * Profiles live in the top-level esimList; pager is required.
 */
export interface QueryResult {
  esimList: Array<{
    iccid: string;
    ac: string;
    qrCodeUrl?: string;
    smdpAddress?: string;
    matchingId?: string;
    orderNo?: string;
    apn?: string;
    expiredTime?: string;
  }>;
  pager: { pageSize: number; pageNum: number; total: number };
}

export async function listPackages(locationCode?: string): Promise<EsimPackage[]> {
  const body: Record<string, unknown> = {};
  if (locationCode) {
    body.locationCode = locationCode;
  }
  const result = await apiPost<{ packageList: EsimPackage[] }>("/api/v1/open/package/list", body);
  return result.packageList ?? [];
}

export async function createOrder(params: {
  packageCode: string;
  quantity: number;
  transactionId: string;
}): Promise<OrderResult> {
  return apiPost<OrderResult>("/api/v1/open/esim/order", {
    transactionId: params.transactionId,
    packageInfoList: [
      {
        packageCode: params.packageCode,
        count: params.quantity,
      },
    ],
  });
}

/**
 * Query profiles for an existing order.
 * NOTE: the /esim/query endpoint requires a `pager` param and returns
 * profiles in obj.esimList — completely different from /esim/order.
 */
export async function queryOrder(transactionId: string): Promise<QueryResult> {
  return apiPost<QueryResult>("/api/v1/open/esim/query", {
    transactionId,
    pager: { pageNum: 1, pageSize: 20 },
  });
}

export function getFlagUrl(locationCode: string): string {
  // Multi-country region codes like "EU-42", "NA-3", "AS-22" get a globe
  if (locationCode.includes("-") && /[A-Z]{2}-\d+/.test(locationCode)) {
    return `https://flagcdn.com/w160/un.png`;
  }
  // Take the first country code if comma-separated
  const firstCode = locationCode.split(",")[0].toLowerCase().trim();
  // Use flagcdn.com — w160 gives crisp display at all icon sizes (2× retina ready)
  return `https://flagcdn.com/w160/${firstCode}.png`;
}

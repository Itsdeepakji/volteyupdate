import { Router, type IRouter, type Request, type Response } from "express";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

export type DocType =
  | "national_id" | "passport" | "proof_of_address" | "drivers_license" | "other";

export type KycStatus = "pending" | "approved" | "rejected";

export interface KycSubmission {
  id:               string;
  customerName:     string;
  customerEmail:    string;
  documentType:     DocType;
  documentNumber:   string;
  documentImageUrl: string;
  backImageUrl:     string;
  selfieUrl:        string;
  status:           KycStatus;
  rejectionReason:  string;
  notes:            string;
  submittedAt:      string;
  reviewedAt:       string;
  reviewedBy:       string;
}

const DATA_DIR  = join(process.cwd(), "data");
const DATA_FILE = join(DATA_DIR, "kyc.json");

const SEED_DATA: KycSubmission[] = [
  {
    id: "kyc-001", customerName: "Simfinity Live", customerEmail: "simfinity@live.com",
    documentType: "national_id", documentNumber: "NID-2026-0081",
    documentImageUrl: "", backImageUrl: "", selfieUrl: "",
    status: "pending", rejectionReason: "", notes: "",
    submittedAt: "2026-05-14T10:22:00.000Z", reviewedAt: "", reviewedBy: "",
  },
  {
    id: "kyc-002", customerName: "Avinash Jha", customerEmail: "avinash.jha@email.com",
    documentType: "proof_of_address", documentNumber: "POA-2026-0042",
    documentImageUrl: "", backImageUrl: "", selfieUrl: "",
    status: "pending", rejectionReason: "", notes: "",
    submittedAt: "2026-05-10T08:55:00.000Z", reviewedAt: "", reviewedBy: "",
  },
  {
    id: "kyc-003", customerName: "Maria Santos", customerEmail: "maria.s@voltey.io",
    documentType: "passport", documentNumber: "PP-2026-0019",
    documentImageUrl: "", backImageUrl: "", selfieUrl: "",
    status: "approved", rejectionReason: "", notes: "Verified against government database.",
    submittedAt: "2026-05-08T14:00:00.000Z", reviewedAt: "2026-05-09T09:11:00.000Z", reviewedBy: "Admin",
  },
  {
    id: "kyc-004", customerName: "James Okonkwo", customerEmail: "james@okmail.ng",
    documentType: "drivers_license", documentNumber: "DL-2026-0033",
    documentImageUrl: "", backImageUrl: "", selfieUrl: "",
    status: "rejected", rejectionReason: "Document image is blurry and unreadable. Please re-upload a clear photo.",
    notes: "",
    submittedAt: "2026-05-06T11:30:00.000Z", reviewedAt: "2026-05-07T10:00:00.000Z", reviewedBy: "Admin",
  },
];

function loadKyc(): KycSubmission[] {
  try {
    if (!existsSync(DATA_FILE)) return [...SEED_DATA];
    return JSON.parse(readFileSync(DATA_FILE, "utf-8")) as KycSubmission[];
  } catch { return [...SEED_DATA]; }
}

function saveKyc(list: KycSubmission[]) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf-8");
}

function ensureSeeded() {
  if (!existsSync(DATA_FILE)) saveKyc([...SEED_DATA]);
}
ensureSeeded();

const router: IRouter = Router();

router.get("/admin/kyc/stats", (_req: Request, res: Response): void => {
  const list = loadKyc();
  res.json({
    total:    list.length,
    pending:  list.filter(k => k.status === "pending").length,
    approved: list.filter(k => k.status === "approved").length,
    rejected: list.filter(k => k.status === "rejected").length,
  });
});

router.get("/admin/kyc", (req: Request, res: Response): void => {
  let list = loadKyc();
  const { status, search } = req.query as { status?: string; search?: string };
  if (status && status !== "all")   list = list.filter(k => k.status === status);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(k => k.customerName.toLowerCase().includes(q) || k.customerEmail.toLowerCase().includes(q));
  }
  list = list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  res.json({ submissions: list });
});

router.get("/admin/kyc/:id", (req: Request, res: Response): void => {
  const item = loadKyc().find(k => k.id === req.params.id);
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  res.json(item);
});

router.post("/admin/kyc", (req: Request, res: Response): void => {
  const { customerName, customerEmail, documentType = "national_id", documentNumber = "",
          documentImageUrl = "", backImageUrl = "", selfieUrl = "", notes = "" } = req.body as Partial<KycSubmission>;
  if (!customerName || !customerEmail) {
    res.status(400).json({ error: "customerName and customerEmail are required" });
    return;
  }
  const list = loadKyc();
  const item: KycSubmission = {
    id: `kyc-${randomUUID().slice(0, 8)}`,
    customerName, customerEmail, documentType: documentType as DocType,
    documentNumber, documentImageUrl, backImageUrl, selfieUrl,
    status: "pending", rejectionReason: "", notes,
    submittedAt: new Date().toISOString(), reviewedAt: "", reviewedBy: "",
  };
  list.push(item);
  saveKyc(list);
  res.status(201).json(item);
});

router.patch("/admin/kyc/:id/approve", (req: Request, res: Response): void => {
  const list = loadKyc();
  const idx  = list.findIndex(k => k.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  list[idx].status      = "approved";
  list[idx].rejectionReason = "";
  list[idx].notes       = (req.body as { notes?: string } | undefined)?.notes ?? list[idx].notes;
  list[idx].reviewedAt  = new Date().toISOString();
  list[idx].reviewedBy  = "Admin";
  saveKyc(list);
  res.json(list[idx]);
});

router.patch("/admin/kyc/:id/reject", (req: Request, res: Response): void => {
  const list = loadKyc();
  const idx  = list.findIndex(k => k.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  const { reason = "Does not meet verification requirements.", notes = "" } = req.body as { reason?: string; notes?: string };
  list[idx].status          = "rejected";
  list[idx].rejectionReason = reason;
  list[idx].notes           = notes || list[idx].notes;
  list[idx].reviewedAt      = new Date().toISOString();
  list[idx].reviewedBy      = "Admin";
  saveKyc(list);
  res.json(list[idx]);
});

router.patch("/admin/kyc/:id/reset", (_req: Request, res: Response): void => {
  const list = loadKyc();
  const idx  = list.findIndex(k => k.id === _req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  list[idx].status          = "pending";
  list[idx].rejectionReason = "";
  list[idx].reviewedAt      = "";
  list[idx].reviewedBy      = "";
  saveKyc(list);
  res.json(list[idx]);
});

router.delete("/admin/kyc/:id", (req: Request, res: Response): void => {
  const list = loadKyc();
  const idx  = list.findIndex(k => k.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  list.splice(idx, 1);
  saveKyc(list);
  res.status(204).end();
});

export default router;

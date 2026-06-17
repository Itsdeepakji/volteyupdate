import { Router, type IRouter } from "express";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { db, ordersTable, customersTable } from "@workspace/db";
import { createOrder as createEsimOrder, queryOrder } from "../lib/esimaccess";
import { sendEsimConfirmationEmail } from "../lib/mailer";
import { CreateOrderBody, GetOrderParams } from "@workspace/api-zod";
import { getActiveGatewayConfig } from "./paymentGateways";
import Stripe from "stripe";

async function getStripeSecretKey(): Promise<string | null> {
  if (process.env.STRIPE_SECRET_KEY) return process.env.STRIPE_SECRET_KEY;
  const stored = await getActiveGatewayConfig("stripe");
  return stored?.secretKey ?? null;
}

const router: IRouter = Router();

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { packageCode, customerEmail, packageName, price, quantity = 1, paymentIntentId } = parsed.data;

  // Verify Stripe payment when a paymentIntentId is provided
  if (paymentIntentId) {
    const stripeKey = await getStripeSecretKey();
    if (!stripeKey) {
      res.status(500).json({ error: "Payment verification is unavailable" });
      return;
    }
    try {
      const stripe = new Stripe(stripeKey);
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (intent.status !== "succeeded") {
        res.status(402).json({ error: `Payment not completed (status: ${intent.status})` });
        return;
      }
    } catch (err) {
      req.log.error({ err }, "Failed to verify Stripe PaymentIntent");
      res.status(402).json({ error: "Could not verify payment" });
      return;
    }
  }
  const transactionId = uuidv4();

  // Save order as pending first
  await db.insert(ordersTable).values({
    transactionId,
    customerEmail,
    packageCode,
    packageName,
    price,
    quantity,
    status: "pending",
    esimProfiles: [],
    emailSent: "false",
  });

  try {
    // Create order with ESIMAccess
    const result = await createEsimOrder({ packageCode, quantity, transactionId });

    // Extract eSIM profiles from create response (may be empty — ESIMAccess sometimes
    // only populates them via the query endpoint after creation).
    let esimProfiles = result.packageInfoList?.flatMap((p) =>
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

    // If we got fewer profiles than ordered, query ESIMAccess to get all of them.
    // ESIMAccess sometimes only partially populates the create response.
    if (esimProfiles.length < quantity) {
      try {
        const queryResult = await queryOrder(transactionId);
        esimProfiles = (queryResult.esimList ?? []).map((e) => ({
          iccid: e.iccid,
          ac: e.ac,
          qrCodeUrl: e.qrCodeUrl,
          smdpAddress: e.smdpAddress,
          matchingId: e.matchingId,
          apn: e.apn,
          expiredTime: e.expiredTime,
        }));
      } catch (qErr) {
        req.log.warn({ qErr }, "Query for eSIM profiles after create returned nothing");
      }
    }

    // Update order in DB
    await db
      .update(ordersTable)
      .set({
        orderNo: result.orderNo,
        status: "completed",
        esimProfiles,
      })
      .where(eq(ordersTable.transactionId, transactionId));

    // Send confirmation email
    let emailSent = false;
    try {
      await sendEsimConfirmationEmail({
        to: customerEmail,
        packageName,
        transactionId,
        orderNo: result.orderNo,
        esimProfiles,
      });
      emailSent = true;
      await db
        .update(ordersTable)
        .set({ emailSent: "true" })
        .where(eq(ordersTable.transactionId, transactionId));
    } catch (emailErr) {
      req.log.error({ emailErr }, "Email failed but order succeeded");
    }

    // Auto-create customer record if none exists yet
    try {
      const existing = await db
        .select({ id: customersTable.id })
        .from(customersTable)
        .where(eq(customersTable.email, customerEmail))
        .limit(1);
      if (existing.length === 0) {
        const namePart = customerEmail.split("@")[0].replace(/[._+-]+/g, " ");
        const name = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        await db.insert(customersTable).values({ name, email: customerEmail });
      }
    } catch (custErr) {
      req.log.warn({ custErr }, "Auto-create customer record failed (non-fatal)");
    }

    res.json({
      transactionId,
      orderNo: result.orderNo,
      status: "completed",
      packageCode,
      packageName,
      esimProfiles,
      emailSent,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create ESIMAccess order");

    await db
      .update(ordersTable)
      .set({ status: "failed" })
      .where(eq(ordersTable.transactionId, transactionId));

    const message = err instanceof Error ? err.message : "Order creation failed";
    res.status(500).json({ error: message });
  }
});

router.get("/orders/:transactionId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.transactionId)
    ? req.params.transactionId[0]
    : req.params.transactionId;

  const params = GetOrderParams.safeParse({ transactionId: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { transactionId } = params.data;

  // Check local DB first
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.transactionId, transactionId))
    .limit(1);

  if (order) {
    let esimProfiles: typeof order.esimProfiles = order.esimProfiles ?? [];

    // If we have fewer profiles stored than were ordered (create response may only
    // return a partial list), re-fetch from ESIMAccess and persist.
    if (esimProfiles.length < (order.quantity ?? 1) && order.status === "completed") {
      try {
        const queryResult = await queryOrder(transactionId);
        const fetched = (queryResult.esimList ?? []).map((e) => ({
          iccid: e.iccid,
          ac: e.ac,
          qrCodeUrl: e.qrCodeUrl,
          smdpAddress: e.smdpAddress,
          matchingId: e.matchingId,
          apn: e.apn,
          expiredTime: e.expiredTime,
        }));
        if (fetched.length > 0) {
          esimProfiles = fetched;
          await db
            .update(ordersTable)
            .set({ esimProfiles: fetched })
            .where(eq(ordersTable.transactionId, transactionId));
        }
      } catch (qErr) {
        req.log.warn({ qErr }, "Could not fetch eSIM profiles from ESIMAccess");
      }
    }

    res.json({
      transactionId: order.transactionId,
      orderNo: order.orderNo ?? undefined,
      status: order.status,
      packageCode: order.packageCode,
      packageName: order.packageName,
      esimProfiles,
      emailSent: order.emailSent === "true",
    });
    return;
  }

  // Fallback: order not in DB — query ESIMAccess directly
  try {
    const queryResult = await queryOrder(transactionId);
    const esimProfiles = (queryResult.esimList ?? []).map((e) => ({
      iccid: e.iccid,
      ac: e.ac,
      qrCodeUrl: e.qrCodeUrl,
      smdpAddress: e.smdpAddress,
      matchingId: e.matchingId,
      apn: e.apn,
      expiredTime: e.expiredTime,
    }));

    res.json({
      transactionId,
      status: "completed",
      esimProfiles,
      emailSent: false,
    });
  } catch (err) {
    req.log.error({ err, transactionId }, "Order not found");
    res.status(404).json({ error: "Order not found" });
  }
});

/* ── GET /api/esim/:transactionId — public eSIM card lookup (QR short link) ── */
router.get("/esim/:transactionId", async (req, res): Promise<void> => {
  const { transactionId } = req.params;
  if (!transactionId) { res.status(400).json({ error: "Missing transactionId" }); return; }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.transactionId, transactionId))
    .limit(1);

  if (!order) { res.status(404).json({ error: "eSIM not found" }); return; }

  res.json({
    transactionId: order.transactionId,
    orderNo: order.orderNo ?? undefined,
    packageName: order.packageName,
    packageCode: order.packageCode,
    status: order.status,
    esimProfiles: order.esimProfiles ?? [],
    createdAt: order.createdAt,
  });
});

export default router;

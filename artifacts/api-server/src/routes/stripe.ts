import { Router, type IRouter } from "express";
import Stripe from "stripe";
import { getActiveGatewayConfig } from "./paymentGateways";

async function getStripeKeys(): Promise<{ secretKey: string; publishableKey: string }> {
  const envSecret      = process.env.STRIPE_SECRET_KEY;
  const envPublishable = process.env.STRIPE_PUBLISHABLE_KEY;

  if (envSecret && envPublishable) {
    return { secretKey: envSecret, publishableKey: envPublishable };
  }

  const stored = await getActiveGatewayConfig("stripe");
  if (stored?.secretKey && stored?.publishableKey) {
    return { secretKey: stored.secretKey, publishableKey: stored.publishableKey };
  }

  throw new Error("Stripe is not configured. Add your keys in Admin → Payment Gateways.");
}

async function getStripe(): Promise<Stripe> {
  const { secretKey } = await getStripeKeys();
  return new Stripe(secretKey);
}

const router: IRouter = Router();

router.get("/stripe/config", async (_req, res): Promise<void> => {
  try {
    const { publishableKey } = await getStripeKeys();
    res.json({ publishableKey });
  } catch {
    res.status(500).json({ error: "Stripe is not configured" });
  }
});

router.post("/stripe/create-payment-intent", async (req, res): Promise<void> => {
  const { amount, packageName, customerEmail } = req.body as {
    amount: unknown;
    packageName?: string;
    customerEmail?: string;
  };

  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 50) {
    res.status(400).json({ error: "amount must be a number ≥ 50 (cents)" });
    return;
  }

  try {
    const stripe = await getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: "usd",
      description: packageName ?? "Voltey eSIM",
      receipt_email: customerEmail,
      automatic_payment_methods: { enabled: true },
      metadata: {
        ...(packageName    ? { packageName }    : {}),
        ...(customerEmail  ? { customerEmail }  : {}),
      },
    });
    res.json({ clientSecret: intent.client_secret, paymentIntentId: intent.id });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;

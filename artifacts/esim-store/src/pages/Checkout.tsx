import { useParams, useLocation, useSearch } from "wouter";
import { useCreateOrder } from "@workspace/api-client-react";
import { useState, useEffect, useCallback } from "react";
import { formatData } from "@/lib/format-utils";
import { useCurrency } from "@/lib/currency-context";
import { Loader2, ChevronDown, Tag, Gift, Lock } from "lucide-react";
import * as z from "zod";
import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const emailSchema = z.string().email();

const DIAL_CODES = [
  { code: "+1",   flag: "🇺🇸", name: "United States" },
  { code: "+1",   flag: "🇨🇦", name: "Canada" },
  { code: "+44",  flag: "🇬🇧", name: "United Kingdom" },
  { code: "+61",  flag: "🇦🇺", name: "Australia" },
  { code: "+64",  flag: "🇳🇿", name: "New Zealand" },
  { code: "+353", flag: "🇮🇪", name: "Ireland" },
  { code: "+33",  flag: "🇫🇷", name: "France" },
  { code: "+49",  flag: "🇩🇪", name: "Germany" },
  { code: "+34",  flag: "🇪🇸", name: "Spain" },
  { code: "+39",  flag: "🇮🇹", name: "Italy" },
  { code: "+31",  flag: "🇳🇱", name: "Netherlands" },
  { code: "+32",  flag: "🇧🇪", name: "Belgium" },
  { code: "+41",  flag: "🇨🇭", name: "Switzerland" },
  { code: "+43",  flag: "🇦🇹", name: "Austria" },
  { code: "+46",  flag: "🇸🇪", name: "Sweden" },
  { code: "+47",  flag: "🇳🇴", name: "Norway" },
  { code: "+45",  flag: "🇩🇰", name: "Denmark" },
  { code: "+358", flag: "🇫🇮", name: "Finland" },
  { code: "+48",  flag: "🇵🇱", name: "Poland" },
  { code: "+351", flag: "🇵🇹", name: "Portugal" },
  { code: "+30",  flag: "🇬🇷", name: "Greece" },
  { code: "+420", flag: "🇨🇿", name: "Czech Republic" },
  { code: "+36",  flag: "🇭🇺", name: "Hungary" },
  { code: "+40",  flag: "🇷🇴", name: "Romania" },
  { code: "+90",  flag: "🇹🇷", name: "Turkey" },
  { code: "+972", flag: "🇮🇱", name: "Israel" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+20",  flag: "🇪🇬", name: "Egypt" },
  { code: "+27",  flag: "🇿🇦", name: "South Africa" },
  { code: "+91",  flag: "🇮🇳", name: "India" },
  { code: "+92",  flag: "🇵🇰", name: "Pakistan" },
  { code: "+86",  flag: "🇨🇳", name: "China" },
  { code: "+81",  flag: "🇯🇵", name: "Japan" },
  { code: "+82",  flag: "🇰🇷", name: "South Korea" },
  { code: "+65",  flag: "🇸🇬", name: "Singapore" },
  { code: "+60",  flag: "🇲🇾", name: "Malaysia" },
  { code: "+62",  flag: "🇮🇩", name: "Indonesia" },
  { code: "+66",  flag: "🇹🇭", name: "Thailand" },
  { code: "+55",  flag: "🇧🇷", name: "Brazil" },
  { code: "+52",  flag: "🇲🇽", name: "Mexico" },
];

const CARD_STYLE = {
  style: {
    base: {
      fontSize: "14px",
      fontFamily: "'Poppins', sans-serif",
      color: "#111827",
      "::placeholder": { color: "#9CA3AF" },
    },
    invalid: { color: "#EF4444" },
  },
};

const CARD_CONTAINER = "border border-gray-200 rounded-xl px-4 py-3 bg-[#fafafa] focus-within:border-gray-400 transition-colors";

/* ─────────────────────────────────────────────────
   Inner form — needs to live inside <Elements>
───────────────────────────────────────────────── */
interface CheckoutFormProps {
  pkg: Record<string, unknown>;
  quantity: number;
  totalPrice: number;
  locationCode?: string;
}

function CheckoutForm({ pkg, quantity, totalPrice, locationCode }: CheckoutFormProps) {
  const { fmt } = useCurrency();
  const stripe = useStripe();
  const elements = useElements();
  const createOrder = useCreateOrder();
  const [, setLocation] = useLocation();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phone, setPhone] = useState("");
  const [dialCode, setDialCode] = useState("+1");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "googlepay" | "paypal">("card");
  const [coupon, setCoupon] = useState("");
  const [showCoupon, setShowCoupon] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState("");

  const volteyCredits = Math.round(totalPrice * 0.03);
  const locationName: string = (pkg.locationName as string) ?? "Destination";
  const flagUrl: string | undefined = pkg.flagUrl as string | undefined;

  const durLabel = `${pkg.duration} ${
    (pkg.durationUnit as string) === "DAY"
      ? (pkg.duration as number) === 1 ? "day" : "days"
      : ((pkg.durationUnit as string) ?? "").toLowerCase()
  }`;

  const handlePay = useCallback(async () => {
    // 1. Validate email
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");

    if (!stripe || !elements) {
      setPayError("Payment not ready yet — please wait a moment.");
      return;
    }

    setProcessing(true);
    setPayError("");

    try {
      // 2. Create PaymentIntent on the server
      const piRes = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalPrice * quantity,
          packageName: pkg.name,
          customerEmail: email,
        }),
      });
      const piData: { clientSecret?: string; paymentIntentId?: string; error?: string } = await piRes.json();
      if (!piRes.ok || !piData.clientSecret) {
        throw new Error(piData.error ?? "Failed to initialise payment");
      }

      // 3. Confirm card payment via Stripe.js
      const cardElement = elements.getElement(CardNumberElement);
      if (!cardElement) throw new Error("Card form not ready");

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        piData.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: { email },
          },
        }
      );

      if (stripeError) throw new Error(stripeError.message ?? "Card payment failed");
      if (paymentIntent?.status !== "succeeded") throw new Error("Payment did not complete");

      // 4. Create the eSIM order (backend verifies PI before calling ESIMAccess)
      createOrder.mutate(
        {
          data: {
            packageCode: pkg.packageCode as string,
            customerEmail: email,
            packageName: pkg.name as string,
            price: totalPrice,
            quantity,
            paymentIntentId: paymentIntent.id,
          },
        },
        {
          onSuccess: (result) => {
            setLocation(`/order/${result.transactionId}`, {
              state: { package: pkg },
            });
          },
          onError: (err: Error) => {
            setPayError(err.message ?? "Order creation failed — please contact support.");
            setProcessing(false);
          },
        }
      );
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Payment failed");
      setProcessing(false);
    }
  }, [stripe, elements, email, totalPrice, quantity, pkg, createOrder, setLocation]);

  const isLoading = processing || createOrder.isPending;

  // Use the locationCode from history state; fall back to the one on the pkg itself
  // (every EsimPackage has a locationCode property), then to the global destinations page.
  const resolvedBack = locationCode ?? (pkg as any)?.locationCode;
  const backHref = resolvedBack ? `/destination/${resolvedBack}` : "/destinations";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f2f2f7", fontFamily: "'Poppins', sans-serif" }}>
      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-10">
        <button
          onClick={() => setLocation(backHref)}
          className="flex items-center gap-1.5 mb-6 text-[13px] font-medium text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back to plans
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5 items-start">

          {/* ══════════════════════ LEFT ══════════════════════ */}
          <div className="space-y-4">

            {/* Sign up / log in card */}
            <div className="bg-white rounded-2xl p-4 sm:p-7" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <h2 className="text-[20px] font-semibold text-gray-900 mb-5">Sign up or log in</h2>

              <div className="flex gap-3 mb-5">
                <button className="flex-1 flex items-center justify-center gap-2.5 py-2.5 rounded-full border border-gray-200 text-[14px] font-medium text-gray-800 hover:bg-gray-50 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button className="flex-1 flex items-center justify-center gap-2.5 py-2.5 rounded-full border border-gray-200 text-[14px] font-medium text-gray-800 hover:bg-gray-50 transition-colors">
                  <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
                    <path d="M13.104 9.58c-.02-2.135 1.744-3.166 1.824-3.217-1-1.455-2.548-1.655-3.094-1.672-1.315-.134-2.572.778-3.239.778-.667 0-1.692-.76-2.784-.739-1.427.022-2.748.836-3.482 2.118C.55 9.23 1.626 13.638 3.4 16.067c.87 1.248 1.907 2.65 3.272 2.6 1.318-.053 1.816-.848 3.41-.848 1.594 0 2.045.848 3.437.818 1.417-.022 2.316-1.271 3.176-2.524.996-1.447 1.41-2.854 1.431-2.928-.031-.013-2.751-1.055-2.777-4.174z" fill="#1a1a1a"/>
                    <path d="M10.83 2.44c.71-.874 1.19-2.078 1.058-3.285-1.023.043-2.27.688-3.007 1.544-.65.754-1.225 1.981-1.075 3.145 1.146.088 2.31-.584 3.024-1.404z" fill="#1a1a1a"/>
                  </svg>
                  Apple
                </button>
              </div>

              <p className="text-[12px] text-gray-400 leading-relaxed mb-5">
                We'll occasionally send you news about special offers – you can opt out anytime via your account in the Voltey app.
              </p>

              {/* Email */}
              <div className="mb-3">
                <label className="block text-[13px] text-gray-500 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                  placeholder="name@example.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[14px] text-gray-900 outline-none focus:border-gray-400 transition-colors"
                  style={{ background: "#fafafa" }}
                />
                {emailError && <p className="text-[12px] text-red-500 mt-1">{emailError}</p>}
                <p className="text-[11px] text-gray-400 mt-1.5">Your eSIM QR code will be sent to this email.</p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[13px] text-gray-500 mb-1.5">Phone number</label>
                <div className="flex gap-2">
                  <div className="relative shrink-0">
                    <select
                      value={dialCode}
                      onChange={(e) => setDialCode(e.target.value)}
                      className="appearance-none border border-gray-200 rounded-xl pl-3 pr-7 py-3 text-[14px] text-gray-700 outline-none focus:border-gray-400 transition-colors cursor-pointer"
                      style={{ background: "#fafafa", minWidth: 90 }}
                    >
                      {DIAL_CODES.map((d, i) => (
                        <option key={`${d.code}-${i}`} value={d.code}>
                          {d.flag} {d.code}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-[14px] text-gray-900 outline-none focus:border-gray-400 transition-colors"
                    style={{ background: "#fafafa" }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">Optional — for order updates via SMS.</p>
              </div>
            </div>

            {/* Payment method card */}
            <div className="bg-white rounded-2xl p-4 sm:p-7" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <h2 className="text-[20px] font-semibold text-gray-900 mb-5">Select a payment method</h2>

              <div className="space-y-2.5">
                {/* Credit/debit card */}
                <div>
                  <button
                    onClick={() => setPaymentMethod("card")}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-colors"
                    style={{ borderColor: paymentMethod === "card" ? "#111" : "#e5e7eb", background: "#fff" }}
                  >
                    <span className="text-[14px] font-medium text-gray-900">Credit or debit card</span>
                    <div className="flex items-center gap-2">
                      <span className="flex gap-1.5 items-center">
                        <span className="inline-flex items-center justify-center rounded" style={{ width: 32, height: 20, background: "#1A1F71" }}>
                          <span className="text-white font-bold" style={{ fontSize: 9, letterSpacing: "0.02em" }}>VISA</span>
                        </span>
                        <span className="inline-flex items-center justify-center rounded" style={{ width: 32, height: 20, background: "#fff", border: "1px solid #e5e7eb" }}>
                          <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#EB001B", marginRight: -4 }} />
                          <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#F79E1B", opacity: 0.9 }} />
                        </span>
                        <span className="inline-flex items-center justify-center rounded" style={{ width: 32, height: 20, background: "#2E77BC" }}>
                          <span className="text-white font-bold" style={{ fontSize: 7, letterSpacing: "0.02em" }}>AMEX</span>
                        </span>
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${paymentMethod === "card" ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {paymentMethod === "card" && (
                    <div className="mt-2.5 space-y-2.5 px-1">
                      {/* Stripe Card Number Element */}
                      <div className={CARD_CONTAINER}>
                        <CardNumberElement options={{ ...CARD_STYLE, placeholder: "Card number" }} />
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className={CARD_CONTAINER}>
                          <CardExpiryElement options={CARD_STYLE} />
                        </div>
                        <div className={CARD_CONTAINER}>
                          <CardCvcElement options={CARD_STYLE} />
                        </div>
                      </div>
                      <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
                        <Lock className="w-3 h-3 shrink-0" />
                        Secured by Stripe — your card details are never stored on our servers.
                      </p>
                    </div>
                  )}
                </div>

                {/* Google Pay */}
                <button
                  onClick={() => setPaymentMethod("googlepay")}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-colors opacity-50 cursor-not-allowed"
                  style={{ borderColor: "#e5e7eb" }}
                  disabled
                  title="Coming soon"
                >
                  <span className="text-[14px] font-medium text-gray-900">Google Pay</span>
                  <span className="text-[11px] text-gray-400 font-medium">Coming soon</span>
                </button>

                {/* PayPal */}
                <button
                  onClick={() => setPaymentMethod("paypal")}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-colors opacity-50 cursor-not-allowed"
                  style={{ borderColor: "#e5e7eb" }}
                  disabled
                  title="Coming soon"
                >
                  <span className="text-[14px] font-medium text-gray-900">PayPal</span>
                  <span className="text-[11px] text-gray-400 font-medium">Coming soon</span>
                </button>
              </div>

              {/* Payment error */}
              {payError && (
                <div className="mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-[13px] text-red-700">
                  {payError}
                </div>
              )}

              {/* Pay button */}
              <button
                onClick={handlePay}
                disabled={isLoading || !stripe}
                className="mt-6 w-full flex items-center justify-center gap-2 py-4 rounded-full text-[15px] font-semibold transition-opacity disabled:opacity-60"
                style={{ background: "#f5e642", color: "#111" }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {processing ? "Processing payment…" : "Creating order…"}
                  </>
                ) : (
                  `Pay ${fmt(totalPrice * quantity)}`
                )}
              </button>
            </div>
          </div>

          {/* ══════════════════════ RIGHT ══════════════════════ */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 sm:p-7" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <h2 className="text-[20px] font-semibold text-gray-900 mb-5">Order summary</h2>

              <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 mb-5" style={{ background: "#f5f5f5" }}>
                {flagUrl && (
                  <img src={flagUrl} alt={locationName} className="w-[32px] h-[21px] rounded-[3px] object-cover shrink-0" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }} />
                )}
                <span className="text-[14px] font-medium text-gray-900">{locationName}</span>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-gray-400">Plan</span>
                  <span className="text-[13px] font-medium text-gray-900">
                    {formatData(pkg.volume as number, pkg.dataType as number)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-gray-400">Type</span>
                  <span className="text-[13px] font-medium text-gray-900">Data only</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-gray-400">Duration</span>
                  <span className="text-[13px] font-medium text-gray-900">{durLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-gray-400">Speed</span>
                  <span className="text-[13px] font-medium text-gray-900">{(pkg.speed as string) ?? "4G/LTE"}</span>
                </div>
                {quantity > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-gray-400">Quantity</span>
                    <span className="text-[13px] font-medium text-gray-900">× {quantity}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px] font-semibold text-gray-900">Total</span>
                  <span className="text-[16px] font-bold text-gray-900">
                    {fmt(totalPrice * quantity)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-gray-400">Voltey credits</span>
                  <span
                    className="flex items-center gap-1.5 text-[12px] font-medium rounded-full px-2.5 py-0.5"
                    style={{ background: "#fef3c7", color: "#92400e" }}
                  >
                    <Gift className="w-3 h-3" />
                    +{fmt(volteyCredits)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2.5 mb-5">
                <button
                  onClick={() => setShowCoupon(!showCoupon)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full border border-gray-200 text-[12px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Tag className="w-3.5 h-3.5" />
                  Got a coupon?
                </button>
                <button
                  onClick={() => setShowCredits(!showCredits)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full border border-gray-200 text-[12px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Gift className="w-3.5 h-3.5" />
                  Got Voltey credits?
                </button>
              </div>

              {showCoupon && (
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="Enter coupon code"
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-gray-400 transition-colors"
                    style={{ background: "#fafafa" }}
                  />
                  <button className="px-4 py-2.5 rounded-xl text-[13px] font-medium text-white" style={{ background: "#111" }}>
                    Apply
                  </button>
                </div>
              )}

              <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                By completing this purchase you agree to our{" "}
                <a href="#" className="underline">Terms of Service</a> and{" "}
                <a href="#" className="underline">Privacy Policy</a>.
              </p>
            </div>

            {/* Trust badges */}
            <div className="bg-white rounded-2xl px-4 py-4 sm:px-7 sm:py-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div className="flex items-center gap-2 text-[12px] text-gray-500 mb-3">
                <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="font-medium text-gray-700">Secure checkout</span>
              </div>
              <div className="space-y-2">
                {[
                  "256-bit SSL encryption",
                  "PCI DSS compliant payments via Stripe",
                  "Instant eSIM delivery by email",
                  "30-day money-back guarantee",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-[12px] text-gray-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Root — loads Stripe publishable key then wraps
   the form with the Elements provider
───────────────────────────────────────────────── */
export default function Checkout() {
  const { packageCode } = useParams<{ packageCode: string }>();
  const [, setLocation] = useLocation();
  const search = useSearch();

  // locationCode: prefer URL ?from=XX param (always reliable) then history state
  const urlFrom = new URLSearchParams(search).get("from") ?? undefined;
  const pkg = window.history.state?.package;
  const quantity: number = window.history.state?.quantity ?? 1;
  const locationCode: string | undefined = urlFrom ?? window.history.state?.locationCode ?? (pkg as any)?.locationCode;

  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [stripeError, setStripeError] = useState("");

  useEffect(() => {
    if (!pkg) { setLocation(locationCode ? `/destination/${locationCode}` : "/destinations"); return; }

    fetch("/api/stripe/config")
      .then((r) => r.json())
      .then(({ publishableKey }: { publishableKey?: string }) => {
        if (!publishableKey) { setStripeError("Payment system unavailable"); return; }
        setStripePromise(loadStripe(publishableKey));
      })
      .catch(() => setStripeError("Could not load payment system"));
  }, [pkg, setLocation]);

  if (!pkg) return null;

  const totalPrice = (pkg.retailPrice ?? pkg.price) as number;

  if (stripeError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f2f2f7" }}>
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm">
          <p className="text-gray-500 text-[14px]">{stripeError}</p>
        </div>
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f2f2f7" }}>
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm pkg={pkg} quantity={quantity} totalPrice={totalPrice} locationCode={locationCode} />
    </Elements>
  );
}

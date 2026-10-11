"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Crown, Loader2, ShieldCheck } from "lucide-react";

type Entitlement = {
  plan: "free" | "premium";
  premiumExpiresAt: string | null;
};

type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void };
  theme?: { color: string };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, callback: (response: unknown) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export default function PremiumCheckout() {
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refreshEntitlement() {
    const response = await fetch("/api/account/entitlement", {
      cache: "no-store",
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Unable to load Premium status.");
    }

    setEntitlement({
      plan: data.plan,
      premiumExpiresAt: data.premiumExpiresAt ?? null,
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/account/entitlement", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load Premium status.");
        }

        if (!cancelled) {
          setEntitlement({
            plan: data.plan,
            premiumExpiresAt: data.premiumExpiresAt ?? null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load Premium status."
          );
        }
      } finally {
        if (!cancelled) setLoadingStatus(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUpgrade() {
    setPaying(true);
    setError("");
    setMessage("");

    try {
      // Load Razorpay Checkout only when the user chooses to pay.
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const existing = document.querySelector<HTMLScriptElement>(
            'script[data-elevai-razorpay="true"]'
          );

          if (existing) {
            existing.addEventListener("load", () => resolve(), { once: true });
            existing.addEventListener(
              "error",
              () => reject(new Error("Unable to load Razorpay Checkout.")),
              { once: true }
            );
            return;
          }

          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          script.dataset.elevaiRazorpay = "true";
          script.onload = () => resolve();
          script.onerror = () =>
            reject(new Error("Unable to load Razorpay Checkout."));
          document.body.appendChild(script);
        });
      }

      if (!window.Razorpay) {
        throw new Error("Razorpay Checkout did not load. Please try again.");
      }

      const orderResponse = await fetch("/api/payments/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.message || "Unable to create payment order.");
      }

      const checkout = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ElevAI",
        description: "Premium access for 30 days",
        order_id: orderData.orderId,
        theme: { color: "#6366f1" },
        handler: async (payment) => {
          try {
            const verifyResponse = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payment),
            });
            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(
                verifyData.message || "Payment verification failed."
              );
            }

            await refreshEntitlement();
            setMessage("Payment verified. Premium access is active for 30 days.");
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : "Payment verification failed. Please contact support if you were charged."
            );
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      });

      checkout.on("payment.failed", (response) => {
        const details = response as {
          error?: { description?: string };
        };
        setError(
          details.error?.description || "Payment failed. Please try again."
        );
        setPaying(false);
      });

      checkout.open();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to start checkout."
      );
      setPaying(false);
    }
  }

  return (
    <section className="rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/[0.10] to-white/[0.02] p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15">
            <Crown className="h-6 w-6 text-indigo-300" />
          </div>
          <div>
            <p className="text-sm font-medium text-indigo-300">ElevAI Membership</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Premium</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              More AI-assisted resume analysis, career insights, job matching,
              cover letters and interview preparation.
            </p>
          </div>
        </div>

        <div className="sm:text-right">
          <p className="text-3xl font-semibold text-white">₹149</p>
          <p className="mt-1 text-xs text-slate-400">One-time payment · 30 days</p>
        </div>
      </div>

      {loadingStatus ? (
        <div className="mt-5 flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking your plan...
        </div>
      ) : entitlement?.plan === "premium" ? (
        <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-300">
            <CheckCircle2 className="h-4 w-4" /> Premium is active
          </p>
          {entitlement.premiumExpiresAt && (
            <p className="mt-1 text-sm text-slate-400">
              Expires{" "}
              {new Date(entitlement.premiumExpiresAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          )}
          <p className="mt-2 text-xs text-slate-500">
            You can purchase another 30 days to extend your access.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleUpgrade}
          disabled={paying || loadingStatus}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {paying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          {paying ? "Processing..." : "Upgrade to Premium"}
        </button>
      )}

      {message && (
        <p role="status" className="mt-4 text-sm text-emerald-300">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-300">
          {error}
        </p>
      )}

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Secure checkout by Razorpay. Premium activates only after server-side
        payment verification.
      </p>
    </section>
  );
}
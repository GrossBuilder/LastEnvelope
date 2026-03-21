import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(key, { typescript: true });
  }
  return _stripe;
}

/** @deprecated Use getStripe() instead — kept for backward compatibility */
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const PLANS = {
  PRO: {
    name: "Pro",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!,
    price: 4.99,
    vaultLimit: Infinity,
    beneficiaryLimit: 10,
  },
  PRO_PLUS: {
    name: "Pro+",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PLUS_PRICE_ID!,
    price: 9.99,
    vaultLimit: Infinity,
    beneficiaryLimit: Infinity,
  },
} as const;

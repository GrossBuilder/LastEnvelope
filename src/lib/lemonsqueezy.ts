import { logger } from "@/lib/logger";
import crypto from "crypto";

// ─── Configuration ──────────────────────────────────────────────────────────

const LS_API_BASE = "https://api.lemonsqueezy.com/v1";

function getApiKey(): string {
  const key = process.env.LEMONSQUEEZY_API_KEY;
  if (!key || key === "your_lemonsqueezy_api_key") {
    throw new Error("LEMONSQUEEZY_API_KEY is not configured");
  }
  return key;
}

function getStoreId(): string {
  const id = process.env.LEMONSQUEEZY_STORE_ID;
  if (!id || id === "your_store_id") {
    throw new Error("LEMONSQUEEZY_STORE_ID is not configured");
  }
  return id;
}

export function isLemonSqueezyConfigured(): boolean {
  const key = process.env.LEMONSQUEEZY_API_KEY;
  const store = process.env.LEMONSQUEEZY_STORE_ID;
  return (
    !!key &&
    key !== "your_lemonsqueezy_api_key" &&
    !!store &&
    store !== "your_store_id"
  );
}

// ─── Plans ──────────────────────────────────────────────────────────────────

export const LS_PLANS = {
  PRO: {
    name: "Pro",
    variantId: process.env.LEMONSQUEEZY_PRO_VARIANT_ID || "",
    price: 4.99,
    yearlyVariantId: process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID || "",
    yearlyPrice: 49,
  },
  PRO_PLUS: {
    name: "Pro+",
    variantId: process.env.LEMONSQUEEZY_PRO_PLUS_VARIANT_ID || "",
    price: 9.99,
    yearlyVariantId: process.env.LEMONSQUEEZY_PRO_PLUS_YEARLY_VARIANT_ID || "",
    yearlyPrice: 99,
  },
} as const;

export type LSPlanType = keyof typeof LS_PLANS;

// ─── API Helpers ────────────────────────────────────────────────────────────

async function lsApiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const apiKey = getApiKey();
  const res = await fetch(`${LS_API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
      ...options.headers,
    },
  });
  return res;
}

// ─── Checkout ───────────────────────────────────────────────────────────────

interface CreateCheckoutOptions {
  variantId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  redirectUrl: string;
  cancelUrl?: string;
  plan: string;
}

export async function createCheckout(
  opts: CreateCheckoutOptions
): Promise<string> {
  const storeId = getStoreId();

  const body = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_options: {
          button_color: "#10b981",
        },
        checkout_data: {
          email: opts.userEmail,
          name: opts.userName || undefined,
          custom: {
            user_id: opts.userId,
            plan: opts.plan,
          },
        },
        product_options: {
          redirect_url: opts.redirectUrl,
        },
      },
      relationships: {
        store: {
          data: { type: "stores", id: storeId },
        },
        variant: {
          data: { type: "variants", id: opts.variantId },
        },
      },
    },
  };

  const res = await lsApiFetch("/checkouts", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    logger.error({ status: res.status, body: err }, "LemonSqueezy checkout failed");
    throw new Error("Failed to create checkout");
  }

  const data = await res.json();
  return data.data.attributes.url;
}

// ─── Subscription Management ────────────────────────────────────────────────

export async function getSubscription(subscriptionId: string) {
  const res = await lsApiFetch(`/subscriptions/${subscriptionId}`);
  if (!res.ok) {
    throw new Error("Failed to get subscription");
  }
  const data = await res.json();
  return data.data;
}

export async function cancelSubscription(subscriptionId: string) {
  const res = await lsApiFetch(`/subscriptions/${subscriptionId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to cancel subscription");
  }
  return true;
}

export async function getCustomerPortalUrl(
  customerId: string
): Promise<string> {
  const res = await lsApiFetch(`/customers/${customerId}`);
  if (!res.ok) {
    throw new Error("Failed to get customer");
  }
  const data = await res.json();
  return data.data.attributes.urls.customer_portal;
}

// ─── Webhook Verification ───────────────────────────────────────────────────

export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    logger.error("LEMONSQUEEZY_WEBHOOK_SECRET is not configured");
    return false;
  }

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(hmac, "hex"),
    Buffer.from(signature, "hex")
  );
}

// ─── Webhook Event Types ────────────────────────────────────────────────────

export interface LSWebhookEvent {
  meta: {
    event_name: string;
    custom_data?: {
      user_id?: string;
      plan?: string;
    };
  };
  data: {
    id: string;
    type: string;
    attributes: {
      store_id: number;
      customer_id: number;
      order_id: number;
      product_id: number;
      variant_id: number;
      status: string;
      renews_at: string | null;
      ends_at: string | null;
      created_at: string;
      updated_at: string;
      urls: {
        customer_portal: string;
        update_payment_method: string;
      };
      [key: string]: unknown;
    };
  };
}

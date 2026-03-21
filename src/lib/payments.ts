// USDT Payment Configuration
// Supports TRC-20 now, easily extendable to ERC-20/BEP-20 and traditional payments later

export const USDT_PLANS = {
  PRO: {
    name: "Pro",
    priceUsdt: parseFloat(process.env.USDT_PRO_PRICE || "4.99"),
    periodDays: 30,
    vaultLimit: Infinity,
    beneficiaryLimit: 10,
    fileLimit: 50,
    maxFileSize: 100 * 1024 * 1024,
    storageLimitMb: 500,
  },
  PRO_PLUS: {
    name: "Pro+",
    priceUsdt: parseFloat(process.env.USDT_PRO_PLUS_PRICE || "9.99"),
    periodDays: 30,
    vaultLimit: Infinity,
    beneficiaryLimit: Infinity,
    fileLimit: Infinity,
    maxFileSize: 100 * 1024 * 1024,
    storageLimitMb: 2048,
  },
} as const;

export const SUPPORTED_NETWORKS = {
  TRC20: {
    name: "Tron (TRC-20)",
    wallet: process.env.USDT_WALLET_TRC20 || "",
    confirmations: 20,
    explorerUrl: "https://tronscan.org/#/transaction/",
    apiBaseUrl: "https://api.trongrid.io",
  },
  // Future: add ERC20, BEP20
} as const;

export type NetworkType = keyof typeof SUPPORTED_NETWORKS;
export type PlanType = keyof typeof USDT_PLANS;

export const PAYMENT_WINDOW_MINUTES = 60; // 1 hour to complete payment

export function getWalletAddress(network: NetworkType): string {
  return SUPPORTED_NETWORKS[network].wallet;
}

export function getPlanPrice(plan: PlanType): number {
  return USDT_PLANS[plan].priceUsdt;
}

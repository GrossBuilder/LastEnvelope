// TronGrid API integration for verifying USDT TRC-20 transactions
// Uses the TRC-20 transfer history API for reliable verification

import { SUPPORTED_NETWORKS } from "./payments";
import { createHash } from "crypto";

// ─── Base58 ↔ Hex address conversion ────────────────────

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Decode(str: string): Buffer {
  const FIFTY_EIGHT = BigInt(58);
  let num = BigInt(0);
  for (const char of str) {
    const idx = BASE58_ALPHABET.indexOf(char);
    if (idx === -1) throw new Error(`Invalid base58 character: ${char}`);
    num = num * FIFTY_EIGHT + BigInt(idx);
  }
  const hex = num.toString(16).padStart(50, "0"); // 25 bytes = 50 hex
  return Buffer.from(hex, "hex");
}

function base58Encode(buf: Buffer): string {
  const FIFTY_EIGHT = BigInt(58);
  const ZERO = BigInt(0);
  let num = BigInt("0x" + buf.toString("hex"));
  let result = "";
  while (num > ZERO) {
    const remainder = Number(num % FIFTY_EIGHT);
    num = num / FIFTY_EIGHT;
    result = BASE58_ALPHABET[remainder] + result;
  }
  // Leading zeros
  for (const byte of buf) {
    if (byte === 0) result = "1" + result;
    else break;
  }
  return result;
}

/** Convert Tron base58check address (T...) → hex (41...) */
export function base58ToHex(addr: string): string {
  const decoded = base58Decode(addr);
  // First 21 bytes = address (0x41 prefix + 20-byte hash), last 4 = checksum
  return decoded.subarray(0, 21).toString("hex");
}

/** Convert Tron hex address (41...) → base58check (T...) */
export function hexToBase58(hex: string): string {
  const addrBytes = Buffer.from(hex.replace(/^0x/, ""), "hex");
  // Double SHA-256 for checksum
  const hash1 = createHash("sha256").update(addrBytes).digest();
  const hash2 = createHash("sha256").update(hash1).digest();
  const checksum = hash2.subarray(0, 4);
  return base58Encode(Buffer.concat([addrBytes, checksum]));
}

// ─── USDT Contract ──────────────────────────────────────

// USDT TRC-20 contract address on Tron mainnet (both formats for matching)
const USDT_CONTRACT_BASE58 = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const USDT_CONTRACT_HEX = "a614f803b6fd780986a42c78ec9c7f77e6ded13c"; // without 41 prefix

const MIN_CONFIRMATIONS = 20;

export interface VerificationResult {
  valid: boolean;
  error?: string;
  amount?: number;
  from?: string;
  to?: string;
  timestamp?: number;
  confirmations?: number;
}

function getTronHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const apiKey = process.env.TRONGRID_API_KEY;
  if (apiKey) {
    headers["TRON-PRO-API-KEY"] = apiKey;
  }
  return headers;
}

/**
 * Verify a USDT TRC-20 transaction via TronGrid API.
 * 
 * Checks:
 * 1. Transaction exists and has SUCCESS status
 * 2. Contains a Transfer event from the official USDT contract
 * 3. Recipient matches our wallet (hex ↔ base58 safe comparison)
 * 4. Amount ≥ expected
 * 5. Has enough confirmations (≥ 20)
 * 6. Transaction is not older than 24 hours (anti-replay)
 */
export async function verifyTRC20Transaction(
  txHash: string,
  expectedWallet: string,
  expectedAmountUsdt: number
): Promise<VerificationResult> {
  const baseUrl = SUPPORTED_NETWORKS.TRC20.apiBaseUrl;
  const headers = getTronHeaders();

  try {
    // ── 1. Fetch transaction and verify SUCCESS ──

    const txRes = await fetch(
      `${baseUrl}/v1/transactions/${encodeURIComponent(txHash)}`,
      { headers, signal: AbortSignal.timeout(15000) }
    );

    if (!txRes.ok) {
      return { valid: false, error: "Transaction not found on blockchain" };
    }

    const txData = await txRes.json();

    if (!txData.data || txData.data.length === 0) {
      return { valid: false, error: "Transaction not found" };
    }

    const tx = txData.data[0];

    if (!tx.ret?.[0] || tx.ret[0].contractRet !== "SUCCESS") {
      return { valid: false, error: "Transaction failed or reverted on chain" };
    }

    // ── 2. Anti-replay: reject transactions older than 24h ──

    const txTimestamp = tx.block_timestamp;
    const ageMs = Date.now() - txTimestamp;
    if (ageMs > 24 * 60 * 60 * 1000) {
      return {
        valid: false,
        error: "Transaction is older than 24 hours — possible replay attempt",
      };
    }

    // ── 3. Fetch Transfer events ──

    const eventsRes = await fetch(
      `${baseUrl}/v1/transactions/${encodeURIComponent(txHash)}/events`,
      { headers, signal: AbortSignal.timeout(15000) }
    );

    if (!eventsRes.ok) {
      return { valid: false, error: "Could not retrieve transfer events" };
    }

    const eventsData = await eventsRes.json();
    const events = eventsData.data || [];

    // Find Transfer event from the official USDT contract
    const usdtTransfer = events.find(
      (e: { contract_address: string; event_name: string }) =>
        e.contract_address === USDT_CONTRACT_BASE58 &&
        e.event_name === "Transfer"
    );

    if (!usdtTransfer) {
      return {
        valid: false,
        error: "No USDT transfer from the official contract found in this transaction",
      };
    }

    // ── 4. Parse amount and addresses ──

    const rawTo: string | undefined =
      usdtTransfer.result?.to || usdtTransfer.result?._to;
    const rawFrom: string | undefined =
      usdtTransfer.result?.from || usdtTransfer.result?._from;
    const rawValue: string | undefined =
      usdtTransfer.result?.value || usdtTransfer.result?._value;

    if (!rawTo || !rawValue) {
      return { valid: false, error: "Could not parse transfer data from event" };
    }

    const receivedAmount = Number(BigInt(rawValue)) / 1e6; // USDT has 6 decimals

    // ── 5. Verify recipient matches our wallet ──
    // TronGrid events return hex addresses (without 41 prefix).
    // Our wallet in .env is base58 (T...).
    // Convert expected wallet base58 → hex for comparison.

    let expectedHex: string;
    try {
      // base58ToHex returns "41..." — strip the 41 prefix for event comparison
      expectedHex = base58ToHex(expectedWallet).slice(2).toLowerCase();
    } catch {
      return { valid: false, error: "Invalid wallet address configuration" };
    }

    const receivedTo = rawTo.toLowerCase();

    if (receivedTo !== expectedHex) {
      return {
        valid: false,
        error: "Payment was sent to a different wallet address",
        to: receivedTo,
      };
    }

    // ── 6. Verify amount ──

    if (receivedAmount < expectedAmountUsdt) {
      return {
        valid: false,
        error: `Insufficient amount: received ${receivedAmount} USDT, expected ${expectedAmountUsdt} USDT`,
        amount: receivedAmount,
      };
    }

    // ── 7. Check confirmations ──

    const blockRes = await fetch(
      `${baseUrl}/wallet/getnowblock`,
      { headers, signal: AbortSignal.timeout(10000) }
    );
    const blockData = await blockRes.json();
    const currentBlock: number =
      blockData?.block_header?.raw_data?.number || 0;

    // Get TX block number from transaction info
    const txInfoRes = await fetch(
      `${baseUrl}/wallet/gettransactioninfobyid`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ value: txHash }),
        signal: AbortSignal.timeout(10000),
      }
    );
    const txInfo = await txInfoRes.json();
    const txBlockNum: number = txInfo?.blockNumber || 0;

    const confirmations =
      currentBlock && txBlockNum ? currentBlock - txBlockNum : 0;

    if (confirmations < MIN_CONFIRMATIONS) {
      return {
        valid: false,
        error: `Not enough confirmations: ${confirmations}/${MIN_CONFIRMATIONS}. Try again shortly.`,
        amount: receivedAmount,
        confirmations,
      };
    }

    // ── 8. All checks passed ──

    // Convert from hex to base58 for human-readable response
    const fromBase58 = rawFrom
      ? hexToBase58("41" + rawFrom.toLowerCase())
      : "unknown";
    const toBase58 = hexToBase58("41" + receivedTo);

    return {
      valid: true,
      amount: receivedAmount,
      from: fromBase58,
      to: toBase58,
      timestamp: txTimestamp,
      confirmations,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { valid: false, error: "TronGrid API timeout — try again later" };
    }
    return {
      valid: false,
      error: `Verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

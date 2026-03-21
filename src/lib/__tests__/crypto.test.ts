import { describe, it, expect } from "vitest";
import { deriveKey, encrypt, decrypt } from "@/lib/crypto";

describe("crypto", () => {
  it("deriveKey returns a CryptoKey", async () => {
    const key = await deriveKey("testpassword", "user123");
    expect(key).toBeDefined();
    expect(key.type).toBe("secret");
    expect(key.algorithm).toMatchObject({ name: "AES-GCM", length: 256 });
  });

  it("same passphrase + salt produces same key", async () => {
    const key1 = await deriveKey("password", "salt1");
    const key2 = await deriveKey("password", "salt1");

    // Encrypt with key1 and decrypt with key2 to prove they're the same
    const { ciphertext, iv } = await encrypt("hello", key1);
    const plaintext = await decrypt(ciphertext, iv, key2);
    expect(plaintext).toBe("hello");
  });

  it("different passphrase produces different key", async () => {
    const key1 = await deriveKey("password1", "salt1");
    const key2 = await deriveKey("password2", "salt1");

    const { ciphertext, iv } = await encrypt("hello", key1);

    await expect(decrypt(ciphertext, iv, key2)).rejects.toThrow();
  });

  it("different salt produces different key", async () => {
    const key1 = await deriveKey("password", "salt1");
    const key2 = await deriveKey("password", "salt2");

    const { ciphertext, iv } = await encrypt("hello", key1);

    await expect(decrypt(ciphertext, iv, key2)).rejects.toThrow();
  });

  it("encrypt + decrypt roundtrip", async () => {
    const key = await deriveKey("mypassword", "userid123");

    const original = "This is my secret password: P@$$w0rd!";
    const { ciphertext, iv } = await encrypt(original, key);

    expect(ciphertext).not.toBe(original);
    expect(ciphertext.length).toBeGreaterThan(0);
    expect(iv.length).toBeGreaterThan(0);

    const decrypted = await decrypt(ciphertext, iv, key);
    expect(decrypted).toBe(original);
  });

  it("each encryption produces different ciphertext (unique IV)", async () => {
    const key = await deriveKey("pass", "salt");

    const r1 = await encrypt("same text", key);
    const r2 = await encrypt("same text", key);

    expect(r1.ciphertext).not.toBe(r2.ciphertext);
    expect(r1.iv).not.toBe(r2.iv);
  });

  it("handles unicode text", async () => {
    const key = await deriveKey("pass", "salt");

    const text = "Привет мир 🌍 日本語 العربية";
    const { ciphertext, iv } = await encrypt(text, key);
    const decrypted = await decrypt(ciphertext, iv, key);
    expect(decrypted).toBe(text);
  });

  it("handles empty string", async () => {
    const key = await deriveKey("pass", "salt");

    const { ciphertext, iv } = await encrypt("", key);
    const decrypted = await decrypt(ciphertext, iv, key);
    expect(decrypted).toBe("");
  });

  it("handles long text", async () => {
    const key = await deriveKey("pass", "salt");

    const longText = "A".repeat(100_000);
    const { ciphertext, iv } = await encrypt(longText, key);
    const decrypted = await decrypt(ciphertext, iv, key);
    expect(decrypted).toBe(longText);
  });
});

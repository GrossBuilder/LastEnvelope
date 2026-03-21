.import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { encryptAndSaveFile, decryptFile, deleteFile, getUploadDir } from "@/lib/file-storage";
import path from "path";
import { existsSync } from "fs";
import { unlink, readdir, rm } from "fs/promises";

// Use a temp upload dir for tests
vi.stubEnv("FILE_ENCRYPTION_KEY", "6e4d67e260ba3e5df2023d8d573ecabc7ec8bc29fcc213c09492954dfda2666e");

describe("file-storage", () => {
  const createdFiles: string[] = [];

  afterEach(async () => {
    // Cleanup created files
    for (const f of createdFiles) {
      try {
        await unlink(path.join(getUploadDir(), f));
      } catch {}
    }
    createdFiles.length = 0;
  });

  it("encrypts and saves a file, then decrypts it back", async () => {
    const original = Buffer.from("Hello, this is a secret document!");
    const { storagePath, iv } = await encryptAndSaveFile(original, "test.txt");
    createdFiles.push(storagePath);

    expect(storagePath).toBeTruthy();
    expect(iv).toBeTruthy();
    expect(iv).toHaveLength(32); // 16 bytes hex

    const decrypted = await decryptFile(storagePath, iv);
    expect(decrypted.toString()).toBe("Hello, this is a secret document!");
  });

  it("produces different storage names for same content", async () => {
    const buf = Buffer.from("same content");
    const r1 = await encryptAndSaveFile(buf, "file.txt");
    const r2 = await encryptAndSaveFile(buf, "file.txt");
    createdFiles.push(r1.storagePath, r2.storagePath);

    expect(r1.storagePath).not.toBe(r2.storagePath);
  });

  it("produces different IVs for same content", async () => {
    const buf = Buffer.from("same content");
    const r1 = await encryptAndSaveFile(buf, "a.txt");
    const r2 = await encryptAndSaveFile(buf, "b.txt");
    createdFiles.push(r1.storagePath, r2.storagePath);

    expect(r1.iv).not.toBe(r2.iv);
  });

  it("handles binary data (image-like)", async () => {
    const binary = Buffer.alloc(1024);
    for (let i = 0; i < 1024; i++) binary[i] = i % 256;
    const { storagePath, iv } = await encryptAndSaveFile(binary, "img.bin");
    createdFiles.push(storagePath);

    const decrypted = await decryptFile(storagePath, iv);
    expect(Buffer.compare(decrypted, binary)).toBe(0);
  });

  it("handles empty file", async () => {
    const empty = Buffer.alloc(0);
    const { storagePath, iv } = await encryptAndSaveFile(empty, "empty.txt");
    createdFiles.push(storagePath);

    const decrypted = await decryptFile(storagePath, iv);
    expect(decrypted.length).toBe(0);
  });

  it("deleteFile removes the file", async () => {
    const buf = Buffer.from("to be deleted");
    const { storagePath } = await encryptAndSaveFile(buf, "del.txt");

    await deleteFile(storagePath);
    const filePath = path.join(getUploadDir(), storagePath);
    expect(existsSync(filePath)).toBe(false);
  });

  it("decryptFile throws with wrong IV", async () => {
    const buf = Buffer.from("test data");
    const { storagePath } = await encryptAndSaveFile(buf, "wrong-iv.txt");
    createdFiles.push(storagePath);

    const wrongIv = "00".repeat(16);
    await expect(decryptFile(storagePath, wrongIv)).rejects.toThrow();
  });

  it("handles large file (1MB)", async () => {
    const large = Buffer.alloc(1024 * 1024, 0x42);
    const { storagePath, iv } = await encryptAndSaveFile(large, "large.bin");
    createdFiles.push(storagePath);

    const decrypted = await decryptFile(storagePath, iv);
    expect(decrypted.length).toBe(1024 * 1024);
    expect(decrypted[0]).toBe(0x42);
    expect(decrypted[decrypted.length - 1]).toBe(0x42);
  });
});

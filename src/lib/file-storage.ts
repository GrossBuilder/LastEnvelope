import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import path from "path";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): string {
  const key = process.env.FILE_ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error(
      "FILE_ENCRYPTION_KEY environment variable is required (64-char hex string). " +
      "Generate with: openssl rand -hex 32"
    );
  }
  return key;
}

function getKey(): Buffer {
  return Buffer.from(getEncryptionKey(), "hex");
}

export function getUploadDir(): string {
  return path.join(process.cwd(), "uploads");
}

export async function encryptAndSaveFile(
  buffer: Buffer,
  filename: string
): Promise<{ storagePath: string; iv: string }> {
  const uploadDir = getUploadDir();
  await mkdir(uploadDir, { recursive: true });

  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Store authTag + encrypted data together
  const combined = Buffer.concat([authTag, encrypted]);
  const storageName = `${Date.now()}-${randomBytes(8).toString("hex")}`;
  const storagePath = path.join(uploadDir, storageName);

  await writeFile(storagePath, combined);

  return { storagePath: storageName, iv: iv.toString("hex") };
}

function sanitizeStorageName(name: string): string {
  const safe = path.basename(name);
  if (!safe || safe === '.' || safe === '..') {
    throw new Error('Invalid storage name');
  }
  return safe;
}

export async function decryptFile(
  storageName: string,
  ivHex: string
): Promise<Buffer> {
  const filePath = path.join(getUploadDir(), sanitizeStorageName(storageName));
  const combined = await readFile(filePath);

  const iv = Buffer.from(ivHex, "hex");
  const authTag = combined.subarray(0, 16);
  const encrypted = combined.subarray(16);

  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

export async function deleteFile(storageName: string): Promise<void> {
  const filePath = path.join(getUploadDir(), sanitizeStorageName(storageName));
  await unlink(filePath);
}

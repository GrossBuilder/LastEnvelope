import { z } from "zod";

export const VaultTypeEnum = z.enum(["PASSWORD", "DOCUMENT", "MESSAGE", "INSTRUCTION"]);

export const createVaultItemSchema = z.object({
  type: VaultTypeEnum,
  title: z.string().min(1, "Title is required").max(200),
  encryptedData: z.string().min(1, "Encrypted data is required"),
  iv: z.string().min(1, "IV is required"),
});

export const updateVaultItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  encryptedData: z.string().min(1).optional(),
  iv: z.string().min(1).optional(),
});

export type CreateVaultItemInput = z.infer<typeof createVaultItemSchema>;
export type UpdateVaultItemInput = z.infer<typeof updateVaultItemSchema>;

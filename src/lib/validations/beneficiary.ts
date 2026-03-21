import { z } from "zod";

export const createBeneficiarySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  phone: z.string().max(20).optional().or(z.literal("")),
  relation: z.string().max(50).optional().or(z.literal("")),
});

export const updateBeneficiarySchema = createBeneficiarySchema.partial();

export const assignItemSchema = z.object({
  vaultItemId: z.string().min(1),
  note: z.string().max(500).optional().or(z.literal("")),
});

export type CreateBeneficiaryInput = z.infer<typeof createBeneficiarySchema>;
export type UpdateBeneficiaryInput = z.infer<typeof updateBeneficiarySchema>;

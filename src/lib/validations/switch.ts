import { z } from "zod";

export const configureSwitchSchema = z.object({
  intervalDays: z.number().int().min(7).max(90),
  gracePeriodDays: z.number().int().min(1).max(14),
});

export const updateSwitchSchema = z.object({
  intervalDays: z.number().int().min(7).max(90).optional(),
  gracePeriodDays: z.number().int().min(1).max(14).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "DISABLED"]).optional(),
});

export type ConfigureSwitchInput = z.infer<typeof configureSwitchSchema>;
export type UpdateSwitchInput = z.infer<typeof updateSwitchSchema>;

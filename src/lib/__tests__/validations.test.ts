import { describe, it, expect } from "vitest";
import { createVaultItemSchema, updateVaultItemSchema } from "@/lib/validations/vault";
import { createBeneficiarySchema, updateBeneficiarySchema, assignItemSchema } from "@/lib/validations/beneficiary";
import { configureSwitchSchema, updateSwitchSchema } from "@/lib/validations/switch";

describe("vault validations", () => {
  describe("createVaultItemSchema", () => {
    it("accepts valid item", () => {
      const result = createVaultItemSchema.safeParse({
        type: "PASSWORD",
        title: "Gmail",
        encryptedData: "base64encrypted",
        iv: "base64iv",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing title", () => {
      const result = createVaultItemSchema.safeParse({
        type: "PASSWORD",
        encryptedData: "data",
        iv: "iv",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid type", () => {
      const result = createVaultItemSchema.safeParse({
        type: "INVALID",
        title: "Test",
        encryptedData: "data",
        iv: "iv",
      });
      expect(result.success).toBe(false);
    });

    it("accepts all valid types", () => {
      for (const type of ["PASSWORD", "DOCUMENT", "MESSAGE", "INSTRUCTION"]) {
        const result = createVaultItemSchema.safeParse({
          type,
          title: "Test",
          encryptedData: "data",
          iv: "iv",
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("updateVaultItemSchema", () => {
    it("accepts partial update", () => {
      const result = updateVaultItemSchema.safeParse({
        title: "Updated Title",
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty object", () => {
      const result = updateVaultItemSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});

describe("beneficiary validations", () => {
  describe("createBeneficiarySchema", () => {
    it("accepts valid beneficiary", () => {
      const result = createBeneficiarySchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
        relation: "Brother",
      });
      expect(result.success).toBe(true);
    });

    it("requires name and email", () => {
      const result = createBeneficiarySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects invalid email", () => {
      const result = createBeneficiarySchema.safeParse({
        name: "John",
        email: "not-an-email",
      });
      expect(result.success).toBe(false);
    });

    it("phone and relation are optional", () => {
      const result = createBeneficiarySchema.safeParse({
        name: "Jane",
        email: "jane@example.com",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("updateBeneficiarySchema", () => {
    it("accepts partial update", () => {
      const result = updateBeneficiarySchema.safeParse({ name: "New Name" });
      expect(result.success).toBe(true);
    });
  });

  describe("assignItemSchema", () => {
    it("accepts valid assignment", () => {
      const result = assignItemSchema.safeParse({
        vaultItemId: "cuid123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing vaultItemId", () => {
      const result = assignItemSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});

describe("switch validations", () => {
  describe("configureSwitchSchema", () => {
    it("accepts valid config", () => {
      const result = configureSwitchSchema.safeParse({
        intervalDays: 30,
        gracePeriodDays: 7,
      });
      expect(result.success).toBe(true);
    });

    it("rejects interval < 7", () => {
      const result = configureSwitchSchema.safeParse({
        intervalDays: 5,
        gracePeriodDays: 3,
      });
      expect(result.success).toBe(false);
    });

    it("rejects interval > 90", () => {
      const result = configureSwitchSchema.safeParse({
        intervalDays: 100,
        gracePeriodDays: 3,
      });
      expect(result.success).toBe(false);
    });

    it("rejects grace < 1", () => {
      const result = configureSwitchSchema.safeParse({
        intervalDays: 30,
        gracePeriodDays: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects grace > 14", () => {
      const result = configureSwitchSchema.safeParse({
        intervalDays: 30,
        gracePeriodDays: 15,
      });
      expect(result.success).toBe(false);
    });

    it("accepts boundary values", () => {
      expect(configureSwitchSchema.safeParse({ intervalDays: 7, gracePeriodDays: 1 }).success).toBe(true);
      expect(configureSwitchSchema.safeParse({ intervalDays: 90, gracePeriodDays: 14 }).success).toBe(true);
    });
  });

  describe("updateSwitchSchema", () => {
    it("accepts valid status", () => {
      const result = updateSwitchSchema.safeParse({ status: "PAUSED" });
      expect(result.success).toBe(true);
    });

    it("rejects TRIGGERED status (user cant set directly)", () => {
      const result = updateSwitchSchema.safeParse({ status: "TRIGGERED" });
      expect(result.success).toBe(false);
    });

    it("accepts partial update", () => {
      const result = updateSwitchSchema.safeParse({ intervalDays: 14 });
      expect(result.success).toBe(true);
    });
  });
});

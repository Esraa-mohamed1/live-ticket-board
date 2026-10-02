import { describe, it, expect } from "vitest";
import {
  createTicketSchema,
  updateStatusSchema,
} from "@/modules/tickets/schemas";

describe("Ticket Zod Schemas", () => {
  describe("createTicketSchema", () => {
    const validPayload = {
      title: "Cannot connect to server",
      description: "Getting timeout error 504 on the API endpoint consistently.",
      priority: "high" as const,
      idempotencyKey: "123e4567-e89b-12d3-a456-426614174000",
    };

    it("accepts a valid ticket payload", () => {
      const result = createTicketSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("rejects title shorter than 3 characters", () => {
      const result = createTicketSchema.safeParse({
        ...validPayload,
        title: "No",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/at least 3 characters/i);
      }
    });

    it("rejects title longer than 120 characters", () => {
      const result = createTicketSchema.safeParse({
        ...validPayload,
        title: "a".repeat(121),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/at most 120 characters/i);
      }
    });

    it("rejects description shorter than 10 characters", () => {
      const result = createTicketSchema.safeParse({
        ...validPayload,
        description: "Broken",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/at least 10 characters/i);
      }
    });

    it("rejects description longer than 2000 characters", () => {
      const result = createTicketSchema.safeParse({
        ...validPayload,
        description: "a".repeat(2001),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/at most 2000 characters/i);
      }
    });

    it("rejects an invalid priority enum value", () => {
      const result = createTicketSchema.safeParse({
        ...validPayload,
        priority: "urgent",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/Priority must be low, medium, or high/i);
      }
    });

    it("rejects a non-UUID idempotencyKey", () => {
      const result = createTicketSchema.safeParse({
        ...validPayload,
        idempotencyKey: "not-a-valid-uuid",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/valid UUID/i);
      }
    });
  });

  describe("updateStatusSchema", () => {
    it("accepts valid status update", () => {
      const result = updateStatusSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        status: "in_progress",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid status", () => {
      const result = updateStatusSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        status: "closed",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/open, in_progress, or resolved/i);
      }
    });

    it("rejects invalid ticket UUID", () => {
      const result = updateStatusSchema.safeParse({
        id: "bad-id",
        status: "resolved",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/valid UUID/i);
      }
    });
  });
});

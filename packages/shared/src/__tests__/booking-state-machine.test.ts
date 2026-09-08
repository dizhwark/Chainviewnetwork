import { describe, expect, it } from "vitest";
import { assertTransition, BookingTransitionError, canTransition } from "../state-machine/booking";

describe("booking state machine", () => {
  it("allows a plumber to accept an offered job", () => {
    expect(canTransition("OFFERED", "ACCEPTED", "plumber")).toBe(true);
  });

  it("does not allow a customer to accept a job offer", () => {
    expect(canTransition("OFFERED", "ACCEPTED", "customer")).toBe(false);
  });

  it("does not allow skipping straight from REQUESTED to PAID", () => {
    expect(canTransition("REQUESTED", "PAID", "system")).toBe(false);
  });

  it("throws a BookingTransitionError with actor/from/to context on an invalid transition", () => {
    try {
      assertTransition("OFFERED", "ACCEPTED", "customer");
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(BookingTransitionError);
      expect((err as BookingTransitionError).from).toBe("OFFERED");
      expect((err as BookingTransitionError).to).toBe("ACCEPTED");
      expect((err as BookingTransitionError).actor).toBe("customer");
    }
  });

  it("allows an admin to force-cancel any active state", () => {
    expect(canTransition("WORK_IN_PROGRESS", "CANCELLED_BY_ADMIN", "admin")).toBe(true);
    expect(canTransition("WORK_IN_PROGRESS", "CANCELLED_BY_ADMIN", "customer")).toBe(false);
  });

  it("requires explicit customer approval before work can start", () => {
    expect(canTransition("ESTIMATE_PENDING", "WORK_IN_PROGRESS", "plumber")).toBe(false);
    expect(canTransition("ESTIMATE_PENDING", "ESTIMATE_APPROVED", "customer")).toBe(true);
    expect(canTransition("ESTIMATE_APPROVED", "WORK_IN_PROGRESS", "plumber")).toBe(true);
  });

  it("has no outgoing transitions from terminal CLOSED state", () => {
    expect(canTransition("CLOSED", "PAID", "system")).toBe(false);
    expect(canTransition("CLOSED", "REQUESTED", "customer")).toBe(false);
  });
});

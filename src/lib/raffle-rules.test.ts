import { describe, expect, it } from "vitest";
import {
  assertTicketCount,
  assignSaintsToTickets,
  formatTicketNumber,
  RAFFLE_MAX_TICKETS,
} from "./raffle-rules";

describe("assertTicketCount", () => {
  it("aceita 100 cotas", () => {
    expect(() => assertTicketCount(100)).not.toThrow();
  });

  it("aceita 800 cotas", () => {
    expect(() => assertTicketCount(800)).not.toThrow();
  });

  it("rejeita 801 cotas", () => {
    expect(() => assertTicketCount(801)).toThrow(/800/);
  });

  it("rejeita 150 cotas (só múltiplos de 100)", () => {
    expect(() => assertTicketCount(150)).toThrow(/100, 200/);
  });

  it("rejeita zero", () => {
    expect(() => assertTicketCount(0)).toThrow();
  });
});

describe("formatTicketNumber", () => {
  it("formata com zeros", () => {
    expect(formatTicketNumber(1)).toBe("0001");
    expect(formatTicketNumber(500)).toBe("0500");
  });
});

describe("RAFFLE_MAX_TICKETS", () => {
  it("é 800", () => {
    expect(RAFFLE_MAX_TICKETS).toBe(800);
  });
});

describe("assignSaintsToTickets", () => {
  const pool = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("usa todos distintos quando cotas <= catálogo", () => {
    const out = assignSaintsToTickets(pool, 3);
    expect(out).toHaveLength(3);
    expect(new Set(out.map((s) => s.id)).size).toBe(3);
  });

  it("repete santos quando cotas > catálogo", () => {
    const out = assignSaintsToTickets(pool, 10);
    expect(out).toHaveLength(10);
    expect(new Set(out.map((s) => s.id)).size).toBeLessThanOrEqual(3);
  });
});

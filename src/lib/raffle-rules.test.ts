import { describe, expect, it } from "vitest";
import {
  assertNumberSeries,
  assertNumberTicketCount,
  numberedDrawNote,
  numberedRaffleSeries,
  assertTicketCount,
  assignSaintsToTickets,
  formatTicketNumber,
  raffleBookletNumber,
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

describe("assertNumberTicketCount", () => {
  it("aceita até 2000 números", () => {
    expect(() => assertNumberTicketCount(2000)).not.toThrow();
    expect(() => assertNumberTicketCount(1)).not.toThrow();
  });

  it("rejeita acima de 2000", () => {
    expect(() => assertNumberTicketCount(2001)).toThrow(/2000/);
  });
});

describe("assertNumberSeries", () => {
  it("aceita 1500 números a partir de 1501", () => {
    expect(() => assertNumberSeries(1501, 1500)).not.toThrow();
  });

  it("rejeita série que passa de 9999", () => {
    expect(() => assertNumberSeries(9000, 2000)).toThrow(/9999/);
  });
});

describe("numberedRaffleSeries", () => {
  it("inclui o talão impresso e os números do site", () => {
    expect(numberedRaffleSeries(1501, 1500)).toEqual({ first: 1, siteStart: 1501, last: 3000 });
  });

  it("começa em 0001 quando o site também começa em 0001", () => {
    expect(numberedRaffleSeries(1, 2000).last).toBe(2000);
  });
});

describe("numberedDrawNote", () => {
  const series = { first: 1, siteStart: 1501, last: 3000 };

  it("marca número do talão", () => {
    expect(numberedDrawNote(series, 42, false)).toMatch(/talão impresso/);
  });

  it("marca compra do site", () => {
    expect(numberedDrawNote(series, 1600, true)).toMatch(/vendido no site/);
  });
});

describe("raffleBookletNumber", () => {
  it("coloca 1495 no talão 30", () => {
    expect(raffleBookletNumber(1495)).toBe(30);
    expect(raffleBookletNumber(1)).toBe(1);
    expect(raffleBookletNumber(50)).toBe(1);
    expect(raffleBookletNumber(51)).toBe(2);
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

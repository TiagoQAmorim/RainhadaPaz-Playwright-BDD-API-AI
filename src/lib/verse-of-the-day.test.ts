import { describe, expect, it } from "vitest";
import { DAILY_VERSES, verseForDate } from "./verse-of-the-day";

describe("verseForDate", () => {
  it("repete o mesmo versículo ao longo do dia em São Paulo", () => {
    const morning = verseForDate(new Date("2026-03-15T08:00:00-03:00"));
    const night = verseForDate(new Date("2026-03-15T23:40:00-03:00"));
    const stillEveningInSaoPaulo = verseForDate(new Date("2026-03-16T02:30:00Z"));
    expect(night).toEqual(morning);
    expect(stillEveningInSaoPaulo).toEqual(morning);
  });

  it("troca na virada do dia em São Paulo", () => {
    const before = verseForDate(new Date("2026-03-15T23:40:00-03:00"));
    const after = verseForDate(new Date("2026-03-16T00:10:00-03:00"));
    expect(after.reference).not.toBe(before.reference);
    expect(DAILY_VERSES).toContainEqual(after);
  });
});

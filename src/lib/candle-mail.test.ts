import { describe, expect, it } from "vitest";
import {
  candleNeedsExpiryReminder,
  parishWallTimeToUtc,
  weeklyCandleReportText,
  weeklyReportWindow,
} from "./candle-mail";

const fridayLate = new Date("2026-11-27T23:10:00-03:00");
const fridayEarly = new Date("2026-11-27T22:40:00-03:00");
const saturdayMorning = new Date("2026-11-28T09:00:00-03:00");
const saturdayAfternoon = new Date("2026-11-28T12:30:00-03:00");

describe("weeklyReportWindow", () => {
  it("abre na sexta às 23h, de domingo a sexta", () => {
    const window = weeklyReportWindow(fridayLate, null);
    expect(window?.weekKey).toBe("2026-11-22");
    expect(window?.start.toISOString()).toBe("2026-11-22T03:00:00.000Z");
    expect(window?.end.toISOString()).toBe("2026-11-28T03:00:00.000Z");
  });

  it("não abre antes das 23h de sexta", () => {
    expect(weeklyReportWindow(fridayEarly, null)).toBeNull();
  });

  it("recupera no sábado de manhã se a sexta passou sem envio", () => {
    expect(weeklyReportWindow(saturdayMorning, null)?.weekKey).toBe("2026-11-22");
    expect(weeklyReportWindow(saturdayAfternoon, null)).toBeNull();
  });

  it("não repete a mesma semana", () => {
    expect(weeklyReportWindow(fridayLate, "2026-11-22")).toBeNull();
  });
});

describe("parishWallTimeToUtc", () => {
  it("meia-noite de São Paulo é 03:00 UTC", () => {
    expect(parishWallTimeToUtc(2026, 11, 22).toISOString()).toBe("2026-11-22T03:00:00.000Z");
  });
});

describe("weeklyCandleReportText", () => {
  it("inclui oração que não é pública", () => {
    const window = weeklyReportWindow(fridayLate, null)!;
    const text = weeklyCandleReportText(
      [
        {
          donorName: "Ana",
          email: "ana@exemplo.com",
          phone: "(11) 98888-7777",
          intention: "Pela família",
          prayer: "Oração reservada",
          intentionPublic: true,
          prayerPublic: false,
          litAt: new Date("2026-11-24T15:00:00-03:00"),
          expiresAt: new Date("2026-11-24T23:00:00-03:00"),
          amountCents: 1000,
        },
      ],
      window,
    );
    expect(text).toContain("Oração reservada");
    expect(text).toContain("não pública");
    expect(text).toContain("Ana");
  });
});

describe("candleNeedsExpiryReminder", () => {
  const litAt = new Date("2026-11-24T10:00:00Z");
  const expiresAt = new Date("2026-11-24T18:00:00Z");

  it("avisa na última hora", () => {
    expect(
      candleNeedsExpiryReminder(
        {
          email: "ana@exemplo.com",
          status: "PAID",
          litAt,
          expiresAt,
          expiryReminderSentAt: null,
        },
        new Date("2026-11-24T17:10:00Z"),
      ),
    ).toBe(true);
  });

  it("espera a última hora", () => {
    expect(
      candleNeedsExpiryReminder(
        {
          email: "ana@exemplo.com",
          status: "PAID",
          litAt,
          expiresAt,
          expiryReminderSentAt: null,
        },
        new Date("2026-11-24T16:00:00Z"),
      ),
    ).toBe(false);
  });

  it("não repete e não avisa vela curta demais", () => {
    expect(
      candleNeedsExpiryReminder(
        {
          email: "ana@exemplo.com",
          status: "PAID",
          litAt,
          expiresAt,
          expiryReminderSentAt: new Date(),
        },
        new Date("2026-11-24T17:10:00Z"),
      ),
    ).toBe(false);
    expect(
      candleNeedsExpiryReminder(
        {
          email: "ana@exemplo.com",
          status: "PAID",
          litAt: new Date("2026-11-24T17:00:00Z"),
          expiresAt: new Date("2026-11-24T17:30:00Z"),
          expiryReminderSentAt: null,
        },
        new Date("2026-11-24T17:10:00Z"),
      ),
    ).toBe(false);
  });

  it("aceita um aviso de poucos minutos", () => {
    const fiveMinutes = 5 * 60 * 1000;
    const candle = {
      email: "ana@exemplo.com",
      status: "PAID",
      litAt: new Date("2026-11-24T17:00:00Z"),
      expiresAt: new Date("2026-11-24T17:30:00Z"),
      expiryReminderSentAt: null,
    };
    expect(candleNeedsExpiryReminder(candle, new Date("2026-11-24T17:20:00Z"), fiveMinutes)).toBe(false);
    expect(candleNeedsExpiryReminder(candle, new Date("2026-11-24T17:26:00Z"), fiveMinutes)).toBe(true);
  });
});

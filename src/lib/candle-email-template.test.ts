import { describe, expect, it } from "vitest";
import {
  applyCandleEmailTemplate,
  renderCandleEmail,
  renderCandleWeekEmail,
  DEFAULT_CANDLE_EXPIRY_EMAIL_BODY,
} from "./candle-email-template";

describe("applyCandleEmailTemplate", () => {
  it("troca as tags e mantém o que não conhece", () => {
    const text = applyCandleEmailTemplate("Olá, <nome>. <Intencao> <desconhecida>", {
      nome: "Ana",
      intencao: "Pela família",
    });
    expect(text).toBe("Olá, Ana. Pela família <desconhecida>");
  });
});

describe("renderCandleEmail", () => {
  it("usa o texto salvo e, se estiver vazio, o modelo", () => {
    const source = {
      donorName: "Ana",
      intention: "Pela família",
      link: "https://paroquia.exemplo/velas",
    };
    expect(renderCandleEmail("Oi, <nome>", DEFAULT_CANDLE_EXPIRY_EMAIL_BODY, source)).toBe("Oi, Ana");
    expect(renderCandleEmail("  ", DEFAULT_CANDLE_EXPIRY_EMAIL_BODY, source)).toContain(
      "https://paroquia.exemplo/velas",
    );
    expect(renderCandleEmail(null, DEFAULT_CANDLE_EXPIRY_EMAIL_BODY, source)).toContain("Pela família");
  });
});

describe("renderCandleWeekEmail", () => {
  const window = {
    start: new Date("2026-11-22T03:00:00.000Z"),
    end: new Date("2026-11-28T03:00:00.000Z"),
  };

  it("repete o modelo de cada vela dentro de <velas>", () => {
    const { text, subject } = renderCandleWeekEmail(
      {
        subject: "Semana <periodo>",
        intro: "Total: <quantidade>\n\n<velas>",
        item: "<numero>. <nome> — <oracao>",
      },
      [
        { donorName: "Ana", intention: "Paz", prayer: "Oração reservada" },
        { donorName: "João", intention: "Saúde", prayer: null },
      ],
      window,
    );
    expect(subject).toContain("Semana");
    expect(text).toContain("1. Ana — Oração reservada");
    expect(text).toContain("2. João — (não informada)");
    expect(text).toContain("2 vela(s)");
  });
});

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

  it("coloca cada vela numa linha da tabela", () => {
    const { text, html, subject } = renderCandleWeekEmail(
      {
        subject: "Semana <periodo>",
        intro: "Total: <quantidade>\n\n<velas>",
      },
      [
        { donorName: "Ana", intention: "Paz", prayer: "Oração reservada", email: "ana@paroquia.test" },
        { donorName: "João <script>", intention: "Saúde", prayer: null },
      ],
      window,
    );
    const ana = text.split("\n").find((line) => line.startsWith("1\t"));
    expect(subject).toContain("Semana");
    expect(text).toContain("2 vela(s)");
    expect(ana).toContain("Ana");
    expect(ana).toContain("Oração reservada");
    expect(ana).toContain("ana@paroquia.test");
    expect(ana).toContain("Paz");
    expect(html.match(/<tr>/g)).toHaveLength(3);
    expect(html).toContain("Oração reservada");
    expect(html).toContain("João &lt;script&gt;");
    expect(html).not.toContain("João <script>");
  });
});

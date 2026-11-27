import { describe, expect, it } from "vitest";
import { normalizeNotifyEmailList, parseNotifyEmails } from "./candle-notify-emails";

describe("parseNotifyEmails", () => {
  it("aceita vários e-mails separados por vírgula, ponto e vírgula ou linha", () => {
    expect(parseNotifyEmails("a@paroquia.test, b@paroquia.test\nc@paroquia.test; a@paroquia.test")).toEqual([
      "a@paroquia.test",
      "b@paroquia.test",
      "c@paroquia.test",
    ]);
  });
});

describe("normalizeNotifyEmailList", () => {
  it("guarda um e-mail por linha e recusa endereço inválido", () => {
    expect(normalizeNotifyEmailList(" A@paroquia.test ; b@paroquia.test ")).toEqual({
      ok: true,
      stored: "A@paroquia.test\nb@paroquia.test",
    });
    expect(normalizeNotifyEmailList("")).toEqual({ ok: true, stored: null });
    expect(normalizeNotifyEmailList("nao-e-email")).toEqual({
      ok: false,
      message: "Um dos e-mails da lista não é válido.",
    });
  });
});
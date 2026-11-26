import { describe, expect, it } from "vitest";
import { clampProgress, parseHelpAmountCents } from "./parish-work-format";

describe("parseHelpAmountCents", () => {
  it("aceita reais inteiros e com centavos", () => {
    expect(parseHelpAmountCents("50")).toBe(5000);
    expect(parseHelpAmountCents("50,00")).toBe(5000);
    expect(parseHelpAmountCents("1.000,50")).toBe(100050);
    expect(parseHelpAmountCents("R$ 30")).toBe(3000);
  });

  it("recusa vazio, zero e valor alto demais", () => {
    expect(parseHelpAmountCents("")).toBeNull();
    expect(parseHelpAmountCents("0,50")).toBeNull();
    expect(parseHelpAmountCents("200000")).toBeNull();
    expect(parseHelpAmountCents("abc")).toBeNull();
  });
});

describe("clampProgress", () => {
  it("prende entre 0 e 100", () => {
    expect(clampProgress(40.4)).toBe(40);
    expect(clampProgress(-3)).toBe(0);
    expect(clampProgress(140)).toBe(100);
  });
});

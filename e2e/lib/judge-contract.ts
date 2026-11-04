import { expect } from "@playwright/test";
import type { AiJudgeResult } from "./ai-judge";

const REASON_POOL = [
  "The text mentions parish, mass times, and parish contact.",
  "Content is consistent with a religious site in Portuguese.",
  "There are references to candles and notices, typical of a parish portal.",
  "Looks like an institutional page, not an online store.",
  "Missing clear elements of a Catholic parish.",
  "Mention of Rainha da Paz and celebration schedules.",
];

const REASON_SUFFIXES = ["", " ", " …", "!", "?"];

/**
 * Pretends non-deterministic AI judge output (pass and text vary each run).
 * Does not call an LLM.
 */
export function simulateNonDeterministicAiJudgeOutput(count: number): AiJudgeResult[] {
  return Array.from({ length: count }, (_, i) => {
    const pass = Math.random() < 0.55;
    const base = REASON_POOL[Math.floor(Math.random() * REASON_POOL.length)]!;
    const suffix = REASON_SUFFIXES[Math.floor(Math.random() * REASON_SUFFIXES.length)]!;
    const reason = `${base}${suffix} (run ${Date.now()}-${i})`;
    return {
      pass,
      reason,
      raw: JSON.stringify({ pass, reason: base }),
    };
  });
}

/** @deprecated use simulateNonDeterministicAiJudgeOutput */
export const sampleNonDeterministicJudgeResults = simulateNonDeterministicAiJudgeOutput;

/**
 * Deterministic validation of `reason` as free-form AI-like text.
 * Does not judge semantics — only shape, charset, and limits.
 */
export function assertDeterministicTextRules(text: string): void {
  const trimmed = text.trim();
  expect(trimmed.length, "empty text after trim").toBeGreaterThanOrEqual(10);
  expect(trimmed.length, "text exceeds limit").toBeLessThanOrEqual(2000);

  expect(trimmed, "must not contain HTML tags").not.toMatch(/<[^>]+>/);
  expect(trimmed, "must not contain control characters").not.toMatch(
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/,
  );

  expect(trimmed, "must contain letters").toMatch(/[A-Za-zÀ-ú]/);

  const words = trimmed.split(/\s+/).filter(Boolean);
  expect(words.length, "must have at least 3 words").toBeGreaterThanOrEqual(3);

  expect(trimmed, "avoid excessive character repetition").not.toMatch(/(.)\1{8,}/);
}

/** Structural contract plus text rules on the reason field. */
export function assertJudgeResultContract(result: AiJudgeResult): void {
  expect(typeof result.pass, "pass must be boolean").toBe("boolean");
  assertDeterministicTextRules(result.reason);

  if (result.raw !== undefined && result.raw.length > 0) {
    const parsed = JSON.parse(result.raw) as { pass?: unknown; reason?: unknown };
    expect(typeof parsed.pass).toBe("boolean");
    expect(typeof parsed.reason).toBe("string");
    assertDeterministicTextRules(String(parsed.reason));
  }
}

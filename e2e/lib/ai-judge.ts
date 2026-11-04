/**
 * Optional LLM judge — non-deterministic tests (temperature > 0).
 * Without OPENAI_API_KEY returns null; tests should call test.skip().
 */

export type AiJudgeResult = {
  pass: boolean;
  reason: string;
  raw?: string;
};

const JUDGE_SYSTEM = `You are a QA reviewer for Catholic parish websites in Brazilian Portuguese.
Reply ONLY with valid JSON: {"pass":boolean,"reason":"short string in Portuguese"}`;

export async function judgePageTextWithLlm(
  pageText: string,
  rubric: string,
): Promise<AiJudgeResult | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = process.env.E2E_AI_MODEL?.trim() || "gpt-4o-mini";
  const baseUrl = (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com").replace(
    /\/$/,
    "",
  );

  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: JUDGE_SYSTEM },
        {
          role: "user",
          content: `Critério:\n${rubric}\n\nTexto visível da página (trecho):\n${pageText.slice(0, 12_000)}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM judge HTTP ${res.status}: ${err.slice(0, 400)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
  return parseJudgeResponseRaw(raw);
}

export function parseJudgeResponseRaw(raw: string): AiJudgeResult {
  try {
    const parsed = JSON.parse(raw) as { pass?: boolean; reason?: string };
    return {
      pass: Boolean(parsed.pass),
      reason: String(parsed.reason ?? ""),
      raw,
    };
  } catch {
    return { pass: false, reason: "Model response was not valid JSON.", raw };
  }
}

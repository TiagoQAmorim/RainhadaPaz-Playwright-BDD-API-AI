import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { test } from "./fixtures";
import { judgePageTextWithLlm, type AiJudgeResult } from "../lib/ai-judge";
import { PARISH_RUBRIC } from "../lib/ai-rubric";

const { Given, When, Then } = createBdd(test);

let lastJudge: AiJudgeResult | null = null;

Given("OPENAI_API_KEY is configured", async ({}) => {
  test.skip(
    !process.env.OPENAI_API_KEY?.trim(),
    "Set OPENAI_API_KEY in .env to run @ai @llm tests",
  );
});

When("I open the home page for analysis", async ({ page }) => {
  await page.goto("/");
});

When("I request an AI judgment of the main content with parish criteria", async ({ page }) => {
  const text = await page.locator("main").innerText();
  lastJudge = await judgePageTextWithLlm(text, PARISH_RUBRIC);
  expect(lastJudge, "judgePageTextWithLlm failed or missing API key").not.toBeNull();
});

Then("the AI judge should approve the page", async ({}) => {
  expect(lastJudge?.pass, `AI judge rejected: ${lastJudge?.reason ?? "no result"}`).toBe(true);
});

import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { test } from "./fixtures";
import type { AiJudgeResult } from "../lib/ai-judge";
import {
  assertDeterministicTextRules,
  assertJudgeResultContract,
  simulateNonDeterministicAiJudgeOutput,
} from "../lib/judge-contract";

const { Given, When, Then } = createBdd(test);

let simulatedOutputs: AiJudgeResult[] = [];

Given("I simulate several non-deterministic AI judge responses", async ({}) => {
  simulatedOutputs = simulateNonDeterministicAiJudgeOutput(10);
  expect(simulatedOutputs.length).toBeGreaterThan(0);
});

When("I validate each response with deterministic text rules", async ({}) => {
  for (const output of simulatedOutputs) {
    expect(typeof output.pass).toBe("boolean");
    assertDeterministicTextRules(output.reason);
  }
});

Then("all simulated responses should be accepted", async ({}) => {
  for (const output of simulatedOutputs) {
    assertJudgeResultContract(output);
  }
});

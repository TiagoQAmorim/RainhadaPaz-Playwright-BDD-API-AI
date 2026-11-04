import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { test } from "./fixtures";
import { firstActiveRaffleSlug } from "../lib/http-helpers";

const { Given, When, Then } = createBdd(test);

type ApiWorld = {
  lastPath?: string;
  lastResponse?: import("@playwright/test").APIResponse;
  raffleSlug?: string;
};

const apiWorld: ApiWorld = {};

Given("an active raffle exists or I use a placeholder slug", async ({ request, baseURL }) => {
  const slug = await firstActiveRaffleSlug(request, baseURL!);
  apiWorld.raffleSlug = slug ?? "placeholder-e2e-slug";
});

When("I POST to {string} with JSON:", async ({ request, baseURL }, path, doc) => {
  apiWorld.lastPath = path;
  apiWorld.lastResponse = await request.post(`${baseURL}${path}`, {
    headers: { "Content-Type": "application/json" },
    data: JSON.parse(doc.trim()),
  });
});

When("I POST to the raffle bulk-resolve API with JSON:", async ({ request, baseURL }, doc) => {
  const slug = apiWorld.raffleSlug ?? "placeholder-e2e-slug";
  apiWorld.lastPath = `/api/rifas/${slug}/tickets/bulk-resolve`;
  apiWorld.lastResponse = await request.post(`${baseURL}${apiWorld.lastPath}`, {
    headers: { "Content-Type": "application/json" },
    data: JSON.parse(doc.trim()),
  });
});

Then("the HTTP response status should be {int}", async ({}, status: number) => {
  expect(apiWorld.lastResponse, "No request was made").toBeDefined();
  expect(apiWorld.lastResponse!.status()).toBe(status);
});

Then("the HTTP response status should be 400 or 404", async ({}) => {
  expect(apiWorld.lastResponse).toBeDefined();
  expect([400, 404]).toContain(apiWorld.lastResponse!.status());
});

Then("the JSON body should contain the key {string}", async ({}, key: string) => {
  const body = (await apiWorld.lastResponse!.json()) as Record<string, unknown>;
  expect(body).toHaveProperty(key);
});

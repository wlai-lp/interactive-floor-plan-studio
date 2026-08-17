import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const article = await readFile(new URL("../app/blog/getting-started/page.tsx", import.meta.url), "utf8");
const registry = await readFile(new URL("../app/blog/articles.ts", import.meta.url), "utf8");

const approvedScreenshots = [
  "bb21106d-72c8-47fe-a972-45bbb928101a",
  "db45e10e-5ceb-4498-b081-5eb7ca8cabfc",
  "a6cd27ca-b734-4adf-a9cf-20cab32cc465",
  "9be60fa4-06fd-40f3-96a6-e8659baa4439",
  "83785b7f-eaad-410a-ab36-50875ad292d5",
  "8f9fcb13-4b50-449c-b977-0e1be9897f09",
];

test("getting started article uses the Founder-approved screenshots from issue 45", () => {
  for (const assetId of approvedScreenshots) assert.match(article, new RegExp(assetId));
});

test("getting started article documents the verified export and Home Assistant panel workflow", () => {
  assert.match(article, /Export for Home Assistant/);
  assert.match(article, /Copy YAML to Clipboard/);
  assert.match(article, /configured as <strong>Panel<\/strong>/);
  assert.match(article, /Show code editor/);
  assert.match(article, /complete YAML copied from HAFloorplan/);
});

test("getting started article points readers directly to the editor and records the material revision", () => {
  assert.match(article, /className="cta-primary" href="\/editor">Open Editor/);
  assert.match(registry, /updated: "2026-08-16"/);
});

test("step five remains explicitly identified as an expected-result illustration", () => {
  assert.match(article, /Expected result/);
  assert.match(article, /final illustration represents the expected result/);
});

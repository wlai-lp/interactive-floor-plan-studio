import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/about/page.tsx", import.meta.url), "utf8");
const layout = await readFile(new URL("../app/about/layout.tsx", import.meta.url), "utf8");

test("About page uses the canonical marketing shell", () => {
  assert.match(layout, /MarketingShell/);
  assert.doesNotMatch(page, /MarketingHeader|MarketingFooter/);
});

test("About page preserves approved product positioning and CTA", () => {
  assert.match(page, /visual authoring layer for Home Assistant Picture Elements/i);
  assert.match(page, /Visual editor in\. Native Picture Elements out\./);
  assert.match(page, /href="\/editor">Open Editor/);
  assert.match(page, /not a replacement for Home Assistant/i);
  assert.match(page, /general-purpose CAD/i);
  assert.match(page, /No required custom card/);
});

test("About page contains required acknowledgements and independence language", () => {
  assert.match(page, /Home Assistant/);
  assert.match(page, /Floorplanner/);
  assert.match(page, /not based on or derived from Floorplanner/);
  assert.match(page, /Northflank/);
  assert.match(page, /do not imply sponsorship, partnership, or endorsement/);
  assert.match(page, /not affiliated with or endorsed by Home Assistant or Nabu Casa/);
});

test("About page describes the current local-first privacy posture without browser-only rendering", () => {
  assert.match(page, /local-first/);
  assert.match(page, /without an account/);
  assert.match(page, /does not ask for Home Assistant credentials or tokens/);
  assert.doesNotMatch(page, /\bwindow\b|\blocalStorage\b|\bsessionStorage\b|\bdocument\b/);
  assert.doesNotMatch(page, /"use client"|'use client'/);
});

test("About page has route metadata", () => {
  assert.match(page, /export const metadata: Metadata/);
  assert.match(page, /title: "About HAFloorplan"/);
  assert.match(page, /description:/);
});

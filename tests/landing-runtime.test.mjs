import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const hero = await readFile(new URL("../components/marketing/LandingHero.tsx", import.meta.url), "utf8");
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

test("landing page has no demo animation runtime wired in", () => {
  assert.doesNotMatch(hero, /HAFloorPlanHero|HAFloorPlanPromo|Watch 30-second demo|role="dialog"/);
  assert.equal(packageJson.scripts["prepare:promo"], undefined);
});

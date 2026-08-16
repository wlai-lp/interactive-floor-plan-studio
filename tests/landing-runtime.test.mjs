import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const hero = await readFile(new URL("../components/marketing/LandingHero.tsx", import.meta.url), "utf8");
const heroWrapper = await readFile(new URL("../components/ha-floorplan/HAFloorPlanHero.jsx", import.meta.url), "utf8");
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

test("landing runtime includes only the short looping demo", () => {
  assert.match(hero, /HAFloorPlanHero/);
  assert.match(heroWrapper, /data-short-demo="true"/);
  assert.match(heroWrapper, /dataset\.demoReady = "true"/);
  assert.doesNotMatch(hero, /HAFloorPlanPromo|Watch 30-second demo|role="dialog"/);
  assert.equal(packageJson.scripts["prepare:promo"], undefined);
  assert.equal(packageJson.scripts["prepare:hero"], "node scripts/prepare-ha-floorplan-hero.mjs");
});

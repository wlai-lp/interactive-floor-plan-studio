import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const hero = await readFile(new URL("../components/marketing/LandingHero.tsx", import.meta.url), "utf8");
const heroWrapper = await readFile(new URL("../components/ha-floorplan/HAFloorPlanHero.jsx", import.meta.url), "utf8");
const promoWrapper = await readFile(new URL("../components/ha-floorplan/HAFloorPlanPromo.jsx", import.meta.url), "utf8");
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

test("landing runtime keeps the full promo behind explicit activation", () => {
  assert.match(hero, /HAFloorPlanHero/);
  assert.match(heroWrapper, /data-short-demo="true"/);
  assert.match(heroWrapper, /dataset\.demoReady = "true"/);
  assert.match(hero, /HAFloorPlanPromo/);
  assert.match(hero, /Watch 33-second demo/);
  assert.match(hero, /role="dialog"/);
  assert.match(hero, /fullDemoOpen &&/);
  assert.match(promoWrapper, /data-full-demo="true"/);
  assert.match(promoWrapper, /dataset\.demoReady = "true"/);
  assert.equal(packageJson.scripts["prepare:hero"], "node scripts/prepare-ha-floorplan-hero.mjs");
});

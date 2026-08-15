import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const hero = await readFile(new URL("../components/marketing/LandingHero.tsx", import.meta.url), "utf8");
const heroWrapper = await readFile(new URL("../components/ha-floorplan/HAFloorPlanHero.jsx", import.meta.url), "utf8");
const promoWrapper = await readFile(new URL("../components/ha-floorplan/HAFloorPlanPromo.jsx", import.meta.url), "utf8");
const prepareScript = await readFile(new URL("../scripts/prepare-ha-floorplan-promo.mjs", import.meta.url), "utf8");
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

test("landing page uses the shared shell and approved native hero", () => {
  assert.match(page, /MarketingShell/);
  assert.match(page, /LandingHero/);
  assert.match(hero, /Your Home Assistant Dashboard Should Look Like Your Home\./);
  assert.match(hero, /href="\/editor"/);
  assert.match(hero, /Watch 30-second demo/);
  assert.doesNotMatch(hero, /iframe/i);
});

test("short hero and full promo cannot mount concurrently", () => {
  assert.match(hero, /!demoOpen && reduceMotion === false/);
  assert.match(hero, /demoOpen &&/);
  assert.match(hero, /HAFloorPlanPromo/);
  assert.match(hero, /HAFloorPlanHero/);
});

test("demo modal supports reduced motion and keyboard focus management", () => {
  assert.match(hero, /prefers-reduced-motion: reduce/);
  assert.match(hero, /role="dialog"/);
  assert.match(hero, /aria-modal="true"/);
  assert.match(hero, /event\.key === "Escape"/);
  assert.match(hero, /event\.key !== "Tab"/);
  assert.match(hero, /triggerRef\.current\?\.focus/);
  assert.match(hero, /closeRef\.current\?\.focus/);
});

test("Founder-provided animation wrappers retain their approved scene contracts", () => {
  assert.match(heroWrapper, /9s HA FloorPlan hero loop/);
  assert.match(heroWrapper, /window\.OM_PLAYBACK = '\{"mode":"loop"\}'/);
  assert.match(heroWrapper, /import\("\.\/lib\/hero-piece\.js"\)/);
  assert.match(promoWrapper, /33\.5s HA FloorPlan promo loop/);
  assert.match(promoWrapper, /import\("\.\/lib\/promo-piece\.js"\)/);
});

test("build pipeline reconstructs and integrity-checks the supplied promo archive", () => {
  assert.equal(packageJson.scripts["prepare:promo"], "node scripts/prepare-ha-floorplan-promo.mjs");
  assert.match(packageJson.scripts.build, /prepare:promo/);
  assert.match(packageJson.scripts.dev, /prepare:promo/);
  assert.match(packageJson.scripts.lint, /prepare:promo/);
  assert.match(prepareScript, /93ec60c0d5adf522e8fa7f6d90dbfe094991a16529b7096cca3ae1e415f5bdb5/);
  assert.match(prepareScript, /animations-v3\.js/);
  assert.match(prepareScript, /hero-piece\.js/);
  assert.match(prepareScript, /promo-piece\.js/);
  assert.match(prepareScript, /tweaks-panel\.js/);
});

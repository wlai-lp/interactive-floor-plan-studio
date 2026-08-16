import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const hero = await readFile(new URL("../components/marketing/LandingHero.tsx", import.meta.url), "utf8");
const heroWrapper = await readFile(new URL("../components/ha-floorplan/HAFloorPlanHero.jsx", import.meta.url), "utf8");
const workflow = await readFile(new URL("../components/marketing/LandingWorkflow.tsx", import.meta.url), "utf8");
const shell = await readFile(new URL("../components/marketing/MarketingShell.tsx", import.meta.url), "utf8");
const logo = await readFile(new URL("../components/brand/HAFloorplanLogo.tsx", import.meta.url), "utf8");
const editorLayout = await readFile(new URL("../app/editor/layout.tsx", import.meta.url), "utf8");
const exportLayout = await readFile(new URL("../app/home-assistant-export/layout.tsx", import.meta.url), "utf8");
const prepareHero = await readFile(new URL("../scripts/prepare-ha-floorplan-hero.mjs", import.meta.url), "utf8");
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

test("landing page uses shared shell, short hero, workflow, and trust strip", () => {
  assert.match(page, /MarketingShell/);
  assert.match(page, /LandingHero/);
  assert.match(page, /LandingWorkflow/);
  assert.match(hero, /Your Home Assistant Dashboard Should Look Like Your Home\./);
  assert.match(hero, /href="\/editor"/);
  assert.match(hero, /HAFloorPlanHero/);
  assert.match(hero, /prefers-reduced-motion: reduce/);
  assert.match(hero, /StaticProductPreview/);
  assert.match(workflow, /From floor plan to dashboard in minutes/);
  assert.match(workflow, /Add to HA/);
  assert.match(workflow, /No installation/);
  assert.match(workflow, /Native Picture Elements YAML/);
});

test("only the short hero demo is wired into the landing page", () => {
  assert.doesNotMatch(hero, /Watch 30-second demo|HAFloorPlanPromo|role="dialog"|aria-modal/);
  assert.match(heroWrapper, /9s HAFloorplan hero loop/);
  assert.match(heroWrapper, /window\.OM_PLAYBACK = '\{"mode":"loop"\}'/);
  assert.match(heroWrapper, /data-short-demo="true"/);
  assert.match(heroWrapper, /dataset\.demoReady = "true"/);
  assert.doesNotMatch(prepareHero, /promo-piece\.js/);
  assert.equal(packageJson.scripts["prepare:promo"], undefined);
  assert.equal(packageJson.scripts["prepare:hero"], "node scripts/prepare-ha-floorplan-hero.mjs");
  assert.match(packageJson.scripts.dev, /prepare:hero/);
  assert.match(packageJson.scripts.build, /prepare:hero/);
});

test("public navigation removes redundant Editor link and keeps Open Editor", () => {
  const nav = shell.match(/<nav[\s\S]*?<\/nav>/)?.[0] || "";
  assert.doesNotMatch(nav, />Editor<\/Link>/);
  assert.match(nav, />Blog<\/Link>/);
  assert.match(nav, />About<\/Link>/);
  assert.match(nav, /Open Editor/);
});

test("shared HAFloorplan logo is reused across public and application shells", () => {
  assert.match(logo, /HAFloorplanLogo/);
  assert.match(logo, /HAFloorplanMark/);
  assert.match(shell, /HAFloorplanLogo/);
  assert.match(editorLayout, /HAFloorplanLogo/);
  assert.match(exportLayout, /HAFloorplanLogo/);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const hero = await readFile(new URL("../components/marketing/LandingHero.tsx", import.meta.url), "utf8");
const workflow = await readFile(new URL("../components/marketing/LandingWorkflow.tsx", import.meta.url), "utf8");
const shell = await readFile(new URL("../components/marketing/MarketingShell.tsx", import.meta.url), "utf8");
const logo = await readFile(new URL("../components/brand/HAFloorplanLogo.tsx", import.meta.url), "utf8");
const editorLayout = await readFile(new URL("../app/editor/layout.tsx", import.meta.url), "utf8");
const exportLayout = await readFile(new URL("../app/home-assistant-export/layout.tsx", import.meta.url), "utf8");
const heroWrapper = await readFile(new URL("../components/ha-floorplan/HAFloorPlanHero.jsx", import.meta.url), "utf8");
const promoWrapper = await readFile(new URL("../components/ha-floorplan/HAFloorPlanPromo.jsx", import.meta.url), "utf8");
const prepareScript = await readFile(new URL("../scripts/prepare-ha-floorplan-promo.mjs", import.meta.url), "utf8");
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

test("landing page uses shared shell, native hero, workflow, and trust strip", () => {
  assert.match(page, /MarketingShell/);
  assert.match(page, /LandingHero/);
  assert.match(page, /LandingWorkflow/);
  assert.match(hero, /Your Home Assistant Dashboard Should Look Like Your Home\./);
  assert.match(hero, /href="\/editor"/);
  assert.match(hero, /Watch 30-second demo/);
  assert.match(workflow, /From floor plan to dashboard in minutes/);
  assert.match(workflow, /Add to HA/);
  assert.match(workflow, /No installation/);
  assert.match(workflow, /Native Picture Elements YAML/);
  assert.doesNotMatch(hero, /iframe/i);
});

test("full promo requires a trusted user click before import or modal creation", () => {
  assert.doesNotMatch(hero, /next\/dynamic/);
  assert.doesNotMatch(hero, /useState\(false\).*demoOpen/);
  assert.match(hero, /const \[demoSession, setDemoSession\]/);
  assert.match(hero, /event\.nativeEvent\.isTrusted/);
  assert.match(hero, /const openDemo = async \(event:/);
  assert.match(hero, /await import\("\.\.\/ha-floorplan\/HAFloorPlanPromo"\)/);
  assert.match(hero, /onClick=\{openDemo\}/);
  assert.match(hero, /setDemoSession\(\{ Promo: module\.default \}\)/);
  assert.match(hero, /\{demoSession && \(/);
  assert.match(hero, /pageshow/);
});

test("short hero stays mounted while the user-requested promo is loading", () => {
  assert.match(hero, /const demoOpen = demoSession !== null/);
  assert.match(hero, /setDemoLoading\(true\)/);
  assert.match(hero, /!demoOpen && reduceMotion === false/);
  assert.match(hero, /Loading demo…/);
});

test("demo modal supports reduced motion, close, Escape, and keyboard focus management", () => {
  assert.match(hero, /prefers-reduced-motion: reduce/);
  assert.match(hero, /role="dialog"/);
  assert.match(hero, /aria-modal="true"/);
  assert.match(hero, /event\.key === "Escape"/);
  assert.match(hero, /event\.key !== "Tab"/);
  assert.match(hero, /triggerRef\.current\?\.focus/);
  assert.match(hero, /closeRef\.current\?\.focus/);
  assert.match(hero, /Close full product demo/);
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

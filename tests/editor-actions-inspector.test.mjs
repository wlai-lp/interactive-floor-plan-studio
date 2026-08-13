import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/editor-actions-inspector.css", import.meta.url), "utf8");
const exportPage = await readFile(new URL("../app/home-assistant-export/page.tsx", import.meta.url), "utf8");
const exportCss = await readFile(new URL("../app/home-assistant-export/ha-export-page.css", import.meta.url), "utf8");

test("project commands are consolidated under Actions", () => {
  assert.match(page, />Actions <span/);
  for (const label of ["Upload floor-plan image", "Import project", "Export project", "Export SVG", "Export for Home Assistant"]) {
    assert.match(page, new RegExp(label));
  }
  assert.doesNotMatch(page, />↑ Upload image</);
  assert.doesNotMatch(page, />↓ SVG</);
});

test("Home Assistant export exposes prerequisites", () => {
  assert.match(page, /disabled=\{!hasHaExport\}/);
  assert.match(page, /Configure an Entity ID first/);
  assert.match(page, /"Select device"/);
  assert.match(page, /startEntitySetup/);
  assert.match(css, /\.export-prerequisite/);
  assert.match(page, /role="menuitem" disabled=\{!hasHaExport\}/, "export action should live in the Actions menu");
  assert.match(page, /window\.location\.href="\/home-assistant-export"/);
  assert.doesNotMatch(layout, /href="\/home-assistant-export"/);
  assert.doesNotMatch(layout, /Home Assistant Export/);
});

test("entity inspector prioritizes user-facing fields and progressive disclosure", () => {
  const alias = page.indexOf("Alias / title");
  const entity = page.indexOf("<label>Entity ID");
  const internalId = page.indexOf("Internal device ID");
  assert.ok(alias >= 0 && entity > alias && internalId > entity);
  for (const section of ["Appearance", "Interactions", "Room behavior", "Advanced", "Danger zone"]) assert.match(page, new RegExp(section));
  assert.match(page, /light\.alarm_light/);
  assert.match(page, /switch\.floor_lamp/);
});

test("destructive removal uses an app-native confirmation dialog", () => {
  assert.doesNotMatch(page, /window\.confirm/);
  assert.match(page, /role="alertdialog"/);
  assert.match(page, /aria-modal="true"/);
  assert.match(page, /confirmDeleteSelection/);
  assert.match(page, /This action can be undone from the editor/);
  assert.match(css, /\.confirmation-dialog/);
  assert.match(css, /\.danger-zone/);
  assert.match(css, /focus-visible/);
});

test("first-use guidance explains the minimal export flow", () => {
  assert.match(page, /Create your Home Assistant floor plan/);
  assert.match(page, /Configure this device/);
  assert.match(page, /Don&apos;t show again/);
  assert.match(page, /Actions → Export for Home Assistant/);
  assert.match(page, /welcomeInitially/);
  assert.match(page, /welcomeDevice\.x\/project\.width/);
  assert.match(page, /tutorial-target/);
  assert.match(css, /\.ha-welcome/);
  assert.match(css, /tutorial-pulse/);
});

test("sample project uses a power plug for the second device", () => {
  assert.match(page, /id:"dev-2"[^\n]+type:"plug"/);
  assert.match(page, /device-icon device-icon-plug/);
  assert.match(page, /switch\.floor_lamp/);
});

test("export page uses clear primary and secondary actions", () => {
  assert.match(exportPage, /Export to Home Assistant/);
  assert.match(exportPage, /Copy YAML to clipboard/);
  assert.match(exportPage, /✓ YAML copied/);
  assert.match(exportPage, /Download YAML file/);
  assert.match(exportPage, /Back to editor/);
  assert.match(exportPage, /Select device/);
  assert.match(exportPage, /role="status" aria-live="polite"/);
  assert.match(exportCss, /\.ha-export-topbar/);
  assert.match(exportCss, /\.yaml-panel/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/editor-actions-inspector.css", import.meta.url), "utf8");

test("project commands are consolidated under Actions", () => {
  assert.match(page, />Actions <span/);
  for (const label of ["Upload floor-plan image", "Import project", "Export project", "Export SVG", "Export for Home Assistant"]) {
    assert.match(page, new RegExp(label));
  }
  assert.doesNotMatch(page, />↑ Upload image</);
  assert.doesNotMatch(page, />↓ SVG</);
});

test("Home Assistant export exposes prerequisites", () => {
  assert.match(page, /disabled=!\{hasHaExport\}/);
  assert.match(page, /Configure an Entity ID first/);
  assert.match(page, />Select device</);
  assert.match(page, /startEntitySetup/);
  assert.match(css, /\.export-prerequisite/);
  assert.equal((page.match(/Export for Home Assistant/g) || []).length, 1, "export action should appear only in the Actions menu");
});

test("entity inspector prioritizes user-facing fields and progressive disclosure", () => {
  const alias = page.indexOf("Alias / title");
  const entity = page.indexOf("Entity ID");
  const internalId = page.indexOf("Internal device ID");
  assert.ok(alias >= 0 && entity > alias && internalId > entity);
  for (const section of ["Appearance", "Interactions", "Room behavior", "Advanced", "Danger zone"]) assert.match(page, new RegExp(section));
  assert.match(page, /Example: <code>light\.alarm_light<\/code>/);
});

test("destructive device removal requires confirmation", () => {
  assert.match(page, /window\.confirm\(`Delete \$\{currentDevice/);
  assert.match(css, /\.danger-zone/);
  assert.match(css, /focus-visible/);
});

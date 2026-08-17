import test from "node:test";
import assert from "node:assert/strict";

import { createHomeAssistantExport, validateHomeAssistantExport } from "../app/ha-export-workflow.mjs";
import { findDuplicateHaEntityIds, migrateProject, validateProjectV2 } from "../app/project-schema.mjs";

const haConfig = (entityId, title) => ({
  entityId,
  title,
  mode: "icon-and-label",
  label: { enabled: true, offsetY: 44, fontSizePx: 14, color: "#ffffff" },
  icon: "",
  iconSizePx: 40,
  tapAction: { action: "toggle" },
  holdAction: { action: "more-info" },
  doubleTapAction: { action: "none" },
});

const room = (id, x) => ({
  id,
  name: id,
  color: "#ffb86b",
  light: false,
  temperature: 70,
  points: [{ x, y: 0 }, { x: x + 400, y: 0 }, { x: x + 400, y: 400 }, { x, y: 400 }],
});

const duplicateProject = {
  schemaVersion: 2,
  name: "Duplicate entity QA",
  width: 1000,
  height: 500,
  image: "",
  rooms: [room("left", 0), room("right", 500)],
  devices: [
    { id: "light-1", roomId: "left", x: 200, y: 200, type: "light", ha: haConfig("light.alarm_light", "Left light") },
    { id: "light-2", roomId: "right", x: 700, y: 200, type: "light", ha: haConfig("light.alarm_light", "Right light") },
  ],
  homeAssistant: {
    background: "rooms-and-uploaded-image",
    overlays: [{ id: "overlay-light-1", entityId: "light.alarm_light", state: "on", roomIds: ["left"], fill: "#ffd166", opacity: 0.35, blurPx: 8, mappingSource: "inferred" }],
  },
};

test("finds normalized duplicate entity IDs across configured devices", () => {
  const candidate = structuredClone(duplicateProject);
  candidate.devices[1].ha.entityId = "  light.alarm_light  ";
  assert.deepEqual(findDuplicateHaEntityIds(candidate), ["light.alarm_light"]);
});

test("project validation marks every device participating in a duplicate", () => {
  const errors = validateProjectV2(duplicateProject);
  assert.ok(errors.some(error => /devices\[0\]\.ha\.entityId duplicates another device/.test(error)));
  assert.ok(errors.some(error => /devices\[1\]\.ha\.entityId duplicates another device/.test(error)));
});

test("migration preserves duplicate projects so the editor can surface and correct them", () => {
  const { project } = migrateProject(structuredClone(duplicateProject));
  assert.equal(project.devices.length, 2);
  assert.equal(project.devices[0].ha.entityId, "light.alarm_light");
  assert.equal(project.devices[1].ha.entityId, "light.alarm_light");
  assert.deepEqual(findDuplicateHaEntityIds(project), ["light.alarm_light"]);
});

test("Home Assistant export blocks duplicate Entity IDs with actionable device errors", () => {
  const validation = validateHomeAssistantExport(duplicateProject);
  assert.equal(validation.errors.filter(error => /Duplicate Entity ID light\.alarm_light/.test(error)).length, 2);
  assert.ok(validation.errors.some(error => error.startsWith("Device light-1:")));
  assert.ok(validation.errors.some(error => error.startsWith("Device light-2:")));

  const result = createHomeAssistantExport(duplicateProject);
  assert.equal(result.yaml, "");
  assert.equal(result.card, null);
});

test("unique entity IDs clear duplicate validation and export normally", () => {
  const unique = structuredClone(duplicateProject);
  unique.devices[1].ha.entityId = "light.guest_light";
  unique.homeAssistant.overlays.push({ id: "overlay-light-2", entityId: "light.guest_light", state: "on", roomIds: ["right"], fill: "#ffd166", opacity: 0.35, blurPx: 8, mappingSource: "inferred" });

  assert.deepEqual(findDuplicateHaEntityIds(unique), []);
  assert.ok(!validateProjectV2(unique).some(error => /duplicates another device/.test(error)));
  const result = createHomeAssistantExport(unique);
  assert.deepEqual(result.errors, []);
  assert.match(result.yaml, /entity: light\.alarm_light/);
  assert.match(result.yaml, /entity: light\.guest_light/);
});

test("duplicate detection applies across device types", () => {
  const mixed = structuredClone(duplicateProject);
  mixed.devices[1].type = "plug";
  mixed.devices[0].ha.entityId = "switch.shared_device";
  mixed.devices[1].ha.entityId = "switch.shared_device";
  assert.deepEqual(findDuplicateHaEntityIds(mixed), ["switch.shared_device"]);
});

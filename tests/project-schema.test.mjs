import assert from "node:assert/strict";
import test from "node:test";

import {
  createDefaultHaDeviceConfig,
  containingRoomIds,
  inferLightOverlay,
  migrateProject,
  upsertDeviceOverlay,
  validateHaDeviceConfig,
  validateProjectV2,
} from "../app/project-schema.mjs";

const v1 = {
  name: "Legacy plan",
  width: 1000,
  height: 620,
  image: "",
  rooms: [{ id: "living", name: "Living", color: "#ffb86b", light: false, temperature: 70, points: [{ x: 0, y: 0 }, { x: 900, y: 0 }, { x: 900, y: 500 }] }],
  devices: [{ id: "light-1", roomId: "living", x: 450, y: 250, type: "light" }],
};

test("migrates legacy projects to schema v2 without inventing entity IDs", () => {
  const { project, migrated } = migrateProject(v1);
  assert.equal(migrated, true);
  assert.equal(project.schemaVersion, 2);
  assert.deepEqual(project.homeAssistant, { background: "rooms-and-uploaded-image", overlays: [] });
  assert.equal(project.devices[0].ha, undefined);
  assert.deepEqual(validateProjectV2(project), []);
});

test("light defaults match the minimal Home Assistant MVP flow", () => {
  const config = createDefaultHaDeviceConfig("light");
  assert.equal(config.tapAction.action, "toggle");
  assert.equal(config.holdAction.action, "more-info");
  assert.equal(config.doubleTapAction.action, "none");
  assert.equal(config.mode, "icon-and-label");
});

test("infers a light overlay from device geometry", () => {
  const { project } = migrateProject(v1);
  project.devices[0].ha = { ...createDefaultHaDeviceConfig("light"), entityId: "light.alarm_light", title: "Alarm light" };
  assert.deepEqual(containingRoomIds(project, project.devices[0]), ["living"]);
  const inferred = inferLightOverlay(project, "light-1");
  assert.deepEqual(inferred.homeAssistant.overlays[0].roomIds, ["living"]);
  assert.equal(inferred.homeAssistant.overlays[0].mappingSource, "inferred");
});

test("does not guess when a light is outside or overlaps rooms", () => {
  const { project } = migrateProject(v1);
  project.devices[0].ha = { ...createDefaultHaDeviceConfig("light"), entityId: "light.alarm_light" };
  project.devices[0].x = 950;
  project.devices[0].y = 600;
  assert.deepEqual(inferLightOverlay(project, "light-1").homeAssistant.overlays, []);
  project.rooms.push({ ...project.rooms[0], id: "overlap" });
  project.devices[0].x = 450;
  project.devices[0].y = 250;
  assert.deepEqual(containingRoomIds(project, project.devices[0]), ["living", "overlap"]);
  assert.deepEqual(inferLightOverlay(project, "light-1").homeAssistant.overlays, []);
});

test("preserves an explicit overlay when geometry changes", () => {
  const { project } = migrateProject(v1);
  project.devices[0].ha = { ...createDefaultHaDeviceConfig("light"), entityId: "light.alarm_light" };
  const explicit = upsertDeviceOverlay(project, "light-1", "living");
  explicit.devices[0].x = 950;
  explicit.devices[0].y = 600;
  const reconciled = inferLightOverlay(explicit, "light-1");
  assert.deepEqual(reconciled.homeAssistant.overlays[0].roomIds, ["living"]);
  assert.equal(reconciled.homeAssistant.overlays[0].mappingSource, "explicit");
});

test("preserves Home Assistant metadata through export/import round trip", () => {
  const { project } = migrateProject(v1);
  project.devices[0].ha = {
    ...createDefaultHaDeviceConfig("light"),
    entityId: "light.alarm_light",
    title: "Alarm light",
    icon: "mdi:alarm-light",
  };
  const withOverlay = upsertDeviceOverlay(project, "light-1", "living");
  const serialized = JSON.stringify(withOverlay);
  const { project: restored } = migrateProject(JSON.parse(serialized));
  assert.equal(restored.devices[0].ha.entityId, "light.alarm_light");
  assert.equal(restored.devices[0].ha.tapAction.action, "toggle");
  assert.equal(restored.homeAssistant.overlays[0].entityId, "light.alarm_light");
  assert.deepEqual(restored.homeAssistant.overlays[0].roomIds, ["living"]);
});

test("reports actionable Home Assistant validation errors", () => {
  const config = {
    ...createDefaultHaDeviceConfig("light"),
    entityId: "Alarm Light",
    icon: "not-an-mdi-icon",
    iconSizePx: 400,
    tapAction: { action: "call-service" },
  };
  const errors = validateHaDeviceConfig(config, "devices[0].ha");
  assert(errors.some(error => error.includes("entityId")));
  assert(errors.some(error => error.includes("mdi:*")));
  assert(errors.some(error => error.includes("iconSizePx")));
  assert(errors.some(error => error.includes("tapAction")));
});

test("rejects dangling overlay room mappings", () => {
  const { project } = migrateProject(v1);
  project.devices[0].ha = { ...createDefaultHaDeviceConfig("light"), entityId: "light.alarm_light" };
  project.homeAssistant.overlays = [{ id: "overlay-1", entityId: "light.alarm_light", state: "on", roomIds: ["missing"], fill: "#ffd166", opacity: 0.35, blurPx: 8 }];
  const errors = validateProjectV2(project);
  assert(errors.some(error => error.includes("missing room")));
});

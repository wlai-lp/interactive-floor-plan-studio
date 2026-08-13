import test from "node:test";
import assert from "node:assert/strict";
import { createHomeAssistantExport, safeYamlFilename, validateHomeAssistantExport } from "../app/ha-export-workflow.mjs";

const project = {
  schemaVersion: 2,
  name: "Alarm Floor Plan",
  width: 1000,
  height: 500,
  image: "",
  rooms: [{ id: "living", name: "Living", color: "#ffaa00", light: false, temperature: 70, points: [{x:0,y:0},{x:1000,y:0},{x:1000,y:500},{x:0,y:500}] }],
  devices: [{ id: "light-1", roomId: "living", x: 250, y: 125, type: "light", ha: { entityId: "light.alarm_light", title: "Alarm light", mode: "icon-and-label", label: { enabled: true, offsetY: 20, fontSizePx: 12, color: "#ffffff" }, icon: "", iconSizePx: 24, tapAction: { action: "toggle" }, holdAction: { action: "more-info" }, doubleTapAction: { action: "none" } } }],
  homeAssistant: { background: "rooms-and-uploaded-image", overlays: [{ id: "overlay-1", entityId: "light.alarm_light", state: "on", roomIds: ["living"], fill: "#ffd27a", opacity: 0.45, blurPx: 4 }] },
};

test("valid export produces paste-ready native YAML", () => {
  const result = createHomeAssistantExport(project);
  assert.deepEqual(result.errors, []);
  assert.match(result.yaml, /type: picture-elements/);
  assert.match(result.yaml, /entity: light\.alarm_light/);
  assert.match(result.yaml, /pointer-events: none/);
  assert.equal(result.filename, "alarm-floor-plan-home-assistant.yaml");
  assert.ok(result.bytes > 0);
});

test("validation blocks broken canonical light behavior", () => {
  const broken = structuredClone(project);
  broken.devices[0].ha.tapAction = { action: "none" };
  broken.devices[0].ha.holdAction = { action: "none" };
  broken.homeAssistant.overlays = [];
  const validation = validateHomeAssistantExport(broken);
  assert.ok(validation.errors.some((error) => /tap action/i.test(error)));
  assert.ok(validation.errors.some((error) => /hold action/i.test(error)));
  assert.ok(validation.errors.some((error) => /mapped to a room overlay/i.test(error)));
});

test("safe filenames are deterministic", () => {
  assert.equal(safeYamlFilename("My Home / Floor Plan"), "my-home-floor-plan-home-assistant.yaml");
});

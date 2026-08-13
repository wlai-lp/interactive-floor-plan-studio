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
  broken.devices[0].ha.title = "";
  broken.devices[0].ha.tapAction = { action: "none" };
  broken.devices[0].ha.holdAction = { action: "none" };
  broken.homeAssistant.overlays = [];
  const validation = validateHomeAssistantExport(broken);
  assert.ok(validation.errors.some((error) => /device title/i.test(error)));
  assert.ok(validation.errors.some((error) => /tap action/i.test(error)));
  assert.ok(validation.errors.some((error) => /hold action/i.test(error)));
  assert.ok(validation.errors.some((error) => /mapped to a room overlay/i.test(error)));
});

test("safe filenames are deterministic", () => {
  assert.equal(safeYamlFilename("My Home / Floor Plan"), "my-home-floor-plan-home-assistant.yaml");
});

test("validation reports geometry correction paths", () => {
  const outside = structuredClone(project);
  outside.devices[0].x = 2000;
  assert.ok(validateHomeAssistantExport(outside).errors.some((error) => /inside a room/i.test(error)));

  const overlapping = structuredClone(project);
  overlapping.rooms.push({ ...structuredClone(project.rooms[0]), id: "overlap" });
  assert.ok(validateHomeAssistantExport(overlapping).errors.some((error) => /overlaps multiple rooms/i.test(error)));
});

test("power plug exports with overlay, icon, label, and controllable actions", () => {
  const withPlug = structuredClone(project);
  withPlug.devices.push({
    id: "plug-1", roomId: "living", x: 600, y: 300, type: "plug",
    ha: { entityId: "switch.smart_plug", title: "Smart plug", mode: "icon-and-label", label: { enabled: true, offsetY: 44, fontSizePx: 14, color: "#ffffff" }, icon: "", iconSizePx: 40, tapAction: { action: "toggle" }, holdAction: { action: "more-info" }, doubleTapAction: { action: "none" } },
  });
  withPlug.homeAssistant.overlays.push({ id: "overlay-plug-1", entityId: "switch.smart_plug", state: "on", roomIds: ["living"], fill: "#ffd166", opacity: 0.35, blurPx: 8 });
  const result = createHomeAssistantExport(withPlug);
  assert.deepEqual(result.errors, []);
  assert.match(result.yaml, /entity: switch\.smart_plug/);
  const plugElements = result.card.elements.filter((item) => item.entity === "switch.smart_plug");
  assert.deepEqual(plugElements.map((item) => item.type), ["state-icon", "state-label"]);
  assert.equal(plugElements[0].tap_action.action, "toggle");
  assert.equal(plugElements[0].hold_action.action, "more-info");
});

test("power plug readiness requires Room behavior and canonical display", () => {
  const broken = structuredClone(project);
  broken.devices[0] = {...broken.devices[0], id:"plug-1", type:"plug", ha:{...broken.devices[0].ha, entityId:"switch.smart_plug", mode:"state-label"}};
  broken.homeAssistant.overlays = [];
  const validation = validateHomeAssistantExport(broken);
  assert.ok(validation.errors.some((error) => /power plug must use Icon \+ label/i.test(error)));
  assert.ok(validation.errors.some((error) => /power plug must be mapped to a room overlay/i.test(error)));
});

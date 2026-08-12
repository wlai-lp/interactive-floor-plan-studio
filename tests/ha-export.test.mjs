import test from "node:test";
import assert from "node:assert/strict";
import { anchorToPercent, buildPictureElementsCard, generateHomeAssistantYaml, serializeFloorPlanSvg, svgDataUri } from "../app/ha-export.mjs";

const project = {
  schemaVersion: 2,
  name: "客廳 & Home",
  width: 1000,
  height: 500,
  image: "",
  rooms: [{ id: "living", name: "Living", color: "#ffaa00", points: [{x:0,y:0},{x:1000,y:0},{x:1000,y:500},{x:0,y:500}] }],
  devices: [{ id: "light-1", roomId: "living", x: 250, y: 125, type: "light", ha: { entityId: "light.alarm_light", title: "Alarm light", mode: "icon-and-label", icon: "", iconSizePx: 24, label: { enabled: true, offsetY: 20, fontSizePx: 12, color: "#ffffff" }, tapAction: { action: "toggle" }, holdAction: { action: "more-info" }, doubleTapAction: { action: "none" } } }],
  homeAssistant: { background: "rooms-and-uploaded-image", overlays: [{ id: "overlay-1", entityId: "light.alarm_light", state: "on", roomIds: ["living"], fill: "#ffd27a", opacity: 0.55, blurPx: 3 }] },
};

test("serializes sanitized standalone Unicode SVG and Base64 data URI", () => {
  const svg = serializeFloorPlanSvg(project);
  assert.match(svg, /^<svg xmlns=/);
  assert.match(svg, /preserveAspectRatio="xMidYMid meet"/);
  assert.match(svg, /客廳 &amp; Home/);
  assert.ok(svgDataUri(svg).startsWith("data:image/svg+xml;base64,"));
});

test("accepts only inline raster data URIs for the background", () => {
  const safe = structuredClone(project);
  safe.image = "data:image/png;base64,iVBORw0KGgo=";
  assert.match(serializeFloorPlanSvg(safe), /<image href="data:image\/png;base64,/);

  const unsafe = structuredClone(project);
  unsafe.image = "https://example.com/floor.svg";
  assert.throws(() => serializeFloorPlanSvg(unsafe), /inline PNG, JPEG, or WebP/);
});

test("converts anchors to viewBox percentages", () => {
  assert.deepEqual(anchorToPercent(project.devices[0], project), { left: 25, top: 25 });
});

test("canonical fixture orders overlay, icon, then label", () => {
  const card = buildPictureElementsCard(project, { lightingSvgDataUriByOverlayId: { "overlay-1": "data:image/svg+xml;base64,TElHSFQ=" } });
  assert.equal(card.elements[0].type, "conditional");
  assert.equal(card.elements[0].conditions[0].entity, "light.alarm_light");
  assert.equal(card.elements[0].conditions[0].state, "on");
  assert.equal(card.elements[0].elements[0].style["pointer-events"], "none");
  assert.equal(card.elements[0].elements[0].style.transform, "translate(-50%, -50%)");
  assert.equal(card.elements[1].type, "state-icon");
  assert.equal(card.elements[1].entity, "light.alarm_light");
  assert.equal(card.elements[1].tap_action.action, "toggle");
  assert.equal(card.elements[1].hold_action.action, "more-info");
  assert.equal(card.elements[2].type, "state-label");
  assert.equal(card.elements[2].entity, "light.alarm_light");
  assert.notEqual(card.image, card.elements[0].elements[0].image);
});

test("YAML output is deterministic and keeps entity IDs unescaped", () => {
  const options = { lightingSvgDataUriByOverlayId: { "overlay-1": "data:image/svg+xml;base64,TElHSFQ=" } };
  const first = generateHomeAssistantYaml(project, options);
  const second = generateHomeAssistantYaml(structuredClone(project), options);
  assert.equal(first, second);
  assert.match(first, /type: picture-elements/);
  assert.match(first, /entity: light\.alarm_light/);
  assert.match(first, /tap_action:\n\s+action: toggle/);
  assert.match(first, /hold_action:\n\s+action: more-info/);
  assert.match(first, /pointer-events: none/);
  assert.doesNotMatch(first, /token|password|authorization/i);
});

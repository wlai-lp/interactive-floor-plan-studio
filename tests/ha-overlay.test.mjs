import test from "node:test";
import assert from "node:assert/strict";
import { buildOverlayDataUri, buildOverlaySvg } from "../app/ha-overlay.mjs";
import { buildHomeAssistantCardWithOverlays, generateHomeAssistantYamlWithOverlays } from "../app/ha-lighting-export.mjs";

const project = {
  schemaVersion: 2,
  name: "Overlay fixture",
  width: 1000,
  height: 500,
  image: "",
  rooms: [
    { id: "living", color: "#ffaa00", points: [{x:0,y:0},{x:600,y:0},{x:600,y:500},{x:0,y:500}] },
    { id: "hall", color: "#00aaff", points: [{x:600,y:0},{x:1000,y:0},{x:1000,y:500},{x:600,y:500}] },
  ],
  devices: [
    { id: "light-1", roomId: "living", x: 300, y: 250, type: "light", ha: { entityId: "light.alarm_light", mode: "icon-and-label", icon: "", iconSizePx: 24, title: "Alarm", label: { enabled: true, offsetY: 30, fontSizePx: 12, color: "#ffffff" }, tapAction: { action: "toggle" }, holdAction: { action: "more-info" }, doubleTapAction: { action: "none" } } },
    { id: "light-2", roomId: "hall", x: 800, y: 250, type: "light", ha: { entityId: "light.hall", mode: "state-icon", icon: "", iconSizePx: 24, title: "Hall", label: { enabled: false, offsetY: 30, fontSizePx: 12, color: "#ffffff" }, tapAction: { action: "toggle" }, holdAction: { action: "none" }, doubleTapAction: { action: "none" } } },
  ],
  homeAssistant: { background: "rooms-and-uploaded-image", overlays: [
    { id: "overlay-light", entityId: "light.alarm_light", state: "on", roomIds: ["living"], fill: "#ffd27a", opacity: 0.45, blurPx: 4 },
    { id: "overlay-hall", entityId: "light.hall", state: "on", roomIds: ["hall"], fill: "#99ddff", opacity: 0.35, blurPx: 0 },
  ] },
};

const overlay = project.homeAssistant.overlays[0];

test("overlay SVG uses the same full canvas and complete room geometry", () => {
  const svg = buildOverlaySvg(project, overlay);
  assert.match(svg, /viewBox="0 0 1000 500"/);
  assert.match(svg, /preserveAspectRatio="xMidYMid meet"/);
  assert.match(svg, /data-room="living"/);
  assert.match(svg, /points="0,0 600,0 600,500 0,500"/);
  assert.match(svg, /fill="#ffd27a"/);
  assert.match(svg, /fill-opacity="0.45"/);
  assert.match(svg, /feGaussianBlur stdDeviation="4"/);
});

test("overlay export produces a distinct SVG Base64 asset", () => {
  assert.match(buildOverlayDataUri(project, overlay), /^data:image\/svg\+xml;base64,/);
});

test("one overlay can cover multiple full room polygons", () => {
  const svg = buildOverlaySvg(project, { ...overlay, roomIds: ["living", "hall"] });
  assert.equal((svg.match(/<polygon /g) || []).length, 2);
  assert.match(svg, /data-room="hall"/);
});

test("multiple light overlays are emitted before interactive controls", () => {
  const card = buildHomeAssistantCardWithOverlays(project);
  assert.equal(card.elements[0].type, "conditional");
  assert.equal(card.elements[0].conditions[0].entity, "light.alarm_light");
  assert.equal(card.elements[1].type, "conditional");
  assert.equal(card.elements[1].conditions[0].entity, "light.hall");
  assert.equal(card.elements[0].elements[0].style["pointer-events"], "none");
  assert.equal(card.elements[1].elements[0].style["pointer-events"], "none");
  assert.equal(card.elements[2].type, "state-icon");
  assert.notEqual(card.image, card.elements[0].elements[0].image);
  assert.notEqual(card.elements[0].elements[0].image, card.elements[1].elements[0].image);
});

test("generated YAML uses native on-state conditionals and no custom dependency", () => {
  const yaml = generateHomeAssistantYamlWithOverlays(project);
  assert.equal((yaml.match(/type: conditional/g) || []).length, 2);
  assert.match(yaml, /entity: light\.alarm_light\n\s+state: "on"/);
  assert.match(yaml, /pointer-events: none/);
  assert.doesNotMatch(yaml, /card-mod|custom:|hacs|template:/i);
});

test("invalid or dangling room mappings fail closed", () => {
  assert.throws(() => buildOverlaySvg(project, { ...overlay, roomIds: ["missing"] }), /missing room/);
  assert.throws(() => buildOverlaySvg(project, { ...overlay, fill: "red" }), /hex color/);
  assert.throws(() => buildOverlaySvg(project, { ...overlay, opacity: 2 }), /between 0 and 1/);
});

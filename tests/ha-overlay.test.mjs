import test from "node:test";
import assert from "node:assert/strict";
import { buildOverlayDataUri, buildOverlaySvg } from "../app/ha-overlay.mjs";

const project = {
  width: 1000,
  height: 500,
  rooms: [
    { id: "living", points: [{x:0,y:0},{x:600,y:0},{x:600,y:500},{x:0,y:500}] },
    { id: "hall", points: [{x:600,y:0},{x:1000,y:0},{x:1000,y:500},{x:600,y:500}] },
  ],
};

const overlay = { id: "overlay-light", entityId: "light.alarm_light", state: "on", roomIds: ["living"], fill: "#ffd27a", opacity: 0.45, blurPx: 4 };

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

test("invalid or dangling room mappings fail closed", () => {
  assert.throws(() => buildOverlaySvg(project, { ...overlay, roomIds: ["missing"] }), /missing room/);
  assert.throws(() => buildOverlaySvg(project, { ...overlay, fill: "red" }), /hex color/);
  assert.throws(() => buildOverlaySvg(project, { ...overlay, opacity: 2 }), /between 0 and 1/);
});

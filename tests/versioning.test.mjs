import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { bumpForTitle, isConventionalTitle, nextVersion } from "../scripts/versioning.mjs";
import { toggleLightForDevice } from "../app/project-state.mjs";

test("validates supported Conventional Commit titles", () => {
  assert.equal(isConventionalTitle("feat: add interactions"), true);
  assert.equal(isConventionalTitle("fix(svg): expand hit target"), true);
  assert.equal(isConventionalTitle("Update things"), false);
});

test("maps titles to semantic version bumps", () => {
  assert.equal(bumpForTitle("feat: add interactions"), "minor");
  assert.equal(bumpForTitle("fix: correct cursor"), "patch");
  assert.equal(bumpForTitle("feat!: redesign project format"), "major");
});

test("calculates next semantic versions", () => {
  assert.equal(nextVersion("1.2.3", "patch"), "1.2.4");
  assert.equal(nextVersion("1.2.3", "minor"), "1.3.0");
  assert.equal(nextVersion("1.2.3", "major"), "2.0.0");
});

test("light device activation alternates its room state once", () => {
  const device = { roomId: "living", type: "light" };
  const off = { rooms: [{ id: "living", light: false }] };
  const on = toggleLightForDevice(off, device);
  assert.equal(on.rooms[0].light, true);
  assert.equal(toggleLightForDevice(on, device).rooms[0].light, false);
});

test("sensor activation does not alter light state", () => {
  const project = { rooms: [{ id: "living", light: false }] };
  assert.equal(toggleLightForDevice(project, { roomId: "living", type: "sensor" }), project);
});

test("device SVG exposes one accessible full-icon interaction target", async () => {
  const [page, styles] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /role=\{interactive\?"button"/);
  assert.match(page, /aria-pressed=\{interactive\?Boolean\(room\?\.light\)/);
  assert.match(page, /e\.key==="Enter"\|\|e\.key===" "/);
  assert.match(styles, /\.device-dot\.interactive\{cursor:pointer\}/);
  assert.match(styles, /\.device-dot \.device-hit-area\{[^}]*pointer-events:all/);
});

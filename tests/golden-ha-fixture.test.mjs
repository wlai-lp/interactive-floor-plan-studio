import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("canonical Home Assistant fixture preserves overlay interaction contract", async () => {
  const yaml = await readFile(new URL("../docs/home-assistant/golden-picture-elements.yml", import.meta.url), "utf8");
  const overlayIndex = yaml.indexOf("type: conditional");
  const iconIndex = yaml.indexOf("type: state-icon");
  const labelIndex = yaml.indexOf("type: state-label");

  assert.ok(overlayIndex >= 0);
  assert.ok(iconIndex > overlayIndex);
  assert.ok(labelIndex > iconIndex);
  assert.match(yaml, /entity: light\.alarm_light/);
  assert.match(yaml, /pointer-events: none/);
  assert.match(yaml, /transform: "translate\(-50%, -50%\)"/);
  assert.match(yaml, /tap_action:\n\s+action: toggle/);
  assert.match(yaml, /hold_action:\n\s+action: more-info/);
});

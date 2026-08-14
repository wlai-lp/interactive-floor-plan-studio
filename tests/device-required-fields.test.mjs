import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getMissingRequiredHaDeviceFields, REQUIRED_HA_DEVICE_FIELDS } from "../app/device-required-fields.mjs";

const enhancer = await readFile(new URL("../app/device-required-field-enhancer.tsx", import.meta.url), "utf8");

test("title and entity ID are the initial required Home Assistant device fields", () => {
  assert.deepEqual(REQUIRED_HA_DEVICE_FIELDS.map((field) => field.key), ["title", "entityId"]);
  assert.deepEqual(getMissingRequiredHaDeviceFields({ title: "", entityId: "" }).map((field) => field.key), ["title", "entityId"]);
  assert.deepEqual(getMissingRequiredHaDeviceFields({ title: "Kitchen light", entityId: "light.kitchen" }), []);
});

test("required-field UX is registry-driven and Quick Start focuses title first", () => {
  assert.match(enhancer, /for \(const field of REQUIRED_HA_DEVICE_FIELDS\)/);
  assert.match(enhancer, /classList\.toggle\("invalid"/);
  assert.match(enhancer, /input\.required = true/);
  assert.match(enhancer, /input\.id = "ha-title"/);
  assert.match(enhancer, /Configure this device/);
  assert.match(enhancer, /querySelector<HTMLInputElement>\("#ha-title"\)\?\.focus\(\)/);
});

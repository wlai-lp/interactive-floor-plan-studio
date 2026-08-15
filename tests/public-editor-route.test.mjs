import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const publicPage = fs.readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const editorPage = fs.readFileSync(new URL("../app/editor/page.tsx", import.meta.url), "utf8");
const exportPage = fs.readFileSync(new URL("../app/home-assistant-export/page.tsx", import.meta.url), "utf8");
const editorSource = fs.readFileSync(new URL("../app/editor.tsx", import.meta.url), "utf8");

test("root route is reserved for the public site and links to the editor", () => {
  assert.match(publicPage, /href="\/editor"/);
  assert.doesNotMatch(publicPage, /dynamic\(\(\) => import\("\.\/editor"\)/);
});

test("dedicated editor route loads the existing editor implementation", () => {
  assert.match(editorPage, /import\("\.\.\/editor"\)/);
  assert.match(editorPage, /ssr: false/);
});

test("route move preserves the existing local project storage key", () => {
  assert.match(editorSource, /const STORAGE_KEY = "floor-plan-studio-project"/);
});

test("Home Assistant export returns to editor and preserves device deep links", () => {
  assert.match(exportPage, /href="\/editor"/);
  assert.match(exportPage, /href=\{`\/editor\?device=\$\{encodeURIComponent\(deviceId\)\}`\}/);
  assert.doesNotMatch(exportPage, /href=\{`\/\?device=/);
});

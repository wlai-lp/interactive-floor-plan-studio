import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const publicPage = fs.readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

test("initial public route does not introduce account or pricing gates", () => {
  assert.doesNotMatch(publicPage, /sign in|pricing|account required/i);
  assert.match(publicPage, /Open Editor/);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("early user experience article is published and keeps the interview ratings", async () => {
  const registry = await read("app/blog/articles.ts");
  const article = await read("app/blog/early-user-experience/page.tsx");

  assert.match(registry, /slug: "early-user-experience"/);
  assert.match(registry, /author: "Early HAFloorplan User"/);
  assert.match(registry, /category: "User Stories"/);
  assert.match(registry, /status: "published"/);

  assert.match(article, /Ease of use: B/);
  assert.match(article, /Actual result: C/);
  assert.match(article, /Home Assistant experience: B/);
  assert.match(article, /rectangle drawing tool/i);
  assert.match(article, /Snap rooms together/i);
  assert.match(article, /Display the room name/i);
  assert.match(article, /generated YAML worked without an issue/i);
  assert.match(article, /export const metadata/);
});

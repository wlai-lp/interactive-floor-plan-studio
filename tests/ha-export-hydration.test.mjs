import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/home-assistant-export/page.tsx", import.meta.url), "utf8");

test("Home Assistant export defers browser storage reads until after hydration", () => {
  assert.match(page, /useState<ProjectLoadState>\(INITIAL_PROJECT_STATE\)/);
  assert.match(page, /useEffect\(\(\) => \{[\s\S]*localStorage\.getItem\(STORAGE_KEY\)/);
  assert.doesNotMatch(page, /useState\(\(\) =>[\s\S]*localStorage/);
  assert.doesNotMatch(page, /typeof window === ["']undefined["']/);
  assert.match(page, /loaded && loadError/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("marketing navigation keeps Open Editor pointed at the dedicated app route", async () => {
  const shell = await read("components/marketing/MarketingShell.tsx");
  assert.match(shell, /href="\/editor">Editor/);
  assert.match(shell, /marketing-cta[^>]*href="\/editor"|href="\/editor"[^>]*marketing-cta/);
  assert.match(shell, /href="\/blog">Blog/);
  assert.match(shell, /href="\/about">About/);
});

test("public shell includes accessibility and independence disclosures", async () => {
  const shell = await read("components/marketing/MarketingShell.tsx");
  assert.match(shell, /Skip to content/);
  assert.match(shell, /id="main-content"/);
  assert.match(shell, /not affiliated with or endorsed by Home Assistant or Nabu Casa/);
});

test("editor and Home Assistant export remain outside the marketing shell", async () => {
  const editor = await read("app/editor/page.tsx");
  const exportPage = await read("app/home-assistant-export/page.tsx");
  assert.doesNotMatch(editor, /MarketingShell|MarketingHeader|MarketingFooter/);
  assert.doesNotMatch(exportPage, /MarketingShell|MarketingHeader|MarketingFooter/);
});

test("root page uses the shared public shell", async () => {
  const home = await read("app/page.tsx");
  assert.match(home, /MarketingShell/);
  assert.match(home, /href="\/editor"/);
});

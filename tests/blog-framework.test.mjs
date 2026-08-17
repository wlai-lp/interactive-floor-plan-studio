import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("blog routes use the shared marketing shell", async () => {
  const layout = await read("app/blog/layout.tsx");
  assert.match(layout, /MarketingShell/);
  assert.match(layout, /children/);
});

test("blog registry has publication state and a published-only index", async () => {
  const registry = await read("app/blog/articles.ts");
  const index = await read("app/blog/page.tsx");

  assert.match(registry, /BlogArticleStatus = "draft" \| "published"/);
  assert.match(registry, /status: BlogArticleStatus/);
  assert.match(registry, /publishedBlogArticles/);
  assert.match(registry, /article\.status === "published"/);
  assert.match(registry, /getBlogArticle/);
  assert.match(index, /publishedBlogArticles/);
});

test("blog index exposes metadata and stable article routes", async () => {
  const index = await read("app/blog/page.tsx");
  const registry = await read("app/blog/articles.ts");

  assert.match(index, /export const metadata/);
  assert.match(index, /\/blog\/\$\{article\.slug\}/);
  assert.match(index, /article\.author/);
  assert.match(registry, /slug: "getting-started"/);
  assert.match(registry, /category:/);
  assert.match(registry, /tags:/);
});

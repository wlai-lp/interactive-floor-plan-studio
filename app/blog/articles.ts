export type BlogArticleStatus = "draft" | "published";

export type BlogArticle = {
  slug: string;
  title: string;
  description: string;
  published: string;
  updated?: string;
  author: string;
  category: string;
  tags: string[];
  status: BlogArticleStatus;
};

export const blogArticles: BlogArticle[] = [
  {
    slug: "getting-started",
    title: "Getting Started with HAFloorplan",
    description: "Create a working Home Assistant Picture Elements floor plan with a light or switch in five simple steps.",
    published: "2026-08-15",
    updated: "2026-08-16",
    author: "HAFloorplan",
    category: "Getting Started",
    tags: ["Home Assistant", "Picture Elements", "Floor Plan", "YAML"],
    status: "published",
  },
];

export const publishedBlogArticles = blogArticles
  .filter((article) => article.status === "published")
  .sort((a, b) => b.published.localeCompare(a.published));

export function getBlogArticle(slug: string) {
  return blogArticles.find((article) => article.slug === slug);
}

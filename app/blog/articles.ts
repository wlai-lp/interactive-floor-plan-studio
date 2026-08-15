export type BlogArticle = {
  slug: string;
  title: string;
  description: string;
  published: string;
  updated?: string;
  author: string;
  category: string;
  tags: string[];
};

export const blogArticles: BlogArticle[] = [
  {
    slug: "getting-started",
    title: "Getting Started with HAFloorplan",
    description: "Create a working Home Assistant Picture Elements floor plan with a light or switch in five simple steps.",
    published: "2026-08-15",
    author: "HAFloorplan",
    category: "Getting Started",
    tags: ["Home Assistant", "Picture Elements", "Floor Plan", "YAML"],
  },
];

import type { Metadata } from "next";
import Link from "next/link";
import { blogArticles } from "./articles";
import "./blog.css";

export const metadata: Metadata = {
  title: "HAFloorplan Articles",
  description: "Guides for creating Home Assistant floor-plan dashboards with HAFloorplan.",
};

export default function BlogPage() {
  return <main className="blog-shell">
    <header className="blog-hero">
      <Link className="blog-back" href="/">← HAFloorplan</Link>
      <span className="blog-eyebrow">ARTICLES</span>
      <h1>Build a better Home Assistant floor plan</h1>
      <p>Practical guides that focus on the task while HAFloorplan handles the Picture Elements YAML.</p>
    </header>
    <section className="article-grid" aria-label="HAFloorplan articles">
      {blogArticles.map((article) => <article className="article-card" key={article.slug}>
        <div className="article-meta"><span>{article.category}</span><time dateTime={article.published}>{article.published}</time></div>
        <h2><Link href={`/blog/${article.slug}`}>{article.title}</Link></h2>
        <p>{article.description}</p>
        <Link className="read-link" href={`/blog/${article.slug}`}>Read article →</Link>
      </article>)}
    </section>
  </main>;
}

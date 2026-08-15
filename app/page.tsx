import Link from "next/link";
import { MarketingShell } from "../components/marketing/MarketingShell";

export default function Page() {
  return (
    <MarketingShell>
      <section className="public-intro">
        <div className="marketing-container public-intro-inner">
          <p className="public-eyebrow">HA FLOORPLAN</p>
          <h1>Build native Home Assistant floor plans visually.</h1>
          <p>
            The public HAFloorplan.com experience is being built here. The working MVP editor now lives at its permanent application route so the landing page, blog, and About experience can evolve independently.
          </p>
          <div className="public-actions">
            <Link className="public-primary" href="/editor">Open Editor</Link>
            <Link className="public-secondary" href="/blog">Explore the Blog</Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}

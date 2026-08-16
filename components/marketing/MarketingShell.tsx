import Link from "next/link";
import type { ReactNode } from "react";
import { HAFloorplanLogo } from "../brand/HAFloorplanLogo";
import "./marketing-shell.css";

export function MarketingHeader() {
  return (
    <header className="marketing-header">
      <div className="marketing-container marketing-header-inner">
        <Link className="marketing-brand" href="/" aria-label="HAFloorplan home">
          <HAFloorplanLogo />
        </Link>
        <nav className="marketing-nav" aria-label="Primary navigation">
          <Link href="/blog">Blog</Link>
          <Link href="/about">About</Link>
          <Link className="marketing-cta" href="/editor">Open Editor</Link>
        </nav>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="marketing-container marketing-footer-grid">
        <div className="marketing-footer-intro">
          <Link className="marketing-brand" href="/" aria-label="HAFloorplan home">
            <HAFloorplanLogo />
          </Link>
          <p>Build native Home Assistant floor-plan dashboards visually.</p>
        </div>
        <div>
          <h2>Product</h2>
          <Link href="/editor">Open Editor</Link>
          <Link href="/blog/getting-started">Getting Started</Link>
        </div>
        <div>
          <h2>Learn</h2>
          <Link href="/blog">Blog</Link>
          <a href="https://www.home-assistant.io/dashboards/picture-elements/" target="_blank" rel="noreferrer">Picture Elements</a>
        </div>
        <div>
          <h2>Project</h2>
          <Link href="/about">About</Link>
          <a href="https://github.com/wlai-lp/interactive-floor-plan-studio" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://github.com/wlai-lp/interactive-floor-plan-studio/issues" target="_blank" rel="noreferrer">Report a bug</a>
        </div>
      </div>
      <div className="marketing-container marketing-footer-bottom">
        <p>HAFloorplan is an independent companion project and is not affiliated with or endorsed by Home Assistant or Nabu Casa.</p>
        <p>© {new Date().getFullYear()} HAFloorplan</p>
      </div>
    </footer>
  );
}

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="marketing-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <MarketingHeader />
      <main id="main-content" className="marketing-main">{children}</main>
      <MarketingFooter />
    </div>
  );
}

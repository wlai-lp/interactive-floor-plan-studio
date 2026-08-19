import type { Metadata } from "next";
import Link from "next/link";
import "./about.css";

export const metadata: Metadata = {
  title: "About HAFloorplan",
  description: "Why HAFloorplan exists, the product principles behind it, and how it helps Home Assistant users build native Picture Elements floor-plan dashboards visually.",
};

const principles = [
  {
    title: "Visual before technical",
    copy: "The editor should let you work with rooms and devices directly instead of making coordinates, SVG details, and YAML the starting point.",
  },
  {
    title: "Minimum input, working output",
    copy: "Ask users only for the information HAFloorplan cannot safely infer, then generate the native Home Assistant configuration for them.",
  },
  {
    title: "Native Home Assistant runtime",
    copy: "HAFloorplan is an authoring companion. The exported dashboard uses Home Assistant Picture Elements rather than a proprietary dashboard runtime.",
  },
  {
    title: "Local-first and privacy-conscious",
    copy: "The current MVP keeps project work in the browser, works without an account, and does not ask for Home Assistant credentials or tokens.",
  },
  {
    title: "No required custom card",
    copy: "The normal MVP workflow does not require HACS, a custom Lovelace card, or a custom JavaScript resource at runtime.",
  },
  {
    title: "Stay focused",
    copy: "The goal is the shortest path to a working Home Assistant floor-plan dashboard—not architectural-grade CAD or interior-design fidelity.",
  },
];

export default function AboutPage() {
  return (
    <div className="about-page">
      <section className="about-hero marketing-container" aria-labelledby="about-title">
        <span className="about-eyebrow">ABOUT HAFLOORPLAN</span>
        <h1 id="about-title">The visual authoring layer for Home Assistant Picture Elements.</h1>
        <p className="about-lede">
          HAFloorplan helps Home Assistant users turn the layout they already understand—their home—into a native interactive dashboard without manually assembling every coordinate and YAML element.
        </p>
        <div className="about-actions">
          <Link className="about-primary" href="/editor">Open Editor</Link>
          <Link className="about-secondary" href="/blog/getting-started">Read Getting Started</Link>
        </div>
      </section>

      <section className="about-section marketing-container about-story" aria-labelledby="why-title">
        <div>
          <span className="about-kicker">WHY IT EXISTS</span>
          <h2 id="why-title">Picture Elements is powerful. Building one should not require a weekend.</h2>
        </div>
        <div className="about-story-copy">
          <p>Home Assistant includes the Picture Elements card out of the box. It is one of the most flexible ways to create a floor-plan dashboard that reflects the way your home actually looks and behaves.</p>
          <p>But creating a floor plan tailored to your home usually means solving several different problems at once: crafting the floor-plan layout, mapping the right Home Assistant entities, positioning each device, defining state-driven room behavior, and building the YAML that ties all of it together.</p>
          <p>Even for a seasoned Home Assistant user with the right technical know-how, the initial setup can easily consume a weekend. For everyone else, the bar is even higher. That complexity keeps many people from ever trying one of Home Assistant's most compelling built-in dashboard capabilities.</p>
          <p>HAFloorplan exists to lower that bar. The goal is to let anyone get a taste of what Picture Elements can do: create a simple floor plan that represents their home, place and connect devices visually, and generate the native Home Assistant configuration needed to bring it to life.</p>
          <p className="about-pullquote">Visual editor in. Native Picture Elements out.</p>
        </div>
      </section>

      <section className="about-section marketing-container" aria-labelledby="principles-title">
        <header className="about-section-heading">
          <span className="about-kicker">PRODUCT PRINCIPLES</span>
          <h2 id="principles-title">What we believe</h2>
          <p>HAFloorplan should remove authoring friction while preserving the strengths of Home Assistant itself.</p>
        </header>
        <div className="about-principles">
          {principles.map((principle) => (
            <article className="about-card" key={principle.title}>
              <h3>{principle.title}</h3>
              <p>{principle.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-section marketing-container about-boundary" aria-labelledby="boundary-title">
        <header className="about-section-heading">
          <span className="about-kicker">A FOCUSED COMPANION</span>
          <h2 id="boundary-title">What HAFloorplan is—and what it is not</h2>
        </header>
        <div className="about-boundary-grid">
          <div className="about-boundary-card about-is">
            <h3>HAFloorplan is</h3>
            <ul>
              <li>A lightweight visual authoring companion for Home Assistant.</li>
              <li>A way to draw the rooms needed for a dashboard and place devices where they physically live.</li>
              <li>A generator for native Picture Elements configuration and floor-plan assets.</li>
              <li>A project you can return to when the layout or device placement changes.</li>
            </ul>
          </div>
          <div className="about-boundary-card">
            <h3>HAFloorplan is not</h3>
            <ul>
              <li>A replacement for Home Assistant.</li>
              <li>A general-purpose CAD, architecture, or interior-design application.</li>
              <li>A proprietary smart-home dashboard runtime.</li>
              <li>A requirement to install a custom card just to use the normal MVP export.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="about-section marketing-container about-story" aria-labelledby="developer-title">
        <div>
          <span className="about-kicker">THE DEVELOPER</span>
          <h2 id="developer-title">Built by a Home Assistant user, for Home Assistant users.</h2>
        </div>
        <div className="about-story-copy">
          <p>HAFloorplan started from a simple frustration: creating an interactive floor-plan dashboard in Home Assistant required too much manual configuration. I built HAFloorplan to explore whether that process could be made visual, simple, and accessible without requiring users to become YAML or frontend experts.</p>
          <p>Along the way, the project has also become an exploration of modern AI-assisted software development—from product design and architecture to testing, deployment, and iteration.</p>
        </div>
      </section>

      <section className="about-section marketing-container" aria-labelledby="thanks-title">
        <header className="about-section-heading">
          <span className="about-kicker">ACKNOWLEDGEMENTS</span>
          <h2 id="thanks-title">Built on ideas and tools that made this possible</h2>
          <p>These acknowledgements recognize inspiration and infrastructure. They do not imply sponsorship, partnership, or endorsement.</p>
        </header>
        <div className="about-ack-grid">
          <article className="about-card">
            <h3>Home Assistant</h3>
            <p>Home Assistant and its community created the platform, entity model, and native Picture Elements capability that HAFloorplan is designed to make easier to author.</p>
            <a href="https://www.home-assistant.io/dashboards/picture-elements/" target="_blank" rel="noreferrer">Explore Picture Elements ↗</a>
          </article>
          <article className="about-card">
            <h3>Floorplanner</h3>
            <p>Floorplanner is an inspiration and UX benchmark for approachable browser-based floor-plan editing. HAFloorplan is not affiliated with Floorplanner and is not based on or derived from Floorplanner.</p>
            <a href="https://floorplanner.com/" target="_blank" rel="noreferrer">Visit Floorplanner ↗</a>
          </article>
          <article className="about-card">
            <h3>Northflank</h3>
            <p>Northflank provides hosting and deployment infrastructure used to operate the public HAFloorplan application.</p>
          </article>
        </div>
      </section>

      <section className="about-section marketing-container about-transparency" aria-labelledby="independence-title">
        <div>
          <span className="about-kicker">INDEPENDENCE & TRANSPARENCY</span>
          <h2 id="independence-title">An independent companion project</h2>
        </div>
        <div>
          <p>HAFloorplan is an independent project and is not affiliated with or endorsed by Home Assistant or Nabu Casa.</p>
          <p>The current editor is local-first and can be used without an account. HAFloorplan does not need your Home Assistant credentials or access token to generate the MVP Picture Elements configuration.</p>
          <p>As the project evolves, public information should remain clear about what is available today versus what is still being explored. Sensitive infrastructure details and unapproved business-model plans do not belong on this page.</p>
          <p className="about-project-links">
            <a href="https://github.com/wlai-lp/interactive-floor-plan-studio" target="_blank" rel="noreferrer">View the project on GitHub ↗</a>
            <a href="https://github.com/wlai-lp/interactive-floor-plan-studio/issues" target="_blank" rel="noreferrer">Report a bug or suggest an improvement ↗</a>
          </p>
        </div>
      </section>

      <section className="about-final marketing-container" aria-labelledby="about-final-title">
        <span className="about-kicker">YOUR HOME. YOUR DEVICES. YOUR FLOOR PLAN.</span>
        <h2 id="about-final-title">Build the dashboard around the way you already understand your home.</h2>
        <p>Draw the rooms you need, place your devices, connect Home Assistant entities, and generate native Picture Elements configuration visually.</p>
        <Link className="about-primary" href="/editor">Open Editor</Link>
      </section>
    </div>
  );
}

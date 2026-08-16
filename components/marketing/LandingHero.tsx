import Link from "next/link";
import "./landing-hero.css";

function StaticProductPreview() {
  return (
    <div className="landing-static-product" aria-label="Static HAFloorplan editor to Home Assistant preview">
      <div className="landing-preview-card landing-preview-editor">
        <span className="landing-preview-label">VISUAL EDITOR</span>
        <div className="landing-preview-grid">
          <div className="landing-preview-room landing-preview-room-large">
            <span className="landing-preview-device" aria-hidden="true">●</span>
          </div>
          <div className="landing-preview-room landing-preview-room-small">
            <span className="landing-preview-plug" aria-hidden="true">⌁</span>
          </div>
        </div>
      </div>

      <span className="landing-preview-arrow" aria-hidden="true">→</span>

      <div className="landing-preview-card landing-preview-ha">
        <span className="landing-preview-label">HOME ASSISTANT</span>
        <div className="landing-preview-home">
          <div className="landing-preview-lit-room">
            <span className="landing-preview-bulb" aria-hidden="true">●</span>
          </div>
          <div className="landing-preview-output-room">
            <span className="landing-preview-plug" aria-hidden="true">⌁</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingHero() {
  return (
    <section className="landing-hero" aria-labelledby="landing-hero-title">
      <div className="marketing-container landing-hero-grid">
        <div className="landing-hero-copy">
          <p className="public-eyebrow">VISUAL FLOOR PLAN BUILDER FOR HOME ASSISTANT</p>
          <h1 id="landing-hero-title">Your Home Assistant Dashboard Should Look Like Your Home.</h1>
          <p className="landing-hero-lede">
            Turn a floor plan into an interactive Home Assistant dashboard—visually, privately, and without
            hand-writing YAML.
          </p>
          <div className="public-actions landing-hero-actions">
            <Link className="public-primary" href="/editor">Open Editor</Link>
          </div>
          <p className="landing-hero-proof">No account required · Your project stays in your browser</p>
        </div>

        <div className="landing-hero-visual">
          <StaticProductPreview />
        </div>
      </div>
    </section>
  );
}

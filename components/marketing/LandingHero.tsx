"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import HAFloorPlanHero from "../ha-floorplan/HAFloorPlanHero";
import "./landing-hero.css";

const HAFloorPlanPromo = dynamic(() => import("../ha-floorplan/HAFloorPlanPromo"), {
  ssr: false,
  loading: () => <div className="landing-demo-loading">Loading product demo…</div>,
});

function StaticHeroPreview() {
  return (
    <div className="landing-static-preview" aria-label="HAFloorplan workflow preview">
      <div className="landing-static-home">
        <span className="landing-static-room">Living room</span>
        <span className="landing-static-light" aria-hidden="true">●</span>
      </div>
      <p>Draw → Place → Connect → Export → Interact</p>
      <strong>Native Home Assistant Picture Elements out.</strong>
    </div>
  );
}

export function LandingHero() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!demoOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => closeRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDemoOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    };
  }, [demoOpen]);

  return (
    <>
      <section className="landing-hero" aria-labelledby="landing-hero-title">
        <div className="marketing-container landing-hero-grid">
          <div className="landing-hero-copy">
            <p className="public-eyebrow">VISUAL EDITOR → NATIVE PICTURE ELEMENTS</p>
            <h1 id="landing-hero-title">Your Home Assistant Dashboard Should Look Like Your Home.</h1>
            <p className="landing-hero-lede">
              Build an interactive floor plan visually. Draw rooms, place lights and switches where they belong,
              connect Home Assistant entities, and generate native Picture Elements YAML without positioning
              everything by hand.
            </p>
            <div className="public-actions landing-hero-actions">
              <Link className="public-primary" href="/editor">Open Editor</Link>
              <button
                ref={triggerRef}
                className="public-secondary landing-demo-trigger"
                type="button"
                onClick={() => setDemoOpen(true)}
                aria-haspopup="dialog"
              >
                ▶ Watch 30-second demo
              </button>
            </div>
            <p className="landing-hero-proof">No install · No HACS/custom card · Local-first MVP</p>
          </div>

          <div className="landing-hero-visual" aria-label="Short HAFloorplan product preview">
            {!demoOpen && !reduceMotion ? (
              <HAFloorPlanHero showSteps showBrand />
            ) : (
              <StaticHeroPreview />
            )}
          </div>
        </div>
      </section>

      {demoOpen && (
        <div className="landing-demo-backdrop" onMouseDown={() => setDemoOpen(false)}>
          <section
            className="landing-demo-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="landing-demo-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="landing-demo-toolbar">
              <div>
                <p className="public-eyebrow">HA FLOORPLAN</p>
                <h2 id="landing-demo-title">See the complete workflow</h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                className="landing-demo-close"
                aria-label="Close full product demo"
                onClick={() => setDemoOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="landing-demo-stage">
              {reduceMotion ? <StaticHeroPreview /> : <HAFloorPlanPromo showCaptions />}
            </div>
            <div className="landing-demo-footer">
              <p>Draw → Place → Connect → Export → use it in Home Assistant.</p>
              <Link className="public-primary" href="/editor">Open Editor</Link>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

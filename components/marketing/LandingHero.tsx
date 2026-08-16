"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { useEffect, useRef, useState } from "react";
import HAFloorPlanHero from "../ha-floorplan/HAFloorPlanHero";
import "./landing-hero.css";

type PromoComponent = ComponentType<{ showCaptions?: boolean }>;

function StaticHeroPreview() {
  return (
    <div className="landing-static-preview" aria-label="HAFloorplan workflow preview">
      <div className="landing-static-home">
        <span className="landing-static-room">Living room</span>
        <span className="landing-static-light" aria-hidden="true">●</span>
      </div>
      <p>Draw → Place → Connect → Export → Add to HA → Interact</p>
      <strong>Native Home Assistant Picture Elements out.</strong>
    </div>
  );
}

export function LandingHero() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [promo, setPromo] = useState<PromoComponent | null>(null);
  const [promoError, setPromoError] = useState("");
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const openDemo = async () => {
    setPromoError("");
    setDemoOpen(true);
    if (reduceMotion !== false || promo) return;
    try {
      const module = await import("../ha-floorplan/HAFloorPlanPromo");
      setPromo(() => module.default);
    } catch {
      setPromoError("The full product demo could not be loaded. Close this dialog and try again.");
    }
  };

  useEffect(() => {
    if (!demoOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => closeRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDemoOpen(false);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    };
  }, [demoOpen]);

  const Promo = promo;

  return (
    <>
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
              <button
                ref={triggerRef}
                className="public-secondary landing-demo-trigger"
                type="button"
                onClick={openDemo}
                aria-haspopup="dialog"
              >
                ▶ Watch 30-second demo
              </button>
            </div>
            <p className="landing-hero-proof">No account required · Your project stays in your browser</p>
          </div>

          <div className="landing-hero-visual" aria-label="Short HAFloorplan product preview">
            {!demoOpen && reduceMotion === false ? <HAFloorPlanHero showSteps showBrand /> : <StaticHeroPreview />}
          </div>
        </div>
      </section>

      {demoOpen && (
        <div className="landing-demo-backdrop" onMouseDown={() => setDemoOpen(false)}>
          <section
            ref={dialogRef}
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
              {reduceMotion !== false ? (
                <StaticHeroPreview />
              ) : promoError ? (
                <p className="landing-demo-loading" role="alert">{promoError}</p>
              ) : Promo ? (
                <Promo showCaptions />
              ) : (
                <div className="landing-demo-loading" role="status">Loading product demo…</div>
              )}
            </div>
            <div className="landing-demo-footer">
              <p>Draw → Place → Connect → Export → Add to HA → Interact.</p>
              <Link className="public-primary" href="/editor">Open Editor</Link>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import type { ComponentType, MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import HAFloorPlanHero from "../ha-floorplan/HAFloorPlanHero";
import "./landing-hero.css";

type PromoComponent = ComponentType<{ showCaptions?: boolean }>;
type DemoSession = { Promo: PromoComponent | null } | null;

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
  // A demo session is created only by the trusted Watch demo click below.
  // There is intentionally no independent `demoOpen` boolean that can drift
  // to true through preloading, restored state, or programmatic interaction.
  const [demoSession, setDemoSession] = useState<DemoSession>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  const demoOpen = demoSession !== null;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  // A restored/back-forward-cached landing page should always return with the
  // optional product tour closed. Opening it remains an explicit user action.
  useEffect(() => {
    const closeRestoredDemo = (event: PageTransitionEvent) => {
      if (event.persisted) setDemoSession(null);
    };
    window.addEventListener("pageshow", closeRestoredDemo);
    return () => window.removeEventListener("pageshow", closeRestoredDemo);
  }, []);

  const openDemo = async (event: ReactMouseEvent<HTMLButtonElement>) => {
    // React/programmatic events are not allowed to open the full product tour.
    if (!event.nativeEvent.isTrusted || demoLoading || demoSession) return;

    setPromoError("");

    if (reduceMotion !== false) {
      setDemoSession({ Promo: null });
      return;
    }

    setDemoLoading(true);
    try {
      // Critical: the full 33.5-second promo is imported only inside this
      // trusted user-event handler. It is not imported during page startup.
      const module = await import("../ha-floorplan/HAFloorPlanPromo");
      setDemoSession({ Promo: module.default });
    } catch {
      setPromoError("The full product demo could not be loaded. Please try again.");
    } finally {
      setDemoLoading(false);
    }
  };

  const closeDemo = () => setDemoSession(null);

  useEffect(() => {
    if (!demoOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => closeRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDemo();
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

  const Promo = demoSession?.Promo ?? null;

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
                aria-expanded={demoOpen}
                disabled={demoLoading}
              >
                {demoLoading ? "Loading demo…" : "▶ Watch 30-second demo"}
              </button>
            </div>
            {promoError && <p className="landing-demo-inline-error" role="alert">{promoError}</p>}
            <p className="landing-hero-proof">No account required · Your project stays in your browser</p>
          </div>

          <div className="landing-hero-visual" aria-label="Short HAFloorplan product preview">
            {!demoOpen && reduceMotion === false ? <HAFloorPlanHero showSteps showBrand /> : <StaticHeroPreview />}
          </div>
        </div>
      </section>

      {demoSession && (
        <div className="landing-demo-backdrop" onMouseDown={closeDemo}>
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
                onClick={closeDemo}
              >
                ×
              </button>
            </div>
            <div className="landing-demo-stage">
              {reduceMotion !== false || !Promo ? <StaticHeroPreview /> : <Promo showCaptions />}
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

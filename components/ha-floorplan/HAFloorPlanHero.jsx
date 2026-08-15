"use client";
import React, { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import * as ReactDOMClient from "react-dom";

const SCENES = '[{"name":"Draw","dur":2.2,"desc":"The living room is traced"},{"name":"Place","dur":1.6,"desc":"A light is placed and dragged"},{"name":"Connect","dur":1.8,"desc":"Entity ID typed"},{"name":"Export","dur":1.4,"desc":"YAML copied"},{"name":"Live","dur":2,"desc":"Tap lights the room"}]';

/** 9s HA FloorPlan hero loop (1920x1080 stage, scales to its container). */
export default function HAFloorPlanHero({ showSteps = true, showBrand = true, className, style }) {
  const ref = useRef(null);
  useEffect(() => {
    let root, cancelled = false;
    (async () => {
      window.React = React;
      window.ReactDOM = ReactDOMClient;
      window.OM_SCENES = SCENES;
      window.OM_PLAYBACK = '{"mode":"loop"}';
      window.TWEAK_DEFAULTS = { showSteps, showBrand };
      await import("./lib/animations-v3.js");
      await import("./lib/tweaks-panel.js");
      await import("./lib/hero-piece.js");
      if (cancelled || !ref.current) return;
      root = createRoot(ref.current);
      root.render(React.createElement(window.HAFloorPlanHero));
    })();
    return () => { cancelled = true; if (root) setTimeout(() => root.unmount(), 0); };
  }, [showSteps, showBrand]);
  return <div ref={ref} className={className} style={{ width: "100%", aspectRatio: "16 / 9", background: "#f3f2f2", ...style }} />;
}

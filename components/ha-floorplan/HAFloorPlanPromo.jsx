"use client";

import React, { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import * as ReactDOMClient from "react-dom";

const SCENES = '[{"name":"Yaml","dur":4.5,"desc":"Cold open on scrolling YAML pain"},{"name":"Reveal","dur":2.5,"desc":"HA FloorPlan brand reveal"},{"name":"Draw","dur":5.5,"desc":"Two rooms traced with the Room tool"},{"name":"Place","dur":4.5,"desc":"Devices placed and dragged into position"},{"name":"Connect","dur":3.5,"desc":"Entity ID typed into the inspector"},{"name":"Export","dur":4.5,"desc":"YAML generated and copied"},{"name":"Interact","dur":4.5,"desc":"Pasted into Home Assistant; tap lights the room"},{"name":"Close","dur":4,"desc":"Red poster end card"}]';

/** 33.5s HA FloorPlan promo loop (1920x1080 stage, scales to its container). */
export default function HAFloorPlanPromo({ showCaptions = true, className, style }) {
  const ref = useRef(null);

  useEffect(() => {
    let root;
    let cancelled = false;

    (async () => {
      try {
        window.React = React;
        window.ReactDOM = ReactDOMClient;
        window.OM_SCENES = SCENES;
        window.OM_PLAYBACK = '{"mode":"loop"}';
        window.TWEAK_DEFAULTS = { motionEditor: false, showCaptions };

        await import("./lib/animations-v3.js");
        await import("./lib/tweaks-panel.js");
        await import("./lib/promo-piece.js");

        if (cancelled || !ref.current) return;
        root = createRoot(ref.current);
        root.render(React.createElement(window.ThreeDHomeVideo));
        ref.current.dataset.demoReady = "true";
      } catch (error) {
        console.error("Unable to start the HAFloorplan full demo", error);
        if (ref.current) ref.current.dataset.demoError = "true";
      }
    })();

    return () => {
      cancelled = true;
      if (root) setTimeout(() => root.unmount(), 0);
    };
  }, [showCaptions]);

  return (
    <div
      ref={ref}
      className={className}
      data-full-demo="true"
      style={{ width: "100%", aspectRatio: "16 / 9", background: "#17201e", ...style }}
    />
  );
}

# HA FloorPlan Promo Demo Reference

## Purpose

This document stages the current **HA FloorPlan Promo** demo as a durable implementation reference for builder/design agents.

The canonical demo source was supplied as:

- **File:** `HA FloorPlan Promo.html`
- **Size:** 1,006,101 bytes
- **SHA-256:** `0b26792d7d097977a04778c7fb140d7e4cb55cc25ee0913c03ecbb8ba2a9604a`
- **Captured:** 2026-08-15

The source is a self-contained browser demo bundle. Treat it as a **visual/product reference**, not production code to copy wholesale.

## Builder-agent instruction

Before implementing landing-page or promotional UI work, use the demo to understand the intended visual hierarchy, product tone, interaction story, and presentation style. Preserve the product positioning established in GitHub issues #33 and #43.

The demo should inform the builder about:

- HA FloorPlan branding and visual identity;
- the visual editor → Home Assistant output story;
- floor-plan drawing and device-placement concepts;
- a lightweight, approachable browser-first experience;
- Home Assistant-specific positioning;
- the transformation from a static floor plan into an interactive Home Assistant dashboard.

Do **not** infer that every control or visual shown in the demo is an approved product requirement. Product scope and acceptance criteria remain authoritative in the relevant GitHub issues.

## Product boundaries that must remain clear

HA FloorPlan is not intended to become a general-purpose CAD/interior-design product.

The target user is a Home Assistant user who wants to use the built-in `picture-elements` card but wants a visual, lightweight way to:

1. draw a recognizable custom floor plan;
2. place Home Assistant devices at their physical locations;
3. map those devices to Home Assistant Entity IDs;
4. configure state-driven room/device behavior visually;
5. preview the result;
6. export native Home Assistant Picture Elements YAML/assets.

Normal use should require no desktop app installation, no HACS card, no custom Lovelace runtime, and no manual SVG/CSS/YAML positioning.

## Related source-of-truth issues

- #33 — Marketing and UI brand brief for HA FloorPlan
- #43 — Home Assistant floor-plan configuration methods and HA FloorPlan market positioning

## Implementation rule

When the demo conflicts with an approved GitHub issue, the approved issue wins. The demo is a visual reference artifact, while GitHub issues define product scope and behavior.

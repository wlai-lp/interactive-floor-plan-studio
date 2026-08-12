# Native Home Assistant room overlays

Home Assistant lighting overlays are generated as separate transparent full-canvas SVG assets. They use the exact same `viewBox` and `preserveAspectRatio` as the static floor-plan background.

Each overlay contains only the complete mapped room polygon geometry and its lighting treatment. The exporter wraps the overlay image in a native `conditional` element for the configured entity and `on` state. Conditional overlay elements are emitted before state icons and labels.

Overlay images span the full card and use `pointer-events: none`, so they never block interaction with native Home Assistant controls.

MVP does not require card-mod, HACS/custom cards, templates, or an application runtime.
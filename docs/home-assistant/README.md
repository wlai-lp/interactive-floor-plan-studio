# Home Assistant Export Validation

The canonical paste-ready validation fixture is `golden-picture-elements.yml`.

For release-gate validation under issue #17, record the exact commit SHA and use `validation-evidence-template.md` to capture Home Assistant version, browser/device coverage, responsive alignment, off → on → off behavior, pointer interaction, and native-only dependency confirmation.

The fixture must preserve the exporter contract: conditional room overlay first, `state-icon` second, `state-label` third; the overlay is full-card aligned and uses `pointer-events: none` so interactive controls remain reachable.

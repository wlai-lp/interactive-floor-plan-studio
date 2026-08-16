# Landing browser QA

Landing-page changes use a headless Chrome smoke check in `.github/workflows/landing-browser-smoke.yml`.

The browser test starts the real Vite/vinext development app, waits for `/` to respond, renders the page in headless Chrome with a 5-second virtual-time budget, and verifies the rendered DOM rather than only source text.

Current assertions cover:

- approved landing headline
- `Open Editor`
- `From floor plan to dashboard in minutes`
- `Add to HA`
- `Native Picture Elements YAML`
- no `Watch 30-second demo` CTA while demo work is deferred
- no rendered dialog while demo work is deferred

The workflow also captures the rendered DOM, browser screenshot, and Vite log as QA artifacts.

When the interactive demo is restored, expand this browser-level check to click the demo control and verify open/close/Escape behavior. A source-level unit test alone is not sufficient for that interaction.

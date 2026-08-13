# Home Assistant Validation Evidence — Issue #17

Use the canonical fixture at `docs/home-assistant/golden-picture-elements.yml` from the exact commit being validated.

## Environment

- Home Assistant version:
- Dashboard mode:
- Browser/device:
- Viewport/card sizes tested:
- Fixture commit SHA:
- Entity used: `light.alarm_light`

## Required sequence

- [ ] Paste the fixture without structural YAML edits.
- [ ] Card loads without configuration errors.
- [ ] Static Base64 floor plan renders.
- [ ] State icon and state label render.
- [ ] With `light.alarm_light` off, room overlay is not visible.
- [ ] Click icon; entity changes to on.
- [ ] Entire mapped room changes color.
- [ ] State label updates.
- [ ] Overlay does not intercept pointer input.
- [ ] Hold icon; more-info opens.
- [ ] Click icon again; entity changes to off.
- [ ] Entire room overlay disappears.
- [ ] Repeat at multiple dashboard/card sizes and confirm alignment.
- [ ] Confirm no card-mod, HACS/custom card, template, or app runtime dependency is involved.

## Evidence

Attach screenshots or a recording showing:

1. OFF state
2. ON state with entire room colored
3. more-info interaction
4. OFF state after second toggle

## Result

- Overall: PASS / FAIL
- Position tolerance observed:
- Errors/warnings:
- Limitations:
- Defects filed:
- Technical review recommendation:

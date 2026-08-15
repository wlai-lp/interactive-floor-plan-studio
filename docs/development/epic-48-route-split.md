# Epic #48 route split

HAFloorplan.com now treats the public site and the editor as separate experiences.

- `/` is the public product site.
- `/editor` is the existing local-first floor-plan editor.
- `/home-assistant-export` remains the focused Home Assistant export workflow.

The editor continues to use the existing `floor-plan-studio-project` localStorage key so moving the route does not migrate or discard locally saved projects.

Home Assistant export recovery links return to `/editor`, and device-specific corrections use `/editor?device=<id>` so the selected device is restored in the editor.

This is the first structural implementation slice of Epic #48. Marketing layout, landing-page sections, blog, and About are intentionally handled in later slices.
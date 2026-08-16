# Click-triggered full landing demo

The native 9-second HAFloorplan hero loop and the separate 33.5-second product demo are supplied as compiled Next.js client components in the same vendor archive.

The full promo is not rendered on initial page load. It mounts only after the user selects **Watch Demo**, inside an accessible modal. Closing the modal unmounts the full promo and restores focus to the trigger.

Both animation adapters configure shared browser globals. The landing page therefore mounts only one animation component at a time: the short hero is removed before the full promo starts and is remounted after the promo closes.

Browser-level interaction coverage proves the full demo remains absent before activation, opens from the button, closes from both the visible control and Escape, restores focus, and never runs concurrently with the short hero.

# Landing demo open contract

The full 33.5-second product demo must remain absent from the rendered landing page until a real user activates **Watch 30-second demo**.

Implementation invariants:

- no top-level `HAFloorPlanPromo` import
- no `next/dynamic` declaration for the full promo
- no standalone `demoOpen` state initialized independently of a user request
- the promo module import occurs inside the trusted button click handler
- programmatic/synthetic clicks are ignored via `nativeEvent.isTrusted`
- the modal renders only while a user-created `demoSession` exists
- bfcache restoration clears any prior demo session

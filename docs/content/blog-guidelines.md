# HAFloorplan Blog Publishing Guidelines

This document is the canonical publishing guide for HAFloorplan articles.

Related work:
- Epic #48 — public-site redesign
- Issue #44 — blog framework implementation/history
- Issue #56 — engineering North Star

Future article issues and pull requests should reference this document.

## Purpose

HAFloorplan articles should help Home Assistant users successfully create working floor-plan dashboards while keeping the publishing system lightweight, version-controlled, and easy to extend.

**Product principle:** The article should teach the task, while HAFloorplan handles the YAML complexity.

## Architecture

- Keep the blog inside the existing Next.js App Router application.
- Do not introduce WordPress, an external CMS, or a separate blogging platform for the current implementation.
- `/blog` is the public article index.
- Article URLs must use stable slugs, for example `/blog/getting-started`.
- Article metadata must come from the canonical metadata registry so index content is not duplicated manually.
- Draft articles must not appear on the public index.

## Required article metadata

Every article should define:

- title
- description
- published date
- updated date when materially revised
- author (normally HAFloorplan)
- slug
- category
- tags
- publication state (`draft` or `published`)

## Article structure

Each task-oriented article should include, where applicable:

1. A clear problem or desired outcome in the introduction.
2. Prerequisites before the user begins.
3. Numbered task steps.
4. Exact HAFloorplan labels, buttons, and field names when describing the UI.
5. A supporting visual for each important procedural step.
6. A visible expected result after major steps.
7. A final verification section.
8. Links back to the HAFloorplan editor or an appropriate next article.

## Visual guidelines

Tutorial visuals are instructional, not decorative.

- Show the relevant HAFloorplan or Home Assistant interface region.
- Spotlight the exact field, menu item, or button the reader must use.
- Prefer reusable animated UI illustrations when animation materially clarifies the action.
- Significant animation must respect `prefers-reduced-motion`.
- Include descriptive captions or accessible text.
- Avoid generic stock imagery for procedural instructions.
- A reader should be able to understand the required action from the visual before finishing the surrounding paragraph.

## Writing guidelines

- Write for Home Assistant users who may not know YAML.
- Prefer plain language over Lovelace implementation terminology.
- Explain Home Assistant-specific concepts only when required to complete the task.
- Do not require users to configure a value HAFloorplan can safely infer or generate.
- Use exact product terminology from the current UI.
- Keep examples aligned with released behavior.
- Never document unreleased functionality as though it already exists.
- Keep the normal workflow concise and beginner-friendly.

## Technical accuracy

Any tutorial that produces Home Assistant YAML must verify that:

- the documented HAFloorplan workflow matches the current UI;
- required Home Assistant entity/domain assumptions are explicit;
- generated YAML corresponds to the current exporter;
- Home Assistant paste/import instructions match the current dashboard editor workflow.

Current MVP assumptions:

- supported controllable device types are Light and Switch/Power Plug;
- users must already know the Home Assistant entity ID they intend to map;
- Light entity IDs use `light.*`;
- Switch/Power Plug entity IDs use `switch.*`;
- the normal MVP path should not require users to hand-edit generated YAML.

When product behavior changes, update affected articles rather than leaving stale instructions public.

## SEO and discovery

- Every article must provide Next.js page title and description metadata.
- Keep article URLs stable.
- The architecture should remain compatible with sitemap and RSS support without changing existing article URLs.
- Titles and descriptions should describe the user outcome rather than target keywords unnaturally.

## Publishing workflow

1. Create an article GitHub issue.
2. Reference this guideline and engineering North Star #56.
3. Define audience, outcome, prerequisites, and the exact product flow in the issue.
4. Implement article content and visuals on a feature branch.
5. Verify UI labels and procedural steps against the current application.
6. Review technical accuracy and product wording.
7. Validate applicable #56 browser/accessibility requirements, especially for interactive or animated visuals.
8. Merge and deploy through the normal release workflow.

## Definition of done

An article is ready to publish when:

- [ ] its issue references this guideline;
- [ ] it has complete registry metadata and a stable slug;
- [ ] publication state is intentionally `published`;
- [ ] it appears on `/blog` after publication;
- [ ] prerequisites are explicit;
- [ ] procedural steps match current product behavior;
- [ ] important procedural steps include focused visuals where useful;
- [ ] significant visual animation respects reduced-motion preferences;
- [ ] expected results and final verification are clear;
- [ ] the content does not require unnecessary YAML knowledge;
- [ ] Next.js title/description metadata is present;
- [ ] relevant runtime/browser validation from #56 has passed.

## Maintenance

This document is durable product documentation, not a task tracker. Update it when publishing standards change. Implementation history, individual article work, and remediation belong in GitHub issues and pull requests.

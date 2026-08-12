# 3dHome Multi-Agent Workflow

GitHub is the authoritative system for project execution. ChatGPT Project instructions provide the shared operating model; this document records the repository-side protocol.

## Sources of truth

| Concern | Source of truth |
| --- | --- |
| Shared backlog, priority, workflow state, routing | GitHub Project |
| Individual work item, decisions, agent findings | GitHub Issue |
| Implementation | GitHub Pull Request |
| Durable product/architecture/business knowledge | Repository documentation |
| Agent role and handoff rules | `.github/agents/` |

Repository documentation must not become a parallel task-management system.

## Workflow states

`Inbox → Discovery → Ready → In Progress → Review → Done`

Additional state: `Parked`.

- **Inbox** — untriaged ideas, observations, requests, and lessons learned.
- **Discovery** — needs product, technical, or business investigation.
- **Ready** — sufficiently defined and prioritized for implementation.
- **In Progress** — implementation is active.
- **Review** — implementation is awaiting review, testing, or validation.
- **Done** — accepted and complete.
- **Parked** — valid item intentionally deferred.

## Next Action

Every active Project item should identify the role responsible for moving it forward:

`Founder | PM | Technical | Business | Implementation | None`

Agents determine their work queue by filtering the GitHub Project for their role in `Next Action`.

## Required GitHub Project fields

| Field | Suggested values |
| --- | --- |
| Status | Inbox, Discovery, Ready, In Progress, Review, Done, Parked |
| Type | Feature, Bug, UX, Tech Debt, Research |
| Priority | P0, P1, P2, P3 |
| Effort | XS, S, M, L, XL |
| Impact | Low, Medium, High |
| Area | Editor, Playground, 3D, Platform, Infrastructure |
| Source | Founder, PM, Technical, Business |
| Next Action | Founder, PM, Technical, Business, Implementation, None |
| Target | MVP, v0.x, v1.0, Future |

## Issue protocol

Issues are the authoritative individual work items. An issue should preserve the problem, goal, relevant context, acceptance criteria, dependencies, decisions, and links to implementation.

Agent reviews belong in issue comments. Do not create separate task documents for active reviews.

When an agent completes a review:

1. Add meaningful findings to the corresponding issue.
2. Include recommendations, concerns, alternatives, and relevant reasoning.
3. Update or recommend the appropriate `Next Action`.
4. Return control to PM when prioritization or cross-functional synthesis is required.

## Standard routing

```text
Founder idea / agent observation
        ↓
Inbox — Next Action: PM
        ↓
PM triage
        ↓
Discovery — Next Action: Technical and/or Business
        ↓
Agent review recorded on Issue
        ↓
Next Action: PM
        ↓
PM synthesis and prioritization
        ↓
Ready — Next Action: Implementation
        ↓
In Progress
        ↓
Review
        ↓
Done — Next Action: None
```

An item may move to `Parked` when it is valid but intentionally deferred. Founder approval is used when a product decision requires final product authority.

## Pull requests

Implementation PRs must reference their corresponding issue. PRs represent implementation, not product discovery. Move the Project item to `Review` while implementation is awaiting validation and to `Done` after acceptance.

## Decision authority

Agents advise. PM organizes, synthesizes, prioritizes, and coordinates. Founder / Product Owner retains final product authority.

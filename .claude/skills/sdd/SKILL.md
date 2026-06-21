---
name: sdd
description: >-
  Spec-Driven Development methodology for Ondanse. Defines the request →
  refine → plan → tasks → implement lifecycle, the numbering and folder
  conventions under specs/requests/, the artifact templates, the quality
  gates between stages, and how each stage ties into the project's
  branch-and-PR git workflow. Loaded by the /sdd-* commands and applied
  whenever working with specs, requests, plans, or task breakdowns.
---

# Spec-Driven Development (SDD) for Ondanse

Spec-Driven Development means **the spec is the source of truth**: we write down
*what* and *why* before *how*, refine it with the user, derive a plan, break the
plan into verifiable tasks, and only then implement. Each stage produces a
durable artifact that the next stage consumes. Nothing is built from a vague ask.

This skill is the single source of truth for the `/sdd-new-request`,
`/sdd-refine`, `/sdd-plan`, `/sdd-tasks`, and `/sdd-implement` commands. When a
command runs, follow the conventions and templates here.

## The lifecycle

```
/sdd-new-request → /sdd-refine → /sdd-plan → /sdd-tasks → /sdd-implement
   request.md       request.md     plan.md     tasks.md     code + PRs
   (draft)          (refined)     (planned)    (ready)      (in-progress→done)
```

Each arrow is a **quality gate**: do not advance until the previous artifact is
complete. The gates are defined per stage below.

## Conventions

### Numbering and location

- All work originates from a **request**, stored under `specs/requests/`.
- One **folder per request**: `specs/requests/NNNN-<slug>/`.
  - `NNNN` is a zero-padded 4-digit sequence number (`0001`, `0002`, …).
  - `<slug>` is a short kebab-case summary (e.g. `festival-list-view`).
- The folder holds up to three artifacts, created in order:
  - `request.md` — what & why (the need, goals, open questions, decisions)
  - `plan.md` — how (architecture, approach, scope, risks)
  - `tasks.md` — the verifiable checklist derived from the plan
- **Next number** = highest existing `NNNN` under `specs/requests/` + 1. Always
  scan the directory to compute it; never hardcode.

### Frontmatter (every artifact)

```yaml
---
number: "NNNN"
slug: <slug>
title: <human title for this artifact>
stage: request | plan | tasks
status: <see status values below>
created: YYYY-MM-DD   # the day the artifact was first written; absolute date
---
```

Convert any relative date ("today") to an absolute `YYYY-MM-DD`.

### Status values

| Artifact   | Status progression                                   |
|------------|------------------------------------------------------|
| request.md | `draft` → `refined` → `planned`                      |
| plan.md    | `planned` → `tasks-generated`                        |
| tasks.md   | `ready` → `in-progress` → `done`                     |

A stage updates the **prior** artifact's status when it consumes it (e.g.
`/sdd-plan` sets request.md to `planned`).

### Git & PR workflow (always)

Every change flows through the project's branch-and-PR process — see
[.github/copilot-instructions.md](../../../.github/copilot-instructions.md). In short:

- Never commit to `main`. Branch first.
- Branch name per stage: `docs/sdd-NNNN-<slug>-<stage>` for spec artifacts
  (request/refine/plan/tasks), and `feat|fix|chore/...` for implementation work.
- Conventional Commits; commitlint requires a **scope** and forbids the `ci`
  type via that name only when not in the enum (allowed types:
  `feat, fix, docs, style, refactor, perf, test, chore`). Use scope `specs`
  for artifact commits (e.g. `docs(specs): add request 0002 ...`).
- Open a PR targeting `main`, assign `jporcarn`, wait for review. Squash-merge.

## Stage definitions & gates

### 1. Request (`/sdd-new-request`)
Capture the need in the user's terms. Populate `request.md` from the template.
Generate sharp **open questions** that materially change scope or design — not
trivia. **Gate to refine:** summary + goals + non-goals + open questions exist.

### 2. Refine (`/sdd-refine`)
Drive the open questions to closure *with the user* (ask them; prefer
`AskUserQuestion` for discrete choices). Record each answer in a **Decisions**
section and remove/blank the corresponding open question. **Gate to plan:** no
unanswered blocking questions remain; request status = `refined`.

### 3. Plan (`/sdd-plan`)
Translate the refined request into an approach. Ground every decision in the
existing [project-definition](../../../specs/project-definition.md) and
[tech-stack](../../../specs/tech-stack.md); call out any deviation explicitly.
Cover architecture, scope (in/out), data model deltas, risks, and a sequenced
approach. **Gate to tasks:** plan covers all in-scope goals; no `TBD` in
in-scope areas.

### 4. Tasks (`/sdd-tasks`)
Decompose the plan into small, independently verifiable tasks as checkboxes,
grouped by area. Each task names its **acceptance criteria** and, where useful,
the files/areas it touches. Tasks should map back to plan sections. **Gate to
implement:** every in-scope plan item has at least one task.

### 5. Implement (`/sdd-implement`)
Execute the next unchecked task(s) under the git/PR workflow. One PR per task or
tightly-related group. On completion, check the box, update `tasks.md` status,
and reference the PR. Verify behavior (build/test/run) before claiming done.

## Templates

### request.md

```markdown
---
number: "NNNN"
slug: <slug>
title: <title>
stage: request
status: draft
created: YYYY-MM-DD
---

# <Title> — Request

## Summary
<2–4 sentences: the need and the user/value, in plain language.>

## Goals
- <observable outcome>

## Non-goals
- <explicitly out of scope for this request>

## Constraints & assumptions
- <budget, platform, deadlines, dependencies, things taken as given>

## Open questions
1. <question that changes scope/design>

## Decisions
<!-- filled by /sdd-refine: "Q… → decision (rationale)" -->
```

### plan.md

```markdown
---
number: "NNNN"
slug: <slug>
title: <title>
stage: plan
status: planned
created: YYYY-MM-DD
---

# <Title> — Plan

## Overview
<the approach in a paragraph; how it satisfies the request>

## Scope
- In: <…>
- Out: <…>

## Architecture & approach
<components, flows, sequencing; reference project-definition & tech-stack;
note any deviation from them and why>

## Data model changes
<new/changed entities, fields, storage; UTC date handling; indexes>

## Risks & mitigations
- <risk → mitigation>

## Alternatives considered
- <option → why not chosen>
```

### tasks.md

```markdown
---
number: "NNNN"
slug: <slug>
title: <title>
stage: tasks
status: ready
created: YYYY-MM-DD
---

# <Title> — Tasks

## <Area 1>
- [ ] <small, verifiable task>
  - Acceptance: <how we know it's done>
  - Touches: <files/areas> (optional)
```

## Principles

- **Spec before code.** If asked to implement without a request/plan/tasks
  chain, offer to create it first.
- **User owns decisions.** Refinement asks; it does not assume. Surface
  trade-offs; recommend, but let the user choose.
- **Traceability.** Every task traces to a plan item; every plan item to a
  request goal. Keep the chain intact.
- **Small, verifiable steps.** Prefer many small tasks with clear acceptance
  over a few large ones.
- **Stay grounded.** Reuse and reference the existing specs; don't restate or
  contradict them silently.

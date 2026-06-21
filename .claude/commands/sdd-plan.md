---
description: Generate the implementation plan for a refined SDD request
argument-hint: "[NNNN] (defaults to the most recent refined request)"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git*)
---

Load the `sdd` skill and follow its conventions exactly.

Target request: **$ARGUMENTS** (if empty, use the highest-numbered request).

Do the following:

1. **Read** `specs/requests/NNNN-<slug>/request.md`. **Gate:** it must be
   `status: refined` with no blocking open questions. If not, tell the user to
   run `/sdd-refine NNNN` first and stop.
2. **Read** `specs/project-definition.md` and `specs/tech-stack.md` so the plan
   stays grounded in the established product and architecture. Also skim the
   relevant existing code/infra so the plan reflects reality, not assumptions.
3. **Check out / create** the branch `docs/sdd-NNNN-<slug>-plan`.
4. **Write** `specs/requests/NNNN-<slug>/plan.md` from the plan template: Overview,
   Scope (in/out), Architecture & approach, Data model changes, Risks &
   mitigations, Alternatives considered. Every decision must trace to a request
   goal; flag and justify any deviation from the existing specs. No `TBD` in
   in-scope areas.
5. Set the request `status: planned`. Set the plan `status: planned`.
6. Commit (`docs(specs): add plan for request NNNN <slug>`) and push.
7. **Report** the approach in a few lines and tell the user the next step is
   `/sdd-tasks NNNN`.

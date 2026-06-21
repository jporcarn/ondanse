---
description: Break an SDD plan into a verifiable task checklist
argument-hint: "[NNNN] (defaults to the most recent planned request)"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git*)
---

Load the `sdd` skill and follow its conventions exactly.

Target request: **$ARGUMENTS** (if empty, use the highest-numbered request).

Do the following:

1. **Read** `specs/requests/NNNN-<slug>/plan.md`. **Gate:** it must exist and be
   `status: planned`. If not, tell the user to run `/sdd-plan NNNN` first and stop.
2. **Check out / create** the branch `docs/sdd-NNNN-<slug>-tasks`.
3. **Write** `specs/requests/NNNN-<slug>/tasks.md` from the tasks template:
   - Group tasks by area (matching the plan's structure).
   - Each task is a `- [ ]` checkbox, small and independently verifiable.
   - Each task names its **Acceptance** criteria; add **Touches** (files/areas)
     where useful.
   - Sequence so dependencies come first.
   - Every in-scope plan item must map to at least one task — verify coverage.
4. Set the plan `status: tasks-generated`. Set tasks `status: ready`.
5. Commit (`docs(specs): add tasks for request NNNN <slug>`) and push.
6. **Report** the task count and groups, and tell the user the next step is
   `/sdd-implement NNNN`.

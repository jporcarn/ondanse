---
description: Refine an SDD request by resolving its open questions with the user
argument-hint: "[NNNN] (defaults to the most recent request)"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git*), AskUserQuestion
---

Load the `sdd` skill and follow its conventions exactly.

Target request: **$ARGUMENTS** (if empty, use the highest-numbered request under
`specs/requests/`).

Do the following:

1. **Locate and read** `specs/requests/NNNN-<slug>/request.md`. Confirm it exists
   and read its Open questions.
2. **Check out / create** the request's branch
   (`docs/sdd-NNNN-<slug>-request`) so refinements land with the request.
3. **Resolve every open question with the user.** Ask them — use `AskUserQuestion`
   for discrete choices, prose for open-ended ones. Group related questions.
   Recommend an option where you have a basis, but let the user decide. Do not
   assume answers.
4. **Record outcomes**: for each question, append `Q… → decision (rationale)` to
   the **Decisions** section and remove the resolved item from Open questions.
   Fold any new constraints into Constraints & assumptions.
5. When no blocking questions remain, set the request `status: refined`.
6. Commit (`docs(specs): refine request NNNN <slug>`) and push.
7. **Report** the decisions made and tell the user the next step is
   `/sdd-plan NNNN`.

If questions remain that only the user can answer and they're unavailable, leave
status `draft`, list what's still open, and stop.

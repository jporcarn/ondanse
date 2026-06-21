---
description: Implement the next task(s) from an SDD task list, via the branch-and-PR workflow
argument-hint: "[NNNN] [optional: task or area to target]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, TodoWrite
---

Load the `sdd` skill and follow its conventions exactly.

Target: **$ARGUMENTS** (first token = request `NNNN`, default to the most recent;
remaining text optionally names a specific task or area).

Do the following:

1. **Read** `specs/requests/NNNN-<slug>/tasks.md`. **Gate:** it must exist and be
   `status: ready` or `in-progress`. If not, tell the user to run
   `/sdd-tasks NNNN` first and stop.
2. **Select work**: the named task/area if given, otherwise the next unchecked
   task(s) respecting dependency order. Pick one task or a tightly-related group
   for a single PR. Confirm the selection with the user if scope is ambiguous.
3. **Branch** with the right type for the work
   (`feat|fix|chore|docs/<scope>-<summary>`), per the git workflow. Use
   `TodoWrite` to track multi-step implementation.
4. **Implement** the task. Reuse existing patterns in the codebase. Keep changes
   focused on the selected task(s).
5. **Verify** before claiming done: build, run tests, and/or run the app as
   appropriate. Report results honestly — if something fails, say so.
6. **Update** `tasks.md`: check the completed box(es), add the PR link, and set
   the file `status: in-progress` (or `done` when all boxes are checked).
7. **Commit** with a Conventional Commit, push, and **open a PR** targeting
   `main` with `jporcarn` as reviewer. Summarize what was implemented and which
   task(s) it closes.

Do not batch unrelated tasks into one PR. One task (or tight group) → one PR.

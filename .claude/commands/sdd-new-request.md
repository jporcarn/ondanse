---
description: Start a new Spec-Driven Development request (creates specs/requests/NNNN-slug/request.md)
argument-hint: <short description of the need>
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git*)
---

Load the `sdd` skill and follow its conventions exactly.

The user's request: **$ARGUMENTS**

Do the following:

1. **Compute the next number.** Scan `specs/requests/` for the highest existing
   `NNNN-*` folder and add 1 (zero-padded, 4 digits). Pick a short kebab-case
   `<slug>` summarizing the request.
2. **Create a branch** `docs/sdd-NNNN-<slug>-request` per the git workflow.
3. **Create** `specs/requests/NNNN-<slug>/request.md` using the request template
   from the `sdd` skill. Fill Summary, Goals, Non-goals, and Constraints from the
   user's description; infer sensibly from the existing
   `specs/project-definition.md` and `specs/tech-stack.md`, but do not invent
   requirements the user didn't imply. Set `status: draft` and `created` to
   today's absolute date.
4. **Generate Open questions** that genuinely affect scope or design (5–10 max).
   Skip trivia.
5. Commit the artifact (`docs(specs): add request NNNN <slug>`) and push the
   branch; do not open a PR yet unless asked.
6. **Report**: the path created, the number/slug, a one-line summary, and tell
   the user the next step is `/sdd-refine NNNN`.

If `$ARGUMENTS` is empty, ask the user for a one-paragraph description first.

# AGENTS

This repository is designed for AI-first, specs-driven development of the Ondanse PWA.

## Purpose

Use this file to define the AI workflow for the project and record which agents, tools, and commands are available for the next phase of development.

## Recommended Files for AI Workflow

- `AGENTS.md` - this document describing the agent strategy and workflow.
- `README.md` - high-level project vision and next actions.
- `.vscode/extensions.json` - recommended VS Code extensions for the workspace.
- `.vscode/settings.json` - optional workspace settings for formatting, linting, and editor preferences.
- `specs/` - planned folder for feature specs, user stories, and acceptance criteria.

## Suggested Agent Roles

- **Planner** - defines MVP scope, features, and spec files.
- **Designer** - chooses architecture, tech stack, and PWA patterns.
- **Builder** - scaffolds code, builds components, and implements features.
- **Tester** - creates test cases and validates behavior.

## Spec-Driven Development workflow

The project uses a Spec-Driven Development (SDD) flow: every unit of work starts
as a numbered request and moves through refine → plan → tasks → implement, with a
durable artifact at each stage under `specs/requests/NNNN-<slug>/`.

- Methodology, conventions, and templates: `.claude/skills/sdd/SKILL.md`.
- Commands (run in order): `/sdd-new-request` → `/sdd-refine` → `/sdd-plan` →
  `/sdd-tasks` → `/sdd-implement` (defined in `.claude/commands/`).
- All changes follow the branch-and-PR workflow in
  `.github/copilot-instructions.md`.

## Commands and Skills

For the coming specs and development tasks, the following are important:

- `gh` CLI for repository actions and GitHub management.
- `git` for local version control.
- VS Code command palette for running Agents and Copilot suggestions.
- `npm` / `pnpm` / `yarn` for package install and local runs once the starter is scaffolded.

## Next Step

1. Add a `specs/` directory with at least one structured spec for the MVP.
2. Scaffold the PWA starter application.
3. Create a minimal `package.json` and initial PWA assets.
4. Use this document to track agent responsibilities and recurring commands.

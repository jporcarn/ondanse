# Ondanse

Ondanse is a personal agenda app for dance festivals around the world.

## Vision

- Aggregate festival events from Facebook, Instagram, booking platforms, and other sources.
- Let users save festivals, build their own agenda, and discover events they are interested in.
- Start as a Progressive Web App (PWA) with responsive design for desktop and mobile.

## Project Setup

This repository uses an AI-driven, specs-first workflow.

### Key files

- `AGENTS.md` — defines AI roles and workflow.
- `README.md` — project vision and next actions.
- `specs/` — planned folder for feature specs and acceptance criteria.
- `.vscode/extensions.json` — recommended editor extensions.
- `packages/` — monorepo packages for backend and frontend.

### Local development

1. Install workspace dependencies:
   - `pnpm install`
2. Start both packages together:
   - `pnpm dev`
3. Or start packages separately:
   - `pnpm --dir packages/backend dev`
   - `pnpm --dir packages/frontend dev`
4. Build production outputs:
   - `pnpm build`
5. Run lint/test across packages:
   - `pnpm lint`
   - `pnpm test`

The frontend runs on `http://localhost:5173` and proxies `/api` to the backend at `http://localhost:3333`.

## Monorepo and versioning

- Root `package.json` manages the workspace version.
- `packages/backend/package.json` and `packages/frontend/package.json` should match the root version.
- Use `pnpm -r version` or `npm run version` to bump the monorepo version consistently.
- `pnpm-workspace.yaml` is used to define the workspace packages for pnpm.

## Commit conventions

We use Conventional Commits to make history readable and predictable.

Example commit messages:

- `feat(requests): add initial request history structure`
- `fix(api): correct festival date handling`

Commit messages are validated with Husky and Commitlint.

## Next Actions

1. Create the first MVP spec in `specs/`.
2. Scaffold a PWA starter in the repo.
3. Define the initial data model for festival events and agendas.
4. Add a simple home page and festival search flow.

## Recommended Stack

- React + Vite or Next.js
- PWA with service worker and manifest
- Mobile-responsive UI
- TypeScript backend on Azure

## GitHub workflow and branch protection

This repo is designed to use branch-protected `main` with PR-based merges.

Suggested GitHub rules:

- Protect `main` branch
- Require pull request reviews before merging
- Require passing CI checks before merge
- Disable direct pushes to `main` except for the initial commit
- Enforce signed commits if desired

Suggested workflow:

1. Create a feature branch: `git checkout -b feat/<summary>`
2. Develop in the branch and run local checks
3. Push the branch: `git push -u origin feat/<summary>`
4. Open a pull request targeting `main`
5. Wait for GitHub Actions checks and review
6. Merge via PR once CI passes

GitHub Actions workflows:

- `.github/workflows/ci.yml` runs on `push` and `pull_request` to `main`
- `.github/workflows/deploy.yml` runs on `push` to `main`

## Notes

The repository is currently empty and ready for the initial app scaffolding.

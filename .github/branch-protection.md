# Branch Protection Policy

This repository uses a classic protected `main` branch workflow.

## Recommended branch protection rules for `main`

- Protect the `main` branch.
- Require pull request reviews before merging.
- Require at least 1 approving review.
- Dismiss stale pull request approvals when new commits are pushed.
- Require status checks to pass before merging.
  - At minimum, require the `CI` workflow to pass.
- Require branches to be up to date before merging.
- Require a linear commit history if you want cleaner history.
- Restrict force pushes and deletion of the `main` branch.
- Optionally require signed commits.
- Optionally require review from code owners.

## Recommended GitHub settings

1. Go to `Settings` > `Branches` > `Branch protection rules`.
2. Add a rule for `main`.
3. Enable the options above.
4. If desired, make `main` the default branch and require PR-based merging.

## Suggested workflow

- Create a branch for each change: `git checkout -b feat/<name>`.
- Push the branch: `git push -u origin feat/<name>`.
- Open a PR targeting `main`.
- Wait for CI to pass and review approval.
- Merge the PR when the checks pass.

## Why this matters

Protecting `main` ensures the repository stays deployable, testable, and reviewable. It also makes it easier to enforce CI-based quality gates and prevent accidental direct pushes.

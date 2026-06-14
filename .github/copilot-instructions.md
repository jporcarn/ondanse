---
name: ondanse-git-workflow
description: "Enforce branch-based development with PR review workflow for Ondanse project. All commits must go through feature/fix branches with detailed PRs, code owner approval, and user review before merging to main."
---

# Ondanse Git Workflow Requirements

## Mandatory Workflow (ALWAYS FOLLOW)

### 1. Never Commit Directly to Main
- **BLOCKED**: Direct commits to `main` branch are prohibited
- **REQUIRED**: Create a feature or fix branch first
- **PROCESS**: All changes must flow through Pull Requests with reviews

### 2. Branch Naming Convention

Use conventional branch names:

- **Features**: `feat/<feature-name>` (e.g., `feat/azure-backend-deployment`)
- **Bug fixes**: `fix/<issue-name>` (e.g., `fix/terraform-validation-errors`)
- **Documentation**: `docs/<doc-name>` (e.g., `docs/api-endpoint-guide`)
- **Infrastructure**: `infra/<component-name>` (e.g., `infra/state-backend-setup`)
- **Chores**: `chore/<task-name>` (e.g., `chore/update-dependencies`)

### 3. Pull Request Requirements

Every PR **MUST** include:

1. **Descriptive Title**
   - Follow Conventional Commits: `<type>(<scope>): <description>`
   - Example: `feat(infra): scaffold Azure Terraform configuration`

2. **Detailed Description**
   - What changes were made and why
   - Which files were modified and rationale
   - Any dependencies or prerequisites
   - Links to relevant issues or specs

3. **Code Owner Review** (Required)
   - PRs must be approved by at least one code owner (defined in `CODEOWNERS`)
   - Current code owners: `jporcarn` (user)

4. **Reviewer Assignment**
   - Always include `jporcarn` as a reviewer
   - Wait for approval before merging

### 4. Merge Strategy
- Use **Squash merge** for feature branches (keeps main history clean)
- Merge commit message must follow Conventional Commits
- Delete branch after merge

## Implementation Rules for AI Agent

**When making code changes:**

1. ✅ Create a branch using the naming convention above
2. ✅ Make commits with clear, conventional messages
3. ✅ Push the branch to remote
4. ✅ Create a detailed Pull Request
5. ✅ Assign `jporcarn` as reviewer and code owner approval
6. ✅ Wait for approval before merging (or inform user to merge after review)
7. ✅ Provide merge command for user if automation not available
8. ✅ Minimize tool usage and terminal calls to reduce Copilot consumption
9. ✅ Prefer concise edits and only touch files required for the task
10. ✅ Avoid repeated or unnecessary validation steps when not required

**Tools to use:**
- `mcp_gitkraken_cli_git_*` for branch operations
- `github-pull-request_create_pull_request` for PR creation
- Report status of each workflow step

## Why This Matters

- **Branch protection** ensures code quality and prevents accidental overwrites
- **PR reviews** catch issues early and document decisions
- **Conventional commits** keep history clean and enable automated changelogs
- **Code owner approval** maintains consistency with project standards

## Exceptions

Only `jporcarn` can commit directly to main for emergency hotfixes. In that case:
- Create hotfix branch immediately after
- Document the reason in commit message
- Create a PR for backlog review

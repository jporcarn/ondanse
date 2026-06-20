# Azure Infrastructure Setup Guide

This guide explains everything a new contributor needs to deploy Ondanse to Azure,
either from their own machine or through GitHub Actions.

Each step is described **first in plain language** (what it does and why we need it),
**then with the exact command** and a short technical note.

> If you just cloned the repo and want the short version, jump to
> [Quick checklist](#quick-checklist) at the bottom.

---

## 1. What you are setting up (the big picture)

Ondanse runs on Azure. To create and manage those cloud resources safely and
repeatably we use **Terraform** (infrastructure-as-code). Terraform needs two things:

1. **A place to store its "memory"** of what it has already created. This is called
   the *Terraform state*, and we keep it in an Azure Storage account so the state is
   shared and never lost. Creating that storage account is called **bootstrapping the
   backend**.
2. **Permission to create resources** in your Azure subscription. Locally this is
   *you* (your Azure login). In GitHub Actions there is no human to log in, so we
   create a robot identity called a **service principal** and give it permission.

So there are two paths, and you only need the one that matches how you deploy:

| Path | Who runs Terraform | Identity used |
| --- | --- | --- |
| **A. Local machine** | You, manually | Your own `az login` |
| **B. GitHub Actions** | The CI workflow | The `ondanse-github-sp` service principal |

---

## 2. Prerequisites (install these once)

Plain language: these are the tools your computer needs before anything below works.

| Tool | Why you need it | Install |
| --- | --- | --- |
| **Azure subscription** | The cloud account that will hold and bill the resources. | https://azure.microsoft.com (a Pay-As-You-Go subscription is fine) |
| **Azure CLI (`az`)** | Lets you talk to Azure from the terminal. | https://learn.microsoft.com/cli/azure/install-azure-cli |
| **Terraform** | Creates the Azure resources from the files in `infra/`. | https://developer.hashicorp.com/terraform/install (this repo uses 1.15.6) |
| **Git** | To clone the repository. | https://git-scm.com |
| **Node.js 22 + pnpm** | Only needed to build/run the app itself, not the infra. | https://nodejs.org , then `npm i -g pnpm` |

Check they are installed:

```bash
az version
terraform version
```

---

## 3. Sign in to Azure (with MFA)

**Plain language:** prove to Azure who you are so it lets you make changes. Azure now
*requires* multi-factor authentication (MFA) — a second confirmation on your phone or
authenticator app — before it will let you create or change resources.

```bash
az login
```

A browser opens; complete the MFA prompt. Then make sure you are pointed at the right
subscription:

```bash
# See all subscriptions you can access
az account list --output table

# Select the one Ondanse should use
az account set --subscription "<SUBSCRIPTION_ID>"

# Confirm
az account show --output table
```

> **Technical note:** If you ever see
> `RequestDisallowedByAzure ... authenticated through MFA`, your CLI session token was
> issued without MFA. Re-authenticate to force the MFA step:
> ```bash
> az logout
> az login --tenant "<TENANT_ID>" --scope "https://management.core.windows.net//.default"
> ```

---

## 4. Path A — Deploy from your own machine

Use this when you want to create or update the infrastructure yourself.

### 4.1 Bootstrap the Terraform backend

**Plain language:** create the small storage area where Terraform keeps its notes about
what it has built. This only needs to succeed once per subscription; running it again is
safe and does nothing if the resources already exist.

The repo ships a helper script that does it for you. Pick the one for your shell:

```powershell
# Windows / PowerShell
./infra/bootstrap-terraform-backend.ps1 -SubscriptionId "<SUBSCRIPTION_ID>"
```

```bash
# macOS / Linux / Git Bash
chmod +x infra/bootstrap-terraform-backend.sh
infra/bootstrap-terraform-backend.sh "<SUBSCRIPTION_ID>"
```

> **Technical note:** the script runs three `az` commands and creates exactly what
> [`infra/backend.tf`](../infra/backend.tf) expects:
> - **Resource group** `ondanse-tfstate-rg` in `westeurope` — a folder that groups the
>   state resources together.
>   `az group create --name ondanse-tfstate-rg --location westeurope`
> - **Storage account** `ondansetfstate` (Standard_LRS, StorageV2, Hot) — the actual
>   storage service that holds the state file.
>   `az storage account create --name ondansetfstate --resource-group ondanse-tfstate-rg ...`
> - **Container** `tfstate` — a bucket inside that storage account where the
>   `terraform.tfstate` file lives.
>   `az storage container create --name tfstate --account-name ondansetfstate --auth-mode login`

### 4.2 Initialize, plan, and apply

**Plain language:**
- `init` downloads what Terraform needs and connects it to the state storage above.
- `plan` shows you a preview of what will be created/changed — no changes are made yet.
- `apply` actually makes the changes (it asks for confirmation first).

```bash
cd infra
terraform init
terraform plan -var-file="terraform.tfvars"
terraform apply -var-file="terraform.tfvars"
```

> **Technical note:** `terraform.tfvars` holds the input values for this deployment
> (resource group name, region, project name, etc.). `init` reads the backend config
> from `backend.tf`; if it cannot reach `ondansetfstate`, re-run step 4.1.

That's it for local deployment. **You do not need Path B unless you want CI/CD.**

---

## 5. Path B — Deploy from GitHub Actions (CI/CD)

Use this so the workflow
[`.github/workflows/bootstrap-and-deploy.yml`](../.github/workflows/bootstrap-and-deploy.yml)
can run Terraform automatically. Because no human is present to log in, we create a
**robot identity** and store its credentials as GitHub secrets.

### 5.1 Create the service principal (the robot identity)

**Plain language:** create a dedicated, non-human Azure account that GitHub Actions will
use. In Azure this shows up as **two linked objects** with the same name
(`ondanse-github-sp`): an **Application** (the global definition) and a **Service
Principal** (the local identity that holds permissions). Seeing both is normal and
correct.

```bash
az ad sp create-for-rbac \
  --name "ondanse-github-sp" \
  --role Contributor \
  --scopes "/subscriptions/<SUBSCRIPTION_ID>"
```

This prints something like:

```json
{
  "appId":    "dbb1ad0e-...",   // -> this is ARM_CLIENT_ID
  "password": "abc123~...",     // -> this is ARM_CLIENT_SECRET (shown ONCE)
  "tenant":   "e17dddf0-..."    // -> this is ARM_TENANT_ID
}
```

> **Important:** the `password` (the **secret value**) is shown **only once**. Copy it
> now. If you lose it, you cannot retrieve it — you must generate a new one (see 5.4).

> **Technical note:** `create-for-rbac` creates the App + Service Principal **and**
> assigns the `Contributor` role at the subscription scope in one call. Contributor lets
> Terraform create/manage resources but **cannot assign roles to others**; if Terraform
> later needs to grant roles (e.g. Key Vault), use `User Access Administrator` or
> `Owner` instead.

### 5.2 Grant the role (only if it is missing)

**Plain language:** if you created the identity earlier *without* permissions, the
workflow login succeeds but then fails with `No subscriptions found` — because the robot
can't "see" any subscription it's allowed to touch. This command gives it the
**Contributor** permission on your subscription.

```bash
az role assignment create \
  --assignee "<ARM_CLIENT_ID>" \
  --role Contributor \
  --scope "/subscriptions/<SUBSCRIPTION_ID>"

# Verify it worked
az role assignment list --assignee "<ARM_CLIENT_ID>" --all --output table
```

> **Technical note:** `Contributor` is role definition id
> `b24988ac-6180-42a0-ab88-20f7382dd24c`. To run this command *you* need `Owner` or
> `User Access Administrator` on the subscription. If `--assignee` can't be resolved,
> use `--assignee-object-id <SP_OBJECT_ID> --assignee-principal-type ServicePrincipal`,
> where the object id comes from `az ad sp show --id <ARM_CLIENT_ID> --query id -o tsv`.

### 5.3 Add the four GitHub secrets

**Plain language:** give GitHub the robot's login details so the workflow can sign in.
The workflow reads exactly these four names.

| GitHub secret | What it is | Where it comes from |
| --- | --- | --- |
| `ARM_CLIENT_ID` | The robot's username | `appId` from 5.1 |
| `ARM_CLIENT_SECRET` | The robot's password (the **value**, not the ID) | `password` from 5.1 |
| `ARM_TENANT_ID` | Your Azure directory id | `tenant` from 5.1, or `az account show --query tenantId -o tsv` |
| `ARM_SUBSCRIPTION_ID` | The subscription to deploy into | `az account show --query id -o tsv` |

Add them in the browser at **Settings → Secrets and variables → Actions → New
repository secret**, or from the terminal:

```bash
gh secret set ARM_CLIENT_ID
gh secret set ARM_CLIENT_SECRET
gh secret set ARM_TENANT_ID
gh secret set ARM_SUBSCRIPTION_ID
```

> **Technical note:** The `azurerm` Terraform provider reads these four `ARM_*` values
> directly from the environment, and the workflow also uses them for
> `az login --service-principal`. No `AZURE_CREDENTIALS` JSON blob is needed.

### 5.4 If the secret is wrong or expired

**Plain language:** if the workflow fails with *"Invalid client secret"*, the stored
password is wrong — most often because the **Secret ID** (a GUID) was copied instead of
the **Secret Value**. Generate a fresh password and update the GitHub secret.

```bash
# Create a new secret value for the existing app (keeps existing ones with --append)
az ad app credential reset \
  --id "<ARM_CLIENT_ID>" \
  --display-name "github-actions" \
  --append \
  --query password -o tsv

# Then paste the printed value into the GitHub secret
gh secret set ARM_CLIENT_SECRET
```

### 5.5 Run the workflow

Go to **Actions → "Bootstrap Terraform Backend and Deploy" → Run workflow**. It will
validate the secrets, log in, bootstrap the backend, and run `terraform init` + `plan`.

---

## 6. Troubleshooting cheat sheet

| Error you see | What it really means | Fix |
| --- | --- | --- |
| `AADSTS7000215: Invalid client secret provided` | `ARM_CLIENT_SECRET` holds the wrong text (often the Secret **ID**, not the **Value**), or it expired. | Regenerate the secret value (5.4) and update the GitHub secret. |
| `No subscriptions found for ***` | The service principal logged in but has no role on the subscription. | Assign Contributor (5.2). |
| `RequestDisallowedByAzure ... MFA` | *Your* CLI session is not MFA-authenticated. | Re-login with MFA (section 3 technical note). |
| `Required secret ARM_* is empty` | A GitHub secret is missing/empty. | Add it (5.3). |
| `terraform init` cannot reach the backend | The state storage doesn't exist yet. | Run the bootstrap script (4.1). |

---

## Quick checklist

**Local deploy (Path A):**
```bash
az login                                                  # sign in (MFA)
az account set --subscription "<SUBSCRIPTION_ID>"         # pick subscription
infra/bootstrap-terraform-backend.sh "<SUBSCRIPTION_ID>"  # one-time backend (or .ps1 on Windows)
cd infra && terraform init && terraform plan -var-file="terraform.tfvars"
terraform apply -var-file="terraform.tfvars"
```

**GitHub Actions deploy (Path B), one-time setup:**
```bash
az ad sp create-for-rbac --name "ondanse-github-sp" --role Contributor \
  --scopes "/subscriptions/<SUBSCRIPTION_ID>"             # create robot + permission
gh secret set ARM_CLIENT_ID                               # appId
gh secret set ARM_CLIENT_SECRET                           # password value
gh secret set ARM_TENANT_ID                               # tenant
gh secret set ARM_SUBSCRIPTION_ID                         # subscription id
# then: Actions -> Bootstrap Terraform Backend and Deploy -> Run workflow
```

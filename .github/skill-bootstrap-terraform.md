---
name: bootstrap-terraform-backend
summary: Bootstrap Azure backend resources and initialize Terraform for Ondanse.
description: "Ask for the Azure subscription ID, create the Terraform backend resource group/storage/container if needed, and run terraform init/plan."
---

# Azure Terraform Bootstrap Skill

Use this skill to automatically prepare the Azure backend for Terraform and initialize the infrastructure deployment.

## Inputs
- `subscription_id` (required): Azure subscription ID to use for backend resources.

## Steps
1. Set Azure subscription to `subscription_id`
2. Create backend resource group `ondanse-tfstate-rg` if missing
3. Create storage account `ondansetfstate` if missing
4. Create storage container `tfstate` if missing
5. Run `terraform init` in `infra/`
6. Run `terraform plan -var-file="terraform.tfvars"` in `infra/`

## Example
`/bootstrap-terraform-backend subscription_id=6e9c46d2-7b5c-4840-b3a6-36e714b0317a`

## Implementation
- CLI wrapper: `infra/bootstrap-terraform-backend.sh`
- GitHub Actions workflow: `.github/workflows/bootstrap-and-deploy.yml`
- Subscription must be provided by the user or by secret configuration in GitHub Actions.

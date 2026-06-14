# Ondanse Infra

This folder contains Terraform configuration for the Ondanse Azure infrastructure.

## Architecture

- Azure Static Web App for frontend hosting
- Azure Linux Web App for backend API hosting
- Azure Cosmos DB with MongoDB API for festival data
- Azure Key Vault for secrets management
- Application Insights for telemetry
- Azure Storage backend for Terraform state

## Usage

1. Install Terraform.
2. Sign in to Azure: `az login`
3. Initialize Terraform:
   - `terraform init`
4. Validate the configuration:
   - `terraform validate`
5. Plan the deployment:
   - `terraform plan -var-file="terraform.tfvars"`
6. Apply the deployment:
   - `terraform apply -var-file="terraform.tfvars"`

## Notes

- The Terraform backend is configured in `backend.tf` and uses an Azure Storage account.
- The app is intentionally built with Azure native managed services only.

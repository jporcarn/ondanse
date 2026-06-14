#!/usr/bin/env bash
set -euo pipefail

SUBSCRIPTION_ID="${1:?Subscription ID is required}"
RESOURCE_GROUP_NAME="ondanse-tfstate-rg"
STORAGE_ACCOUNT_NAME="ondansetfstate"
CONTAINER_NAME="tfstate"
LOCATION="westeurope"

echo "🔐 Setting Azure subscription to '$SUBSCRIPTION_ID'..."
az account set --subscription "$SUBSCRIPTION_ID"

echo "📦 Creating backend resource group '$RESOURCE_GROUP_NAME' in '$LOCATION'..."
az group create --name "$RESOURCE_GROUP_NAME" --location "$LOCATION" >/dev/null

echo "🧱 Creating storage account '$STORAGE_ACCOUNT_NAME'..."
az storage account create \
  --name "$STORAGE_ACCOUNT_NAME" \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --location "$LOCATION" \
  --sku Standard_LRS \
  --kind StorageV2 \
  --access-tier Hot >/dev/null

echo "📁 Creating storage container '$CONTAINER_NAME'..."
az storage container create --name "$CONTAINER_NAME" --account-name "$STORAGE_ACCOUNT_NAME" --auth-mode login >/dev/null

echo "✅ Bootstrap completed successfully."

echo "Next step: cd infra; terraform init; terraform plan -var-file=\"terraform.tfvars\"; terraform apply -var-file=\"terraform.tfvars\""

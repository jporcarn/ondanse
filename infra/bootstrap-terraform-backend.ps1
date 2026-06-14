param (
  [Parameter(Mandatory=$true)]
  [string]$SubscriptionId,

  [Parameter(Mandatory=$false)]
  [string]$ResourceGroupName = "ondanse-tfstate-rg",

  [Parameter(Mandatory=$false)]
  [string]$StorageAccountName = "ondansetfstate",

  [Parameter(Mandatory=$false)]
  [string]$ContainerName = "tfstate",

  [Parameter(Mandatory=$false)]
  [string]$Location = "westeurope"
)

Write-Host "🔐 Setting Azure subscription to '$SubscriptionId'..."
az account set --subscription $SubscriptionId
if ($LASTEXITCODE -ne 0) {
  Write-Error "❌ Failed to set Azure subscription."
  exit 1
}

Write-Host "📦 Creating backend resource group '$ResourceGroupName' in '$Location'..."
az group create --name $ResourceGroupName --location $Location | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Error "❌ Failed to create or verify resource group."
  exit 1
}

Write-Host "🧱 Creating storage account '$StorageAccountName'..."
az storage account create --name $StorageAccountName --resource-group $ResourceGroupName --location $Location --sku Standard_LRS --kind StorageV2 --access-tier Hot | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Error "❌ Failed to create or verify storage account."
  exit 1
}

Write-Host "📁 Creating storage container '$ContainerName'..."
az storage container create --name $ContainerName --account-name $StorageAccountName --auth-mode login | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Error "❌ Failed to create or verify storage container."
  exit 1
}

Write-Host "✅ Bootstrap completed successfully."
Write-Host "Next step: cd infra; terraform init; terraform plan -var-file=\"terraform.tfvars\"; terraform apply -var-file=\"terraform.tfvars\""

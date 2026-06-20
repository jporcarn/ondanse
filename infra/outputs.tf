output "resource_group_name" {
  description = "The name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "backend_web_app_name" {
  description = "The name of the backend Linux Web App"
  value       = azurerm_linux_web_app.backend.name
}

output "frontend_static_site_name" {
  description = "The name of the frontend Static Web App"
  value       = azurerm_static_web_app.frontend.name
}

output "cosmosdb_account_name" {
  description = "The name of the Cosmos DB account"
  value       = azurerm_cosmosdb_account.main.name
}

output "application_insights_name" {
  description = "The name of the Application Insights resource"
  value       = azurerm_application_insights.main.name
}

output "key_vault_name" {
  description = "The name of the Key Vault resource"
  value       = azurerm_key_vault.main.name
}

terraform {
  backend "azurerm" {
    resource_group_name  = "ondanse-tfstate-rg"
    storage_account_name = "ondansetfstate"
    container_name       = "tfstate"
    key                  = "terraform.tfstate"
  }
}

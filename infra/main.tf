locals {
  tags = {
    author  = "Josep Porcar Nadal"
    email   = "jjppnn@hotmail.com"
    project = "ondanse"
  }
}

data "azurerm_client_config" "current" {}

resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location

  tags = local.tags
}

resource "azurerm_service_plan" "backend" {
  name                = "${var.project_name}-plan"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  os_type             = "Linux"
  sku_name            = "B1"

  tags = local.tags
}

resource "azurerm_linux_web_app" "backend" {
  name                = "${var.project_name}-api"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  service_plan_id     = azurerm_service_plan.backend.id

  site_config {
    application_stack {
      node_version = "20-lts"
    }

    # Linux App Service assigns the port via the PORT env var and forwards to it;
    # the app reads process.env.PORT. Do not set WEBSITES_PORT for built-in Node.
    app_command_line = "node dist/index.js"
  }

  app_settings = {
    "NODE_ENV" = var.environment
  }

  https_only = true

  tags = merge(local.tags, { environment = var.environment })
}

resource "azurerm_static_web_app" "frontend" {
  name                = "${var.project_name}-web"
  resource_group_name = azurerm_resource_group.main.name
  location            = "westeurope"
  sku_size            = "Free"
  sku_tier            = "Free"

  tags = merge(local.tags, { environment = var.environment })
}

resource "azurerm_cosmosdb_account" "main" {
  name                = "${var.project_name}cosmos"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  offer_type          = "Standard"
  kind                = "MongoDB"

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = azurerm_resource_group.main.location
    failover_priority = 0
  }

  capabilities {
    name = "EnableMongo"
  }

  enable_automatic_failover         = false
  is_virtual_network_filter_enabled = false

  tags = local.tags
}

resource "azurerm_cosmosdb_mongo_database" "ondanse" {
  name                = "ondanse"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
}

resource "azurerm_cosmosdb_mongo_collection" "festivals" {
  name                = "festivals"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_mongo_database.ondanse.name

  index {
    keys   = ["_id"]
    unique = true
  }

  # Secondary indexes for the discovery filters (date range + dance style).
  index {
    keys = ["startDateUtc"]
  }

  index {
    keys = ["style"]
  }

  # NOTE: the `2dsphere` geospatial index on `location.geo` that powers the
  # proximity ($near) query CANNOT be expressed here — the azurerm provider's
  # `index` block only supports `keys` + `unique`, not an index type. It is
  # created at runtime by the backend data-access layer (request 0001, task 1.3)
  # via `db.festivals.createIndex({ "location.geo": "2dsphere" })`.
}

# DJ/artist names normalized for typeahead + filtering (request 0001 task 2.3),
# referenced from each festival's `lineup`.
resource "azurerm_cosmosdb_mongo_collection" "artists" {
  name                = "artists"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_mongo_database.ondanse.name

  index {
    keys   = ["_id"]
    unique = true
  }

  # Prefix typeahead lookups query by name.
  index {
    keys = ["name"]
  }
}

# Minimal identity for logged-in users (Facebook provider id, display name,
# locale). No passwords are stored (request 0001 task 6.2).
resource "azurerm_cosmosdb_mongo_collection" "users" {
  name                = "users"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_mongo_database.ondanse.name

  index {
    keys   = ["_id"]
    unique = true
  }

  # The Facebook user id is the natural identity key; enforce uniqueness.
  index {
    keys   = ["facebookUserId"]
    unique = true
  }
}

# Account-based saved favorite DJs/artists, keyed by user id (request 0001 task 6.3).
resource "azurerm_cosmosdb_mongo_collection" "favorites" {
  name                = "favorites"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_mongo_database.ondanse.name

  index {
    keys   = ["_id"]
    unique = true
  }

  index {
    keys = ["userId"]
  }
}

# Account-based saved festival searches, keyed by user id (request 0001 task 6.3).
resource "azurerm_cosmosdb_mongo_collection" "saved_searches" {
  name                = "savedSearches"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_mongo_database.ondanse.name

  index {
    keys   = ["_id"]
    unique = true
  }

  index {
    keys = ["userId"]
  }
}

resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.project_name}-logs"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = local.tags
}

resource "azurerm_application_insights" "main" {
  name                = "${var.project_name}-ai"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"

  tags = local.tags
}

resource "azurerm_key_vault" "main" {
  name                        = "${var.project_name}-kv"
  location                    = azurerm_resource_group.main.location
  resource_group_name         = azurerm_resource_group.main.name
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  sku_name                    = "standard"
  soft_delete_retention_days  = 7
  purge_protection_enabled    = false
  enabled_for_disk_encryption = true
}

resource "azurerm_key_vault_access_policy" "main" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azurerm_client_config.current.object_id

  secret_permissions = [
    "Get",
    "List",
    "Set"
  ]
}

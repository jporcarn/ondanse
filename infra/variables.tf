variable "resource_group_name" {
  type    = string
  default = "ondanse-rg"
}

variable "location" {
  type    = string
  default = "westeurope"
}

variable "project_name" {
  type    = string
  default = "ondanse"
}

variable "environment" {
  type    = string
  default = "Development"
}

variable "storage_account_name" {
  type    = string
  default = "ondansetfstate"
}

variable "static_site_repository_url" {
  type    = string
  default = "https://github.com/jporcarn/ondanse"
}

variable "static_site_branch" {
  type    = string
  default = "main"
}

variable "static_site_app_location" {
  type    = string
  default = "packages/frontend"
}

variable "static_site_api_location" {
  type    = string
  default = ""
}

variable "static_site_output_location" {
  type    = string
  default = "dist"
}

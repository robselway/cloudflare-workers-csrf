provider "cloudflare" {}

provider "null" {}

provider "azurerm" {
    version = "~>2.12.0"
    features {}
}
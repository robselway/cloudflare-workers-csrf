resource "azurerm_resource_group" "this" {
    name = "we-say-design"
    location = "North Europe"
}

resource "azurerm_storage_account" "this" {
    name                     = "wesaydesignsiteprod"
    resource_group_name      = azurerm_resource_group.this.name
    location                 = azurerm_resource_group.this.location
    account_tier             = "Standard"
    account_replication_type = "GRS"

    static_website {
        index_document = "index.html"
    }
}

resource "azurerm_cdn_profile" "this" {
  name                = "wesaydesign-prod-cdn"
  location            = azurerm_resource_group.this.location
  resource_group_name = azurerm_resource_group.this.name
  sku                 = "Standard_Microsoft"
}

resource "azurerm_cdn_endpoint" "this" {
  name                = "wesaydesign-prod"
  profile_name        = azurerm_cdn_profile.this.name
  location            = azurerm_resource_group.this.location
  resource_group_name = azurerm_resource_group.this.name
  origin_host_header = azurerm_storage_account.this.primary_web_host

  origin {
    name      = "this"
    host_name = azurerm_storage_account.this.primary_web_host
  }
}

resource "null_resource" "cdn_custom_domain" {
    triggers = {
        endpoint_name = "wesaydesign-prod"
        profile = "wesaydesign-prod-cdn"
        domain = "www.wesaydesign.co.uk"
    }

    provisioner "local-exec" {
        command = <<EOF
            az cdn custom-domain create --endpoint-name wesaydesign-prod --hostname www.wesaydesign.co.uk --name this --profile-name wesaydesign-prod-cdn --resource-group ${azurerm_resource_group.this.name}
        EOF
    }

    depends_on = [azurerm_resource_group.this, azurerm_cdn_profile.this, azurerm_cdn_endpoint.this]
}
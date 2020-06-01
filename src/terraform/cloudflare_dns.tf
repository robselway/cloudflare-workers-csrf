resource "cloudflare_zone" "this" {
    zone = "wesaydesign.co.uk"
}

# Add a record to the domain
resource "cloudflare_record" "root_cname" {
  zone_id = cloudflare_zone.this.id
  name    = "wesaydesign.co.uk"
  value   = "wesaydesign-prod.azureedge.net"
  type    = "CNAME"
  ttl     = 1
  proxied = true
}

resource "cloudflare_record" "www_cname" {
  zone_id = cloudflare_zone.this.id
  name    = "www"
  value   = "wesaydesign-prod.azureedge.net"
  type    = "CNAME"
  ttl     = 1
  proxied = true
}

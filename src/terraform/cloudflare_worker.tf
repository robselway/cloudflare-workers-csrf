resource "cloudflare_worker_script" "this" {
  name = "wesaydesign-csrf-worker"
  content = "${file("../worker/dist/bundle.js")}"

  kv_namespace_binding {
    name = "CSRF_SECRETS"
    namespace_id = cloudflare_workers_kv_namespace.csrf_secrets.id
  }
}

resource "cloudflare_worker_route" "this" {
  zone_id = "${cloudflare_zone.this.id}"
  pattern = "www.wesaydesign.co.uk/members*"
  script_name = cloudflare_worker_script.this.name
}

resource "cloudflare_workers_kv_namespace" "csrf_secrets" {
  title = "CSRF_SECRETS"
}
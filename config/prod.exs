import Config

truthy_env? = fn name ->
  case System.get_env(name) do
    value when value in ["1", "true", "TRUE", "yes", "YES", "on", "ON"] -> true
    _ -> false
  end
end

force_ssl_exclude_hosts = ["localhost", "127.0.0.1", "::1"]
hsts_subdomains? = truthy_env?.("HSTS_INCLUDE_SUBDOMAINS")
hsts_preload? = truthy_env?.("HSTS_PRELOAD")

config :portfolio_live, PortfolioLiveWeb.Endpoint,
  cache_static_manifest: "priv/static/cache_manifest.json"

# SEC522 3.6 hardening:
# - force HTTPS in production
# - send HSTS for the whole site
# - enable subdomains/preload only when the deployment is fully HTTPS
config :portfolio_live, PortfolioLiveWeb.Endpoint,
  force_ssl: [
    rewrite_on: [:x_forwarded_proto],
    hsts: true,
    subdomains: hsts_subdomains?,
    preload: hsts_preload?,
    exclude: [
      hosts: force_ssl_exclude_hosts
    ]
  ]

config :swoosh, api_client: Swoosh.ApiClient.Req
config :swoosh, local: false
config :logger, level: :info

config :portfolio_live, :session_secure, true
config :portfolio_live, :session_same_site, "Strict"

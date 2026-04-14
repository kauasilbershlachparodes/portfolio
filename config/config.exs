# This file is responsible for configuring your application
# and its dependencies with the aid of the Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
import Config

config :portfolio_live,
  generators: [timestamp_type: :utc_datetime]

config :portfolio_live,
  session_same_site: "Strict",
  session_secure: config_env() == :prod,
  max_request_body_bytes: 64_000,
  input_max_depth: 4,
  input_max_keys: 32,
  input_max_list_items: 8,
  input_max_string_bytes: 8_192,
  auth_concurrency_window_ms: 10_000

# Configure the endpoint
config :portfolio_live, PortfolioLiveWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [html: PortfolioLiveWeb.ErrorHTML, json: PortfolioLiveWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: PortfolioLive.PubSub,
  live_view: [signing_salt: "/SVw/Qok"]

# Configure the mailer
#
# By default it uses the "Local" adapter which stores the emails
# locally. You can see the emails in your browser, at "/dev/mailbox".
#
# For production it's recommended to configure a different adapter
# at the `config/runtime.exs`.
config :portfolio_live, PortfolioLive.Mailer, adapter: Swoosh.Adapters.Local

# Configure esbuild (the version is required)
config :esbuild,
  version: "0.25.4",
  portfolio_live: [
    args:
      ~w(js/app.js --bundle --target=es2022 --outdir=../priv/static/assets/js --external:/fonts/* --external:/images/* --alias:@=.),
    cd: Path.expand("../assets", __DIR__),
    env: %{"NODE_PATH" => [Path.expand("../deps", __DIR__), Mix.Project.build_path()]}
  ]

# Configure tailwind (the version is required)
config :tailwind,
  version: "4.1.12",
  portfolio_live: [
    args: ~w(
      --input=assets/css/app.css
      --output=priv/static/assets/css/app.css
    ),
    cd: Path.expand("..", __DIR__)
  ]

# Configure Elixir's Logger
config :logger, :default_formatter,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{config_env()}.exs"

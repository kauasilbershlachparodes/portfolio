defmodule PortfolioLiveWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :portfolio_live

  @session_secure Application.compile_env(:portfolio_live, :session_secure, false)
  @session_same_site Application.compile_env(:portfolio_live, :session_same_site, "Lax")
  @max_request_body_bytes Application.compile_env(
                            :portfolio_live,
                            :max_request_body_bytes,
                            64_000
                          )
  @block_mirror_agents Application.compile_env(:portfolio_live, :block_mirror_agents, true)

  @session_options [
    store: :cookie,
    key: "illuminati_portfolio_session",
    signing_salt: "w/sC/1Re",
    encryption_salt: "E6j9Q2pL",
    same_site: @session_same_site,
    secure: @session_secure,
    http_only: true
  ]

  socket("/live", Phoenix.LiveView.Socket, websocket: [connect_info: [session: @session_options]])

  plug(Phoenix.LiveDashboard.RequestLogger,
    param_key: "request_logger",
    cookie_key: "request_logger"
  )

  plug(Plug.RequestId)
  plug(Plug.Telemetry, event_prefix: [:phoenix, :endpoint])
  plug(PortfolioLiveWeb.Plugs.EnforceRequestTrust)

  if @block_mirror_agents do
    plug(PortfolioLiveWeb.Plugs.BlockMirrorAgentsPlug)
  end

  plug(Plug.Static,
    at: "/",
    from: :portfolio_live,
    gzip: not code_reloading?,
    only: PortfolioLiveWeb.static_paths(),
    raise_on_missing_only: code_reloading?,
    cache_control_for_etags: "public, max-age=31536000, immutable",
    cache_control_for_vsn_requests: "public, max-age=31536000, immutable"
  )

  if code_reloading? do
    socket("/phoenix/live_reload/socket", Phoenix.LiveReloader.Socket)
    plug(Phoenix.LiveReloader)
    plug(Phoenix.CodeReloader)
  end

  plug(Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: [
      "application/json",
      "application/*+json",
      "multipart/form-data",
      "application/x-www-form-urlencoded"
    ],
    length: @max_request_body_bytes,
    json_decoder: Phoenix.json_library()
  )

  plug(Plug.MethodOverride)
  plug(Plug.Head)
  plug(Plug.Session, @session_options)
  plug(PortfolioLiveWeb.Router)
end

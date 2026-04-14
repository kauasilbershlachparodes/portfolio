defmodule PortfolioLiveWeb.Plugs.IncidentContainment do
  @moduledoc """
  Gives the application an emergency containment mode.

  Supported switches:

    * `:incident_read_only_mode` - blocks unsafe methods globally while still
      allowing health endpoints to be checked by monitoring systems.
    * `:incident_disable_auth_routes` - blocks write access to authentication
      endpoints during containment and recovery.

  Both switches default to `false` and are meant to be enabled only during an
  active incident or controlled recovery window.
  """

  @behaviour Plug

  import Plug.Conn
  require Logger

  @safe_methods ~w(GET HEAD OPTIONS)

  @impl true
  def init(opts), do: opts

  @impl true
  def call(conn, _opts) do
    conn
    |> maybe_enforce_read_only_mode()
    |> maybe_disable_auth_routes()
  end

  defp maybe_enforce_read_only_mode(%Plug.Conn{halted: true} = conn), do: conn

  defp maybe_enforce_read_only_mode(conn) do
    read_only_mode? = Application.get_env(:portfolio_live, :incident_read_only_mode, false)

    allow_read_paths =
      Application.get_env(:portfolio_live, :incident_allow_read_paths, ["/healthz", "/readyz"])

    cond do
      not read_only_mode? ->
        conn

      conn.method in @safe_methods ->
        conn

      conn.request_path in allow_read_paths ->
        conn

      true ->
        reject(
          conn,
          :service_unavailable,
          "incident_read_only_mode",
          "Application temporarily in containment mode."
        )
    end
  end

  defp maybe_disable_auth_routes(%Plug.Conn{halted: true} = conn), do: conn

  defp maybe_disable_auth_routes(conn) do
    disable_auth_routes? =
      Application.get_env(:portfolio_live, :incident_disable_auth_routes, false)

    blocked_auth_paths =
      Application.get_env(:portfolio_live, :incident_blocked_auth_paths, [
        "/auth/login",
        "/auth/session",
        "/logout"
      ])

    cond do
      not disable_auth_routes? ->
        conn

      conn.method in @safe_methods ->
        conn

      conn.request_path not in blocked_auth_paths ->
        conn

      true ->
        reject(
          conn,
          :service_unavailable,
          "incident_disable_auth_routes",
          "Authentication is temporarily unavailable during incident handling."
        )
    end
  end

  defp reject(conn, status, security_event, message) do
    Logger.warning("request blocked by incident containment: #{security_event}")

    :telemetry.execute(
      [:portfolio_live, :security, :request_blocked],
      %{count: 1},
      %{
        reason: security_event,
        method: conn.method,
        path: conn.request_path
      }
    )

    conn
    |> put_resp_header("retry-after", "300")
    |> put_resp_header("cache-control", "no-store")
    |> put_resp_content_type(response_content_type(conn))
    |> send_resp(status, response_body(conn, message))
    |> halt()
  end

  defp response_content_type(conn) do
    if wants_json?(conn), do: "application/json", else: "text/plain"
  end

  defp response_body(conn, message) do
    if wants_json?(conn) do
      Phoenix.json_library().encode!(%{ok: false, error: message})
    else
      message
    end
  end

  defp wants_json?(conn) do
    json_accept? =
      conn
      |> get_req_header("accept")
      |> Enum.any?(&String.contains?(&1, "json"))

    json_accept? or String.starts_with?(conn.request_path, "/auth/")
  end
end

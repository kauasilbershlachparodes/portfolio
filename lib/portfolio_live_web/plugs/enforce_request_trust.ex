defmodule PortfolioLiveWeb.Plugs.EnforceRequestTrust do
  @moduledoc """
  Defense-in-depth against host-header confusion and cross-origin unsafe
  browser requests.

  This plug complements:

    * `check_origin` for LiveView / websocket origins
    * `force_ssl` in production
    * the runtime allowlists for trusted hosts and origins

  It blocks:

    * unexpected `Host` values, and `X-Forwarded-Host` only when explicitly trusted
    * unsafe browser requests (`POST`, `PUT`, `PATCH`, `DELETE`) that carry
      an untrusted `Origin` or `Referer`
  """

  @behaviour Plug

  import Plug.Conn
  require Logger

  alias PortfolioLive.Net.IPUtils

  @safe_methods ~w(GET HEAD OPTIONS TRACE)
  @default_allowed_hosts ["localhost", "127.0.0.1", "::1"]

  @impl true
  def init(opts), do: opts

  @impl true
  def call(conn, _opts) do
    conn
    |> maybe_reject_untrusted_host()
    |> maybe_reject_cross_origin_unsafe_request()
  end

  defp maybe_reject_untrusted_host(%Plug.Conn{halted: true} = conn), do: conn

  defp maybe_reject_untrusted_host(conn) do
    allowed_hosts =
      Application.get_env(:portfolio_live, :allowed_hosts, @default_allowed_hosts)
      |> Enum.map(&IPUtils.normalize_host/1)
      |> Enum.reject(&is_nil/1)
      |> MapSet.new()

    request_hosts = request_host_candidates(conn)

    if request_hosts != [] and Enum.all?(request_hosts, &MapSet.member?(allowed_hosts, &1)) do
      conn
    else
      reject(conn, :bad_request, "invalid_host_header", "Invalid host header.")
    end
  end

  defp maybe_reject_cross_origin_unsafe_request(%Plug.Conn{halted: true} = conn), do: conn

  defp maybe_reject_cross_origin_unsafe_request(conn) do
    enforce? = Application.get_env(:portfolio_live, :enforce_same_origin_on_unsafe_methods, true)

    cond do
      not enforce? ->
        conn

      conn.method in @safe_methods ->
        conn

      sec_fetch_cross_site?(conn) ->
        reject(conn, :forbidden, "cross_origin_request_blocked", "Cross-origin request blocked.")

      true ->
        case request_origin_candidate(conn) do
          nil ->
            conn

          request_origin ->
            allowed_origins = allowed_origins(conn)

            if request_origin in allowed_origins do
              conn
            else
              reject(
                conn,
                :forbidden,
                "cross_origin_request_blocked",
                "Cross-origin request blocked."
              )
            end
        end
    end
  end

  defp allowed_origins(conn) do
    configured_origins =
      Application.get_env(:portfolio_live, :allowed_origins, [])
      |> Enum.map(&IPUtils.normalize_origin/1)

    public_base_origin =
      :portfolio_live
      |> Application.get_env(:public_base_url)
      |> IPUtils.normalize_origin()

    current_request_origin = current_request_origin(conn)

    [public_base_origin, current_request_origin | configured_origins]
    |> Enum.reject(&is_nil/1)
    |> Enum.uniq()
  end

  defp current_request_origin(conn) do
    IPUtils.origin_from_parts(conn.scheme, conn.host, conn.port)
  end

  defp request_host_candidates(conn) do
    forwarded_hosts =
      if Application.get_env(:portfolio_live, :trust_x_forwarded_host, false) do
        conn
        |> get_req_header("x-forwarded-host")
        |> Enum.flat_map(&split_csv_header/1)
        |> Enum.map(&IPUtils.normalize_host/1)
      else
        []
      end

    [IPUtils.normalize_host(conn.host) | forwarded_hosts]
    |> Enum.reject(&is_nil/1)
    |> Enum.uniq()
  end

  defp request_origin_candidate(conn) do
    origin = conn |> get_req_header("origin") |> List.first()
    referer = conn |> get_req_header("referer") |> List.first()

    cond do
      is_binary(origin) and String.trim(origin) != "" -> IPUtils.normalize_origin(origin)
      is_binary(referer) and String.trim(referer) != "" -> IPUtils.normalize_origin(referer)
      true -> nil
    end
  end

  defp sec_fetch_cross_site?(conn) do
    conn
    |> get_req_header("sec-fetch-site")
    |> List.first()
    |> case do
      value when is_binary(value) ->
        value = String.trim(String.downcase(value))
        value not in ["", "same-origin", "same-site", "none"]

      _ ->
        false
    end
  end

  defp split_csv_header(value) when is_binary(value) do
    value
    |> String.split(",", trim: true)
    |> Enum.map(&String.trim/1)
    |> Enum.reject(&(&1 == ""))
  end

  defp split_csv_header(_value), do: []

  defp reject(conn, status, security_event, message) do
    Logger.warning("request blocked by trust enforcement: #{security_event}")

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
    |> put_resp_content_type("text/plain")
    |> put_resp_header("cache-control", "no-store")
    |> put_resp_header("pragma", "no-cache")
    |> send_resp(status, message)
    |> halt()
  end
end

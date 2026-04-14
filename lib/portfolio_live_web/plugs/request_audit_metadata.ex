defmodule PortfolioLiveWeb.Plugs.RequestAuditMetadata do
  @moduledoc """
  Adds low-noise request metadata that helps operations and incident response.

  The metadata is intentionally limited to routing and network context and
  excludes sensitive request bodies such as credentials or tokens.

  IPv4 and IPv6 are formatted through `:inet.ntoa/1`, which avoids incorrect
  decimal joining for IPv6 tuples.
  """

  @behaviour Plug

  require Logger

  alias PortfolioLive.Net.IPUtils

  @impl true
  def init(opts), do: opts

  @impl true
  def call(conn, _opts) do
    Logger.metadata(
      remote_ip: IPUtils.format_remote_ip(conn.remote_ip),
      request_method: conn.method,
      request_path: sanitize(conn.request_path),
      request_host: sanitize(IPUtils.normalize_host(conn.host) || conn.host)
    )

    conn
  end

  defp sanitize(nil), do: nil

  defp sanitize(value) when is_binary(value) do
    value
    |> String.replace(~r/[\r\n\t\0]/u, " ")
    |> String.slice(0, 256)
  end

  defp sanitize(value), do: sanitize(to_string(value))
end

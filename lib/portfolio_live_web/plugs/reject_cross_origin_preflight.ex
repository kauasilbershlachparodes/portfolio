defmodule PortfolioLiveWeb.Plugs.RejectCrossOriginPreflight do
  @moduledoc """
  Explicitly denies cross-origin CORS preflight requests unless the origin,
  method, headers and path are all allowlisted.
  """

  @behaviour Plug

  import Plug.Conn

  alias PortfolioLive.Net.IPUtils

  @default_allowed_methods MapSet.new(~w(GET POST PUT PATCH DELETE OPTIONS HEAD))
  @simple_headers MapSet.new(["accept", "accept-language", "content-language", "content-type"])

  @impl true
  def init(opts), do: opts

  @impl true
  def call(conn, _opts) do
    if cors_preflight?(conn) do
      handle_preflight(conn)
    else
      conn
    end
  end

  defp cors_preflight?(conn) do
    conn.method == "OPTIONS" and
      get_req_header(conn, "origin") != [] and
      get_req_header(conn, "access-control-request-method") != []
  end

  defp handle_preflight(conn) do
    requested_origin = IPUtils.normalize_origin(List.first(get_req_header(conn, "origin")))
    requested_method = requested_method(conn)
    requested_headers = requested_headers(conn)

    conn =
      put_resp_header(
        conn,
        "vary",
        "Origin, Access-Control-Request-Method, Access-Control-Request-Headers"
      )

    if preflight_allowed?(conn, requested_origin, requested_method, requested_headers) do
      conn
      |> put_resp_header("cache-control", "no-store")
      |> put_resp_header("access-control-allow-origin", requested_origin)
      |> put_resp_header("access-control-allow-methods", requested_method)
      |> put_resp_header("access-control-allow-headers", Enum.join(requested_headers, ", "))
      |> put_resp_header("access-control-max-age", "300")
      |> send_resp(204, "")
      |> halt()
    else
      conn
      |> put_resp_content_type("text/plain")
      |> put_resp_header("cache-control", "no-store")
      |> send_resp(403, "Cross-origin request blocked.")
      |> halt()
    end
  end

  defp preflight_allowed?(conn, origin, method, headers) do
    allowed_origins =
      Application.get_env(:portfolio_live, :allowed_origins, [])
      |> Enum.map(&IPUtils.normalize_origin/1)
      |> Enum.reject(&is_nil/1)
      |> MapSet.new()

    allowed_paths =
      Application.get_env(:portfolio_live, :cors_allowed_paths, [])
      |> Enum.map(&normalize_path_rule/1)
      |> Enum.reject(&is_nil/1)

    allowed_methods =
      Application.get_env(
        :portfolio_live,
        :cors_allowed_methods,
        MapSet.to_list(@default_allowed_methods)
      )
      |> Enum.map(&to_string/1)
      |> Enum.map(&String.upcase/1)
      |> MapSet.new()

    allowed_headers =
      Application.get_env(:portfolio_live, :cors_allowed_headers, [])
      |> Enum.map(&to_string/1)
      |> Enum.map(&String.downcase/1)
      |> MapSet.new()

    not is_nil(origin) and
      method in allowed_methods and
      MapSet.member?(allowed_origins, origin) and
      path_allowed?(conn.request_path, allowed_paths) and
      Enum.all?(headers, fn header ->
        MapSet.member?(@simple_headers, header) or MapSet.member?(allowed_headers, header)
      end)
  end

  defp requested_method(conn) do
    conn
    |> get_req_header("access-control-request-method")
    |> List.first()
    |> to_string()
    |> String.trim()
    |> String.upcase()
  end

  defp requested_headers(conn) do
    conn
    |> get_req_header("access-control-request-headers")
    |> List.first()
    |> to_string()
    |> String.split(",", trim: true)
    |> Enum.map(&String.trim/1)
    |> Enum.map(&String.downcase/1)
    |> Enum.reject(&(&1 == ""))
    |> Enum.uniq()
  end

  defp path_allowed?(path, allowed_paths) when is_binary(path) do
    Enum.any?(allowed_paths, fn
      %{prefix: prefix} -> String.starts_with?(path, prefix)
      %{exact: exact} -> path == exact
    end)
  end

  defp path_allowed?(_path, _allowed_paths), do: false

  defp normalize_path_rule(value) when is_binary(value) do
    trimmed = String.trim(value)

    cond do
      trimmed == "" ->
        nil

      String.ends_with?(trimmed, "*") ->
        %{prefix: String.trim_trailing(trimmed, "*")}

      true ->
        %{exact: trimmed}
    end
  end

  defp normalize_path_rule(_value), do: nil
end

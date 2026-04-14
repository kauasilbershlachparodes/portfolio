defmodule PortfolioLiveWeb.Plugs.RejectSensitiveQueryParams do
  @moduledoc false

  import Plug.Conn

  alias PortfolioLive.InputSafety

  def init(opts) do
    opts
    |> Keyword.get(:keys, [])
    |> Enum.map(&String.downcase/1)
    |> MapSet.new()
  end

  def call(conn, forbidden_keys) do
    conn = fetch_query_params(conn)

    if forbidden_query_key?(conn.query_params, forbidden_keys) or
         forbidden_query_key_in_raw_query?(conn.query_string, forbidden_keys) do
      reject(conn, 400, "Parâmetros sensíveis devem ser enviados apenas no corpo da requisição.")
    else
      conn
    end
  end

  defp forbidden_query_key?(map, forbidden_keys) when is_map(map) do
    Enum.any?(map, fn {key, value} ->
      forbidden_key_name?(key, forbidden_keys) or forbidden_query_key?(value, forbidden_keys)
    end)
  end

  defp forbidden_query_key?(list, forbidden_keys) when is_list(list) do
    Enum.any?(list, &forbidden_query_key?(&1, forbidden_keys))
  end

  defp forbidden_query_key?(%Plug.Upload{}, _forbidden_keys), do: false
  defp forbidden_query_key?(%_{}, _forbidden_keys), do: false
  defp forbidden_query_key?(_value, _forbidden_keys), do: false

  defp forbidden_query_key_in_raw_query?(nil, _forbidden_keys), do: false
  defp forbidden_query_key_in_raw_query?("", _forbidden_keys), do: false

  defp forbidden_query_key_in_raw_query?(query_string, forbidden_keys) do
    query_string
    |> String.split("&", trim: true)
    |> Enum.any?(fn pair ->
      pair
      |> String.split("=", parts: 2)
      |> hd()
      |> URI.decode_www_form()
      |> forbidden_key_name?(forbidden_keys)
    end)
  end

  defp forbidden_key_name?(key, forbidden_keys) do
    key
    |> to_string()
    |> String.split(~r/[\[\].]+/u, trim: true)
    |> Enum.map(fn fragment ->
      fragment
      |> InputSafety.normalize_text(trim: true, blank_nil: false)
      |> to_string()
      |> String.downcase()
    end)
    |> Enum.any?(&MapSet.member?(forbidden_keys, &1))
  end

  defp reject(conn, status, message) do
    body = Phoenix.json_library().encode!(%{ok: false, error: message})

    conn
    |> put_resp_content_type("application/json", "utf-8")
    |> put_resp_header("cache-control", "no-store")
    |> send_resp(status, body)
    |> halt()
  end
end

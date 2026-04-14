defmodule PortfolioLiveWeb.Plugs.RejectDuplicateParams do
  @moduledoc false

  import Plug.Conn

  alias PortfolioLive.InputSafety

  def init(opts), do: opts

  def call(conn, _opts) do
    conn = fetch_query_params(conn)

    cond do
      duplicate_query_keys?(conn.query_string) ->
        reject(conn, 400, "A requisição contém parâmetros duplicados e não pode ser processada.")

      duplicate_or_array_values?(conn.params) ->
        reject(conn, 400, "A requisição contém parâmetros duplicados e não pode ser processada.")

      true ->
        conn
    end
  end

  defp duplicate_query_keys?(""), do: false
  defp duplicate_query_keys?(nil), do: false

  defp duplicate_query_keys?(query_string) do
    query_string
    |> String.split("&", trim: true)
    |> Enum.map(fn pair ->
      pair
      |> String.split("=", parts: 2)
      |> hd()
      |> URI.decode_www_form()
      |> InputSafety.normalize_text(trim: true, blank_nil: false)
      |> String.downcase()
    end)
    |> Enum.reject(&(&1 == ""))
    |> then(fn keys -> length(keys) != length(Enum.uniq(keys)) end)
  end

  defp duplicate_or_array_values?(%Plug.Upload{}), do: false
  defp duplicate_or_array_values?(%_{}), do: false

  defp duplicate_or_array_values?(map) when is_map(map) do
    Enum.any?(map, fn
      {_key, value} when is_list(value) -> true
      {_key, value} -> duplicate_or_array_values?(value)
    end)
  end

  defp duplicate_or_array_values?(list) when is_list(list), do: true
  defp duplicate_or_array_values?(_), do: false

  defp reject(conn, status, message) do
    body = Phoenix.json_library().encode!(%{ok: false, error: message})

    conn
    |> put_resp_content_type("application/json", "utf-8")
    |> put_resp_header("cache-control", "no-store")
    |> send_resp(status, body)
    |> halt()
  end
end

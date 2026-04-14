defmodule PortfolioLiveWeb.Plugs.RejectSessionFixation do
  @moduledoc """
  Rejects requests that try to supply a session identifier through query/body
  parameters, including nested parameter names such as `auth[sessionid]`.
  """

  import Plug.Conn

  @behaviour Plug

  @blocked_param_names MapSet.new([
                         "session",
                         "sessionid",
                         "sid",
                         "jsessionid",
                         "phpsessid",
                         "aspsessionid",
                         "cfid",
                         "cftoken",
                         "phx_session"
                       ])

  def init(opts), do: opts

  def call(conn, _opts) do
    conn = fetch_query_params(conn)

    blocked_keys =
      conn
      |> request_param_sources()
      |> Enum.flat_map(&collect_blocked_keys/1)
      |> Enum.uniq()

    case blocked_keys do
      [] ->
        conn

      keys ->
        body =
          Phoenix.json_library().encode!(%{
            ok: false,
            error: "Session identifier via URL/body não é suportado.",
            blocked_keys: keys
          })

        conn
        |> put_resp_header("cache-control", "no-store")
        |> put_resp_content_type("application/json")
        |> send_resp(:bad_request, body)
        |> halt()
    end
  end

  defp request_param_sources(conn) do
    [conn.query_params, body_params(conn)]
    |> Enum.filter(&is_map/1)
  end

  defp collect_blocked_keys(%Plug.Upload{}), do: []
  defp collect_blocked_keys(%_{}), do: []

  defp collect_blocked_keys(map) when is_map(map) do
    Enum.flat_map(map, fn {key, value} ->
      matched =
        key
        |> key_fragments()
        |> Enum.filter(&MapSet.member?(@blocked_param_names, &1))

      matched ++ collect_blocked_keys(value)
    end)
  end

  defp collect_blocked_keys(list) when is_list(list) do
    Enum.flat_map(list, &collect_blocked_keys/1)
  end

  defp collect_blocked_keys(_value), do: []

  defp key_fragments(key) do
    key
    |> to_string()
    |> String.split(~r/[\[\].]+/u, trim: true)
    |> Enum.map(&String.downcase/1)
  end

  defp body_params(%Plug.Conn{body_params: %Plug.Conn.Unfetched{}}), do: %{}
  defp body_params(%Plug.Conn{body_params: params}) when is_map(params), do: params
  defp body_params(_conn), do: %{}
end

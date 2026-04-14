defmodule PortfolioLiveWeb.Plugs.BlockMirrorAgentsPlug do
  @moduledoc false

  import Plug.Conn

  @default_blocked_patterns [
    "httrack",
    "webhttrack",
    "httrack website copier",
    "wget",
    "curl/",
    "python-requests",
    "python-urllib",
    "libwww-perl",
    "go-http-client",
    "aiohttp",
    "scrapy",
    "aria2"
  ]

  def init(opts), do: opts

  def call(conn, _opts) do
    if safe_method?(conn.method) and blocked_agent?(user_agent(conn)) do
      conn
      |> put_resp_header("cache-control", "no-store, max-age=0")
      |> send_resp(:forbidden, "Forbidden")
      |> halt()
    else
      conn
    end
  end

  defp user_agent(conn) do
    conn
    |> get_req_header("user-agent")
    |> List.first()
    |> to_string()
    |> String.downcase()
  end

  defp blocked_agent?(""), do: false

  defp blocked_agent?(user_agent) do
    blocked_patterns()
    |> Enum.any?(fn pattern -> String.contains?(user_agent, pattern) end)
  end

  defp blocked_patterns do
    case Application.get_env(
           :portfolio_live,
           :blocked_mirror_user_agents,
           @default_blocked_patterns
         ) do
      patterns when is_list(patterns) ->
        patterns
        |> Enum.map(&to_string/1)
        |> Enum.map(&String.downcase/1)
        |> Enum.reject(&(&1 == ""))

      _ ->
        @default_blocked_patterns
    end
  end

  defp safe_method?(method), do: method in ["GET", "HEAD"]
end

defmodule PortfolioLiveWeb.Plugs.BrowserHoneytoken do
  @moduledoc false

  import Plug.Conn
  require Logger

  def init(opts), do: opts

  def call(conn, opts) do
    if Application.get_env(:portfolio_live, :anti_automation_enabled, true) do
      case Keyword.get(opts, :mode, :set) do
        :set -> ensure_honeytoken(conn)
        :verify -> verify_honeytoken(conn)
        _ -> conn
      end
    else
      conn
    end
  end

  defp ensure_honeytoken(conn) do
    session_key = session_key()
    cookie_name = cookie_name()
    probe = get_session(conn, session_key) || generate_probe()

    conn =
      if get_session(conn, session_key) == probe do
        conn
      else
        put_session(conn, session_key, probe)
      end

    conn = fetch_cookies(conn)

    if secure_match?(conn.cookies[cookie_name], probe) do
      conn
    else
      put_resp_cookie(conn, cookie_name, probe, cookie_opts())
    end
  end

  defp verify_honeytoken(conn) do
    session_key = session_key()
    cookie_name = cookie_name()
    conn = fetch_cookies(conn)

    expected = get_session(conn, session_key)
    received = conn.cookies[cookie_name]

    cond do
      not is_binary(expected) or expected == "" ->
        block(conn, :missing_probe_session)

      not is_binary(received) or received == "" ->
        block(conn, :missing_probe_cookie)

      not secure_match?(received, expected) ->
        block(conn, :probe_cookie_tampered)

      true ->
        conn
    end
  end

  defp block(conn, reason) do
    Logger.warning(fn ->
      [
        "anti_automation_honeytoken_block",
        " path=",
        sanitize(conn.request_path),
        " reason=",
        sanitize(reason)
      ]
    end)

    conn
    |> put_resp_content_type("application/json")
    |> put_resp_header("cache-control", "no-store")
    |> put_resp_header("pragma", "no-cache")
    |> send_resp(
      403,
      Phoenix.json_library().encode!(%{ok: false, error: "Requisição bloqueada."})
    )
    |> halt()
  end

  defp cookie_name do
    Application.get_env(
      :portfolio_live,
      :anti_automation_honeytoken_cookie,
      "illuminati_browser_probe"
    )
  end

  defp session_key do
    Application.get_env(
      :portfolio_live,
      :anti_automation_honeytoken_session_key,
      :illuminati_browser_probe
    )
  end

  defp cookie_opts do
    [
      http_only: true,
      same_site: "Lax",
      path: "/",
      max_age: Application.get_env(:portfolio_live, :anti_automation_honeytoken_max_age, 1_800),
      secure: Application.get_env(:portfolio_live, :session_secure, false)
    ]
  end

  defp generate_probe do
    16
    |> :crypto.strong_rand_bytes()
    |> Base.url_encode64(padding: false)
  end

  defp secure_match?(left, right)
       when is_binary(left) and is_binary(right) and byte_size(left) == byte_size(right) do
    Plug.Crypto.secure_compare(left, right)
  end

  defp secure_match?(_, _), do: false

  defp sanitize(nil), do: "unknown"

  defp sanitize(value) when is_atom(value) do
    value
    |> Atom.to_string()
    |> sanitize()
  end

  defp sanitize(value) when is_binary(value) do
    value
    |> String.replace(~r/[\r\n\t\0]+/u, " ")
    |> String.trim()
    |> String.slice(0, 200)
  end

  defp sanitize(value), do: value |> to_string() |> sanitize()
end

defmodule PortfolioLiveWeb.Plugs.RejectInvalidRequestInput do
  @moduledoc false

  import Plug.Conn

  alias PortfolioLive.InputSafety

  @max_depth Application.compile_env(:portfolio_live, :input_max_depth, 4)
  @max_keys Application.compile_env(:portfolio_live, :input_max_keys, 32)
  @max_list_items Application.compile_env(:portfolio_live, :input_max_list_items, 8)
  @max_string_bytes Application.compile_env(:portfolio_live, :input_max_string_bytes, 8_192)

  def init(opts), do: opts

  def call(conn, _opts) do
    case InputSafety.validate_param_shape(conn.params,
           max_depth: @max_depth,
           max_keys: @max_keys,
           max_list_items: @max_list_items,
           max_string_bytes: @max_string_bytes
         ) do
      :ok ->
        conn

      {:error, reason} ->
        reject(conn, 400, reason)
    end
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

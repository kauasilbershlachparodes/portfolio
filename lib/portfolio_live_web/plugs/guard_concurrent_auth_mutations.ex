defmodule PortfolioLiveWeb.Plugs.GuardConcurrentAuthMutations do
  @moduledoc false

  import Plug.Conn

  @table :portfolio_live_auth_inflight
  @window_ms Application.compile_env(:portfolio_live, :auth_concurrency_window_ms, 10_000)

  def init(opts), do: opts

  def call(conn, _opts) when conn.method in ["POST", "PUT", "PATCH", "DELETE"] do
    table = ensure_table!()
    now = System.monotonic_time(:millisecond)
    key = request_key(conn)
    expires_at = now + @window_ms

    cleanup_expired(table, now)

    case :ets.lookup(table, key) do
      [{^key, active_until}] when active_until > now ->
        reject(conn, 429, "Já existe uma operação semelhante em andamento. Tente novamente.")

      _ ->
        true = :ets.insert(table, {key, expires_at})

        register_before_send(conn, fn conn ->
          :ets.delete(table, key)
          conn
        end)
    end
  end

  def call(conn, _opts), do: conn

  defp request_key(conn) do
    ua = Enum.join(get_req_header(conn, "user-agent"), " ")
    {conn.request_path, conn.remote_ip, ua}
  end

  defp ensure_table! do
    case :ets.whereis(@table) do
      :undefined ->
        :ets.new(@table, [
          :named_table,
          :public,
          :set,
          read_concurrency: true,
          write_concurrency: true
        ])

        @table

      table ->
        table
    end
  rescue
    ArgumentError -> @table
  end

  defp cleanup_expired(table, now) do
    match_spec = [{{:"$1", :"$2"}, [{:<, :"$2", now}], [true]}]
    :ets.select_delete(table, match_spec)
  end

  defp reject(conn, status, message) do
    body = Phoenix.json_library().encode!(%{ok: false, error: message})

    conn
    |> put_resp_content_type("application/json", "utf-8")
    |> put_resp_header("cache-control", "no-store")
    |> put_resp_header("retry-after", Integer.to_string(div(@window_ms, 1000)))
    |> send_resp(status, body)
    |> halt()
  end
end

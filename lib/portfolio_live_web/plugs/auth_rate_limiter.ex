defmodule PortfolioLive.Security.AuthRateLimiter do
  @moduledoc false

  @table :portfolio_live_auth_rate_limiter

  def allow_or_increment(key, opts \\ []) do
    max_attempts = Keyword.get(opts, :max_attempts, 5)
    window_ms = Keyword.get(opts, :window_ms, :timer.minutes(15))
    now = System.monotonic_time(:millisecond)

    ensure_table!()
    cleanup_expired(now)

    case :ets.lookup(@table, key) do
      [] ->
        true = :ets.insert(@table, {key, 1, now + window_ms})
        :ok

      [{^key, _count, expires_at}] when now >= expires_at ->
        true = :ets.insert(@table, {key, 1, now + window_ms})
        :ok

      [{^key, count, expires_at}] when count < max_attempts ->
        true = :ets.insert(@table, {key, count + 1, expires_at})
        :ok

      [{^key, _count, _expires_at}] ->
        {:error, :rate_limited}
    end
  end

  def reset(key) do
    ensure_table!()
    :ets.delete(@table, key)
    :ok
  end

  def retry_after_seconds(key) do
    ensure_table!()

    case :ets.lookup(@table, key) do
      [{^key, _count, expires_at}] ->
        remaining_ms = max(expires_at - System.monotonic_time(:millisecond), 0)
        max(div(remaining_ms + 999, 1000), 1)

      _ ->
        1
    end
  end

  defp ensure_table! do
    case :ets.info(@table) do
      :undefined ->
        try do
          :ets.new(@table, [
            :named_table,
            :protected,
            :set,
            read_concurrency: true,
            write_concurrency: true
          ])
        rescue
          ArgumentError -> :ok
        end

      _ ->
        :ok
    end
  end

  defp cleanup_expired(now) do
    match_spec = [
      {{:"$1", :"$2", :"$3"}, [{:<, :"$3", now}], [true]}
    ]

    :ets.select_delete(@table, match_spec)
    :ok
  rescue
    _ -> :ok
  end
end

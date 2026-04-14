defmodule PortfolioLiveWeb.Plugs.CanonicalizeParams do
  @moduledoc false

  import Plug.Conn

  alias PortfolioLive.InputSafety

  @sensitive_keys MapSet.new(
                    ~w(password password_confirmation access_token refresh_token token code)
                  )

  def init(opts), do: opts

  def call(conn, _opts) do
    conn = fetch_query_params(conn)

    with :ok <- ensure_no_normalization_collisions(conn.params),
         :ok <- ensure_no_normalization_collisions(conn.body_params),
         :ok <- ensure_no_normalization_collisions(conn.query_params) do
      params = InputSafety.canonicalize_params(conn.params, sensitive_keys: @sensitive_keys)
      body_params = canonicalize_container(conn.body_params)
      query_params = canonicalize_container(conn.query_params)

      %{conn | params: params, body_params: body_params, query_params: query_params}
    else
      {:error, message} ->
        body = Phoenix.json_library().encode!(%{ok: false, error: message})

        conn
        |> put_resp_content_type("application/json", "utf-8")
        |> put_resp_header("cache-control", "no-store")
        |> send_resp(:bad_request, body)
        |> halt()
    end
  end

  defp canonicalize_container(%Plug.Conn.Unfetched{} = value), do: value

  defp canonicalize_container(value) when is_map(value) do
    InputSafety.canonicalize_params(value, sensitive_keys: @sensitive_keys)
  end

  defp canonicalize_container(value), do: value

  defp ensure_no_normalization_collisions(%Plug.Conn.Unfetched{}), do: :ok
  defp ensure_no_normalization_collisions(%Plug.Upload{}), do: :ok
  defp ensure_no_normalization_collisions(%_{}), do: :ok

  defp ensure_no_normalization_collisions(map) when is_map(map) do
    normalized_keys =
      map
      |> Map.keys()
      |> Enum.map(&normalize_key/1)
      |> Enum.reject(&is_nil/1)

    cond do
      length(normalized_keys) != length(Enum.uniq(normalized_keys)) ->
        {:error, "A requisição contém chaves ambíguas após normalização."}

      true ->
        Enum.reduce_while(map, :ok, fn {_key, value}, _acc ->
          case ensure_no_normalization_collisions(value) do
            :ok -> {:cont, :ok}
            {:error, _} = error -> {:halt, error}
          end
        end)
    end
  end

  defp ensure_no_normalization_collisions(list) when is_list(list) do
    Enum.reduce_while(list, :ok, fn value, _acc ->
      case ensure_no_normalization_collisions(value) do
        :ok -> {:cont, :ok}
        {:error, _} = error -> {:halt, error}
      end
    end)
  end

  defp ensure_no_normalization_collisions(_value), do: :ok

  defp normalize_key(key) when is_binary(key) do
    InputSafety.normalize_text(key, trim: true, blank_nil: false)
  end

  defp normalize_key(key), do: to_string(key)
end

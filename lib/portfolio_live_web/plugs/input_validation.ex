defmodule PortfolioLiveWeb.Plugs.InputValidation do
  @moduledoc false
  import Plug.Conn

  @max_param_string_bytes Application.compile_env(:portfolio_live, :max_param_string_bytes, 4_096)
  @max_param_depth Application.compile_env(:portfolio_live, :max_param_depth, 4)
  @max_param_key_bytes Application.compile_env(:portfolio_live, :max_param_key_bytes, 128)

  def init(opts), do: opts

  def call(conn, _opts) do
    case validate_term(conn.params, 0) do
      :ok -> conn
      {:error, _reason} -> reject(conn)
    end
  end

  defp validate_term(_term, depth) when depth > @max_param_depth, do: {:error, :depth}

  defp validate_term(%Plug.Conn.Unfetched{}, _depth), do: :ok

  defp validate_term(term, depth) when is_map(term) do
    Enum.reduce_while(term, :ok, fn {key, value}, _acc ->
      with :ok <- validate_key(key),
           :ok <- validate_term(value, depth + 1) do
        {:cont, :ok}
      else
        {:error, reason} -> {:halt, {:error, reason}}
      end
    end)
  end

  defp validate_term(term, depth) when is_list(term) do
    Enum.reduce_while(term, :ok, fn value, _acc ->
      case validate_term(value, depth + 1) do
        :ok -> {:cont, :ok}
        {:error, reason} -> {:halt, {:error, reason}}
      end
    end)
  end

  defp validate_term(term, _depth) when is_binary(term) do
    cond do
      byte_size(term) > @max_param_string_bytes -> {:error, :too_large}
      contains_forbidden_control_bytes?(term) -> {:error, :control_bytes}
      true -> :ok
    end
  end

  defp validate_term(_term, _depth), do: :ok

  defp validate_key(key) when is_binary(key) do
    cond do
      byte_size(key) > @max_param_key_bytes -> {:error, :key_too_large}
      contains_forbidden_control_bytes?(key) -> {:error, :key_control_bytes}
      true -> :ok
    end
  end

  defp validate_key(_key), do: {:error, :invalid_key}

  defp contains_forbidden_control_bytes?(value) when is_binary(value) do
    String.contains?(value, ["\u0000", "\r", "\n"]) or
      Regex.match?(~r/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u, value)
  end

  defp reject(conn) do
    conn
    |> put_resp_content_type("text/plain")
    |> send_resp(:bad_request, "Invalid input.")
    |> halt()
  end
end

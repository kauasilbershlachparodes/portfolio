defmodule PortfolioLive.InputSafety do
  @moduledoc false

  @email_regex ~r/^[^\s@]+@[^\s@]+\.[^\s@]{2,63}$/u
  @control_characters ~r/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u
  @sensitive_keys MapSet.new(
                    ~w(password password_confirmation access_token refresh_token token code)
                  )

  def normalize_text(value, opts \\ [])

  def normalize_text(value, opts) when is_binary(value) do
    trim? = Keyword.get(opts, :trim, true)
    blank_nil? = Keyword.get(opts, :blank_nil, true)

    value
    |> to_valid_utf8()
    |> String.normalize(:nfkc)
    |> maybe_trim(trim?)
    |> maybe_nil_if_blank(blank_nil?)
  rescue
    ArgumentError -> nil
  end

  def normalize_text(_value, _opts), do: nil

  def normalize_email(value) do
    value
    |> normalize_text()
    |> case do
      nil -> nil
      email -> String.downcase(email)
    end
  end

  def valid_email?(value) when is_binary(value) do
    byte_size(value) <= 320 and
      value == normalize_email(value) and
      String.match?(value, @email_regex) and
      not String.contains?(value, ["..", "\r", "\n", "\u0000"])
  end

  def valid_email?(_value), do: false

  def normalize_local_return_to(value) when is_binary(value) do
    normalized = normalize_text(value)

    cond do
      is_nil(normalized) ->
        nil

      byte_size(normalized) > 2_048 ->
        nil

      not String.starts_with?(normalized, "/") ->
        nil

      String.starts_with?(normalized, "//") ->
        nil

      String.contains?(normalized, ["\\", "\r", "\n", "\u0000"]) ->
        nil

      true ->
        uri = URI.parse(normalized)

        if is_nil(uri.scheme) and is_nil(uri.host) do
          normalized
        else
          nil
        end
    end
  rescue
    _ -> nil
  end

  def normalize_local_return_to(_value), do: nil

  def valid_local_return_to?(value), do: is_binary(normalize_local_return_to(value))

  def canonicalize_params(value, opts \\ []) do
    sensitive_keys =
      opts
      |> Keyword.get(:sensitive_keys, @sensitive_keys)
      |> MapSet.new()

    do_canonicalize(value, sensitive_keys)
  end

  def validate_param_shape(value, opts \\ []) do
    state = %{
      max_depth: Keyword.get(opts, :max_depth, 4),
      max_keys: Keyword.get(opts, :max_keys, 32),
      max_list_items: Keyword.get(opts, :max_list_items, 8),
      max_string_bytes: Keyword.get(opts, :max_string_bytes, 8_192),
      count: 0
    }

    case do_validate(value, 0, state) do
      {:ok, _state} -> :ok
      {:error, reason} -> {:error, reason}
    end
  end

  def contains_upload?(%Plug.Upload{}), do: true
  def contains_upload?(%_{}), do: false

  def contains_upload?(map) when is_map(map),
    do: Enum.any?(map, fn {_k, v} -> contains_upload?(v) end)

  def contains_upload?(list) when is_list(list), do: Enum.any?(list, &contains_upload?/1)
  def contains_upload?(_), do: false

  def safe_filename(value) when is_binary(value) do
    value
    |> normalize_text(trim: true, blank_nil: true)
    |> case do
      nil ->
        nil

      name ->
        name
        |> Path.basename()
        |> String.replace(~r/[^A-Za-z0-9._-]/u, "_")
        |> String.replace(~r/\.{2,}/u, ".")
        |> String.slice(0, 128)
    end
  end

  def safe_filename(_value), do: nil

  defp do_canonicalize(%Plug.Upload{} = upload, _sensitive_keys), do: upload
  defp do_canonicalize(%_{} = struct, _sensitive_keys), do: struct

  defp do_canonicalize(map, sensitive_keys) when is_map(map) do
    Map.new(map, fn {key, value} ->
      normalized_key = normalize_key(key)
      effective_key = normalized_key || key

      normalized_value =
        if sensitive_key?(effective_key, sensitive_keys) do
          value
        else
          do_canonicalize(value, sensitive_keys)
        end

      {effective_key, normalized_value}
    end)
  end

  defp do_canonicalize(list, sensitive_keys) when is_list(list) do
    Enum.map(list, &do_canonicalize(&1, sensitive_keys))
  end

  defp do_canonicalize(value, _sensitive_keys) when is_binary(value) do
    case normalize_text(value, trim: false, blank_nil: false) do
      nil -> value
      normalized -> normalized
    end
  end

  defp do_canonicalize(value, _sensitive_keys), do: value

  defp do_validate(%Plug.Upload{}, _depth, state), do: {:ok, state}
  defp do_validate(%_{}, _depth, _state), do: {:error, "Estrutura de parâmetros não aceita."}

  defp do_validate(map, depth, state) when is_map(map) do
    cond do
      depth > state.max_depth ->
        {:error, "Estrutura de parâmetros muito profunda."}

      state.count + map_size(map) > state.max_keys ->
        {:error, "Quantidade de parâmetros excede o limite permitido."}

      true ->
        state = %{state | count: state.count + map_size(map)}

        Enum.reduce_while(map, {:ok, state}, fn {key, value}, {:ok, current_state} ->
          with :ok <- validate_key(key),
               {:ok, next_state} <- do_validate(value, depth + 1, current_state) do
            {:cont, {:ok, next_state}}
          else
            {:error, reason} -> {:halt, {:error, reason}}
          end
        end)
    end
  end

  defp do_validate(list, depth, state) when is_list(list) do
    cond do
      depth > state.max_depth ->
        {:error, "Estrutura de parâmetros muito profunda."}

      length(list) > state.max_list_items ->
        {:error, "Quantidade de itens excede o limite permitido."}

      true ->
        Enum.reduce_while(list, {:ok, state}, fn value, {:ok, current_state} ->
          case do_validate(value, depth + 1, current_state) do
            {:ok, next_state} -> {:cont, {:ok, next_state}}
            {:error, reason} -> {:halt, {:error, reason}}
          end
        end)
    end
  end

  defp do_validate(value, _depth, state) when is_binary(value) do
    cond do
      not String.valid?(value) ->
        {:error, "Parâmetro com codificação inválida."}

      byte_size(value) > state.max_string_bytes ->
        {:error, "Parâmetro excede o tamanho permitido."}

      String.match?(value, @control_characters) ->
        {:error, "Parâmetro contém caracteres de controle não permitidos."}

      true ->
        {:ok, state}
    end
  end

  defp do_validate(_value, _depth, state), do: {:ok, state}

  defp validate_key(key) when is_binary(key) do
    cond do
      not String.valid?(key) -> {:error, "Nome de parâmetro inválido."}
      byte_size(key) > 128 -> {:error, "Nome de parâmetro inválido."}
      String.match?(key, @control_characters) -> {:error, "Nome de parâmetro inválido."}
      true -> :ok
    end
  end

  defp validate_key(_key), do: :ok

  defp maybe_trim(value, true), do: String.trim(value)
  defp maybe_trim(value, false), do: value

  defp maybe_nil_if_blank(value, true) do
    if value == "", do: nil, else: value
  end

  defp maybe_nil_if_blank(value, false), do: value

  defp normalize_key(key) when is_binary(key),
    do: normalize_text(key, trim: true, blank_nil: false)

  defp normalize_key(key), do: key

  defp sensitive_key?(key, sensitive_keys) when is_binary(key) do
    MapSet.member?(sensitive_keys, String.downcase(key))
  end

  defp sensitive_key?(key, sensitive_keys), do: MapSet.member?(sensitive_keys, to_string(key))

  defp to_valid_utf8(value) when is_binary(value) do
    if String.valid?(value) do
      value
    else
      :unicode.characters_to_binary(value, :utf8, :utf8)
    end
  rescue
    _ -> value
  end
end

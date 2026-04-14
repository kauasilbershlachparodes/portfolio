defmodule PortfolioLive.Net.IPUtils do
  @moduledoc """
  Helpers for safe IPv4/IPv6 parsing, normalization, and formatting.

  Avoids lossy or incorrect conversions such as treating IPv6 values like
  integers or joining tuple elements in decimal notation.
  """

  @doc """
  Formats a remote IP tuple or string into a standard textual representation.

  ## Examples

      iex> format_remote_ip({127, 0, 0, 1})
      "127.0.0.1"

      iex> format_remote_ip({0, 0, 0, 0, 0, 0, 0, 1})
      "::1"
  """
  def format_remote_ip(tuple) when is_tuple(tuple) do
    tuple
    |> :inet.ntoa()
    |> to_string()
  rescue
    _ -> "unknown"
  end

  def format_remote_ip(value) when is_binary(value) do
    value
    |> String.trim()
    |> case do
      "" -> "unknown"
      ip -> ip
    end
  end

  def format_remote_ip(_value), do: "unknown"

  @doc """
  Parses a host or IP literal into a canonical lowercase host string.

  Accepts:
    * plain hosts like `example.com`
    * hosts with ports like `example.com:4000`
    * bracketed IPv6 literals like `[::1]:4000`
    * full URLs like `https://[2001:db8::1]:443/path`
  """
  def normalize_host(nil), do: nil

  def normalize_host(value) when is_binary(value) do
    candidate = String.trim(value)

    cond do
      candidate == "" ->
        nil

      true ->
        uri =
          if String.contains?(candidate, "://") do
            URI.parse(candidate)
          else
            URI.parse("//" <> candidate)
          end

        case uri.host || candidate do
          host when is_binary(host) ->
            host
            |> String.trim()
            |> String.trim_leading("[")
            |> String.trim_trailing("]")
            |> strip_zone_id()
            |> String.downcase()
            |> canonicalize_ip_literal()
            |> case do
              "" -> nil
              normalized -> normalized
            end

          _ ->
            nil
        end
    end
  end

  def normalize_host(value), do: value |> to_string() |> normalize_host()

  @doc """
  Rebuilds an origin string with correct IPv6 bracket handling.
  """
  def origin_from_parts(scheme, host, port \\ nil)

  def origin_from_parts(nil, _host, _port), do: nil
  def origin_from_parts(_scheme, nil, _port), do: nil

  def origin_from_parts(scheme, host, port) do
    normalized_scheme =
      scheme
      |> to_string()
      |> String.trim()
      |> String.downcase()

    normalized_host = normalize_host(host)

    cond do
      normalized_scheme == "" or is_nil(normalized_host) ->
        nil

      true ->
        "#{normalized_scheme}://#{host_for_uri(normalized_host)}#{normalized_port_suffix(normalized_scheme, port)}"
    end
  end

  @doc """
  Normalizes a browser origin or referer down to `scheme://host[:port]`.
  """
  def normalize_origin(nil), do: nil

  def normalize_origin(value) when is_binary(value) do
    candidate = String.trim(value)

    cond do
      candidate in ["", "null"] ->
        nil

      true ->
        uri = URI.parse(candidate)

        if is_binary(uri.scheme) and is_binary(uri.host) do
          origin_from_parts(uri.scheme, uri.host, uri.port)
        else
          nil
        end
    end
  end

  def normalize_origin(value), do: value |> to_string() |> normalize_origin()

  @doc """
  True when the value is an IPv4 or IPv6 literal.
  """
  def ip_literal?(value) do
    case parse_ip(value) do
      {:ok, _tuple} -> true
      _ -> false
    end
  end

  @doc """
  True only for globally routable IPv6 addresses that fall within `2000::/3`
  and are not special documentation, loopback, or unspecified ranges.

  This is useful when a future feature needs stricter validation than "accept
  any IPv6 literal".
  """
  def routable_ipv6?(value) do
    case parse_ip(value) do
      {:ok, {0, 0, 0, 0, 0, 0, 0, 0}} ->
        false

      {:ok, {0, 0, 0, 0, 0, 0, 0, 1}} ->
        false

      {:ok, {0x2001, 0x0DB8, _, _, _, _, _, _}} ->
        false

      {:ok, {first, _, _, _, _, _, _, _}} when first >= 0x2000 and first <= 0x3FFF ->
        true

      _ ->
        false
    end
  end

  defp parse_ip(tuple) when is_tuple(tuple), do: {:ok, tuple}

  defp parse_ip(value) when is_binary(value) do
    value
    |> normalize_host()
    |> case do
      nil ->
        :error

      host ->
        host
        |> String.to_charlist()
        |> :inet.parse_address()
    end
  end

  defp parse_ip(_value), do: :error

  defp canonicalize_ip_literal(host) do
    case :inet.parse_address(String.to_charlist(host)) do
      {:ok, tuple} -> format_remote_ip(tuple)
      {:error, _reason} -> host
    end
  rescue
    _ -> host
  end

  defp strip_zone_id(host) do
    case String.split(host, "%", parts: 2) do
      [base, _zone] -> base
      [base] -> base
    end
  end

  defp host_for_uri(host) do
    if ipv6_literal?(host), do: "[#{host}]", else: host
  end

  defp ipv6_literal?(host) when is_binary(host) do
    case :inet.parse_address(String.to_charlist(host)) do
      {:ok, tuple} when tuple_size(tuple) == 8 -> true
      _ -> false
    end
  rescue
    _ -> false
  end

  defp normalized_port_suffix("http", 80), do: ""
  defp normalized_port_suffix("https", 443), do: ""
  defp normalized_port_suffix(_scheme, nil), do: ""
  defp normalized_port_suffix(_scheme, port) when is_integer(port), do: ":#{port}"

  defp normalized_port_suffix(_scheme, port) when is_binary(port),
    do: normalized_port_suffix("", String.to_integer(port))

  defp normalized_port_suffix(_scheme, _port), do: ""
end

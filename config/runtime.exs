import Config

truthy_env? = fn name ->
  case System.get_env(name) do
    value when value in ["1", "true", "TRUE", "yes", "YES", "on", "ON"] -> true
    _ -> false
  end
end

if System.get_env("PHX_SERVER") do
  config :portfolio_live, PortfolioLiveWeb.Endpoint, server: true
end

if config_env() == :prod do
  secret_key_base =
    System.get_env("SECRET_KEY_BASE") ||
      raise """
      environment variable SECRET_KEY_BASE is missing.
      You can generate one by calling: mix phx.gen.secret
      """

  public_base_url = System.get_env("PUBLIC_BASE_URL")
  env_host = System.get_env("RENDER_EXTERNAL_HOSTNAME") || "localhost"
  allow_localhost_origins = truthy_env?.("APP_ALLOW_LOCALHOST_ORIGINS")

  port =
    case Integer.parse(System.get_env("PORT") || "4000") do
      {value, ""} when value in 1..65_535 -> value
      _ -> raise "PORT must be an integer between 1 and 65535"
    end

  normalize_host = fn raw ->
    candidate =
      raw
      |> to_string()
      |> String.trim()

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

        host =
          (uri.host || candidate)
          |> String.trim()
          |> String.trim_leading("[")
          |> String.trim_trailing("]")
          |> String.downcase()

        case host do
          "" ->
            nil

          normalized_host ->
            case :inet.parse_address(String.to_charlist(normalized_host)) do
              {:ok, tuple} -> tuple |> :inet.ntoa() |> to_string()
              {:error, _reason} -> normalized_host
            end
        end
    end
  end

  require_host! = fn raw, label ->
    case normalize_host.(raw) do
      host when is_binary(host) and host != "" -> host
      _ -> raise "#{label} is missing or invalid"
    end
  end

  host_for_origin = fn host ->
    case :inet.parse_address(String.to_charlist(host)) do
      {:ok, tuple} when tuple_size(tuple) == 8 -> "[#{host}]"
      _ -> host
    end
  end

  parse_csv = fn raw ->
    raw
    |> to_string()
    |> String.split(",", trim: true)
    |> Enum.map(&normalize_host.(&1))
    |> Enum.reject(&is_nil/1)
    |> Enum.uniq()
  end

  {host, scheme} =
    cond do
      is_binary(public_base_url) and String.trim(public_base_url) != "" ->
        uri = URI.parse(public_base_url)

        cond do
          is_binary(uri.host) and uri.host != "" and uri.scheme == "https" ->
            {require_host!.(uri.host, "PUBLIC_BASE_URL host"), "https"}

          true ->
            raise "PUBLIC_BASE_URL must be an https URL in production"
        end

      true ->
        {require_host!.(env_host, "RENDER_EXTERNAL_HOSTNAME"), "https"}
    end

  local_hosts = if allow_localhost_origins, do: ["localhost", "127.0.0.1", "::1"], else: []

  additional_tls_hosts = parse_csv.(System.get_env("APP_TLS_ALLOWED_HOSTS") || "")
  tls_allowed_hosts = Enum.uniq([host | additional_tls_hosts])

  additional_allowed_hosts = parse_csv.(System.get_env("APP_ALLOWED_HOSTS") || "")

  allowed_hosts =
    tls_allowed_hosts
    |> Kernel.++(additional_allowed_hosts)
    |> Kernel.++(local_hosts)
    |> Enum.reject(&is_nil/1)
    |> Enum.uniq()

  allowed_origins =
    tls_allowed_hosts
    |> Enum.map(&"https://#{host_for_origin.(&1)}")
    |> Kernel.++(Enum.map(local_hosts, &"http://#{host_for_origin.(&1)}"))
    |> Enum.uniq()

  config :portfolio_live, :dns_cluster_query, System.get_env("DNS_CLUSTER_QUERY")
  config :portfolio_live, :tls_allowed_hosts, tls_allowed_hosts
  config :portfolio_live, :allowed_hosts, allowed_hosts
  config :portfolio_live, :allowed_origins, allowed_origins
  config :portfolio_live, :public_base_url, "#{scheme}://#{host_for_origin.(host)}"

  config :portfolio_live, PortfolioLiveWeb.Endpoint,
    url: [host: host, port: 443, scheme: scheme],
    http: [
      ip: {0, 0, 0, 0, 0, 0, 0, 0},
      port: port
    ],
    check_origin: allowed_origins,
    secret_key_base: secret_key_base
end

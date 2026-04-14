defmodule PortfolioLiveWeb.AuthPageController do
  use PortfolioLiveWeb, :controller

  alias PortfolioLive.InputSafety
  alias PortfolioLive.Net.IPUtils
  alias PortfolioLive.Security.AuthRateLimiter

  @supabase_url "https://yeuojewjvyfxcxqzxnpc.supabase.co"
  @supabase_publishable_key "sb_publishable_K5uvJz80GZoBiZ6GqxpeXw__XCwKAsU"

  @allowed_sync_keys MapSet.new(["access_token", "return_to"])
  @allowed_login_keys MapSet.new(["email", "password", "return_to"])

  @login_container_keys ~w(login user session auth credentials)

  @login_rate_limit_max_attempts 5
  @login_rate_limit_window_ms :timer.minutes(15)
  @sync_rate_limit_max_attempts 20
  @sync_rate_limit_window_ms :timer.minutes(5)

  def forgot_password(conn, _params) do
    render(conn, :forgot_password)
  end

  def reset_password(conn, _params) do
    render(conn, :reset_password)
  end

  def csrf_token(conn, _params) do
    conn = put_session(conn, :csrf_session_ready, true)

    conn
    |> put_sensitive_api_headers()
    |> json(%{
      ok: true,
      csrf_token: Plug.CSRFProtection.get_csrf_token()
    })
  end

  def login_with_password(conn, params) when is_map(params) do
    params = normalize_login_params(params)

    with :ok <- validate_login_payload(params),
         :ok <- enforce_login_rate_limit(conn, params),
         email <- String.trim(params["email"]),
         password <- params["password"],
         {:ok, auth_payload} <- fetch_supabase_password_session(email, password),
         access_token when is_binary(access_token) and access_token != "" <-
           auth_payload["access_token"],
         {:ok, user} <- fetch_supabase_user(access_token),
         user_email when is_binary(user_email) and user_email != "" <- user["email"] do
      reset_login_rate_limit(conn, params)
      persist_authenticated_session(conn, user, user_email, access_token, params["return_to"])
    else
      {:error, :rate_limited} ->
        rate_limited_response(conn, login_rate_limit_key(conn, params["email"]))

      {:error, reason} ->
        conn
        |> put_sensitive_api_headers()
        |> put_status(:unauthorized)
        |> json(%{ok: false, error: reason})

      _ ->
        conn
        |> put_sensitive_api_headers()
        |> put_status(:unauthorized)
        |> json(%{ok: false, error: "Não foi possível autenticar com email e senha."})
    end
  end

  def login_with_password(conn, _params) do
    conn
    |> put_sensitive_api_headers()
    |> put_status(:bad_request)
    |> json(%{ok: false, error: "Payload JSON inválido."})
  end

  def sync_session(conn, params) when is_map(params) do
    normalized_login = normalize_login_params(params)

    cond do
      has_login_credentials?(normalized_login) and not is_binary(params["access_token"]) ->
        login_with_password(conn, normalized_login)

      true ->
        sync_session_with_access_token(conn, normalize_sync_params(params))
    end
  end

  def sync_session(conn, _params) do
    conn
    |> put_sensitive_api_headers()
    |> put_status(:bad_request)
    |> json(%{ok: false, error: "Payload JSON inválido."})
  end

  def logout(conn, _params) do
    conn =
      conn
      |> configure_session(drop: true)
      |> put_resp_header("cache-control", "no-store")
      |> put_resp_header("pragma", "no-cache")
      |> put_resp_header("clear-site-data", ~s("cache", "cookies", "storage"))

    if xhr_request?(conn) or json_response_requested?(conn) do
      conn
      |> put_sensitive_api_headers()
      |> json(%{ok: true, redirect_to: "/"})
    else
      redirect(conn, to: "/")
    end
  end

  defp sync_session_with_access_token(conn, params) do
    with :ok <- validate_sync_payload(params),
         :ok <- enforce_sync_rate_limit(conn),
         access_token <- String.trim(params["access_token"]),
         {:ok, user} <- fetch_supabase_user(access_token),
         email when is_binary(email) and email != "" <- user["email"] do
      persist_authenticated_session(conn, user, email, access_token, params["return_to"])
    else
      {:error, :rate_limited} ->
        rate_limited_response(conn, sync_rate_limit_key(conn))

      {:error, reason} ->
        conn
        |> put_sensitive_api_headers()
        |> put_status(:unauthorized)
        |> json(%{ok: false, error: reason})

      _ ->
        conn
        |> put_sensitive_api_headers()
        |> put_status(:unauthorized)
        |> json(%{ok: false, error: "Não foi possível validar a sessão autenticada."})
    end
  end

  defp persist_authenticated_session(conn, user, email, access_token, return_to) do
    auth_aal = auth_aal_from_access_token(access_token)

    current_user = %{
      "id" => user["id"],
      "email" => email,
      "role" => "authenticatedUser",
      "auth_aal" => auth_aal
    }

    conn =
      conn
      |> put_sensitive_api_headers()
      |> configure_session(renew: true)
      |> put_session(:current_user, current_user)
      |> put_session(:authenticated_email, email)
      |> put_session(:app_role, "authenticatedUser")
      |> put_session(:auth_aal, auth_aal)

    conn
    |> json(%{
      ok: true,
      email: email,
      role: "authenticatedUser",
      auth_aal: auth_aal,
      return_to: normalized_return_to(return_to),
      csrf_token: Plug.CSRFProtection.get_csrf_token()
    })
  end

  defp validate_sync_payload(params) do
    unknown_keys =
      params
      |> Map.keys()
      |> Enum.reject(&MapSet.member?(@allowed_sync_keys, &1))

    cond do
      unknown_keys != [] ->
        {:error, "Payload contém campos não permitidos."}

      not is_binary(params["access_token"]) ->
        {:error, "Access token não informado."}

      String.trim(params["access_token"]) == "" ->
        {:error, "Access token não informado."}

      byte_size(params["access_token"]) > 8_192 ->
        {:error, "Access token inválido."}

      has_nested_values?(params) ->
        {:error, "Payload com estrutura não aceita."}

      not valid_return_to?(params["return_to"]) ->
        {:error, "Campo return_to inválido."}

      true ->
        :ok
    end
  end

  defp validate_login_payload(params) do
    unknown_keys =
      params
      |> Map.keys()
      |> Enum.reject(&MapSet.member?(@allowed_login_keys, &1))

    cond do
      unknown_keys != [] ->
        {:error, "Payload contém campos não permitidos."}

      not is_binary(params["email"]) or String.trim(params["email"]) == "" ->
        {:error, "Email não informado."}

      not is_binary(params["password"]) or params["password"] == "" ->
        {:error, "Senha não informada."}

      not InputSafety.valid_email?(String.trim(params["email"])) ->
        {:error, "Email inválido."}

      byte_size(String.trim(params["email"])) > 320 ->
        {:error, "Email inválido."}

      byte_size(params["password"]) > 1_024 ->
        {:error, "Senha inválida."}

      has_nested_values?(params) ->
        {:error, "Payload com estrutura não aceita."}

      not valid_return_to?(params["return_to"]) ->
        {:error, "Campo return_to inválido."}

      true ->
        :ok
    end
  end

  defp normalize_login_params(params) when is_map(params) do
    nested =
      Enum.find_value(@login_container_keys, %{}, fn key ->
        case Map.get(params, key) do
          value when is_map(value) -> value
          _ -> nil
        end
      end) || %{}

    email = InputSafety.normalize_email(Map.get(nested, "email") || Map.get(params, "email"))
    password = normalize_password(Map.get(nested, "password") || Map.get(params, "password"))

    return_to =
      Map.get(params, "return_to") ||
        Map.get(params, "redirect_to") ||
        Map.get(nested, "return_to") ||
        Map.get(nested, "redirect_to")

    %{}
    |> put_if_present("email", email)
    |> put_if_present("password", password)
    |> put_if_present("return_to", normalize_optional_string(return_to))
  end

  defp normalize_sync_params(params) when is_map(params) do
    access_token = normalize_string(Map.get(params, "access_token"))

    return_to =
      Map.get(params, "return_to") ||
        Map.get(params, "redirect_to")

    %{}
    |> put_if_present("access_token", access_token)
    |> put_if_present("return_to", normalize_optional_string(return_to))
  end

  defp put_if_present(map, _key, nil), do: map
  defp put_if_present(map, key, value), do: Map.put(map, key, value)

  defp normalize_string(value) when is_binary(value) do
    case String.trim(value) do
      "" -> nil
      trimmed -> trimmed
    end
  end

  defp normalize_string(_value), do: nil

  defp normalize_password(value) when is_binary(value), do: value
  defp normalize_password(_value), do: nil

  defp normalize_optional_string(value) when is_binary(value) do
    InputSafety.normalize_text(value)
  end

  defp normalize_optional_string(_value), do: nil

  defp has_login_credentials?(params) when is_map(params) do
    is_binary(params["email"]) or is_binary(params["password"])
  end

  defp has_nested_values?(params) do
    Enum.any?(params, fn
      {_key, value} when is_map(value) or is_list(value) -> true
      _ -> false
    end)
  end

  defp valid_return_to?(nil), do: true
  defp valid_return_to?(value), do: InputSafety.valid_local_return_to?(value)

  defp normalized_return_to(nil), do: nil

  defp normalized_return_to(value) when is_binary(value),
    do: InputSafety.normalize_local_return_to(value)

  defp normalized_return_to(_value), do: nil

  defp put_sensitive_api_headers(conn) do
    conn
    |> put_resp_header("cache-control", "no-store")
    |> put_resp_header("pragma", "no-cache")
    |> put_resp_header("x-content-type-options", "nosniff")
    |> put_resp_header("referrer-policy", "same-origin")
  end

  defp fetch_supabase_password_session(email, password) do
    headers = [
      {"accept", "application/json"},
      {"content-type", "application/json"},
      {"apikey", @supabase_publishable_key}
    ]

    body =
      Phoenix.json_library().encode!(%{
        email: email,
        password: password
      })

    request =
      Finch.build(
        :post,
        @supabase_url <> "/auth/v1/token?grant_type=password",
        headers,
        body
      )

    case Finch.request(request, PortfolioLive.Finch, receive_timeout: 5_000) do
      {:ok, %Finch.Response{status: 200, body: body}} ->
        case Phoenix.json_library().decode(body) do
          {:ok, payload} when is_map(payload) -> {:ok, payload}
          _ -> {:error, "Resposta inválida do serviço de autenticação."}
        end

      {:ok, %Finch.Response{status: status}} when status in [400, 401, 403] ->
        {:error, "Email ou senha inválidos."}

      {:ok, %Finch.Response{}} ->
        {:error, "Não foi possível autenticar no momento."}

      {:error, _reason} ->
        {:error, "Não foi possível autenticar no momento."}
    end
  end

  defp fetch_supabase_user(access_token) do
    headers = [
      {"accept", "application/json"},
      {"apikey", @supabase_publishable_key},
      {"authorization", "Bearer " <> access_token}
    ]

    request = Finch.build(:get, @supabase_url <> "/auth/v1/user", headers)

    case Finch.request(request, PortfolioLive.Finch, receive_timeout: 5_000) do
      {:ok, %Finch.Response{status: 200, body: body}} ->
        case Phoenix.json_library().decode(body) do
          {:ok, user} when is_map(user) -> {:ok, user}
          _ -> {:error, "Não foi possível interpretar a sessão autenticada."}
        end

      {:ok, %Finch.Response{status: status}} when status in [400, 401, 403] ->
        {:error, "Sessão inválida ou expirada. Faça login novamente."}

      {:ok, %Finch.Response{}} ->
        {:error, "Não foi possível validar a sessão autenticada no momento."}

      {:error, _reason} ->
        {:error, "Não foi possível validar a sessão autenticada no momento."}
    end
  end

  defp enforce_login_rate_limit(conn, params) do
    case AuthRateLimiter.allow_or_increment(login_rate_limit_key(conn, params["email"]),
           max_attempts: @login_rate_limit_max_attempts,
           window_ms: @login_rate_limit_window_ms
         ) do
      :ok -> :ok
      {:error, :rate_limited} -> {:error, :rate_limited}
    end
  end

  defp enforce_sync_rate_limit(conn) do
    case AuthRateLimiter.allow_or_increment(sync_rate_limit_key(conn),
           max_attempts: @sync_rate_limit_max_attempts,
           window_ms: @sync_rate_limit_window_ms
         ) do
      :ok -> :ok
      {:error, :rate_limited} -> {:error, :rate_limited}
    end
  end

  defp reset_login_rate_limit(conn, params) do
    AuthRateLimiter.reset(login_rate_limit_key(conn, params["email"]))
  end

  defp login_rate_limit_key(conn, email) do
    {:login, client_ip(conn), String.downcase(to_string(email || ""))}
  end

  defp sync_rate_limit_key(conn) do
    {:sync_session, client_ip(conn)}
  end

  defp client_ip(conn), do: IPUtils.format_remote_ip(conn.remote_ip)

  defp rate_limited_response(conn, key) do
    retry_after = AuthRateLimiter.retry_after_seconds(key)

    conn
    |> put_sensitive_api_headers()
    |> put_resp_header("retry-after", Integer.to_string(retry_after))
    |> put_status(:too_many_requests)
    |> json(%{ok: false, error: "Muitas tentativas. Aguarde antes de tentar novamente."})
  end

  defp auth_aal_from_access_token(token) when is_binary(token) do
    with [_, payload, _] <- String.split(token, ".", parts: 3),
         {:ok, decoded} <- Base.url_decode64(payload, padding: false),
         {:ok, claims} <- Phoenix.json_library().decode(decoded),
         true <- is_map(claims) do
      claims
      |> Map.get("aal")
      |> normalize_aal()
    else
      _ -> "aal1"
    end
  end

  defp auth_aal_from_access_token(_token), do: "aal1"

  defp normalize_aal(value) do
    case value |> to_string() |> String.trim() |> String.downcase() do
      "aal2" -> "aal2"
      _ -> "aal1"
    end
  rescue
    _ -> "aal1"
  end

  defp xhr_request?(conn) do
    conn
    |> get_req_header("x-requested-with")
    |> Enum.any?(fn value -> String.downcase(to_string(value)) == "xmlhttprequest" end)
  end

  defp json_response_requested?(conn) do
    conn
    |> get_req_header("accept")
    |> Enum.any?(fn value ->
      String.contains?(String.downcase(to_string(value)), "application/json")
    end)
  end
end

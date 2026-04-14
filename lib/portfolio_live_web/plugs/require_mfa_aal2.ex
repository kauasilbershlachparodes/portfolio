defmodule PortfolioLiveWeb.Plugs.RequireMfaAal2 do
  @moduledoc false

  import Plug.Conn
  import Phoenix.Controller

  def init(opts) do
    opts
    |> Keyword.get(:paths, [])
    |> Enum.map(&normalize_path/1)
  end

  def call(conn, protected_paths) do
    if normalize_path(conn.request_path) in protected_paths do
      enforce(conn)
    else
      conn
    end
  end

  defp enforce(conn) do
    role = normalize_role(get_session(conn, :app_role))
    aal = normalize_aal(get_session(conn, :auth_aal))

    cond do
      role != "authenticatedUser" ->
        conn

      aal == "aal2" ->
        conn

      wants_json?(conn) ->
        conn
        |> put_status(:forbidden)
        |> json(%{
          ok: false,
          error: "É necessário MFA para acessar este recurso.",
          required_aal: "aal2",
          auth_aal: aal,
          mfa_required: true
        })
        |> halt()

      true ->
        return_to = URI.encode_www_form(normalize_path(conn.request_path))

        conn
        |> put_flash(:error, "É necessário MFA para acessar esta área.")
        |> redirect(to: "/login?mfa=required&return_to=" <> return_to)
        |> halt()
    end
  end

  defp wants_json?(conn) do
    accepted = get_req_header(conn, "accept")
    Enum.any?(accepted, &String.contains?(&1, "application/json"))
  end

  defp normalize_role(role) do
    case role |> to_string_safe() |> String.trim() |> String.downcase() do
      "authenticateduser" -> "authenticatedUser"
      "authenticated_user" -> "authenticatedUser"
      "authenticated-user" -> "authenticatedUser"
      "user" -> "authenticatedUser"
      _ -> "guest"
    end
  end

  defp normalize_aal(value) do
    case value |> to_string_safe() |> String.trim() |> String.downcase() do
      "aal2" -> "aal2"
      _ -> "aal1"
    end
  end

  defp normalize_path(path) do
    path
    |> to_string_safe()
    |> String.trim()
    |> then(fn
      "" -> "/"
      value -> if String.starts_with?(value, "/"), do: value, else: "/" <> value
    end)
    |> String.replace(~r{/+}, "/")
    |> then(fn
      "/" = root -> root
      value -> String.trim_trailing(value, "/")
    end)
  end

  defp to_string_safe(nil), do: ""
  defp to_string_safe(value) when is_binary(value), do: value
  defp to_string_safe(value), do: to_string(value)
end

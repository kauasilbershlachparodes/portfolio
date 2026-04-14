defmodule PortfolioLiveWeb.Plugs.RejectUnexpectedFileUploads do
  @moduledoc false

  import Plug.Conn

  alias PortfolioLive.InputSafety

  @binary_upload_content_types [
    "application/octet-stream",
    "application/zip",
    "application/x-zip-compressed"
  ]

  def init(opts) do
    %{
      allowed_paths:
        opts
        |> Keyword.get(:allowed_paths, [])
        |> Enum.map(&normalize_path/1)
        |> MapSet.new()
    }
  end

  def call(conn, %{allowed_paths: allowed_paths}) do
    cond do
      MapSet.member?(allowed_paths, normalize_path(conn.request_path)) ->
        conn

      upload_like_content_type?(conn) ->
        reject(conn, 415, "Upload de arquivos não é aceito nesta rota.")

      InputSafety.contains_upload?(conn.params) ->
        reject(conn, 415, "Upload de arquivos não é aceito nesta rota.")

      true ->
        conn
    end
  end

  defp upload_like_content_type?(conn) do
    conn
    |> get_req_header("content-type")
    |> Enum.any?(fn value ->
      media_type =
        value
        |> String.split(";", parts: 2)
        |> List.first()
        |> to_string()
        |> String.trim()
        |> String.downcase()

      String.starts_with?(media_type, "multipart/") or media_type in @binary_upload_content_types
    end)
  end

  defp normalize_path(path) do
    path
    |> to_string()
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

  defp reject(conn, status, message) do
    body = Phoenix.json_library().encode!(%{ok: false, error: message})

    conn
    |> put_resp_content_type("application/json", "utf-8")
    |> put_resp_header("cache-control", "no-store")
    |> send_resp(status, body)
    |> halt()
  end
end

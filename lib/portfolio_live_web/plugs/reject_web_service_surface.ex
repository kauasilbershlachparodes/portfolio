defmodule PortfolioLiveWeb.Plugs.RejectWebServiceSurface do
  @moduledoc """
  Deny-by-default hardening for applications that do not intentionally expose
  SOAP, WSDL or XML web-service endpoints.
  """

  @behaviour Plug

  import Plug.Conn

  @xml_like_content_types [
    "application/xml",
    "text/xml",
    "application/soap+xml",
    "application/wsdl+xml",
    "application/xop+xml"
  ]

  @unsafe_methods ~w(POST PUT PATCH DELETE)

  @impl true
  def init(opts), do: opts

  @impl true
  def call(conn, _opts) do
    if Application.get_env(:portfolio_live, :reject_web_service_surface, true) do
      enforce(conn)
    else
      conn
    end
  end

  defp enforce(%Plug.Conn{halted: true} = conn), do: conn

  defp enforce(conn) do
    cond do
      private_wsdl_probe?(conn) ->
        reject(conn, 404, "Not found.")

      xml_or_soap_request?(conn) ->
        reject(conn, 415, "Unsupported media type.")

      xml_or_wsdl_accept_probe?(conn) ->
        reject(conn, 406, "Not acceptable.")

      true ->
        conn
    end
  end

  defp private_wsdl_probe?(conn) do
    path = String.downcase(conn.request_path || "")
    query = String.downcase(conn.query_string || "")

    String.ends_with?(path, ".wsdl") or
      String.ends_with?(path, ".asmx") or
      String.contains?(path, "/wsdl") or
      String.contains?(path, "/soap") or
      Regex.match?(~r/(^|&)(?:wsdl|singlewsdl)(?:=|&|$)/, query)
  end

  defp xml_or_soap_request?(conn) do
    content_types =
      conn
      |> get_req_header("content-type")
      |> Enum.map(&header_media_type/1)

    soap_action? = get_req_header(conn, "soapaction") != []

    (conn.method in @unsafe_methods and Enum.any?(content_types, &xml_like_content_type?/1)) or
      soap_action?
  end

  defp xml_or_wsdl_accept_probe?(conn) do
    conn
    |> get_req_header("accept")
    |> Enum.map(&header_media_type/1)
    |> Enum.any?(fn media_type ->
      xml_like_content_type?(media_type) or media_type == "application/wsdl+xml"
    end)
  end

  defp header_media_type(value) when is_binary(value) do
    value
    |> String.split(";", parts: 2)
    |> List.first()
    |> to_string()
    |> String.trim()
    |> String.downcase()
  end

  defp header_media_type(_value), do: ""

  defp xml_like_content_type?(content_type) do
    content_type in @xml_like_content_types or String.ends_with?(content_type, "+xml")
  end

  defp reject(conn, status, message) do
    conn
    |> put_resp_content_type("text/plain")
    |> put_resp_header("cache-control", "no-store")
    |> send_resp(status, message)
    |> halt()
  end
end

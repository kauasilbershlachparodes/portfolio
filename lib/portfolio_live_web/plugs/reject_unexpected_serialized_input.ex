defmodule PortfolioLiveWeb.Plugs.RejectUnexpectedSerializedInput do
  @moduledoc false
  @behaviour Plug

  import Plug.Conn

  @session_entry_points MapSet.new([
                          "/auth/session",
                          "/auth/session/handoff",
                          "/auth/session/exchange"
                        ])

  @php_serialized ~r/\A(?:a|O|s|i|b|d|C|R|U|N):\d+(?::|;)/
  @java_serialized_base64 ~r/\ArO0AB/
  @java_serialized_hex ~r/\A(?:ACED0005|aced0005)/
  @python_pickle_base64 ~r/\AgASV/
  @ruby_marshal_base64 ~r/\ABAh/

  def init(opts), do: opts

  def call(conn, opts) do
    if protectable_request?(conn) do
      max_depth = Keyword.get(opts, :max_depth, 6)
      max_items = Keyword.get(opts, :max_items, 25)
      max_string_length = Keyword.get(opts, :max_string_length, 8_192)

      with :ok <- ensure_json_content_type(conn),
           :ok <- validate_shape(conn.params, 0, max_depth, max_items, max_string_length) do
        conn
      else
        {:error, status, message} ->
          conn
          |> put_status(status)
          |> put_resp_content_type("application/json")
          |> put_resp_header("cache-control", "no-store")
          |> send_resp(status, Phoenix.json_library().encode!(%{ok: false, error: message}))
          |> halt()
      end
    else
      conn
    end
  end

  defp protectable_request?(%Plug.Conn{method: method, request_path: path})
       when method in ["POST", "PUT", "PATCH"] do
    MapSet.member?(@session_entry_points, path)
  end

  defp protectable_request?(_conn), do: false

  defp ensure_json_content_type(conn) do
    content_type =
      conn
      |> get_req_header("content-type")
      |> List.first()
      |> to_string()
      |> String.downcase()

    cond do
      content_type == "" ->
        {:error, 415, "Content-Type JSON é obrigatório para este endpoint."}

      String.starts_with?(content_type, "application/json") ->
        :ok

      String.starts_with?(content_type, "application/") and
          String.contains?(content_type, "+json") ->
        :ok

      true ->
        {:error, 415, "Apenas JSON é aceito neste endpoint."}
    end
  end

  defp validate_shape(_value, depth, max_depth, _max_items, _max_string_length)
       when depth > max_depth do
    {:error, 400, "Payload excessivamente aninhado."}
  end

  defp validate_shape(%{} = map, depth, max_depth, max_items, max_string_length) do
    if map_size(map) > max_items do
      {:error, 400, "Payload com quantidade excessiva de campos."}
    else
      map
      |> Enum.reduce_while(:ok, fn {key, value}, _acc ->
        with :ok <- validate_scalar_key(key),
             :ok <- validate_shape(value, depth + 1, max_depth, max_items, max_string_length) do
          {:cont, :ok}
        else
          {:error, _status, _message} = error -> {:halt, error}
        end
      end)
    end
  end

  defp validate_shape(list, depth, max_depth, max_items, max_string_length) when is_list(list) do
    if length(list) > max_items do
      {:error, 400, "Payload com coleção grande demais."}
    else
      list
      |> Enum.reduce_while(:ok, fn value, _acc ->
        case validate_shape(value, depth + 1, max_depth, max_items, max_string_length) do
          :ok -> {:cont, :ok}
          {:error, _status, _message} = error -> {:halt, error}
        end
      end)
    end
  end

  defp validate_shape(value, _depth, _max_depth, _max_items, max_string_length)
       when is_binary(value) do
    cond do
      byte_size(value) > max_string_length ->
        {:error, 400, "Valor textual grande demais para este endpoint."}

      String.contains?(value, ["\u0000", "\r", "\n"]) ->
        {:error, 400, "Payload contém caracteres de controle não aceitos."}

      suspicious_serialized_string?(value) ->
        {:error, 400, "Fluxos serializados não são aceitos neste endpoint."}

      true ->
        :ok
    end
  end

  defp validate_shape(value, _depth, _max_depth, _max_items, _max_string_length)
       when is_boolean(value) or is_number(value) or is_nil(value) do
    :ok
  end

  defp validate_shape(_value, _depth, _max_depth, _max_items, _max_string_length) do
    {:error, 400, "Tipo de dado não aceito neste endpoint."}
  end

  defp validate_scalar_key(key) when is_binary(key) do
    if byte_size(key) <= 128 and not String.contains?(key, ["\u0000", "\r", "\n"]) do
      :ok
    else
      {:error, 400, "Nome de campo inválido."}
    end
  end

  defp validate_scalar_key(_key), do: {:error, 400, "Nome de campo inválido."}

  defp suspicious_serialized_string?(value) do
    candidate = String.trim_leading(value)

    byte_size(candidate) > 16 and
      (candidate =~ @java_serialized_base64 or
         candidate =~ @java_serialized_hex or
         candidate =~ @php_serialized or
         candidate =~ @python_pickle_base64 or
         candidate =~ @ruby_marshal_base64)
  end
end

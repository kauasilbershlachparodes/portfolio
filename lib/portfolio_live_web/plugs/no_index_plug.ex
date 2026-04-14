defmodule PortfolioLiveWeb.Plugs.NoIndexPlug do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    put_resp_header(
      conn,
      "x-robots-tag",
      "noindex, nofollow, noarchive, nosnippet, noimageindex"
    )
  end
end

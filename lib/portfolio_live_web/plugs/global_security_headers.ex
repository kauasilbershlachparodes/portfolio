defmodule PortfolioLiveWeb.Plugs.GlobalSecurityHeaders do
  @behaviour Plug

  import Plug.Conn

  @supabase_connect_origin Application.compile_env(
                             :portfolio_live,
                             :supabase_connect_origin,
                             "https://yeuojewjvyfxcxqzxnpc.supabase.co"
                           )

  @csp [
         "default-src 'self'",
         "base-uri 'self'",
         "frame-ancestors 'none'",
         "frame-src 'none'",
         "object-src 'none'",
         "form-action 'self'",
         "img-src 'self' data: https:",
         "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
         "script-src 'self' https://cdn.jsdelivr.net",
         "connect-src 'self' #{@supabase_connect_origin}",
         "font-src 'self' data: https://cdnjs.cloudflare.com",
         "manifest-src 'self'",
         "upgrade-insecure-requests"
       ]
       |> Enum.join("; ")

  @headers [
    {"content-security-policy", @csp},
    {"strict-transport-security", "max-age=31536000; includeSubDomains"},
    {"permissions-policy", "camera=(), microphone=(), geolocation=()"},
    {"referrer-policy", "strict-origin-when-cross-origin"},
    {"cross-origin-opener-policy", "same-origin"},
    {"cross-origin-resource-policy", "same-origin"},
    {"x-content-type-options", "nosniff"},
    {"x-download-options", "noopen"},
    {"x-permitted-cross-domain-policies", "none"}
  ]

  def init(opts), do: opts

  def call(conn, _opts) do
    register_before_send(conn, fn conn ->
      Enum.reduce(@headers, conn, fn {key, value}, acc ->
        if get_resp_header(acc, key) == [] do
          put_resp_header(acc, key, value)
        else
          acc
        end
      end)
    end)
  end
end

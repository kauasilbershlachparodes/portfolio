defmodule PortfolioLiveWeb.Router do
  use PortfolioLiveWeb, :router

  @supabase_connect_origin Application.compile_env(
                             :portfolio_live,
                             :supabase_connect_origin,
                             "https://yeuojewjvyfxcxqzxnpc.supabase.co"
                           )

  @browser_security_headers %{
    "content-security-policy" =>
      "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; frame-src 'none'; object-src 'none'; form-action 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; connect-src 'self' #{@supabase_connect_origin}; font-src 'self' data: https://cdnjs.cloudflare.com; manifest-src 'self'; upgrade-insecure-requests",
    "referrer-policy" => "strict-origin-when-cross-origin",
    "cross-origin-opener-policy" => "same-origin",
    "permissions-policy" => "camera=(), microphone=(), geolocation=()",
    "x-content-type-options" => "nosniff",
    "cross-origin-resource-policy" => "same-origin",
    "x-download-options" => "noopen",
    "x-permitted-cross-domain-policies" => "none"
  }

  pipeline :browser do
    plug(:accepts, ["html"])
    plug(:fetch_session)
    plug(:fetch_live_flash)
    plug(:put_root_layout, html: {PortfolioLiveWeb.Layouts, :root})
    plug(:protect_from_forgery)
    plug(PortfolioLiveWeb.Plugs.RequireMfaAal2, paths: ["/panel", "/forensics"])
    plug(:put_secure_browser_headers, @browser_security_headers)
  end

  pipeline :auth_surface do
    plug(:accepts, ["html", "json"])
    plug(:fetch_session)
    plug(:fetch_live_flash)
    plug(:put_root_layout, html: {PortfolioLiveWeb.Layouts, :root})
    plug(:protect_from_forgery)
    plug(:redirect_authenticated_from_auth_surface)
    plug(:put_secure_browser_headers, @browser_security_headers)
  end

  pipeline :api do
    plug(:accepts, ["json"])
  end

  pipeline :api_session do
    plug(:accepts, ["json"])
    plug(:fetch_session)
    plug(:protect_from_forgery)
    plug(PortfolioLiveWeb.Plugs.RejectDuplicateParams)

    plug(PortfolioLiveWeb.Plugs.RejectSensitiveQueryParams,
      keys: ~w(email password password_confirmation access_token refresh_token token code)
    )

    plug(PortfolioLiveWeb.Plugs.CanonicalizeParams)
    plug(PortfolioLiveWeb.Plugs.RejectInvalidRequestInput)
    plug(PortfolioLiveWeb.Plugs.RejectUnexpectedFileUploads)
    plug(PortfolioLiveWeb.Plugs.GuardConcurrentAuthMutations)
  end

  pipeline :no_layout do
    plug(:put_root_layout, html: false)
    plug(:put_layout, html: false)
  end

  pipeline :sensitive_page do
    plug(:put_sensitive_page_headers)
    plug(:put_sensitive_page_noindex_headers)
  end

  scope "/", PortfolioLiveWeb do
    pipe_through(:browser)

    get(
      "/.well-known/appspecific/com.chrome.devtools.json",
      HealthController,
      :chrome_devtools_probe
    )

    get("/", PageController, :home)

    get("/all-utilities", PageController, :nirsoft_page)
    get("/password-tools", PageController, :nirsoft_page)
    get("/system-tools", PageController, :nirsoft_page)
    get("/browser-tools", PageController, :nirsoft_page)
    get("/programmer-tools", PageController, :nirsoft_page)
    get("/network-tools", PageController, :nirsoft_page)
    get("/outlook-office", PageController, :nirsoft_page)
    get("/64-bit-download", PageController, :nirsoft_page)
    get("/panel", PageController, :nirsoft_page)
    get("/forensics", PageController, :nirsoft_page)
    get("/pre-release-tools", PageController, :nirsoft_page)
  end

  scope "/", PortfolioLiveWeb do
    pipe_through(:api_session)

    get("/auth/csrf-token", AuthPageController, :csrf_token)
    post("/auth/login", AuthPageController, :login_with_password)
    post("/auth/session", AuthPageController, :sync_session)
    delete("/auth/logout", AuthPageController, :logout)
  end

  scope "/", PortfolioLiveWeb do
    pipe_through([:auth_surface, :no_layout, :sensitive_page])

    get("/login", PageController, :login)
    get("/signup", PageController, :sign_up)
    delete("/logout", AuthPageController, :logout)
    get("/forgot-password", AuthPageController, :forgot_password)
    get("/reset-password", AuthPageController, :reset_password)
  end

  if Application.compile_env(:portfolio_live, :dev_routes) do
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through(:browser)

      live_dashboard("/dashboard", metrics: PortfolioLiveWeb.Telemetry)
      forward("/mailbox", Plug.Swoosh.MailboxPreview)
    end
  end

  defp redirect_authenticated_from_auth_surface(conn, _opts) do
    request_path = normalize_router_path(conn.request_path)
    request_method = conn.method |> to_string() |> String.upcase()

    current_user = get_session(conn, :current_user) || %{}

    role =
      get_session(conn, :app_role) ||
        Map.get(current_user, "role") ||
        Map.get(current_user, :role)

    auth_surface_path? =
      request_path in ["/login", "/signup", "/forgot-password", "/reset-password"]

    if request_method == "GET" and auth_surface_path? and
         normalize_router_role(role) == "authenticatedUser" do
      conn
      |> Phoenix.Controller.redirect(to: "/")
      |> Plug.Conn.halt()
    else
      conn
    end
  end

  defp normalize_router_role(role) do
    case role |> to_string_safe() |> String.trim() |> String.downcase() do
      "authenticateduser" -> "authenticatedUser"
      "authenticated_user" -> "authenticatedUser"
      "authenticated-user" -> "authenticatedUser"
      "user" -> "authenticatedUser"
      "member" -> "authenticatedUser"
      _ -> "guest"
    end
  end

  defp normalize_router_path(path) do
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

  defp put_sensitive_page_headers(conn, _opts) do
    conn
    |> put_resp_header("cache-control", "no-store, no-cache, must-revalidate, max-age=0, private")
    |> put_resp_header("pragma", "no-cache")
    |> put_resp_header("expires", "0")
  end

  defp put_sensitive_page_noindex_headers(conn, _opts) do
    put_resp_header(conn, "x-robots-tag", "noindex, nofollow")
  end
end

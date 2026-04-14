defmodule PortfolioLiveWeb.PageController do
  use PortfolioLiveWeb, :controller

  alias PortfolioLiveWeb.PageNavigation
  alias PortfolioLiveWeb.Sidebar.SidebarAccessControl

  defp build_access_context(conn) do
    conn.assigns
    |> put_if_present(:current_user, get_session(conn, :current_user))
    |> put_if_present(:authenticated_email, get_session(conn, :authenticated_email))
    |> put_if_present(:app_role, get_session(conn, :app_role))
    |> put_if_present(:auth_aal, get_session(conn, :auth_aal))
  end

  defp put_if_present(map, _key, nil), do: map
  defp put_if_present(map, key, value), do: Map.put(map, key, value)

  defp assign_access_control(conn) do
    access_context = build_access_context(conn)

    payload_json =
      access_context
      |> SidebarAccessControl.bootstrap_payload()
      |> Phoenix.json_library().encode!()

    conn
    |> assign(:app_access_control_json, payload_json)
    |> assign(:app_access_role, SidebarAccessControl.resolve_role(access_context))
    |> assign(:authenticated_email, access_context[:authenticated_email])
    |> assign(:current_user, access_context[:current_user])
    |> assign(
      :auth_aal,
      access_context[:auth_aal] || get_in(access_context, [:current_user, "auth_aal"])
    )
  end

  defp assign_nav(conn, key) do
    nav = PageNavigation.nav_for(key)

    conn
    |> assign(:page_title, nav.title)
    |> assign(:page_resource, nav.resource)
    |> assign(:prev_page, nav.prev)
    |> assign(:next_page, nav.next)
  end

  def home(conn, _params) do
    conn
    |> assign_access_control()
    |> assign_nav(:home)
    |> render(:home)
  end

  def login(conn, _params), do: render(conn, :login)
  def sign_up(conn, _params), do: render(conn, :sign_up)

  def nirsoft_page(conn, _params) do
    access_context = build_access_context(conn)
    path = conn.request_path

    case PageNavigation.page_for_path(path) do
      nil ->
        conn
        |> put_status(:not_found)
        |> text("Page not found")

      page ->
        if SidebarAccessControl.allowed_route?(access_context, path) do
          conn
          |> assign_access_control()
          |> assign_nav(page.key)
          |> render(page.key)
        else
          conn
          |> put_status(:forbidden)
          |> text("Access denied")
        end
    end
  end
end

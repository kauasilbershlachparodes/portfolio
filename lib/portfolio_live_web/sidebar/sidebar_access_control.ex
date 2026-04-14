defmodule PortfolioLiveWeb.Sidebar.SidebarAccessControl do
  @moduledoc """
  Centralized access-control matrix for navigation and presentation-layer visibility.

  Applied principles:
  - deny by default
  - centralized authorization rules
  - least privilege
  - guest sees only explicitly public resources
  - top-level categories remain visible for guests
  - locked access is applied to subitems until authentication
  """

  alias PortfolioLiveWeb.PageNavigation

  @guest_resources ["publicContent"]
  @authenticated_resources ["publicContent", "privateProducts", "payment", "manageOwnAccount"]

  @matrix %{
    guest: @guest_resources,
    authenticatedUser: @authenticated_resources
  }

  @route_resources %{
    "/" => "publicContent",
    "/nirsfot-tools-freeware" => "publicContent",
    "/all-utilities" => "privateProducts",
    "/password-tools" => "privateProducts",
    "/system-tools" => "privateProducts",
    "/browser-tools" => "privateProducts",
    "/programmer-tools" => "privateProducts",
    "/network-tools" => "privateProducts",
    "/outlook-office" => "privateProducts",
    "/64-bit-download" => "privateProducts",
    "/panel" => "privateProducts",
    "/forensics" => "privateProducts",
    "/pre-release-tools" => "privateProducts"
  }

  def matrix, do: @matrix
  def guest_resources, do: @guest_resources
  def authenticated_resources, do: @authenticated_resources
  def route_resources, do: @route_resources

  def public_content_routes do
    @route_resources
    |> Enum.filter(fn {_path, resource} -> resource == "publicContent" end)
    |> Enum.map(fn {path, _resource} -> route_key(path) end)
  end

  @doc """
  Minimal client bootstrap payload.

  Do not expose the full authorization matrix or per-role resource lists to the
  browser. Server-side authorization remains authoritative.
  """
  def bootstrap_payload(assigns_or_role \\ :guest) do
    role = resolve_role(assigns_or_role)

    %{
      currentRole: Atom.to_string(role),
      publicContentRoutes: public_content_routes()
    }
  end

  def resources_for(assigns_or_role) do
    role = resolve_role(assigns_or_role)
    Map.get(@matrix, role, @guest_resources)
  end

  @doc """
  Resolves the effective role from server-side assigns only.

  For maps, only trusted authentication assigns are accepted. Arbitrary `:role`
  or `"role"` keys are intentionally ignored to avoid privilege escalation when
  user-controlled params are merged into assigns.
  """
  def resolve_role(assigns) when is_map(assigns) do
    cond do
      truthy?(Map.get(assigns, :current_user)) -> :authenticatedUser
      truthy?(Map.get(assigns, "current_user")) -> :authenticatedUser
      truthy?(Map.get(assigns, :user)) -> :authenticatedUser
      truthy?(Map.get(assigns, "user")) -> :authenticatedUser
      true -> :guest
    end
  end

  def resolve_role(role), do: normalize_role(role) || :guest

  def route_resource(path) do
    path
    |> normalize_path()
    |> then(&Map.get(@route_resources, &1))
  end

  def known_route?(path) do
    path
    |> route_resource()
    |> is_binary()
  end

  def allowed_route?(assigns_or_role, path) do
    case route_resource(path) do
      nil -> false
      resource -> resource in resources_for(assigns_or_role)
    end
  end

  def locked_route?(assigns_or_role, path) do
    case route_resource(path) do
      nil -> true
      _resource -> not allowed_route?(assigns_or_role, path)
    end
  end

  def nav_link_state(assigns_or_role, path) do
    normalized_path = normalize_path(path)
    locked? = locked_route?(assigns_or_role, normalized_path)

    attrs =
      if locked? do
        [
          {"href", "#"},
          {"data-sidebar-route", normalized_path},
          {"data-locked-subitem", "true"},
          {"aria-disabled", "true"},
          {"tabindex", "-1"}
        ]
      else
        [
          {"href", normalized_path},
          {"data-sidebar-route", normalized_path}
        ]
      end

    %{
      path: normalized_path,
      locked?: locked?,
      attrs: attrs
    }
  end

  def nav_link_attrs(assigns_or_role, path) do
    assigns_or_role
    |> nav_link_state(path)
    |> Map.fetch!(:attrs)
  end

  def visible_pages(assigns_or_role) do
    PageNavigation.pages()
    |> Enum.filter(fn page -> allowed_route?(assigns_or_role, page.path) end)
  end

  defp route_key(path) do
    path
    |> normalize_path()
    |> String.trim_leading("/")
    |> case do
      "" -> "home"
      value -> value
    end
  end

  defp normalize_role(role) when role in [:guest, :authenticatedUser], do: role

  defp normalize_role(role) when is_binary(role) or is_atom(role) do
    case role |> to_string() |> String.trim() |> String.downcase() do
      "authenticateduser" -> :authenticatedUser
      "authenticated_user" -> :authenticatedUser
      "authenticated-user" -> :authenticatedUser
      "user" -> :authenticatedUser
      "member" -> :authenticatedUser
      "guest" -> :guest
      _ -> nil
    end
  end

  defp normalize_role(_role), do: nil

  defp normalize_path(nil), do: "/"

  defp normalize_path(path) do
    path
    |> to_string()
    |> String.trim()
    |> then(fn value -> if value == "", do: "/", else: value end)
    |> String.split(["?", "#"], parts: 2)
    |> List.first()
    |> then(fn value ->
      cond do
        value == "" -> "/"
        String.starts_with?(value, "/") -> value
        true -> "/" <> value
      end
    end)
    |> String.replace(~r{/+}, "/")
    |> then(fn
      "/" = root -> root
      other -> String.trim_trailing(other, "/")
    end)
  end

  defp truthy?(value), do: not is_nil(value) and value != false
end

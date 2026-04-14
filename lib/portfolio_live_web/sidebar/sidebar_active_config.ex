defmodule PortfolioLiveWeb.Sidebar.SidebarActiveConfig do
  @moduledoc """
  Configuração central para o estado ativo (hover, ícone colorido,
  overlay, aria-current) da sidebar de navegação.

  Espelha os tokens e seletores usados pelo `SidebarActiveHook` no JS,
  seguindo o mesmo padrão de `ThemeConfig` e `SidebarAccordionConfig`.
  """

  # Paleta de cores para ícones ativos — corresponde a ACTIVE_ICON_PALETTE no JS
  @active_icon_palette [
    "var(--ds-teal-600)",
    "var(--ds-blue-600)",
    "var(--ds-purple-600)",
    "var(--ds-pink-600)",
    "var(--ds-amber-600)",
    "var(--ds-green-600)",
    "var(--ds-red-600)"
  ]

  # Classes Tailwind de estado ativo e inativo dos links
  @nav_token_active ["text-gray-1000!", "[:hover,:focus-visible]:text-gray-1000!"]
  @nav_token_inactive ["font-normal", "text-inherit"]

  # Classe do overlay de fundo para item filho ativo
  @overlay_child "pointer-events-none absolute inset-y-0 left-0 right-2 bg-gray-alpha-100 dark:bg-gray-alpha-200 rounded-md -mr-4 -ml-5"

  # Classe do overlay de fundo para categoria pai ativa
  @overlay_parent "pointer-events-none absolute inset-y-0 left-0 right-2 bg-gray-alpha-100 dark:bg-gray-alpha-200 rounded-md -mr-4 -ml-2"

  # Barra vertical de indicador ativo (filho)
  @active_bar "absolute w-px bg-gray-900 top-[15%] bottom-[15%] left-2"

  # Seletores CSS usados pelo hook JS
  @selector_route_links ~S(a[data-nav-route-bound="true"])
  @selector_link_row "div.flex.w-full.items-center.relative"
  @selector_accordion_btn "button[aria-controls]"
  @selector_overlay ":scope > .absolute.inset-y-0"
  @selector_grid_panel "div.grid"

  # Atributos HTML de estado
  @attr_aria_current "aria-current"
  @attr_data_nav_active "data-nav-active"
  @attr_css_var_icon "--forensic-active-icon-color"

  def config do
    %{
      active_icon_palette: @active_icon_palette,
      nav_token_active: @nav_token_active,
      nav_token_inactive: @nav_token_inactive,
      overlay_child: @overlay_child,
      overlay_parent: @overlay_parent,
      active_bar: @active_bar,
      selector_route_links: @selector_route_links,
      selector_link_row: @selector_link_row,
      selector_accordion_btn: @selector_accordion_btn,
      selector_overlay: @selector_overlay,
      selector_grid_panel: @selector_grid_panel,
      attr_aria_current: @attr_aria_current,
      attr_data_nav_active: @attr_data_nav_active,
      css_var_icon: @attr_css_var_icon
    }
  end

  @doc """
  Retorna a cor de ícone ativa para uma rota, usando o mesmo algoritmo
  de hash que o JS usa para escolher a cor da paleta.

  ## Exemplo

      iex> SidebarActiveConfig.active_icon_color_for("#/black-market")
      "var(--ds-blue-600)"
  """
  def active_icon_color_for(route) when is_binary(route) do
    hash =
      route
      |> String.to_charlist()
      |> Enum.reduce(0, fn char, acc ->
        result = Bitwise.bor(Bitwise.bsl(acc, 5) - acc + char, 0)
        # Simula comportamento de inteiro 32-bit assinado do JS
        <<signed::signed-32>> = <<result::32>>
        signed
      end)

    index = Integer.mod(abs(hash), length(@active_icon_palette))
    Enum.at(@active_icon_palette, index)
  end

  def active_icon_palette, do: @active_icon_palette
  def nav_token_active, do: @nav_token_active
  def nav_token_inactive, do: @nav_token_inactive
  def overlay_child, do: @overlay_child
  def overlay_parent, do: @overlay_parent
  def active_bar, do: @active_bar
  def css_var_icon, do: @attr_css_var_icon
end

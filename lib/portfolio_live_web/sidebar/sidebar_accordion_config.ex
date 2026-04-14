defmodule PortfolioLiveWeb.Sidebar.SidebarAccordionConfig do
  @moduledoc """
  Configuração central para o comportamento do accordion da sidebar.

  Define os seletores, classes CSS e atributos HTML usados pelo
  `SidebarAccordionHook` no lado JS para colapsar e expandir
  as categorias da sidebar de navegação.
  """

  @storage_prefix "sidebar-accordion:"
  @attr_aria_controls "aria-controls"
  @attr_aria_expanded "aria-expanded"
  @attr_inert "inert"
  @class_expanded "rotate-90"
  @class_collapsed "rotate-0"
  @selector_accordion_btn "[data-nav-accordion-bound]"
  @selector_label ".text-heading-16"
  @bound_flag "sidebarAccordionBound"

  def config do
    %{
      storage_prefix: @storage_prefix,
      attr_aria_controls: @attr_aria_controls,
      attr_aria_expanded: @attr_aria_expanded,
      attr_inert: @attr_inert,
      class_expanded: @class_expanded,
      class_collapsed: @class_collapsed,
      selector_accordion_btn: @selector_accordion_btn,
      selector_label: @selector_label,
      bound_flag: @bound_flag
    }
  end

  @doc """
  Retorna os atributos HTML necessários para um botão de accordion
  de uma categoria da sidebar.

  ## Exemplo

      iex> SidebarAccordionConfig.button_attrs("menu-nirsoft", false)
      %{
        "aria-controls" => "menu-nirsoft",
        "aria-expanded" => "false",
        "data-nav-accordion-bound" => "true",
        "type" => "button"
      }
  """
  def button_attrs(menu_id, expanded \\ false) when is_binary(menu_id) do
    %{
      "aria-controls" => menu_id,
      "aria-expanded" => if(expanded, do: "true", else: "false"),
      "data-nav-accordion-bound" => "true",
      "type" => "button"
    }
  end

  @doc """
  Retorna os atributos HTML para o painel (div) filho de uma categoria.
  Quando `expanded` é false, adiciona o atributo `inert` para ocultar.
  """
  def panel_attrs(expanded \\ false) do
    base = %{"data-nav-accordion-panel" => "true"}
    if expanded, do: base, else: Map.put(base, "inert", "")
  end

  def storage_prefix, do: @storage_prefix
  def class_expanded, do: @class_expanded
  def class_collapsed, do: @class_collapsed
  def selector_btn, do: @selector_accordion_btn
  def selector_label, do: @selector_label
end

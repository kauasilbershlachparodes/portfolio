defmodule PortfolioLiveWeb.Components.ThemeComponents do
  use Phoenix.Component

  alias PortfolioLiveWeb.Theme.ThemeUtils

  attr(:current_mode, :string, default: "system")
  attr(:settings, :map, default: %{})

  def theme_bootstrap(assigns) do
    assigns =
      assign(assigns,
        theme_color: ThemeUtils.theme_color(assigns.current_mode)
      )

    ~H"""
    <meta name="theme-color" content={@theme_color} data-theme-managed-by="ThemeHook" />
    """
  end

  def theme_switcher(assigns) do
    ~H"""
    <div class="theme-switcher" id="theme-switcher" phx-hook="ThemeHook">
      <label>
        <input type="radio" name="theme_mode" value="light" checked={@current_mode == "light"} />
        Light
      </label>

      <label>
        <input type="radio" name="theme_mode" value="dark" checked={@current_mode == "dark"} /> Dark
      </label>

      <label>
        <input type="radio" name="theme_mode" value="system" checked={@current_mode == "system"} />
        System
      </label>
    </div>
    """
  end
end

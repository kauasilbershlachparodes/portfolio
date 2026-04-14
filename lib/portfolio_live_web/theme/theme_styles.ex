defmodule PortfolioLiveWeb.Theme.ThemeStyles do
  @moduledoc """
  Gera CSS do banner por tema no servidor.
  """

  alias PortfolioLiveWeb.Theme.ThemeConfig

  @default_gradient_light "linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 22%, rgba(255,255,255,0) 78%, rgba(255,255,255,0.06) 100%), linear-gradient(90deg, rgba(105,22,38,0.16) 0%, rgba(255,4,54,0.08) 50%, rgba(105,22,38,0.16) 100%)"
  @default_gradient_dark "linear-gradient(90deg, rgba(8,15,31,0.12) 0%, rgba(8,15,31,0) 25%, rgba(8,15,31,0) 75%, rgba(8,15,31,0.12) 100%), linear-gradient(90deg, rgba(14,165,255,0.16) 0%, rgba(125,211,252,0.08) 50%, rgba(14,165,255,0.16) 100%)"
  @default_gradient_maintenance "linear-gradient(90deg, rgba(55,0,0,0.28) 0%, rgba(120,0,0,0.18) 50%, rgba(55,0,0,0.28) 100%)"

  @safe_css_color ~r/^(?:#[0-9a-fA-F]{3,8}|(?:rgb|rgba|hsl|hsla)\([0-9a-zA-Z%.,\s+\/-]+\)|var\(--[a-zA-Z0-9_-]+\)|transparent|currentColor|inherit)$/
  @safe_css_url ~r/^(?:https?:\/\/|\/|\.\/|\.\.\/)[a-zA-Z0-9\-._~:\/?#[\]@!$&'*+,;=%]+$/

  def render_theme_styles(settings \\ %{}) do
    css = build_banner_css("light", settings) <> "\n" <> build_banner_css("dark", settings)
    String.slice(css, 0, ThemeConfig.max_style_text_length())
  end

  def build_banner_css(theme_mode, settings \\ %{}) when theme_mode in ["light", "dark"] do
    settings = if(is_map(settings), do: settings, else: %{})

    light = map_get(settings, :light_theme, %{})
    dark = map_get(settings, :dark_theme, %{})
    maintenance = map_get(settings, :maintenance_theme, %{})

    speed = safe_seconds(map_get(settings, :scroll_speed_seconds, 18), 18)
    bg_image = background_image_css(map_get(settings, :background_image, ""))
    show_title = map_get(settings, :show_title, true) == true
    show_link = map_get(settings, :show_link, true) == true
    show_icon = map_get(settings, :show_icon, true) == true
    is_maintenance = map_get(settings, :maintenance_mode, false) == true

    palette =
      cond do
        is_maintenance -> safe_palette(maintenance)
        theme_mode == "dark" -> safe_palette(dark)
        true -> safe_palette(light)
      end

    selector_prefix = if theme_mode == "dark", do: ".dark-theme", else: ".light-theme"

    overlay_gradient =
      cond do
        is_maintenance -> @default_gradient_maintenance
        theme_mode == "dark" -> @default_gradient_dark
        true -> @default_gradient_light
      end

    opacity =
      cond do
        is_maintenance ->
          safe_opacity(map_get(settings, :background_opacity_dark, 0.24), 0.24)

        theme_mode == "dark" ->
          safe_opacity(map_get(settings, :background_opacity_dark, 0.24), 0.24)

        true ->
          safe_opacity(map_get(settings, :background_opacity_light, 0.16), 0.16)
      end

    banner_text_default = if(theme_mode == "dark", do: "#dbeafe", else: "#111111")
    title_default = if(theme_mode == "dark", do: "#bae6fd", else: "#111111")
    icon_default = if(theme_mode == "dark", do: "#0ea5ff", else: "#691626")
    link_default = if(theme_mode == "dark", do: "#0ea5ff", else: "#691626")
    link_decoration_default = if(theme_mode == "dark", do: "#7dd3fc", else: "#c88795")
    link_hover_default = if(theme_mode == "dark", do: "#7dd3fc", else: "#ff0436")

    border_base_default =
      if(theme_mode == "dark", do: "rgba(96, 165, 250, 0.42)", else: "rgba(177, 18, 54, 0.35)")

    border_glow_1_default = if(theme_mode == "dark", do: "#0ea5ff", else: "#b11236")
    border_glow_2_default = if(theme_mode == "dark", do: "#7dd3fc", else: "#ff2d55")
    banner_bg_default = if(theme_mode == "dark", do: "#0a1729", else: "#fff1f3")
    banner_border_default = if(theme_mode == "dark", do: "#3b82f6", else: "#f08aa0")

    """
    #{selector_prefix} #sec522-status-banner {
      position: relative;
      overflow: hidden !important;
      isolation: isolate;
      color: #{safe_css_color(map_get(palette, :banner_text, banner_text_default), banner_text_default)} !important;
      --status-border-base: #{safe_css_color(map_get(palette, :border_base, border_base_default), border_base_default)};
      --status-border-glow-1: #{safe_css_color(map_get(palette, :border_glow_1, border_glow_1_default), border_glow_1_default)};
      --status-border-glow-2: #{safe_css_color(map_get(palette, :border_glow_2, border_glow_2_default), border_glow_2_default)};
      background-color: #{safe_css_color(map_get(palette, :banner_bg, banner_bg_default), banner_bg_default)} !important;
      border-color: #{safe_css_color(map_get(palette, :banner_border, banner_border_default), banner_border_default)} !important;
    }

    #{selector_prefix} #sec522-status-banner::before {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      background-image: #{bg_image};
      background-repeat: repeat-x;
      background-size: auto 100%;
      background-position: 0 0;
      opacity: #{opacity};
      animation: sec522-banner-scroll #{speed}s linear infinite;
      transform: translateZ(0);
    }

    #{selector_prefix} #sec522-status-banner::after {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 1;
      pointer-events: none;
      background: #{overlay_gradient};
    }

    #{selector_prefix} #sec522-status-banner,
    #{selector_prefix} #sec522-status-banner p,
    #{selector_prefix} #sec522-status-banner span,
    #{selector_prefix} #sec522-status-right {
      color: #{safe_css_color(map_get(palette, :banner_text, banner_text_default), banner_text_default)} !important;
    }

    #{selector_prefix} #sec522-status-title {
      color: #{safe_css_color(map_get(palette, :title_color, title_default), title_default)} !important;
      display: #{if(show_title, do: "block", else: "none")} !important;
    }

    #{selector_prefix} #sec522-status-icon {
      color: #{safe_css_color(map_get(palette, :icon_color, icon_default), icon_default)} !important;
      display: #{if(show_icon, do: "block", else: "none")} !important;
    }

    #{selector_prefix} #sec522-status-link {
      color: #{safe_css_color(map_get(palette, :link_color, link_default), link_default)} !important;
      text-decoration-color: #{safe_css_color(map_get(palette, :link_decoration_color, link_decoration_default), link_decoration_default)} !important;
      display: #{if(show_link, do: "inline-flex", else: "none")} !important;
    }

    #{selector_prefix} #sec522-status-link:hover {
      color: #{safe_css_color(map_get(palette, :link_hover_color, link_hover_default), link_hover_default)} !important;
      text-decoration-color: #{safe_css_color(map_get(palette, :link_hover_decoration_color, link_hover_default), link_hover_default)} !important;
    }

    @keyframes sec522-banner-scroll {
      from { background-position: 0 0; }
      to { background-position: -1135px 0; }
    }
    """
  end

  defp safe_palette(value) when is_map(value), do: value
  defp safe_palette(_value), do: %{}

  defp safe_css_color(value, default) do
    normalized =
      case value do
        binary when is_binary(binary) -> String.trim(binary)
        atom when is_atom(atom) -> atom |> Atom.to_string() |> String.trim()
        _ -> ""
      end

    if normalized != "" and Regex.match?(@safe_css_color, normalized) do
      normalized
    else
      default
    end
  end

  defp safe_seconds(value, default) do
    value
    |> parse_number(default)
    |> min(120.0)
    |> max(1.0)
    |> format_number()
  end

  defp safe_opacity(value, default) do
    value
    |> parse_number(default)
    |> min(1.0)
    |> max(0.0)
    |> format_number()
  end

  defp parse_number(value, _default) when is_integer(value), do: value * 1.0
  defp parse_number(value, _default) when is_float(value), do: value

  defp parse_number(value, default) when is_binary(value) do
    case Float.parse(String.trim(value)) do
      {number, ""} -> number
      _ -> default
    end
  end

  defp parse_number(_value, default), do: default

  defp format_number(number) when is_float(number) do
    :erlang.float_to_binary(number, decimals: 3)
    |> String.replace(~r/0+$/, "")
    |> String.replace(~r/\.$/, "")
  end

  defp map_get(map, key, default) when is_map(map), do: Map.get(map, key, default)
  defp map_get(_map, _key, default), do: default

  defp background_image_css(""), do: "none"
  defp background_image_css(nil), do: "none"

  defp background_image_css(url) when is_binary(url) do
    normalized = String.trim(url)

    cond do
      normalized == "" ->
        "none"

      String.contains?(normalized, ["\"", "\\", "\r", "\n"]) ->
        "none"

      Regex.match?(@safe_css_url, normalized) ->
        "url(\"#{normalized}\")"

      true ->
        "none"
    end
  end

  defp background_image_css(_url), do: "none"
end

defmodule PortfolioLiveWeb.Theme.ThemeUtils do
  @moduledoc """
  Funções puras para normalizar e resolver o tema.
  """

  @allowed ~w(light dark system)

  def allowed_themes, do: @allowed
  def default_theme, do: "system"

  def safe_theme(mode, fallback \\ default_theme()) do
    normalized_fallback = normalize_theme_value(fallback, default_theme())
    clean = normalize_theme_value(mode, normalized_fallback)

    if clean in @allowed, do: clean, else: normalized_fallback
  end

  def resolve_theme_mode("system", prefers_dark?),
    do: if(prefers_dark?, do: "dark", else: "light")

  def resolve_theme_mode(mode, _prefers_dark?), do: safe_theme(mode)

  def html_theme_attrs(mode, prefers_dark? \\ false) do
    safe_mode = safe_theme(mode)
    resolved = resolve_theme_mode(safe_mode, prefers_dark?)

    %{
      "data-theme-mode" => safe_mode,
      "data-theme-resolved" => resolved,
      "data-theme-bootstrapped" => "true",
      "class" => if(resolved == "dark", do: "dark-theme", else: "light-theme"),
      "style" => "color-scheme: #{resolved};"
    }
  end

  def theme_color("dark"), do: "#0a1729"
  def theme_color(_), do: "#ffffff"

  defp normalize_theme_value(value, fallback) when is_binary(value) do
    value
    |> String.trim()
    |> String.downcase()
    |> case do
      "" -> fallback
      clean -> clean
    end
  end

  defp normalize_theme_value(value, fallback) when is_atom(value) do
    value
    |> Atom.to_string()
    |> normalize_theme_value(fallback)
  end

  defp normalize_theme_value(nil, fallback), do: fallback
  defp normalize_theme_value(_value, fallback), do: fallback
end

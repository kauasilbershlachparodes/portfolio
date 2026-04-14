defmodule PortfolioLiveWeb.Theme.ThemeConfig do
  @moduledoc """
  Configuração central do tema para uso no Phoenix.
  """

  @config_version "2026.03-sec522-home-html-settings"
  @storage_key "theme-preference"
  @group_selector ".theme-switcher"
  @radio_selector "input[type=radio][data-theme-option]"
  @debounce_delay 80
  @bound_flag "themeSwitcherBound"
  @light_style_id "theme-light-style"
  @dark_style_id "theme-dark-style"
  @max_style_text_length 500_000
  @banner_storage_key "sec522-banner-settings-ui"

  def config do
    %{
      config_version: @config_version,
      storage_key: @storage_key,
      group_selector: @group_selector,
      radio_selector: @radio_selector,
      debounce_delay: @debounce_delay,
      bound_flag: @bound_flag,
      light_style_id: @light_style_id,
      dark_style_id: @dark_style_id,
      max_style_text_length: @max_style_text_length,
      banner_storage_key: @banner_storage_key
    }
  end

  def storage_key, do: @storage_key
  def banner_storage_key, do: @banner_storage_key
  def light_style_id, do: @light_style_id
  def dark_style_id, do: @dark_style_id
  def max_style_text_length, do: @max_style_text_length
  def version, do: @config_version
end

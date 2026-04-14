defmodule PortfolioLiveWeb.PageNavigation do
  @moduledoc """
  Defines the ordered list of all content pages and provides helpers
  to compute the previous and next pages for each route.
  """

  @pages [
    %{
      key: :home,
      title: "Kauã Silbershlach Parodes",
      path: "/",
      resource: "publicContent"
    },
    %{
      key: :all_utilities,
      title: "All Utilities",
      path: "/all-utilities",
      resource: "privateProducts"
    },
    %{
      key: :password_tools,
      title: "Password Tools",
      path: "/password-tools",
      resource: "privateProducts"
    },
    %{
      key: :system_tools,
      title: "System Tools",
      path: "/system-tools",
      resource: "privateProducts"
    },
    %{
      key: :browser_tools,
      title: "Browser Tools",
      path: "/browser-tools",
      resource: "privateProducts"
    },
    %{
      key: :programmer_tools,
      title: "Programmer Tools",
      path: "/programmer-tools",
      resource: "privateProducts"
    },
    %{
      key: :network_tools,
      title: "Network Tools",
      path: "/network-tools",
      resource: "privateProducts"
    },
    %{
      key: :outlook_office,
      title: "Outlook / Office",
      path: "/outlook-office",
      resource: "privateProducts"
    },
    %{
      key: :download_64_bit,
      title: "64-bit Download",
      path: "/64-bit-download",
      resource: "privateProducts"
    },
    %{
      key: :panel,
      title: "Panel",
      path: "/panel",
      resource: "privateProducts"
    },
    %{
      key: :forensics,
      title: "Forensics",
      path: "/forensics",
      resource: "privateProducts"
    },
    %{
      key: :pre_release_tools,
      title: "Pre-Release Tools",
      path: "/pre-release-tools",
      resource: "privateProducts"
    }
  ]

  def pages, do: @pages

  def page_for(key) do
    Enum.find(@pages, &(&1.key == key))
  end

  def page_for_path(path) do
    Enum.find(@pages, &(&1.path == path))
  end

  def nav_for(key) do
    index = Enum.find_index(@pages, &(&1.key == key))

    if is_nil(index) do
      %{title: to_string(key), resource: "privateProducts", prev: nil, next: nil}
    else
      current = Enum.at(@pages, index)
      prev = if index > 0, do: Enum.at(@pages, index - 1), else: nil
      next = Enum.at(@pages, index + 1)

      %{
        title: current.title,
        resource: current.resource,
        prev: prev,
        next: next
      }
    end
  end
end

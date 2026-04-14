defmodule PortfolioLiveWeb.PageHTML do
  @moduledoc """
  This module contains pages rendered by PageController.

  See the `page_html` directory for all templates available.
  """
  use PortfolioLiveWeb, :html

  embed_templates("page_html/*")
  embed_templates("page_html/nirsoft_tools/*")

  @doc "Renders the Previous / Next bottom navigation for content pages."
  attr(:prev_page, :map, default: nil)
  attr(:next_page, :map, default: nil)

  def page_nav(assigns) do
    ~H"""
    <hr class="border-top-[1px] my-12 border-0 border-solid border-[var(--accents-2)] sm:my-9" />
    <div class="prev-next-nav-module__P3AUTG__container">
      <%!-- PREVIOUS --%>
      <%= if @prev_page do %>
        <a
          data-testid="bottomnav/previous"
          class="link-module__Q1NRQq__link no-underline prev-next-nav-module__P3AUTG__link"
          href={@prev_page.path}
        >
          <div class="prev-next-nav-module__P3AUTG__navIcon">
            <svg
              class="prev-next-nav-module__P3AUTG__icon"
              height="16"
              viewBox="0 0 16 16"
              width="16"
              style="color: currentcolor;"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M10.5 14.0607L9.96966 13.5303L5.14644 8.7071C4.75592 8.31658 4.75592 7.68341 5.14644 7.29289L9.96966 2.46966L10.5 1.93933L11.5607 2.99999L11.0303 3.53032L6.56065 7.99999L11.0303 12.4697L11.5607 13L10.5 14.0607Z"
                fill="currentColor"
              >
              </path>
            </svg>
          </div>
          <div class="prev-next-nav-module__P3AUTG__previous">
            <div class="prev-next-nav-module__P3AUTG__label">Previous</div>
            <div class="prev-next-nav-module__P3AUTG__title">{@prev_page.title}</div>
          </div>
        </a>
      <% else %>
        <%!-- Invisible spacer keeps Next aligned to the right --%>
        <div
          class="prev-next-nav-module__P3AUTG__link opacity-0 pointer-events-none select-none"
          aria-hidden="true"
        >
          <div class="prev-next-nav-module__P3AUTG__navIcon">
            <svg height="16" viewBox="0 0 16 16" width="16">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M10.5 14.0607L9.96966 13.5303L5.14644 8.7071C4.75592 8.31658 4.75592 7.68341 5.14644 7.29289L9.96966 2.46966L10.5 1.93933L11.5607 2.99999L11.0303 3.53032L6.56065 7.99999L11.0303 12.4697L11.5607 13L10.5 14.0607Z"
                fill="currentColor"
              >
              </path>
            </svg>
          </div>
          <div class="prev-next-nav-module__P3AUTG__previous">
            <div class="prev-next-nav-module__P3AUTG__label">Previous</div>
            <div class="prev-next-nav-module__P3AUTG__title">–</div>
          </div>
        </div>
      <% end %>

      <div class="prev-next-nav-module__P3AUTG__separator"></div>

      <%!-- NEXT --%>
      <%= if @next_page do %>
        <a
          data-testid="bottomnav/next"
          class="link-module__Q1NRQq__link no-underline prev-next-nav-module__P3AUTG__link"
          href={@next_page.path}
        >
          <div class="prev-next-nav-module__P3AUTG__next">
            <div class="prev-next-nav-module__P3AUTG__label">Next</div>
            <div class="prev-next-nav-module__P3AUTG__title">{@next_page.title}</div>
          </div>
          <div class="prev-next-nav-module__P3AUTG__navIcon">
            <svg
              class="prev-next-nav-module__P3AUTG__icon"
              height="16"
              viewBox="0 0 16 16"
              width="16"
              style="color: currentcolor;"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M5.50001 1.93933L6.03034 2.46966L10.8536 7.29288C11.2441 7.68341 11.2441 8.31657 10.8536 8.7071L6.03034 13.5303L5.50001 14.0607L4.43935 13L4.96968 12.4697L9.43935 7.99999L4.96968 3.53032L4.43935 2.99999L5.50001 1.93933Z"
                fill="currentColor"
              >
              </path>
            </svg>
          </div>
        </a>
      <% end %>
    </div>
    """
  end
end

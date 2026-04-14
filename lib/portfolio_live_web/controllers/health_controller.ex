defmodule PortfolioLiveWeb.HealthController do
  use PortfolioLiveWeb, :controller

  def health(conn, _params) do
    conn
    |> put_resp_header("cache-control", "no-store")
    |> json(%{
      status: "ok",
      service: "portfolio_live",
      checks: %{
        endpoint: "up"
      }
    })
  end

  def chrome_devtools_probe(conn, _params) do
    conn
    |> put_resp_header("cache-control", "no-store")
    |> send_resp(:no_content, "")
  end

  def ready(conn, _params) do
    checks = %{
      endpoint: up?(PortfolioLiveWeb.Endpoint),
      finch: up?(PortfolioLive.Finch),
      pubsub: up?(PortfolioLive.PubSub)
    }

    status =
      if Enum.all?(checks, fn {_name, state} -> state end) do
        :ok
      else
        :service_unavailable
      end

    conn
    |> put_resp_header("cache-control", "no-store")
    |> put_status(status)
    |> json(%{
      status: if(status == :ok, do: "ready", else: "not_ready"),
      service: "portfolio_live",
      checks:
        Enum.into(checks, %{}, fn {name, state} ->
          {name, if(state, do: "up", else: "down")}
        end)
    })
  end

  defp up?(name) when is_atom(name), do: not is_nil(Process.whereis(name))
end

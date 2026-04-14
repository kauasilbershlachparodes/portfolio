defmodule PortfolioLiveWeb.ErrorJSON do
  @moduledoc false

  def render(template, _assigns) do
    status = Phoenix.Controller.status_message_from_template(template)

    message =
      case template do
        "404.json" -> "Recurso não encontrado."
        "403.json" -> "Acesso negado."
        _ -> "Não foi possível processar a solicitação."
      end

    %{ok: false, error: message, status: status}
  end
end

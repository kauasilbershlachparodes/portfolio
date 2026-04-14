defmodule PortfolioLiveWeb.ErrorHTML do
  use PortfolioLiveWeb, :html

  def render(template, _assigns) do
    status = Phoenix.Controller.status_message_from_template(template)

    message =
      case template do
        "404.html" -> "A página solicitada não foi encontrada."
        "403.html" -> "Você não tem permissão para acessar este recurso."
        _ -> "Ocorreu um erro ao processar a sua solicitação."
      end

    """
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <title>#{status}</title>
      </head>
      <body>
        <main>
          <h1>#{status}</h1>
          <p>#{message}</p>
        </main>
      </body>
    </html>
    """
  end
end

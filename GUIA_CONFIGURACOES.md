# Painel de configurações

Inicie o painel com `npm run web` e abra o endereço local exibido no terminal. A seção **Configurações** permite alterar preferências não secretas de campanhas e IA, consultar a disponibilidade das integrações e administrar o monitoramento WhatsApp.

## Segredos e integrações

Chaves de IA, Evolution API, token administrativo do monitoramento e credenciais Google permanecem apenas no `.env` ou nos arquivos de credenciais. O painel mostra somente o estado de configuração, nunca os valores.

## Monitoramento WhatsApp

Informe o valor de `WHATSAPP_MONITORING_ADMIN_TOKEN` no campo de token administrativo. O valor fica somente na memória da página e é perdido ao recarregar. Com ele, é possível listar, adicionar e remover contatos/grupos permitidos, consultar o status e registrar o webhook Evolution.

As mensagens continuam em modo sugestão: o monitoramento não envia respostas automaticamente.

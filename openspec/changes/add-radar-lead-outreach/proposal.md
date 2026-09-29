# Proposal

## Why

O Radar de Leads encontra pedidos reais em grupos, mas hoje só lista — para virar negócio, alguém precisa iniciar contato. Fazer isso manualmente perde o contexto (o que a pessoa pediu, em qual grupo) e não tem nenhuma trava contra o agente prometer preço ou fechar algo sem autorização do operador. É preciso um caminho estruturado de "contatar este lead" que reaproveite o fluxo de aprovação já existente, e regras explícitas e inegociáveis de quando parar e pedir decisão do operador.

## What Changes

- Resolve o identificador de privacidade (`@lid`) dos participantes de grupo para um número de WhatsApp real, via `GET /group/participants` da Evolution API.
- Adiciona um caminho de contato a partir de um lead do radar, que gera (via IA) uma primeira mensagem contextual referenciando o que a pessoa pediu no grupo, como rascunho pendente de aprovação (reaproveita o fluxo já existente, nenhuma mudança nele).
- Adiciona três regras de segurança comercial ao agente, via function calling (mesmo mecanismo de `schedule_meeting`/`escalate_to_human`): nunca informar valores sem autorização explícita do operador; nunca fechar/confirmar acordo sem confirmação explícita do operador; alertar o operador quando um lead é considerado qualificado.
- Adiciona um alerta compartilhado (mesmos canais já configurados no Radar — WhatsApp/Telegram) reaproveitado tanto pelo radar quanto pelo agente de vendas.
- Adiciona um campo de "base de conhecimento extra" (texto colado pelo operador) usado no contexto do agente, para complementar o conhecimento já embutido sobre a Othuki.
- Adiciona um botão "Contatar este lead" no painel, tornando o fluxo repetível no dia a dia sem intervenção manual via terminal.

## Capabilities

### New Capabilities

- `radar-lead-outreach`: inicia uma conversa de vendas a partir de um lead do radar, resolvendo o contato real e gerando a primeira mensagem contextual como rascunho pendente.

### Modified Capabilities

- `sales-agent`: adiciona as três regras de segurança comercial (autorização de valor, confirmação de fechamento, alerta de qualificação) ao comportamento do agente em qualquer conversa, não só nas originadas pelo radar.

## Impact

- Nenhuma mudança no fluxo de aprovação de mensagens já existente — as novas regras decidem *o que* o agente pode rascunhar, não *se* uma mensagem precisa de aprovação (isso já era sempre verdade).
- Uso adicional da Evolution API (`group/participants`) só quando um contato de lead do radar é iniciado, não em toda varredura.
- Sem novas credenciais — reaproveita Supabase, WhatsApp e Telegram já configurados.

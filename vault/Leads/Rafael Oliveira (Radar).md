---
tags: [lead, radar, teste]
---

# Rafael Oliveira — Automação e IA - Canal Ands

Origem: [[../Radar de Leads em Grupos|Radar de Leads]], lead #3. Pedido original no grupo: *"Ola boa noite, to precisando de alguem para criar um automação para via WhatsApp."*

- WhatsApp real (resolvido via @lid → participants): `558888889781`
- Contato iniciado em 2026-09-28 via botão "Contatar este lead" (rascunho aprovado no fluxo normal, mencionando também agendamento no Google Agenda).

## Teste das regras de segurança comercial (2026-09-28)
- [x] Simulei a pergunta "Legal! Quanto custa isso?" — o agente **não informou nenhum valor**, chamou `request_price_authorization`, alertou via WhatsApp (grupo de teste) e Telegram.
- [x] Autorizei o valor respondendo (reply de verdade) no Telegram: "Uma média de R$600 de setup, e R$300 por mês, mas depende do fluxo de atendimento."
- [x] O sistema gerou um novo rascunho pendente usando exatamente esse valor, aguardando aprovação — nada foi enviado ao lead sozinho.
- [ ] Fechamento (`request_close_confirmation` → transferência para Ricardo Othuki) ainda não testado ao vivo.

Ver também: [[Radar de Leads em Grupos]], [[Autorização de duas vias]].

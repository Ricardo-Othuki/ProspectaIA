---
tags: [indice, prospeccao, previdenciario]
---

# Prospecção — Just (Advocacia Previdenciária)

## Objetivo
Firmar a primeira parceria com um escritório de advocacia previdenciária em Pernambuco, oferecendo o [[Produto - Just|Just]] como produto/serviço.

## ICP (perfil ideal)
Escritórios de advocacia previdenciária (INSS, BPC/LOAS, auxílio-doença, pensão por morte) em PE, com sinais de perda de lead por demora/triagem espalhada/atendimento fora do horário — ver critérios de priorização em [[Lista de Prospecção - Previdenciário PE]].

## Estado atual do teste (2026-09-28)
- Sistema configurado: `business-profile.json` e `.env` (`CAMPAIGN_STYLE=professional`, `WHATSAPP_MONITORING_ADMIN_TOKEN` gerado) preparados para esse segmento.
- Construindo o **fluxo de aprovação de mensagens**: o agente gera o rascunho, mas nada é enviado ao WhatsApp sem o operador clicar em Aprovar/Alterar e enviar. Detalhes técnicos em `openspec/changes/add-message-approval-flow/`.
- Persistência de conversas migrando de memória (`Map`, perdida a cada restart) para Supabase.
- Primeiro teste do fluxo: lead [[Leads/João Varella Advogados Associados]], mas o **envio de teste vai para um grupo de WhatsApp** (simulação), não para o número real do lead, por instrução explícita do usuário — só depois de validar o fluxo é que o contato real começa.

## Ligações
- Produto: [[Produto - Just]]
- Lista completa de leads: [[Lista de Prospecção - Previdenciário PE]]
- Lead do teste atual: [[Leads/João Varella Advogados Associados]]

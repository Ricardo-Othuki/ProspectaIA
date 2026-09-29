---
tags: [lead, previdenciario, recife, teste]
---

# João Varella Advogados Associados

- Prioridade: **A** (lista [[../Lista de Prospecção - Previdenciário PE|Lista de Prospecção - Previdenciário PE]])
- Advogado(a) responsável: João Campiello Varella Neto / Alyne Melo
- Cidade/Bairro: Recife / Santo Amaro
- WhatsApp: (81) 98776-9389
- Instagram: @joaovarellaadvogados (roda anúncio, botão de WhatsApp)
- Site: https://www.joaovarellaadvogados.adv.br/
- Sinal observado: site lista 5 telefones diferentes por unidade (Recife, Timbaúba, Nazaré da Mata, Moreno, Escada) — triagem espalhada entre unidades.
- Gancho sugerido: "Cinco números diferentes publicados no site — como vocês centralizam a triagem hoje?"

## Status do teste (fluxo de aprovação)

Primeiro lead usado para testar o fluxo de aprovação de mensagens do agente (ver `openspec/changes/add-message-approval-flow`). **Por instrução do usuário, o envio de teste vai para o grupo de WhatsApp de teste (`TARGET_GROUP_ID` / "Grupo de Networking"), não para o número real acima** — simulação antes do contato real.

Produto sendo oferecido: [[../Produto - Just|Just]].

- [x] Rascunho da 1ª mensagem gerado (2026-09-28), aguardando aprovação no painel — destino configurado: grupo de teste
- [ ] Aprovado/testado no grupo
- [x] **Contato real acidental em 2026-09-28**: ao testar "Assumir conversa" + chat manual no painel, um bug enviou "oi" para o número real do escritório (o botão de mensagem manual não respeitava o destino de teste, só a aprovação do rascunho respeitava). Bug corrigido no mesmo dia.
- O escritório usa chatbot com menu de opções; como a resposta demorou, o "oi" caiu na fila de atendimento humano deles. **Decisão**: esperar um atendente humano deles responder, e só então enviar a 1ª mensagem de prospecção de verdade (a real, sobre o Just).
- [x] Atendente humano do escritório respondeu (2026-09-28): **Rebeca Vieira**, se apresentou como equipe do escritório, perguntou como podia ajudar.
- [x] Rascunho aprovado (assinado "Ricardo Othuki") e enviado ao número real do lead em 2026-09-28 — pede à Rebeca, com gentileza, para indicar o responsável certo para tratar de parceria/negócio (ela não é quem decide).
- [ ] Resposta do lead recebida (aguardando indicação de responsável)
- [ ] Reunião agendada

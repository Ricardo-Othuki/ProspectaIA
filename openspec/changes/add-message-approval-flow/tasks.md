# Tasks

## 1. Persistência Supabase

- [ ] 1.1 Operador cria tabelas `conversations` e `conversation_messages` no Supabase (SQL na proposta/design).
- [ ] 1.2 Operador fornece `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`, adicionados ao `.env` (fora do Git).
- [ ] 1.3 `npm install @supabase/supabase-js`.
- [ ] 1.4 Criar `src/conversationStore.js` com CRUD assíncrono que devolve conversas no shape já usado hoje.

## 2. Agente — rascunho pendente

- [ ] 2.1 `LeadAgent` passa a usar `conversationStore` em vez de `this.conversationState` (Map).
- [ ] 2.2 `startOutreach` gera a 1ª mensagem e grava como `pendingMessage` (status `awaiting_approval`), sem enviar.
- [ ] 2.3 `processLeadResponse` grava a resposta gerada como `pendingMessage` em vez de enviar automaticamente (mantém bypass quando `humanControlled`).
- [ ] 2.4 Novo `approvePendingMessage(leadId, { editedContent, target })` envia e move o rascunho para `messages`.
- [ ] 2.5 Novo `discardPendingMessage(leadId)` descarta sem enviar.
- [ ] 2.6 `getConversationsStatus` conta `awaitingApproval`.

## 3. Rotas

- [ ] 3.1 `POST /agent/messages/:leadId/approve` e `POST /agent/messages/:leadId/discard`.
- [ ] 3.2 `POST /agent/release` e `POST /agent/manual-message` (faltavam, já esperadas pelo `api.js`).
- [ ] 3.3 `POST /agent/outreach` aceita `pitch` e `testTarget` opcionais.
- [ ] 3.4 Ajustar `await` nas rotas que chamam métodos agora assíncronos.

## 4. Painel

- [ ] 4.1 Card de prospecção/produto na tela de conversa selecionada.
- [ ] 4.2 Card de rascunho pendente com os 3 botões (Aprovar envio / Não enviar / Alterar e enviar).
- [ ] 4.3 Badge "Aguardando aprovação" na lista de conversas.

## 5. Teste

- [ ] 5.1 Rodar `POST /agent/outreach` para o lead de teste com `testTarget` apontando para o grupo de WhatsApp de teste.
- [ ] 5.2 Validar no painel: aprovar, descartar e alterar-e-enviar, cada um levando ao resultado esperado no grupo de WhatsApp.

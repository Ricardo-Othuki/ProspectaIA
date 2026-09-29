# Proposal

## Why

`LeadAgent.startOutreach()` gera a primeira mensagem com IA e envia direto pelo WhatsApp, sem revisão humana. Antes de falar com leads reais de advocacia previdenciária, o operador precisa testar o produto e a qualidade das mensagens geradas, com controle explícito de envio e sem depender de estado em memória que se perde a cada restart do servidor.

Este change entrega um recorte pequeno, já compatível com o change maior e ainda não implementado `build-supabase-sales-agent`: a política padrão "aprovar antes de enviar" da capability `sales-agent`, e uma persistência mínima em Supabase (capability `supabase-persistence`) para conversas e mensagens — sem multi-tenant, RLS por organização, importação de contatos, deploy Vercel ou cadência comercial, que ficam para quando o produto evoluir além de um único operador.

## What Changes

- O agente nunca envia uma mensagem via WhatsApp sozinho: toda mensagem gerada (primeiro contato ou resposta de acompanhamento) fica como rascunho pendente até o operador aprovar, editar-e-enviar, ou descartar.
- Cada conversa passa a ter um destino de envio configurável por teste (`testTarget`), permitindo simular a prospecção enviando para um grupo de WhatsApp em vez do número real do lead.
- O painel de Conversas mostra os detalhes do produto/prospecção sendo pitchado e um card de rascunho pendente com os três botões de decisão.
- Estado de conversas e mensagens passa a ser persistido no Supabase (chave de serviço somente no backend) em vez de um `Map` em memória, sobrevivendo a restarts do servidor.
- Rotas `takeover`/`release`/`manual-message`, já esperadas pelo cliente da API do dashboard mas ausentes no backend, são implementadas.

## Capabilities

### Modified Capabilities

- `sales-agent`: adiciona a política padrão de aprovação humana antes de qualquer envio (recorte de "Manter humano no controle" do change `build-supabase-sales-agent`, sem cadência/funil/opt-out).
- `supabase-persistence`: adiciona persistência mínima de conversas e mensagens (recorte de "Persistir domínio comercial", sem RLS multi-tenant/multi-organização).
- `whatsapp-monitoring`: o fluxo de sugestão de resposta do webhook `/agent/inbound` passa a alimentar o mesmo rascunho pendente por conversa, em vez de apenas devolver uma sugestão efêmera na resposta HTTP.

## Impact

- Nova dependência `@supabase/supabase-js` e duas tabelas (`conversations`, `conversation_messages`) criadas manualmente pelo operador no SQL editor do Supabase.
- Novas variáveis de ambiente `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`, fornecidas fora do Git.
- `LeadAgent` deixa de manter estado em memória; métodos que hoje são síncronos (`takeover`, `releaseControl`, `getConversation`, `getConversationsStatus`, `listConversations`) passam a ser assíncronos.
- Sem impacto em multi-tenant/auth/RLS/deploy — isso permanece escopo do change `build-supabase-sales-agent` para quando for necessário.

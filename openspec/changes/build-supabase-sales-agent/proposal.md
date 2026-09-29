# Proposal

## Why

O produto precisa evoluir de ferramentas isoladas de prospecção para um agente comercial operável em produção: importar uma lista autorizada de contatos, executar cadências de venda via WhatsApp, acompanhar respostas, qualificar oportunidades, manter histórico e permitir intervenção humana. O estado atual é local e não oferece persistência, auditoria, autenticação, filas ou deploy adequados para isso.

## What Changes

- Adicionar Supabase como fonte de verdade para contatos, consentimentos, campanhas, cadências, conversas, mensagens, sugestões, aprovações, auditoria e configurações não secretas.
- Implementar importação CSV/XLSX com validação, deduplicação, origem, consentimento/opt-out e prévia antes de ativar contatos.
- Criar motor de campanha comercial com cadência, janelas de horário, limites de volume, pausas, estados do funil, retry seguro e bloqueio automático em opt-out/erro.
- Integrar Evolution API por webhook assinado/autenticado, idempotência e fila para responder apenas contatos elegíveis.
- Implementar agente vendedor que classifica intenção, gera respostas, atualiza etapa do funil e agenda próximo passo; iniciar em modo aprovação humana e permitir automação por regras explicitamente configuradas.
- Criar painel operacional PT-BR com contatos, campanhas, conversas, sugestões, aprovações, métricas, opt-outs e trilha de auditoria.
- Preparar deploy em Vercel para interface/API compatível com serverless e Supabase; usar n8n apenas para agendamentos/filas que não caibam de forma confiável no Vercel, mantendo o core de segurança no app.
- Adicionar GitHub Actions para testes, validação OpenSpec e deploy controlado, sem versionar secrets.

## Capabilities

### New Capabilities

- `sales-agent`: Agente comercial, funil, cadência, aprovação, intervenção humana, opt-out e auditoria.
- `contact-import`: Importação governada de contatos, validação, deduplicação, consentimento e prévia.
- `supabase-persistence`: Modelo de dados, RLS, migrations e acesso seguro ao Supabase.
- `production-deployment`: Configuração Vercel, automação GitHub e operações seguras de webhook/fila.

### Modified Capabilities

- `whatsapp-integration`: Passa a processar webhooks persistidos, contatos elegíveis e mensagens de campanha através da camada comercial.
- `whatsapp-monitoring`: A allowlist local migra para elegibilidade/consentimento persistidos por contato e campanha.
- `configuration-management`: O painel passa a gerenciar configurações comerciais e seguras persistidas no Supabase.
- `campaign-management`: Campanhas deixam de ser somente geração de conteúdo e passam a suportar execução comercial rastreável.

## Impact

- Nova dependência Supabase e migrations SQL; exigirá credenciais e URL do projeto.
- Mudança de deploy de processo Express local para arquitetura compatível com Vercel ou backend/worker separado.
- Novas variáveis de ambiente para Supabase, Evolution e autenticação; valores fornecidos fora do Git.
- n8n será opcional e usado somente após confirmar necessidade de agendamento persistente/volume; não substituirá validação, RLS ou autorização do aplicativo.

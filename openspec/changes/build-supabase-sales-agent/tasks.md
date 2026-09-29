# Tasks

## Etapa 0. Fundação e acessos

- [ ] 0.1 Confirmar escopo comercial, política de consentimento, volume, janela de envio e política inicial de aprovação humana.
- [ ] 0.2 Provisionar projeto Supabase, configurar Auth e fornecer variáveis de ambiente por canal seguro.
- [ ] 0.3 Confirmar repositório GitHub, projeto Vercel e método de deploy; configurar secrets fora do Git.
- [ ] 0.4 Definir se n8n é necessário após validar jobs/cron em Supabase/Vercel.

## Etapa 1. Persistência e segurança

- [ ] 1.1 Adicionar cliente Supabase, migrations versionadas e RLS para organizações, usuários e domínio comercial.
- [ ] 1.2 Implementar autenticação, autorização e proteção de endpoints administrativos.
- [ ] 1.3 Implementar auditoria, idempotência, redaction de logs e testes de RLS.

## Etapa 2. Contatos e campanhas

- [ ] 2.1 Implementar importação CSV com mapeamento, prévia, validação, deduplicação e registro de consentimento/origem.
- [ ] 2.2 Implementar contatos, tags, segmentação, opt-out, exclusão e exportação governada.
- [ ] 2.3 Implementar campanhas, cadências, limites, janelas de horário, pausa e política de aprovação.

## Etapa 3. Agente vendedor e WhatsApp

- [ ] 3.1 Implementar jobs persistidos, agente vendedor, funil, tomada humana e sugestões aprováveis.
- [ ] 3.2 Migrar webhook Evolution para persistência, autenticação e processamento idempotente.
- [ ] 3.3 Implementar envio revisado e automação controlada, bloqueada por padrão para contatos inelegíveis/opt-out.
- [ ] 3.4 Implementar painel PT-BR para contatos, campanhas, conversas, aprovações e auditoria.

## Etapa 4. Produção e operação

- [ ] 4.1 Configurar deploy Vercel e pipeline GitHub Actions com testes e validação OpenSpec.
- [ ] 4.2 Configurar jobs em Supabase e avaliar/implantar n8n somente se necessário.
- [ ] 4.3 Executar ambiente de teste com contatos de homologação e campanha somente com aprovação humana.
- [ ] 4.4 Validar segurança, observabilidade, opt-out, recuperação de falhas e documentação operacional.

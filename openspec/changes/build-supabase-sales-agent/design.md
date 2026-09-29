# Design

## Context

O projeto é um Express local com persistência em arquivos e integração Evolution API. Para operação comercial contínua, ele precisa de autenticação, estado compartilhado, trilha de auditoria, fila/cadência persistente e deploy HTTPS. Supabase oferece Postgres, Auth, Storage, RLS e funções/cron; Vercel oferece interface/API serverless e GitHub oferece CI/CD. n8n pode complementar tarefas de longa duração e agendamentos, mas não será a fonte de verdade.

## Goals / Non-Goals

**Goals:**

- Construir um agente vendedor governado por contatos fornecidos e autorizados pelo operador.
- Persistir estado comercial e auditoria em Supabase com RLS.
- Iniciar com aprovação humana e permitir automação somente por política de campanha explícita.
- Implantar frontend/API com CI/CD e webhooks seguros.

**Non-Goals:**

- Compra/descoberta automática de listas, enriquecimento de dados sem autorização ou contato de leads não elegíveis.
- Automação irrestrita de mensagens, evasão de limites do WhatsApp ou remoção de opt-out.
- Uso de chave Supabase service-role no navegador.
- Acesso a GitHub, Vercel, Supabase ou n8n sem credenciais e autorização explícitas do operador.

## Decisions

- Supabase Postgres será a fonte de verdade; migrations SQL versionadas criarão organizações, perfis, contatos, consentimentos, importações, campanhas, etapas, tarefas, conversas, mensagens, aprovações, eventos e opt-outs.
- Supabase Auth protegerá o painel; RLS isola organizações. O backend mantém operações privilegiadas com service-role somente no ambiente seguro.
- O motor cria jobs persistidos e idempotentes antes de qualquer envio; um worker executa somente jobs elegíveis e registra receipt do provedor.
- Vercel hospeda painel e endpoints curtos. A execução de cadência usará Supabase Cron/Edge Functions primeiro; n8n será integrado se testes de volume/duração mostrarem necessidade operacional, com callback autenticado e idempotente.
- Importação será em duas fases: upload/prévia e confirmação. XLSX requer dependência adicional; CSV será suporte mínimo inicial.
- Evolution webhook será confirmado por secret/assinatura, normalizado, persistido e enfileirado antes de resposta do agente.

## Risks / Trade-offs

- [Políticas de WhatsApp e entregabilidade] → Limites conservadores, opt-out imediato, janelas de horário, aprovação humana padrão e métricas de falha.
- [Serverless e jobs longos] → Jobs pequenos/idempotentes; n8n somente para orquestração persistente quando necessário.
- [Dados pessoais] → RLS, mínimo necessário, logs redigidos, retenção configurável e exportação/remoção por contato.
- [Migração gradual] → Manter integrações atuais em modo compatibilidade até importar/configurar campanha no novo domínio.

## Migration Plan

1. Provisionar Supabase e configurar autenticação/secrets no ambiente, sem ativar envios.
2. Aplicar migrations e validar RLS com dados de teste.
3. Implantar importação, painel de revisão e modo somente sugestão.
4. Configurar webhook Evolution e testar eventos de sandbox/lista de teste.
5. Habilitar campanhas com aprovação humana; ativar automação controlada somente após validação.
6. Configurar Vercel/GitHub e, caso necessário após teste de jobs, n8n.

## Open Questions

- Qual política legal/base de consentimento será registrada para sua lista?
- A operação será para uma organização única ou multiempresa?
- Qual volume diário e horários comerciais desejados?
- O envio automático controlado deve ser habilitado inicialmente ou apenas após período de aprovação humana?

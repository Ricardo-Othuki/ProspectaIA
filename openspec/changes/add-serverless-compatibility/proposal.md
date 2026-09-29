# Proposal

## Why

O sistema hoje só funciona como um processo Node de longa duração: SSE para o painel, `setInterval` para a varredura automática do radar, long polling do Telegram, e configuração local em arquivos JSON. Nenhuma dessas quatro coisas sobrevive numa função serverless (Vercel), onde cada invocação é isolada, o sistema de arquivos é efêmero, e não há processo contínuo. Antes de publicar o projeto na Vercel, o sistema precisa funcionar de forma equivalente sob esse modelo.

## What Changes

- Move o estado hoje guardado em arquivos JSON locais (configurações, grupos excluídos do radar, correlação de alertas) para o Supabase já em uso.
- Troca o long polling do Telegram por um webhook em produção, mantendo o polling apenas para uso local (onde não há endereço público).
- Troca a varredura automática por `setInterval` (só funciona com processo contínuo) por uma rota de cron protegida, chamada periodicamente pela própria Vercel — mantendo o `setInterval` como caminho local.
- Troca a atualização em tempo real do painel (SSE) por um log de eventos persistido e consultado por polling curto — funciona igual local e em produção, sem depender de conexão persistente.
- Empacota o servidor Express como uma função serverless (`api/index.js` + `vercel.json`), sem alterar o comportamento ao rodar localmente com `npm run web`.

## Capabilities

### New Capabilities

- `serverless-compatibility`: o sistema opera corretamente tanto como processo local de longa duração quanto como função serverless, com paridade de comportamento observável (aprovação de mensagens, radar, alertas, autorização).

### Modified Capabilities

- `supabase-persistence`: mais três tabelas (configurações, grupos excluídos, correlação de alertas, log de eventos) além das já existentes.

## Impact

- Mudança é aditiva: nada do comportamento local (`npm run web`) muda: os caminhos antigos (SSE, `setInterval`, polling do Telegram) continuam ativos localmente, detectados via ausência da variável `VERCEL` (definida automaticamente pela Vercel em produção).
- Novas variáveis de ambiente: `CRON_SECRET` (protege a rota de cron).
- O painel passa a atualizar por polling (poucos segundos de atraso) em vez de push instantâneo — necessário para funcionar de forma confiável em qualquer plano da Vercel, sem depender de um serviço de pub/sub externo.

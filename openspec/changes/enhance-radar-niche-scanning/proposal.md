# Proposal

## Why

O operador consegue gerar uma configuração de nicho por IA, mas precisa ajustar partes específicas do resultado sem perder o alinhamento com o restante do nicho. Além disso, o radar precisa rastrear múltiplos nichos ao mesmo tempo, com controle independente de quais nichos entram no scan e visualização separada dos leads encontrados por nicho.

## What Changes

- Adiciona reescrita assistida por IA de campos individuais de um nicho, usando uma regra/prompt do operador e o contexto completo já gerado.
- Adiciona `scanEnabled` por nicho para controlar quais nichos entram na varredura.
- Atualiza o radar para varrer cada nicho habilitado separadamente, com cursores e deduplicação por nicho.
- Adiciona abas/filtros no painel do radar para listar leads por nicho.

## Non-Goals

- Não criar processos/agentes separados por nicho.
- Não enviar mensagens automaticamente aos leads.
- Não exigir migração imediata de banco para funcionar; a implementação deve preservar compatibilidade com a tabela atual.

## Impact

- Configurações de nicho ganham um campo não secreto `scanEnabled`.
- A classificação e persistência passam a marcar leads com o nicho de origem de forma compatível com o schema atual.

# Tasks

## 1. OpenSpec

- [x] 1.1 Criar proposta, design, tasks e deltas de spec.
- [x] 1.2 Validar `npx openspec validate add-configurable-radar-niches`.

## 2. Backend

- [x] 2.1 Estender `SettingsStore` com validação e defaults para nichos.
- [x] 2.2 Criar utilitário de geração de nicho por IA.
- [x] 2.3 Criar rota `POST /api/settings/radar-niches/generate`.
- [x] 2.4 Atualizar `leadRadar` para usar nicho ativo, palavras negativas e prompt especializado.

## 3. Painel

- [x] 3.1 Adicionar aba/área de nichos no painel.
- [x] 3.2 Implementar formulário de nicho e botão "Gerar com IA".
- [x] 3.3 Persistir nichos via API de settings e refletir nicho ativo.

## 4. Verificação

- [x] 4.1 Rodar validação OpenSpec.
- [x] 4.2 Rodar testes/configurações relevantes existentes.
- [x] 4.3 Conferir estado do git e deixar sem commit.

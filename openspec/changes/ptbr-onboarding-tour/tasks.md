# Tasks

## 1. Localização PT-BR

- [ ] 1.1 Inventariar e traduzir todo texto visível do HTML, JavaScript, respostas de API e documentação operacional para PT-BR.
- [ ] 1.2 Atualizar título, idioma do documento, labels de acessibilidade, loading, estados vazios, validações e falhas de rede.
- [ ] 1.3 Garantir que textos dinâmicos sejam escapados e que termos técnicos internos não alterem contratos de API.
- [ ] 1.4 Adicionar cobertura de busca estática ou testes para evitar regressão de textos em inglês na interface.

## 2. Estado e APIs de onboarding

- [ ] 2.1 Criar store local atômico para progresso de onboarding e conclusão, ignorado pelo Git.
- [ ] 2.2 Definir etapas, requisitos mínimos e checklist de prontidão para perfil, campanha, IA, WhatsApp, allowlist, calendário e primeira campanha.
- [ ] 2.3 Adicionar endpoints para consultar, atualizar, pular, concluir e reiniciar onboarding com validação no servidor.
- [ ] 2.4 Adicionar testes de persistência, retomada, conclusão, reinício e rejeição de etapas inválidas.

## 3. Tour de primeiro acesso

- [ ] 3.1 Criar modal responsivo e acessível com visão geral do funcionamento, progresso e navegação entre etapas.
- [ ] 3.2 Conectar as etapas a perfil e configurações existentes, com salvamento e feedback em PT-BR.
- [ ] 3.3 Exibir estado seguro das integrações e instruções de `.env`, sem campos nem exposição de secrets.
- [ ] 3.4 Orientar a allowlist e o modo sugestão; exigir token em memória para ações administrativas.
- [ ] 3.5 Disponibilizar retomar e reiniciar onboarding na área Configurações.

## 4. Documentação e verificação

- [ ] 4.1 Atualizar guias para explicar fluxo completo do sistema, primeiro acesso e limites de segurança em PT-BR.
- [ ] 4.2 Executar testes específicos de onboarding/configurações/monitoramento e `npm test`.
- [ ] 4.3 Executar `npx openspec validate --all --strict`.
- [ ] 4.4 Executar lint/typecheck disponíveis ou registrar que não há scripts.
- [ ] 4.5 Revisar diff/status para segredos, conteúdo em inglês visível e alterações não relacionadas antes do archive.

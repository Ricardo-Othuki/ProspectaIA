# Tasks

## 1. Executor e isolamento

- [x] 1.1 Criar módulo de execução de simulação com contrato de adaptadores fake e bloqueio explícito de rede/efeitos externos.
- [x] 1.2 Criar fixtures fictícias para perfil, preferências, leads, campanha e payloads Evolution de contato/grupo.
- [x] 1.3 Adicionar coleta de etapas, asserções, duração, avisos e relatório JSON em diretório ignorado pelo Git.
- [x] 1.4 Adicionar testes que provem que o executor não lê secrets, não envia mensagens e não faz requisições externas.

## 2. Cenário ponta a ponta

- [x] 2.1 Simular descoberta/normalização de leads e qualificação com dados fixture.
- [x] 2.2 Simular geração de conteúdo e campanha com adaptador de IA determinístico.
- [x] 2.3 Simular evento WhatsApp permitido e confirmar sugestão com `sent: false`.
- [x] 2.4 Simular evento não permitido, evento próprio e evento duplicado e confirmar bloqueio antes do agente.
- [x] 2.5 Simular tentativa de envio revisado e confirmar que o fake registra intenção sem entrega externa.

## 3. Interfaces operacionais

- [x] 3.1 Adicionar comando npm documentado para executar cenário padrão e cenário por ID.
- [x] 3.2 Adicionar rota segura e controle de painel para iniciar/consultar relatórios de cenários permitidos.
- [x] 3.3 Apresentar relatório e limites de segurança em PT-BR.

## 4. Verificação

- [x] 4.1 Executar simulador padrão e verificar o relatório gerado.
- [x] 4.2 Executar testes existentes, testes de monitoramento/configurações e testes novos de simulação.
- [x] 4.3 Executar `npx openspec validate --all --strict`.
- [x] 4.4 Executar lint/typecheck disponíveis ou registrar indisponibilidade.
- [x] 4.5 Revisar diff/status para secrets, efeitos externos e alterações não relacionadas antes do archive.

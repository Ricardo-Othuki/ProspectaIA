# Onboarding Tour Specification

## ADDED Requirements

### Requirement: Iniciar onboarding no primeiro acesso

O sistema SHALL exibir um onboarding guiado quando não houver conclusão registrada para o operador local. O operador SHALL poder fechar o onboarding, retomá-lo posteriormente nas configurações e reiniciá-lo quando necessário.

#### Scenario: Primeiro acesso ao painel

- **WHEN** o operador abre o painel sem conclusão de onboarding registrada
- **THEN** o sistema apresenta a introdução, a explicação do fluxo e as etapas de configuração

#### Scenario: Operador fecha o onboarding

- **WHEN** o operador fecha o onboarding antes de concluí-lo
- **THEN** o sistema preserva o progresso e disponibiliza a retomada na área de configurações

### Requirement: Guiar a configuração mínima do sistema

O onboarding SHALL conduzir o operador por perfil do negócio, defaults de campanha, estado da IA, integração WhatsApp/Evolution, allowlist opt-in, calendário e primeira campanha. Segredos SHALL continuar somente em variáveis de ambiente ou arquivos de credencial.

#### Scenario: Etapa de perfil do negócio

- **WHEN** o operador preenche os dados mínimos do negócio
- **THEN** o sistema valida e persiste o perfil antes de liberar a próxima etapa

#### Scenario: Etapa de integração com secrets ausentes

- **WHEN** uma integração depende de segredo ausente no `.env`
- **THEN** o sistema informa quais categorias precisam ser configuradas sem exibir nem solicitar o valor do segredo no navegador

### Requirement: Explicar o fluxo operacional

O onboarding SHALL explicar em PT-BR como o sistema descobre e qualifica leads, gera conteúdo, executa campanhas, monitora apenas alvos permitidos e produz sugestões antes de qualquer envio explícito.

#### Scenario: Operador lê a visão geral

- **WHEN** o onboarding inicia
- **THEN** o painel apresenta as fases do fluxo e seus limites de segurança em linguagem clara

### Requirement: Persistir e validar o progresso

O sistema SHALL persistir o progresso do onboarding localmente, registrar etapas concluídas apenas depois de validação e permitir que o operador consulte o checklist de prontidão.

#### Scenario: Retomada após recarregar a página

- **WHEN** o operador recarrega o painel durante o onboarding
- **THEN** o sistema retoma a etapa pendente sem perder as etapas válidas já concluídas

#### Scenario: Operador tenta concluir etapa incompleta

- **WHEN** dados mínimos obrigatórios não foram fornecidos
- **THEN** o sistema mantém a etapa como pendente e indica o que falta

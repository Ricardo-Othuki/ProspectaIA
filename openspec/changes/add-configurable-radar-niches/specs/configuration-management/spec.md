# configuration-management Specification
## ADDED Requirements

### Requirement: Configurar nichos de radar
O sistema SHALL permitir que o operador crie, edite, selecione e persista nichos de rastreio como configuração não secreta, incluindo nome, descrição, oferta, palavras-chave, palavras negativas, sinais de qualificação, regras de compliance e mensagem inicial sugerida.

#### Scenario: Operador salva um nicho válido
- **WHEN** o operador envia um nicho com campos válidos
- **THEN** o sistema persiste o nicho e pode selecioná-lo como nicho ativo do radar

#### Scenario: Operador envia um nicho inválido
- **WHEN** o operador envia campos fora dos limites suportados
- **THEN** o sistema rejeita a configuração e preserva a última configuração válida

### Requirement: Gerar configuração de nicho com IA
O sistema SHALL oferecer geração assistida por IA para sugerir configuração de nicho a partir de um tema, nicho ou produto, sem persistir a sugestão automaticamente.

#### Scenario: IA gera sugestão de nicho
- **WHEN** o operador informa um tema ou produto e solicita geração
- **THEN** o sistema retorna uma sugestão estruturada com palavras-chave, negativas, sinais, compliance e mensagem inicial

#### Scenario: IA indisponível
- **WHEN** a IA não está configurada ou falha
- **THEN** o sistema retorna erro claro e não altera as configurações salvas

#### Scenario: Tema sensível
- **WHEN** o tema envolve IPTV ou outro serviço que possa ser irregular
- **THEN** a sugestão inclui regras e termos negativos para evitar prospecção de ofertas ilegais ou não autorizadas

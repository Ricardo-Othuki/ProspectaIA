# Simulação segura do fluxo

Execute `npm run simulate` para validar um fluxo fictício completo sem usar chaves, rede, Evolution API, IA externa, Google Calendar ou mensagens reais.

O cenário padrão verifica:

1. Perfil e preferências fictícios.
2. Descoberta e qualificação de dois leads fictícios.
3. Geração local e determinística de conteúdo.
4. Evento WhatsApp permitido, que gera sugestão com `sent: false`.
5. Evento não permitido, mensagem própria e evento duplicado, todos bloqueados.
6. Tentativa de envio revisado registrada apenas no adaptador simulado.

O relatório JSON é salvo em `output/simulations/` e não é versionado. Pelo painel, abra **Configurações** e use **Simulação do fluxo**.

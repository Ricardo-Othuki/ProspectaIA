# Monitoramento permitido do WhatsApp

O monitoramento é desativado por padrão: a lista de contatos e grupos permitidos começa vazia. Uma mensagem recebida só chega ao agente se o alvo já tiver sido incluído explicitamente na allowlist.

## Configuração

Defina no `.env`, sem versionar valores reais:

```env
WHATSAPP_PROVIDER=evolution
EVOLUTION_API_URL=https://seu-servidor-evolution
EVOLUTION_API_KEY=sua-chave
EVOLUTION_INSTANCE_NAME=sua-instancia
WHATSAPP_MONITORING_ADMIN_TOKEN=um-token-longo-e-aleatorio
WHATSAPP_MONITORING_WEBHOOK_URL=https://seu-host-publico/api/agent/inbound
```

Inicie o dashboard/API com `npm run web`.

## Administração da allowlist

Todas as operações administrativas exigem o cabeçalho `x-whatsapp-monitoring-token` igual a `WHATSAPP_MONITORING_ADMIN_TOKEN`.

- `GET /api/agent/monitoring/status`: alvos permitidos e estado do provedor, sem chaves ou conteúdo de mensagens.
- `GET /api/agent/monitoring/targets`: lista os telefones e grupos permitidos.
- `POST /api/agent/monitoring/targets`: adiciona `{ "phone": "5511999999999" }` ou `{ "groupId": "1234567890-123456789@g.us" }`.
- `DELETE /api/agent/monitoring/targets`: remove o mesmo formato usado na inclusão.
- `POST /api/agent/monitoring/webhook/register`: registra `{ "url": "https://seu-host-publico/api/agent/inbound" }` na Evolution API. A URL configurada em `WHATSAPP_MONITORING_WEBHOOK_URL` pode ser usada se o corpo for omitido.

A allowlist fica em `data/whatsapp-monitoring.json`, que é ignorado pelo Git.

## Processamento de eventos

Configure a Evolution API para enviar `MESSAGES_UPSERT` a `POST /api/agent/inbound`. O endpoint aceita também o formato direto `{ phone, name, message, fromMe }` para integrações existentes.

Eventos sem alvo ou texto válido, enviados pela própria conta, duplicados ou oriundos de contatos/grupos não permitidos são reconhecidos e ignorados antes de o agente de IA ser chamado.

Para eventos permitidos, a resposta contém `suggestion` e `sent: false`. Nenhuma mensagem é enviada automaticamente.

## Envio revisado

Depois de revisar uma sugestão, envie explicitamente com `POST /api/agent/monitoring/send`, usando o token administrativo e um alvo ainda presente na allowlist:

```json
{
  "phone": "5511999999999",
  "message": "Mensagem revisada e aprovada"
}
```

O endpoint verifica a allowlist novamente imediatamente antes do envio. Use `groupId` no lugar de `phone` para grupos permitidos.



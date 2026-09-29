# 🤖 Agente de Prospecção Automatizada - Othuki

Sistema completo de prospecção automatizada com IA que entra em contato com leads via WhatsApp e tenta convencê-los a agendar reuniões no Google Meet.

## 🎯 Funcionalidades

### 1. Contato Automático via WhatsApp
- ✅ Envio de mensagens personalizadas com IA
- ✅ Análise de intenção do lead
- ✅ Respostas adaptativas baseadas no contexto
- ✅ Simulação de envio (para testes)

### 2. Agendamento no Google Meet
- ✅ Criação automática de reuniões
- ✅ Link do Google Meet gerado automaticamente
- ✅ Convites enviados por email
- ✅ Lembretes automáticos

### 3. Análise de Intenção com IA
- ✅ Identificação automática de interesse
- ✅ Detecção de pedidos de agendamento
- ✅ Identificação de pedidos para falar com humano
- ✅ Respostas para perguntas frequentes

### 4. Fluxo de Conversa Inteligente
- ✅ Estado da conversa persistente
- ✅ Múltiplas tentativas de contato
- ✅ Escalonamento para humano quando necessário
- ✅ Registro completo de todas as interações

## 📁 Estrutura do Sistema

```
business-leads-ai-automation/
├── src/
│   ├── leadAgent.js              # Agente principal de prospecção
│   ├── whatsappIntegration.js    # Integração com WhatsApp
│   ├── googleCalendarIntegration.js # Integração com Google Calendar
│   ├── routes/
│   │   └── agentRoutes.js        # API endpoints do agente
│   └── web/
│       └── server.js             # Servidor web atualizado
├── credentials/                  # Credenciais Google (opcional)
├── output/
│   ├── whatsapp_logs/           # Logs de mensagens WhatsApp
│   └── calendar_logs/           # Logs de reuniões agendadas
└── .env                         # Configurações
```

## 🚀 Início Rápido

### 1. Configurar IA (Google Gemini)
```bash
./configure-api.sh
```

### 2. Configurar WhatsApp (Opcional)
Edite o `.env`:
```bash
# Para simulação (desenvolvimento)
WHATSAPP_PROVIDER=simulation

# Para Twilio
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=seu_sid
TWILIO_AUTH_TOKEN=seu_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Para Meta Cloud API
WHATSAPP_PROVIDER=meta
WHATSAPP_API_KEY=sua_chave
WHATSAPP_PHONE_NUMBER_ID=seu_id
```

### 3. Configurar Google Calendar (Opcional)
```bash
./setup-google-calendar.sh
```

### 4. Testar o Agente
```bash
./test-agent.sh
```

### 5. Iniciar o Dashboard
```bash
./iniciar.sh
```

Acesse: **http://localhost:3001**

## 📡 API Endpoints

### POST /api/agent/outreach
Inicia contato automático com um lead.

**Request:**
```json
{
  "leadId": 1,
  "leadName": "Restaurante Teste",
  "leadPhone": "+5581999999999",
  "leadRating": 4.5,
  "leadWebsite": "https://restaurante.com.br",
  "campaignStyle": "balanced"
}
```

**Response:**
```json
{
  "success": true,
  "conversation": {
    "leadId": 1,
    "status": "contacted",
    "messages": [...]
  }
}
```

### POST /api/agent/response
Processa resposta do lead.

**Request:**
```json
{
  "leadId": 1,
  "message": "Olá, podemos agendar uma reunião?"
}
```

**Response:**
```json
{
  "success": true,
  "intent": "schedule_meeting",
  "response": "Perfeito! Vou agendar uma reunião...",
  "meetingLink": "https://meet.google.com/xxx-yyy-zzz"
}
```

### GET /api/agent/status
Obtém status de todas as conversas.

### GET /api/agent/conversations
Lista todas as conversas ativas.

### GET /api/agent/logs
Obtém logs de mensagens WhatsApp.

### GET /api/agent/meetings
Lista reuniões agendadas.

## 🎯 Fluxo de Prospecção

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO DE PROSPECÇÃO                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. LEAD IDENTIFICADO                                       │
│     ↓                                                       │
│  2. AGENTE GERA MENSAGEM PERSONALIZADA                      │
│     ↓                                                       │
│  3. MENSAGEM ENVIADA VIA WHATSAPP                           │
│     ↓                                                       │
│  4. AGUARDA RESPOSTA (timeout: 24h)                         │
│     ↓                                                       │
│  5. ANALISA INTENÇÃO DA RESPOSTA                            │
│     ├─→ schedule_meeting → AGENDA NO GOOGLE MEET            │
│     ├─→ talk_human → TRANSFERE PARA ATENDENTE               │
│     ├─→ interested → CONTINUA CONVERSA                      │
│     ├─→ questions → RESPONDE DÚVIDAS                        │
│     └─→ not_interested → ENCERRA CONVERS educadamente       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 💬 Exemplo de Conversa

**🤖 Agente (WhatsApp):**
> Olá Restaurante Tadeu! 👋
> 
> Vi que vocês têm 4.8 estrelas no Google - impressionante!
> 
> Sou da Othuki e ajudo restaurantes premium a escalar vendas com IA.
> 
> Podemos conversar 15 min no Google Meet? 📅

**👤 Lead:**
> Olá! Interesse! Podemos agendar?

**🤖 Agente:**
> Perfeito! Vou agendar uma reunião rápida de 15 minutos via Google Meet.
> 
> 📅 Que tal amanhã às 10h ou 15h?
> 
> Assim que confirmar, vou enviar o link! 🎥

**📅 Link gerado:**
> https://meet.google.com/xxx-yyy-zzz

## 🔧 Configurações Avançadas

### Estilos de Campanha
- `conservative` - Tom formal, foco em relacionamento
- `balanced` - Equilíbrio entre profissionalismo e simpaticidade
- `aggressive` - Direto, foco em urgência

### Horário de Funcionamento
Padrão: 9h às 18h (horário de Recife)
Configurável via `.env`:
```bash
AGENT_WORKING_HOURS_START=9
AGENT_WORKING_HOURS_END=18
```

### Tentativas de Contato
Máximo: 3 tentativas por lead
Configurável via `.env`:
```bash
AGENT_MAX_ATTEMPTS=3
```

## 📊 Métricas e Relatórios

O sistema registra automaticamente:
- ✅ Total de contatos realizados
- ✅ Taxa de resposta
- ✅ Intenções identificadas
- ✅ Reuniões agendadas
- ✅ Transferências para humano

Acesse via API:
```bash
curl http://localhost:3001/api/agent/status
```

## 🛠️ Solução de Problemas

### "Erro ao enviar WhatsApp"
- Verifique se o provider está configurado no `.env`
- Para testes, use `WHATSAPP_PROVIDER=simulation`

### "Erro ao agendar reunião"
- Verifique se as credenciais Google estão em `credentials/`
- Execute `./setup-google-calendar.sh` para configurar

### "Agente não responde"
- Verifique se a IA está funcionando: `./test-gemini-connection.js`
- Verifique os logs em `output/whatsapp_logs/`

## 📚 Próximos Passos

1. **Configurar WhatsApp Real**
   - Twilio: https://www.twilio.com/whatsapp
   - Meta: https://developers.facebook.com/docs/whatsapp

2. **Configurar Google Calendar**
   - Crie credenciais OAuth no Google Cloud Console
   - Execute `./setup-google-calendar.sh`

3. **Personalizar Mensagens**
   - Edite os templates em `src/leadAgent.js`
   - Adicione respostas para perguntas frequentes

4. **Integrar com CRM**
   - Use os endpoints da API para sincronizar dados
   - Configure webhooks para notificações

## 📞 Suporte

- 📧 Email: contato@othuki.com.br
- 🌐 Site: https://othuki.com.br
- 📱 WhatsApp: +5581999999999

---

**Desenvolvido por Othuki Agência Digital** 🚀
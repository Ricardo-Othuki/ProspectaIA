# Guia de Prospecção de Leads via Email e WhatsApp

## Visão Geral

Este guia explica como usar o Business Leads AI Automation para prospectar leads via email e WhatsApp com respostas humanizadas e eficientes.

## Fluxo de Trabalho

### 1. Configuração Inicial

```bash
# Execute o assistente de configuração
npm run setup

# Ou configure manualmente
cp .env.example .env
# Edite .env com sua chave de API OpenAI
# Edite business-profile.json com dados do seu negócio
```

### 2. Geração de Leads

#### Opção A: Dashboard Web (Recomendado)
```bash
npm run web
# Acesse http://localhost:3000
# Crie uma nova campanha
# Configure os parâmetros de busca
# Execute a campanha
```

#### Opção B: Linha de Comando
```bash
# Busca básica
node index.js -q "Restaurante São Paulo" -l 20

# Com mensagem de marketing personalizada
node index.js -q "Cafeteria Rio de Janeiro" -l 15 -m "Aumente suas vendas com nosso sistema de pedidos online"

# Em português
node index.js -q "Loja de roupas Belo Horizonte" -l 10 -L portuguese
```

### 3. Personalização das Mensagens

#### Para Email:
O sistema gera templates de email personalizados com:
- Saudação personalizada com o nome do negócio
- Menção a detalhes específicos (avaliação, localização)
- Proposta de valor relevante para o setor
- Call-to-action claro

#### Para WhatsApp:
Templates de WhatsApp com:
- Tom mais casual e direto
- Emojis apropriados
- Mensagem concisa e persuasiva
- Link para contato direto

### 4. Exemplos de Mensagens Geradas

#### Email Template:
```
Assunto: Aumente as vendas do [Nome do Restaurante]

Olá [Nome do Contato],

Vi o [Nome do Restaurante] no Google Maps com avaliação de [X] estrelas - impressionante!

Você está interessado em aumentar as vendas com um sistema de pedidos online que tem se mostrado eficaz para restaurantes na sua região?

[Nossa proposta de valor personalizada...]

Atenciosamente,
[Seu Nome]
[Seu Contato]
```

#### WhatsApp Template:
```
Olá [Nome do Restaurante]! 👋

Vi vocês no Google Maps com [X] estrelas - muito bom! ⭐

Que tal aumentar as vendas com um sistema de pedidos online? 📱

[Temos uma proposta especial para o seu negócio...]

Posso enviar mais detalhes? 😊
```

## Dicas para Mensagens Humanizadas

### 1. Personalização Efetiva
- Use o nome do negócio
- Mencione a avaliação do Google Maps
- Referencie a localização
- Alinhe com o setor específico

### 2. Tom Conversacional
- Evite linguagem formal demais
- Use emojis com moderação (mais para WhatsApp)
- Seja conciso e direto
- Demonstre interesse genuíno

### 3. Proposta de Valor
- Foque nos benefícios, não nas características
- Use dados específicos quando possível
- Adapte para o setor do lead
- Inclua prova social quando disponível

### 4. Call-to-Action Claro
- Email: "Posso enviar mais informações?"
- WhatsApp: "Posso ligar para explicar melhor?"
- Sempre ofereça próximo passo fácil

## Configuração do Perfil do Negócio

Edite o arquivo `business-profile.json` para personalizar as mensagens:

```json
{
  "business": {
    "name": "Sua Empresa",
    "type": "technology",
    "description": "Soluções de automação para PMEs",
    "valuePropositions": [
      "Aumento de 30% nas vendas",
      "Setup em 24 horas",
      "Suporte 24/7",
      "Sem contrato de fidelidade"
    ],
    "targetIndustries": [
      "restaurant",
      "retail",
      "services",
      "healthcare"
    ]
  }
}
```

## Estratégias de Prospecção

### 1. Segmentação por Setor
```bash
# Restaurantes
node index.js -q "Restaurante São Paulo" -l 20

# Lojas de varejo
node index.js -q "Loja de roupas Rio de Janeiro" -l 15

# Serviços profissionais
node index.js -q "Escritório de contabilidade Belo Horizonte" -l 10
```

### 2. Campanhas por Região
```bash
# Foco em uma região específica
node index.js -q "Cafeteria Zona Sul São Paulo" -l 25

# Múltiplas cidades
node index.js -q "Academia Campinas" -l 15
node index.js -q "Academia Guarulhos" -l 15
```

### 3. Personalização por Estilo de Campanha

Configure no `business-profile.json`:
```json
{
  "preferences": {
    "campaignStyle": "aggressive"  // ou "balanced", "conservative"
  }
}
```

- **Aggressive**: Mensagens mais diretas e frequentes
- **Balanced**: Abordagem equilibrada
- **Conservador**: Tom mais suave e respeitoso

## Análise de Resultados

### Métricas Importantes
1. **Taxa de Abertura**: Quantos abriram o email
2. **Taxa de Resposta**: Quantos responderam
3. **Taxa de Conversão**: Quantos se tornaram clientes
4. **Custo por Lead**: Investimento por lead qualificado

### Melhoria Contínua
1. Analise quais mensagens funcionam melhor
2. Teste diferentes abordagens
3. Ajuste o perfil do negócio baseado em feedback
4. Refine os parâmetros de busca

## Automação Avançada

### Integração com CRM
O sistema pode ser integrado com CRMs via webhooks:
```json
{
  "webhook_url": "https://seu-crm.com/api/leads",
  "webhook_method": "POST"
}
```

### Agendamento de Campanhas
Use o dashboard web para agendar campanhas:
1. Acesse http://localhost:3000
2. Crie uma nova campanha
3. Configure agendamento
4. Defina recorrência (diário, semanal, mensal)

### Segmentação Avançada
- Por avaliação do Google Maps
- Por tipo de negócio
- Por localização específica
- Por presença de website

## Solução de Problemas

### Problema: Scraping não retorna resultados
- Verifique os parâmetros de busca
- Aumente o limite de resultados
- Verifique a conexão com a internet

### Problema: Mensagens não são geradas
- Verifique se a chave de API OpenAI está configurada
- Teste a conexão com: `npm run setup`
- Verifique os logs de erro

### Problema: WhatsApp não funciona
- Verifique se o número está correto
- Teste com um número de teste primeiro
- Ajuste a mensagem para ser mais natural

## Recursos Adicionais

- **Documentação Completa**: `README_PORTUGUESE.md`
- **Guia de Implantação**: `docs/DEPLOYMENT_GUIDE.md`
- **Guia do Dashboard**: `docs/WEB_DASHBOARD_GUIDE.md`

## Conclusão

O Business Leads AI Automation é uma ferramenta poderosa para prospecção de leads via email e WhatsApp. Com a configuração correta e personalização das mensagens, você pode alcançar resultados significativos com custo baixo.

Lembre-se sempre de:
- Respeitar a privacidade dos leads
- Enviar mensagens relevantes e personalizadas
- Fornecer valor real em cada interação
- Seguir as melhores práticas de marketing ético

Boa sorte com suas campanhas de prospecção! 🚀
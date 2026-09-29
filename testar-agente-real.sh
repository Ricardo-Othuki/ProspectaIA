#!/bin/bash

# Teste do Agente com Lead Real
echo "🤖 Teste do Agente com Lead Real"
echo "================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Verificar se o servidor está rodando
echo "1️⃣  Verificando servidor..."
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Servidor rodando em http://localhost:3001${NC}"
else
    echo -e "${YELLOW}⚠️  Servidor não está rodando. Iniciando...${NC}"
    WEB_PORT=3001 nohup node src/web/server.js > /tmp/server.log 2>&1 &
    sleep 3
fi
echo ""

# Lista de leads reais para teste
echo "2️�️  Leads disponíveis para teste:"
echo ""
echo -e "${CYAN}1. Restaurante Tadeu${NC} (Avaliação: 4.8 ⭐, Score: 92 - QUENTE)"
echo "   📍 Rua do Sol, 350 - Centro, Recife"
echo "   📞 +558132243456"
echo ""
echo -e "${CYAN}2. Restaurante Ilha dos Sabores${NC} (Avaliação: 4.7 ⭐, Score: 85 - QUENTE)"
echo "   📍 Rua da Aurora, 200 - Boa Vista, Recife"
echo "   📞 +558132245678"
echo ""
echo -e "${CYAN}3. Bar do Morro${NC} (Avaliação: 4.3 ⭐, Score: 72 - MORNO)"
echo "   📍 Rua do Hospício, 500 - Boa Vista, Recife"
echo "   📞 +558132241234"
echo ""

# Escolher lead
read -p "Escolha o lead (1-3): " choice

case $choice in
    1)
        LEAD_ID=5
        LEAD_NAME="Restaurante Tadeu"
        LEAD_PHONE="+558132243456"
        LEAD_RATING=4.8
        LEAD_WEBSITE="https://restaurante-tadeu.com.br"
        ;;
    2)
        LEAD_ID=1
        LEAD_NAME="Restaurante Ilha dos Sabores"
        LEAD_PHONE="+558132245678"
        LEAD_RATING=4.7
        LEAD_WEBSITE="https://ilhadosabores.com.br"
        ;;
    3)
        LEAD_ID=2
        LEAD_NAME="Bar do Morro"
        LEAD_PHONE="+558132241234"
        LEAD_RATING=4.3
        LEAD_WEBSITE=""
        ;;
    *)
        echo -e "${RED}❌ Opção inválida${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}📋 Lead selecionado: ${LEAD_NAME}${NC}"
echo ""

# Iniciar contato
echo "3️⃣  Iniciando contato automático..."
echo ""

RESPONSE=$(curl -s -X POST http://localhost:3001/api/agent/outreach \
    -H "Content-Type: application/json" \
    -d "{
        \"leadId\": ${LEAD_ID},
        \"leadName\": \"${LEAD_NAME}\",
        \"leadPhone\": \"${LEAD_PHONE}\",
        \"leadRating\": ${LEAD_RATING},
        \"leadWebsite\": \"${LEAD_WEBSITE}\",
        \"campaignStyle\": \"balanced\"
    }")

# Verificar se o contato foi iniciado
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Contato iniciado com sucesso!${NC}"
    echo ""
    
    # Extrair mensagem enviada
    MESSAGE=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['conversation']['messages'][0]['content'])" 2>/dev/null)
    
    echo -e "${CYAN}📱 Mensagem enviada via WhatsApp:${NC}"
    echo "---"
    echo "$MESSAGE"
    echo "---"
    echo ""
    
    # Simular resposta do lead
    echo "4️⃣  Simulando resposta do lead..."
    echo ""
    echo "Respostas disponíveis:"
    echo "1. 'Olá, interesse! Podemos agendar?' (Agendar reunião)"
    echo "2. 'Quero falar com um atendente' (Transferir para humano)"
    echo "3. 'Tenho dúvidas sobre preços' (Fazer perguntas)"
    echo "4. 'Não tenho interesse no momento' (Recusar)"
    echo ""
    
    read -p "Escolha a resposta do lead (1-4): " response_choice
    
    case $response_choice in
        1)
            LEAD_RESPONSE="Olá, interesse! Podemos agendar uma reunião para amanhã?"
            ;;
        2)
            LEAD_RESPONSE="Quero falar com um atendente humano, por favor"
            ;;
        3)
            LEAD_RESPONSE="Quanto custa? Como funciona o processo?"
            ;;
        4)
            LEAD_RESPONSE="Não tenho interesse no momento, obrigado"
            ;;
        *)
            LEAD_RESPONSE="Olá, interesse! Podemos agendar?"
            ;;
    esac
    
    echo ""
    echo -e "${CYAN}👤 Resposta do lead: ${LEAD_RESPONSE}${NC}"
    echo ""
    
    # Processar resposta
    echo "5️⃅  Processando resposta com IA..."
    echo ""
    
    RESPONSE2=$(curl -s -X POST http://localhost:3001/api/agent/response \
        -H "Content-Type: application/json" \
        -d "{
            \"leadId\": ${LEAD_ID},
            \"message\": \"${LEAD_RESPONSE}\"
        }")
    
    # Extrair resposta do agente
    AGENT_RESPONSE=$(echo "$RESPONSE2" | python3 -c "import sys, json; print(json.load(sys.stdin)['response'])" 2>/dev/null)
    INTENT=$(echo "$RESPONSE2" | python3 -c "import sys, json; print(json.load(sys.stdin)['intent'])" 2>/dev/null)
    MEETING_LINK=$(echo "$RESPONSE2" | python3 -c "import sys, json; print(json.load(sys.stdin).get('meetingLink', ''))" 2>/dev/null)
    
    echo -e "${GREEN}✅ Resposta processada!${NC}"
    echo ""
    echo -e "${CYAN}🎯 Intenção identificada: ${INTENT}${NC}"
    echo ""
    echo -e "${CYAN}🤖 Resposta do agente:${NC}"
    echo "---"
    echo "$AGENT_RESPONSE"
    echo "---"
    echo ""
    
    if [ -n "$MEETING_LINK" ] && [ "$MEETING_LINK" != "None" ] && [ "$MEETING_LINK" != "" ]; then
        echo -e "${GREEN}📅 Link da reunião gerado:${NC}"
        echo "$MEETING_LINK"
        echo ""
    fi
    
else
    echo -e "${RED}❌ Erro ao iniciar contato${NC}"
    echo "$RESPONSE"
fi

echo "6️⃣  Status das conversas:"
echo ""
curl -s http://localhost:3001/api/agent/status | python3 -m json.tool
echo ""

echo "================================"
echo "✅ Teste concluído!"
echo ""
echo "📋 Para ver mais detalhes:"
echo "   curl http://localhost:3001/api/agent/conversations"
echo ""
echo "🌐 Acesse o dashboard:"
echo "   http://localhost:3001"
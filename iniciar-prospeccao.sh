#!/bin/bash

# Iniciar Auto Responder e Enviar Mensagem Inicial
echo "🤖 Iniciando Auto Responder para Prospecção"
echo "============================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Verificar se o servidor principal está rodando
echo "1️⃣  Verificando servidor principal..."
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Servidor principal rodando em http://localhost:3000${NC}"
else
    echo -e "${YELLOW}⚠️  Servidor principal não está rodando${NC}"
fi
echo ""

# Verificar Evolution API
echo "2️⃣  Verificando Evolution API..."
source .env

STATUS=$(curl -s -X GET "$EVOLUTION_API_URL/instance/connectionState/$EVOLUTION_INSTANCE_NAME" \
    -H "Content-Type: application/json" \
    -H "apikey: $EVOLUTION_API_KEY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('instance', {}).get('state', 'error'))" 2>/dev/null)

if [ "$STATUS" = "open" ]; then
    echo -e "${GREEN}✅ Evolution API conectada${NC}"
else
    echo -e "${RED}❌ Evolution API não conectada${NC}"
    echo "   Status: $STATUS"
    exit 1
fi
echo ""

# Perguntar se quer enviar mensagem inicial
echo "3️⃣  Opções:"
echo ""
echo -e "${CYAN}1. Enviar mensagem inicial e iniciar auto responder${NC}"
echo -e "${CYAN}2. Apenas iniciar auto responder (já enviou mensagem)${NC}"
echo -e "${CYAN}3. Enviar mensagem de teste manual${NC}"
echo ""

read -p "Escolha uma opção (1-3): " choice

case $choice in
    1)
        echo ""
        echo "📤 Enviando mensagem inicial para o grupo..."
        echo ""
        
        # Enviar mensagem inicial via API
        INITIAL_MSG="🚀 *Olá pessoal! 👋*

Sou a Equipe da *Othuki Agência Digital* e estou aqui para apresentar como podemos ajudar vocês a crescer com tecnologia!

✅ *Soluções que oferecemos:*
• Sites de alta performance
• Automação com IA para atendimento 24/7
• Tráfego pago com ROI comprovado
• Criação de SaaS sob medido

🎯 *Estamos oferecendo:*
→ Análise gratuita do seu negócio
→ Consultoria digital personalizada
→ Reunião online via Google Meet

💬 *Quer saber mais?*
Basta responder \"QUERO\" ou mandar sua dúvida!

Estamos aqui para ajudar! 😊

🌐 othuki.com.br"

        RESPONSE=$(curl -s -X POST "$EVOLUTION_API_URL/message/sendText/$EVOLUTION_INSTANCE_NAME" \
            -H "Content-Type: application/json" \
            -H "apikey: $EVOLUTION_API_KEY" \
            -d "{\"number\":\"$TARGET_GROUP_ID\",\"text\":\"$INITIAL_MSG\"}")
        
        if echo "$RESPONSE" | grep -q '"key"'; then
            echo -e "${GREEN}✅ Mensagem inicial enviada!${NC}"
            MSG_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['key']['id'])" 2>/dev/null)
            echo "   📋 Message ID: $MSG_ID"
        else
            echo -e "${RED}❌ Erro ao enviar mensagem${NC}"
            echo "$RESPONSE"
        fi
        echo ""
        ;;
    2)
        echo ""
        echo -e "${GREEN}✅ Pulando envio de mensagem inicial${NC}"
        echo ""
        ;;
    3)
        echo ""
        read -p "Digite a mensagem: " custom_msg
        
        RESPONSE=$(curl -s -X POST "$EVOLUTION_API_URL/message/sendText/$EVOLUTION_INSTANCE_NAME" \
            -H "Content-Type: application/json" \
            -H "apikey: $EVOLUTION_API_KEY" \
            -d "{\"number\":\"$TARGET_GROUP_ID\",\"text\":\"$custom_msg\"}")
        
        if echo "$RESPONSE" | grep -q '"key"'; then
            echo -e "${GREEN}✅ Mensagem enviada!${NC}"
        else
            echo -e "${RED}❌ Erro ao enviar mensagem${NC}"
        fi
        echo ""
        ;;
esac

# Iniciar Auto Responder
echo "4️⃣  Iniciando Auto Responder..."
echo ""

# Verificar se já está rodando
if curl -s http://localhost:3002/health > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Auto Responder já está rodando em http://localhost:3002${NC}"
else
    echo -e "${GREEN}✅ Iniciando Auto Responder na porta 3002...${NC}"
    
    # Iniciar em background
    nohup node src/autoResponder.js > /tmp/auto-responder.log 2>&1 &
    AUTO_PID=$!
    
    sleep 3
    
    # Verificar se iniciou
    if curl -s http://localhost:3002/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Auto Responder rodando!${NC}"
        echo "   📋 PID: $AUTO_PID"
        echo "   📍 URL: http://localhost:3002"
    else
        echo -e "${RED}❌ Erro ao iniciar Auto Responder${NC}"
        cat /tmp/auto-responder.log | tail -20
    fi
fi

echo ""
echo "============================================"
echo "✅ Configuração concluída!"
echo ""
echo "📋 Como funciona:"
echo "   1. Mensagem inicial enviada para o grupo"
echo "   2. Auto Responder escuta novas mensagens"
echo "   3. Quando alguém responde, o agente IA responde"
echo "   4. Conversas são conduzidas para agendar reunião"
echo ""
echo "📊 Monitorar em tempo real:"
echo "   curl http://localhost:3002/health"
echo ""
echo "🌐 Dashboard:"
echo "   http://localhost:3000"
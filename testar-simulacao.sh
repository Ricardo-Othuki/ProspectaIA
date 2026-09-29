#!/bin/bash

# Teste de Simulação de Mensagens no Grupo
echo "🧪 Simulador de Mensagens para Teste"
echo "===================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Verificar se o auto responder está rodando
echo "1️⃣  Verificando Auto Responder..."
if curl -s http://localhost:3002/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Auto Responder rodando${NC}"
else
    echo -e "${YELLOW}⚠️  Auto Responder não está rodando. Iniciando...${NC}"
    nohup node src/autoResponder.js > /tmp/auto-responder.log 2>&1 &
    sleep 3
fi
echo ""

# Cenários de teste
echo "2️�️  Cenários de teste disponíveis:"
echo ""
echo -e "${CYAN}1. Simular pessoa com interesse${NC}"
echo "   Mensagem: \"QUERO SABER MAIS! Como funciona?\""
echo ""
echo -e "${CYAN}2. Simular pessoa fazendo pergunta${NC}"
echo "   Mensagem: \"Quanto custa um site?\""
echo ""
echo -e "${CYAN}3. Simular pessoa com dúvida${NC}"
echo "   Mensagem: \"Vocês trabalham com que tipo de negócio?\""
echo ""
echo -e "${CYAN}4. Simular olá simples${NC}"
echo "   Mensagem: \"Boa noite! Tudo bem?\""
echo ""
echo -e "${CYAN}5. Simular resposta completa${NC}"
echo "   Mensagem: \"Olá! Vi sobre automação com IA. Tenho interesse!\""
echo ""
echo -e "${CYAN}6. Enviar mensagem real para grupo (com outro número)${NC}"
echo ""

read -p "Escolha um cenário (1-6): " choice

case $choice in
    1)
        SENDER="Maria Silva"
        MESSAGE="QUERO SABER MAIS! Como funciona?"
        ;;
    2)
        SENDER="João Santos"
        MESSAGE="Quanto custa um site?"
        ;;
    3)
        SENDER="Ana Costa"
        MESSAGE="Vocês trabalham com que tipo de negócio?"
        ;;
    4)
        SENDER="Pedro Lima"
        MESSAGE="Boa noite! Tudo bem?"
        ;;
    5)
        SENDER="Lucia Ferreira"
        MESSAGE="Olá! Vi sobre automação com IA. Tenho interesse!"
        ;;
    6)
        echo ""
        read -p "Número do remetente (ex: 5581999999999): " sender_phone
        read -p "Nome do remetente: " sender_name
        read -p "Mensagem: " custom_msg
        
        SENDER="$sender_name"
        MESSAGE="$custom_msg"
        
        # Enviar mensagem real
        echo ""
        echo "📤 Enviando mensagem real..."
        
        # Nota: Isso não funcionará porque o grupo só recebe mensagens de membros
        echo -e "${YELLOW}⚠️  Nota: Para enviar mensagem real, você precisa de outro número no grupo${NC}"
        echo ""
        ;;
    *)
        echo -e "${RED}❌ Opção inválida${NC}"
        exit 1
        ;;
esac

echo ""
echo "3️⃣  Simulando mensagem..."
echo ""
echo -e "${CYAN}👤 Remetente: ${SENDER}${NC}"
echo -e "${CYAN}💬 Mensagem: ${MESSAGE}${NC}"
echo ""

# Criar script Node.js para simular
cat > /tmp/simulate_message.js << EOF
require('dotenv').config({ path: '/home/othui/Área de trabalho/agente-prospect/business-leads-ai-automation/.env' });

const AutoResponder = require('/home/othui/Área de trabalho/agente-prospect/business-leads-ai-automation/src/autoResponder');

async function simulate() {
    const responder = new AutoResponder();
    
    const mockMessage = {
        key: {
            id: 'sim_' + Date.now(),
            remoteJid: process.env.TARGET_GROUP_ID,
            fromMe: false
        },
        pushName: '${SENDER}',
        message: {
            conversation: '${MESSAGE}'
        },
        fromMe: false
    };
    
    console.log('🤖 Processando mensagem simulada...');
    await responder.processGroupMessage(mockMessage);
    
    console.log('');
    console.log('✅ Mensagem processada!');
}

simulate();
EOF

# Executar simulação
node /tmp/simulate_message.js

# Limpar
rm /tmp/simulate_message.js

echo ""
echo "===================================="
echo "✅ Teste concluído!"
echo ""
echo "📋 Para ver as respostas:"
echo "   cat /tmp/auto-responder.log"
echo ""
echo "💡 Para testar com número real:"
echo "   1. Peça para alguém com outro número entre no grupo"
echo "   2. Ou crie um grupo de teste com 2 números"
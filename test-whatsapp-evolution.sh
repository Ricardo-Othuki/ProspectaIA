#!/bin/bash

# Teste do WhatsApp via Evolution API
echo "📱 Teste WhatsApp via Evolution API"
echo "==================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Carregar variáveis
source .env

# Verificar configuração
echo "1️⃣  Verificando configuração..."
echo ""

if [ -z "$EVOLUTION_API_URL" ] || [ "$EVOLUTION_API_URL" = "https://evo.othuki.com.br" ]; then
    echo -e "${RED}❌ EVOLUTION_API_URL não configurada${NC}"
    echo "   Edite o arquivo .env com a URL da sua Evolution API"
    exit 1
fi

if [ -z "$EVOLUTION_API_KEY" ] || [ "$EVOLUTION_API_KEY" = "sua_api_key_aqui" ]; then
    echo -e "${RED}❌ EVOLUTION_API_KEY não configurada${NC}"
    echo "   Edite o arquivo .env com sua API Key"
    exit 1
fi

echo -e "${GREEN}✅ Configuração encontrada${NC}"
echo "   📍 URL: $EVOLUTION_API_URL"
echo "   📦 Instância: $EVOLUTION_INSTANCE_NAME"
echo "   🔑 API Key: ${EVOLUTION_API_KEY:0:10}..."
echo ""

# Verificar status da instância
echo "2️⃣  Verificando status da instância..."
echo ""

STATUS_RESPONSE=$(curl -s -X GET "$EVOLUTION_API_URL/instance/connectionState/$EVOLUTION_INSTANCE_NAME" \
    -H "Content-Type: application/json" \
    -H "apikey: $EVOLUTION_API_KEY" 2>/dev/null)

if echo "$STATUS_RESPONSE" | grep -q '"state"'; then
    STATE=$(echo "$STATUS_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('state', 'unknown'))" 2>/dev/null)
    echo -e "${GREEN}✅ Instância conectada: ${STATE}${NC}"
else
    echo -e "${YELLOW}⚠️  Não foi possível verificar status${NC}"
    echo "   Response: $STATUS_RESPONSE"
fi
echo ""

# Listar grupos disponíveis
echo "3️⃣  Buscando grupos disponíveis..."
echo ""

GROUPS_RESPONSE=$(curl -s -X GET "$EVOLUTION_API_URL/group/fetchAllGroups/$EVOLUTION_INSTANCE_NAME" \
    -H "Content-Type: application/json" \
    -H "apikey: $EVOLUTION_API_KEY" 2>/dev/null)

if echo "$GROUPS_RESPONSE" | grep -q '\['; then
    echo -e "${GREEN}✅ Grupos encontrados:${NC}"
    echo ""
    echo "$GROUPS_RESPONSE" | python3 -c "
import sys, json
try:
    groups = json.load(sys.stdin)
    for i, group in enumerate(groups[:10], 1):
        name = group.get('subject', group.get('name', 'Sem nome'))
        id = group.get('id', 'N/A')
        members = group.get('size', group.get('participants', 0))
        print(f'   {i}. {name}')
        print(f'      ID: {id}')
        print(f'      Membros: {members}')
        print()
except:
    print('   Erro ao processar grupos')
" 2>/dev/null
else
    echo -e "${YELLOW}⚠️  Nenhum grupo encontrado ou erro na consulta${NC}"
fi
echo ""

# Opções de teste
echo "4️�️  Opções de teste:"
echo ""
echo -e "${CYAN}1. Enviar mensagem de teste para grupo${NC}"
echo -e "${CYAN}2. Enviar mensagem de teste para contato${NC}"
echo -e "${CYAN}3. Testar agente de prospecção${NC}"
echo ""

read -p "Escolha uma opção (1-3): " choice

case $choice in
    1)
        echo ""
        echo "📋 Lista de grupos:"
        echo "$GROUPS_RESPONSE" | python3 -c "
import sys, json
try:
    groups = json.load(sys.stdin)
    for i, group in enumerate(groups[:10], 1):
        name = group.get('subject', group.get('name', 'Sem nome'))
        print(f'   {i}. {name}')
except:
    print('   Erro ao processar grupos')
" 2>/dev/null
        
        echo ""
        read -p "Número do grupo: " group_num
        read -p "Mensagem: " message
        
        # Enviar mensagem
        echo ""
        echo "📤 Enviando mensagem..."
        
        GROUP_ID=$(echo "$GROUPS_RESPONSE" | python3 -c "
import sys, json
groups = json.load(sys.stdin)
idx = int('$group_num') - 1
print(groups[idx].get('id', ''))
" 2>/dev/null)
        
        if [ -n "$GROUP_ID" ]; then
            SEND_RESPONSE=$(curl -s -X POST "$EVOLUTION_API_URL/message/sendText/$EVOLUTION_INSTANCE_NAME" \
                -H "Content-Type: application/json" \
                -H "apikey: $EVOLUTION_API_KEY" \
                -d "{\"number\":\"$GROUP_ID\",\"text\":\"$message\"}")
            
            if echo "$SEND_RESPONSE" | grep -q '"key"'; then
                echo -e "${GREEN}✅ Mensagem enviada com sucesso!${NC}"
            else
                echo -e "${RED}❌ Erro ao enviar mensagem${NC}"
                echo "$SEND_RESPONSE"
            fi
        fi
        ;;
        
    2)
        echo ""
        read -p "Número do contato (ex: 5581999999999): " phone
        read -p "Mensagem: " message
        
        echo ""
        echo "📤 Enviando mensagem..."
        
        SEND_RESPONSE=$(curl -s -X POST "$EVOLUTION_API_URL/message/sendText/$EVOLUTION_INSTANCE_NAME" \
            -H "Content-Type: application/json" \
            -H "apikey: $EVOLUTION_API_KEY" \
            -d "{\"number\":\"$phone\",\"text\":\"$message\"}")
        
        if echo "$SEND_RESPONSE" | grep -q '"key"'; then
            echo -e "${GREEN}✅ Mensagem enviada com sucesso!${NC}"
        else
            echo -e "${RED}❌ Erro ao enviar mensagem${NC}"
            echo "$SEND_RESPONSE"
        fi
        ;;
        
    3)
        echo ""
        echo "🤖 Iniciando teste do agente..."
        echo ""
        
        # Executar teste do agente
        ./testar-agente-real.sh
        ;;
        
    *)
        echo -e "${RED}❌ Opção inválida${NC}"
        ;;
esac

echo ""
echo "================================"
echo "✅ Teste concluído!"
echo ""
echo "📚 Para mais opções, consulte:"
echo "   curl -H 'apikey: $EVOLUTION_API_KEY' $EVOLUTION_API_URL/instance/fetchInstances"
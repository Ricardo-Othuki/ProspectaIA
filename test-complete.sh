#!/bin/bash

# Script completo de teste do Google Gemini
echo "🧪 Teste Completo - Google Gemini"
echo "================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para testar
test_gemini() {
    echo "📋 Verificando configuração..."
    echo ""
    
    # Verificar .env
    if [ ! -f ".env" ]; then
        echo -e "${RED}❌ Arquivo .env não encontrado${NC}"
        return 1
    fi
    
    # Carregar variáveis
    source .env
    
    # Verificar chave
    if [ -z "$GEMINI_API_KEY" ] || [ "$GEMINI_API_KEY" = "your-gemini-api-key-here" ]; then
        echo -e "${RED}❌ Chave de API não configurada${NC}"
        echo "Execute: ./configure-api.sh"
        return 1
    fi
    
    echo -e "${GREEN}✅ Chave de API configurada${NC}"
    echo "   Modelo: $OPENAI_MODEL"
    echo "   Endpoint: $OPENAI_BASE_URL"
    echo ""
    
    # Testar conexão
    echo "📡 Testando conexão com Google Gemini..."
    echo ""
    
    node test-gemini-connection.js
    
    return $?
}

# Executar teste
test_gemini

# Mostrar próximos passos se sucesso
if [ $? -eq 0 ]; then
    echo ""
    echo "================================"
    echo "🚀 PRÓXIMOS PASSOS"
    echo "================================"
    echo ""
    echo "1. Configure o perfil do negócio:"
    echo "   npm run setup"
    echo ""
    echo "2. Inicie o dashboard web:"
    echo "   npm run web"
    echo ""
    echo "3. Acesse:"
    echo "   http://localhost:3000"
    echo ""
    echo "4. Ou use a linha de comando:"
    echo "   node index.js -q \"Restaurante São Paulo\" -l 10"
    echo ""
    echo "📚 Documentação: README_PORTUGUESE.md"
    echo ""
fi
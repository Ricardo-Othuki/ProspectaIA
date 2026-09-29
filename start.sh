#!/bin/bash

# Script de inicialização rápido para Business Leads AI Automation
# Este script ajuda você a começar rapidamente

echo "🚀 Business Leads AI Automation - Início Rápido"
echo "================================================"
echo ""

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js 16+ primeiro."
    echo "   Visite: https://nodejs.org/"
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Versão do Node.js muito antiga. Versão 16+ é necessária."
    echo "   Versão atual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"
echo ""

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
    echo ""
fi

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    echo "⚙️  Configuração inicial necessária"
    echo "Configure o Google Gemini (gratuito):"
    echo ""
    echo "   ./configure-api.sh"
    echo ""
    echo "Ou manualmente:"
    echo "   cp .env.example .env"
    echo "   # Edite o arquivo .env com sua chave de API Google Gemini"
    echo ""
else
    echo "✅ Arquivo .env encontrado"
    
    # Verificar se a chave de API está configurada
    if grep -q "your-gemini-api-key-here" .env; then
        echo "⚠️  Chave de API Google Gemini não configurada"
        echo "   Execute: ./configure-api.sh"
        echo "   Ou edite o arquivo .env"
    else
        echo "✅ Chave de API Google Gemini configurada"
    fi
fi

echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Configure o assistente (se ainda não fez):"
echo "   npm run setup"
echo ""
echo "2. Inicie o dashboard web:"
echo "   npm run web"
echo ""
echo "3. Acesse no navegador:"
echo "   http://localhost:3000"
echo ""
echo "4. Ou use a linha de comando:"
echo "   node index.js -q \"Restaurante São Paulo\" -l 10"
echo ""
echo "📚 Documentação completa: README_PORTUGUESE.md"
echo ""
echo "🎉 Pronto para gerar leads!"
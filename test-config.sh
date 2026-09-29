#!/bin/bash

# Script de teste rápido para Business Leads AI Automation
# Verifica se a configuração está correta

echo "🧪 Teste de Configuração - Business Leads AI Automation"
echo "======================================================"
echo ""

# Verificar Node.js
echo "1. Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "   ✅ Node.js $NODE_VERSION detectado"
else
    echo "   ❌ Node.js não encontrado"
    exit 1
fi

# Verificar npm
echo ""
echo "2. Verificando npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "   ✅ npm $NPM_VERSION detectado"
else
    echo "   ❌ npm não encontrado"
    exit 1
fi

# Verificar dependências
echo ""
echo "3. Verificando dependências..."
if [ -d "node_modules" ]; then
    echo "   ✅ Dependências instaladas"
else
    echo "   ⚠️  Dependências não instaladas"
    echo "   Execute: npm install"
fi

# Verificar arquivo .env
echo ""
echo "4. Verificando configuração..."
if [ -f ".env" ]; then
    echo "   ✅ Arquivo .env encontrado"
    
    # Verificar chave de API
    if grep -q "your-gemini-api-key-here" .env; then
        echo "   ⚠️  Chave de API Google Gemini não configurada"
        echo "   Execute: ./configure-api.sh"
    else
        echo "   ✅ Chave de API Google Gemini configurada"
    fi
else
    echo "   ❌ Arquivo .env não encontrado"
    echo "   Execute: cp .env.example .env"
fi

# Verificar business-profile.json
echo ""
echo "5. Verificando perfil do negócio..."
if [ -f "business-profile.json" ]; then
    echo "   ✅ Perfil do negócio encontrado"
else
    echo "   ⚠️  Perfil do negócio não encontrado"
    echo "   Execute: npm run setup"
fi

# Verificar se o puppeteer está instalado
echo ""
echo "6. Verificando Puppeteer..."
if [ -d "node_modules/puppeteer" ]; then
    echo "   ✅ Puppeteer instalado"
else
    echo "   ⚠️  Puppeteer não instalado"
    echo "   Execute: npm install puppeteer"
fi

echo ""
echo "======================================================"
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
echo "📖 Guia de prospecção: GUIA_PROSPECACAO.md"
echo ""
echo "🎉 Pronto para gerar leads!"
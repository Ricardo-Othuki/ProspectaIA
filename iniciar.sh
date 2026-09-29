#!/bin/bash

# Script para iniciar o Business Leads AI
echo "🚀 Iniciando Business Leads AI..."
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale: https://nodejs.org/"
    exit 1
fi

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
    echo ""
fi

# Verificar se o Gemini está funcionando
echo "🔍 Verificando IA (Google Gemini)..."
if ! node test-gemini-connection.js 2>/dev/null; then
    echo ""
    echo "⚠️  IA não configurada. Execute: ./configure-api.sh"
    exit 1
fi

echo ""
echo "✅ Tudo pronto!"
echo ""
echo "📊 Iniciando dashboard web..."
echo "   Acesse: http://localhost:3001"
echo ""
echo "   Para parar: Ctrl+C"
echo ""

# Iniciar na porta 3001
WEB_PORT=3001 node src/web/server.js
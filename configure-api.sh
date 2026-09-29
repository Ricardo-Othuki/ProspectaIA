#!/bin/bash

# Script para configurar rapidamente o Google Gemini (gratuito)
# Uso: ./configure-api.sh

echo "🔑 Configuração do Google Gemini (Gratuito)"
echo "==========================================="
echo ""

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado"
    echo "Execute primeiro o setup do projeto"
    exit 1
fi

echo "📋 O Google Gemini oferece tier gratuito generoso:"
echo "   - 15 requisições por minuto"
echo "   - 1 milhão de tokens por dia"
echo "   - Sem custos para uso básico"
echo ""
echo "🔗 Obtenha sua chave gratuita em:"
echo "   https://aistudio.google.com/apikey"
echo ""
echo "⚠️  IMPORTANTE: Crie uma API Key (não OAuth)"
echo ""

# Solicitar a chave de API
read -p "Cole sua Gemini API Key: " API_KEY

# Validar a chave
if [ -z "$API_KEY" ]; then
    echo "❌ Chave de API não pode estar vazia"
    exit 1
fi

# Atualizar o arquivo .env
echo ""
echo "⚙️  Atualizando configuração..."

# Usar sed para substituir as chaves de API
sed -i "s/GEMINI_API_KEY=.*/GEMINI_API_KEY=$API_KEY/" .env
sed -i "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$API_KEY/" .env

# Verificar se a substituição foi bem-sucedida
if grep -q "GEMINI_API_KEY=$API_KEY" .env; then
    echo "✅ Chave do Google Gemini configurada com sucesso!"
else
    echo "❌ Erro ao configurar a chave de API"
    exit 1
fi

echo ""
echo "🎉 Configuração concluída!"
echo ""
echo "📋 Configuração atual:"
echo "   - Provedor: Google Gemini (Gratuito)"
echo "   - Modelo: gemini-1.5-flash"
echo "   - Endpoint: https://generativelanguage.googleapis.com/v1beta/openai/"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Configure o perfil do negócio:"
echo "   npm run setup"
echo ""
echo "2. Ou edite manualmente business-profile.json"
echo ""
echo "3. Inicie o dashboard web:"
echo "   npm run web"
echo ""
echo "4. Acesse: http://localhost:3000"
echo ""
echo "📚 Documentação: README_PORTUGUESE.md"
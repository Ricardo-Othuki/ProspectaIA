#!/bin/bash

# Script para testar uma campanha rápida
echo "🎯 Teste Rápido - Geração de Leads"
echo "=================================="
echo ""

# Verificar se o Gemini está funcionando
echo "🔍 Verificando IA..."
if ! node test-gemini-connection.js 2>/dev/null; then
    echo ""
    echo "❌ IA não configurada. Execute: ./configure-api.sh"
    exit 1
fi

echo ""
echo "📋 Configuração atual:"
echo "   - Empresa: $(node -e "const p = require('./business-profile.json'); console.log(p.business.name)")
echo "   - Idioma: $(node -e "const p = require('./business-profile.json'); console.log(p.preferences.language)")
echo "   - Estilo: $(node -e "const p = require('./business-profile.json'); console.log(p.preferences.campaignStyle)")
echo ""

echo "🚀 Executando campanha de teste..."
echo "   Busca: Restaurante São Paulo"
echo "   Limite: 3 leads"
echo ""

# Executar campanha de teste
node index.js -q "Restaurante São Paulo" -l 3 -m "Olá! Vi que vocês têm ótimas avaliações no Google. Posso ajudar com marketing digital para aumentar ainda mais suas vendas?"

echo ""
echo "✅ Campanha concluída!"
echo ""
echo "📁 Resultados salvos em: output/"
echo ""
echo "💡 Para ver os resultados:"
echo "   ls output/"
echo ""
echo "📊 Para ver no dashboard web:"
echo "   ./iniciar.sh"
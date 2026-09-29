#!/bin/bash

# Script de teste para verificar se o Google Gemini está funcionando
echo "🧪 Teste de Conexão com Google Gemini"
echo "===================================="
echo ""

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado"
    exit 1
fi

# Carregar variáveis de ambiente
source .env

# Verificar se a chave de API está configurada
if [ -z "$GEMINI_API_KEY" ] || [ "$GEMINI_API_KEY" = "your-gemini-api-key-here" ]; then
    echo "❌ Chave de API Gemini não configurada"
    echo "Execute: ./configure-api.sh"
    exit 1
fi

echo "✅ Chave de API encontrada"
echo "🔗 Endpoint: $OPENAI_BASE_URL"
echo "🤖 Modelo: $OPENAI_MODEL"
echo ""

# Criar script de teste Node.js
cat > /tmp/test_gemini.js << 'EOF'
require('dotenv').config({ path: '/home/othui/Área de trabalho/agente-prospect/business-leads-ai-automation/.env' });

async function testGemini() {
    try {
        console.log('📡 Conectando ao Google Gemini...');
        
        const OpenAI = require('openai');
        
        const client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_BASE_URL
        });
        
        console.log('📝 Enviando mensagem de teste...');
        
        const completion = await client.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gemini-1.5-flash',
            messages: [
                {
                    role: 'user',
                    content: 'Olá! Responda apenas com "Gemini funcionando!" para confirmar que está operacional.'
                }
            ],
            max_tokens: 50,
            temperature: 0.7
        });
        
        const response = completion.choices[0].message.content;
        
        console.log('');
        console.log('✅ SUCESSO! Google Gemini está funcionando!');
        console.log('💬 Resposta:', response);
        console.log('');
        console.log('📊 Detalhes da requisição:');
        console.log('   - Modelo:', process.env.OPENAI_MODEL);
        console.log('   - Tokens usados:', completion.usage?.total_tokens || 'N/A');
        console.log('');
        console.log('🎉 Sistema pronto para gerar leads!');
        
        return true;
    } catch (error) {
        console.log('');
        console.log('❌ ERRO ao conectar com Google Gemini');
        console.log('');
        console.log('📋 Detalhes do erro:');
        console.log('   ', error.message);
        
        if (error.message.includes('API key not valid')) {
            console.log('');
            console.log('💡 SOLUÇÃO: Chave de API inválida');
            console.log('   1. Acesse: https://aistudio.google.com/apikey');
            console.log('   2. Clique em "Create API Key"');
            console.log('   3. Copie a chave (formato: AIzaSy...)');
            console.log('   4. Execute: ./configure-api.sh');
        } else if (error.message.includes('quota')) {
            console.log('');
            console.log('💡 SOLUÇÃO: Limite de quota atingido');
            console.log('   - Aguarde 24 horas ou');
            console.log('   - Use outro modelo');
        } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
            console.log('');
            console.log('💡 SOLUÇÃO: Erro de conexão');
            console.log('   - Verifique sua conexão com a internet');
        }
        
        return false;
    }
}

testGemini();
EOF

# Executar o teste
node /tmp/test_gemini.js

# Limpar arquivo temporário
rm /tmp/test_gemini.js
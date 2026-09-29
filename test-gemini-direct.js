require('dotenv').config();

async function testGeminiDirect() {
    try {
        console.log('📡 Testando Google Gemini API diretamente...');
        console.log('');
        
        const apiKey = process.env.GEMINI_API_KEY;
        const model = process.env.OPENAI_MODEL || 'gemini-2.5-flash';
        
        console.log('🔑 Chave de API:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NÃO CONFIGURADA');
        console.log('🤖 Modelo:', model);
        console.log('');
        
        // Usar a API REST do Gemini diretamente
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: 'Olá! Responda apenas com "Gemini funcionando!" para confirmar que está operacional.'
                }]
            }]
        };
        
        console.log('📝 Enviando requisição...');
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            console.log('');
            console.log('❌ ERRO na requisição:', response.status);
            
            if (data.error) {
                console.log('📋 Mensagem:', data.error.message);
                
                if (data.error.message.includes('API key not valid')) {
                    console.log('');
                    console.log('💡 SOLUÇÃO: Chave de API inválida');
                    console.log('   1. Acesse: https://aistudio.google.com/apikey');
                    console.log('   2. Clique em "Create API Key"');
                    console.log('   3. Copie a chave (formato: AIzaSy...)');
                    console.log('   4. Execute: ./configure-api.sh');
                } else if (data.error.message.includes('quota')) {
                    console.log('');
                    console.log('💡 SOLUÇÃO: Limite de quota atingido');
                }
            }
            
            return false;
        }
        
        // Extrair resposta
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (text) {
            console.log('');
            console.log('✅ SUCESSO! Google Gemini está funcionando!');
            console.log('💬 Resposta:', text);
            console.log('');
            console.log('🎉 Sistema pronto para gerar leads!');
            return true;
        } else {
            console.log('');
            console.log('❌ Resposta vazia do Gemini');
            console.log('📋 Dados:', JSON.stringify(data, null, 2));
            return false;
        }
        
    } catch (error) {
        console.log('');
        console.log('❌ ERRO ao conectar com Google Gemini');
        console.log('📋 Erro:', error.message);
        
        if (error.message.includes('fetch is not defined')) {
            console.log('');
            console.log('💡 SOLUÇÃO: Node.js versão antiga');
            console.log('   - Atualize para Node.js 18+');
        }
        
        return false;
    }
}

testGeminiDirect();
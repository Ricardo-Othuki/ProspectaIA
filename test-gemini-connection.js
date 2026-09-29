require('dotenv').config();

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
        
        if (error.message.includes('API key not valid') || error.message.includes('invalid')) {
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
require('dotenv').config();

async function testGeminiModels() {
    try {
        console.log('📡 Listando modelos disponíveis no Google Gemini...');
        console.log('');
        
        const apiKey = process.env.GEMINI_API_KEY;
        
        console.log('🔑 Chave de API:', apiKey ? `${apiKey.substring(0, 15)}...` : 'NÃO CONFIGURADA');
        console.log('');
        
        // Listar modelos disponíveis
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        
        console.log('📝 Consultando modelos disponíveis...');
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
            console.log('');
            console.log('❌ ERRO ao listar modelos:', response.status);
            
            if (data.error) {
                console.log('📋 Mensagem:', data.error.message);
                
                if (data.error.message.includes('API key not valid')) {
                    console.log('');
                    console.log('⚠️  PROBLEMA IDENTIFICADO: Chave de API inválida');
                    console.log('');
                    console.log('💡 A chave atual parece ser um token OAuth (começa com "AQ.")');
                    console.log('   Chaves de API do Google Gemini devem começar com "AIzaSy"');
                    console.log('');
                    console.log('🔧 COMO CORRIGIR:');
                    console.log('   1. Acesse: https://aistudio.google.com/apikey');
                    console.log('   2. Faça login com sua conta Google');
                    console.log('   3. Clique em "Create API Key"');
                    console.log('   4. Selecione um projeto (ou crie um novo)');
                    console.log('   5. Copie a chave gerada (formato: AIzaSy...)');
                    console.log('   6. Execute: ./configure-api.sh');
                }
            }
            
            return false;
        }
        
        // Listar modelos
        console.log('✅ Modelos disponíveis:');
        console.log('');
        
        if (data.models && data.models.length > 0) {
            data.models.forEach(model => {
                console.log(`   - ${model.name}`);
                if (model.supportedGenerationMethods?.includes('generateContent')) {
                    console.log('     ✅ Suporta generateContent');
                }
            });
            
            // Verificar se gemini-1.5-flash está na lista
            const flashModel = data.models.find(m => m.name.includes('gemini-1.5-flash'));
            if (flashModel) {
                console.log('');
                console.log('✅ Modelo gemini-1.5-flash está disponível!');
            } else {
                console.log('');
                console.log('⚠️  Modelo gemini-1.5-flash não encontrado na lista');
                console.log('   Use um dos modelos listados acima');
            }
        } else {
            console.log('   Nenhum modelo encontrado');
        }
        
        return true;
        
    } catch (error) {
        console.log('');
        console.log('❌ ERRO ao listar modelos');
        console.log('📋 Erro:', error.message);
        return false;
    }
}

testGeminiModels();
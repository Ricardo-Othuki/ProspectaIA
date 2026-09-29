require('dotenv').config();
const axios = require('axios');

async function test() {
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;
    const instance = process.env.EVOLUTION_INSTANCE_NAME;
    const groupId = process.env.TARGET_GROUP_ID;
    
    console.log('🧪 Testando envio de mensagem para grupo...\n');
    
    const message = `🤖 *Resposta Automática Othuki*\n\nOlá Maria Silva! 👋\n\nFicou feliz com seu interesse em automação com IA!\n\nComo funciona:\n1️⃣ Criamos um agente IA personalizado para seu negócio\n2️⃣ Ele atende seus clientes 24/7 via WhatsApp\n3️⃣ Qualifica leads e agenda reuniões automaticamente\n\nQuer agendar uma reunião rápida de 15 min para te mostrar como funciona?\n\nResponda "QUERO AGENDAR"! 📅\n\nEquipe Othuki 🚀`;
    
    console.log('📤 Enviando resposta...');
    console.log('');
    
    try {
        const response = await axios.post(
            `${evolutionUrl}/message/sendText/${instance}`,
            {
                number: groupId,
                text: message
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': apiKey
                }
            }
        );
        
        if (response.data?.key) {
            console.log('✅ Resposta enviada com sucesso!');
            console.log(`📋 Message ID: ${response.data.key.id}`);
        } else {
            console.log('❌ Resposta inesperada:', response.data);
        }
    } catch (error) {
        console.log('❌ Erro:', error.message);
        if (error.response) {
            console.log('📋 Response:', error.response.data);
        }
    }
}

test();

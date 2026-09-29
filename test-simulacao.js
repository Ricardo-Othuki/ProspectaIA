require('dotenv').config();

const AutoResponder = require('./src/autoResponder');

async function test() {
    const responder = new AutoResponder();
    
    console.log('🧪 Testando Auto Responder...\n');
    
    // Simular mensagem de alguém com interesse
    const mockMessage = {
        key: {
            id: 'test_' + Date.now(),
            remoteJid: process.env.TARGET_GROUP_ID,
            fromMe: false
        },
        pushName: 'Maria Silva',
        message: {
            conversation: 'Olá! Tenho interesse em automação com IA. Como funciona?'
        },
        fromMe: false
    };
    
    console.log('👤 Simulando: Maria Silva');
    console.log('💬 Mensagem: Olá! Tenho interesse em automação com IA. Como funciona?');
    console.log('');
    
    await responder.processGroupMessage(mockMessage);
    
    console.log('');
    console.log('✅ Teste concluído!');
}

test().catch(console.error);

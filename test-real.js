require('dotenv').config();
const AutoResponder = require('./src/autoResponder');

async function test() {
    const responder = new AutoResponder();
    
    console.log('🚀 Teste de Prospecção Real no Grupo\n');
    console.log('📍 Grupo:', process.env.TARGET_GROUP_ID);
    console.log('');
    
    // Simular 3 personas diferentes respondendo
    const testCases = [
        {
            name: 'Carlos Empreendedor',
            message: 'Boa noite! Vi sobre automação com IA. Tenho uma loja online e quero saber mais!'
        },
        {
            name: 'Ana Marketing',
            message: 'Quanto custa para automatizar o atendimento do WhatsApp?'
        },
        {
            name: 'Pedro Dev',
            message: 'Vocês trabalham com integração de sistemas? Tenho interesse!'
        }
    ];
    
    for (const test of testCases) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`👤 Simulando: ${test.name}`);
        console.log(`💬 Mensagem: ${test.message}`);
        console.log(`${'='.repeat(50)}\n`);
        
        const mockMessage = {
            key: {
                id: 'test_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                remoteJid: process.env.TARGET_GROUP_ID,
                fromMe: false
            },
            pushName: test.name,
            message: {
                conversation: test.message
            },
            fromMe: false
        };
        
        await responder.processGroupMessage(mockMessage);
        
        // Aguardar 2 segundos entre mensagens
        await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log('\n\n✅ Todos os testes executados!');
    console.log('📊 Verifique o grupo no WhatsApp para ver as respostas.');
}

test().catch(console.error);

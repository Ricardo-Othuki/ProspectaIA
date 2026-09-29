require('dotenv').config();

async function testAgent() {
    try {
        console.log('🤖 Inicializando agente...');
        
        const LeadAgent = require('./src/leadAgent');
        const agent = new LeadAgent();
        
        // Lead de teste
        const testLead = {
            id: 999,
            name: "Restaurante Teste",
            phone: "+5581999999999",
            rating: 4.5,
            website: "https://restaurante-teste.com.br"
        };
        
        console.log(`\n📋 Lead de teste: ${testLead.name}`);
        console.log(`📞 Telefone: ${testLead.phone}`);
        console.log(`⭐ Avaliação: ${testLead.rating}`);
        console.log('');
        
        // Iniciar contato
        console.log('📱 Enviando primeira mensagem...');
        const conversation = await agent.startOutreach(testLead, 'balanced');
        
        console.log('\n✅ Contato iniciado!');
        console.log(`📊 Status: ${conversation.status}`);
        console.log(`💬 Mensagens: ${conversation.messages.length}`);
        
        // Mostrar primeira mensagem
        if (conversation.messages.length > 0) {
            console.log('\n📝 Primeira mensagem:');
            console.log('---');
            console.log(conversation.messages[0].content);
            console.log('---');
        }
        
        // Simular resposta positiva
        console.log('\n📩 Simulando resposta do lead...');
        const result = await agent.processLeadResponse(999, "Olá, interesse! Podemos agendar uma reunião?");
        
        console.log('\n✅ Resposta processada!');
        console.log(`🎯 Intenção: ${result.intent}`);
        console.log(`💬 Resposta do agente:`);
        console.log('---');
        console.log(result.response);
        console.log('---');
        
        if (result.meetingLink) {
            console.log(`\n📅 Link da reunião: ${result.meetingLink}`);
        }
        
        // Mostrar status das conversas
        console.log('\n📊 Status das conversas:');
        const status = agent.getConversationsStatus();
        console.log(`   Total: ${status.total}`);
        console.log(`   Em andamento: ${status.engaged + status.scheduling}`);
        console.log(`   Finalizadas: ${status.completed}`);
        
        console.log('\n✅ Teste concluído com sucesso!');
        
    } catch (error) {
        console.error('\n❌ Erro no teste:', error.message);
        console.error(error.stack);
    }
}

testAgent();
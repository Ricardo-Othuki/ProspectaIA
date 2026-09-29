require('dotenv').config();
const AutoResponder = require('./src/autoResponder');
const axios = require('axios');

async function testeCompleto() {
    const responder = new AutoResponder();
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;
    const instance = process.env.EVOLUTION_INSTANCE_NAME;
    const groupId = process.env.TARGET_GROUP_ID;
    
    console.log('🚀 TESTE COMPLETO DE PROSPECÇÃO NO GRUPO\n');
    console.log('📍 Grupo:', groupId);
    console.log('🤖 Agente: Othuki IA');
    console.log('🧠 Modelo: Google Gemini 2.5 Flash\n');
    
    // Mensagem inicial
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📨 ETAPA 1: Enviando mensagem inicial de prospecção');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const initialMsg = `🚀 *Olá pessoal! 👋*

Sou a Equipe da *Othuki Agência Digital*! 

Estamos aqui para mostrar como a *Inteligência Artificial* pode transformar seu negócio!

✅ *O que fazemos:*
• Sites que convertem visitantes em clientes
• Atendimento automático 24/7 com IA
• Tráfego pago com resultado comprovado

🎯 *Oferta especial:*
📊 *Análise GRATUITA* do seu negócio digital!

💬 *Quer saber mais?*
Basta responder aqui no grupo ou me chamar no privado!

Estamos prontos para ajudar! 😊`;

    try {
        const response1 = await axios.post(
            `${evolutionUrl}/message/sendText/${instance}`,
            { number: groupId, text: initialMsg },
            { headers: { 'Content-Type': 'application/json', 'apikey': apiKey } }
        );
        console.log('✅ Mensagem inicial enviada!');
        console.log('🆔 ID:', response1.data?.key?.id);
    } catch (error) {
        console.log('❌ Erro:', error.message);
    }
    
    // Aguardar 3 segundos
    await new Promise(r => setTimeout(r, 3000));
    
    // Simular respostas de personas
    const personas = [
        {
            name: 'Rafael Souza',
            message: 'Oi! Tenho uma loja de roupas e quero vender mais online. Como vocês podem ajudar?',
            delay: 4000
        },
        {
            name: 'Mariana Costa',
            message: 'Quanto custa um site profissional? Vocês fazem parcelamento?',
            delay: 5000
        },
        {
            name: 'Lucas Oliveira',
            message: 'Já tive experiência ruim com agências. O que é diferente na Othuki?',
            delay: 6000
        }
    ];
    
    for (const persona of personas) {
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log(`👤 Simulando: ${persona.name}`);
        console.log(`💬 Mensagem: "${persona.message}"`);
        console.log('═══════════════════════════════════════════════════════════════\n');
        
        const mockMessage = {
            key: {
                id: 'test_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                remoteJid: groupId,
                fromMe: false
            },
            pushName: persona.name,
            message: { conversation: persona.message },
            fromMe: false
        };
        
        await responder.processGroupMessage(mockMessage);
        await new Promise(r => setTimeout(r, persona.delay));
    }
    
    // Mensagem de encerramento
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const summaryMsg = `✅ *Teste de Prospecção Concluído!*

🤖 *Resumo do que aconteceu:*

1️⃣ Mensagem inicial enviada para o grupo
2️⃣ 3 personas diferentes responderam
3️⃣ Agente IA respondeu automaticamente cada uma

🎯 *Funcionalidades testadas:*
• Respostas personalizadas com IA
• Análise de intenção do lead
• Conduta para agendamento

📋 *Próximo passo:*
Quando alguém real responder no grupo, o agente entrará em ação automaticamente!

Equipe Othuki 🚀`;

    try {
        await axios.post(
            `${evolutionUrl}/message/sendText/${instance}`,
            { number: groupId, text: summaryMsg },
            { headers: { 'Content-Type': 'application/json', 'apikey': apiKey } }
        );
        console.log('✅ Mensagem de resumo enviada!');
    } catch (error) {
        console.log('❌ Erro ao enviar resumo:', error.message);
    }
    
    console.log('\n🎯 Verifique o grupo no WhatsApp para ver todas as interações!');
}

testeCompleto().catch(console.error);

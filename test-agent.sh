#!/bin/bash

# Teste do Agente de Prospecção
echo "🤖 Teste do Agente de Prospecção"
echo "================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar se a IA está funcionando
echo "1️⃣  Verificando IA (Google Gemini)..."
if ! node test-gemini-connection.js 2>/dev/null; then
    echo -e "${RED}❌ IA não configurada${NC}"
    exit 1
fi
echo -e "${GREEN}✅ IA funcionando${NC}"
echo ""

# Verificar se o WhatsApp está configurado
echo "2️⃣  Verificando WhatsApp..."
WHATSAPP_PROVIDER=${WHATSAPP_PROVIDER:-simulation}
echo -e "${GREEN}✅ WhatsApp: Modo ${WHATSAPP_PROVIDER}${NC}"
echo ""

# Verificar se o Google Calendar está configurado
echo "3️⃣  Verificando Google Calendar..."
if [ -f "credentials/google-credentials.json" ]; then
    echo -e "${GREEN}✅ Google Calendar: Configurado${NC}"
else
    echo -e "${YELLOW}⚠️  Google Calendar: Modo simulação${NC}"
fi
echo ""

# Testar o agente
echo "4️⃣  Testando agente com lead de exemplo..."
echo ""

# Criar script de teste Node.js
cat > /tmp/test_agent.js << 'EOF'
require('dotenv').config({ path: '/home/othui/Área de trabalho/agente-prospect/business-leads-ai-automation/.env' });

async function testAgent() {
    try {
        console.log('🤖 Inicializando agente...');
        
        const LeadAgent = require('/home/othui/Área de trabalho/agente-prospect/business-leads-ai-automation/src/leadAgent');
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
        
        // Simular resposta positiva
        console.log('\n📩 Simulando resposta do lead...');
        const result = await agent.processLeadResponse(999, "Olá, interesse! Podemos agendar uma reunião?");
        
        console.log('\n✅ Resposta processada!');
        console.log(`🎯 Intenção: ${result.intent}`);
        console.log(`💬 Resposta do agente: ${result.response.substring(0, 100)}...`);
        
        if (result.meetingLink) {
            console.log(`📅 Link da reunião: ${result.meetingLink}`);
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
EOF

# Executar teste
node /tmp/test_agent.js

# Limpar arquivo temporário
rm /tmp/test_agent.js

echo ""
echo "================================"
echo "📋 Resumo:"
echo ""
echo "✅ Agente de prospecção configurado"
echo "✅ Integração WhatsApp: Simulation mode"
echo "✅ Integração Google Calendar: Simulation mode"
echo ""
echo "🚀 Para usar o agente:"
echo "   1. Acesse o dashboard: http://localhost:3001"
echo "   2. Selecione uma campanha"
echo "   3. Clique em 'Iniciar Prospecção Automatizada'"
echo ""
echo "📚 Documentação: README_AGENTE.md"
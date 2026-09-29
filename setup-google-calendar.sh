#!/bin/bash

# Script de configuração do Google Calendar
echo "📅 Configuração do Google Calendar"
echo "=================================="
echo ""

# Verificar se o diretório de credenciais existe
if [ ! -d "credentials" ]; then
    mkdir -p credentials
fi

# Verificar se as credenciais existem
if [ ! -f "credentials/google-credentials.json" ]; then
    echo "⚠️  Credenciais Google não encontradas"
    echo ""
    echo "📋 Para configurar o Google Calendar:"
    echo ""
    echo "1. Acesse: https://console.cloud.google.com/"
    echo "2. Crie um novo projeto ou selecione um existente"
    echo "3. Ative a Google Calendar API"
    echo "4. Crie credenciais OAuth 2.0"
    echo "5. Baixe o arquivo JSON e salve como:"
    echo "   credentials/google-credentials.json"
    echo ""
    echo "6. Execute novamente este script"
    echo ""
    exit 1
fi

echo "✅ Credenciais encontradas"
echo ""

# Verificar se o token já existe
if [ -f "credentials/google-token.json" ]; then
    echo "✅ Token Google já configurado"
    echo ""
    echo "Para reconfigurar, delete: credentials/google-token.json"
    exit 0
fi

echo "🔑 Gerando token de acesso..."
echo ""

# Executar script de autenticação
node -e "
const { google } = require('googleapis');
const fs = require('fs');
const readline = require('readline');

const credentials = JSON.parse(fs.readFileSync('credentials/google-credentials.json', 'utf8'));
const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
});

console.log('🔗 Acesse este link para autorizar:');
console.log('');
console.log(authUrl);
console.log('');
console.log('Cole o código de autorização abaixo:');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question('Código: ', async (code) => {
    try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        
        fs.writeFileSync('credentials/google-token.json', JSON.stringify(tokens));
        
        console.log('');
        console.log('✅ Token salvo com sucesso!');
        console.log('');
        console.log('📅 Google Calendar configurado!');
        
        // Testar conexão
        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
        const res = await calendar.calendarList.get({ calendarId: 'primary });
        console.log('');
        console.log('📋 Calendário:', res.data.summary);
        
    } catch (error) {
        console.error('❌ Erro ao obter token:', error.message);
    }
    
    rl.close();
});
"

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Reinicie o servidor: ./iniciar.sh"
echo "   2. Acesse o dashboard: http://localhost:3001"
echo "   3. Teste o agente de prospecção"
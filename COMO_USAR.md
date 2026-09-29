# 🚀 Guia Rápido - Business Leads AI

## Configuração Automatizada Concluída!

O sistema está configurado e pronto para uso. Siga os passos abaixo:

---

## 📋 Passo 1: Personalize seu Perfil

Edite o arquivo `business-profile.json` com seus dados:

```json
{
  "business": {
    "name": "NOME DA SUA EMPRESA",
    "type": "technology",
    "phone": "SEU TELEFONE",
    "email": "SEU EMAIL",
    "website": "SEU SITE",
    "description": "DESCRIÇÃO DO SEU PRODUTO/SERVIÇO",
    "valuePropositions": [
      "Benefício 1",
      "Benefício 2",
      "Benefício 3"
    ]
  }
}
```

---

## 🚀 Passo 2: Inicie o Dashboard

```bash
npm run web
```

Acesse: **http://localhost:3000**

---

## 🎯 Passo 3: Crie sua Primeira Campanha

### Via Dashboard Web (Recomendado):
1. Acesse http://localhost:3000
2. Clique em "Nova Campanha"
3. Preencha:
   - **Busca**: "Restaurante São Paulo"
   - **Limite**: 10 leads
   - **Mensagem**: "Olá! Vi que vocês têm ótimas avaliações. Posso ajudar com marketing digital?"
4. Clique em "Iniciar Campanha"

### Via Linha de Comando:
```bash
# Buscar restaurantes em São Paulo
node index.js -q "Restaurante São Paulo" -l 10

# Buscar lojas no Rio de Janeiro
node index.js -q "Loja de roupas Rio de Janeiro" -l 15

# Com mensagem personalizada
node index.js -q "Cafeteria Belo Horizonte" -l 5 -m "Olá! Vi que vocês têm ótimas avaliações. Posso ajudar com marketing digital?"
```

---

## 📊 O que o Sistema Faz

1. **Busca leads** no Google Maps automaticamente
2. **Gera mensagens personalizadas** via IA (Google Gemini)
3. **Cria templates** de email e WhatsApp
4. **Exporta dados** em CSV para uso posterior

---

## 🎨 Personalização

### Alterar Estilo de Mensagem:
Edite `business-profile.json`:
```json
{
  "preferences": {
    "campaignStyle": "aggressive"  // conservative, balanced, aggressive
  }
}
```

### Alterar Idioma:
```json
{
  "preferences": {
    "language": "portuguese"  // ou "english"
  }
}
```

---

## 📁 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `business-profile.json` | Seus dados e configurações |
| `.env` | Configurações do sistema |
| `output/` | Resultados das campanhas |

---

## 🔧 Comandos Úteis

```bash
# Dashboard web (recomendado)
npm run web

# Modo desenvolvimento (com auto-reload)
npm run web:dev

# Configuração interativa
npm run setup

# Testar IA
./test-complete.sh
```

---

## ❓ Problemas Comuns

### "Erro ao conectar com IA"
- Verifique se a chave de API está configurada: `./configure-api.sh`

### "Nenhum lead encontrado"
- Tente uma busca mais genérica: "restaurante" em vez de "restaurante italiano"

### "Dashboard não abre"
- Verifique se a porta 3000 está livre
- Ou mude a porta: `WEB_PORT=3001 npm run web`

---

## 🎯 Próximos Passos

1. ✅ **Configure seu perfil** em `business-profile.json`
2. ✅ **Inicie o dashboard**: `npm run web`
3. ✅ **Crie uma campanha** de teste
4. ✅ **Analise os resultados** e ajuste

---

**Precisa de ajuda?** Consulte `README_PORTUGUESE.md` para documentação completa.
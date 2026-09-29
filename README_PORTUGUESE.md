# 🚀 Business Leads AI Automation v2.0

**Ferramenta open-source de geração de leads com criação de conteúdo via IA (Google Gemini Gratuito) e dashboard web**

Gere leads de negócios a partir do Google Maps, crie conteúdo de marketing personalizado usando Google Gemini (gratuito) e gerencie tudo através de uma interface web moderna.

## 🎯 O que faz

Esta ferramenta ajuda você a:

- **Scraping de informações de negócios** do Google Maps (nome, endereço, telefone, avaliação)
- **Gerar conteúdo de marketing com IA** personalizado para cada negócio
- **Gerenciar campanhas** através de um dashboard web moderno
- **Rastrear qualidade dos leads** com scoring via IA
- **Exportar resultados** em CSV e JSON
- **Criar templates de email e WhatsApp** automaticamente
- **Monitorar performance** com análises em tempo real

## 💰 Custo: GRATUITO

Usamos **Google Gemini** (tier gratuito):
- ✅ 15 requisições por minuto
- ✅ 1 milhão de tokens por dia
- ✅ Sem custos para uso básico
- ✅ Modelo: **gemini-2.5-flash** (mais rápido e gratuito)
- ✅ Obtenha sua chave em: https://aistudio.google.com/apikey

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 16+
- Chave de API Google Gemini (gratuita)

### Instalação

```bash
cd business-leads-ai-automation
npm install
```

### Configuração

```bash
# Configure a chave do Google Gemini (gratuita)
./configure-api.sh

# Ou execute o assistente interativo
npm run setup

# O assistente irá guiá-lo através de:
# 1. Configuração da chave de API Google Gemini
# 2. Perfil do negócio (nome, telefone, email, serviços, propostas de valor)
# 3. Informações do proprietário/contato
# 4. Idioma e preferências
# 5. Foco da indústria e estilo da campanha
#
# Todas as configurações são salvas em .env e business-profile.json
```

**Ou manualmente:**

```bash
# Editar .env com sua chave de API
# Editar business-profile.json com dados do seu negócio
```

## 📋 Opções de Uso

### 🌐 Dashboard Web (Recomendado)

```bash
# Iniciar o dashboard web
npm run web

# Abra o navegador em http://localhost:3000
# Crie campanhas, gerencie leads e visualize análises
```

### 💻 Interface de Linha de Comando

```bash
# Uso básico CLI
node index.js -q "Restaurante São Paulo" -l 20

# Com geração de conteúdo de marketing
node index.js -q "Restaurante São Paulo" -l 20 -m "Aumente as vendas do seu restaurante com marketing digital"

# Com sobrescrita de idioma
node index.js -q "Cafeteria Rio de Janeiro" -l 10 -L portuguese
```

## 📊 Exemplo de Saída

### Entrada:
```bash
node index.js -q "Cafeteria São Paulo" -l 5 -m "Aumente suas vendas com sistema de pedidos online"
```

### Arquivos Gerados:
- `leads_[timestamp].csv` - Lista de leads
- `email_template.txt` - Template de email personalizado
- `whatsapp_template.txt` - Template de WhatsApp personalizado

## ⚙️ Funcionalidades

### ✅ Funcionalidades Principais

- Scraping do Google Maps com auto-scroll
- Extração de dados de negócios (nome, endereço, telefone, avaliação, website)
- Geração de conteúdo com IA usando OpenAI GPT
- Scoring de qualidade dos leads com IA
- Criação dupla de templates (email + WhatsApp)
- Exportação CSV e JSON
- Suporte bilíngue (português/inglês)
- Perfil de negócio configurável
- Rate limiting para evitar bloqueios

### 🌐 Funcionalidades do Dashboard Web

- Interface web moderna para usuários não técnicos
- Gerenciamento de campanhas com acompanhamento em tempo real
- Gerenciamento de leads com filtragem e ordenação
- Dashboard de análises com insights de performance
- Design responsivo para mobile e desktop
- Notificações em tempo real via Server-Sent Events
- Funcionalidade de exportação de dados
- Templates de campanha para diferentes indústrias

## 🔧 Configuração

### Arquivo .env

```bash
# CONFIGURAÇÃO DO GOOGLE GEMINI (GRATUITO)
# Obtenha sua chave em: https://aistudio.google.com/apikey
GEMINI_API_KEY=sua-chave-gemini-aqui

# Configuração automática do cliente AI
OPENAI_API_KEY=sua-chave-gemini-aqui
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
OPENAI_MODEL=gemini-2.5-flash

# CONFIGURAÇÕES DE SAÍDA
OUTPUT_LANGUAGE=portuguese
OUTPUT_FORMAT=csv
OUTPUT_DIRECTORY=output

# CONFIGURAÇÕES DE SCRAPING
DELAY_BETWEEN_SCRAPES=2000
MAX_RETRIES=3
DEFAULT_RESULT_LIMIT=20
```

### Arquivo business-profile.json

```json
{
  "business": {
    "name": "Sua Empresa",
    "type": "technology",
    "phone": "+5511999999999",
    "email": "contato@suaempresa.com",
    "website": "https://suaempresa.com",
    "description": "Descrição do seu serviço/produto",
    "valuePropositions": ["Entrega rápida", "Suporte 24/7"],
    "targetIndustries": ["restaurant", "retail", "services"]
  },
  "owner": {
    "name": "Seu Nome",
    "phone": "+5511999999999",
    "email": "seu@email.com"
  },
  "preferences": {
    "language": "portuguese",
    "campaignStyle": "balanced",
    "defaultLocation": "São Paulo"
  }
}
```

## 🚀 Comandos Disponíveis

```bash
npm run setup        # Assistente de configuração interativo
npm run web          # Iniciar dashboard web (recomendado)
npm run web:dev      # Dashboard web em modo desenvolvimento
npm run campaign     # Construtor de campanha interativo
npm run cli          # Versão CLI
npm test             # Executar testes
```

## 🌟 Por que Usar Esta Ferramenta?

### 💰 Custo-Benefício

- Gratuito vs $99-299/mês para alternativas SaaS
- Código aberto - modifique conforme necessário
- Sem assinaturas mensais

### 🎯 Foco Multi-Mercado

- Prompts de IA bilíngues — português e inglês
- Integração com marketing via WhatsApp
- Configurável para qualquer mercado

### 🛠️ Para Desenvolvedores

- Acesso ao código fonte completo
- Fácil de customizar e estender
- Código bem documentado
- Suporte da comunidade ativa

## ⚖️ Legal e Ética

- **Apenas dados públicos** - coleta informações publicamente disponíveis
- **Scraping respeitoso** - inclui rate limiting
- **Sem spam** - use para outreach de negócios legítimo
- **Licença MIT** - uso comercial permitido

## 🤝 Contribuindo

Bem-vindos contribuições! Como você pode ajudar:

- Relate bugs via GitHub Issues
- Sugira funcionalidades que gostaria de ver
- Submeta pull requests para melhorias
- Compartilhe seus casos de uso e histórias de sucesso

## 📚 Documentação

- Guia do Dashboard Web: Guia completo para a interface web
- Guia de Implantação: Instruções de implantação em produção

## 🆘 Obtendo Ajuda

- **GitHub Issues**: Para relatórios de bugs e pedidos de funcionalidades
- **Discussions**: Para perguntas e bate-papo da comunidade

## 🚀 Implantação

Pronto para produção? Confira nosso guia completo de implantação:

- Implantação em VPS/Servidor
- Containerização com Docker
- Implantação em plataformas cloud (Heroku, AWS, etc.)
- Configuração SSL/HTTPS
- Monitoramento e manutenção

## 📄 Licença

Licença MIT - veja o arquivo LICENSE para detalhes.

---

**Feito com ❤️ para negócios em todo o mundo**
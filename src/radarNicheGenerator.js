const { getClient } = require('./openaiClient');
const { normalizeRadarNiche } = require('./settingsStore');

function stripJsonFence(text) {
    return String(text || '').trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '');
}

function buildPrompt({ topic, product, audience }) {
    const subject = [topic, product].filter(Boolean).join(' / ') || 'novo nicho de prospecção';
    return `Gere uma configuração de nicho para radar de leads em grupos de WhatsApp.

Tema/nicho/produto: ${subject}
Público-alvo: ${audience || 'pessoas que demonstram intenção de compra ou contratação'}

Responda APENAS com JSON válido neste formato:
{
  "name": "nome curto",
  "description": "descrição objetiva do nicho",
  "offer": "oferta legal e permitida que será prospectada",
  "keywords": ["termos que indicam intenção real"],
  "negativeKeywords": ["termos que indicam descarte, risco ou assunto proibido"],
  "qualificationSignals": ["sinais de urgência, compra ou dor"],
  "complianceRules": ["regras para evitar abordagem indevida"],
  "initialMessageTemplate": "mensagem inicial curta, consultiva e sem promessa exagerada"
}

Regras:
- Gere termos em português do Brasil, incluindo variações sem acento quando fizer sentido.
- Palavras-chave devem capturar intenção de compra, pedido de indicação, teste, orçamento ou suporte.
- Palavras negativas devem evitar propaganda de terceiros, denúncia, ilegalidade, desbloqueio, pirataria e conversas fora do produto.
- Se o tema envolver IPTV, streaming, TV box, canais pagos ou acesso a conteúdo, a oferta deve ficar restrita a serviços legais/autorizados, streaming licenciado, suporte técnico permitido ou telecom. Inclua negativos para pirataria, canais pagos sem autorização, desbloqueio, lista pirata e similares.
- Não inclua secrets, contatos reais, links ou dados pessoais.`;
}

async function generateRadarNiche(input = {}) {
    const topic = String(input.topic || '').trim();
    const product = String(input.product || '').trim();
    const audience = String(input.audience || '').trim();

    if (!topic && !product) {
        const error = new Error('Informe um nicho, tema ou produto para gerar a configuração.');
        error.statusCode = 400;
        throw error;
    }

    const client = getClient();
    if (!client) {
        const error = new Error('IA não configurada. Defina OPENAI_API_KEY ou GEMINI_API_KEY no .env.');
        error.statusCode = 500;
        throw error;
    }

    const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gemini-2.5-flash',
        messages: [
            { role: 'system', content: 'Você cria configurações seguras para prospecção B2B/B2C e responde somente JSON válido.' },
            { role: 'user', content: buildPrompt({ topic, product, audience }) }
        ],
        temperature: 0.35,
        max_tokens: 1600,
        reasoning_effort: 'none'
    });

    const raw = stripJsonFence(completion.choices?.[0]?.message?.content);
    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch (error) {
        const parseError = new Error('A IA retornou uma configuração inválida. Tente gerar novamente.');
        parseError.statusCode = 502;
        throw parseError;
    }

    const niche = normalizeRadarNiche(parsed);
    if (!niche.name || !niche.keywords.length) {
        const error = new Error('A IA não gerou um nicho utilizável. Tente detalhar melhor o produto.');
        error.statusCode = 502;
        throw error;
    }

    return niche;
}

module.exports = { generateRadarNiche };

/**
 * Lead Agent - Agente de IA para Prospecção Automatizada
 * 
 * Este agente entra em contato com leads automaticamente via WhatsApp
 * e tenta convencê-los a:
 * 1. Falar com atendimento humano via WhatsApp
 * 2. Agendar uma reunião no Google Agenda para conversa via Google Meet
 */

const { getClient, getModel } = require('./openaiClient');
const { getProfile } = require('./businessProfile');
const WhatsAppIntegration = require('./whatsappIntegration');
const GoogleCalendarIntegration = require('./googleCalendarIntegration');
const { buildOthukiContext } = require('./knowledge');
const conversationStore = require('./conversationStore');
const { sendOwnerAlert } = require('./alerts');
const events = require('./events');

// Ferramentas expostas ao modelo (function calling) para automatizar a prospecção
const AGENT_TOOLS = [
    {
        type: 'function',
        function: {
            name: 'schedule_meeting',
            description: 'Agendar uma reunião online (Google Meet) com o lead quando ele demonstrar interesse em conhecer a Othuki ou pedir um horário. Use com naturalidade, apenas quando o lead estiver propício.',
            parameters: {
                type: 'object',
                properties: {
                    suggestedTime: {
                        type: 'string',
                        description: 'Sugestão de horário mencionada pelo lead, se houver (ex: "amanhã às 10h").'
                    }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'escalate_to_human',
            description: 'Transferir o atendimento para um humano da Othuki quando o lead pedir para falar com pessoa, tiver dúvida técnica muito específica, ou preferir atendimento humano.',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'flag_qualified_lead',
            description: 'REGRA OBRIGATÓRIA: chame exatamente uma vez por conversa, assim que concluir que o lead tem uma necessidade real e alinhada a um serviço da Othuki (não é curiosidade nem descarte). Não decide preço nem fechamento, só avisa o operador.',
            parameters: {
                type: 'object',
                properties: {
                    needSummary: { type: 'string', description: 'Resumo curto e objetivo do que o lead precisa.' }
                },
                required: ['needSummary']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'request_price_authorization',
            description: 'REGRA OBRIGATÓRIA E INEGOCIÁVEL: chame sempre que o lead perguntar valor, preço, orçamento ou "quanto custa", ANTES de responder. Você nunca informa nenhum número por conta própria.',
            parameters: {
                type: 'object',
                properties: {
                    question: { type: 'string', description: 'A pergunta de valor exata que o lead fez, com contexto do que está sendo cotado.' }
                },
                required: ['question']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'request_close_confirmation',
            description: 'REGRA OBRIGATÓRIA E INEGOCIÁVEL: chame quando o lead demonstrar que quer fechar/contratar/avançar para um acordo. Você nunca confirma um fechamento sozinho — depois desta chamada, a conversa passa para um humano.',
            parameters: {
                type: 'object',
                properties: {
                    dealSummary: { type: 'string', description: 'Resumo do que está sendo negociado/fechado com o lead.' }
                },
                required: ['dealSummary']
            }
        }
    }
];

class LeadAgent {
    constructor() {
        this.openai = getClient();
        this.whatsapp = new WhatsAppIntegration();
        this.calendar = new GoogleCalendarIntegration();
    }

    /**
     * Prepara o contato com um lead: gera a 1ª mensagem e deixa como rascunho
     * pendente de aprovação. Nada é enviado ao WhatsApp aqui — ver
     * `approvePendingMessage`. `pitch` descreve o produto sendo oferecido e
     * `testTarget` (opcional) redireciona o envio (quando aprovado) para um
     * destino de teste (ex: grupo do WhatsApp) em vez do telefone do lead.
     */
    async startOutreach(lead, campaignStyle = 'balanced', { pitch, testTarget, origin, radarLeadId, nicheId, nicheName } = {}) {
        console.log(`\n🤖 Preparando contato com: ${lead.name}`);

        const profile = getProfile();
        const language = profile.preferences.language || 'portuguese';

        // Verificar se já existe conversa em andamento (já contatada ou com rascunho pendente)
        const existingConversation = await conversationStore.getConversation(lead.id);
        if (existingConversation && existingConversation.status !== 'completed'
            && (existingConversation.pendingMessage || existingConversation.messages.length > 0)) {
            console.log(`⚠️  Conversa já em andamento com ${lead.name}`);
            return existingConversation;
        }

        // Criar nova conversa
        const conversation = {
            leadId: lead.id,
            leadName: lead.name,
            leadPhone: lead.phone,
            radarSenderJid: lead.radarSenderJid || null,
            status: 'initiated',
            messages: [],
            pendingMessage: null,
            pitch: pitch || null,
            testTarget: testTarget || null,
            origin: origin || 'campaign',
            radarLeadId: radarLeadId || null,
            nicheId: nicheId || null,
            nicheName: nicheName || null,
            currentStep: 1,
            maxSteps: 5,
            startTime: new Date(),
            lastActivity: new Date(),
            attempts: 0,
            maxAttempts: 3,
            outcome: null,
            humanControlled: false
        };

        // Gerar primeira mensagem e deixar pendente de aprovação
        const firstMessage = await this.generateFirstMessage(lead, campaignStyle, language, pitch, origin === 'radar');
        conversation.pendingMessage = {
            content: firstMessage,
            step: 1,
            intent: null,
            createdAt: new Date()
        };
        conversation.status = 'awaiting_approval';

        await conversationStore.saveConversation(conversation);
        console.log(`📝 Rascunho da 1ª mensagem pronto para ${lead.name}, aguardando aprovação`);
        await this.notifyDraftReady(conversation);

        return conversation;
    }

    /**
     * Notifica o operador (WhatsApp/Telegram) que um rascunho novo está
     * pronto para revisão, correlacionado ao lead — responder (reply) a essa
     * notificação aprova/descarta/edita o envio (canal de operação remota).
     */
    async notifyDraftReady(conversation) {
        if (!conversation.pendingMessage) return;
        const text = `📝 Rascunho pronto para ${conversation.leadName}${conversation.testTarget ? ' (destino de teste)' : ''}:\n\n"${conversation.pendingMessage.content}"\n\nResponda a ESTA mensagem (reply) com "aprovar" para enviar, "cancelar" para descartar, ou outro texto para enviar no lugar.`;
        await sendOwnerAlert(text, { leadId: conversation.leadId, kind: 'draft' });
        events.emit('notification', {
            kind: 'draft_ready',
            leadId: conversation.leadId,
            leadName: conversation.leadName,
            preview: conversation.pendingMessage.content.slice(0, 140)
        });
    }

    /**
     * Envia (ou descarta) o rascunho pendente de uma conversa.
     */
    async approvePendingMessage(leadId, { editedContent, target } = {}) {
        const conversation = await conversationStore.getConversation(leadId);
        if (!conversation) return null;
        if (!conversation.pendingMessage) {
            throw new Error('Não há mensagem pendente de aprovação nesta conversa');
        }

        const pending = conversation.pendingMessage;
        const content = (editedContent || pending.content || '').toString().trim();
        if (!content) throw new Error('Mensagem vazia');

        const sendTarget = target || conversation.testTarget || { value: conversation.leadPhone, isGroup: !!conversation.isGroup };
        const sendResult = await this.whatsapp.sendMessage(sendTarget.value, content, { isGroup: !!sendTarget.isGroup });

        if (!sendResult.success) {
            conversation.pendingMessage = { ...pending, sendError: sendResult.error };
            await conversationStore.saveConversation(conversation);
            throw new Error(sendResult.error || 'Falha ao enviar mensagem');
        }

        conversation.messages.push({
            type: 'outbound',
            content,
            timestamp: new Date(),
            step: pending.step,
            intent: pending.intent || undefined,
            edited: Boolean(editedContent && editedContent !== pending.content)
        });
        conversation.whatsappMessageId = sendResult.messageId;
        conversation.pendingMessage = null;
        conversation.lastActivity = new Date();
        conversation.status = pending.step === 1
            ? 'contacted'
            : (pending.intent === 'schedule_meeting' ? 'scheduling'
                : pending.intent === 'talk_human' ? 'transferring'
                : pending.intent === 'not_interested' ? 'completed'
                : pending.intent === 'close_confirmation_requested' ? 'human_takeover'
                : conversation.humanControlled ? 'human_takeover'
                : 'in_progress');

        await conversationStore.saveConversation(conversation);
        return { conversation, sendResult };
    }

    /**
     * Descarta o rascunho pendente sem enviar nada.
     */
    async discardPendingMessage(leadId) {
        const conversation = await conversationStore.getConversation(leadId);
        if (!conversation) return null;

        conversation.pendingMessage = null;
        conversation.lastActivity = new Date();
        if (conversation.status === 'awaiting_approval') {
            conversation.status = conversation.messages.length ? 'in_progress' : 'initiated';
        }
        await conversationStore.saveConversation(conversation);
        return conversation;
    }

    /**
     * Aplica uma autorização de valor recebida do operador (via reply a um
     * alerta, WhatsApp ou Telegram): gera um novo rascunho de resposta ao
     * lead usando exatamente o valor autorizado. Continua exigindo a
     * aprovação normal antes de qualquer envio.
     */
    async applyPriceAuthorization(leadId, authorizedText) {
        const conversation = await conversationStore.getConversation(leadId);
        if (!conversation) return null;

        const language = (getProfile().preferences && getProfile().preferences.language) || 'portuguese';
        let replyText = authorizedText;

        if (this.openai) {
            const chatMessages = [{ role: 'system', content: this.getAgentSystemPrompt(language, { concealIdentity: conversation.origin === 'radar' }) }];
            for (const m of conversation.messages) {
                chatMessages.push({ role: m.type === 'inbound' ? 'user' : 'assistant', content: m.content });
            }
            chatMessages.push({
                role: 'system',
                content: `O operador autorizou responder à pergunta de valor do lead com: "${authorizedText}". Escreva agora a resposta para o lead usando exatamente essa informação, de forma natural — não invente nada além disso.`
            });

            try {
                const completion = await this.openai.chat.completions.create({
                    model: getModel(),
                    messages: chatMessages,
                    max_tokens: 500,
                    temperature: 0.6,
                    reasoning_effort: 'none'
                });
                replyText = completion.choices[0].message.content.trim();
            } catch (error) {
                console.error('Erro ao gerar resposta com valor autorizado:', error.message);
            }
        }

        conversation.pendingMessage = {
            content: replyText,
            step: conversation.currentStep + 1,
            intent: 'price_authorized_reply',
            createdAt: new Date()
        };
        conversation.currentStep += 1;
        conversation.pendingAuthorization = null;
        conversation.status = 'awaiting_approval';
        conversation.lastActivity = new Date();

        await conversationStore.saveConversation(conversation);
        await this.notifyDraftReady(conversation);
        return conversation;
    }

    /**
     * Registra a confirmação do operador para um pedido de fechamento
     * (a conversa já está em controle humano nesse ponto).
     */
    async applyCloseConfirmation(leadId, confirmationText) {
        const conversation = await conversationStore.getConversation(leadId);
        if (!conversation) return null;

        conversation.closeAuthorization = confirmationText;
        conversation.pendingAuthorization = null;
        conversation.lastActivity = new Date();

        await conversationStore.saveConversation(conversation);
        return conversation;
    }

    /**
     * Inicia contato com um lead encontrado pelo Radar de Leads (grupos do
     * WhatsApp). Resolve o número real (o radar só tem o @lid de privacidade
     * do participante) e gera a 1ª mensagem referenciando o pedido original
     * feito no grupo — mesmo fluxo de rascunho pendente do startOutreach.
     */
    async startRadarOutreach(radarLead, { testTarget } = {}) {
        const phone = await this.whatsapp.resolveParticipantPhone(radarLead.group_id, radarLead.sender_jid);
        if (!phone) {
            throw new Error('Não consegui resolver o número real desse lead (participante pode ter saído do grupo).');
        }

        const lead = { id: phone, name: radarLead.sender_name || 'Lead do grupo', phone, radarSenderJid: radarLead.sender_jid || null };
        const pitch = {
            summary: `O lead escreveu isto no grupo "${radarLead.group_name}": "${radarLead.message_text}". Responda como quem viu a mensagem no grupo e quer ajudar de verdade, de forma pessoal e natural — não como um script de vendas genérico, e sem mencionar nome de empresa/agência. Necessidade identificada: ${radarLead.need_summary || radarLead.service_match || 'não especificado'}.`
        };

        return this.startOutreach(lead, 'balanced', {
            pitch,
            testTarget,
            origin: 'radar',
            radarLeadId: radarLead.id,
            nicheId: radarLead.niche_id || null,
            nicheName: radarLead.niche_name || null
        });
    }

    /**
     * Gera a primeira mensagem de contato
     */
    async generateFirstMessage(lead, campaignStyle, language, pitch, concealIdentity = false) {
        if (!this.openai) {
            throw new Error('OpenAI not configured');
        }

        const profile = getProfile();
        const biz = profile.business;

        const prompt = this.buildFirstMessagePrompt(lead, biz, campaignStyle, language, pitch, concealIdentity);

        try {
            const completion = await this.openai.chat.completions.create({
                model: getModel(),
                messages: [
                    {
                        role: "system",
                        content: this.getAgentSystemPrompt(language, { concealIdentity })
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7,
                reasoning_effort: 'none'
            });

            return completion.choices[0].message.content.trim();
        } catch (error) {
            console.error('Error generating first message:', error);
            return this.getDefaultFirstMessage(lead, language, concealIdentity);
        }
    }

    /**
     * Prompt do sistema para o agente
     */
    getKnowledgeContext() {
        try {
            return buildOthukiContext(getProfile());
        } catch (e) {
            return '';
        }
    }

    getAgentSystemPrompt(language = 'portuguese', { concealIdentity = false } = {}) {
        const knowledge = this.getKnowledgeContext();
        if (language === 'portuguese') {
            const personaPt = concealIdentity
                ? `Você está respondendo, de forma pessoal e natural, a um pedido que alguém deixou em um grupo do WhatsApp/Telegram sobre um serviço que a Othuki oferece. Aja como uma pessoa comum se oferecendo para ajudar — NÃO mencione "Othuki", nome de agência, nem diga que é uma IA/assistente virtual, em NENHUM momento desta conversa (nem ao perceber que o lead está interessado). Quem vai se apresentar de verdade é o Ricardo Othuki, pessoalmente, depois — fora desta conversa. Continue soando como uma pessoa comum, natural, conversando pelo WhatsApp.`
                : `Você é o "Agente Othuki", um consultor de vendas humanizado e consultivo da Othuki Agência Digital, conversando pelo WhatsApp com donos de pequenos e médios negócios no Brasil.`;
            const transparencyPt = concealIdentity
                ? `QUALIFICAÇÃO (sem se identificar):
- Quando chamar a ferramenta flag_qualified_lead, continue a conversa normalmente, sem mencionar Othuki nem que você é uma IA — isso já dispara um alerta interno para o Ricardo por trás dos panos. Não revele nada disso ao lead.`
                : `TRANSPARÊNCIA OBRIGATÓRIA NA QUALIFICAÇÃO:
- No MESMO turno em que você chamar a ferramenta flag_qualified_lead, inclua na sua resposta ao lead, de forma natural, esta transparência: "só pra ser transparente: sou o Agente Othuki, um assistente de IA — eu faço o primeiro contato, e intermedio a conversa, ou te conecto com o Ricardo Othuki agora mesmo". Adapte o tom sem mudar o sentido, mas não omita essa informação.`;

            return `${personaPt}

=== CONTEXTO DA OTHUKI (fale com propriedade, com base nestes dados — mas ${concealIdentity ? 'sem citar o nome "Othuki" para o lead' : 'pode citar a Othuki livremente'}) ===
${knowledge}

SUA MISSÃO:
Conduzir uma conversa NATURAL — como uma pessoa de confiança, nunca como robô — para:
1. Quebrar o gelo e criar rapport.
2. Primeiro entender se o lead tem interesse em conversar sobre o assunto — NÃO empurre reunião/agendamento antes disso. Faça perguntas curtas e escute de verdade.
3. Entender o negócio, a DOR e a necessidade do lead.
4. Mostrar, com base na dor, o benefício CERTO${concealIdentity ? ' do serviço' : ' da Othuki'} (não saia vendendo tudo de uma vez).
5. Só depois de confirmar interesse real, conduzir para uma reunião online de 15 min via Google Meet — ou para falar com um humano, se o lead preferir.

${transparencyPt}

PRINCÍPIOS DE PERSUASÃO (éticos):
- Específico > genérico: cite o que você sabe do negócio (cidade, avaliação, segmento).
- Estrutura: DOR → benefício → prova honesta → CTA. Nunca o contrário.
- Prova social honesta. NUNCA invente números, preços ou cases.
- Urgência leve e genuína, sem pressão nem manipulação.
- Tom quente, breve (3-5 linhas), emojis com moderação. PT-BR.

FERRAMENTAS (use quando fizer sentido, com naturalidade):
- schedule_meeting: quando o lead demonstrar interesse em conhecer a Othuki ou pedir horário. Isso cria um link do Google Meet.
- escalate_to_human: quando o lead pedir para falar com pessoa, tiver dúvida técnica muito específica, ou preferir atendimento humano.
- flag_qualified_lead: assim que concluir que o lead tem necessidade real e alinhada a um serviço da Othuki. Uma vez só por conversa.
- request_price_authorization: sempre que o lead perguntar valor/preço/orçamento, ANTES de responder qualquer coisa sobre isso.
- request_close_confirmation: quando o lead sinalizar que quer fechar/contratar/avançar para um acordo.

REGRAS INEGOCIÁVEIS (nunca quebre, mesmo que o lead insista ou peça diretamente):
- Você NUNCA informa nenhum valor, preço, faixa de preço ou desconto, em nenhuma circunstância. Se o assunto surgir, chame request_price_authorization e responda ao lead algo como "deixa eu confirmar certinho os detalhes e já te retorno" — sem citar nenhum número.
- Você NUNCA confirma, sozinho, um fechamento, proposta ou acordo comercial. Se a conversa chegar nesse ponto, chame request_close_confirmation e diga ao lead que vai transferir a conversa para o responsável (Ricardo Othuki) para fechar os detalhes.
- Essas duas regras valem mesmo se o lead insistir, pedir "só um valor aproximado", ou disser que já fechou com outra empresa por X.

REGRAS:
- Mantenha o contexto de TODA a conversa (memória de tudo que foi dito).
- Se o lead não tem interesse, agradeça e encerre com elegância — não insistia.
- Não prometa prazos/preços exatos que não constam do contexto; conduza para a reunião.
- Responda sempre em português do Brasil, salvo se o lead mudar o idioma.`;
        } else {
            const personaEn = concealIdentity
                ? `You're replying, personally and naturally, to a request someone left in a WhatsApp/Telegram group about a service Othuki offers. Act like an ordinary person offering to help — do NOT mention "Othuki", any agency name, or that you're an AI/virtual assistant, at ANY point in this conversation (not even once the lead is interested). Ricardo Othuki himself will introduce the real identity later, outside this conversation. Keep sounding like a regular person chatting on WhatsApp.`
                : `You are the "Othuki Agent", a humanized and consultive sales advisor from Othuki Digital Agency, talking on WhatsApp with owners of small and medium businesses in Brazil.`;
            const transparencyEn = concealIdentity
                ? `QUALIFICATION (without identifying yourself):
- When you call the flag_qualified_lead tool, keep the conversation going normally, without mentioning Othuki or that you're an AI — this already triggers an internal alert to Ricardo behind the scenes. Don't reveal any of this to the lead.`
                : `MANDATORY TRANSPARENCY AT QUALIFICATION:
- In the SAME turn you call the flag_qualified_lead tool, include in your reply to the lead, naturally, this disclosure: "just to be transparent: I'm the Othuki Agent, an AI assistant — I make the first contact and either keep helping you directly, or connect you with Ricardo Othuki right now". Adapt the tone but never omit this.`;

            return `${personaEn}

=== OTHUKI CONTEXT (speak with knowledge based on this data — but ${concealIdentity ? 'without naming "Othuki" to the lead' : 'you can mention Othuki freely'}) ===
${knowledge}

YOUR MISSION:
Lead a NATURAL conversation — like a trusted person, never a robot — to:
1. Break the ice and build rapport.
2. First understand whether the lead has any interest in talking about this at all — do NOT push a meeting/scheduling before that. Ask short questions and truly listen.
3. Understand the business, the PAIN and the need.
4. Show, based on the pain, the RIGHT${concealIdentity ? ' service' : ' Othuki'} benefit (don't pitch everything at once).
5. Only after confirming real interest, guide to a 15-min online meeting via Google Meet — or to talk to a human, if the lead prefers.

${transparencyEn}

PERSUASION PRINCIPLES (ethical):
- Specific > generic: cite what you know about the business (city, rating, segment).
- Structure: PAIN → benefit → honest proof → CTA. Never the reverse.
- Honest social proof. NEVER invent numbers, prices or cases.
- Light, genuine urgency — no pressure or manipulation.
- Warm, brief tone (3-5 lines), emojis sparingly. Brazilian Portuguese.

TOOLS (use when it makes sense, naturally):
- schedule_meeting: when the lead shows interest in learning about Othuki or asks for a time. Creates a Google Meet link.
- escalate_to_human: when the lead asks to talk to a person, has a very specific technical question, or prefers human support.
- flag_qualified_lead: once you conclude the lead has a real need matching an Othuki service. Once per conversation.
- request_price_authorization: whenever the lead asks about price/value/budget, BEFORE replying to that.
- request_close_confirmation: when the lead signals they want to close/hire/move to an agreement.

NON-NEGOTIABLE RULES (never break these, even if the lead insists):
- You NEVER state any price, value, range or discount, under any circumstance. If the topic comes up, call request_price_authorization and reply with something like "let me confirm the details and get right back to you" — no numbers.
- You NEVER confirm a close, proposal or business agreement by yourself. If the conversation reaches that point, call request_close_confirmation and tell the lead you'll transfer the conversation to the person in charge (Ricardo Othuki).

RULES:
- Keep context of the WHOLE conversation (memory).
- If the lead is not interested, thank and close gracefully — don't insist.
- Don't promise exact timelines/prices not in context; guide to the meeting.
- Always reply in Brazilian Portuguese unless the lead switches language.`;
        }
    }

    /**
     * Prompt para primeira mensagem
     */
    buildFirstMessagePrompt(lead, biz, campaignStyle, language, pitch, concealIdentity = false) {
        const knowledge = this.getKnowledgeContext();
        const pitchBlockPt = pitch ? `
PRODUTO/SERVIÇO ESPECÍFICO SENDO OFERECIDO NESTE CONTATO (use este, não a lista genérica de serviços):
${concealIdentity ? '' : `- Nome: ${pitch.productName || ''}\n`}- Resumo: ${pitch.summary || ''}
${pitch.landingPage && !concealIdentity ? `- Link: ${pitch.landingPage}` : ''}
` : '';
        if (language === 'portuguese') {
            return `Gere a PRIMEIRA mensagem de contato (abordagem humanizada) para este lead, pelo WhatsApp:

DADOS DO LEAD:
- Nome: ${lead.name}
- Endereço: ${lead.address}
- Telefone: ${lead.phone}
- Avaliação: ${lead.rating || 'N/A'}
- Website: ${lead.website || 'Sem website'}
${pitchBlockPt}
CONTEXTO${concealIdentity ? ' (para seu entendimento — NÃO cite nomes de empresa/agência ao lead)' : ' DA OTHUKI'}:
${knowledge}

ESTILO: ${campaignStyle}

INSTRUÇÕES:
1. Saudação calorosa e pessoal, tratando pelo nome do negócio.
2. Quebre o gelo com algo específico e verdadeiro sobre o lead (cidade, avaliação, segmento) — sem soar robótico.
3. Mostre que você ENTENDE o tipo de desafio desse negócio e apresente UM benefício relevante${pitch ? ' do que foi descrito acima' : concealIdentity ? ' do serviço' : ' da Othuki'} (dor → benefício)${concealIdentity ? ', SEM citar nome de empresa/agência — fale como se fosse você mesmo oferecendo ajuda' : ''}.
4. Termine perguntando, de forma leve e aberta, se isso é algo que faz sentido para ele agora — NÃO ofereça reunião, Google Meet ou horário ainda. O objetivo desta primeira mensagem é só descobrir se há interesse em continuar a conversa.
5. Máximo de 3-4 linhas. Tom natural, consultivo, PT-BR, emojis com moderação.
6. NÃO invente preços, prazos ou cases.`;
        } else {
            const pitchBlockEn = pitch ? `
SPECIFIC PRODUCT/SERVICE BEING OFFERED IN THIS CONTACT (use this, not the generic service list):
${concealIdentity ? '' : `- Name: ${pitch.productName || ''}\n`}- Summary: ${pitch.summary || ''}
${pitch.landingPage && !concealIdentity ? `- Link: ${pitch.landingPage}` : ''}
` : '';
            return `Generate the FIRST contact message (humanized approach) for this lead, on WhatsApp:

LEAD DATA:
- Name: ${lead.name}
- Address: ${lead.address}
- Phone: ${lead.phone}
- Rating: ${lead.rating || 'N/A'}
- Website: ${lead.website || 'No website'}
${pitchBlockEn}
CONTEXT${concealIdentity ? ' (for your understanding only — do NOT mention any company/agency name to the lead)' : ' — OTHUKI'}:
${knowledge}

STYLE: ${campaignStyle}

INSTRUCTIONS:
1. Warm, personal greeting using the business name.
2. Break the ice with something specific and true about the lead (city, rating, segment) — not robotic.
3. Show you UNDERSTAND this business's challenge and present ONE relevant benefit${pitch ? ' of what was described above' : concealIdentity ? ' of the service' : ' of Othuki'} (pain → benefit)${concealIdentity ? ', WITHOUT naming any company/agency — talk as if you were offering the help yourself' : ''}.
4. End by lightly and openly asking whether this is something that makes sense for them right now — do NOT offer a meeting, Google Meet, or a time slot yet. This first message's only goal is to find out if there's interest in continuing the conversation.
5. Maximum 3-4 lines. Natural, consultive tone, Brazilian Portuguese, emojis sparingly.
6. Do NOT invent prices, timelines or cases.`;
        }
    }

    /**
     * Mensagem padrão caso a IA falhe
     */
    getDefaultFirstMessage(lead, language, concealIdentity = false) {
        if (language === 'portuguese') {
            if (concealIdentity) {
                return `Oi ${lead.name}! Vi sua mensagem por aqui e acho que posso te ajudar com isso. Topa trocar uma ideia sobre o que você precisa? 😊`;
            }
            return `Olá ${lead.name}! 👋

Aqui é o Agente Othuki. Vi que vocês têm ${lead.rating || 'boas'} avaliações no Google - parabéns!

Ajudamos negócios como o seu a aumentar vendas com sites de alta performance e automação com IA.

Isso é algo que faz sentido pra vocês agora? 😊`;
        } else {
            if (concealIdentity) {
                return `Hey ${lead.name}! Saw your message and think I can help with that. Up for chatting a bit about what you need? 😊`;
            }
            return `Hello ${lead.name}! 👋

This is the Othuki Agent. I saw you have ${lead.rating || 'good'} ratings on Google - congratulations!

We help businesses like yours increase sales with high-performance websites and AI automation.

Is this something that makes sense for you right now? 😊`;
        }
    }

    /**
     * Processa resposta do lead
     */
    async processLeadResponse(leadId, responseMessage, options = {}) {
        const conversation = await conversationStore.getConversation(leadId);
        if (!conversation) {
            console.log(`❌ Conversa não encontrada para lead ${leadId}`);
            return null;
        }

        console.log(`📩 Resposta recebida de ${conversation.leadName}: ${responseMessage}`);

        const inboundMetadata = options.messageMeta && typeof options.messageMeta === 'object'
            ? Object.fromEntries(Object.entries(options.messageMeta).filter(([, value]) => value !== undefined && value !== null && value !== ''))
            : {};

        // Adicionar mensagem do lead
        conversation.messages.push({
            type: 'inbound',
            content: responseMessage,
            timestamp: new Date(),
            step: conversation.currentStep,
            ...inboundMetadata
        });

        // Se um humano assumiu o controle, apenas registra a mensagem
        // e NÃO gera/resposta automaticamente com a IA
        if (conversation.humanControlled) {
            conversation.lastActivity = new Date();
            await conversationStore.saveConversation(conversation);
            console.log(`🧑‍💼 Conversa com ${conversation.leadName} sob controle humano — mensagem registrada sem resposta automática`);
            return {
                intent: 'human_controlled',
                response: null,
                humanControlled: true,
                conversation
            };
        }

        // Gerar resposta fluida (memória + base Othuki + ferramentas agendar/escalar)
        const result = await this.generateTurn(conversation, responseMessage, {
            allowActions: true
        });

        // Deixar a resposta como rascunho pendente de aprovação (não envia sozinho)
        conversation.pendingMessage = {
            content: result.reply,
            step: conversation.currentStep + 1,
            intent: result.intent,
            createdAt: new Date()
        };
        conversation.currentStep += 1;
        conversation.lastActivity = new Date();
        conversation.status = 'awaiting_approval';

        await conversationStore.saveConversation(conversation);
        await this.notifyDraftReady(conversation);

        return {
            intent: result.intent,
            response: result.reply,
            meetingLink: result.meetingLink,
            sent: false,
            conversation: conversation
        };
    }

    /**
     * Ponto de entrada centrado em telefone (ideal para webhook Evolution/n8n).
     * Cria a conversa se não existir e processa a mensagem do lead.
     * Retorna a resposta do agente para quem chamou enviar (ex: n8n via Evolution).
     */
    async handleInboundMessage({ phone, groupId, name, message, source, targetType, rawTarget, senderJid, externalMessageId }) {
        const target = groupId || phone;
        const isGroup = Boolean(groupId || String(target || '').toLowerCase().endsWith('@g.us'));
        const normalizedTarget = isGroup
            ? String(target || '').trim().toLowerCase()
            : String(target || '').replace(/\D/g, '');

        if (!normalizedTarget) throw new Error(isGroup ? 'Grupo inválido' : 'Telefone inválido');
        if (!message || !message.toString().trim()) throw new Error('Mensagem vazia');

        const leadId = normalizedTarget;
        let conversation = await conversationStore.getConversation(leadId);
        if (!conversation) {
            conversation = {
                leadId,
                leadName: name || (isGroup ? `Grupo ${normalizedTarget}` : `Lead ${normalizedTarget}`),
                leadPhone: normalizedTarget,
                isGroup,
                status: 'contacted',
                messages: [],
                pendingMessage: null,
                currentStep: 1,
                maxSteps: 5,
                startTime: new Date(),
                lastActivity: new Date(),
                attempts: 0,
                maxAttempts: 3,
                outcome: null,
                humanControlled: false,
                inboundInitiated: true
            };
            await conversationStore.saveConversation(conversation);
        }

        const result = await this.processLeadResponse(leadId, message.toString(), {
            messageMeta: {
                source,
                targetType,
                rawTarget,
                senderJid,
                externalMessageId,
                groupId: isGroup ? normalizedTarget : undefined
            }
        });

        return {
            leadId,
            reply: result ? result.response : null,
            intent: result ? result.intent : null,
            meetingLink: result ? result.meetingLink : null,
            sent: false,
            pendingApproval: Boolean(result && result.conversation && result.conversation.pendingMessage),
            humanControlled: !!conversation.humanControlled,
            status: result && result.conversation ? result.conversation.status : conversation.status
        };
    }


    /**
     * Gera a resposta do agente de forma FLUIDA e humanizada.
     * Mantém todo o histórico da conversa, usa a base de conhecimento Othuki
     * e decide (via function calling) quando agendar reunião ou escalar p/ humano.
     */
    async generateTurn(conversation, leadMessageText, options = {}) {
        // Fallback sem IA: classifica localmente e usa resposta template
        if (!this.openai) {
            const intent = this.analyzeIntentLocal(leadMessageText);
            const reply = this.getFallbackReply(intent.type, conversation);
            return { reply, intent: intent.type };
        }

        const language = (getProfile().preferences && getProfile().preferences.language) || 'portuguese';
        const system = this.getAgentSystemPrompt(language, { concealIdentity: conversation.origin === 'radar' });

        const chatMessages = [{ role: 'system', content: system }];
        for (const m of conversation.messages) {
            if (m.type === 'inbound') chatMessages.push({ role: 'user', content: m.content });
            else chatMessages.push({ role: 'assistant', content: m.content });
        }
        chatMessages.push({ role: 'user', content: leadMessageText });

        const base = { model: getModel(), messages: chatMessages, temperature: 0.7, max_tokens: 700, reasoning_effort: 'none' };

        let intentType = 'engaged';
        let meetingLink = null;

        try {
            const completion = await this.openai.chat.completions.create({
                ...base,
                ...(options.allowActions ? { tools: AGENT_TOOLS, tool_choice: 'auto' } : {})
            });

            let choice = completion.choices[0].message;
            const toolCalls = choice.tool_calls;

            if (toolCalls && toolCalls.length) {
                chatMessages.push({
                    role: 'assistant',
                    content: choice.content || '',
                    tool_calls: toolCalls
                });

                for (const tc of toolCalls) {
                    const name = tc.function && tc.function.name;
                    let resultContent = 'OK';

                    if (name === 'schedule_meeting') {
                        let args = {};
                        try { args = JSON.parse(tc.function.arguments || '{}'); } catch (e) { /* ignore */ }
                        const meeting = await this.scheduleMeeting(conversation, args.suggestedTime);
                        if (meeting && meeting.success !== false && meeting.meetingLink) {
                            meetingLink = meeting.meetingLink;
                            conversation.meetingScheduled = true;
                            conversation.meetingDetails = meeting;
                            resultContent = `REUNIÃO_AGENDADA: ${meeting.meetingLink}`;
                        } else {
                            resultContent = 'REUNIÃO_NAO_AGENDADA';
                        }
                        intentType = 'schedule_meeting';
                    } else if (name === 'escalate_to_human') {
                        conversation.transferRequested = true;
                        await this.notifyOwner(conversation);
                        resultContent = 'ESCALADO_PARA_HUMANO';
                        intentType = 'talk_human';
                    } else if (name === 'flag_qualified_lead') {
                        let args = {};
                        try { args = JSON.parse(tc.function.arguments || '{}'); } catch (e) { /* ignore */ }
                        if (!conversation.qualified) {
                            conversation.qualified = true;
                            await sendOwnerAlert(`✅ Lead qualificado: ${conversation.leadName}\nTelefone: ${conversation.leadPhone || '-'}\nPrecisa de: ${args.needSummary || '-'}`);
                        }
                        resultContent = 'LEAD_MARCADO_QUALIFICADO';
                        intentType = 'qualified';
                    } else if (name === 'request_price_authorization') {
                        let args = {};
                        try { args = JSON.parse(tc.function.arguments || '{}'); } catch (e) { /* ignore */ }
                        conversation.pendingAuthorization = { kind: 'price', question: args.question || '', createdAt: new Date() };
                        await sendOwnerAlert(
                            `💰 Autorização de valor pedida\nLead: ${conversation.leadName}\nTelefone: ${conversation.leadPhone || '-'}\nPergunta: ${args.question || '-'}\n\nResponda a ESTA mensagem (reply) informando qual valor posso negociar.`,
                            { leadId: conversation.leadId, kind: 'price' }
                        );
                        resultContent = 'AGUARDANDO_AUTORIZACAO_DE_VALOR — NÃO informe nenhum número ao lead neste turno.';
                        intentType = 'price_authorization_requested';
                    } else if (name === 'request_close_confirmation') {
                        let args = {};
                        try { args = JSON.parse(tc.function.arguments || '{}'); } catch (e) { /* ignore */ }
                        conversation.pendingAuthorization = { kind: 'close', dealSummary: args.dealSummary || '', createdAt: new Date() };
                        await sendOwnerAlert(
                            `🤝 Pedido de confirmação de fechamento\nLead: ${conversation.leadName}\nTelefone: ${conversation.leadPhone || '-'}\nNegociando: ${args.dealSummary || '-'}\n\nResponda a ESTA mensagem (reply) para confirmar. A conversa foi passada para controle humano.`,
                            { leadId: conversation.leadId, kind: 'close' }
                        );
                        conversation.humanControlled = true;
                        conversation.status = 'human_takeover';
                        resultContent = 'TRANSFERIDO_PARA_HUMANO — diga ao lead que vai transferir a conversa para o responsável (Ricardo Othuki), sem confirmar nenhum acordo.';
                        intentType = 'close_confirmation_requested';
                    }

                    chatMessages.push({
                        role: 'tool',
                        tool_call_id: tc.id,
                        content: resultContent
                    });
                }

                // Segunda chamada: gerar a mensagem final natural com o resultado da ferramenta
                const finalCompletion = await this.openai.chat.completions.create({ ...base, messages: chatMessages });
                choice = finalCompletion.choices[0].message;
            }

            const reply = (choice.content || '').trim() || this.getFallbackReply(intentType, conversation);
            return { reply, intent: intentType, meetingLink };
        } catch (error) {
            console.error('Erro em generateTurn:', error.message);
            const intent = await this.analyzeIntent(leadMessageText, conversation);
            return { reply: this.getFallbackReply(intent.type, conversation), intent: intent.type };
        }
    }

    /**
     * Resposta de contingência (sem IA ou erro de API)
     */
    getFallbackReply(intentType, conversation) {
        const name = conversation.leadName;
        const concealIdentity = conversation.origin === 'radar';
        const map = concealIdentity ? {
            schedule_meeting: `Perfeito, ${name}! Consigo te ajudar a organizar isso. Me passa um horário que funcione pra você? 📅`,
            talk_human: `Claro, ${name}! Já vou te colocar em contato com quem pode te ajudar melhor com isso. 📞`,
            interested: `Que ótimo, ${name}! Me conta um pouco mais sobre o que você precisa?`,
            questions: `Boa pergunta! Deixa eu confirmar isso certinho e já te retorno.`,
            not_interested: `Entendo perfeitamente, ${name}. Qualquer coisa, é só chamar! 👋`,
            positive_response: `Fico feliz, ${name}! Me conta um pouco mais sobre o que você precisa?`
        } : {
            schedule_meeting: `Perfeito, ${name}! Vou agendar nossa reunião de 15 min via Google Meet e já te envio o link. 📅`,
            talk_human: `Claro, ${name}! Vou te conectar com um de nossos especialistas agora. 📞`,
            interested: `Que ótimo, ${name}! Que tal agendarmos uma reunião rápida para eu mostrar como a Othuki pode ajudar? 📅`,
            questions: `Boa pergunta! Posso esclarecer isso na nossa reunião de 15 min. Quer agendar? 📅`,
            not_interested: `Entendo perfeitamente, ${name}. Se mudar de ideia, estamos por aqui. Tenha um ótimo dia! 👋`,
            positive_response: `Fico feliz, ${name}! Que tal agendarmos uma reunião rápida? 📅`
        };
        return map[intentType] || map.positive_response;
    }

    /**
     * Notifica o time humano quando um lead é escalado
     */
    async notifyOwner(conversation) {
        console.log(`📞 Lead ${conversation.leadName} escalado para atendimento humano`);
        const ownerPhone = process.env.OWNER_NOTIFY_PHONE;
        if (ownerPhone && this.whatsapp.provider !== 'simulation') {
            try {
                await this.whatsapp.sendMessage(
                    ownerPhone,
                    `🔔 Novo lead para atendimento humano: ${conversation.leadName} (${conversation.leadPhone || 'sem telefone'}). Acompanhe no painel de conversas.`
                );
            } catch (e) {
                console.error('Falha ao notificar dono:', e.message);
            }
        }
    }

    /**
     * Analisa a intenção da mensagem do lead
     */
    async analyzeIntent(message, conversation) {
        if (!this.openai) {
            return this.analyzeIntentLocal(message);
        }

        const prompt = `Analise esta mensagem do lead e identifique a intenção:

MENSAGEM: "${message}"
CONTEXTO: Lead ${conversation.leadName}, conversa no passo ${conversation.currentStep}

INTENÇÕES POSSÍVEIS:
1. schedule_meeting - Lead quer agendar reunião
2. talk_human - Lead quer falar com atendente humano
3. interested - Lead demonstra interesse mas não agenda
4. questions - Lead tem dúvidas
5. not_interested - Lead não tem interesse
6. no_response - Lead não respondeu
7. positive_response - Resposta positiva genérica

Responda APENAS com um JSON:
{
  "type": "tipo_da_intencao",
  "confidence": 0.95,
  "suggestedTime": "horario_sugerido se aplicavel"
}`;

        try {
            const completion = await this.openai.chat.completions.create({
                model: getModel(),
                messages: [
                    {
                        role: "system",
                        content: "Analise a intenção do lead e responda APENAS com JSON válido."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 200,
                temperature: 0.3,
                reasoning_effort: 'none'
            });

            const response = completion.choices[0].message.content;
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.error('Error analyzing intent:', error);
        }

        return this.analyzeIntentLocal(message);
    }

    /**
     * Análise local de intenção (fallback)
     */
    analyzeIntentLocal(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('agendar') || lowerMessage.includes('reunião') || 
            lowerMessage.includes('meet') || lowerMessage.includes('horário') ||
            lowerMessage.includes('marcar') || lowerMessage.includes('data')) {
            return { type: 'schedule_meeting', confidence: 0.9 };
        }
        
        if (lowerMessage.includes('humano') || lowerMessage.includes('pessoa') || 
            lowerMessage.includes('atendente') || lowerMessage.includes('ligar') ||
            lowerMessage.includes('telefone')) {
            return { type: 'talk_human', confidence: 0.9 };
        }
        
        if (lowerMessage.includes('interess') || lowerMessage.includes('quero') || 
            lowerMessage.includes('sim') || lowerMessage.includes('ok') ||
            lowerMessage.includes('bora') || lowerMessage.includes('vamos')) {
            return { type: 'interested', confidence: 0.8 };
        }
        
        if (lowerMessage.includes('não') || lowerMessage.includes('nao') || 
            lowerMessage.includes('obrigad') || lowerMessage.includes('depois') ||
            lowerMessage.includes('no momento')) {
            return { type: 'not_interested', confidence: 0.8 };
        }
        
        if (lowerMessage.includes('?') || lowerMessage.includes('como') || 
            lowerMessage.includes('quanto') || lowerMessage.includes('quais')) {
            return { type: 'questions', confidence: 0.7 };
        }
        
        return { type: 'positive_response', confidence: 0.5 };
    }

    /**
     * Gera resposta baseada na intenção
     */
    async generateResponse(intent, conversation, originalMessage) {
        const profile = getProfile();
        const language = profile.preferences.language || 'portuguese';

        const responseTemplates = {
            schedule_meeting: {
                portuguese: `Perfeito! Vou agendar uma reunião rápida de 15 minutos via Google Meet para mostrarmos como a Othuki pode ajudar o ${conversation.leadName}.\n\n📅 Que tal amanhã às 10h ou 15h? Ou prefere outro horário?\n\nAssim que confirmar, vou enviar o link do Google Meet! 🎥`,
                english: `Perfect! I'll schedule a quick 15-minute meeting via Google Meet to show how Othuki can help ${conversation.leadName}.\n\n📅 How about tomorrow at 10am or 3pm? Or do you prefer another time?\n\nOnce confirmed, I'll send the Google Meet link! 🎥`
            },
            talk_human: {
                portuguese: `Claro! Vou transferir você para um de nossos especialistas agora mesmo.\n\n📞 Você pode falar diretamente com nossa equipe pelo WhatsApp: ${profile.business.phone}\n\nOu se preferir, posso agendar uma reunião online para uma conversa mais detalhada. 📅`,
                english: `Of course! I'll transfer you to one of our specialists right now.\n\n📞 You can talk directly with our team on WhatsApp: ${profile.business.phone}\n\nOr if you prefer, I can schedule an online meeting for a more detailed conversation. 📅`
            },
            interested: {
                portuguese: `Que ótimo! Fico feliz com seu interesse! 😊\n\nPara mostrar exatamente como podemos ajudar o ${conversation.leadName}, que tal agendar uma reunião rápida de 15 min?\n\n🎯 É sem compromisso e vou mostrar:\n• Cases de sucesso similares ao seu negócio\n• Como aumentar suas vendas com IA\n• Orçamento personalizado\n\nPosso agendar? 📅`,
                english: `That's great! I'm glad you're interested! 😊\n\nTo show exactly how we can help ${conversation.leadName}, how about scheduling a quick 15-min meeting?\n\n🎯 It's no commitment and I'll show you:\n• Success stories similar to your business\n• How to increase your sales with AI\n• Personalized quote\n\nCan I schedule? 📅`
            },
            questions: {
                portuguese: `Ótima pergunta! Vou esclarecer isso para você.\n\n${this.getAnswerForQuestion(originalMessage, language)}\n\nQuer que eu agende uma reunião para explicar em mais detalhes? Posso mostrar tudo no Google Meet em 15 minutos! 🎥`,
                english: `Great question! Let me clarify that for you.\n\n${this.getAnswerForQuestion(originalMessage, language)}\n\nWould you like me to schedule a meeting to explain in more detail? I can show everything on Google Meet in 15 minutes! 🎥`
            },
            not_interested: {
                portuguese: `Entendo perfeitamente! Sem pressa. 😊\n\nSe mudar de ideia no futuro, estou aqui para ajudar.\n\nTenha um ótimo dia! 👋`,
                english: `I completely understand! No rush. 😊\n\nIf you change your mind in the future, I'm here to help.\n\nHave a great day! 👋`
            },
            positive_response: {
                portuguese: `Fico feliz! 😊\n\nPara aproveitarmos melhor seu tempo, que tal agendar uma reunião rápida de 15 min?\n\nPosso mostrar como a Othuki pode ajudar o ${conversation.leadName} a crescer com:\n• Site de alta performance\n• Automação com IA\n• Tráfego pago que converte\n\n📅 Que tal amanhã?`,
                english: `I'm happy! 😊\n\nTo make better use of your time, how about scheduling a quick 15-min meeting?\n\nI can show how Othuki can help ${conversation.leadName} grow with:\n• High-performance website\n• AI automation\n• Converting paid traffic\n\n📅 How about tomorrow?`
            }
        };

        const template = responseTemplates[intent.type] || responseTemplates.positive_response;
        const message = template[language] || template.portuguese;

        return {
            message: message,
            intent: intent.type
        };
    }

    /**
     * Respostas para perguntas comuns
     */
    getAnswerForQuestion(question, language) {
        const lowerQuestion = question.toLowerCase();

        if (language === 'portuguese') {
            if (lowerQuestion.includes('preço') || lowerQuestion.includes('valor') || lowerQuestion.includes('quanto')) {
                return 'Nossos valores são personalizados para cada negócio. Em uma reunião rápida, posso entender suas necessidades e apresentar a melhor opção com orçamento transparente.';
            }
            if (lowerQuestion.includes('prazo') || lowerQuestion.includes('tempo')) {
                return 'Um site profissional fica pronto em 7-15 dias. Automações com IA podem estar funcionando em 24-48 horas.';
            }
            if (lowerQuestion.includes('como') || lowerQuestion.includes('funciona')) {
                return 'Trabalhamos com as melhores tecnologias do mercado. Em uma reunião, mostro na prática como tudo funciona para o seu negócio.';
            }
            return 'Tenho todas as respostas! Em uma reunião rápida de 15 min, posso esclarecer tudo e mostrar como podemos ajudar.';
        } else {
            if (lowerQuestion.includes('price') || lowerQuestion.includes('cost') || lowerQuestion.includes('how much')) {
                return 'Our prices are personalized for each business. In a quick meeting, I can understand your needs and present the best option with transparent pricing.';
            }
            if (lowerQuestion.includes('time') || lowerQuestion.includes('long')) {
                return 'A professional website is ready in 7-15 days. AI automations can be running in 24-48 hours.';
            }
            if (lowerQuestion.includes('how') || lowerQuestion.includes('work')) {
                return 'We work with the best technologies on the market. In a meeting, I can show you practically how everything works for your business.';
            }
            return 'I have all the answers! In a quick 15-min meeting, I can clarify everything and show how we can help.';
        }
    }

    /**
     * Agenda reunião no Google Calendar
     */
    async scheduleMeeting(conversation, suggestedTime) {
        const profile = getProfile();
        const language = profile.preferences.language || 'portuguese';

        try {
            // Garante que a integração está inicializada (define simulationMode / auth)
            if (!this.calendarInitialized) {
                await this.calendar.initialize();
                this.calendarInitialized = true;
            }

            const meeting = await this.calendar.createMeeting({
                summary: language === 'portuguese' 
                    ? `Reunião Othuki - ${conversation.leadName}`
                    : `Othuki Meeting - ${conversation.leadName}`,
                description: language === 'portuguese'
                    ? `Reunião de prospecção com ${conversation.leadName}\n\nTelefone: ${conversation.leadPhone}\n\nObjetivo: Apresentar soluções da Othuki`
                    : `Prospecting meeting with ${conversation.leadName}\n\nPhone: ${conversation.leadPhone}\n\nObjective: Present Othuki solutions`,
                attendeeEmail: null, // Será coletado durante a reunião
                durationMinutes: 15,
                suggestedTime: suggestedTime
            });

            console.log(`📅 Reunião agendada: ${meeting.meetingLink}`);
            return meeting;
        } catch (error) {
            console.error('Error scheduling meeting:', error);
            return {
                success: false,
                error: error.message,
                meetingLink: null
            };
        }
    }

    /**
     * Assume o controle humano de uma conversa (pausa respostas automáticas da IA)
     */
    async takeover(leadId) {
        const conversation = await conversationStore.getConversation(leadId);
        if (!conversation) return null;

        conversation.humanControlled = true;
        if (conversation.status !== 'completed') {
            conversation.status = 'human_takeover';
        }
        conversation.lastActivity = new Date();
        await conversationStore.saveConversation(conversation);

        console.log(`🧑‍💼 Humano assumiu o controle da conversa com ${conversation.leadName}`);
        return conversation;
    }

    /**
     * Devolve o controle à IA
     */
    async releaseControl(leadId) {
        const conversation = await conversationStore.getConversation(leadId);
        if (!conversation) return null;

        conversation.humanControlled = false;
        if (conversation.status === 'human_takeover') {
            conversation.status = 'in_progress';
        }
        conversation.lastActivity = new Date();
        await conversationStore.saveConversation(conversation);

        console.log(`🤖 IA retomou o controle da conversa com ${conversation.leadName}`);
        return conversation;
    }

    /**
     * Envia uma mensagem manualmente (humano assumindo o atendimento)
     */
    async sendManualMessage(leadId, message, senderName = 'Atendente') {
        const conversation = await conversationStore.getConversation(leadId);
        if (!conversation) return null;

        message = (message || '').toString().trim();
        if (!message) {
            throw new Error('Mensagem vazia');
        }

        conversation.messages.push({
            type: 'outbound',
            source: 'human',
            senderName,
            content: message,
            timestamp: new Date()
        });

        const sendTarget = conversation.testTarget || { value: conversation.leadPhone, isGroup: !!conversation.isGroup };
        const sendResult = await this.whatsapp.sendMessage(sendTarget.value, message, { isGroup: !!sendTarget.isGroup });

        if (sendResult.success) {
            conversation.lastActivity = new Date();
        } else {
            conversation.messages[conversation.messages.length - 1].error = sendResult.error;
        }

        // Ao enviar manualmente, a conversa passa a ser controlada pelo humano
        conversation.humanControlled = true;
        if (conversation.status === 'completed') {
            conversation.status = 'in_progress';
        } else if (conversation.status !== 'human_takeover') {
            conversation.status = 'human_takeover';
        }
        await conversationStore.saveConversation(conversation);

        return conversation;
    }

    /**
     * Sincroniza uma mensagem enviada fora do painel (ex: WhatsApp Web)
     * para manter o histórico do painel alinhado sem acionar IA.
     */
    async recordHumanOutboundMessage(leadId, message, { senderName = 'WhatsApp Web', externalMessageId } = {}) {
        const conversation = await conversationStore.getConversation(leadId);
        if (!conversation) return null;

        const content = (message || '').toString().trim();
        if (!content) throw new Error('Mensagem vazia');

        const alreadyRecorded = (conversation.messages || []).some(item => {
            if (externalMessageId && item.externalMessageId === externalMessageId) return true;
            if (item.type !== 'outbound' || item.source !== 'human') return false;
            const sameContent = (item.content || '').trim() === content;
            const itemTime = item.timestamp ? new Date(item.timestamp).getTime() : 0;
            return sameContent && itemTime && Date.now() - itemTime < 2 * 60 * 1000;
        });

        if (!alreadyRecorded) {
            conversation.messages.push({
                type: 'outbound',
                source: 'human',
                senderName,
                content,
                timestamp: new Date(),
                externalMessageId
            });
        }

        conversation.humanControlled = true;
        conversation.status = conversation.status === 'completed' ? 'in_progress' : 'human_takeover';
        conversation.lastActivity = new Date();
        await conversationStore.saveConversation(conversation);
        return conversation;
    }

    /**
     * Obtém status de todas as conversas
     */
    async getConversationsStatus() {
        const conversations = await conversationStore.listConversations();

        return {
            total: conversations.length,
            initiated: conversations.filter(c => c.status === 'initiated').length,
            awaitingApproval: conversations.filter(c => c.status === 'awaiting_approval').length,
            contacted: conversations.filter(c => c.status === 'contacted').length,
            engaged: conversations.filter(c => c.status === 'engaged').length,
            scheduling: conversations.filter(c => c.status === 'scheduling').length,
            transferring: conversations.filter(c => c.status === 'transferring').length,
            completed: conversations.filter(c => c.status === 'completed').length,
            humanControlled: conversations.filter(c => c.humanControlled).length,
            failed: conversations.filter(c => c.status === 'failed').length,
            conversations: conversations
        };
    }

    /**
     * Obtém detalhes de uma conversa específica
     */
    async getConversation(leadId) {
        return conversationStore.getConversation(leadId);
    }

    async getConversationByRadarLeadId(radarLeadId) {
        const conversations = await conversationStore.listConversations();
        return conversations.find(conversation => String(conversation.radarLeadId || '') === String(radarLeadId || '')) || null;
    }

    /**
     * Lista todas as conversas
     */
    async listConversations() {
        return conversationStore.listConversations();
    }
}

module.exports = LeadAgent;

/**
 * Base de conhecimento da Othuki Agência Digital
 *
 * Compilada a partir de business-profile.json e do site https://othuki.com.br.
 * Usada como contexto ("dados de treinamento") para o agente de prospecção,
 * para que ele fale com propriedade sobre os serviços e diferenciais reais.
 *
 * IMPORTANTE: mantenha apenas informações condizentes com o negócio real.
 * O agente é instruído a NÃO inventar dados, preços ou cases específicos.
 */

const knowledgeSources = require('./knowledgeSources');

function buildOthukiContext(profile) {
    const biz = (profile && profile.business) || {};
    const name = biz.name || 'Othuki Agência Digital';
    const description = biz.description || '';
    const location = biz.location || 'Recife, Pernambuco';
    const services = biz.services && biz.services.length
        ? biz.services
        : ['Criação de Sites', 'Automação com IA', 'Agentes de IA', 'SaaS sob medida', 'Tráfego Pago', 'SEO Local'];
    const valueProps = biz.valuePropositions && biz.valuePropositions.length
        ? biz.valuePropositions
        : [];
    const phone = biz.phone || '';
    const email = biz.email || '';
    const website = biz.website || 'https://othuki.com.br';

    const serviceDetails = [
        {
            nome: 'Criação de Sites de Alta Performance',
            dor: 'Site lento, feio ou que não converte visitantes em clientes.',
            beneficio: 'Sites rápidos (PageSpeed otimizado), responsivos e focados em conversão, com identidade da marca.'
        },
        {
            nome: 'Automação com IA para Atendimento',
            dor: 'Equipe pequena não dá conta de responder todos os contatos a tempo e perde vendas.',
            beneficio: 'Atendimento 24/7 que qualifica leads e responde dúvidas com IA, liberando a equipe.'
        },
        {
            nome: 'Agentes de IA para Vendas',
            dor: 'Limitar o crescimento ao tamanho da equipe comercial.',
            beneficio: 'Agentes de IA que escalam o atendimento e a qualificação de leads sem aumentar o time.'
        },
        {
            nome: 'SaaS sob Medida',
            dor: 'Processos manuais ou ideias de produto digital sem validação.',
            beneficio: 'Desenvolvimento de SaaS/plataformas sob medida para validar e vender ideias digitais.'
        },
        {
            nome: 'Tráfego Pago e Landing Pages',
            dor: 'Falta de clientes novos previsíveis.',
            beneficio: 'Campanhas de tráfego pago com landing pages otimizadas que convertem visitantes em oportunidades.'
        },
        {
            nome: 'SEO Local e Performance',
            dor: 'O negócio não aparece nas buscas locais.',
            beneficio: 'SEO local para dominar as buscas em ' + location + ' e atrair clientes próximos.'
        }
    ];

    const faq = [
        { q: 'Quanto custa?', a: 'O investimento é personalizado conforme o serviço e o tamanho do projeto. O agente deve conduzir para uma reunião de diagnóstico para apresentar proposta transparente.' },
        { q: 'Vocês atendem fora de Recife?', a: 'Sim. O trabalho é digital e remoto; o foco geográfico é Recife/PE, mas atendem negócios em todo o Brasil.' },
        { q: 'Qual o prazo?', a: 'Sites profissionais costumam ficar prontos em cerca de 7 a 15 dias; automações com IA podem entrar em operação em 24 a 48 horas.' }
    ];

    const serviceBlock = serviceDetails.map(s =>
        `- ${s.nome}: dor típica → ${s.dor} benefício → ${s.beneficio}`
    ).join('\n');

    const faqBlock = faq.map(f => `  P: ${f.q} R: ${f.a}`).join('\n');
    const extra = knowledgeSources.get();
    const extraBlock = extra ? `\n\n=== BASE DE CONHECIMENTO EXTRA (colada pelo operador) ===\n${extra}` : '';

    return `=== SOBRE A OTHUKI AGÊNCIA DIGITAL ===
Nome: ${name}
Descrição: ${description}
Localização: ${location}
Site: ${website}
Contato: ${phone} | ${email}

=== SERVIÇOS (com dor que resolvem e benefício) ===
${serviceBlock}

=== PROPOSTA DE VALOR ===
${valueProps.map(v => '- ' + v).join('\n')}

=== FAQ / OBJEÇÕES COMUNS ===
${faqBlock}

=== REGRAS DE VERACIDADE ===
- Nunca invente preços, prazos, cases ou números específicos que não constem acima.
- Se o lead perguntar algo muito específico técnico ou comercial que você não sabe, proponha falar com um humano ou agendar reunião.
- Seja consultivo: entenda o contexto do negócio do lead antes de empurrar solução.${extraBlock}`;
}

module.exports = { buildOthukiContext };

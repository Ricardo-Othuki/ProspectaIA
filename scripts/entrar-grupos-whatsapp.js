#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');
const puppeteer = require('puppeteer');

const raiz = path.resolve(__dirname, '..');
const arquivoPadrao = path.join(raiz, 'vault', 'Pesquisa de Grupos Publicos - Radar Othuki.md');
const perfilPadrao = path.join(raiz, '.browser-data', 'radar-grupos');

function parseArgs(argv) {
    const args = {
        arquivo: arquivoPadrao,
        limite: 2,
        perfil: perfilPadrao,
        navegador: 'firefox',
        urls: []
    };

    for (let i = 0; i < argv.length; i += 1) {
        const atual = argv[i];
        const proximo = argv[i + 1];

        if (atual === '--arquivo' && proximo) {
            args.arquivo = path.resolve(proximo);
            i += 1;
        } else if (atual === '--limite' && proximo) {
            args.limite = Number.parseInt(proximo, 10);
            i += 1;
        } else if (atual === '--perfil' && proximo) {
            args.perfil = path.resolve(proximo);
            i += 1;
        } else if (atual === '--navegador' && proximo) {
            args.navegador = proximo;
            i += 1;
        } else if (atual === '--url' && proximo) {
            args.urls.push(proximo);
            i += 1;
        } else if (atual === '--help' || atual === '-h') {
            imprimirAjuda();
            process.exit(0);
        }
    }

    if (!Number.isFinite(args.limite) || args.limite < 1) {
        args.limite = 2;
    }

    return args;
}

function imprimirAjuda() {
    console.log(`
Uso:
  node scripts/entrar-grupos-whatsapp.js --limite 2
  node scripts/entrar-grupos-whatsapp.js --url https://gruposwhats.app/group/872980 --url https://gruposwhats.app/group/868359

Opcoes:
  --arquivo CAMINHO  Markdown com a pesquisa de grupos.
  --limite NUMERO   Quantidade maxima de grupos a abrir.
  --perfil CAMINHO  Pasta do perfil persistente do navegador.
  --navegador MODO   firefox, sistema ou puppeteer. Padrao: firefox.

Observacao:
  A automacao nao burla Turnstile nem confirma entrada no WhatsApp sem voce.
  No modo firefox/sistema, ela abre a fila no navegador real e pausa entre links.
  No modo puppeteer, ela usa Chromium automatizado, que pode falhar no Turnstile.
`.trim());
}

function extrairUrlsDoMarkdown(arquivo) {
    if (!fs.existsSync(arquivo)) {
        throw new Error(`Arquivo nao encontrado: ${arquivo}`);
    }

    const conteudo = fs.readFileSync(arquivo, 'utf8');
    const encontrados = conteudo.match(/https:\/\/gruposwhats\.app\/group\/\d+/g) || [];
    return Array.from(new Set(encontrados));
}

function perguntar(rl, pergunta) {
    return new Promise(resolve => rl.question(pergunta, resposta => resolve(resposta.trim())));
}

async function instalarPainel(page, indice, total, url, etapa) {
    await page.evaluate(({ indiceAtual, totalGeral, fonte, etapa }) => {
        const anterior = document.getElementById('radar-othuki-painel');
        if (anterior) anterior.remove();

        const painel = document.createElement('div');
        painel.id = 'radar-othuki-painel';
        painel.style.cssText = [
            'position:fixed',
            'z-index:2147483647',
            'left:16px',
            'bottom:16px',
            'max-width:420px',
            'padding:14px 16px',
            'border-radius:10px',
            'background:#101828',
            'color:white',
            'box-shadow:0 16px 48px rgba(16,24,40,.22)',
            'font:14px/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'
        ].join(';');
        painel.innerHTML = `
            <strong>Radar Othuki ${indiceAtual}/${totalGeral}</strong>
            <div style="margin-top:6px;color:#d0d5dd">${etapa}</div>
            <div style="margin-top:8px;word-break:break-all;color:#98a2b3">${fonte}</div>
        `;
        document.body.appendChild(painel);
    }, { indiceAtual: indice, totalGeral: total, fonte: url, etapa });
}

async function clicarBotaoEntrar(page) {
    const seletores = [
        'button.btn-join-group',
        'button[data-group-id]',
        'form[action*="join-group-verify"] button[type="submit"]',
        'a[href*="/group/"]'
    ];

    for (const seletor of seletores) {
        const elemento = await page.$(seletor);
        if (elemento) {
            await elemento.click().catch(() => null);
            return true;
        }
    }

    return false;
}

async function temFormularioProtegido(page) {
    return page.evaluate(() => Boolean(
        document.querySelector('form.turnstile-protected-form')
            || document.querySelector('input[name="cf-turnstile-response"]')
            || document.querySelector('.cf-turnstile-mount')
    ));
}

async function lerTokenTurnstile(page) {
    return page.evaluate(() => {
        const input = document.querySelector('input[name="cf-turnstile-response"]');
        return input && input.value ? input.value : '';
    });
}

async function processarGrupo(browser, rl, url, indice, total) {
    const page = await browser.newPage();
    page.setDefaultTimeout(15000);
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const protegido = await temFormularioProtegido(page);
    if (protegido) {
        await instalarPainel(
            page,
            indice,
            total,
            url,
            'Resolva a verificacao Turnstile primeiro. Depois volte ao terminal e pressione Enter para eu clicar em "Entrar no Grupo".'
        );
        console.log(`Tentativa ${indice}/${total}: ${url}`);
        await perguntar(rl, 'Resolva o Turnstile no navegador. Depois pressione Enter para clicar em Entrar no Grupo... ');

        const token = await lerTokenTurnstile(page);
        if (!token) {
            console.log('Turnstile ainda nao gerou token. Vou deixar a pagina aberta para clique manual.');
            await instalarPainel(
                page,
                indice,
                total,
                url,
                'O token Turnstile ainda nao apareceu. Clique manualmente em "Entrar no Grupo" ou tente recarregar a verificacao.'
            );
        } else {
            await instalarPainel(
                page,
                indice,
                total,
                url,
                'Token detectado. Vou clicar em "Entrar no Grupo"; confirme a entrada no WhatsApp se ele abrir.'
            );
            await clicarBotaoEntrar(page);
        }
    } else {
        await instalarPainel(
            page,
            indice,
            total,
            url,
            'Vou tentar clicar em "Entrar no Grupo". Confirme a entrada no WhatsApp se ele abrir.'
        );
        const clicou = await clicarBotaoEntrar(page);
        if (clicou) {
            console.log(`Abrindo tentativa ${indice}/${total}: ${url}`);
        } else {
            console.log(`Nao encontrei botao automatico em ${url}. A pagina ficou aberta para acao manual.`);
        }
    }

    await perguntar(
        rl,
        'Finalize no navegador. Pressione Enter aqui para ir ao proximo grupo... '
    );
}

function abrirNoNavegadorReal(navegador, url) {
    const comando = navegador === 'firefox' ? 'firefox' : 'xdg-open';
    const args = navegador === 'firefox' ? ['--new-tab', url] : [url];
    const processo = spawn(comando, args, {
        detached: true,
        stdio: 'ignore'
    });
    processo.unref();
}

async function processarGrupoNavegadorReal(rl, navegador, url, indice, total) {
    console.log(`Abrindo ${indice}/${total} no ${navegador}: ${url}`);
    abrirNoNavegadorReal(navegador, url);
    await perguntar(
        rl,
        'Resolva Turnstile/WhatsApp no navegador real. Pressione Enter aqui para ir ao proximo grupo... '
    );
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const urls = (args.urls.length > 0 ? args.urls : extrairUrlsDoMarkdown(args.arquivo)).slice(0, args.limite);

    if (urls.length === 0) {
        throw new Error('Nenhuma URL de grupo foi encontrada.');
    }

    fs.mkdirSync(args.perfil, { recursive: true });

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (args.navegador === 'firefox' || args.navegador === 'sistema') {
        try {
            console.log(`Fila preparada com ${urls.length} grupo(s). Modo: ${args.navegador}`);
            for (let i = 0; i < urls.length; i += 1) {
                await processarGrupoNavegadorReal(rl, args.navegador, urls[i], i + 1, urls.length);
            }
        } finally {
            rl.close();
        }
        return;
    }

    const browser = await puppeteer.launch({
        headless: false,
        userDataDir: args.perfil,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    try {
        console.log(`Fila preparada com ${urls.length} grupo(s). Perfil do navegador: ${args.perfil}`);
        for (let i = 0; i < urls.length; i += 1) {
            await processarGrupo(browser, rl, urls[i], i + 1, urls.length);
        }
    } finally {
        rl.close();
        await browser.close();
    }
}

main().catch(error => {
    console.error(`Falha na automacao: ${error.message}`);
    process.exit(1);
});

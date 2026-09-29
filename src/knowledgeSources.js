/**
 * Knowledge Sources - texto extra (colado pelo operador, ex.: conteúdo do
 * site othuki.com.br ou de outros links) usado para complementar o
 * conhecimento embutido em knowledge.js. Armazenamento local simples,
 * mesmo padrão de settingsStore.js.
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(process.cwd(), 'data', 'knowledge-extra.txt');
const MAX_LENGTH = 8000;

function get() {
    try {
        if (fs.existsSync(FILE)) return fs.readFileSync(FILE, 'utf8');
    } catch (error) {
        console.error('Falha ao ler base de conhecimento extra:', error.message);
    }
    return '';
}

function save(text) {
    const content = String(text || '').slice(0, MAX_LENGTH);
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    const temporaryPath = `${FILE}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(temporaryPath, content, { mode: 0o600 });
    fs.renameSync(temporaryPath, FILE);
    return content;
}

module.exports = { get, save, MAX_LENGTH };

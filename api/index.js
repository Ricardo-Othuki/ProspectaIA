/**
 * Ponto de entrada serverless (Vercel) — só reexporta o app Express já
 * existente. Toda a lógica fica em src/web/server.js; aqui não duplicamos
 * nada, para o comportamento local (npm run web) e o de produção serem
 * sempre o mesmo código.
 */
module.exports = require('../src/web/server');

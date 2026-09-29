/**
 * Events - barramento simples em memória (EventEmitter) para notificações
 * em tempo real no painel: módulos de backend (leadAgent, leadRadar) emitem
 * aqui, e src/web/server.js escuta e repassa via SSE (já usado pelo painel).
 */

const { EventEmitter } = require('events');

const events = new EventEmitter();
events.setMaxListeners(50);

module.exports = events;

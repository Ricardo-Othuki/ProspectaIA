const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { FlowSimulationRunner } = require('./src/flowSimulationRunner');

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'flow-simulation-'));
const runner = new FlowSimulationRunner({ outputDirectory: directory });
const report = runner.run();

assert.strictEqual(report.success, true);
assert.strictEqual(report.safety.confirmed, true);
assert.strictEqual(report.safety.externalEffects.networkRequests, 0);
assert.strictEqual(report.safety.externalEffects.messagesSent, 0);
assert.strictEqual(report.summary.leadsDiscovered, 2);
assert.strictEqual(report.summary.leadsQualified, 1);
assert.ok(report.summary.monitoring.some(item => item.status === 'sugestao' && item.sent === false));
assert.ok(report.summary.monitoring.some(item => item.reason === 'not_allowed'));
assert.ok(report.summary.monitoring.some(item => item.reason === 'from_me'));
assert.ok(report.summary.monitoring.some(item => item.reason === 'duplicate'));
assert.strictEqual(report.summary.reviewedSend.delivered, false);
assert.strictEqual(fs.existsSync(report.reportPath), true);
assert.throws(() => runner.run('invalido'), /Cenário de simulação inválido/);

fs.rmSync(directory, { recursive: true, force: true });
console.log('Testes de simulação de fluxo aprovados');

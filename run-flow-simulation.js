const { FlowSimulationRunner } = require('./src/flowSimulationRunner');

try {
    const scenario = process.argv[2] || 'padrao';
    const report = new FlowSimulationRunner().run(scenario);
    console.log(`Simulação: ${report.scenario.name}`);
    console.log(`Resultado: ${report.success ? 'aprovada' : 'reprovada'}`);
    console.log(`Leads: ${report.summary.leadsDiscovered} descobertos, ${report.summary.leadsQualified} qualificados`);
    console.log(`Monitoramento: ${report.summary.monitoring.length} eventos processados sem envio automático`);
    console.log(`Segurança: ${report.safety.confirmed ? 'nenhum efeito externo confirmado' : 'falha de isolamento'}`);
    console.log(`Relatório: ${report.reportPath}`);
    if (!report.success) process.exitCode = 1;
} catch (error) {
    console.error(`Falha na simulação: ${error.message}`);
    process.exitCode = 1;
}

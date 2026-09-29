const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { SettingsStore, DEFAULTS } = require('./src/settingsStore');

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'settings-store-'));
const filePath = path.join(directory, 'settings.json');
const store = new SettingsStore(filePath);

async function run() {
    assert.deepStrictEqual(await store.get(), DEFAULTS);

    const saved = await store.update({
        campaign: { industry: 'Marketing', language: 'portuguese', resultLimit: 40 },
        generation: { model: 'gpt-test', multiTouch: true }
    });
    assert.strictEqual(saved.campaign.industry, 'Marketing');
    assert.strictEqual(saved.campaign.resultLimit, 40);
    assert.strictEqual(saved.generation.model, 'gpt-test');
    assert.strictEqual(saved.generation.multiTouch, true);
    assert.strictEqual(fs.existsSync(filePath), true);
    assert.strictEqual((await new SettingsStore(filePath).get()).campaign.industry, 'Marketing');

    await assert.rejects(() => store.update({ campaign: { resultLimit: 0 } }), error => Boolean(error.fields.resultLimit));
    await assert.rejects(() => store.update({ campaign: { language: 'unsupported' } }), error => Boolean(error.fields['campaign.language']));

    fs.rmSync(directory, { recursive: true, force: true });
    console.log('Settings store tests passed');
}

run().catch(error => {
    fs.rmSync(directory, { recursive: true, force: true });
    console.error(error);
    process.exit(1);
});

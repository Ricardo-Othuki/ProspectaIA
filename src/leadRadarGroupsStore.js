/**
 * Lead Radar Groups Store - configuração local (não é dado de negócio) de
 * quais grupos de WhatsApp ficam de fora da varredura do radar de leads.
 */

const fs = require('fs');
const path = require('path');

class LeadRadarGroupsStore {
    constructor(filePath = path.join(process.cwd(), 'data', 'lead-radar-groups.json')) {
        this.filePath = filePath;
        this.excluded = new Set(this.load());
    }

    load() {
        try {
            if (fs.existsSync(this.filePath)) {
                const raw = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
                return Array.isArray(raw.excludedGroupIds) ? raw.excludedGroupIds : [];
            }
        } catch (error) {
            console.error('Falha ao carregar grupos excluídos do radar:', error.message);
        }
        return [];
    }

    persist() {
        fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
        const temporaryPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
        fs.writeFileSync(temporaryPath, `${JSON.stringify({ excludedGroupIds: Array.from(this.excluded) }, null, 2)}\n`, { mode: 0o600 });
        fs.renameSync(temporaryPath, this.filePath);
    }

    isExcluded(groupId) {
        return this.excluded.has(groupId);
    }

    exclude(groupId) {
        this.excluded.add(groupId);
        this.persist();
    }

    include(groupId) {
        this.excluded.delete(groupId);
        this.persist();
    }

    listExcluded() {
        return Array.from(this.excluded);
    }
}

module.exports = { LeadRadarGroupsStore };

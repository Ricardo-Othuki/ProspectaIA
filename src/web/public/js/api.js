// ═══════════════════════════════════════════════════════════
// API Communication Layer
// ═══════════════════════════════════════════════════════════

class API {
    constructor() {
        this.baseURL = '';
        this.eventSource = null;
    }

    // Generic request
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/api${endpoint}`;
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error — server may be offline');
            }
            throw error;
        }
    }

    // ─── API Endpoints ──────────────────────────────────────
    async getDashboard() { return this.request('/dashboard'); }
    async getCampaigns() { return this.request('/campaigns'); }
    async getCampaignDetail(id) { return this.request(`/campaigns/${id}`); }
    async getLeads(campaignId, page = 1, limit = 100) {
        return this.request(`/campaigns/${campaignId}/leads?page=${page}&limit=${limit}`);
    }
    async getAnalytics() { return this.request('/analytics'); }
    async getHealth() { return this.request('/health'); }
    async logout() { return this.request('/auth/logout', { method: 'POST' }); }

    async createCampaign(data) {
        return this.request('/campaigns', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // ─── Agent / Conversations ──────────────────────────────
    async getSettings() { return this.request('/settings'); }
    async saveSettings(settings) { return this.request('/settings', { method: 'PUT', body: JSON.stringify({ settings }) }); }
    async generateRadarNiche(payload) { return this.request('/settings/radar-niches/generate', { method: 'POST', body: JSON.stringify(payload) }); }
    async rewriteRadarNicheField(payload) { return this.request('/settings/radar-niches/rewrite-field', { method: 'POST', body: JSON.stringify(payload) }); }
    async saveProfile(profile) { return this.request('/settings/profile', { method: 'PUT', body: JSON.stringify({ profile }) }); }
    async saveKnowledgeExtra(text) { return this.request('/settings/knowledge', { method: 'PUT', body: JSON.stringify({ text }) }); }
    async getSimulationScenarios() { return this.request('/simulations/scenarios'); }
    async runSimulation(scenario = 'padrao') { return this.request('/simulations/run', { method: 'POST', body: JSON.stringify({ scenario }) }); }
    async getMonitoringStatus(token) { return this.request('/agent/monitoring/status', { headers: { 'x-whatsapp-monitoring-token': token } }); }
    async addMonitoringTarget(token, target) { return this.request('/agent/monitoring/targets', { method: 'POST', headers: { 'x-whatsapp-monitoring-token': token }, body: JSON.stringify(target) }); }
    async removeMonitoringTarget(token, target) { return this.request('/agent/monitoring/targets', { method: 'DELETE', headers: { 'x-whatsapp-monitoring-token': token }, body: JSON.stringify(target) }); }
    async registerMonitoringWebhook(token, url) { return this.request('/agent/monitoring/webhook/register', { method: 'POST', headers: { 'x-whatsapp-monitoring-token': token }, body: JSON.stringify({ url }) }); }
    async getConversations() {
        const result = await this.request('/agent/conversations');
        return result.conversations || [];
    }
    async getConversation(id) {
        const result = await this.request(`/agent/conversations/${encodeURIComponent(id)}`);
        return result.conversation;
    }
    async previewRemarketing(leadIds, message) {
        return this.request('/agent/remarketing/preview', {
            method: 'POST',
            body: JSON.stringify({ leadIds, message })
        });
    }
    async takeoverConversation(id) {
        return this.request('/agent/takeover', {
            method: 'POST',
            body: JSON.stringify({ leadId: id })
        });
    }
    async releaseConversation(id) {
        return this.request('/agent/release', {
            method: 'POST',
            body: JSON.stringify({ leadId: id })
        });
    }
    async sendManualMessage(id, message, senderName) {
        return this.request('/agent/manual-message', {
            method: 'POST',
            body: JSON.stringify({ leadId: id, message, senderName })
        });
    }
    async approveMessage(id, payload = {}) {
        return this.request(`/agent/messages/${id}/approve`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }
    async discardMessage(id) {
        return this.request(`/agent/messages/${id}/discard`, { method: 'POST' });
    }

    // ─── Lead Radar ──────────────────────────────────────────
    async getRadarGroups() { return this.request('/lead-radar/groups'); }
    async excludeRadarGroup(groupId) { return this.request(`/lead-radar/groups/${encodeURIComponent(groupId)}/exclude`, { method: 'POST' }); }
    async includeRadarGroup(groupId) { return this.request(`/lead-radar/groups/${encodeURIComponent(groupId)}/exclude`, { method: 'DELETE' }); }
    async scanRadar(sinceDays = 7) { return this.request('/lead-radar/scan', { method: 'POST', body: JSON.stringify({ sinceDays }) }); }
    async getRadarLeads(filters = {}) {
        const params = new URLSearchParams();
        if (filters.since) params.set('since', filters.since);
        if (filters.priority) params.set('priority', filters.priority);
        if (filters.groupId) params.set('groupId', filters.groupId);
        if (filters.status) params.set('status', filters.status);
        if (filters.nicheId) params.set('nicheId', filters.nicheId);
        const qs = params.toString();
        return this.request(`/lead-radar/leads${qs ? `?${qs}` : ''}`);
    }
    async setRadarLeadStatus(id, status) {
        return this.request(`/lead-radar/leads/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) });
    }
    async contactRadarLead(id) {
        return this.request(`/lead-radar/leads/${id}/contact`, { method: 'POST', body: JSON.stringify({}) });
    }
    async setRadarAutoScan(enabled) {
        return this.request('/lead-radar/auto-scan', { method: 'POST', body: JSON.stringify({ enabled }) });
    }
    formatNumber(num) {
        if (num === null || num === undefined) return '0';
        const n = Number(num);
        if (isNaN(n)) return '0';
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return n.toLocaleString();
    }

    formatDateSafe(dateStr) {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '-';
            return date.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '-';
        }
    }

    safeString(value, fallback = '-') {
        const text = value === null || value === undefined || value === '' ? fallback : String(value);
        return text.replace(/[&<>'"]/g, character => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[character]));
    }

    parseNumericValue(value) {
        if (value === null || value === undefined) return null;
        if (typeof value === 'number') return value;
        const parsed = parseFloat(String(value));
        return isNaN(parsed) ? null : parsed;
    }

    getScoreCategory(score) {
        if (score >= 85) return 'A+';
        if (score >= 75) return 'A';
        if (score >= 65) return 'B';
        if (score >= 50) return 'C';
        return 'D';
    }

    getScoreColor(score) {
        if (score >= 85) return '#10b981';
        if (score >= 75) return '#22d3ee';
        if (score >= 65) return '#6366f1';
        if (score >= 50) return '#f59e0b';
        return '#ef4444';
    }

    getPriorityColor(priority) {
        const colors = {
            'HIGH': '#10b981',
            'MEDIUM': '#f59e0b',
            'LOW': '#ef4444'
        };
        return colors[priority] || '#64748b';
    }

    handleError(error, context = '') {
        const message = error.message || 'An unexpected error occurred';
        console.error(`Error ${context}:`, error);
        
        if (typeof showNotification === 'function') {
            showNotification('Error', `${context ? context + ': ' : ''}${message}`, 'error');
        }
    }
}

// ─── Initialize ─────────────────────────────────────────────
const api = new API();

// ═══════════════════════════════════════════════════════════
// Main Dashboard Application
// ═══════════════════════════════════════════════════════════

class Dashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.monitoringAdminToken = '';
        this.dashboardData = null;
        this.campaigns = [];
        this.currentCampaign = null;
        this.leadsTable = null;
        this.progressManager = null;
        this.alerts = [];
        this.currentRadarLead = null;
        this.currentRadarLeads = [];
        this.radarSettings = { autoScanEnabled: true, activeNicheId: '', niches: [] };
        this.currentRadarNicheId = '';

        this.init();
    }

    async init() {
        this.initTheme();
        this.setupEventListeners();
        this.setupMobileNav();
        this.setupAlertBell();
        this.setupRealTimeUpdates();
        this.progressManager = new ProgressManager('campaignProgressModal');
        
        await this.loadDashboard();
        await this.loadCampaigns();
        this.loadContactedLeads();

        // Auto-refresh da lista de conversas enquanto a seção está aberta
        setInterval(() => {
            if (this.currentSection === 'conversations' &&
                document.activeElement?.id !== 'manualMessageInput') {
                this.loadConversations();
            }
        }, 6000);
    }

    // ─── Theme Management ───────────────────────────────────
    initTheme() {
        const saved = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = saved || (prefersDark ? 'dark' : 'dark'); // default dark
        this.setTheme(theme);

        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-theme');
                this.setTheme(current === 'light' ? 'dark' : 'light');
            });
        }
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        // Update theme-color meta
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.content = theme === 'dark' ? '#0f1117' : '#f0f2f5';
        }

        // Toggle sun/moon icons
        const moon = document.querySelector('.icon-moon');
        const sun = document.querySelector('.icon-sun');
        if (moon && sun) {
            if (theme === 'light') {
                moon.style.display = 'none';
                sun.style.display = 'block';
            } else {
                moon.style.display = 'block';
                sun.style.display = 'none';
            }
        }
    }

    // ─── Mobile Navigation ──────────────────────────────────
    setupMobileNav() {
        const hamburger = document.getElementById('hamburgerBtn');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');

        if (hamburger) {
            hamburger.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                overlay.classList.toggle('active');
            });
        }

        if (overlay) {
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            });
        }

        // Bottom nav items
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                if (section) this.showSection(section);
            });
        });
    }

    closeMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
    }

    // ─── Event Listeners ────────────────────────────────────
    setupEventListeners() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try { await api.logout(); } catch (error) { /* cookie may already be gone */ }
                window.location.href = '/login';
            });
        }
        // Sidebar navigation
        document.querySelectorAll('.sidebar .nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                if (section) this.showSection(section);
            });
        });

        const batchRemarketingButton = document.getElementById('batchRemarketingBtn');
        if (batchRemarketingButton) batchRemarketingButton.addEventListener('click', () => this.previewRemarketing());
        document.getElementById('contactedLeadsSearch')?.addEventListener('input', () => this.renderContactedLeads());
        document.getElementById('contactedLeadsNicheFilter')?.addEventListener('change', () => this.renderContactedLeads());
        document.getElementById('contactedLeadsStatusFilter')?.addEventListener('change', () => this.renderContactedLeads());
        document.getElementById('selectAllLeads')?.addEventListener('change', event => {
            document.querySelectorAll('.lead-checkbox').forEach(input => { input.checked = event.target.checked; });
            this.updateContactedLeadsSelection();
        });

        const contactedLeadsTable = document.getElementById('contactedLeadsTableBody');
        if (contactedLeadsTable) {
            contactedLeadsTable.addEventListener('click', event => {
                const button = event.target.closest('[data-action="open-contacted-chat"]');
                if (!button) return;
                const leadId = button.dataset.leadId;
                if (!leadId) return;
                this.showSection('conversations');
                this.selectConversation(leadId);
            });
            contactedLeadsTable.addEventListener('change', event => {
                if (event.target.matches('.lead-checkbox')) this.updateContactedLeadsSelection();
            });
        }

        const campaignSettingsForm = document.getElementById('campaignSettingsForm');
        if (campaignSettingsForm) campaignSettingsForm.addEventListener('submit', event => this.saveSettings(event));
        const profileSettingsForm = document.getElementById('profileSettingsForm');
        if (profileSettingsForm) profileSettingsForm.addEventListener('submit', event => this.saveProfileSettings(event));
        const knowledgeSettingsForm = document.getElementById('knowledgeSettingsForm');
        if (knowledgeSettingsForm) knowledgeSettingsForm.addEventListener('submit', event => this.saveKnowledgeExtra(event));
        const radarNicheForm = document.getElementById('radarNicheForm');
        if (radarNicheForm) radarNicheForm.addEventListener('submit', event => this.saveRadarNiche(event));
        const generateRadarNicheButton = document.getElementById('generateRadarNicheButton');
        if (generateRadarNicheButton) generateRadarNicheButton.addEventListener('click', () => this.generateRadarNiche());
        const rewriteRadarNicheFieldButton = document.getElementById('rewriteRadarNicheFieldButton');
        if (rewriteRadarNicheFieldButton) rewriteRadarNicheFieldButton.addEventListener('click', () => this.rewriteRadarNicheField());
        const newRadarNicheButton = document.getElementById('newRadarNicheButton');
        if (newRadarNicheButton) newRadarNicheButton.addEventListener('click', () => this.clearRadarNicheForm());
        document.querySelectorAll('.settings-subnav-item').forEach(item => {
            item.addEventListener('click', () => this.showSettingsTab(item.dataset.settingsTab));
        });
        const knowledgeExtraText = document.getElementById('knowledgeExtraText');
        if (knowledgeExtraText) knowledgeExtraText.addEventListener('input', () => { knowledgeExtraText.dataset.touched = '1'; });
        const runSimulationButton = document.getElementById('runSimulationButton');
        if (runSimulationButton) runSimulationButton.addEventListener('click', () => this.runSimulation());
        const loadMonitoringButton = document.getElementById('loadMonitoringButton');
        if (loadMonitoringButton) loadMonitoringButton.addEventListener('click', () => this.loadMonitoring());
        const monitoringTargetForm = document.getElementById('monitoringTargetForm');
        if (monitoringTargetForm) monitoringTargetForm.addEventListener('submit', event => this.addMonitoringTarget(event));
        const webhookForm = document.getElementById('webhookForm');
        if (webhookForm) webhookForm.addEventListener('submit', event => this.registerMonitoringWebhook(event));

        ['radarFilterPeriod', 'radarFilterPriority', 'radarFilterGroup', 'radarFilterStatus'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', () => this.loadRadarLeads());
        });
        const radarAlertsForm = document.getElementById('radarAlertsForm');
        if (radarAlertsForm) radarAlertsForm.addEventListener('submit', event => this.saveRadarAlertSettings(event));
        ['radarAlertWhatsappGroup', 'radarAlertTelegramChat', 'radarAlertOwnerNumber'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', () => { el.dataset.touched = '1'; });
        });
    }

    showSettingsFeedback(message, isError = false) {
        const element = document.getElementById('settingsFeedback');
        if (!element) return;
        element.textContent = message;
        element.className = `settings-feedback ${isError ? 'error' : 'success'}`;
    }

    showSettingsTab(tab) {
        if (!tab) return;
        document.querySelectorAll('.settings-subnav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.settingsTab === tab);
        });
        document.querySelectorAll('.settings-tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.dataset.settingsPanel === tab);
        });
    }

    async loadSettings() {
        try {
            const data = await api.getSettings();
            const { settings, readiness } = data;
            document.getElementById('settingIndustry').value = settings.campaign.industry;
            document.getElementById('settingStyle').value = settings.campaign.style;
            document.getElementById('settingLanguage').value = settings.campaign.language;
            document.getElementById('settingFormat').value = settings.campaign.outputFormat;
            document.getElementById('settingResultLimit').value = settings.campaign.resultLimit;
            document.getElementById('settingMinScore').value = settings.campaign.minLeadScore;
            document.getElementById('settingModel').value = settings.generation.model;
            document.getElementById('settingMaxContent').value = settings.generation.maxContentGeneration;
            document.getElementById('settingMultiTouch').checked = settings.generation.multiTouch;
            this.radarSettings = settings.radar || { autoScanEnabled: true, activeNicheId: '', niches: [] };
            this.renderRadarNiches();
            this.renderRadarNicheTabs();
            document.getElementById('profileName').value = data.profile.business?.name || '';
            document.getElementById('profileType').value = data.profile.business?.type || '';
            document.getElementById('profilePhone').value = data.profile.business?.phone || '';
            document.getElementById('profileEmail').value = data.profile.business?.email || '';
            document.getElementById('profileWebsite').value = data.profile.business?.website || '';
            document.getElementById('profileDescription').value = data.profile.business?.description || '';
            const knowledgeField = document.getElementById('knowledgeExtraText');
            if (knowledgeField && !knowledgeField.dataset.touched) knowledgeField.value = data.knowledgeExtra || '';
            document.getElementById('settingsReadiness').innerHTML = [
                ['IA', readiness.ai.configured, readiness.ai.model],
                ['WhatsApp', readiness.whatsapp.configured, readiness.whatsapp.provider],
                ['Token de monitoramento', readiness.whatsapp.monitoringAdminConfigured, 'configurado no .env'],
                ['Grupo de teste WhatsApp', Boolean(readiness.whatsapp.testGroup?.id), readiness.whatsapp.testGroup?.name || ''],
                ['Google Calendar', readiness.calendar.configured, readiness.calendar.calendarId],
                ['Supabase (conversas)', readiness.supabase?.configured, readiness.supabase?.configured ? 'conectado' : 'defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env']
            ].map(([name, ready, detail]) => `<div class="readiness-row"><strong>${api.safeString(name)}</strong><span class="${ready ? 'ready' : 'not-ready'}">${ready ? 'Pronto' : 'Pendente'}</span><small>${api.safeString(detail || '')}</small></div>`).join('');
        } catch (error) {
            this.showSettingsFeedback(error.message, true);
        }
    }

    async saveSettings(event) {
        event.preventDefault();
        try {
            const settings = {
                campaign: {
                    industry: document.getElementById('settingIndustry').value.trim(),
                    style: document.getElementById('settingStyle').value,
                    language: document.getElementById('settingLanguage').value,
                    outputFormat: document.getElementById('settingFormat').value,
                    resultLimit: Number(document.getElementById('settingResultLimit').value),
                    minLeadScore: Number(document.getElementById('settingMinScore').value)
                },
                generation: {
                    model: document.getElementById('settingModel').value.trim(),
                    maxContentGeneration: Number(document.getElementById('settingMaxContent').value),
                    multiTouch: document.getElementById('settingMultiTouch').checked
                }
            };
            await api.saveSettings(settings);
            this.showSettingsFeedback('Configurações salvas. Segredos permanecem no .env.');
            await this.loadSettings();
        } catch (error) {
            this.showSettingsFeedback(error.message, true);
        }
    }

    async saveProfileSettings(event) {
        event.preventDefault();
        try {
            const data = await api.getSettings();
            const profile = data.profile;
            profile.business = {
                ...profile.business,
                name: document.getElementById('profileName').value.trim(),
                type: document.getElementById('profileType').value.trim(),
                phone: document.getElementById('profilePhone').value.trim(),
                email: document.getElementById('profileEmail').value.trim(),
                website: document.getElementById('profileWebsite').value.trim(),
                description: document.getElementById('profileDescription').value.trim()
            };
            const result = await api.saveProfile(profile);
            this.showSettingsFeedback(result.warnings?.length ? `Perfil salvo com avisos: ${result.warnings.join(' ')}` : 'Perfil do negócio salvo.');
        } catch (error) {
            this.showSettingsFeedback(error.message, true);
        }
    }

    async saveKnowledgeExtra(event) {
        event.preventDefault();
        try {
            const text = document.getElementById('knowledgeExtraText').value;
            await api.saveKnowledgeExtra(text);
            document.getElementById('knowledgeExtraText')?.removeAttribute('data-touched');
            this.showSettingsFeedback('Base de conhecimento extra salva.');
        } catch (error) {
            this.showSettingsFeedback(error.message, true);
        }
    }

    splitLines(value) {
        return String(value || '').split(/\r?\n|,/).map(item => item.trim()).filter(Boolean);
    }

    joinLines(value) {
        return Array.isArray(value) ? value.join('\n') : '';
    }

    slugify(value) {
        return String(value || 'nicho')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || `nicho-${Date.now()}`;
    }

    getRadarNicheFromForm() {
        const existingId = document.getElementById('radarNicheId')?.value.trim();
        const name = document.getElementById('radarNicheName')?.value.trim() || '';
        return {
            id: existingId || this.slugify(name),
            name,
            description: document.getElementById('radarNicheDescription')?.value.trim() || '',
            offer: document.getElementById('radarNicheOffer')?.value.trim() || '',
            keywords: this.splitLines(document.getElementById('radarNicheKeywords')?.value),
            negativeKeywords: this.splitLines(document.getElementById('radarNicheNegativeKeywords')?.value),
            qualificationSignals: this.splitLines(document.getElementById('radarNicheSignals')?.value),
            complianceRules: this.splitLines(document.getElementById('radarNicheCompliance')?.value),
            initialMessageTemplate: document.getElementById('radarNicheMessage')?.value.trim() || '',
            scanEnabled: document.getElementById('radarNicheScanEnabled')?.checked !== false,
            active: document.getElementById('radarNicheActive')?.checked || false
        };
    }

    fillRadarNicheForm(niche = {}) {
        document.getElementById('radarNicheId').value = niche.id || '';
        document.getElementById('radarNicheName').value = niche.name || '';
        document.getElementById('radarNicheDescription').value = niche.description || '';
        document.getElementById('radarNicheOffer').value = niche.offer || '';
        document.getElementById('radarNicheKeywords').value = this.joinLines(niche.keywords);
        document.getElementById('radarNicheNegativeKeywords').value = this.joinLines(niche.negativeKeywords);
        document.getElementById('radarNicheSignals').value = this.joinLines(niche.qualificationSignals);
        document.getElementById('radarNicheCompliance').value = this.joinLines(niche.complianceRules);
        document.getElementById('radarNicheMessage').value = niche.initialMessageTemplate || '';
        document.getElementById('radarNicheActive').checked = Boolean(niche.active || (niche.id && niche.id === this.radarSettings.activeNicheId));
        document.getElementById('radarNicheScanEnabled').checked = niche.scanEnabled !== false;
    }

    clearRadarNicheForm() {
        this.fillRadarNicheForm({});
        document.getElementById('radarNicheActive').checked = !(this.radarSettings.niches || []).length;
    }

    renderRadarNiches() {
        const list = document.getElementById('radarNichesList');
        if (!list) return;
        const niches = this.radarSettings.niches || [];
        list.innerHTML = niches.length ? niches.map(niche => `
            <div class="radar-niche-item">
                <div>
                    <strong>${api.safeString(niche.name)}</strong>
                    <small>${niche.scanEnabled === false ? 'Scan pausado' : 'Scan ativo'} · ${niche.id === this.radarSettings.activeNicheId ? 'Nicho principal' : 'Secundário'} · ${api.safeString((niche.keywords || []).slice(0, 4).join(', '))}</small>
                </div>
                <div class="radar-niche-actions">
                    <button class="btn btn-secondary btn-sm" type="button" data-edit-niche="${api.safeString(niche.id)}">Editar</button>
                    <button class="btn btn-secondary btn-sm" type="button" data-activate-niche="${api.safeString(niche.id)}">Ativar</button>
                    <button class="btn btn-danger btn-sm" type="button" data-delete-niche="${api.safeString(niche.id)}">Remover</button>
                </div>
            </div>
        `).join('') : '<p class="settings-help">Nenhum nicho configurado ainda.</p>';
        list.querySelectorAll('[data-edit-niche]').forEach(button => button.addEventListener('click', () => {
            const niche = niches.find(item => item.id === button.dataset.editNiche);
            if (niche) this.fillRadarNicheForm(niche);
        }));
        list.querySelectorAll('[data-activate-niche]').forEach(button => button.addEventListener('click', () => this.activateRadarNiche(button.dataset.activateNiche)));
        list.querySelectorAll('[data-delete-niche]').forEach(button => button.addEventListener('click', () => this.deleteRadarNiche(button.dataset.deleteNiche)));
    }

    async saveRadarNiche(event) {
        event.preventDefault();
        try {
            const niche = this.getRadarNicheFromForm();
            if (!niche.name || !niche.keywords.length) throw new Error('Informe nome e ao menos uma palavra-chave.');
            const niches = [...(this.radarSettings.niches || []).filter(item => item.id !== niche.id), niche];
            const activeNicheId = niche.active ? niche.id : (this.radarSettings.activeNicheId || niches[0]?.id || '');
            const radar = { ...this.radarSettings, activeNicheId, niches: niches.map(item => ({ ...item, active: item.id === activeNicheId })) };
            const result = await api.saveSettings({ radar });
            this.radarSettings = result.settings.radar;
            this.renderRadarNiches();
            this.renderRadarNicheTabs();
            this.showSettingsFeedback('Nicho do radar salvo.');
        } catch (error) {
            this.showSettingsFeedback(error.message, true);
        }
    }

    async activateRadarNiche(id) {
        try {
            const radar = {
                ...this.radarSettings,
                activeNicheId: id,
                niches: (this.radarSettings.niches || []).map(niche => ({ ...niche, active: niche.id === id }))
            };
            const result = await api.saveSettings({ radar });
            this.radarSettings = result.settings.radar;
            this.renderRadarNiches();
            this.renderRadarNicheTabs();
            this.showSettingsFeedback('Nicho ativo atualizado.');
        } catch (error) {
            this.showSettingsFeedback(error.message, true);
        }
    }

    async deleteRadarNiche(id) {
        try {
            const niches = (this.radarSettings.niches || []).filter(niche => niche.id !== id);
            const activeNicheId = this.radarSettings.activeNicheId === id ? (niches[0]?.id || '') : this.radarSettings.activeNicheId;
            const radar = { ...this.radarSettings, activeNicheId, niches: niches.map(niche => ({ ...niche, active: niche.id === activeNicheId })) };
            const result = await api.saveSettings({ radar });
            this.radarSettings = result.settings.radar;
            this.renderRadarNiches();
            this.renderRadarNicheTabs();
            this.clearRadarNicheForm();
            this.showSettingsFeedback('Nicho removido.');
        } catch (error) {
            this.showSettingsFeedback(error.message, true);
        }
    }

    async rewriteRadarNicheField() {
        const button = document.getElementById('rewriteRadarNicheFieldButton');
        try {
            const field = document.getElementById('radarNicheRewriteField')?.value || '';
            const instruction = document.getElementById('radarNicheRewritePrompt')?.value.trim() || '';
            if (!instruction) throw new Error('Informe a regra/prompt para recriar o campo.');
            if (button) { button.disabled = true; button.textContent = 'Recriando...'; }
            const result = await api.rewriteRadarNicheField({
                niche: this.getRadarNicheFromForm(),
                field,
                instruction
            });
            this.applyRadarNicheField(result.field, result.value);
            this.showSettingsFeedback('Campo recriado. Revise e salve o nicho.');
        } catch (error) {
            this.showSettingsFeedback(error.message, true);
        } finally {
            if (button) { button.disabled = false; button.textContent = 'Recriar campo com IA'; }
        }
    }

    applyRadarNicheField(field, value) {
        const map = {
            name: 'radarNicheName',
            description: 'radarNicheDescription',
            offer: 'radarNicheOffer',
            keywords: 'radarNicheKeywords',
            negativeKeywords: 'radarNicheNegativeKeywords',
            qualificationSignals: 'radarNicheSignals',
            complianceRules: 'radarNicheCompliance',
            initialMessageTemplate: 'radarNicheMessage'
        };
        const element = document.getElementById(map[field]);
        if (!element) return;
        element.value = Array.isArray(value) ? this.joinLines(value) : String(value || '');
    }

    async generateRadarNiche() {
        const button = document.getElementById('generateRadarNicheButton');
        try {
            if (button) { button.disabled = true; button.textContent = 'Gerando...'; }
            const payload = {
                topic: document.getElementById('radarNicheGenerateTopic')?.value.trim() || document.getElementById('radarNicheName')?.value.trim() || '',
                product: document.getElementById('radarNicheOffer')?.value.trim() || '',
                audience: document.getElementById('radarNicheAudience')?.value.trim() || ''
            };
            const result = await api.generateRadarNiche(payload);
            this.fillRadarNicheForm({ ...result.niche, active: !(this.radarSettings.niches || []).length });
            this.showSettingsFeedback('Sugestão gerada. Revise e salve para ativar no radar.');
        } catch (error) {
            this.showSettingsFeedback(error.message, true);
        } finally {
            if (button) { button.disabled = false; button.textContent = 'Gerar com IA'; }
        }
    }

    async runSimulation() {
        try {
            const scenario = document.getElementById('simulationScenario').value;
            const data = await api.runSimulation(scenario);
            const report = data.report;
            document.getElementById('simulationReport').innerHTML = `<p><strong>${report.success ? 'Simulação aprovada' : 'Simulação reprovada'}</strong></p><p>${report.summary.leadsDiscovered} leads descobertos, ${report.summary.leadsQualified} qualificados e ${report.summary.monitoring.length} eventos monitorados.</p><p>Segurança: ${report.safety.confirmed ? 'nenhum efeito externo ocorreu.' : 'falha de isolamento detectada.'}</p><p class="settings-help">Relatório salvo em ${api.safeString(report.reportPath)}</p>`;
            this.showSettingsFeedback('Simulação concluída com dados fictícios.');
        } catch (error) {
            this.showSettingsFeedback(error.message, true);
        }
    }

    getMonitoringToken() {
        this.monitoringAdminToken = document.getElementById('monitoringToken')?.value || '';
        return this.monitoringAdminToken;
    }

    async loadMonitoring() {
        try {
            const data = await api.getMonitoringStatus(this.getMonitoringToken());
            document.getElementById('monitoringStatus').innerHTML = `<p>Evolution: <strong>${data.provider.connected ? 'conectada' : 'não confirmada'}</strong></p>`;
            const targets = [...data.monitoring.phones, ...data.monitoring.groups];
            document.getElementById('monitoringTargets').innerHTML = targets.length
                ? targets.map(target => `<div class="monitoring-target"><code>${api.safeString(target)}</code><button class="btn btn-danger btn-sm" data-target="${encodeURIComponent(target)}">Remover</button></div>`).join('')
                : '<p class="settings-help">Nenhum contato ou grupo permitido.</p>';
            document.querySelectorAll('#monitoringTargets button').forEach(button => button.addEventListener('click', () => this.removeMonitoringTarget(decodeURIComponent(button.dataset.target))));
        } catch (error) {
            this.showSettingsFeedback(error.message, true);
        }
    }

    async addMonitoringTarget(event) {
        event.preventDefault();
        try {
            const value = document.getElementById('monitoringTarget').value.trim();
            const payload = value.toLowerCase().endsWith('@g.us') ? { groupId: value } : { phone: value };
            await api.addMonitoringTarget(this.getMonitoringToken(), payload);
            document.getElementById('monitoringTarget').value = '';
            this.showSettingsFeedback('Alvo adicionado ao monitoramento.');
            await this.loadMonitoring();
        } catch (error) {
            this.showSettingsFeedback(error.message, true);
        }
    }

    async removeMonitoringTarget(value) {
        try {
            const payload = value.toLowerCase().endsWith('@g.us') ? { groupId: value } : { phone: value };
            await api.removeMonitoringTarget(this.getMonitoringToken(), payload);
            this.showSettingsFeedback('Alvo removido do monitoramento.');
            await this.loadMonitoring();
        } catch (error) {
            this.showSettingsFeedback(error.message, true);
        }
    }

    async registerMonitoringWebhook(event) {
        event.preventDefault();
        try {
            await api.registerMonitoringWebhook(this.getMonitoringToken(), document.getElementById('webhookUrl').value.trim());
            this.showSettingsFeedback('Webhook registrado na Evolution API.');
        } catch (error) {
            this.showSettingsFeedback(error.message, true);
        }
    }

    // ─── Section Navigation ─────────────────────────────────
    showSection(sectionName) {
        this.currentSection = sectionName;

        // Update sidebar active state
        document.querySelectorAll('.sidebar .nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === sectionName);
        });

        // Update bottom nav active state
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === sectionName);
        });

        // Show/hide sections with animation
        document.querySelectorAll('.section').forEach(section => {
            const isTarget = section.id === `section-${sectionName}`;
            section.classList.toggle('active', isTarget);
            if (isTarget) {
                // Re-trigger animation
                section.style.animation = 'none';
                section.offsetHeight; // force reflow
                section.style.animation = '';
            }
        });

        // Close mobile menu
        this.closeMobileMenu();

        // Load section data
        if (sectionName === 'settings') this.loadSettings();
        if (sectionName === 'analytics') this.loadAnalytics();
        if (sectionName === 'leads') this.loadLeadsSection();
        if (sectionName === 'campaigns') this.loadCampaigns();
        if (sectionName === 'conversations') this.loadConversations();
        if (sectionName === 'contacted-leads') this.loadContactedLeads();
    }

    escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
    }

    contactedLeadStatus(status) {
        const labels = {
            initiated: 'Iniciado',
            contacted: 'Contatado',
            in_progress: 'Em andamento',
            human_takeover: 'Atendimento humano',
            scheduling: 'Em agendamento',
            qualified: 'Qualificado',
            completed: 'Concluído',
            closed: 'Encerrado',
            awaiting_approval: 'Aguardando aprovação'
        };
        return labels[status] || 'Sem status';
    }

    formatContactedLeadDate(value) {
        if (!value) return 'Sem atividade';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? 'Sem atividade' : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    }

    populateContactedLeadFilters(settings = {}) {
        const configuredNiches = (settings.radar?.niches || []).map(niche => ({ id: niche.id, name: niche.name })).filter(niche => niche.id && niche.name);
        const contactNiches = this.contactedLeads.map(lead => ({ id: lead.nicheId || lead.nicheName, name: lead.nicheName })).filter(niche => niche.id && niche.name);
        const niches = [...new Map([...configuredNiches, ...contactNiches].map(niche => [niche.id, niche])).values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        const statuses = [...new Set(this.contactedLeads.map(lead => lead.status).filter(Boolean))].sort();
        const nicheFilter = document.getElementById('contactedLeadsNicheFilter');
        const statusFilter = document.getElementById('contactedLeadsStatusFilter');
        const selectedNiche = nicheFilter?.value || '';
        const selectedStatus = statusFilter?.value || '';
        if (nicheFilter) nicheFilter.innerHTML = `<option value="">Todos os nichos</option>${niches.map(niche => `<option value="${this.escapeHtml(niche.id)}">${this.escapeHtml(niche.name)}</option>`).join('')}`;
        if (statusFilter) statusFilter.innerHTML = `<option value="">Todos os status</option>${statuses.map(status => `<option value="${this.escapeHtml(status)}">${this.contactedLeadStatus(status)}</option>`).join('')}`;
        if (nicheFilter) nicheFilter.value = selectedNiche;
        if (statusFilter) statusFilter.value = selectedStatus;
    }

    renderContactedLeads() {
        const tableBody = document.getElementById('contactedLeadsTableBody');
        if (!tableBody) return;
        const query = document.getElementById('contactedLeadsSearch')?.value.trim().toLowerCase() || '';
        const niche = document.getElementById('contactedLeadsNicheFilter')?.value || '';
        const status = document.getElementById('contactedLeadsStatusFilter')?.value || '';
        const visible = (this.contactedLeads || []).filter(lead => {
            const searchable = `${lead.leadName || ''} ${lead.leadPhone || ''} ${lead.nicheName || ''}`.toLowerCase();
            return (!query || searchable.includes(query)) && (!niche || lead.nicheId === niche || lead.nicheName === niche) && (!status || lead.status === status);
        });
        const count = document.getElementById('contactedLeadsCount');
        if (count) count.textContent = `${visible.length} ${visible.length === 1 ? 'lead' : 'leads'}`;
        tableBody.innerHTML = visible.length ? visible.map(lead => `
            <tr>
                <td><input type="checkbox" value="${this.escapeHtml(lead.leadId)}" class="lead-checkbox" aria-label="Selecionar ${this.escapeHtml(lead.leadName)}" /></td>
                <td><strong>${this.escapeHtml(lead.leadName || 'Sem nome')}</strong><small>${this.escapeHtml(lead.leadPhone || 'Sem telefone')}</small></td>
                <td>${this.escapeHtml(lead.nicheName || 'Não informado')}</td>
                <td><span class="lead-status lead-status-${this.escapeHtml(lead.status || 'unknown')}">${this.contactedLeadStatus(lead.status)}</span></td>
                <td>${this.formatContactedLeadDate(lead.lastActivity)}</td>
                <td><button class="btn btn-secondary" data-lead-id="${this.escapeHtml(lead.leadId)}" data-action="open-contacted-chat">Abrir chat</button></td>
            </tr>
        `).join('') : '<tr><td colspan="6" class="empty-state">Nenhum lead corresponde aos filtros selecionados.</td></tr>';
        this.updateContactedLeadsSelection();
    }

    updateContactedLeadsSelection() {
        const selected = document.querySelectorAll('.lead-checkbox:checked').length;
        const label = document.getElementById('contactedLeadsSelection');
        if (label) label.textContent = selected ? `${selected} ${selected === 1 ? 'lead selecionado' : 'leads selecionados'} para simulação` : 'Nenhum lead selecionado';
    }

    async loadContactedLeads() {
        const tableBody = document.getElementById('contactedLeadsTableBody');
        if (!tableBody) return;
        try {
            const conversations = await api.getConversations();
            this.contactedLeads = conversations.filter(conversation => conversation.status !== 'initiated' || conversation.humanControlled || conversation.messages?.length > 0);
            const settings = await api.getSettings().catch(() => ({}));
            this.populateContactedLeadFilters(settings);
            this.renderContactedLeads();
        } catch (error) {
            tableBody.innerHTML = '<tr><td colspan="6" class="empty-state">Não foi possível carregar os leads contatados.</td></tr>';
            console.error('Erro ao carregar leads contatados:', error);
        }
    }

    async previewRemarketing() {
        const message = document.getElementById('remarketingMessage')?.value.trim();
        const preview = document.getElementById('remarketingPreview');
        const leadIds = Array.from(document.querySelectorAll('.lead-checkbox:checked')).map(input => input.value);
        if (!message || !leadIds.length) {
            this.showNotification('Selecione ao menos um lead e escreva a mensagem.', 'warning');
            return;
        }
        try {
            const result = await api.previewRemarketing(leadIds, message);
            preview.innerHTML = `<p><strong>Simulação: nenhuma mensagem foi enviada.</strong></p>${result.preview.map(item => `<div class="card p-3 mt-2"><strong>${this.escapeHtml(item.leadName)}</strong><p>${this.escapeHtml(item.message)}</p></div>`).join('')}`;
        } catch (error) {
            this.showNotification(error.message || 'Não foi possível gerar a simulação.', 'error');
        }
    }

    // ─── Real-Time Updates (SSE) ────────────────────────────
    // Atualizações "em tempo quase real" por polling em vez de SSE — SSE não
    // funciona de forma confiável em produção serverless (cada invocação é
    // isolada), então usamos um único caminho (polling) que funciona igual
    // local e em produção.
    setupRealTimeUpdates() {
        this._lastEventTimestamp = null;
        this._pollRealTimeUpdates();
    }

    async _pollRealTimeUpdates() {
        try {
            const qs = this._lastEventTimestamp ? `?since=${encodeURIComponent(this._lastEventTimestamp)}` : '';
            const result = await api.request(`/events/poll${qs}`);
            (result.events || []).forEach(evt => {
                this._lastEventTimestamp = evt.created_at;
                this.handleSSEEvent(evt.payload || { type: evt.type });
            });
            if (result.events && result.events.length) {
                if (this.currentSection === 'conversations') this.loadConversations();
                if (this.currentSection === 'lead-radar') this.loadRadarLeads();
            }
        } catch (e) {
            // silencioso — tenta de novo no próximo ciclo
        } finally {
            setTimeout(() => this._pollRealTimeUpdates(), 8000);
        }
    }

    handleSSEEvent(data) {
        switch (data.type) {
            case 'campaign_started':
                showNotification('Campaign Started', data.message, 'info');
                break;
            case 'campaign_progress':
                if (this.progressManager) {
                    this.progressManager.updateProgress(data.progress, data.message);
                }
                break;
            case 'campaign_completed':
                showNotification('Campaign Complete', data.message, 'success');
                if (this.progressManager) {
                    this.progressManager.complete(data.results);
                }
                this.loadDashboard();
                this.loadCampaigns();
                break;
            case 'campaign_failed':
                showNotification('Campaign Failed', data.message, 'error');
                if (this.progressManager) {
                    this.progressManager.error(data.message);
                }
                break;
            case 'notification':
                this.pushAlert(data);
                if (data.kind === 'draft_ready') this.loadConversations();
                if (data.kind === 'radar_lead') this.loadRadarLeads();
                break;
        }
    }

    // ═══════════════════════════════════════════════════════
    // ALERT BELL (notificações visuais + sonoras)
    // ═══════════════════════════════════════════════════════

    setupAlertBell() {
        const bellBtn = document.getElementById('alertBellBtn');
        const dropdown = document.getElementById('alertBellDropdown');
        const clearBtn = document.getElementById('alertBellClear');
        if (bellBtn && dropdown) {
            bellBtn.addEventListener('click', event => {
                event.stopPropagation();
                dropdown.classList.toggle('open');
                if (dropdown.classList.contains('open')) this.markAlertsRead();
            });
            document.addEventListener('click', event => {
                if (!dropdown.contains(event.target) && event.target !== bellBtn) dropdown.classList.remove('open');
            });
        }
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.alerts = [];
                this.renderAlertBell();
            });
        }
    }

    pushAlert(data) {
        const titles = {
            draft_ready: '📝 Rascunho pronto',
            radar_lead: '🎯 Lead detectado no radar'
        };
        const messages = {
            draft_ready: `${data.leadName}: "${data.preview || ''}"`,
            radar_lead: `${data.leadName || 'Alguém'} em "${data.groupName || 'grupo'}": ${data.summary || ''}`
        };

        const alert = {
            id: Date.now() + Math.random(),
            kind: data.kind,
            priority: data.priority,
            leadId: data.leadId || null,
            title: titles[data.kind] || 'Notificação',
            message: messages[data.kind] || '',
            timestamp: new Date(),
            read: false
        };

        this.alerts.unshift(alert);
        if (this.alerts.length > 30) this.alerts.length = 30;

        this.renderAlertBell(true);
        this.playAlertSound();
        showNotification(alert.title, alert.message, data.kind === 'draft_ready' ? 'warning' : 'info');
    }

    markAlertsRead() {
        this.alerts.forEach(a => { a.read = true; });
        this.renderAlertBell();
    }

    renderAlertBell(justArrived = false) {
        const badge = document.getElementById('alertBellBadge');
        const bell = document.getElementById('alertBellBtn');
        const list = document.getElementById('alertBellList');
        const unread = this.alerts.filter(a => !a.read).length;

        if (badge) {
            badge.style.display = unread > 0 ? 'flex' : 'none';
            badge.textContent = unread > 9 ? '9+' : String(unread);
        }
        if (bell && justArrived) {
            bell.classList.remove('has-new');
            void bell.offsetWidth;
            bell.classList.add('has-new');
        }
        if (list) {
            list.innerHTML = this.alerts.length
                ? this.alerts.map(a => `
                    <button class="alert-item ${a.priority ? `priority-${a.priority}` : ''} kind-${a.kind}" onclick="dashboard.openAlert('${a.id}')">
                        <span class="alert-item-title">${api.safeString(a.title)}</span>
                        <span>${api.safeString(a.message)}</span>
                        <span class="alert-item-meta">${api.formatDateSafe(a.timestamp)}</span>
                    </button>
                `).join('')
                : '<p class="empty-message">Nenhuma notificação ainda.</p>';
        }
    }

    async openAlert(alertId) {
        const alert = this.alerts.find(item => String(item.id) === String(alertId));
        if (!alert) return;
        alert.read = true;
        this.renderAlertBell();
        document.getElementById('alertBellDropdown')?.classList.remove('open');

        if (alert.kind === 'draft_ready') {
            this.showSection('conversations');
            if (alert.leadId) await this.selectConversation(alert.leadId);
            return;
        }

        if (alert.kind === 'radar_lead') {
            this.showSection('lead-radar');
        }
    }

    playAlertSound() {
        try {
            const ctx = this._audioCtx || (this._audioCtx = new (window.AudioContext || window.webkitAudioContext)());
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.setValueAtTime(660, ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.connect(gain).connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
        } catch (error) {
            // Áudio pode ser bloqueado até o usuário interagir com a página — silencioso.
        }
    }

    // ═══════════════════════════════════════════════════════
    // DATA LOADING
    // ═══════════════════════════════════════════════════════

    async loadDashboard() {
        try {
            const data = await api.getDashboard();
            this.dashboardData = data;
            this.renderDashboard(data);
        } catch (error) {
            api.handleError(error, 'loading dashboard');
        }
    }

    async loadCampaigns() {
        try {
            const campaigns = await api.getCampaigns();
            this.campaigns = campaigns;
            this.renderCampaigns(campaigns);
            this.updateCampaignSelect(campaigns);
            
            // Update campaign count badge
            const badge = document.getElementById('campaignCount');
            if (badge) badge.textContent = campaigns.length;
        } catch (error) {
            api.handleError(error, 'loading campaigns');
        }
    }

    async loadLeadsSection() {
        // Just make sure the campaign select is populated
        if (this.campaigns.length === 0) {
            await this.loadCampaigns();
        }
    }

    async loadLeadsForCampaign(campaignId) {
        if (!campaignId) return;
        
        const container = document.getElementById('leadsTableContainer');
        container.innerHTML = '<div class="loading">Loading leads...</div>';

        try {
            const data = await api.getLeads(campaignId);
            this.currentCampaign = campaignId;
            this.renderLeadsTable(data.leads || [], campaignId);
            
            // Show export button
            const exportBtn = document.getElementById('exportVCardBtn');
            if (exportBtn) exportBtn.style.display = '';
        } catch (error) {
            api.handleError(error, 'loading leads');
            container.innerHTML = '<div class="card" style="text-align:center;padding:2rem"><p class="empty-title">Failed to load leads</p></div>';
        }
    }

    async loadAnalytics() {
        try {
            const data = await api.getAnalytics();
            this.renderAnalytics(data);
        } catch (error) {
            api.handleError(error, 'loading analytics');
        }
    }

    // ═══════════════════════════════════════════════════════
    // RENDERING
    // ═══════════════════════════════════════════════════════

    renderDashboard(data) {
        const { overview, recentActivity } = data;

        // Stat cards
        const statsGrid = document.getElementById('statsGrid');
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Total Campaigns</span>
                    <div class="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>
                    </div>
                </div>
                <div class="stat-value">${api.formatNumber(overview.totalCampaigns)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Total Leads</span>
                    <div class="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                </div>
                <div class="stat-value">${api.formatNumber(overview.totalLeads)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Priority Leads</span>
                    <div class="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    </div>
                </div>
                <div class="stat-value">${api.formatNumber(overview.totalPriorityLeads)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Avg Score</span>
                    <div class="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    </div>
                </div>
                <div class="stat-value">${overview.averageScore}</div>
            </div>
        `;

        // Recent activity
        const activityList = document.getElementById('activityList');
        if (recentActivity && recentActivity.length > 0) {
            activityList.innerHTML = recentActivity.map(activity => `
                <div class="activity-item" onclick="dashboard.showCampaignDetail('${activity.id}')">
                    <div class="activity-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>
                    </div>
                    <div class="activity-info">
                        <div class="activity-name">${api.safeString(activity.name)}</div>
                        <div class="activity-meta">${api.safeString(activity.industry)} · ${api.formatDateSafe(activity.executedAt)}</div>
                    </div>
                    <div class="activity-stats">
                        <span class="activity-stat">${activity.totalLeads} leads</span>
                        <span class="activity-stat highlight">${activity.priorityLeads} priority</span>
                    </div>
                </div>
            `).join('');
        } else {
            activityList.innerHTML = `
                <div class="card" style="text-align:center; padding:2rem">
                    <p class="empty-title">No campaigns yet</p>
                    <p class="empty-message">Create your first campaign to get started</p>
                </div>
            `;
        }
    }

    renderCampaigns(campaigns) {
        const grid = document.getElementById('campaignsGrid');

        if (!campaigns || campaigns.length === 0) {
            grid.innerHTML = `
                <div class="card" style="text-align:center; padding:3rem; grid-column:1/-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="48" height="48" style="opacity:0.3;margin-bottom:1rem"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>
                    <p class="empty-title">No Campaigns</p>
                    <p class="empty-message">Launch your first campaign to start generating leads</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = campaigns.map(campaign => {
            const status = campaign.results ? 'completed' : 'running';
            return `
                <div class="campaign-card" onclick="dashboard.showCampaignDetail('${campaign.id}')">
                    <div class="campaign-card-header">
                        <span class="campaign-card-title">${api.safeString(campaign.name)}</span>
                        <span class="campaign-card-badge ${status}">${status}</span>
                    </div>
                    <div class="campaign-card-meta">
                        <span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            ${api.formatDateSafe(campaign.executedAt)}
                        </span>
                        <span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                            ${api.safeString(campaign.industry)} · ${api.safeString(campaign.location || '')}
                        </span>
                    </div>
                    <div class="campaign-card-stats">
                        <div class="campaign-stat">
                            <div class="campaign-stat-value">${api.formatNumber(campaign.results?.totalLeads || 0)}</div>
                            <div class="campaign-stat-label">Leads</div>
                        </div>
                        <div class="campaign-stat">
                            <div class="campaign-stat-value">${api.formatNumber(campaign.results?.priorityLeads || 0)}</div>
                            <div class="campaign-stat-label">Priority</div>
                        </div>
                        <div class="campaign-stat">
                            <div class="campaign-stat-value">${campaign.results?.averageScore || 0}</div>
                            <div class="campaign-stat-label">Avg Score</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderLeadsTable(leads, campaignId) {
        const container = document.getElementById('leadsTableContainer');

        if (!leads || leads.length === 0) {
            container.innerHTML = `
                <div class="card" style="text-align:center; padding:3rem">
                    <p class="empty-title">No leads found</p>
                    <p class="empty-message">This campaign has no leads data</p>
                </div>
            `;
            return;
        }

        this.leadsTable = new DataTable(container, {
            campaignId,
            columns: [
                { key: 'name', title: 'Business Name', type: 'text' },
                { key: 'phone', title: 'Phone', type: 'text' },
                { key: 'address', title: 'Address', type: 'text' },
                { key: 'rating', title: 'Rating', type: 'text' },
                { key: 'intelligence.score', title: 'Score', type: 'score' },
                { key: 'intelligence.priority', title: 'Priority', type: 'priority' },
                { key: 'actions', title: 'Actions', type: 'actions' }
            ],
            data: leads,
            pagination: true,
            pageSize: 10,
            sortable: true
        });

        this.leadsTable.render();
    }

    renderAnalytics(data) {
        const { campaignTrends, industryStats, qualityDistribution } = data;

        // Trend cards
        const trendsContainer = document.getElementById('analyticsTrends');
        trendsContainer.innerHTML = `
            <div class="trend-card">
                <div class="trend-value">${api.formatNumber(campaignTrends.totalCampaigns)}</div>
                <div class="trend-label">Total Campaigns</div>
            </div>
            <div class="trend-card">
                <div class="trend-value">${api.formatNumber(campaignTrends.recentCampaigns)}</div>
                <div class="trend-label">Last 30 Days</div>
            </div>
            <div class="trend-card">
                <div class="trend-value">${api.formatNumber(campaignTrends.totalLeads)}</div>
                <div class="trend-label">All Leads</div>
            </div>
            <div class="trend-card">
                <div class="trend-value">${campaignTrends.avgQualityScore}</div>
                <div class="trend-label">Avg Quality</div>
            </div>
        `;

        // Industry chart
        const industryContent = document.getElementById('industryChartContent');
        const industryData = Object.entries(industryStats).map(([label, stats]) => ({
            label: label.charAt(0).toUpperCase() + label.slice(1),
            value: stats.totalLeads
        }));
        SimpleChart.createBarChart(industryContent, industryData, {
            title: '',
            color: '#6366f1'
        });

        // Quality distribution chart
        const qualityContent = document.getElementById('qualityChartContent');
        const qualityData = Object.entries(qualityDistribution).map(([label, value]) => ({
            label,
            value
        }));
        SimpleChart.createPieChart(qualityContent, qualityData, { title: '' });
    }

    // ═══════════════════════════════════════════════════════
    // ═════════════════════════════════════════════════════
    // CONVERSATIONS (Agente de Prospecção)
    // ═════════════════════════════════════════════════════

    async loadConversations() {
        try {
            const conversations = await api.getConversations();
            this.renderConversations(conversations);
            const badge = document.getElementById('conversationCount');
            if (badge) badge.textContent = conversations.length || 0;
        } catch (error) {
            api.handleError(error, 'loading conversations');
        }
    }

    statusLabel(status) {
        const map = {
            initiated: 'Iniciado',
            awaiting_approval: 'Aguardando aprovação',
            contacted: 'Contatado',
            engaged: 'Engajado',
            in_progress: 'Em andamento',
            scheduling: 'Agendando',
            transferring: 'Transferindo',
            completed: 'Concluído',
            failed: 'Falhou',
            human_takeover: 'Humano'
        };
        return map[status] || status;
    }

    lastMessagePreview(c) {
        if (!c.messages || !c.messages.length) return '';
        const m = c.messages[c.messages.length - 1];
        const prefix = m.type === 'inbound' ? '' : (m.source === 'human' ? '🧑 ' : '🤖 ');
        return prefix + (m.content || '').slice(0, 60);
    }

    renderConversations(conversations) {
        const list = document.getElementById('conversationsList');
        if (!list) return;

        if (!conversations || conversations.length === 0) {
            list.innerHTML = `
                <div class="card" style="text-align:center;padding:2rem">
                    <p class="empty-title">Nenhuma conversa ainda</p>
                    <p class="empty-message">Inicie uma prospecção (outreach) para ver as conversas do agente aqui.</p>
                </div>`;
            return;
        }

        list.innerHTML = conversations.map(c => `
            <div class="conversation-item ${c.humanControlled ? 'human' : ''} ${this.currentConversationId == c.leadId ? 'active' : ''}"
                 onclick="dashboard.selectConversation('${c.leadId}')">
                <div class="conversation-item-header">
                    <span class="conversation-name">${api.safeString(c.leadName)}</span>
                    <span class="status-badge status-${c.status}">${this.statusLabel(c.status)}</span>
                </div>
                <div class="conversation-preview">${api.safeString(this.lastMessagePreview(c))}</div>
                <div class="conversation-meta">
                    ${c.humanControlled
                        ? '<span class="badge-human">🧑‍💼 Humano</span>'
                        : '<span class="badge-ia">🤖 IA</span>'}
                    ${c.pendingMessage ? '<span class="badge-pending">⏳ Aguardando aprovação</span>' : ''}
                    <span>${api.formatDateSafe(c.lastActivity)}</span>
                </div>
            </div>
        `).join('');
    }

    async selectConversation(leadId) {
        this.currentConversationId = leadId;
        const detail = document.getElementById('conversationDetail');
        if (detail) detail.innerHTML = '<div class="loading">Carregando conversa...</div>';
        try {
            const conversation = await api.getConversation(leadId);
            this.renderConversationDetail(conversation);
            this.highlightConversation(leadId);
        } catch (error) {
            if (detail) detail.innerHTML = '<p class="empty-title">Falha ao carregar conversa</p>';
            api.handleError(error, 'loading conversation');
        }
    }

    highlightConversation(leadId) {
        document.querySelectorAll('.conversation-item').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.conversation-item').forEach(el => {
            const onclick = el.getAttribute('onclick') || '';
            if (onclick.includes(`selectConversation('${leadId}')`)) el.classList.add('active');
        });
    }

    renderConversationDetail(c) {
        const detail = document.getElementById('conversationDetail');
        if (!detail) return;
        if (!c) { detail.innerHTML = '<p class="empty-title">Conversa não encontrada</p>'; return; }

        const messagesHtml = (c.messages || []).map(m => {
            const cls = m.type === 'inbound' ? 'msg-in' : 'msg-out';
            const who = m.type === 'inbound'
                ? api.safeString(c.leadName)
                : (m.source === 'human' ? '🧑 Atendente' : '🤖 Agente IA');
            return `
                <div class="chat-bubble ${cls}">
                    <div class="chat-meta">${who} · ${api.formatDateSafe(m.timestamp)}</div>
                    <div class="chat-text">${api.safeString(m.content)}</div>
                </div>`;
        }).join('');

        const pitchHtml = c.pitch ? `
            <div class="pitch-card">
                <div class="pitch-title">📦 ${api.safeString(c.pitch.productName || 'Produto')}</div>
                ${c.pitch.summary ? `<div class="pitch-summary">${api.safeString(c.pitch.summary)}</div>` : ''}
                ${c.pitch.landingPage ? `<a class="pitch-link" href="${api.safeString(c.pitch.landingPage)}" target="_blank" rel="noopener">${api.safeString(c.pitch.landingPage)}</a>` : ''}
                <div class="pitch-target">Destino do envio: ${c.testTarget ? `🧪 ${api.safeString(c.testTarget.label || c.testTarget.value)} (teste)` : `📱 ${api.safeString(c.leadPhone || '')} (número real do lead)`}</div>
            </div>` : '';

        const authHtml = c.pendingAuthorization ? `
            <div class="pending-message-card auth-pending">
                <div class="pending-title">🔒 Aguardando sua autorização (${c.pendingAuthorization.kind === 'price' ? 'valor' : 'fechamento'})</div>
                <div class="radar-lead-message">"${api.safeString(c.pendingAuthorization.question || c.pendingAuthorization.dealSummary)}"</div>
                <p class="settings-help">Responda ao alerta que recebeu no WhatsApp ou Telegram (reply na mensagem) para autorizar — vira um novo rascunho aqui automaticamente.</p>
            </div>` : '';

        const pendingHtml = c.pendingMessage ? `
            <div class="pending-message-card">
                <div class="pending-title">⏳ Aguardando sua aprovação</div>
                ${c.pendingMessage.sendError ? `<div class="pending-error">Falha no último envio: ${api.safeString(c.pendingMessage.sendError)}</div>` : ''}
                <button class="pending-draft-preview" onclick="dashboard.openPendingDraftModal('${c.leadId}')">
                    <span>${api.safeString(c.pendingMessage.content, '')}</span>
                </button>
                <div class="pending-actions">
                    <button class="btn btn-primary btn-sm" onclick="dashboard.approvePending('${c.leadId}', false)">✅ Aprovar envio</button>
                    <button class="btn btn-secondary btn-sm" onclick="dashboard.openPendingDraftModal('${c.leadId}')">✏️ Editar ampliado</button>
                    <button class="btn btn-danger btn-sm" onclick="dashboard.discardPending('${c.leadId}')">❌ Não enviar</button>
                </div>
            </div>` : '';

        detail.innerHTML = `
            <div class="conversation-detail-header">
                <div>
                    <h3>${api.safeString(c.leadName)}</h3>
                    <div class="conversation-sub">${api.safeString(c.leadPhone || '')} · Status: ${this.statusLabel(c.status)}</div>
                </div>
                <div class="conversation-actions">
                    ${c.humanControlled
                        ? `<button class="btn btn-secondary btn-sm" onclick="dashboard.releaseConversation('${c.leadId}')">↩ Devolver à IA</button>`
                        : `<button class="btn btn-primary btn-sm" onclick="dashboard.takeoverConversation('${c.leadId}')">🧑‍💼 Assumir conversa</button>`}
                </div>
            </div>
            ${pitchHtml}
            <div class="chat-container" id="chatContainer">${messagesHtml || '<p class="empty-message">Sem mensagens</p>'}</div>
            ${authHtml}
            ${pendingHtml}
            <div class="chat-input-area">
                <textarea id="manualMessageInput" class="chat-input" rows="2"
                    placeholder="${c.humanControlled ? 'Escreva como atendente humano...' : 'Assuma a conversa para responder manualmente (ou escreva para interagir)...'}"></textarea>
                <button class="btn btn-primary" onclick="dashboard.sendManual('${c.leadId}')">Enviar</button>
            </div>
        `;

        const cc = document.getElementById('chatContainer');
        if (cc) cc.scrollTop = cc.scrollHeight;
    }

    async takeoverConversation(leadId) {
        try {
            await api.takeoverConversation(leadId);
            showNotification('Conversa assumida', 'A IA parou de responder automaticamente. Agora você atende como humano.', 'success');
            this.selectConversation(leadId);
        } catch (error) { api.handleError(error, 'assumir conversa'); }
    }

    async releaseConversation(leadId) {
        try {
            await api.releaseConversation(leadId);
            showNotification('Controle devolvido', 'A IA retomou o atendimento automático.', 'info');
            this.selectConversation(leadId);
        } catch (error) { api.handleError(error, 'devolver conversa'); }
    }

    async openPendingDraftModal(leadId) {
        try {
            const conversation = await api.getConversation(leadId);
            if (!conversation || !conversation.pendingMessage) {
                showNotification('Rascunho indisponível', 'Não há rascunho pendente para esta conversa.', 'warning');
                this.selectConversation(leadId);
                return;
            }
            this.currentPendingDraftLeadId = leadId;
            const title = document.getElementById('pendingDraftModalTitle');
            const input = document.getElementById('pendingDraftModalInput');
            const error = document.getElementById('pendingDraftModalError');
            if (title) title.textContent = `Editar rascunho para ${conversation.leadName || leadId}`;
            if (input) {
                input.value = conversation.pendingMessage.content || '';
                setTimeout(() => input.focus(), 50);
            }
            if (error) {
                error.textContent = conversation.pendingMessage.sendError ? `Falha no último envio: ${conversation.pendingMessage.sendError}` : '';
                error.style.display = conversation.pendingMessage.sendError ? 'block' : 'none';
            }
            showModal('pendingDraftModal');
        } catch (error) {
            api.handleError(error, 'abrir rascunho');
        }
    }

    async approvePendingFromModal() {
        const leadId = this.currentPendingDraftLeadId;
        const input = document.getElementById('pendingDraftModalInput');
        if (!leadId || !input) return;
        await this.approvePending(leadId, true, input.value.trim());
        hideModal();
    }

    async approvePending(leadId, useEdited, editedText) {
        const input = document.getElementById('pendingMessageInput');
        const editedContent = useEdited ? (editedText !== undefined ? editedText : (input ? input.value.trim() : undefined)) : undefined;
        try {
            await api.approveMessage(leadId, editedContent ? { editedContent } : {});
            showNotification('Mensagem enviada', 'O rascunho foi aprovado e enviado.', 'success');
            this.refreshConversations();
        } catch (error) { api.handleError(error, 'aprovar mensagem'); }
    }

    async discardPending(leadId) {
        try {
            await api.discardMessage(leadId);
            showNotification('Rascunho descartado', 'Nada foi enviado ao WhatsApp.', 'info');
            this.refreshConversations();
        } catch (error) { api.handleError(error, 'descartar mensagem'); }
    }

    async sendManual(leadId) {
        const input = document.getElementById('manualMessageInput');
        if (!input) return;
        const message = input.value.trim();
        if (!message) { showNotification('Aviso', 'Digite uma mensagem', 'warning'); return; }
        try {
            await api.sendManualMessage(leadId, message, 'Atendente');
            input.value = '';
            showNotification('Mensagem enviada', 'Registrada e enviada (modo simulação se configurado).', 'success');
            this.selectConversation(leadId);
        } catch (error) { api.handleError(error, 'enviar mensagem'); }
    }

    refreshConversations() {
        this.loadConversations();
        if (this.currentConversationId !== undefined && this.currentConversationId !== null) {
            this.selectConversation(this.currentConversationId);
        }
    }

    // ═══════════════════════════════════════════════════════
    // LEAD RADAR (grupos do WhatsApp)
    // ═══════════════════════════════════════════════════════

    priorityLabel(priority) {
        return { alta: 'Alta', media: 'Média', baixa: 'Baixa' }[priority] || priority;
    }

    radarStatusLabel(status) {
        return { novo: 'Novo', contatado: 'Contatado', dispensado: 'Dispensado' }[status] || status;
    }

    async loadLeadRadar() {
        await Promise.all([this.loadRadarGroupsFilter(), this.loadRadarLeads(), this.loadRadarSettingsPanel()]);
    }

    renderRadarNicheTabs() {
        const container = document.getElementById('radarNicheTabs');
        if (!container) return;
        const niches = this.radarSettings.niches || [];
        const tabs = [
            { id: '', label: 'Todos', enabled: true },
            { id: 'default', label: 'Perfil principal', enabled: true },
            ...niches.map(niche => ({ id: niche.id, label: niche.name, enabled: niche.scanEnabled !== false }))
        ];
        container.innerHTML = tabs.map(tab => `
            <button type="button" class="radar-niche-tab ${this.currentRadarNicheId === tab.id ? 'active' : ''} ${tab.enabled ? '' : 'paused'}" data-radar-niche="${api.safeString(tab.id)}">
                ${api.safeString(tab.label)}
            </button>
        `).join('');
        container.querySelectorAll('[data-radar-niche]').forEach(button => {
            button.addEventListener('click', () => {
                this.currentRadarNicheId = button.dataset.radarNiche || '';
                this.renderRadarNicheTabs();
                this.loadRadarLeads();
            });
        });
    }

    async loadRadarGroupsFilter() {
        if (this._radarGroupsCache) return this._radarGroupsCache;
        try {
            const result = await api.getRadarGroups();
            this._radarGroupsCache = result.groups || [];
            const select = document.getElementById('radarFilterGroup');
            if (select) {
                const current = select.value;
                select.innerHTML = '<option value="">Todos os grupos</option>' +
                    this._radarGroupsCache.map(g => `<option value="${api.safeString(g.id)}">${api.safeString(g.name || g.id)}</option>`).join('');
                select.value = current;
            }
            return this._radarGroupsCache;
        } catch (error) {
            api.handleError(error, 'carregando grupos do radar');
            return [];
        }
    }

    groupNameFor(groupId) {
        const group = (this._radarGroupsCache || []).find(g => g.id === groupId);
        return group ? group.name : groupId;
    }

    async loadRadarLeads() {
        const list = document.getElementById('radarLeadsList');
        if (list) list.innerHTML = '<div class="skeleton skeleton-card" style="height: 100px"></div>';
        try {
            const since = document.getElementById('radarFilterPeriod')?.value || '7';
            const priority = document.getElementById('radarFilterPriority')?.value || '';
            const groupId = document.getElementById('radarFilterGroup')?.value || '';
            const status = document.getElementById('radarFilterStatus')?.value || '';
            const result = await api.getRadarLeads({ since, priority, groupId, status, nicheId: this.currentRadarNicheId });
            this.renderRadarLeads(result.leads || []);
            const badge = document.getElementById('radarLeadCount');
            if (badge) badge.textContent = (result.leads || []).filter(l => l.status === 'novo').length;
        } catch (error) {
            if (list) list.innerHTML = `<p class="empty-title">${api.safeString(error.message)}</p>`;
        }
    }

    renderRadarLeads(leads) {
        const list = document.getElementById('radarLeadsList');
        if (!list) return;

        if (!leads.length) {
            this.currentRadarLeads = [];
            list.innerHTML = `
                <div class="card" style="text-align:center;padding:2rem">
                    <p class="empty-title">Nenhum lead encontrado no período/filtro</p>
                    <p class="empty-message">Clique em "Escanear agora" para varrer os grupos, ou ajuste os filtros.</p>
                </div>`;
            return;
        }

        this.currentRadarLeads = leads;
        list.innerHTML = leads.map(lead => `
            <div class="radar-lead-card priority-${lead.priority}" role="button" tabindex="0" onclick="dashboard.openRadarLeadModal(${lead.id})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();dashboard.openRadarLeadModal(${lead.id})}">
                <div class="radar-lead-header">
                    <span class="priority-badge priority-${lead.priority}">${this.priorityLabel(lead.priority)}</span>
                    <span class="radar-lead-niche">${api.safeString(lead.niche_name || 'Perfil principal')}</span>
                    <span class="radar-lead-group">${api.safeString(lead.group_name || this.groupNameFor(lead.group_id))}</span>
                    <span class="radar-lead-date">${api.formatDateSafe(lead.detected_at)}</span>
                </div>
                <div class="radar-lead-sender">👤 ${api.safeString(lead.sender_name, 'Desconhecido')}</div>
                <div class="radar-lead-summary"><strong>Precisa de:</strong> ${api.safeString(lead.need_summary || lead.service_match, '-')}</div>
                <div class="radar-lead-reason">${api.safeString(lead.relevance_reason || '')}</div>
                <div class="radar-lead-message">"${api.safeString(lead.message_text)}"</div>
                <div class="radar-lead-footer">
                    <span class="status-badge">${this.radarStatusLabel(lead.status)}</span>
                    <div class="radar-lead-actions">
                        ${lead.status === 'novo' ? `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();dashboard.openRadarLeadModal(${lead.id})">💬 Contatar este lead</button>` : ''}
                        ${lead.status !== 'contatado' ? `<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();dashboard.setRadarStatus(${lead.id}, 'contatado')">✅ Marcar contatado</button>` : ''}
                        ${lead.status !== 'dispensado' ? `<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();dashboard.setRadarStatus(${lead.id}, 'dispensado')">🚫 Dispensar</button>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    openRadarLeadModal(id) {
        const lead = (this.currentRadarLeads || []).find(item => String(item.id) === String(id));
        if (!lead) return;
        this.currentRadarLead = lead;
        const body = document.getElementById('radarLeadModalBody');
        const primary = document.getElementById('radarLeadModalPrimary');
        if (body) {
            body.innerHTML = `
                <div class="radar-modal-lead">
                    <div class="radar-lead-header">
                        <span class="priority-badge priority-${lead.priority}">${this.priorityLabel(lead.priority)}</span>
                        <span class="status-badge">${this.radarStatusLabel(lead.status)}</span>
                    </div>
                    <h4>${api.safeString(lead.sender_name, 'Desconhecido')}</h4>
                    <p><strong>Nicho:</strong> ${api.safeString(lead.niche_name || 'Perfil principal')}</p>
                    <p><strong>Grupo:</strong> ${api.safeString(lead.group_name || this.groupNameFor(lead.group_id))}</p>
                    <p><strong>Precisa de:</strong> ${api.safeString(lead.need_summary || lead.service_match, '-')}</p>
                    ${lead.relevance_reason ? `<p>${api.safeString(lead.relevance_reason)}</p>` : ''}
                    <blockquote>${api.safeString(lead.message_text)}</blockquote>
                    <p class="settings-help">Ao autorizar contato, o sistema resolve o número do participante, cria a conversa e deixa a primeira mensagem como rascunho para aprovação.</p>
                </div>`;
        }
        if (primary) {
            primary.disabled = lead.status !== 'novo';
            primary.textContent = lead.status === 'novo' ? 'Autorizar contato' : 'Contato já iniciado';
        }
        showModal('radarLeadActionModal');
    }

    async confirmRadarLeadContact() {
        if (!this.currentRadarLead) return;
        await this.contactRadarLead(this.currentRadarLead.id);
        hideModal();
    }

    async contactRadarLead(id) {
        try {
            const result = await api.contactRadarLead(id);
            showNotification('Contato iniciado', 'Rascunho da 1ª mensagem gerado — veja e aprove na aba Conversas.', 'success');
            this.loadRadarLeads();
            this.showSection('conversations');
            this.selectConversation(result.conversation.leadId);
        } catch (error) { api.handleError(error, 'contatar lead do radar'); }
    }

    async setRadarStatus(id, status) {
        try {
            await api.setRadarLeadStatus(id, status);
            showNotification('Lead atualizado', `Status alterado para ${this.radarStatusLabel(status)}`, 'success');
            this.loadRadarLeads();
        } catch (error) { api.handleError(error, 'atualizar lead do radar'); }
    }

    async scanRadarNow() {
        const button = document.getElementById('radarScanButton');
        const lastScan = document.getElementById('radarLastScan');
        if (button) { button.disabled = true; button.textContent = '🔎 Escaneando...'; }
        this.showRadarScanOverlay();
        try {
            const result = await api.scanRadar(7);
            const s = result.summary;
            showNotification('Varredura concluída', `${s.groupsScanned} grupos, ${s.nichesScanned || 1} nichos, ${s.candidates} candidatos, ${s.leadsFound} leads novos`, 'success');
            if (lastScan) lastScan.textContent = `Última varredura: ${api.formatDateSafe(new Date())}`;
            this.loadRadarLeads();
        } catch (error) {
            api.handleError(error, 'escanear grupos');
        } finally {
            if (button) { button.disabled = false; button.textContent = '🔎 Escanear agora'; }
            this.hideRadarScanOverlay();
        }
    }

    showRadarScanOverlay(message = 'Buscando novas oportunidades nos grupos do WhatsApp...') {
        const overlay = document.getElementById('radarScanOverlay');
        const text = document.getElementById('radarScanOverlayText');
        if (text) text.textContent = message;
        if (overlay) {
            overlay.classList.add('active');
            overlay.setAttribute('aria-hidden', 'false');
        }
    }

    hideRadarScanOverlay() {
        const overlay = document.getElementById('radarScanOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            overlay.setAttribute('aria-hidden', 'true');
        }
    }

    renderAutoScanToggle(radarReadiness) {
        const button = document.getElementById('radarAutoScanToggle');
        if (!button) return;

        if (!radarReadiness?.pollMinutes) {
            button.textContent = '⚠️ Intervalo não configurado';
            button.disabled = true;
            button.title = 'Defina LEAD_RADAR_POLL_MINUTES no .env para habilitar a varredura automática';
            return;
        }

        button.disabled = false;
        const running = radarReadiness.autoScanRunning;
        button.textContent = running ? `⏸️ Pausar varredura automática (${radarReadiness.pollMinutes}min)` : '▶️ Retomar varredura automática';
        button.dataset.running = running ? '1' : '0';
        button.title = running ? 'Varredura automática ativa' : 'Varredura automática pausada';
    }

    async toggleAutoScan() {
        const button = document.getElementById('radarAutoScanToggle');
        const currentlyRunning = button?.dataset.running === '1';
        try {
            const result = await api.setRadarAutoScan(!currentlyRunning);
            showNotification('Varredura automática', result.running ? 'Ligada' : 'Pausada', 'success');
            this.loadRadarSettingsPanel();
        } catch (error) { api.handleError(error, 'alternar varredura automática'); }
    }

    async loadRadarSettingsPanel() {
        try {
            const [groups, settings] = await Promise.all([this.loadRadarGroupsFilter(), api.getSettings()]);
            this.radarSettings = settings.settings?.radar || this.radarSettings;
            this.renderRadarNicheTabs();
            const readiness = settings.readiness?.leadRadar || {};
            const statusEl = document.getElementById('radarChannelsStatus');
            if (statusEl) {
                statusEl.innerHTML = `
                    <div class="readiness-row"><strong>Modelo de classificação</strong><span class="ready">${api.safeString(readiness.model)}</span></div>
                    <div class="readiness-row"><strong>WhatsApp (alerta)</strong><span class="${readiness.ownerWhatsappConfigured ? 'ready' : 'not-ready'}">${readiness.ownerWhatsappConfigured ? 'Pronto' : 'Pendente'}</span></div>
                    <div class="readiness-row"><strong>Telegram</strong><span class="${readiness.telegramConfigured ? 'ready' : 'not-ready'}">${readiness.telegramConfigured ? 'Pronto' : 'Pendente'}</span></div>
                    <div class="readiness-row"><strong>Varredura automática</strong><span class="${readiness.autoScanRunning ? 'ready' : 'not-ready'}">${readiness.pollMinutes ? (readiness.autoScanRunning ? `ativa, a cada ${readiness.pollMinutes} min` : 'pausada') : 'desativada'}</span></div>
                `;
            }
            this.renderAutoScanToggle(readiness);
            const whatsappInput = document.getElementById('radarAlertWhatsappGroup');
            const telegramInput = document.getElementById('radarAlertTelegramChat');
            const ownerNumberInput = document.getElementById('radarAlertOwnerNumber');
            if (whatsappInput && !whatsappInput.dataset.touched) whatsappInput.value = readiness.alerts?.whatsappGroupId || '';
            if (telegramInput && !telegramInput.dataset.touched) telegramInput.value = readiness.alerts?.telegramChatId || '';
            if (ownerNumberInput && !ownerNumberInput.dataset.touched) ownerNumberInput.value = readiness.alerts?.ownerWhatsappNumber || '';
            const groupsList = document.getElementById('radarGroupsList');
            if (groupsList) {
                groupsList.innerHTML = groups.map(g => `
                    <label class="radar-group-toggle">
                        <input type="checkbox" ${g.excluded ? '' : 'checked'} onchange="dashboard.toggleRadarGroup('${g.id}', !this.checked)">
                        ${api.safeString(g.name || g.id)} <small>(${g.size || 0} membros)</small>
                    </label>
                `).join('');
            }
        } catch (error) {
            api.handleError(error, 'carregando configurações do radar');
        }
    }

    async saveRadarAlertSettings(event) {
        event.preventDefault();
        try {
            const whatsappGroupId = document.getElementById('radarAlertWhatsappGroup')?.value.trim() || '';
            const telegramChatId = document.getElementById('radarAlertTelegramChat')?.value.trim() || '';
            const ownerWhatsappNumber = document.getElementById('radarAlertOwnerNumber')?.value.trim() || '';
            await api.saveSettings({ alerts: { whatsappGroupId, telegramChatId, ownerWhatsappNumber } });
            showNotification('Alertas salvos', 'Canais de alerta do radar atualizados.', 'success');
            document.getElementById('radarAlertWhatsappGroup')?.removeAttribute('data-touched');
            document.getElementById('radarAlertTelegramChat')?.removeAttribute('data-touched');
            document.getElementById('radarAlertOwnerNumber')?.removeAttribute('data-touched');
            this.loadRadarSettingsPanel();
        } catch (error) { api.handleError(error, 'salvar canais de alerta'); }
    }

    async toggleRadarGroup(groupId, exclude) {
        try {
            if (exclude) await api.excludeRadarGroup(groupId);
            else await api.includeRadarGroup(groupId);
            this._radarGroupsCache = null;
            this.loadRadarGroupsFilter();
        } catch (error) { api.handleError(error, 'atualizar grupo do radar'); }
    }

    // CAMPAIGN ACTIONS
    // ═══════════════════════════════════════════════════════

    async createCampaign(event) {
        event.preventDefault();
        
        const form = document.getElementById('newCampaignForm');
        const formData = new FormData(form);
        const campaignData = Object.fromEntries(formData.entries());

        // Validate
        if (!campaignData.name || !campaignData.industry || !campaignData.location || !campaignData.searchQuery || !campaignData.yourService) {
            showNotification('Validation Error', 'Please fill in all required fields', 'warning');
            return;
        }

        try {
            hideModal();
            
            // Show progress modal
            this.progressManager.show(campaignData.name);

            const result = await api.createCampaign(campaignData);
            
            if (result.success) {
                showNotification('Campaign Launched', `Campaign "${campaignData.name}" is running`, 'success');
                form.reset();
            }
        } catch (error) {
            api.handleError(error, 'creating campaign');
            if (this.progressManager) {
                this.progressManager.error(error.message);
            }
        }
    }

    async showCampaignDetail(campaignId) {
        const content = document.getElementById('campaignDetailContent');
        content.innerHTML = '<div class="loading">Loading campaign details...</div>';
        showModal('campaignDetailModal');

        try {
            const campaign = await api.getCampaignDetail(campaignId);
            this.renderCampaignDetail(campaign);
        } catch (error) {
            content.innerHTML = '<p class="empty-title">Failed to load campaign details</p>';
            api.handleError(error, 'loading campaign details');
        }
    }

    renderCampaignDetail(campaign) {
        const content = document.getElementById('campaignDetailContent');
        
        content.innerHTML = `
            <div class="campaign-detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Campaign Name</div>
                    <div class="detail-value">${api.safeString(campaign.name)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Industry</div>
                    <div class="detail-value">${api.safeString(campaign.industry)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Location</div>
                    <div class="detail-value">${api.safeString(campaign.location || 'N/A')}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Executed</div>
                    <div class="detail-value">${api.formatDateSafe(campaign.executedAt)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Total Leads</div>
                    <div class="detail-value">${api.formatNumber(campaign.results?.totalLeads || 0)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Priority Leads</div>
                    <div class="detail-value">${api.formatNumber(campaign.results?.priorityLeads || 0)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Avg Score</div>
                    <div class="detail-value">${campaign.results?.averageScore || 0}/100</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Content Generated</div>
                    <div class="detail-value">${campaign.results?.contentGenerated || 0} leads</div>
                </div>
            </div>
            ${campaign.leads && campaign.leads.length > 0 ? `
                <h4 style="margin-bottom:var(--space-md);font-weight:600">Top Leads</h4>
                ${campaign.leads.slice(0, 5).map((lead, index) => this.renderLeadCard(lead, campaign.id, index)).join('')}
            ` : ''}
        `;
    }

    renderLeadCard(lead, campaignId, index) {
        const score = lead.intelligence?.score || 0;
        const priority = lead.intelligence?.priority || 'LOW';
        const hasContent = lead.intelligence?.marketingContent;

        return `
            <div class="card" style="margin-bottom:var(--space-sm);padding:var(--space-md)">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-xs)">
                    <strong style="font-size:0.9rem">${api.safeString(lead.name)}</strong>
                    <span class="priority-badge priority-${priority.toLowerCase()}">${priority}</span>
                </div>
                <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:var(--space-sm)">
                    ${api.safeString(lead.phone || '')} · ${api.safeString(lead.address || '')}
                </div>
                <div style="display:flex;gap:var(--space-xs);flex-wrap:wrap">
                    <button class="btn-vcard" onclick="exportLeadVCard('${campaignId}', ${index}, '${api.safeString(lead.name).replace(/'/g, "\\'")}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                        vCard
                    </button>
                    ${hasContent ? `
                        <button class="btn-vcard" onclick="dashboard.showMarketingContent(${JSON.stringify(lead.intelligence.marketingContent).replace(/"/g, '&quot;')}, '${api.safeString(lead.name).replace(/'/g, "\\'")}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            Content
                        </button>
                    ` : ''}
                    ${lead.phone ? `
                        <button class="btn-vcard" onclick="dashboard.openWhatsApp('${lead.phone}', ${hasContent ? JSON.stringify(lead.intelligence.marketingContent.whatsapp || '').replace(/"/g, '&quot;') : "''"})">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                            WhatsApp
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // ─── Marketing Content ──────────────────────────────────
    showMarketingContent(content, leadName) {
        const container = document.getElementById('marketingContent');
        
        const subject = content.subject || content.email_subject || '';
        const email = content.email || content.email_body || '';
        const whatsapp = content.whatsapp || content.whatsapp_message || '';

        container.innerHTML = `
            <h4 style="margin-bottom:var(--space-md);font-size:0.9rem;font-weight:600">Content for ${api.safeString(leadName)}</h4>
            ${subject ? `
                <div class="marketing-content" style="margin-bottom:var(--space-md)">
                    <div class="marketing-header"><h4>Email Subject</h4></div>
                    <div class="marketing-body"><div class="content-preview">${api.safeString(subject)}</div></div>
                </div>
            ` : ''}
            ${email ? `
                <div class="marketing-content" style="margin-bottom:var(--space-md)">
                    <div class="marketing-header"><h4>Email Body</h4></div>
                    <div class="marketing-body"><div class="content-preview">${api.safeString(email)}</div></div>
                    <div class="marketing-actions">
                        <button class="btn btn-secondary btn-sm" onclick="dashboard.sendEmail('${api.safeString(subject).replace(/'/g, "\\'")}', '${api.safeString(email).replace(/'/g, "\\'")}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                            Open Email
                        </button>
                    </div>
                </div>
            ` : ''}
            ${whatsapp ? `
                <div class="marketing-content" style="margin-bottom:var(--space-md)">
                    <div class="marketing-header"><h4>WhatsApp Message</h4></div>
                    <div class="marketing-body"><div class="content-preview">${api.safeString(whatsapp)}</div></div>
                    <div class="marketing-actions">
                        <button class="btn btn-success btn-sm" onclick="navigator.clipboard.writeText(${JSON.stringify(whatsapp).replace(/"/g, '&quot;')}).then(()=>showNotification('Copied','Message copied to clipboard','success'))">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            Copy
                        </button>
                    </div>
                </div>
            ` : ''}
        `;

        showModal('marketingModal');
    }

    // ─── WhatsApp & Email ───────────────────────────────────
    openWhatsApp(phone, message) {
        try {
            let cleanPhone = phone.replace(/[^0-9+]/g, '');
            if (cleanPhone.startsWith('0')) {
                cleanPhone = '62' + cleanPhone.substring(1);
            }
            const text = encodeURIComponent(message || '');
            const url = `https://wa.me/${cleanPhone}${text ? '?text=' + text : ''}`;
            window.open(url, '_blank');
            showNotification('WhatsApp', 'Opening WhatsApp...', 'success');
        } catch (error) {
            api.handleError(error, 'opening WhatsApp');
        }
    }

    sendEmail(subject, body) {
        try {
            const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.open(mailtoUrl);
            showNotification('Email', 'Opening email client...', 'success');
        } catch (error) {
            api.handleError(error, 'opening email');
        }
    }

    // ─── Export ─────────────────────────────────────────────
    async exportAllVCards() {
        if (!this.currentCampaign) {
            showNotification('Export', 'Please select a campaign first', 'warning');
            return;
        }
        try {
            window.open(`/api/campaigns/${this.currentCampaign}/export/vcard`, '_blank');
            showNotification('Export', 'Downloading vCard bundle...', 'success');
        } catch (error) {
            api.handleError(error, 'exporting vCards');
        }
    }

    // ─── Campaign Select ────────────────────────────────────
    updateCampaignSelect(campaigns) {
        const select = document.getElementById('campaignSelect');
        if (!select) return;

        const current = select.value;
        select.innerHTML = '<option value="">Select Campaign</option>' +
            campaigns.map(c => `<option value="${c.id}">${api.safeString(c.name)}</option>`).join('');
        
        if (current) select.value = current;
    }
}

// ─── Global: Export Lead vCard ──────────────────────────────
function exportLeadVCard(campaignId, leadIndex, leadName) {
    try {
        window.open(`/api/leads/${campaignId}/${leadIndex}/vcard`, '_blank');
        showNotification('vCard', `Downloading contact for ${leadName}`, 'success');
    } catch (error) {
        showNotification('Error', 'Failed to export vCard', 'error');
    }
}

// ─── Initialize ────────────────────────────────────────────
const dashboard = new Dashboard();

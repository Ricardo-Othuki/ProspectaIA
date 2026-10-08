/**
 * Google Calendar Integration Module
 * 
 * Integração com Google Calendar API para agendamento automático de reuniões
 * Cria eventos com link do Google Meet
 */

const { google } = require('googleapis');

class GoogleCalendarIntegration {
    constructor() {
        this.calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
        this.credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || './credentials/google-credentials.json';
        this.auth = null;
        this.calendar = null;
        
        // Horário de funcionamento (Recife - UTC-3)
        this.workingHours = {
            start: 9, // 9h
            end: 18,  // 18h
            timezone: 'America/Recife'
        };
    }

    /**
     * Inicializa autenticação com Google Calendar
     */
    async initialize() {
        try {
            const fs = require('fs');
            
            // Verificar se credenciais existem
            if (!fs.existsSync(this.credentialsPath)) {
                console.log('⚠️  Credenciais Google não encontradas. Usando modo simulação.');
                this.simulationMode = true;
                return true;
            }

            const credentials = JSON.parse(fs.readFileSync(this.credentialsPath, 'utf8'));
            
            // Configurar OAuth2
            const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
            
            const oAuth2Client = new google.auth.OAuth2(
                client_id,
                client_secret,
                redirect_uris[0]
            );

            // Verificar se há token salvo
            const tokenPath = './credentials/google-token.json';
            if (fs.existsSync(tokenPath)) {
                const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
                oAuth2Client.setCredentials(token);
                this.auth = oAuth2Client;
            } else {
                console.log('⚠️  Token Google não encontrado. Execute: npm run google-auth');
                this.simulationMode = true;
                return true;
            }

            // Inicializar Calendar API
            this.calendar = google.calendar({ version: 'v3', auth: this.auth });
            this.simulationMode = false;
            
            console.log('✅ Google Calendar conectado');
            return true;
        } catch (error) {
            console.error('❌ Erro ao inicializar Google Calendar:', error.message);
            this.simulationMode = true;
            return true;
        }
    }

    /**
     * Cria reunião no Google Calendar com Google Meet
     */
    async createMeeting(options) {
        const {
            summary,
            description,
            attendeeEmail,
            durationMinutes = 15,
            suggestedTime
        } = options;

        console.log(`📅 Criando reunião: ${summary}`);

        if (this.simulationMode) {
            return await this.createMeetingSimulation(options);
        }

        try {
            // Calcular horário da reunião
            const startTime = this.calculateMeetingTime(suggestedTime);
            const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

            // Configurar evento
            const event = {
                summary: summary,
                description: description,
                start: {
                    dateTime: startTime.toISOString(),
                    timeZone: this.workingHours.timezone,
                },
                end: {
                    dateTime: endTime.toISOString(),
                    timeZone: this.workingHours.timezone,
                },
                conferenceData: {
                    createRequest: {
                        requestId: `othuki-${Date.now()}`,
                        conferenceSolutionKey: {
                            type: 'hangoutsMeet'
                        }
                    }
                },
                attendees: attendeeEmail ? [{ email: attendeeEmail }] : [],
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 24 * 60 },
                        { method: 'popup', minutes: 10 }
                    ]
                }
            };

            // Criar evento
            const response = await this.calendar.events.insert({
                calendarId: this.calendarId,
                resource: event,
                conferenceDataVersion: 1,
                sendUpdates: attendeeEmail ? 'all' : 'none'
            });

            const meetingLink = response.data.hangoutLink || response.data.conferenceData?.entryPoints?.[0]?.uri;

            console.log(`✅ Reunião criada: ${meetingLink}`);
            console.log(`📅 Data: ${startTime.toLocaleString('pt-BR', { timeZone: this.workingHours.timezone })}`);

            return {
                success: true,
                eventId: response.data.id,
                meetingLink: meetingLink,
                startTime: startTime,
                endTime: endTime,
                calendarLink: response.data.htmlLink
            };
        } catch (error) {
            console.error('❌ Erro ao criar reunião:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Cria reunião em modo simulação
     */
    async createMeetingSimulation(options) {
        const { summary, description, durationMinutes = 15, suggestedTime } = options;
        
        // Simular delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const startTime = this.calculateMeetingTime(suggestedTime);
        const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
        
        // Gerar link simulado
        const meetingId = Math.random().toString(36).substring(2, 15);
        const meetingLink = `https://meet.google.com/${meetingId.substring(0, 3)}-${meetingId.substring(3, 7)}-${meetingId.substring(7, 11)}`;
        const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        console.log(`✅ [SIMULAÇÃO] Reunião criada: ${meetingLink}`);
        console.log(`📅 Data: ${startTime.toLocaleString('pt-BR', { timeZone: this.workingHours.timezone })}`);

        // Salvar log
        const fs = require('fs');
        const logDir = './output/calendar_logs';
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        const logEntry = {
            eventId,
            summary,
            description,
            meetingLink,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            timestamp: new Date().toISOString(),
            simulation: true
        };

        fs.appendFileSync(
            `${logDir}/meetings.jsonl`,
            JSON.stringify(logEntry) + '\n'
        );

        return {
            success: true,
            eventId,
            meetingLink,
            startTime,
            endTime,
            calendarLink: `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(summary)}&dates=${startTime.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${endTime.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}&details=${encodeURIComponent(description || '')}`,
            simulation: true
        };
    }

    /**
     * Calcula horário da reunião baseado na sugestão
     */
    calculateMeetingTime(suggestedTime) {
        const now = new Date();
        let targetDate = new Date(now);

        // Se há sugestão de horário, tentar usar
        if (suggestedTime) {
            const timeMatch = suggestedTime.match(/(\d{1,2})[h:](\d{2})?/);
            if (timeMatch) {
                const hours = parseInt(timeMatch[1]);
                const minutes = parseInt(timeMatch[2] || 0);
                
                // Se mencionou "amanhã", usar amanhã
                if (suggestedTime.toLowerCase().includes('amanhã') || suggestedTime.toLowerCase().includes('tomorrow')) {
                    targetDate.setDate(targetDate.getDate() + 1);
                }
                
                targetDate.setHours(hours, minutes, 0, 0);
                
                // Se o horário já passou hoje, usar amanhã
                if (targetDate <= now) {
                    targetDate.setDate(targetDate.getDate() + 1);
                }
                
                return targetDate;
            }
        }

        // Padrão: próximo horário útil
        targetDate.setDate(targetDate.getDate() + 1); // Amanhã
        targetDate.setHours(this.workingHours.start + 1, 0, 0, 0); // 10h

        // Encontrar próximo dia útil
        while (targetDate.getDay() === 0 || targetDate.getDay() === 6) {
            targetDate.setDate(targetDate.getDate() + 1);
        }

        return targetDate;
    }

    /**
     * Lista reuniões agendadas
     */
    async listUpcomingMeetings(maxResults = 10) {
        if (this.simulationMode) {
            return this.listMeetingsSimulation(maxResults);
        }

        try {
            const response = await this.calendar.events.list({
                calendarId: this.calendarId,
                timeMin: new Date().toISOString(),
                maxResults: maxResults,
                singleEvents: true,
                orderBy: 'startTime',
                q: 'Othuki' // Filtrar apenas reuniões da Othuki
            });

            return response.data.items.map(event => ({
                id: event.id,
                summary: event.summary,
                description: event.description,
                meetingLink: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri,
                startTime: event.start.dateTime,
                endTime: event.end.dateTime,
                attendees: event.attendees?.map(a => a.email) || []
            }));
        } catch (error) {
            console.error('❌ Erro ao listar reuniões:', error.message);
            return [];
        }
    }

    /**
     * Lista reuniões em modo simulação
     */
    listMeetingsSimulation(maxResults) {
        try {
            const fs = require('fs');
            const logFile = './output/calendar_logs/meetings.jsonl';
            
            if (!fs.existsSync(logFile)) {
                return [];
            }

            const content = fs.readFileSync(logFile, 'utf8');
            const lines = content.trim().split('\n').filter(l => l);
            
            return lines
                .map(line => JSON.parse(line))
                .slice(-maxResults)
                .reverse();
        } catch (error) {
            return [];
        }
    }

    /**
     * Cancela reunião
     */
    async cancelMeeting(eventId) {
        if (this.simulationMode) {
            console.log(`✅ [SIMULAÇÃO] Reunião cancelada: ${eventId}`);
            return { success: true };
        }

        try {
            await this.calendar.events.delete({
                calendarId: this.calendarId,
                eventId: eventId
            });
            
            console.log(`✅ Reunião cancelada: ${eventId}`);
            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao cancelar reunião:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Gera link de agendamento para o lead
     */
    generateBookingLink(leadName, leadEmail) {
        // Usar Google Calendar Appointment Scheduler ou link manual
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: `Reunião Othuki - ${leadName}`,
            details: 'Reunião de 15 minutos para apresentar soluções da Othuki',
            dates: this.generateDateRange()
        });

        return `https://calendar.google.com/calendar/r/eventedit?${params.toString()}`;
    }

    /**
     * Gera range de datas para agendamento
     */
    generateDateRange() {
        const now = new Date();
        const start = new Date(now);
        start.setDate(start.getDate() + 1);
        start.setHours(10, 0, 0, 0);

        const end = new Date(start);
        end.setMinutes(end.getMinutes() + 15);

        const format = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        return `${format(start)}/${format(end)}`;
    }
}

module.exports = GoogleCalendarIntegration;
/**
 * Centralized AI Client Configuration
 * 
 * All modules should import from here instead of creating their own instances.
 * Supports Google Gemini (free tier) via OpenAI-compatible endpoint.
 */

const DEFAULT_MODEL = 'gemini-2.5-flash';

let openaiInstance = null;
let initError = null;

function createClient() {
    if (openaiInstance) return openaiInstance;

    try {
        const OpenAI = require('openai');

        const config = {
            apiKey: process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY,
        };

        // Support custom base URL (Google Gemini, Azure, OpenRouter, etc.)
        if (process.env.OPENAI_BASE_URL) {
            config.baseURL = process.env.OPENAI_BASE_URL;
            console.log(`🔗 AI endpoint: ${process.env.OPENAI_BASE_URL}`);
        }

        openaiInstance = new OpenAI(config);
        
        // Detect provider
        const baseUrl = process.env.OPENAI_BASE_URL || '';
        if (baseUrl.includes('google')) {
            console.log('✅ Google Gemini client initialized (free tier)');
        } else {
            console.log('✅ OpenAI client initialized');
        }
        
        return openaiInstance;
    } catch (error) {
        initError = error;
        console.error('❌ Error initializing AI client:', error.message);
        console.log('💡 For Google Gemini (free):');
        console.log('   1. Get key at: https://aistudio.google.com/apikey');
        console.log('   2. Set GEMINI_API_KEY in .env file');
        return null;
    }
}

function getClient() {
    if (!openaiInstance && !initError) {
        return createClient();
    }
    return openaiInstance;
}

function getModel() {
    return process.env.OPENAI_MODEL || DEFAULT_MODEL;
}

function isConfigured() {
    return !!process.env.OPENAI_API_KEY;
}

/**
 * Reset the client instance (useful for testing or re-configuration)
 */
function resetClient() {
    openaiInstance = null;
    initError = null;
}

/**
 * Wrapper para chamadas à IA com retry e backoff exponencial.
 * Usage:
 *   const result = await callWithRetry(() => client.chat.completions.create(...));
 */
async function callWithRetry(fn, { retries = 3, baseDelayMs = 800, maxDelayMs = 8000 } = {}) {
    let attempt = 0;
    while (attempt <= retries) {
        try {
            return await fn();
        } catch (error) {
            attempt += 1;
            const status = error?.status || error?.code;
            const retryable = status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
            if (attempt > retries || !retryable) throw error;
            const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
            console.warn(`⚠️  Retry ${attempt}/${retries} em ${delay}ms (erro ${status || error.message})`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

module.exports = {
    getClient,
    getModel,
    isConfigured,
    resetClient,
    DEFAULT_MODEL,
    callWithRetry,
};

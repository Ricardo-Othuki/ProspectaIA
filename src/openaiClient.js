/**
 * Centralized AI Client Configuration
 * 
 * All modules should import from here instead of creating their own instances.
 * Supports Google Gemini (free tier) via OpenAI-compatible endpoint.
 */
require('dotenv').config();

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

module.exports = {
    getClient,
    getModel,
    isConfigured,
    resetClient,
    DEFAULT_MODEL,
};

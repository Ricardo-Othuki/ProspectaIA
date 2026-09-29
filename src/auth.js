const { createClient } = require('@supabase/supabase-js');

const ACCESS_COOKIE = 'prospecta_access';
const REFRESH_COOKIE = 'prospecta_refresh';
const ONE_WEEK_SECONDS = 7 * 24 * 60 * 60;

let client = null;

function isAuthConfigured() {
    return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getAuthClient() {
    if (client) return client;
    if (!isAuthConfigured()) {
        throw new Error('Supabase Auth não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
    }
    client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
    });
    return client;
}

function parseCookies(req) {
    return String(req.headers.cookie || '')
        .split(';')
        .map(part => part.trim())
        .filter(Boolean)
        .reduce((cookies, part) => {
            const index = part.indexOf('=');
            if (index === -1) return cookies;
            const key = decodeURIComponent(part.slice(0, index));
            const value = decodeURIComponent(part.slice(index + 1));
            cookies[key] = value;
            return cookies;
        }, {});
}

function cookieOptions(maxAgeSeconds) {
    const secure = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
    return [
        'HttpOnly',
        'Path=/',
        'SameSite=Lax',
        `Max-Age=${maxAgeSeconds}`,
        secure ? 'Secure' : ''
    ].filter(Boolean).join('; ');
}

function setAuthCookies(res, session) {
    const accessMaxAge = Math.max(60, Number(session.expires_in || 3600));
    res.setHeader('Set-Cookie', [
        `${ACCESS_COOKIE}=${encodeURIComponent(session.access_token)}; ${cookieOptions(accessMaxAge)}`,
        `${REFRESH_COOKIE}=${encodeURIComponent(session.refresh_token)}; ${cookieOptions(ONE_WEEK_SECONDS)}`
    ]);
}

function clearAuthCookies(res) {
    res.setHeader('Set-Cookie', [
        `${ACCESS_COOKIE}=; ${cookieOptions(0)}`,
        `${REFRESH_COOKIE}=; ${cookieOptions(0)}`
    ]);
}

async function getUserFromRequest(req, res) {
    if (!isAuthConfigured()) return null;

    const cookies = parseCookies(req);
    const accessToken = cookies[ACCESS_COOKIE];
    const refreshToken = cookies[REFRESH_COOKIE];
    const auth = getAuthClient().auth;

    if (accessToken) {
        const { data, error } = await auth.getUser(accessToken);
        if (!error && data?.user) return data.user;
    }

    if (refreshToken) {
        const { data, error } = await auth.refreshSession({ refresh_token: refreshToken });
        if (!error && data?.session && data?.user) {
            setAuthCookies(res, data.session);
            return data.user;
        }
    }

    return null;
}

function wantsHtml(req) {
    return String(req.headers.accept || '').includes('text/html');
}

function requireDashboardAuth(options = {}) {
    const publicPaths = new Set(options.publicPaths || []);

    return async (req, res, next) => {
        if (publicPaths.has(req.path)) return next();
        if (req.path.startsWith('/css/') || req.path.startsWith('/js/')) return next();

        try {
            const user = await getUserFromRequest(req, res);
            if (user) {
                req.user = user;
                return next();
            }
        } catch (error) {
            console.error('Falha ao validar sessão do painel:', error.message);
        }

        clearAuthCookies(res);
        if (wantsHtml(req)) return res.redirect('/login');
        return res.status(401).json({ error: 'Login obrigatório' });
    };
}

module.exports = {
    getAuthClient,
    getUserFromRequest,
    requireDashboardAuth,
    setAuthCookies,
    clearAuthCookies,
    isAuthConfigured
};

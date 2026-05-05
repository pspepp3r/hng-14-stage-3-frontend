import { renderLogin } from './views/auth.js';
import { renderDashboard, loadDashboardData } from './views/dashboard.js';
import { renderAccount } from './views/account.js';
import { renderLayout } from './views/layout.js';

// const API_BASE = 'https://hng-14-stage-3-backend-production.up.railway.app';
// const API_BASE = 'http://localhost:8000';
const API_BASE = 'http://backend.test';
const APP_ELEMENT = document.getElementById('app');

const state = {
    user: null,
    view: 'dashboard',
    profiles: [],
    pagination: {},
    filters: {}
};

// --- API Helpers ---
async function apiRequest(endpoint, options = {}, isRetry = false) {
    const accessToken = localStorage.getItem('access_token');
    
    options.headers = {
        'Accept': 'application/json',
        'X-API-Version': '1',
        ...options.headers
    };

    if (accessToken) {
        options.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    options.credentials = 'include';

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);

        if (response.status === 401 && !isRetry && endpoint !== '/auth/refresh') {
            // Attempt to refresh token
            const refreshSuccess = await refreshTokens();
            if (refreshSuccess) {
                return await apiRequest(endpoint, options, true); // Retry once
            }
            // If refresh fails, redirect to login
            logout();
            return null;
        }

        if (response.status === 401 && (isRetry || endpoint === '/auth/refresh')) {
            logout();
            return null;
        }

        return await response.json();
    } catch (err) {
        console.error('API Error:', err);
        return null;
    }
}

async function refreshTokens() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    try {
        const response = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-API-Version': '1'
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.json();
            if (result.status === 'success') {
                localStorage.setItem('access_token', result.data.access_token);
                localStorage.setItem('refresh_token', result.data.refresh_token);
                return true;
            }
        }
        return false;
    } catch (err) {
        return false;
    }
}

async function exportCSV() {
    const accessToken = localStorage.getItem('access_token');
    const form = document.getElementById('dash-filter-form');
    const formData = new FormData(form);
    const params = Object.fromEntries(formData.entries());
    params.format = 'csv';

    const qs = new URLSearchParams(params).toString();
    const url = `${API_BASE}/api/profiles/export?${qs}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-API-Version': '1',
                'Accept': 'text/csv',
                'Authorization': accessToken ? `Bearer ${accessToken}` : ''
            },
            credentials: 'include'
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) throw new Error('Export failed');

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `profiles_export_${new Date().getTime()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        a.remove();
    } catch (err) {
        console.error('Export Error:', err);
        alert('Failed to export CSV. Please try again.');
    }
}

function logout() {
    apiRequest('/auth/logout', { method: 'POST' });
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.hash = '#login';
}

// --- Routing ---

async function handleRoute() {
    const hash = window.location.hash || '#dashboard';
    const view = hash.substring(1).split('?')[0];

    if (view === 'login') {
        renderLogin(APP_ELEMENT, API_BASE);
        return;
    }

    if (view === 'callback') {
        handleCallback();
        return;
    }

    renderLayout(
        APP_ELEMENT,
        view,
        logout,
        (container) => renderDashboard(container, apiRequest, exportCSV),
        (container) => renderAccount(container, apiRequest)
    );
}

function handleCallback() {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const tokenHash = urlParams.get('tokens');

    if (tokenHash) {
        try {
            const tokens = JSON.parse(atob(decodeURIComponent(tokenHash)));
            localStorage.setItem('access_token', tokens.access_token);
            localStorage.setItem('refresh_token', tokens.refresh_token);
        } catch (e) {
            console.error('Failed to parse tokens', e);
        }
    }

    window.location.hash = '#dashboard';
}

// --- Initialization ---

async function checkAuthAndRoute() {
    const hash = window.location.hash || '#dashboard';
    const view = hash.substring(1).split('?')[0];

    // Allow login and callback pages without auth check
    if (view === 'login' || view === 'callback') {
        handleRoute();
        return;
    }

    // For protected routes, verify authentication first
    const userResponse = await apiRequest('/api/me');

    if (!userResponse) {
        // 401 or error - logout handles redirection
        return;
    }

    // User is authenticated, render the requested view
    state.user = userResponse.data;
    handleRoute();
}

function init() {
    window.addEventListener('hashchange', () => {
        checkAuthAndRoute();
    });
    checkAuthAndRoute();
}

init();

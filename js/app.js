import { renderLogin } from './views/auth.js';
import { renderDashboard, loadDashboardData } from './views/dashboard.js';
import { renderAccount } from './views/account.js';
import { renderLayout } from './views/layout.js';

const API_BASE = 'http://localhost:8000';
const APP_ELEMENT = document.getElementById('app');

const state = {
    user: null,
    view: 'dashboard',
    profiles: [],
    pagination: {},
    filters: {}
};

// --- API Helpers ---

async function apiRequest(endpoint, options = {}) {
    options.headers = {
        'Accept': 'application/json',
        'X-API-Version': '1',
        ...options.headers
    };
    options.credentials = 'include';

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        if (response.status === 401) {
            window.location.hash = '#login';
            return null;
        }
        return await response.json();
    } catch (err) {
        console.error('API Error:', err);
        return null;
    }
}

async function exportCSV() {
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
                'Accept': 'text/csv'
            },
            credentials: 'include'
        });

        if (response.status === 401) {
            window.location.hash = '#login';
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

    renderLayout(
        APP_ELEMENT, 
        view, 
        logout, 
        (container) => renderDashboard(container, apiRequest, exportCSV),
        (container) => renderAccount(container, apiRequest)
    );
}

// --- Initialization ---

function init() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
}

init();

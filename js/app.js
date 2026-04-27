const API_BASE = 'http://localhost:8000';
const APP_ELEMENT = document.getElementById('app');

const state = {
    user: null,
    view: 'dashboard',
    profiles: [],
    pagination: {},
    filters: {}
};

// --- Initialization ---

async function init() {
    window.addEventListener('hashchange', handleRoute);
    await handleRoute();
}

async function handleRoute() {
    const hash = window.location.hash || '#dashboard';
    const view = hash.substring(1).split('?')[0];
    
    // We can't check HTTP-only cookies in JS. 
    // We'll let the API requests handle the 401 redirection.
    // However, we don't want to redirect to dashboard if we are on login.
    if (view === 'login') {
        renderLogin();
        return;
    }

    render(view);
}

// --- Rendering ---

function render(view) {
    if (view === 'login') {
        renderLogin();
    } else {
        renderLayout(view);
    }
}

function renderLogin() {
    // If we have a 'logged_out' param, we don't want to auto-redirect
    APP_ELEMENT.innerHTML = `
        <div class="container d-flex justify-content-center">
            <div class="login-container card p-4 text-center mt-5 shadow">
                <h2 class="mb-4 text-primary">Insighta Labs+</h2>
                <p class="text-muted">Secure Multi-Interface Integration</p>
                <hr>
                <p class="small text-muted mb-4">You will be redirected to GitHub to authenticate.</p>
                <a href="${API_BASE}/auth/github" class="btn btn-dark btn-lg w-100">
                    <i class="bi bi-github me-2"></i> Continue with GitHub
                </a>
            </div>
        </div>
    `;
}

function renderLayout(view) {
    APP_ELEMENT.innerHTML = `
        <div class="container-fluid">
            <div class="row">
                <!-- Sidebar -->
                <nav class="col-md-3 col-lg-2 d-md-block bg-white sidebar collapse">
                    <div class="position-sticky pt-3">
                        <h5 class="px-3 mb-4 text-primary">Insighta Labs+</h5>
                        <ul class="nav flex-column">
                            <li class="nav-item">
                                <a class="nav-link ${view === 'dashboard' ? 'active' : ''}" href="#dashboard">
                                    <i class="bi bi-speedometer2 me-2"></i> Dashboard
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link ${view === 'profiles' ? 'active' : ''}" href="#profiles">
                                    <i class="bi bi-people me-2"></i> Profiles
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link ${view === 'search' ? 'active' : ''}" href="#search">
                                    <i class="bi bi-search me-2"></i> Search
                                </a>
                            </li>
                        </ul>
                        <hr>
                        <ul class="nav flex-column">
                            <li class="nav-item">
                                <a class="nav-link" href="#" id="logout-btn">
                                    <i class="bi bi-box-arrow-right me-2"></i> Logout
                                </a>
                            </li>
                        </ul>
                    </div>
                </nav>

                <!-- Main Content -->
                <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
                    <div id="view-content"></div>
                </main>
            </div>
        </div>
    `;

    document.getElementById('logout-btn').onclick = logout;
    
    const content = document.getElementById('view-content');
    switch (view) {
        case 'dashboard': renderDashboard(content); break;
        case 'profiles': renderProfiles(content); break;
        case 'search': renderSearch(content); break;
    }
}

async function renderDashboard(container) {
    container.innerHTML = `
        <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Dashboard</h1>
        </div>
        <div class="row">
            <div class="col-md-4 mb-4">
                <div class="card p-3 text-center">
                    <h6 class="text-muted">Total Profiles</h6>
                    <h2 id="total-count">-</h2>
                </div>
            </div>
            <!-- More metrics could be added here -->
        </div>
    `;
    
    // Fetch some basic data
    const data = await apiRequest('/api/profiles?limit=1');
    if (data) document.getElementById('total-count').innerText = data.total;
}

async function renderProfiles(container) {
    container.innerHTML = `
        <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Profiles</h1>
            <div class="btn-toolbar mb-2 mb-md-0">
                <button type="button" class="btn btn-sm btn-outline-secondary me-2" id="export-csv">
                    <i class="bi bi-download me-1"></i> Export CSV
                </button>
                <button type="button" class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#createModal">
                    <i class="bi bi-plus-lg me-1"></i> Create Profile
                </button>
            </div>
        </div>

        <!-- Filters -->
        <div class="card mb-4 p-3">
            <form id="filter-form" class="row g-3">
                <div class="col-md-3">
                    <select class="form-select" name="gender">
                        <option value="">All Genders</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <input type="text" class="form-control" name="country_id" placeholder="Country Code (e.g. NG)">
                </div>
                <div class="col-md-3">
                    <button type="submit" class="btn btn-secondary">Apply Filters</button>
                </div>
            </form>
        </div>

        <!-- Table -->
        <div class="table-responsive bg-white rounded shadow-sm">
            <table class="table table-hover mb-0">
                <thead class="table-light">
                    <tr>
                        <th>Name</th>
                        <th>Gender</th>
                        <th>Age</th>
                        <th>Country</th>
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody id="profiles-table-body">
                    <tr><td colspan="5" class="text-center py-4">Loading profiles...</td></tr>
                </tbody>
            </table>
        </div>
        <div id="pagination" class="mt-4 d-flex justify-content-center"></div>

        <!-- Create Modal -->
        <div class="modal fade" id="createModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Create Profile</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <form id="create-profile-form">
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Full Name</label>
                                <input type="text" class="form-control" name="name" required>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-primary">Create</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    loadProfiles();

    document.getElementById('filter-form').onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const params = Object.fromEntries(formData.entries());
        loadProfiles(params);
    };

    document.getElementById('create-profile-form').onsubmit = handleCreateProfile;
    document.getElementById('export-csv').onclick = exportCSV;
}

async function renderSearch(container) {
    container.innerHTML = `
        <div class="pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Natural Language Search</h1>
        </div>
        <div class="card mb-4 p-4 text-center">
            <form id="search-form" class="mx-auto w-100" style="max-width: 600px;">
                <div class="input-group input-group-lg">
                    <input type="text" class="form-control" placeholder="Try 'young males from nigeria'..." id="search-input">
                    <button class="btn btn-primary" type="submit">Search</button>
                </div>
            </form>
        </div>
        <div id="search-results"></div>
    `;

    document.getElementById('search-form').onsubmit = async (e) => {
        e.preventDefault();
        const query = document.getElementById('search-input').value;
        const resultsContainer = document.getElementById('search-results');
        resultsContainer.innerHTML = '<div class="text-center">Searching...</div>';
        
        const data = await apiRequest(`/api/profiles/search?q=${encodeURIComponent(query)}`);
        if (data && data.data) {
            resultsContainer.innerHTML = `
                <div class="table-responsive bg-white rounded shadow-sm">
                    <table class="table table-hover">
                        <thead><tr><th>Name</th><th>Gender</th><th>Age</th><th>Country</th></tr></thead>
                        <tbody>
                            ${data.data.map(p => `<tr><td>${p.name}</td><td>${p.gender}</td><td>${p.age}</td><td>${p.country_name}</td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    };
}

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
            // Attempt refresh or redirect to login
            window.location.hash = '#login';
            return null;
        }
        return await response.json();
    } catch (err) {
        console.error('API Error:', err);
        return null;
    }
}

async function loadProfiles(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const data = await apiRequest(`/api/profiles?${qs}`);
    const tbody = document.getElementById('profiles-table-body');
    
    if (data && data.data) {
        tbody.innerHTML = data.data.map(p => `
            <tr>
                <td>${p.name}</td>
                <td><span class="badge bg-light text-dark">${p.gender}</span></td>
                <td>${p.age}</td>
                <td>${p.country_name}</td>
                <td><small class="text-muted">${new Date(p.created_at).toLocaleDateString()}</small></td>
            </tr>
        `).join('');
        
        renderPagination(data);
    }
}

function renderPagination(data) {
    const nav = document.getElementById('pagination');
    if (!data.total_pages || data.total_pages <= 1) {
        nav.innerHTML = '';
        return;
    }

    nav.innerHTML = `
        <nav>
            <ul class="pagination">
                <li class="page-item ${data.page === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="loadProfiles({page: ${data.page - 1}})">Previous</a>
                </li>
                <li class="page-item disabled"><span class="page-link">Page ${data.page} of ${data.total_pages}</span></li>
                <li class="page-item ${data.page === data.total_pages ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="loadProfiles({page: ${data.page + 1}})">Next</a>
                </li>
            </ul>
        </nav>
    `;
}

async function handleCreateProfile(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = await apiRequest('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData.entries()))
    });

    if (data && data.status === 'success') {
        // Close modal (Bootstrap 5 way)
        const modal = bootstrap.Modal.getInstance(document.getElementById('createModal'));
        modal.hide();
        loadProfiles();
    } else {
        alert(data?.message || 'Failed to create profile');
    }
}

function exportCSV() {
    window.location.href = `${API_BASE}/api/profiles/export?format=csv`;
}

function logout() {
    apiRequest('/auth/logout', { method: 'POST' });
    window.location.hash = '#login';
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

init();

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
        <!-- Responsive Top Navbar -->
        <nav class="navbar navbar-expand-md navbar-dark bg-primary sticky-top shadow-sm">
            <div class="container-fluid">
                <button class="navbar-toggler border-0 me-2" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarOffcanvas">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <a class="navbar-brand fw-bold" href="#">Insighta Labs+</a>
                <div class="collapse navbar-collapse d-none d-md-block" id="navbarNav">
                    <span class="navbar-text ms-auto small opacity-75">Intelligence Query Engine</span>
                </div>
            </div>
        </nav>

        <div class="container-fluid">
            <div class="row">
                <!-- Sidebar as Offcanvas -->
                <div class="offcanvas-md offcanvas-start bg-white border-end col-md-3 col-lg-2 p-0" tabindex="-1" id="sidebarOffcanvas">
                    <div class="offcanvas-header border-bottom d-md-none">
                        <h5 class="offcanvas-title text-primary fw-bold">Menu</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="offcanvas" data-bs-target="#sidebarOffcanvas"></button>
                    </div>
                    <div class="offcanvas-body p-3 flex-column">
                        <ul class="nav nav-pills flex-column mb-auto w-100">
                            <li class="nav-item mb-1">
                                <a class="nav-link ${view === 'dashboard' ? 'active' : 'text-dark'}" href="#dashboard">
                                    <i class="bi bi-speedometer2 me-2"></i> Dashboard
                                </a>
                            </li>
                            <li class="nav-item mb-1">
                                <a class="nav-link ${view === 'account' ? 'active' : 'text-dark'}" href="#account">
                                    <i class="bi bi-person-circle me-2"></i> My Account
                                </a>
                            </li>
                        </ul>
                        <hr>
                        <ul class="nav flex-column w-100">
                            <li class="nav-item">
                                <a class="nav-link text-danger" href="#" id="logout-btn">
                                    <i class="bi bi-box-arrow-right me-2"></i> Logout
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- Main Content -->
                <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4 min-vh-100 bg-light">
                    <div id="view-content"></div>
                </main>
            </div>
        </div>
    `;

    // Ensure offcanvas closes on link click on mobile
    const offcanvasEl = document.getElementById('sidebarOffcanvas');
    offcanvasEl.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            const oc = bootstrap.Offcanvas.getInstance(offcanvasEl);
            if (oc) oc.hide();
        });
    });

    document.getElementById('logout-btn').onclick = (e) => {
        e.preventDefault();
        logout();
    };
    
    const content = document.getElementById('view-content');
    switch (view) {
        case 'dashboard': renderDashboard(content); break;
        case 'account': renderAccount(content); break;
        default: renderDashboard(content); break;
    }
}

async function renderAccount(container) {
    container.innerHTML = `
        <div class="pt-3 pb-2 mb-4 border-bottom">
            <h1 class="h2">My Account</h1>
        </div>
        <div class="row">
            <div class="col-md-6">
                <div class="card shadow-sm">
                    <div class="card-body p-4">
                        <div class="d-flex align-items-center mb-4">
                            <img id="acc-avatar" src="" class="rounded-circle me-3" style="width: 80px; height: 80px; background: #eee;">
                            <div>
                                <h4 class="mb-0" id="acc-name">Loading...</h4>
                                <p class="text-muted mb-0" id="acc-handle">@username</p>
                            </div>
                        </div>
                        <div class="row g-3">
                            <div class="col-sm-6">
                                <label class="small text-muted d-block">Access Role</label>
                                <span class="badge bg-primary px-3" id="acc-role">-</span>
                            </div>
                            <div class="col-sm-6">
                                <label class="small text-muted d-block">Email Address</label>
                                <span id="acc-email">-</span>
                            </div>
                            <div class="col-sm-6">
                                <label class="small text-muted d-block">Account Created</label>
                                <span id="acc-created">-</span>
                            </div>
                            <div class="col-sm-6">
                                <label class="small text-muted d-block">Status</label>
                                <span class="text-success"><i class="bi bi-check-circle-fill me-1"></i> Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card shadow-sm">
                    <div class="card-body p-4">
                        <h6>Role Information</h6>
                        <p class="text-muted small">Your role determines your permissions within the Insighta Labs+ platform.</p>
                        <div id="role-info-admin" class="d-none">
                            <div class="alert alert-info py-2 small">
                                <i class="bi bi-info-circle me-2"></i> You have <strong>Admin</strong> privileges. You can create, delete, and manage profiles.
                            </div>
                        </div>
                        <div id="role-info-analyst" class="d-none">
                            <div class="alert alert-light border py-2 small">
                                <i class="bi bi-info-circle me-2"></i> You have <strong>Analyst</strong> privileges. You can search, filter, and export profile data.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const data = await apiRequest('/api/me');
    if (data && data.data) {
        const user = data.data;
        document.getElementById('acc-avatar').src = user.avatar_url;
        document.getElementById('acc-name').innerText = user.username;
        document.getElementById('acc-handle').innerText = '@' + user.username;
        document.getElementById('acc-role').innerText = user.role.toUpperCase();
        document.getElementById('acc-email').innerText = user.email || 'Not shared';
        document.getElementById('acc-created').innerText = new Date(user.created_at).toLocaleDateString();
        
        if (user.role === 'admin') {
            document.getElementById('role-info-admin').classList.remove('d-none');
        } else {
            document.getElementById('role-info-analyst').classList.remove('d-none');
        }
    }
}

// Remove old renders
// (Profiles and Search are now in Dashboard)

async function renderDashboard(container) {
    container.innerHTML = `
        <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Insights Dashboard</h1>
            <div class="btn-toolbar mb-2 mb-md-0">
                <button type="button" class="btn btn-sm btn-outline-secondary me-2" id="export-csv-dash">
                    <i class="bi bi-download me-1"></i> Export CSV
                </button>
            </div>
        </div>

        <!-- Metrics Row -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card border-start border-primary border-4 p-3 shadow-sm">
                    <div class="d-flex align-items-center">
                        <div class="bg-primary bg-opacity-10 p-3 rounded me-3">
                            <i class="bi bi-people text-primary fs-4"></i>
                        </div>
                        <div>
                            <h6 class="text-muted mb-0 small uppercase">Total Profiles</h6>
                            <h3 class="mb-0" id="total-count">-</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Search & Filters Card -->
        <div class="card mb-4 shadow-sm">
            <div class="card-body">
                <h6 class="card-title mb-3"><i class="bi bi-search me-2"></i>Search & Filter</h6>
                <form id="dash-filter-form" class="row g-3">
                    <div class="col-md-6">
                        <div class="input-group">
                            <span class="input-group-text bg-white"><i class="bi bi-stars text-primary"></i></span>
                            <input type="text" class="form-control" name="q" id="nl-search-input" placeholder="Natural language search (e.g. 'males from UK over 20')">
                        </div>
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" name="gender">
                            <option value="">All Genders</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <input type="text" class="form-control" name="country_id" placeholder="Country Code">
                    </div>
                    <div class="col-md-2">
                        <button type="submit" class="btn btn-primary w-100">Apply</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Results Table -->
        <div class="card shadow-sm">
            <div class="card-header bg-white py-3">
                <h6 class="mb-0">Profile Registry</h6>
            </div>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Name</th>
                            <th>Gender</th>
                            <th>Age</th>
                            <th>Country</th>
                            <th>Probability</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody id="dash-profiles-table-body">
                        <tr><td colspan="6" class="text-center py-5"><div class="spinner-border text-primary spinner-border-sm"></div> Loading...</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="card-footer bg-white py-3">
                <div id="dash-pagination" class="d-flex justify-content-between align-items-center"></div>
            </div>
        </div>
    `;
    
    // Initial load
    loadDashboardData();

    document.getElementById('dash-filter-form').onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const params = Object.fromEntries(formData.entries());
        loadDashboardData(params);
    };

    document.getElementById('export-csv-dash').onclick = exportCSV;
}

async function loadDashboardData(params = {}) {
    const tbody = document.getElementById('dash-profiles-table-body');
    const pagination = document.getElementById('dash-pagination');
    
    // If 'q' is present, use search endpoint, otherwise use profiles endpoint
    const endpoint = params.q ? '/api/profiles/search' : '/api/profiles';
    const qs = new URLSearchParams(params).toString();
    
    const data = await apiRequest(`${endpoint}?${qs}`);
    
    if (data && data.data) {
        // Update Total Count Metric
        const totalCountEl = document.getElementById('total-count');
        if (totalCountEl) totalCountEl.innerText = data.total || 0;

        tbody.innerHTML = data.data.map(p => `
            <tr>
                <td class="fw-bold text-dark">${p.name}</td>
                <td><span class="badge ${p.gender === 'male' ? 'bg-info-subtle text-info' : 'bg-danger-subtle text-danger'} text-capitalize">${p.gender}</span></td>
                <td><span class="fw-medium">${p.age || 'N/A'}</span> <small class="text-muted">(${p.age_group})</small></td>
                <td>
                    <div class="d-flex align-items-center">
                        <span class="fi fi-${p.country_id?.toLowerCase()} me-2"></span>
                        <span>${p.country_name}</span>
                    </div>
                </td>
                <td>
                    <div class="progress" style="height: 6px; width: 60px;">
                        <div class="progress-bar" style="width: ${Math.round(p.gender_probability * 100)}%"></div>
                    </div>
                    <small class="text-muted">${Math.round(p.gender_probability * 100)}% confidence</small>
                </td>
                <td><small class="text-muted">${new Date(p.created_at).toLocaleDateString()}</small></td>
            </tr>
        `).join('');

        if (tbody.innerHTML === '') {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No profiles match your criteria.</td></tr>';
        }
        
        renderDashPagination(data, params);
    }
}

function renderDashPagination(data, params) {
    const nav = document.getElementById('dash-pagination');
    if (!data.total_pages) {
        nav.innerHTML = '';
        return;
    }

    const start = ((data.page - 1) * data.limit) + 1;
    const end = Math.min(data.page * data.limit, data.total);

    nav.innerHTML = `
        <div class="small text-muted">
            Showing <strong>${start}-${end}</strong> of <strong>${data.total}</strong>
        </div>
        <nav>
            <ul class="pagination pagination-sm mb-0">
                <li class="page-item ${data.page === 1 ? 'disabled' : ''}">
                    <button class="page-link" onclick='loadDashboardData(${JSON.stringify({...params, page: data.page - 1})})'>Previous</button>
                </li>
                <li class="page-item active"><span class="page-link">${data.page}</span></li>
                <li class="page-item ${data.page >= data.total_pages ? 'disabled' : ''}">
                    <button class="page-link" onclick='loadDashboardData(${JSON.stringify({...params, page: data.page + 1})})'>Next</button>
                </li>
            </ul>
        </nav>
    `;
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

async function exportCSV() {
    // Get current filters from the form
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

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

init();

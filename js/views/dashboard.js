export async function renderDashboard(container, apiRequest, exportCSV) {
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
    await loadDashboardData({}, apiRequest);

    document.getElementById('dash-filter-form').onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const params = Object.fromEntries(formData.entries());
        loadDashboardData(params, apiRequest);
    };

    document.getElementById('export-csv-dash').onclick = exportCSV;
}

export async function loadDashboardData(params = {}, apiRequest) {
    const tbody = document.getElementById('dash-profiles-table-body');
    const pagination = document.getElementById('dash-pagination');
    if (!tbody) return;

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
        
        renderDashPagination(data, params, apiRequest);
    }
}

function renderDashPagination(data, params, apiRequest) {
    const nav = document.getElementById('dash-pagination');
    if (!data.total_pages) {
        if (nav) nav.innerHTML = '';
        return;
    }

    const start = ((data.page - 1) * data.limit) + 1;
    const end = Math.min(data.page * data.limit, data.total);

    window.loadDash = (p) => loadDashboardData(p, apiRequest);

    nav.innerHTML = `
        <div class="small text-muted">
            Showing <strong>${start}-${end}</strong> of <strong>${data.total}</strong>
        </div>
        <nav>
            <ul class="pagination pagination-sm mb-0">
                <li class="page-item ${data.page === 1 ? 'disabled' : ''}">
                    <button class="page-link" onclick='window.loadDash(${JSON.stringify({...params, page: data.page - 1})})'>Previous</button>
                </li>
                <li class="page-item active"><span class="page-link">${data.page}</span></li>
                <li class="page-item ${data.page >= data.total_pages ? 'disabled' : ''}">
                    <button class="page-link" onclick='window.loadDash(${JSON.stringify({...params, page: data.page + 1})})'>Next</button>
                </li>
            </ul>
        </nav>
    `;
}

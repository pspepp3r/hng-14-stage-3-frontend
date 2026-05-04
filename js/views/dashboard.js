export async function renderDashboard(container, apiRequest, exportCSV) {
    // Get user data first to check if admin
    const userResponse = await apiRequest('/api/me');
    const isAdmin = userResponse?.data?.role === 'admin';

    container.innerHTML = `
        <!-- Toast Container -->
        <div id="toast-container" class="toast-container position-fixed bottom-0 end-0 p-3"></div>

        <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Insights Dashboard</h1>
            <div class="btn-toolbar mb-2 mb-md-0">
                ${isAdmin ? `
                    <button type="button" class="btn btn-sm btn-primary me-2" id="create-profile-btn">
                        <i class="bi bi-plus-circle me-1"></i> New Profile
                    </button>
                ` : ''}
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
                            ${isAdmin ? '<th>Actions</th>' : ''}
                        </tr>
                    </thead>
                    <tbody id="dash-profiles-table-body">
                        <tr><td colspan="${isAdmin ? 7 : 6}" class="text-center py-5"><div class="spinner-border text-primary spinner-border-sm"></div> Loading...</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="card-footer bg-white py-3">
                <div id="dash-pagination" class="d-flex justify-content-between align-items-center"></div>
            </div>
        </div>

        <!-- Create Profile Modal -->
        <div class="modal fade" id="createProfileModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title"><i class="bi bi-plus-circle me-2"></i>Create New Profile</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <form id="create-profile-form">
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="create-name" class="form-label">Full Name *</label>
                                <input type="text" class="form-control" id="create-name" name="name" placeholder="Enter profile name" required>
                            </div>
                            <div class="mb-3">
                                <label for="create-gender" class="form-label">Gender</label>
                                <select class="form-select" id="create-gender" name="gender">
                                    <option value="">Select gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="create-age" class="form-label">Age</label>
                                <input type="number" class="form-control" id="create-age" name="age" min="1" max="150">
                            </div>
                            <div class="mb-3">
                                <label for="create-country" class="form-label">Country Code</label>
                                <input type="text" class="form-control" id="create-country" name="country_id" placeholder="e.g., US, UK, NG" maxlength="2">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-primary">
                                <i class="bi bi-check-circle me-1"></i> Create Profile
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Edit Profile Modal -->
        <div class="modal fade" id="editProfileModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title"><i class="bi bi-pencil-square me-2"></i>Edit Profile</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <form id="edit-profile-form">
                        <input type="hidden" id="edit-profile-id" name="id">
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="edit-name" class="form-label">Full Name *</label>
                                <input type="text" class="form-control" id="edit-name" name="name" placeholder="Enter profile name" required>
                            </div>
                            <div class="mb-3">
                                <label for="edit-gender" class="form-label">Gender</label>
                                <select class="form-select" id="edit-gender" name="gender">
                                    <option value="">Select gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="edit-age" class="form-label">Age</label>
                                <input type="number" class="form-control" id="edit-age" name="age" min="1" max="150">
                            </div>
                            <div class="mb-3">
                                <label for="edit-country" class="form-label">Country Code</label>
                                <input type="text" class="form-control" id="edit-country" name="country_id" placeholder="e.g., US, UK, NG" maxlength="2">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-warning">
                                <i class="bi bi-check-circle me-1"></i> Update Profile
                            </button>
                        </div>
                    </form>
                </div>
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

    // Create profile modal and form handler (admin only)
    if (isAdmin) {
        const createBtn = document.getElementById('create-profile-btn');
        const createForm = document.getElementById('create-profile-form');

        if (createBtn) {
            createBtn.addEventListener('click', () => {
                createForm.reset();
                const modal = new bootstrap.Modal(document.getElementById('createProfileModal'));
                modal.show();
            });
        }

        if (createForm) {
            createForm.onsubmit = (e) => handleCreateProfileSubmit(e, apiRequest);
        }
    }
}

export async function loadDashboardData(params = {}, apiRequest) {
    const tbody = document.getElementById('dash-profiles-table-body');
    const pagination = document.getElementById('dash-pagination');
    if (!tbody) return;

    // Check if admin
    const userResponse = await apiRequest('/api/me');
    const isAdmin = userResponse?.data?.role === 'admin';

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
                ${isAdmin ? `
                    <td>
                        <div class="btn-group btn-group-sm" role="group">
                            <button type="button" class="btn btn-outline-warning edit-profile-btn" data-profile-id="${p.id}" data-profile-name="${p.name}" title="Edit profile">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button type="button" class="btn btn-outline-danger delete-profile-btn" data-profile-id="${p.id}" data-profile-name="${p.name}" title="Delete profile">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                ` : ''}
            </tr>
        `).join('');

        if (tbody.innerHTML === '') {
            const colspan = isAdmin ? 7 : 6;
            tbody.innerHTML = `<tr><td colspan="${colspan}" class="text-center py-4 text-muted">No profiles match your criteria.</td></tr>`;
        }

        renderDashPagination(data, params, apiRequest);

        // Attach event listeners to action buttons
        if (isAdmin) {
            setupActionButtonListeners(apiRequest);
        }
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
                    <button class="page-link" onclick='window.loadDash(${JSON.stringify({ ...params, page: data.page - 1 })})'>Previous</button>
                </li>
                <li class="page-item active"><span class="page-link">${data.page}</span></li>
                <li class="page-item ${data.page >= data.total_pages ? 'disabled' : ''}">
                    <button class="page-link" onclick='window.loadDash(${JSON.stringify({ ...params, page: data.page + 1 })})'>Next</button>
                </li>
            </ul>
        </nav>
    `;
}

// --- Create Profile Handler ---
async function handleCreateProfileSubmit(e, apiRequest) {
    e.preventDefault();

    const form = document.getElementById('create-profile-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Remove empty values
    Object.keys(data).forEach(key => {
        if (data[key] === '') delete data[key];
    });

    const response = await apiRequest('/api/profiles', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    const modal = bootstrap.Modal.getInstance(document.getElementById('createProfileModal'));

    if (response && response.status === 'success') {
        showToast(`Profile "${data.name}" created successfully`, 'success');
        form.reset();
        modal.hide();
        // Reload table data
        setTimeout(() => {
            loadDashboardData({}, apiRequest);
        }, 500);
    } else {
        showToast(response?.message || 'Failed to create profile', 'error');
    }
}

// --- Toast Notification ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toastId = `toast-${Date.now()}`;
    const bgClass = {
        success: 'bg-success',
        error: 'bg-danger',
        warning: 'bg-warning',
        info: 'bg-info'
    }[type] || 'bg-info';

    const iconClass = {
        success: 'bi-check-circle',
        error: 'bi-exclamation-circle',
        warning: 'bi-exclamation-triangle',
        info: 'bi-info-circle'
    }[type] || 'bi-info-circle';

    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast align-items-center text-white ${bgClass} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="bi ${iconClass} me-2"></i>${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    container.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    // Remove from DOM after hidden
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// --- Action Button Listeners ---
function setupActionButtonListeners(apiRequest) {
    // Edit button listeners
    document.querySelectorAll('.edit-profile-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const profileId = this.getAttribute('data-profile-id');
            const profileName = this.getAttribute('data-profile-name');
            openEditModal(profileId, profileName, apiRequest);
        });
    });

    // Delete button listeners
    document.querySelectorAll('.delete-profile-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const profileId = this.getAttribute('data-profile-id');
            const profileName = this.getAttribute('data-profile-name');
            confirmDeleteProfile(profileId, profileName, apiRequest);
        });
    });
}

// --- Edit Profile Modal ---
async function openEditModal(profileId, profileName, apiRequest) {
    // Fetch profile data
    const profileData = await apiRequest(`/api/profiles/${profileId}`);

    if (!profileData || !profileData.data || profileData.data.length === 0) {
        showToast('Failed to load profile data', 'error');
        return;
    }

    const profile = profileData.data[0];

    // Populate modal form
    document.getElementById('edit-profile-id').value = profile.id;
    document.getElementById('edit-name').value = profile.name;
    document.getElementById('edit-gender').value = profile.gender || '';
    document.getElementById('edit-age').value = profile.age || '';
    document.getElementById('edit-country').value = profile.country_id || '';

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
    modal.show();

    // Setup form submission
    const form = document.getElementById('edit-profile-form');
    form.onsubmit = (e) => handleEditProfileSubmit(e, apiRequest, modal);
}

async function handleEditProfileSubmit(e, apiRequest, modal) {
    e.preventDefault();

    // Note: Backend doesn't have update endpoint yet
    // This is prepared for when it's available (PATCH /api/profiles/:id)
    showToast('Profile update functionality coming soon', 'info');
    modal.hide();
}

// --- Delete Profile ---
async function confirmDeleteProfile(profileId, profileName, apiRequest) {
    if (!confirm(`Are you sure you want to delete the profile "${profileName}"? This action cannot be undone.`)) {
        return;
    }

    const response = await apiRequest(`/api/profiles/${profileId}`, { method: 'DELETE' });

    if (response && response.status === 'success') {
        showToast(`Profile "${profileName}" deleted successfully`, 'success');
        // Reload table data
        setTimeout(() => {
            loadDashboardData({}, apiRequest);
        }, 500);
    } else {
        showToast(response?.message || 'Failed to delete profile', 'error');
    }
}

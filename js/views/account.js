export async function renderAccount(container, apiRequest) {
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

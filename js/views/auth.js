export function renderLogin(container, apiBase) {
    container.innerHTML = `
        <div class="container d-flex justify-content-center">
            <div class="login-container card p-4 text-center mt-5 shadow">
                <h2 class="mb-4 text-primary">Insighta Labs+</h2>
                <p class="text-muted">Secure Multi-Interface Integration</p>
                <hr>
                <p class="small text-muted mb-4">You will be redirected to GitHub to authenticate.</p>
                <a href="${apiBase}/auth/github" class="btn btn-dark btn-lg w-100">
                    <i class="bi bi-github me-2"></i> Continue with GitHub
                </a>
            </div>
        </div>
    `;
}

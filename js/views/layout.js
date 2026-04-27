export function renderLayout(container, view, logout, renderDashboard, renderAccount) {
    container.innerHTML = `
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
    if (view === 'account') {
        renderAccount(content);
    } else {
        renderDashboard(content);
    }
}

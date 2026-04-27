# Insighta Web Portal

A responsive, browser-based interface for non-technical users of the Insighta Labs+ platform.

## Features

- **GitHub OAuth Login:** Seamless authentication via GitHub.
- **Dashboard:** At-a-glance metrics (total profiles, etc.).
- **Profile Management:** Search, filter, and view detailed demographic profiles.
- **Data Export:** Export filtered profile data to CSV.
- **Role-Based UI:** Interfaces adapt based on user roles (Admin vs. Analyst).

## Technical Stack

- **Styling:** HTML5, CSS3, and Bootstrap 5 (CDN).
- **Icons:** Bootstrap Icons (CDN).
- **Logic:** Vanilla JavaScript (SPA architecture with hash-based routing).
- **Security:** HTTP-only cookies for token storage and CSRF protection.

## Setup

1. Ensure the backend is running at `http://localhost:8000`.
2. Serve the frontend directory using any web server:

   ```bash
   # Using PHP's built-in server
   php -S localhost:3000
   ```

3. Open `http://localhost:3000` in your browser.

## Authentication Logic

The web portal stores JWT tokens in **HTTP-only cookies** set by the backend. This prevents Cross-Site Scripting (XSS) attacks from accessing sensitive tokens. The frontend JavaScript logic checks for the presence of an `access_token` cookie to determine authentication state.

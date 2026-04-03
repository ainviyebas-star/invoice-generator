// frontend/js/config.js
// Use Netlify's template syntax
window.APP_CONFIG = {
    API_BASE: '%VITE_API_URL%'
};

// If the placeholder isn't replaced, use fallback
if (window.APP_CONFIG.API_BASE === '%VITE_API_URL%') {
    window.APP_CONFIG.API_BASE = 'https://invoice-backend.atologbook.workers.dev/api';
}

console.log('App Config loaded:', window.APP_CONFIG);
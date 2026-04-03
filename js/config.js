// frontend/js/config.js
// Netlify will replace %VITE_API_URL% with your environment variable
window.APP_CONFIG = {
    API_BASE: '%VITE_API_URL%'
};

// Fallback for local development
if (window.APP_CONFIG.API_BASE === '%VITE_API_URL%' || window.APP_CONFIG.API_BASE.includes('%')) {
    // Local development fallback
    window.APP_CONFIG.API_BASE = window.location.hostname === 'localhost' 
        ? 'http://localhost:8787/api'
        : 'https://invoice-backend.atologbook.workers.dev/api';
}

console.log('🔧 App Config Loaded:', window.APP_CONFIG);
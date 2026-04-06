// frontend/js/config.js
// GitHub Pages compatible configuration

window.APP_CONFIG = {
    // This will be replaced during GitHub Actions build
    // Or fallback to the values below
    API_BASE: '%API_BASE_URL%',
    APP_NAME: '%APP_NAME%',
    VERSION: '%VERSION%',
    ENVIRONMENT: '%ENVIRONMENT%'
};

// Fallback for local development and if variables aren't replaced
if (window.APP_CONFIG.API_BASE === '%API_BASE_URL%' || window.APP_CONFIG.API_BASE.includes('%')) {
    // Local development fallback
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.APP_CONFIG.API_BASE = 'http://localhost:8787/api';
        window.APP_CONFIG.ENVIRONMENT = 'development';
    } 
    // GitHub Pages production fallback
    else {
        window.APP_CONFIG.API_BASE = 'https://invoice-backend.cloudflarelab.workers.dev/api';
        window.APP_CONFIG.ENVIRONMENT = 'production';
    }
    
    window.APP_CONFIG.APP_NAME = 'InvoicePro';
    window.APP_CONFIG.VERSION = '1.0.0';
}

console.log('🔧 App Config Loaded:', window.APP_CONFIG);
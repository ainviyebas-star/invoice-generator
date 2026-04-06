// frontend/js/config.template.js
// This file will be replaced during build with actual values

window.APP_CONFIG = {
    API_BASE: '%API_BASE_URL%',
    APP_NAME: '%APP_NAME%',
    VERSION: '%VERSION%',
    ENVIRONMENT: '%ENVIRONMENT%',
    BUILD_TIME: new Date().toISOString()
};

// Fallback for local development
if (window.APP_CONFIG.API_BASE === '%API_BASE_URL%') {
    window.APP_CONFIG.API_BASE = window.location.hostname === 'localhost' 
        ? 'http://localhost:8787/api'
        : 'https://invoice-backend.cloudflaselab.workers.dev/api';
}

console.log('🚀 App Config:', window.APP_CONFIG);
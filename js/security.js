// frontend/js/security.js - Complete Security Module (No Conflicts)

// ============================================
// 1. ENVIRONMENT DETECTION - Use config if available, otherwise detect
// ============================================

// Wait for config to load first, then check environment
let SEC_IS_PRODUCTION = false;

// Function to determine if production (uses existing config)
function secIsProduction() {
    // If APP_CONFIG is already loaded, use it
    if (window.APP_CONFIG && window.APP_CONFIG.ENVIRONMENT) {
        return window.APP_CONFIG.ENVIRONMENT === 'production';
    }
    // Fallback detection
    return window.location.hostname !== 'localhost' && 
           !window.location.hostname.includes('127.0.0.1') &&
           !window.location.hostname.includes('192.168') &&
           !window.location.hostname.includes('::1');
}

// Set production flag
SEC_IS_PRODUCTION = secIsProduction();

// ============================================
// 2. SAFE CONSOLE - Disable logging in production
// ============================================

if (SEC_IS_PRODUCTION && typeof window.__ORIGINAL_CONSOLE === 'undefined') {
    // Store original console methods
    window.__ORIGINAL_CONSOLE = {
        log: console.log,
        info: console.info,
        debug: console.debug,
        warn: console.warn,
        error: console.error
    };
    
    // Override console methods in production only
    console.log = function() {};
    console.info = function() {};
    console.debug = function() {};
    // Keep warnings and errors for debugging
}

// ============================================
// 3. PREVENT DEV TOOLS ACCESS
// ============================================

if (typeof window.__DEV_TOOLS_PREVENTED === 'undefined') {
    window.__DEV_TOOLS_PREVENTED = true;
    
    // Only apply in production
    if (SEC_IS_PRODUCTION) {
        // Disable right-click context menu
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            return false;
        });
        
        // Disable keyboard shortcuts for dev tools
        document.addEventListener('keydown', function(e) {
            // Prevent F12
            if (e.key === 'F12') {
                e.preventDefault();
                return false;
            }
            
            // Prevent Ctrl+Shift+I (DevTools)
            if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
                e.preventDefault();
                return false;
            }
            
            // Prevent Ctrl+Shift+J (Console)
            if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
                e.preventDefault();
                return false;
            }
            
            // Prevent Ctrl+U (View Source)
            if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
                e.preventDefault();
                return false;
            }
            
            // Prevent Ctrl+S (Save)
            if (e.ctrlKey && (e.key === 'S' || e.key === 's')) {
                e.preventDefault();
                return false;
            }
            
            // Prevent Ctrl+Shift+C (Inspect Element)
            if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
                e.preventDefault();
                return false;
            }
        });
    }
}

// ============================================
// 4. DETECT DEV TOOLS OPENING
// ============================================

let devToolsOpenFlag = false;
let devToolsInterval = null;

// Detection using console.log
const detectionElement = new Image();
Object.defineProperty(detectionElement, 'id', {
    get: function() {
        devToolsOpenFlag = true;
        if (!SEC_IS_PRODUCTION && window.__ORIGINAL_CONSOLE) {
            window.__ORIGINAL_CONSOLE.warn('Dev tools detected!');
        }
        return '';
    }
});

// Detection using window size differential
function detectDevToolsBySize() {
    const widthDiff = window.outerWidth - window.innerWidth > 160;
    const heightDiff = window.outerHeight - window.innerHeight > 160;
    
    if (widthDiff || heightDiff) {
        devToolsOpenFlag = true;
        if (!SEC_IS_PRODUCTION && window.__ORIGINAL_CONSOLE) {
            window.__ORIGINAL_CONSOLE.warn('Dev tools may be open (window size differential)');
        }
    }
}

// Start dev tools detection
function startDevToolsDetection() {
    if (devToolsInterval) {
        clearInterval(devToolsInterval);
    }
    
    devToolsInterval = setInterval(() => {
        devToolsOpenFlag = false;
        console.dir(detectionElement);
        detectDevToolsBySize();
        
        if (devToolsOpenFlag && SEC_IS_PRODUCTION) {
            // Optional: Send report to server
            if (window.navigator && window.navigator.sendBeacon) {
                window.navigator.sendBeacon('/api/security/devtools-detected', JSON.stringify({
                    timestamp: new Date().toISOString(),
                    url: window.location.href,
                    userAgent: navigator.userAgent
                }));
            }
        }
    }, 5000);
}

// Only start detection in production
if (SEC_IS_PRODUCTION) {
    startDevToolsDetection();
}

// ============================================
// 5. PREVENT SELECTION ON SENSITIVE ELEMENTS
// ============================================

function addNoSelectStyles() {
    if (document.getElementById('security-no-select-style')) return;
    
    const style = document.createElement('style');
    style.id = 'security-no-select-style';
    style.textContent = `
        .no-select, .sensitive-data, .invoice-number, .amount {
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// 6. SECURE STORAGE WITH EXPIRATION
// ============================================

const SecureStorageHelper = {
    setItem: function(key, value, expirationHours = 24) {
        try {
            const item = {
                value: value,
                expiry: new Date().getTime() + (expirationHours * 60 * 60 * 1000)
            };
            localStorage.setItem(`secure_${key}`, JSON.stringify(item));
        } catch(e) {
            // Storage might be full or disabled
        }
    },
    
    getItem: function(key) {
        try {
            const itemStr = localStorage.getItem(`secure_${key}`);
            if (!itemStr) return null;
            
            const item = JSON.parse(itemStr);
            const now = new Date().getTime();
            
            if (now > item.expiry) {
                localStorage.removeItem(`secure_${key}`);
                return null;
            }
            return item.value;
        } catch(e) {
            return null;
        }
    },
    
    clearExpired: function() {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('secure_')) {
                    const itemStr = localStorage.getItem(key);
                    if (itemStr) {
                        try {
                            const item = JSON.parse(itemStr);
                            if (new Date().getTime() > item.expiry) {
                                localStorage.removeItem(key);
                            }
                        } catch(e) {
                            // Not an expiring item
                        }
                    }
                }
            }
        } catch(e) {}
    },
    
    clearAll: function() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('secure_')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch(e) {}
    }
};

// ============================================
// 7. XSS PROTECTION - Sanitize User Input
// ============================================

function sanitizeUserInput(input) {
    if (!input) return '';
    if (typeof input !== 'string') return input;
    
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\//g, '&#x2F;');
}

// ============================================
// 8. CSRF TOKEN MANAGEMENT
// ============================================

let csrfTokenValue = null;

function generateCsrfToken() {
    try {
        const token = crypto.randomUUID ? crypto.randomUUID() : 
                      Math.random().toString(36).substring(2) + Date.now().toString(36);
        SecureStorageHelper.setItem('csrf_token', token, 24);
        return token;
    } catch(e) {
        return Math.random().toString(36).substring(2);
    }
}

function getCsrfToken() {
    if (!csrfTokenValue) {
        csrfTokenValue = SecureStorageHelper.getItem('csrf_token');
        if (!csrfTokenValue) {
            csrfTokenValue = generateCsrfToken();
        }
    }
    return csrfTokenValue;
}

// Add CSRF token to fetch requests (only if not already intercepting)
if (typeof window.__FETCH_INTERCEPTED === 'undefined') {
    window.__FETCH_INTERCEPTED = true;
    const originalFetchFunction = window.fetch;
    
    window.fetch = function(url, options = {}) {
        // Only add token to same-origin requests
        if (url.toString().startsWith('/') || 
            url.toString().includes(window.location.origin)) {
            options.headers = options.headers || {};
            if (!options.headers['X-CSRF-Token']) {
                options.headers['X-CSRF-Token'] = getCsrfToken();
            }
        }
        return originalFetchFunction.call(this, url, options);
    };
}

// ============================================
// 9. RATE LIMITING
// ============================================

const ApiRateLimiter = {
    calls: new Map(),
    
    isAllowed: function(endpoint, limit = 10, windowMs = 60000) {
        const now = Date.now();
        
        if (!this.calls.has(endpoint)) {
            this.calls.set(endpoint, []);
        }
        
        const timestamps = this.calls.get(endpoint).filter(t => now - t < windowMs);
        
        if (timestamps.length >= limit) {
            return false;
        }
        
        timestamps.push(now);
        this.calls.set(endpoint, timestamps);
        return true;
    },
    
    reset: function(endpoint) {
        if (endpoint) {
            this.calls.delete(endpoint);
        } else {
            this.calls.clear();
        }
    }
};

// ============================================
// 10. SESSION TIMEOUT MANAGEMENT
// ============================================

let sessionTimeoutId = null;
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

function resetSessionTimer() {
    if (sessionTimeoutId) {
        clearTimeout(sessionTimeoutId);
    }
    
    sessionTimeoutId = setTimeout(() => {
        // Clear sensitive data
        SecureStorageHelper.clearAll();
        
        // Redirect to home page
        if (!window.location.pathname.includes('index.html') && 
            window.location.pathname !== '/' &&
            !window.location.pathname.includes('login')) {
            window.location.href = '/index.html';
        }
        
        if (window.__ORIGINAL_CONSOLE) {
            window.__ORIGINAL_CONSOLE.info('Session timed out due to inactivity');
        }
    }, SESSION_DURATION_MS);
}

// Track user activity
const activityEventTypes = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
activityEventTypes.forEach(eventType => {
    document.addEventListener(eventType, resetSessionTimer);
});

// Start session timer
resetSessionTimer();

// ============================================
// 11. INITIALIZE SECURITY MODULE
// ============================================

function initializeSecurity() {
    // Clear expired storage items
    SecureStorageHelper.clearExpired();
    
    // Add no-select styles
    addNoSelectStyles();
    
    // Log initialization (only in development)
    if (!SEC_IS_PRODUCTION && window.__ORIGINAL_CONSOLE) {
        window.__ORIGINAL_CONSOLE.log('🔒 Security module initialized');
        window.__ORIGINAL_CONSOLE.log(`Environment: ${SEC_IS_PRODUCTION ? 'Production' : 'Development'}`);
    }
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSecurity);
} else {
    initializeSecurity();
}

// ============================================
// 12. EXPOSE UTILITIES (Limited)
// ============================================

window.SecurityUtils = {
    sanitize: sanitizeUserInput,
    isProduction: SEC_IS_PRODUCTION,
    getCsrfToken: getCsrfToken,
    clearStorage: () => SecureStorageHelper.clearAll(),
    rateLimit: (endpoint, limit, windowMs) => ApiRateLimiter.isAllowed(endpoint, limit, windowMs),
    secureStore: {
        set: (key, value, hours) => SecureStorageHelper.setItem(key, value, hours),
        get: (key) => SecureStorageHelper.getItem(key)
    }
};

// Freeze to prevent modification
if (Object.freeze) {
    Object.freeze(window.SecurityUtils);
}

// ============================================
// 13. HEARTBEAT (Production only)
// ============================================

if (SEC_IS_PRODUCTION) {
    setInterval(() => {
        if (window.navigator && window.navigator.sendBeacon) {
            window.navigator.sendBeacon('/api/security/heartbeat', JSON.stringify({
                timestamp: new Date().toISOString(),
                url: window.location.href
            }));
        }
    }, 5 * 60 * 1000); // Every 5 minutes
}

// ============================================
// 14. PREVENT CONSOLE CLEAR
// ============================================

if (SEC_IS_PRODUCTION && console.clear) {
    const originalClear = console.clear;
    console.clear = function() {
        if (window.__ORIGINAL_CONSOLE) {
            window.__ORIGINAL_CONSOLE.warn('Console clear prevented');
        }
        return;
    };
}

// ============================================
// 15. CLEANUP ON PAGE UNLOAD
// ============================================

window.addEventListener('beforeunload', function() {
    if (devToolsInterval) {
        clearInterval(devToolsInterval);
    }
    if (sessionTimeoutId) {
        clearTimeout(sessionTimeoutId);
    }
});

// Only log if not in production
if (!SEC_IS_PRODUCTION) {
    console.log('✅ Security module loaded successfully');
}
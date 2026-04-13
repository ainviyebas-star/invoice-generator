// frontend/js/security.js - Complete Security Module
// This file provides multiple layers of security protection for the invoice system

// ============================================
// 1. ENVIRONMENT DETECTION
// ============================================

const isProduction = window.location.hostname !== 'localhost' && 
                     !window.location.hostname.includes('127.0.0.1') &&
                     !window.location.hostname.includes('192.168') &&
                     !window.location.hostname.includes('::1');

const isDevelopment = !isProduction;

// ============================================
// 2. DISABLE CONSOLE LOGGING IN PRODUCTION
// ============================================

if (isProduction) {
    // Store original console methods (for emergency debugging)
    window.__originalConsole = {
        log: console.log,
        info: console.info,
        debug: console.debug,
        warn: console.warn,
        error: console.error
    };
    
    // Override console methods to prevent logging
    console.log = function() {};
    console.info = function() {};
    console.debug = function() {};
    
    // Keep warnings and errors for debugging purposes
    // console.warn and console.error remain active
}

// ============================================
// 3. PREVENT DEV TOOLS ACCESS
// ============================================

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

// ============================================
// 4. DETECT DEV TOOLS OPENING
// ============================================

let devToolsOpen = false;
let devToolsCheckInterval = null;

// Method 1: Using console.log detection
const element = new Image();
Object.defineProperty(element, 'id', {
    get: function() {
        devToolsOpen = true;
        if (isDevelopment && window.__originalConsole) {
            window.__originalConsole.warn('Dev tools detected!');
        }
        return '';
    }
});

// Method 2: Using window size differential
function detectDevTools() {
    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;
    
    if (widthThreshold || heightThreshold) {
        devToolsOpen = true;
        if (isDevelopment && window.__originalConsole) {
            window.__originalConsole.warn('Dev tools may be open (window size differential)');
        }
    }
}

// Start dev tools detection
function startDevToolsDetection() {
    // Check every 2 seconds
    devToolsCheckInterval = setInterval(() => {
        devToolsOpen = false;
        console.dir(element);
        detectDevTools();
        
        if (devToolsOpen && isProduction) {
            // Optional: Log to server or take action
            // You could send a report to your backend
            if (window.navigator && window.navigator.sendBeacon) {
                window.navigator.sendBeacon('/api/security/devtools-detected', JSON.stringify({
                    timestamp: new Date().toISOString(),
                    url: window.location.href,
                    userAgent: navigator.userAgent
                }));
            }
        }
    }, 2000);
}

// Only start detection in production
if (isProduction) {
    startDevToolsDetection();
}

// ============================================
// 5. PREVENT SELECTION AND COPYING (Optional)
// ============================================

// Disable text selection on sensitive elements
function disableTextSelection() {
    // Add CSS to prevent selection
    const style = document.createElement('style');
    style.textContent = `
        .no-select, .invoice-number, .amount, .sensitive-data {
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// 6. SECURE STORAGE HELPERS
// ============================================

// Secure wrapper for localStorage with expiration
const SecureStorage = {
    setItem: function(key, value, expirationHours = 24) {
        const item = {
            value: value,
            expiry: new Date().getTime() + (expirationHours * 60 * 60 * 1000)
        };
        localStorage.setItem(key, JSON.stringify(item));
    },
    
    getItem: function(key) {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;
        
        const item = JSON.parse(itemStr);
        const now = new Date().getTime();
        
        if (now > item.expiry) {
            localStorage.removeItem(key);
            return null;
        }
        return item.value;
    },
    
    clearExpired: function() {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const itemStr = localStorage.getItem(key);
            if (itemStr && itemStr.includes('expiry')) {
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
    },
    
    clearAll: function() {
        localStorage.clear();
        sessionStorage.clear();
    }
};

// ============================================
// 7. XSS PROTECTION - Sanitize User Input
// ============================================

function sanitizeInput(input) {
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

// Override innerHTML setter for sensitive elements
const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
Object.defineProperty(Element.prototype, 'innerHTML', {
    get: function() {
        return originalInnerHTML.get.call(this);
    },
    set: function(value) {
        // Sanitize before setting
        if (typeof value === 'string' && this.classList && 
            (this.classList.contains('sanitize') || this.classList.contains('user-content'))) {
            value = sanitizeInput(value);
        }
        return originalInnerHTML.set.call(this, value);
    }
});

// ============================================
// 8. CSRF PROTECTION TOKEN
// ============================================

let csrfToken = null;

function generateCSRFToken() {
    const token = crypto.randomUUID ? crypto.randomUUID() : 
                  Math.random().toString(36).substring(2) + Date.now().toString(36);
    SecureStorage.setItem('csrf_token', token, 24);
    return token;
}

function getCSRFToken() {
    if (!csrfToken) {
        csrfToken = SecureStorage.getItem('csrf_token');
        if (!csrfToken) {
            csrfToken = generateCSRFToken();
        }
    }
    return csrfToken;
}

// Add CSRF token to all fetch requests
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
    // Don't add token to external requests
    if (url.toString().includes(window.location.origin) || url.toString().startsWith('/')) {
        options.headers = options.headers || {};
        options.headers['X-CSRF-Token'] = getCSRFToken();
    }
    return originalFetch.call(this, url, options);
};

// ============================================
// 9. RATE LIMITING FOR API CALLS
// ============================================

const rateLimiter = {
    calls: new Map(),
    
    isAllowed: function(endpoint, limit = 10, windowMs = 60000) {
        const key = `${endpoint}_${Date.now()}`;
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
// 10. SESSION TIMEOUT
// ============================================

let sessionTimeout = null;
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

function resetSessionTimeout() {
    if (sessionTimeout) {
        clearTimeout(sessionTimeout);
    }
    
    sessionTimeout = setTimeout(() => {
        // Clear sensitive data on session timeout
        SecureStorage.clearAll();
        
        // Redirect to login if exists, otherwise reload
        if (window.location.pathname !== '/index.html' && 
            window.location.pathname !== '/' &&
            !window.location.pathname.includes('login')) {
            window.location.href = '/index.html';
        }
        
        if (window.__originalConsole) {
            window.__originalConsole.info('Session timed out due to inactivity');
        }
    }, SESSION_DURATION);
}

// Reset session timeout on user activity
const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
activityEvents.forEach(event => {
    document.addEventListener(event, resetSessionTimeout);
});

// Initialize session timeout
resetSessionTimeout();

// ============================================
// 11. SECURE COOKIE SETTINGS
// ============================================

function setSecureCookie(name, value, days = 7) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; Secure; SameSite=Strict; ${isProduction ? 'HttpOnly;' : ''}`;
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// ============================================
// 12. INITIALIZE SECURITY MODULE
// ============================================

function initSecurity() {
    // Clear expired storage items
    SecureStorage.clearExpired();
    
    // Disable text selection on sensitive areas
    disableTextSelection();
    
    // Log security initialization (only in development)
    if (isDevelopment && window.__originalConsole) {
        window.__originalConsole.log('🔒 Security module initialized');
        window.__originalConsole.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);
    }
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSecurity);
} else {
    initSecurity();
}

// ============================================
// 13. EXPOSE SECURITY UTILITIES (Limited exposure)
// ============================================

// Only expose necessary utilities globally
window.Security = {
    sanitize: sanitizeInput,
    isProduction: isProduction,
    getCSRFToken: getCSRFToken,
    clearStorage: () => SecureStorage.clearAll(),
    rateLimit: (endpoint, limit, windowMs) => rateLimiter.isAllowed(endpoint, limit, windowMs)
};

// Prevent modification of security objects
if (Object.freeze) {
    Object.freeze(window.Security);
}

// ============================================
// 14. HEARTBEAT FOR ACTIVE SESSION (Optional)
// ============================================

if (isProduction) {
    setInterval(() => {
        // Send heartbeat to server to keep session alive
        if (window.navigator && window.navigator.sendBeacon) {
            window.navigator.sendBeacon('/api/security/heartbeat', JSON.stringify({
                timestamp: new Date().toISOString(),
                url: window.location.href
            }));
        }
    }, 5 * 60 * 1000); // Every 5 minutes
}

// ============================================
// 15. CONSOLE CLEAR PROTECTION
// ============================================

// Prevent clearing of console (optional)
if (isProduction) {
    const consoleClear = console.clear;
    console.clear = function() {
        if (window.__originalConsole) {
            window.__originalConsole.warn('Console clear prevented for security reasons');
        }
        return;
    };
}

console.log('✅ Security module loaded successfully');
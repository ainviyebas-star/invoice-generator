// frontend/js/logger.js - Production-safe logging
const isProduction = window.location.hostname !== 'localhost' && 
                     !window.location.hostname.includes('127.0.0.1');

// Log levels
const LogLevel = {
    NONE: 0,
    ERROR: 1,
    WARN: 2,
    INFO: 3,
    DEBUG: 4
};

// Set log level based on environment
const currentLogLevel = isProduction ? LogLevel.ERROR : LogLevel.DEBUG;

const logger = {
    debug: function(...args) {
        if (currentLogLevel >= LogLevel.DEBUG) {
            console.debug('[DEBUG]', ...args);
        }
    },
    info: function(...args) {
        if (currentLogLevel >= LogLevel.INFO) {
            console.info('[INFO]', ...args);
        }
    },
    warn: function(...args) {
        if (currentLogLevel >= LogLevel.WARN) {
            console.warn('[WARN]', ...args);
        }
    },
    error: function(...args) {
        if (currentLogLevel >= LogLevel.ERROR) {
            console.error('[ERROR]', ...args);
        }
    }
};

// Override console methods in production
if (isProduction) {
    // Store original console methods
    const originalConsole = {
        log: console.log,
        info: console.info,
        debug: console.debug,
        warn: console.warn
    };
    
    // Disable logging in production
    console.log = function() {};
    console.info = function() {};
    console.debug = function() {};
    
    // Keep errors and warnings for debugging
    // console.warn and console.error remain active
}

window.logger = logger;
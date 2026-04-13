// frontend/build.js - Minify JS files before deployment
const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

async function minifyJS(filePath) {
    const code = fs.readFileSync(filePath, 'utf8');
    const minified = await minify(code, {
        compress: {
            drop_console: true,      // Remove console.log statements
            drop_debugger: true,     // Remove debugger statements
            passes: 2                // Multiple compression passes
        },
        mangle: {
            toplevel: true,          // Mangle top-level variables
            reserved: ['API_BASE', 'APP_CONFIG'] // Don't mangle these
        },
        output: {
            comments: false          // Remove comments
        }
    });
    
    fs.writeFileSync(filePath, minified.code);
    console.log(`Minified: ${filePath}`);
}

// Minify all JS files
const jsFiles = [
    'js/config.js',
    'js/api.js',
    'js/header.js',
    'js/security.js',
    'js/logger.js'
];

jsFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        minifyJS(fullPath);
    }
});
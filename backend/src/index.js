// backend/src/index.js - Complete CORS fix
import { Router } from 'itty-router';
import { handleCustomers } from './routes/customers.js';
import { handleInvoices } from './routes/invoices.js';
import { handleTemplates } from './routes/templates.js';

const router = Router();

// CORS headers - MUST be included in all responses
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
};

// Helper function to add CORS headers to any response
function addCorsHeaders(response) {
    const newResponse = new Response(response.body, response);
    Object.entries(corsHeaders).forEach(([key, value]) => {
        newResponse.headers.set(key, value);
    });
    return newResponse;
}

// Helper for JSON responses with CORS
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: corsHeaders
    });
}

// Handle OPTIONS preflight requests - CRITICAL for CORS
router.options('*', () => {
    return new Response(null, {
        status: 204,
        headers: corsHeaders
    });
});

// Health check
router.get('/api/health', () => {
    return new Response('OK', {
        status: 200,
        headers: {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*'
        }
    });
});

// Customer routes
router.all('/api/customers/*', async (request, env) => {
    const response = await handleCustomers(request, env);
    return addCorsHeaders(response);
});

// Invoice routes
router.all('/api/invoices/*', async (request, env) => {
    const response = await handleInvoices(request, env);
    return addCorsHeaders(response);
});

// Template routes
router.all('/api/templates/*', async (request, env) => {
    const response = await handleTemplates(request, env);
    return addCorsHeaders(response);
});

// 404 handler
router.all('*', () => {
    return jsonResponse({ error: 'Not Found' }, 404);
});

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const method = request.method;
        
        console.log(`${method} ${url.pathname}`);
        
        try {
            // Handle preflight OPTIONS request
            if (method === 'OPTIONS') {
                return new Response(null, {
                    status: 204,
                    headers: corsHeaders
                });
            }
            
            const response = await router.handle(request, env, ctx);
            return addCorsHeaders(response);
        } catch (error) {
            console.error('Worker error:', error);
            return jsonResponse({ 
                error: 'Internal Server Error', 
                message: error.message 
            }, 500);
        }
    }
};
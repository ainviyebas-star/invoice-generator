// backend/src/index.js - Complete with all routes
import { Router } from 'itty-router';
import { handleInvoices } from './routes/invoices.js';
import { handleCustomers } from './routes/customers.js';
import { handleTemplates } from './routes/templates.js';
import { handleCompanies } from './routes/companies.js';

const router = Router();

// CORS headers for all responses
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

// ============================================
// HEALTH CHECK
// ============================================
router.get('/api/health', () => {
    return new Response('OK', { 
        status: 200, 
        headers: { 
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*'
        } 
    });
});

// ============================================
// COMPANY ROUTES
// ============================================
router.get('/api/companies', async (request, env) => {
    const response = await handleCompanies(request, env);
    return addCorsHeaders(response);
});

router.get('/api/companies/:id', async (request, env) => {
    const response = await handleCompanies(request, env);
    return addCorsHeaders(response);
});

router.post('/api/companies', async (request, env) => {
    const response = await handleCompanies(request, env);
    return addCorsHeaders(response);
});

router.put('/api/companies/:id', async (request, env) => {
    const response = await handleCompanies(request, env);
    return addCorsHeaders(response);
});

router.delete('/api/companies/:id', async (request, env) => {
    const response = await handleCompanies(request, env);
    return addCorsHeaders(response);
});

// ============================================
// CUSTOMER ROUTES
// ============================================
router.get('/api/customers', async (request, env) => {
    const response = await handleCustomers(request, env);
    return addCorsHeaders(response);
});

router.get('/api/customers/:id', async (request, env) => {
    const response = await handleCustomers(request, env);
    return addCorsHeaders(response);
});

router.post('/api/customers', async (request, env) => {
    const response = await handleCustomers(request, env);
    return addCorsHeaders(response);
});

router.put('/api/customers/:id', async (request, env) => {
    const response = await handleCustomers(request, env);
    return addCorsHeaders(response);
});

router.delete('/api/customers/:id', async (request, env) => {
    const response = await handleCustomers(request, env);
    return addCorsHeaders(response);
});

// ============================================
// INVOICE ROUTES
// ============================================
router.get('/api/invoices', async (request, env) => {
    const response = await handleInvoices(request, env);
    return addCorsHeaders(response);
});

router.get('/api/invoices/:id', async (request, env) => {
    const response = await handleInvoices(request, env);
    return addCorsHeaders(response);
});

router.post('/api/invoices', async (request, env) => {
    const response = await handleInvoices(request, env);
    return addCorsHeaders(response);
});

router.put('/api/invoices/:id', async (request, env) => {
    const response = await handleInvoices(request, env);
    return addCorsHeaders(response);
});

router.delete('/api/invoices/:id', async (request, env) => {
    const response = await handleInvoices(request, env);
    return addCorsHeaders(response);
});

// ============================================
// TEMPLATE ROUTES
// ============================================
router.get('/api/templates', async (request, env) => {
    const response = await handleTemplates(request, env);
    return addCorsHeaders(response);
});

router.get('/api/templates/:id', async (request, env) => {
    const response = await handleTemplates(request, env);
    return addCorsHeaders(response);
});

router.get('/api/templates/:id/fields', async (request, env) => {
    const response = await handleTemplates(request, env);
    return addCorsHeaders(response);
});

router.post('/api/templates', async (request, env) => {
    const response = await handleTemplates(request, env);
    return addCorsHeaders(response);
});

router.put('/api/templates/:id', async (request, env) => {
    const response = await handleTemplates(request, env);
    return addCorsHeaders(response);
});

router.put('/api/templates/:id/default', async (request, env) => {
    const response = await handleTemplates(request, env);
    return addCorsHeaders(response);
});

router.delete('/api/templates/:id', async (request, env) => {
    const response = await handleTemplates(request, env);
    return addCorsHeaders(response);
});

// ============================================
// OPTIONS HANDLER FOR CORS PREFLIGHT
// ============================================
router.options('*', () => {
    return new Response(null, {
        status: 204,
        headers: corsHeaders
    });
});

// ============================================
// 404 HANDLER
// ============================================
router.all('*', () => {
    return jsonResponse({ error: 'Not Found', message: 'The requested endpoint does not exist' }, 404);
});

// ============================================
// MAIN WORKER HANDLER
// ============================================
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const method = request.method;
        
        console.log(`📡 ${method} ${url.pathname}`);
        
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
            console.error('❌ Worker error:', error);
            return jsonResponse({ 
                error: 'Internal Server Error', 
                message: error.message,
                stack: error.stack
            }, 500);
        }
    }
};
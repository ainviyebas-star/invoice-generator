import { Router } from 'itty-router';
import { handleInvoices } from './routes/invoices.js';
import { handleCustomers } from './routes/customers.js';
import { handleTemplates } from './routes/templates.js';

const router = Router();

// CORS middleware
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Health check
router.get('/api/health', () => new Response('OK', { status: 200 }));

// Invoice routes
router.all('/api/invoices/*', handleInvoices);
router.all('/api/customers/*', handleCustomers);
router.all('/api/templates/*', handleTemplates);

// Handle OPTIONS for CORS
router.options('*', () => new Response(null, { headers: corsHeaders }));

// 404 handler
router.all('*', () => new Response('Not Found', { status: 404 }));

export default {
  async fetch(request, env, ctx) {
    const response = await router.handle(request, env, ctx);
    
    // Add CORS headers to response
    const newResponse = new Response(response.body, response);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });
    
    return newResponse;
  }
};
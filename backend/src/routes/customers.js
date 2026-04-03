// backend/src/routes/customers.js
import { v4 as uuidv4 } from 'uuid';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: corsHeaders
    });
}

export async function handleCustomers(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname.replace('/api/customers', '');
    
    console.log(`Customers API - Method: ${method}, Path: ${path}`);

    try {
        // GET /api/customers - List all customers
        if (method === 'GET' && (path === '' || path === '/')) {
            const result = await env.DB.prepare(`
                SELECT * FROM customers ORDER BY created_at DESC
            `).all();
            
            return jsonResponse(result.results);
        }

        // GET /api/customers/:id - Get single customer
        if (method === 'GET' && path.match(/\/\d+$/)) {
            const id = parseInt(path.split('/')[1]);
            const customer = await env.DB.prepare(`
                SELECT * FROM customers WHERE id = ?
            `).bind(id).first();
            
            if (!customer) {
                return jsonResponse({ error: 'Customer not found' }, 404);
            }
            
            return jsonResponse(customer);
        }

        // POST /api/customers - Create new customer
        if (method === 'POST' && (path === '' || path === '/')) {
            const body = await request.json();
            console.log('Creating customer:', body);
            
            if (!body.name) {
                return jsonResponse({ error: 'Customer name is required' }, 400);
            }
            
            const uuid = uuidv4();
            const companyId = body.company_id || 1;
            
            const result = await env.DB.prepare(`
                INSERT INTO customers (uuid, company_id, name, email, phone, address, tax_id, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                uuid, 
                companyId, 
                body.name, 
                body.email || '', 
                body.phone || '', 
                body.address || '', 
                body.tax_id || '', 
                body.notes || ''
            ).run();
            
            const newCustomer = await env.DB.prepare(`
                SELECT * FROM customers WHERE id = ?
            `).bind(result.meta.last_row_id).first();
            
            return jsonResponse({ 
                success: true, 
                id: result.meta.last_row_id,
                customer: newCustomer 
            }, 201);
        }

        // PUT /api/customers/:id - Update customer
        if (method === 'PUT' && path.match(/\/\d+$/)) {
            const id = parseInt(path.split('/')[1]);
            const body = await request.json();
            
            await env.DB.prepare(`
                UPDATE customers 
                SET name = ?, email = ?, phone = ?, address = ?, tax_id = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(body.name, body.email || '', body.phone || '', body.address || '', body.tax_id || '', body.notes || '', id).run();
            
            const updatedCustomer = await env.DB.prepare(`
                SELECT * FROM customers WHERE id = ?
            `).bind(id).first();
            
            return jsonResponse({ success: true, customer: updatedCustomer });
        }

        // DELETE /api/customers/:id - Delete customer
        if (method === 'DELETE' && path.match(/\/\d+$/)) {
            const id = parseInt(path.split('/')[1]);
            await env.DB.prepare(`DELETE FROM customers WHERE id = ?`).bind(id).run();
            return jsonResponse({ success: true });
        }

        return jsonResponse({ error: 'Route not found' }, 404);
        
    } catch (error) {
        console.error('Customer route error:', error);
        return jsonResponse({ error: 'Internal server error', details: error.message }, 500);
    }
}
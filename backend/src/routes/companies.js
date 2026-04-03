// backend/src/routes/companies.js
function generateUUID() {
    return crypto.randomUUID();
}

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

export async function handleCompanies(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname.replace('/api/companies', '');
    
    console.log(`🏢 Companies API - Method: ${method}, Path: ${path}`);

    try {
        // GET /api/companies - List all companies
        if (method === 'GET' && (path === '' || path === '/')) {
            const result = await env.DB.prepare(`
                SELECT * FROM companies ORDER BY created_at DESC
            `).all();
            
            return jsonResponse(result.results);
        }

        // GET /api/companies/:id - Get single company
        if (method === 'GET' && path.match(/\/\d+$/)) {
            const id = parseInt(path.split('/')[1]);
            const company = await env.DB.prepare(`
                SELECT * FROM companies WHERE id = ?
            `).bind(id).first();
            
            if (!company) {
                return jsonResponse({ error: 'Company not found' }, 404);
            }
            
            return jsonResponse(company);
        }

        // POST /api/companies - Create new company
        if (method === 'POST' && (path === '' || path === '/')) {
            const body = await request.json();
            console.log('Creating company:', body);
            
            const uuid = generateUUID();
            
            const result = await env.DB.prepare(`
                INSERT INTO companies (uuid, name, email, phone, address, tax_id, website, logo_url, bank_name, bank_account, bank_routing, currency)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                uuid,
                body.name || 'Your Business Name',
                body.email || '',
                body.phone || '',
                body.address || '',
                body.tax_id || '',
                body.website || '',
                body.logo_url || '',
                body.bank_name || '',
                body.bank_account || '',
                body.bank_routing || '',
                body.currency || 'USD'
            ).run();
            
            const newCompany = await env.DB.prepare(`
                SELECT * FROM companies WHERE id = ?
            `).bind(result.meta.last_row_id).first();
            
            return jsonResponse({ 
                success: true, 
                id: result.meta.last_row_id,
                company: newCompany 
            }, 201);
        }

        // PUT /api/companies/:id - Update company
        if (method === 'PUT' && path.match(/\/\d+$/)) {
            const id = parseInt(path.split('/')[1]);
            const body = await request.json();
            
            console.log(`Updating company ${id}:`, body);
            
            await env.DB.prepare(`
                UPDATE companies 
                SET name = ?, 
                    email = ?, 
                    phone = ?, 
                    address = ?, 
                    tax_id = ?, 
                    website = ?,
                    logo_url = ?,
                    bank_name = ?,
                    bank_account = ?,
                    bank_routing = ?,
                    currency = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(
                body.name,
                body.email || '',
                body.phone || '',
                body.address || '',
                body.tax_id || '',
                body.website || '',
                body.logo_url || '',
                body.bank_name || '',
                body.bank_account || '',
                body.bank_routing || '',
                body.currency || 'USD',
                id
            ).run();
            
            const updatedCompany = await env.DB.prepare(`
                SELECT * FROM companies WHERE id = ?
            `).bind(id).first();
            
            return jsonResponse({ success: true, company: updatedCompany });
        }

        // DELETE /api/companies/:id - Delete company
        if (method === 'DELETE' && path.match(/\/\d+$/)) {
            const id = parseInt(path.split('/')[1]);
            await env.DB.prepare(`DELETE FROM companies WHERE id = ?`).bind(id).run();
            return jsonResponse({ success: true });
        }

        return jsonResponse({ error: 'Route not found' }, 404);
        
    } catch (error) {
        console.error('Company route error:', error);
        return jsonResponse({ error: 'Internal server error', details: error.message }, 500);
    }
}
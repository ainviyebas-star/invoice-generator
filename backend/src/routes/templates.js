// backend/src/routes/templates.js
import { v4 as uuidv4 } from 'uuid';

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

export async function handleTemplates(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname.replace('/api/templates', '');
    
    try {
        // GET /api/templates - List all templates
        if (method === 'GET' && (path === '' || path === '/')) {
            const templates = await env.DB.prepare(`
                SELECT t.*, 
                       COUNT(tf.id) as fields_count,
                       (SELECT COUNT(*) FROM invoices WHERE template_id = t.id) as usage_count
                FROM templates t
                LEFT JOIN template_fields tf ON t.id = tf.template_id
                GROUP BY t.id
                ORDER BY t.is_default DESC, t.created_at DESC
            `).all();
            
            // Fetch fields for each template
            for (let template of templates.results) {
                const fields = await env.DB.prepare(`
                    SELECT * FROM template_fields 
                    WHERE template_id = ? 
                    ORDER BY sort_order
                `).bind(template.id).all();
                template.fields = fields.results;
            }
            
            return jsonResponse(templates.results);
        }
        
        // GET /api/templates/:id - Get single template with fields
        if (method === 'GET' && path.match(/\/\d+$/)) {
            const id = parseInt(path.split('/')[1]);
            const template = await env.DB.prepare(`
                SELECT * FROM templates WHERE id = ?
            `).bind(id).first();
            
            if (!template) {
                return jsonResponse({ error: 'Template not found' }, 404);
            }
            
            const fields = await env.DB.prepare(`
                SELECT * FROM template_fields 
                WHERE template_id = ? 
                ORDER BY sort_order
            `).bind(id).all();
            
            template.fields = fields.results;
            
            return jsonResponse(template);
        }
        
        // POST /api/templates - Create new template
        if (method === 'POST' && (path === '' || path === '/')) {
            const body = await request.json();
            const uuid = uuidv4();
            
            // Insert template
            const result = await env.DB.prepare(`
                INSERT INTO templates (uuid, company_id, name, description, is_default)
                VALUES (?, ?, ?, ?, ?)
            `).bind(uuid, body.company_id || 1, body.name, body.description || '', 0).run();
            
            const templateId = result.meta.last_row_id;
            
            // Insert fields
            if (body.fields && body.fields.length > 0) {
                for (let i = 0; i < body.fields.length; i++) {
                    const field = body.fields[i];
                    await env.DB.prepare(`
                        INSERT INTO template_fields (template_id, field_key, field_label, field_type, is_required, sort_order)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `).bind(templateId, field.key, field.label, field.type || 'text', field.required ? 1 : 0, i).run();
                }
            }
            
            return jsonResponse({ success: true, id: templateId, uuid: uuid }, 201);
        }
        
        // PUT /api/templates/:id - Update template
        if (method === 'PUT' && path.match(/\/\d+$/)) {
            const id = parseInt(path.split('/')[1]);
            const body = await request.json();
            
            await env.DB.prepare(`
                UPDATE templates 
                SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(body.name, body.description || '', id).run();
            
            // Delete existing fields and re-insert
            await env.DB.prepare(`DELETE FROM template_fields WHERE template_id = ?`).bind(id).run();
            
            if (body.fields && body.fields.length > 0) {
                for (let i = 0; i < body.fields.length; i++) {
                    const field = body.fields[i];
                    await env.DB.prepare(`
                        INSERT INTO template_fields (template_id, field_key, field_label, field_type, is_required, sort_order)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `).bind(id, field.key, field.label, field.type || 'text', field.required ? 1 : 0, i).run();
                }
            }
            
            return jsonResponse({ success: true });
        }
        
        // PUT /api/templates/:id/default - Set as default
        if (method === 'PUT' && path.match(/\/\d+\/default$/)) {
            const id = parseInt(path.split('/')[1]);
            
            // Remove default from all templates
            await env.DB.prepare(`UPDATE templates SET is_default = 0 WHERE company_id = 1`).run();
            // Set this template as default
            await env.DB.prepare(`UPDATE templates SET is_default = 1 WHERE id = ?`).bind(id).run();
            
            return jsonResponse({ success: true });
        }
        
        // DELETE /api/templates/:id - Delete template
        if (method === 'DELETE' && path.match(/\/\d+$/)) {
            const id = parseInt(path.split('/')[1]);
            await env.DB.prepare(`DELETE FROM templates WHERE id = ?`).bind(id).run();
            return jsonResponse({ success: true });
        }
        
        return jsonResponse({ error: 'Route not found' }, 404);
        
    } catch (error) {
        console.error('Template route error:', error);
        return jsonResponse({ error: 'Internal server error', details: error.message }, 500);
    }
}
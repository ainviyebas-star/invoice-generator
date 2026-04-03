export async function handleTemplates(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/templates', '');
  const method = request.method;

  // GET /api/templates
  if (method === 'GET' && path === '') {
    const templates = await env.DB.prepare(`
      SELECT t.*, COUNT(tf.id) as fields_count
      FROM templates t
      LEFT JOIN template_fields tf ON t.id = tf.template_id
      GROUP BY t.id
      ORDER BY t.is_default DESC, t.created_at DESC
    `).all();
    
    return Response.json(templates.results);
  }

  // GET /api/templates/:id/fields
  if (method === 'GET' && path.match(/\/\d+\/fields$/)) {
    const templateId = path.split('/')[1];
    const fields = await env.DB.prepare(`
      SELECT * FROM template_fields 
      WHERE template_id = ? 
      ORDER BY sort_order
    `).bind(templateId).all();
    
    return Response.json(fields.results);
  }

  // GET /api/templates/:id
  if (method === 'GET' && path.match(/\/\d+$/)) {
    const id = path.split('/')[1];
    const template = await env.DB.prepare(`SELECT * FROM templates WHERE id = ?`).bind(id).first();
    
    if (!template) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }
    
    const fields = await env.DB.prepare(`
      SELECT * FROM template_fields WHERE template_id = ? ORDER BY sort_order
    `).bind(id).all();
    
    template.fields = fields.results;
    
    return Response.json(template);
  }

  return Response.json({ error: 'Route not found' }, { status: 404 });
}
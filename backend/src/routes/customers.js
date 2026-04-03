import { v4 as uuidv4 } from 'uuid';

export async function handleCustomers(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/customers', '');
  const method = request.method;

  // GET /api/customers
  if (method === 'GET' && path === '') {
    const result = await env.DB.prepare(`
      SELECT * FROM customers ORDER BY created_at DESC
    `).all();
    return Response.json(result.results);
  }

  // GET /api/customers/:id
  if (method === 'GET' && path.match(/\/\d+$/)) {
    const id = path.split('/')[1];
    const customer = await env.DB.prepare(`SELECT * FROM customers WHERE id = ?`).bind(id).first();
    
    if (!customer) {
      return Response.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    return Response.json(customer);
  }

  // POST /api/customers
  if (method === 'POST' && path === '') {
    const body = await request.json();
    const uuid = uuidv4();
    
    const result = await env.DB.prepare(`
      INSERT INTO customers (uuid, company_id, name, email, phone, address, tax_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(uuid, body.company_id, body.name, body.email, body.phone, body.address, body.tax_id, body.notes).run();
    
    return Response.json({ success: true, id: result.meta.last_row_id, uuid: uuid });
  }

  // PUT /api/customers/:id
  if (method === 'PUT' && path.match(/\/\d+$/)) {
    const id = path.split('/')[1];
    const body = await request.json();
    
    await env.DB.prepare(`
      UPDATE customers 
      SET name = ?, email = ?, phone = ?, address = ?, tax_id = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(body.name, body.email, body.phone, body.address, body.tax_id, body.notes, id).run();
    
    return Response.json({ success: true });
  }

  // DELETE /api/customers/:id
  if (method === 'DELETE' && path.match(/\/\d+$/)) {
    const id = path.split('/')[1];
    await env.DB.prepare(`DELETE FROM customers WHERE id = ?`).bind(id).run();
    return Response.json({ success: true });
  }

  return Response.json({ error: 'Route not found' }, { status: 404 });
}
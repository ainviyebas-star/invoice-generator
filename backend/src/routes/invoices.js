import { v4 as uuidv4 } from 'uuid';

export async function handleInvoices(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/invoices', '');
  const method = request.method;

  // GET /api/invoices - List all invoices
  if (method === 'GET' && path === '') {
    const result = await env.DB.prepare(`
      SELECT i.*, c.name as customer_name, t.name as template_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN templates t ON i.template_id = t.id
      ORDER BY i.created_at DESC
    `).all();
    
    return Response.json(result.results);
  }

  // GET /api/invoices/:id - Get single invoice with items
  if (method === 'GET' && path.match(/\/\d+$/)) {
    const id = path.split('/')[1];
    
    const invoice = await env.DB.prepare(`
      SELECT i.*, c.name as customer_name, c.email as customer_email, c.address as customer_address,
             t.name as template_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN templates t ON i.template_id = t.id
      WHERE i.id = ?
    `).bind(id).first();
    
    if (!invoice) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    const items = await env.DB.prepare(`
      SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order
    `).bind(id).all();
    
    invoice.items = items.results;
    
    return Response.json(invoice);
  }

  // POST /api/invoices - Create new invoice
  if (method === 'POST' && path === '') {
    const body = await request.json();
    const uuid = uuidv4();
    const invoiceNumber = body.invoice_number || `INV-${Date.now()}`;
    
    const result = await env.DB.prepare(`
      INSERT INTO invoices (uuid, company_id, customer_id, template_id, invoice_number, 
                           issue_date, due_date, status, subtotal, tax_rate, tax_amount, total, notes, terms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      uuid, body.company_id, body.customer_id, body.template_id, invoiceNumber,
      body.issue_date, body.due_date, body.status || 'draft',
      body.subtotal || 0, body.tax_rate || 0, body.tax_amount || 0, body.total || 0,
      body.notes || '', body.terms || ''
    ).run();
    
    const invoiceId = result.meta.last_row_id;
    
    // Insert items
    if (body.items && body.items.length > 0) {
      for (let i = 0; i < body.items.length; i++) {
        const item = body.items[i];
        await env.DB.prepare(`
          INSERT INTO invoice_items (uuid, invoice_id, description, quantity, unit_price, total, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(uuidv4(), invoiceId, item.description, item.quantity, item.unit_price, item.total, i).run();
      }
    }
    
    return Response.json({ success: true, id: invoiceId, uuid: uuid });
  }

  // PUT /api/invoices/:id - Update invoice
  if (method === 'PUT' && path.match(/\/\d+$/)) {
    const id = path.split('/')[1];
    const body = await request.json();
    
    await env.DB.prepare(`
      UPDATE invoices 
      SET customer_id = ?, issue_date = ?, due_date = ?, status = ?, 
          subtotal = ?, tax_rate = ?, tax_amount = ?, total = ?, notes = ?, terms = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.customer_id, body.issue_date, body.due_date, body.status,
      body.subtotal, body.tax_rate, body.tax_amount, body.total,
      body.notes, body.terms, id
    ).run();
    
    // Update items (delete old, insert new)
    await env.DB.prepare(`DELETE FROM invoice_items WHERE invoice_id = ?`).bind(id).run();
    
    if (body.items && body.items.length > 0) {
      for (let i = 0; i < body.items.length; i++) {
        const item = body.items[i];
        await env.DB.prepare(`
          INSERT INTO invoice_items (uuid, invoice_id, description, quantity, unit_price, total, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(uuidv4(), id, item.description, item.quantity, item.unit_price, item.total, i).run();
      }
    }
    
    return Response.json({ success: true });
  }

  // DELETE /api/invoices/:id - Delete invoice
  if (method === 'DELETE' && path.match(/\/\d+$/)) {
    const id = path.split('/')[1];
    await env.DB.prepare(`DELETE FROM invoices WHERE id = ?`).bind(id).run();
    return Response.json({ success: true });
  }

  return Response.json({ error: 'Route not found' }, { status: 404 });
}
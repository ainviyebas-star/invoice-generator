// Dashboard functionality
async function loadDashboard() {
    try {
        const invoices = await InvoiceAPI.getAll();
        
        // Update stats
        document.getElementById('totalInvoices').textContent = invoices.length;
        
        const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
        
        const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
        document.getElementById('paidInvoices').textContent = paidInvoices;
        
        const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;
        document.getElementById('overdueInvoices').textContent = overdueInvoices;
        
        // Display recent invoices
        const invoiceList = document.getElementById('invoiceList');
        if (invoices.length === 0) {
            invoiceList.innerHTML = '<div class="loading">No invoices yet. Create your first invoice!</div>';
            return;
        }
        
        invoiceList.innerHTML = invoices.slice(0, 10).map(invoice => `
            <div class="invoice-item">
                <div class="invoice-info">
                    <h4>${invoice.invoice_number}</h4>
                    <p>${invoice.customer_name || 'Unknown Customer'} • Due: ${invoice.due_date}</p>
                </div>
                <div>
                    <span class="invoice-status status-${invoice.status}">${invoice.status}</span>
                    <p style="margin-top: 0.5rem; font-weight: 600;">$${(invoice.total || 0).toFixed(2)}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading dashboard:', error);
        document.getElementById('invoiceList').innerHTML = '<div class="loading">Error loading invoices. Please check your API connection.</div>';
    }
}

// Initialize dashboard if on index page
if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    loadDashboard();
}

// Invoice builder functionality
async function loadCustomers() {
    try {
        const customers = await CustomerAPI.getAll();
        const select = document.getElementById('customerSelect');
        if (select) {
            select.innerHTML = '<option value="">Select Customer</option>' + 
                customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }
        return customers;
    } catch (error) {
        console.error('Error loading customers:', error);
        return [];
    }
}

// Export functions for use in other pages
window.InvoiceAPI = InvoiceAPI;
window.CustomerAPI = CustomerAPI;
window.TemplateAPI = TemplateAPI;
window.loadCustomers = loadCustomers;
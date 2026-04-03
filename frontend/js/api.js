const API_BASE = 'https://invoice-backend.atologbook.workers.dev'; // Replace with your Cloudflare Worker URL

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API request failed');
    }
    
    return response.json();
}

// Invoice API
const InvoiceAPI = {
    getAll: () => apiRequest('/invoices'),
    get: (id) => apiRequest(`/invoices/${id}`),
    create: (data) => apiRequest('/invoices', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiRequest(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiRequest(`/invoices/${id}`, { method: 'DELETE' }),
};

// Customer API
const CustomerAPI = {
    getAll: () => apiRequest('/customers'),
    get: (id) => apiRequest(`/customers/${id}`),
    create: (data) => apiRequest('/customers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiRequest(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiRequest(`/customers/${id}`, { method: 'DELETE' }),
};

// Template API
const TemplateAPI = {
    getAll: () => apiRequest('/templates'),
    get: (id) => apiRequest(`/templates/${id}`),
    getFields: (id) => apiRequest(`/templates/${id}/fields`),
};
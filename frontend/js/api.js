// API Configuration
// The API URL will be replaced during deployment
const API_BASE = import.meta.env?.VITE_API_URL || 'https://invoice-backend.atologbook.workers.dev/api';

// For production on Netlify, this will be set via Environment Variable
// For local development, it uses the fallback or you can set .env file

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

// Export APIs (rest of your code)

// Invoice API
const InvoiceAPI = {
    getAll: () => apiRequest('/invoices'),
    get: (id) => apiRequest(`/invoices/${id}`),
    create: (data) => apiRequest('/invoices', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiRequest(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiRequest(`/invoices/${id}`, { method: 'DELETE' }),
};

const CustomerAPI = {
    getAll: () => apiRequest('/customers'),
    get: (id) => apiRequest(`/customers/${id}`),
    create: async (data) => {
        const response = await apiRequest('/customers', { 
            method: 'POST', 
            body: JSON.stringify(data) 
        });
        return response;
    },
    update: (id, data) => apiRequest(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiRequest(`/customers/${id}`, { method: 'DELETE' }),
};


// Template API
const TemplateAPI = {
    getAll: () => apiRequest('/templates'),
    get: (id) => apiRequest(`/templates/${id}`),
    getFields: (id) => apiRequest(`/templates/${id}/fields`),
};

// Make available globally
window.CustomerAPI = CustomerAPI;
window.InvoiceAPI = InvoiceAPI; // Add this if you have it
window.TemplateAPI = TemplateAPI; // Add this if you have it
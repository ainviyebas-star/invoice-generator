// frontend/js/api.js
// Load config first (will be available from window.APP_CONFIG)
const API_BASE = window.APP_CONFIG?.API_BASE || 'https://invoice-backend.atologbook.workers.dev/api';

console.log('🚀 API Module Loaded');
console.log('📍 API Base URL:', API_BASE);

// Rest of your API code...

async function apiRequest(endpoint, options = {}) {
    try {
        const url = `${API_BASE}${endpoint}`;
        console.log(`📡 ${options.method || 'GET'} Request to:`, url);
        
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
        
        console.log(`📥 Response Status:`, response.status);
        
        if (response.status === 404) {
            throw new Error(`API endpoint not found. Tried: ${url}`);
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error Response:', errorText);
            
            let errorMessage;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error || errorJson.message || `HTTP ${response.status}`;
            } catch {
                errorMessage = errorText || `HTTP ${response.status}`;
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('✅ Response Data:', data);
        return data;
    } catch (error) {
        console.error('💥 API Request Failed:', error);
        throw error;
    }
}

// Customer API
const CustomerAPI = {
    getAll: () => {
        console.log('📋 Fetching all customers...');
        return apiRequest('/customers');
    },
    
    get: (id) => {
        console.log(`👤 Fetching customer ${id}...`);
        return apiRequest(`/customers/${id}`);
    },
    
    create: async (data) => {
        console.log('➕ Creating customer:', data);
        const response = await apiRequest('/customers', { 
            method: 'POST', 
            body: JSON.stringify(data) 
        });
        return response;
    },
    
    update: (id, data) => {
        console.log(`✏️ Updating customer ${id}...`);
        return apiRequest(`/customers/${id}`, { 
            method: 'PUT', 
            body: JSON.stringify(data) 
        });
    },
    
    delete: (id) => {
        console.log(`🗑️ Deleting customer ${id}...`);
        return apiRequest(`/customers/${id}`, { 
            method: 'DELETE' 
        });
    },
};

// Invoice API
const InvoiceAPI = {
    getAll: () => {
        console.log('📄 Fetching all invoices...');
        return apiRequest('/invoices');
    },
    
    get: (id) => {
        console.log(`📄 Fetching invoice ${id}...`);
        return apiRequest(`/invoices/${id}`);
    },
    
    create: async (data) => {
        console.log('➕ Creating invoice:', data);
        const response = await apiRequest('/invoices', { 
            method: 'POST', 
            body: JSON.stringify(data) 
        });
        return response;
    },
    
    update: (id, data) => {
        console.log(`✏️ Updating invoice ${id}...`);
        return apiRequest(`/invoices/${id}`, { 
            method: 'PUT', 
            body: JSON.stringify(data) 
        });
    },
    
    delete: (id) => {
        console.log(`🗑️ Deleting invoice ${id}...`);
        return apiRequest(`/invoices/${id}`, { 
            method: 'DELETE' 
        });
    },
};

// Template API
const TemplateAPI = {
    getAll: () => {
        console.log('📋 Fetching all templates...');
        return apiRequest('/templates');
    },
    
    get: (id) => {
        console.log(`📋 Fetching template ${id}...`);
        return apiRequest(`/templates/${id}`);
    },
    
    getFields: (id) => {
        console.log(`📋 Fetching fields for template ${id}...`);
        return apiRequest(`/templates/${id}/fields`);
    },
};

// Make all APIs available globally
window.CustomerAPI = CustomerAPI;
window.InvoiceAPI = InvoiceAPI;
window.TemplateAPI = TemplateAPI;

console.log('✅ All APIs ready');
console.log('🔗 CustomerAPI:', typeof window.CustomerAPI);
console.log('🔗 InvoiceAPI:', typeof window.InvoiceAPI);
console.log('🔗 TemplateAPI:', typeof window.TemplateAPI);
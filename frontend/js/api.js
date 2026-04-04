// frontend/js/api.js - Complete API Client
const API_BASE = window.APP_CONFIG?.API_BASE || 
                 (window.location.hostname === 'localhost' 
                   ? 'http://localhost:8787/api'
                   : 'https://invoice-backend.atologbook.workers.dev/api');

console.log('🔧 API Module Loaded');
console.log('📍 API Base URL:', API_BASE);

console.log('🚀 API Module Loaded');
console.log('📍 API Base URL:', API_BASE);

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
    
    create: (data) => {
        console.log('➕ Creating customer:', data);
        return apiRequest('/customers', { 
            method: 'POST', 
            body: JSON.stringify(data) 
        });
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
    
    create: (data) => {
        console.log('➕ Creating invoice:', data);
        return apiRequest('/invoices', { 
            method: 'POST', 
            body: JSON.stringify(data) 
        });
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
    
    create: (data) => {
        console.log('➕ Creating template:', data);
        return apiRequest('/templates', { 
            method: 'POST', 
            body: JSON.stringify(data) 
        });
    },
    
    update: (id, data) => {
        console.log(`✏️ Updating template ${id}...`, data);
        return apiRequest(`/templates/${id}`, { 
            method: 'PUT', 
            body: JSON.stringify(data) 
        });
    },
    
    delete: (id) => {
        console.log(`🗑️ Deleting template ${id}...`);
        return apiRequest(`/templates/${id}`, { 
            method: 'DELETE' 
        });
    },
    
    setDefault: (id) => {
        console.log(`⭐ Setting template ${id} as default...`);
        return apiRequest(`/templates/${id}/default`, { 
            method: 'PUT' 
        });
    }
};

// ============================================
// COMPANY API - ADD THIS SECTION
// ============================================
const CompanyAPI = {
    getAll: () => {
        console.log('🏢 Fetching company info...');
        return apiRequest('/companies');
    },
    
    get: (id) => {
        console.log(`🏢 Fetching company ${id}...`);
        return apiRequest(`/companies/${id}`);
    },
    
    create: (data) => {
        console.log('🏢 Creating company:', data);
        return apiRequest('/companies', { 
            method: 'POST', 
            body: JSON.stringify(data) 
        });
    },
    
    update: (id, data) => {
        console.log(`✏️ Updating company ${id}...`, data);
        return apiRequest(`/companies/${id}`, { 
            method: 'PUT', 
            body: JSON.stringify(data) 
        });
    },
    
    delete: (id) => {
        console.log(`🗑️ Deleting company ${id}...`);
        return apiRequest(`/companies/${id}`, { 
            method: 'DELETE' 
        });
    },
};

// Helper function to get company name from localStorage (for quick access)
function getCompanyName() {
    const settings = localStorage.getItem('companySettings');
    if (settings) {
        try {
            const company = JSON.parse(settings);
            return company.name || 'Your Business Name';
        } catch(e) {}
    }
    return 'Your Business Name';
}

// Helper function to update company name display everywhere
function updateCompanyNameDisplay() {
    const companyName = getCompanyName();
    const elements = document.querySelectorAll('.company-name-display');
    elements.forEach(el => {
        el.textContent = companyName;
    });
}

// Add this function to api.js
async function getCompanyNameFromAPI() {
    try {
        if (typeof CompanyAPI !== 'undefined') {
            const companies = await CompanyAPI.getAll();
            if (companies && companies.length > 0 && companies[0].name) {
                return companies[0].name;
            }
        }
    } catch (error) {
        console.error('Error fetching company from API:', error);
    }
    
    // Fallback to localStorage
    const settings = localStorage.getItem('companySettings');
    if (settings) {
        try {
            const company = JSON.parse(settings);
            return company.name || 'Your Business Name';
        } catch(e) {}
    }
    return 'Your Business Name';
}



// Make all APIs available globally
window.CustomerAPI = CustomerAPI;
window.InvoiceAPI = InvoiceAPI;
window.TemplateAPI = TemplateAPI;
window.CompanyAPI = CompanyAPI;
window.getCompanyName = getCompanyName;
window.updateCompanyNameDisplay = updateCompanyNameDisplay;
window.getCompanyNameFromAPI = getCompanyNameFromAPI;

console.log('✅ All APIs ready');
console.log('🔗 CustomerAPI:', typeof window.CustomerAPI);
console.log('🔗 InvoiceAPI:', typeof window.InvoiceAPI);
console.log('🔗 TemplateAPI:', typeof window.TemplateAPI);
console.log('🔗 CompanyAPI:', typeof window.CompanyAPI);
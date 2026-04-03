// frontend/js/api.js - COMPLETE WORKING VERSION
// HARDCODE THE CORRECT URL WITH /api
const API_BASE = 'https://invoice-backend.atologbook.workers.dev/api';

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
        
        // For 404, show helpful error
        if (response.status === 404) {
            throw new Error(`API endpoint not found. Make sure the URL includes /api. Tried: ${url}`);
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
        console.log('➕ Creating customer with data:', data);
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

// Make available globally
window.CustomerAPI = CustomerAPI;

console.log('✅ CustomerAPI ready');
console.log('🔗 Full API URL example:', `${API_BASE}/customers`);
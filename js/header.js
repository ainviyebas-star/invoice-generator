// frontend/js/header.js - Shared header functionality for all pages

// Function to update company name in header
async function updateCompanyHeader() {
    const headerElement = document.getElementById('companyNameHeader');
    if (!headerElement) return;
    
    try {
        // First try to get from localStorage (set by settings page)
        const settings = localStorage.getItem('companySettings');
        if (settings) {
            try {
                const company = JSON.parse(settings);
                if (company && company.name) {
                    headerElement.textContent = company.name;
                    localStorage.setItem('companyName', company.name);
                    return;
                }
            } catch(e) {
                console.error('Error parsing company settings:', e);
            }
        }
        
        // Try to get from simple company name storage
        const companyName = localStorage.getItem('companyName');
        if (companyName) {
            headerElement.textContent = companyName;
            return;
        }
        
        // Try to fetch from API if available
        if (typeof CompanyAPI !== 'undefined' && CompanyAPI.getAll) {
            try {
                const companies = await CompanyAPI.getAll();
                if (companies && companies.length > 0 && companies[0].name) {
                    const name = companies[0].name;
                    headerElement.textContent = name;
                    localStorage.setItem('companyName', name);
                    localStorage.setItem('companySettings', JSON.stringify(companies[0]));
                    return;
                }
            } catch(e) {
                console.error('Error fetching company from API:', e);
            }
        }
        
        // If nothing found, show nothing
        headerElement.textContent = '';
        
    } catch(e) {
        console.error('Error updating company header:', e);
    }
}

// Function to update company name in welcome message (dashboard only)
function updateWelcomeMessage() {
    const welcomeElement = document.getElementById('companyNameDisplay');
    if (!welcomeElement) return;
    
    try {
        const settings = localStorage.getItem('companySettings');
        if (settings) {
            const company = JSON.parse(settings);
            if (company && company.name) {
                welcomeElement.textContent = company.name;
                return;
            }
        }
        
        const companyName = localStorage.getItem('companyName');
        if (companyName) {
            welcomeElement.textContent = companyName;
            return;
        }
        
        welcomeElement.textContent = 'Your Business';
    } catch(e) {
        console.error('Error updating welcome message:', e);
    }
}

// Function to set company name (called from settings page)
function setCompanyName(companyName) {
    if (!companyName) return;
    
    // Store in localStorage
    localStorage.setItem('companyName', companyName);
    
    // Also update the full settings object if it exists
    const settings = localStorage.getItem('companySettings');
    if (settings) {
        try {
            const company = JSON.parse(settings);
            company.name = companyName;
            localStorage.setItem('companySettings', JSON.stringify(company));
        } catch(e) {}
    } else {
        // Create new settings object
        localStorage.setItem('companySettings', JSON.stringify({ name: companyName }));
    }
    
    // Update header immediately
    const headerElement = document.getElementById('companyNameHeader');
    if (headerElement) {
        headerElement.textContent = companyName;
    }
    
    // Update welcome message if on dashboard
    const welcomeElement = document.getElementById('companyNameDisplay');
    if (welcomeElement) {
        welcomeElement.textContent = companyName;
    }
    
    console.log('Company name updated to:', companyName);
}

// Function to get current company name
function getCurrentCompanyName() {
    const settings = localStorage.getItem('companySettings');
    if (settings) {
        try {
            const company = JSON.parse(settings);
            if (company && company.name) return company.name;
        } catch(e) {}
    }
    
    return localStorage.getItem('companyName') || '';
}

// Initialize everything when DOM is ready
function initHeader() {
    updateCompanyHeader();
    updateWelcomeMessage();
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeader);
} else {
    initHeader();
}

// Also update when localStorage changes (in case settings page updates in another tab)
window.addEventListener('storage', (e) => {
    if (e.key === 'companySettings' || e.key === 'companyName') {
        updateCompanyHeader();
        updateWelcomeMessage();
    }
});

// Make functions available globally
window.updateCompanyHeader = updateCompanyHeader;
window.updateWelcomeMessage = updateWelcomeMessage;
window.setCompanyName = setCompanyName;
window.getCurrentCompanyName = getCurrentCompanyName;

console.log('✅ Header.js loaded - Company name functions ready');
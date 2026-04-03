// frontend/js/header.js - Shared header functionality
async function updateCompanyHeader() {
    const headerElement = document.getElementById('companyNameHeader');
    if (!headerElement) return;
    
    try {
        // Try API first
        if (typeof CompanyAPI !== 'undefined') {
            const companies = await CompanyAPI.getAll();
            if (companies && companies.length > 0 && companies[0].name) {
                headerElement.textContent = `- ${companies[0].name}`;
                localStorage.setItem('companyName', companies[0].name);
                return;
            }
        }
        
        // Fallback to localStorage
        const savedName = localStorage.getItem('companyName');
        if (savedName) {
            headerElement.textContent = `- ${savedName}`;
        } else {
            const settings = localStorage.getItem('companySettings');
            if (settings) {
                const company = JSON.parse(settings);
                headerElement.textContent = `- ${company.name}`;
                localStorage.setItem('companyName', company.name);
            }
        }
    } catch(e) {
        console.error('Error updating company header:', e);
    }
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateCompanyHeader);
} else {
    updateCompanyHeader();
}
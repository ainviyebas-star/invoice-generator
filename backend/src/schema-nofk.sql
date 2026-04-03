-- ==========================================
-- SCHEMA WITHOUT FOREIGN KEY CONSTRAINTS
-- Run this first, then add constraints later
-- ==========================================

-- Disable foreign key checks temporarily
PRAGMA foreign_keys = OFF;

-- ==========================================
-- 1. CREATE TABLES IN CORRECT ORDER
-- ==========================================

-- Companies table (no dependencies)
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    logo_url TEXT,
    tax_id TEXT,
    website TEXT,
    bank_name TEXT,
    bank_account TEXT,
    bank_routing TEXT,
    currency TEXT DEFAULT 'USD',
    timezone TEXT DEFAULT 'UTC',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Customers table (depends on companies)
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    company_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    tax_id TEXT,
    notes TEXT,
    total_invoices INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    last_invoice_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Templates table (depends on companies)
CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    company_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'modern',
    primary_color TEXT DEFAULT '#3b82f6',
    secondary_color TEXT DEFAULT '#1e293b',
    accent_color TEXT DEFAULT '#10b981',
    font_family TEXT DEFAULT 'Inter',
    is_default BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    usage_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Template fields table (depends on templates)
CREATE TABLE IF NOT EXISTS template_fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,
    field_key TEXT NOT NULL,
    field_label TEXT NOT NULL,
    field_type TEXT DEFAULT 'text',
    is_required BOOLEAN DEFAULT 0,
    default_value TEXT,
    placeholder TEXT,
    validation_rules TEXT,
    sort_order INTEGER DEFAULT 0,
    width INTEGER DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table (depends on companies, customers, templates)
CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    company_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    template_id INTEGER NOT NULL,
    invoice_number TEXT NOT NULL,
    po_number TEXT,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'draft',
    subtotal DECIMAL(10,2) DEFAULT 0,
    discount_type TEXT DEFAULT 'fixed',
    discount_value DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    balance_due DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    terms TEXT,
    footer_text TEXT,
    payment_link TEXT,
    payment_status TEXT DEFAULT 'pending',
    sent_at DATETIME,
    viewed_at DATETIME,
    paid_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Invoice items table (depends on invoices)
CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    invoice_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Payment records table (depends on invoices)
CREATE TABLE IF NOT EXISTS payment_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    invoice_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT,
    transaction_id TEXT,
    payment_date DATE NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    company_id INTEGER NOT NULL,
    user_id TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. INSERT DEFAULT DATA
-- ==========================================

-- Insert default company
INSERT OR REPLACE INTO companies (uuid, name, email, phone, address, tax_id, currency) 
VALUES ('comp_default_001', 'Your Business Name', 'hello@yourbusiness.com', '+1 (555) 000-0000', '123 Business Street, Suite 100, City, State 12345', 'TAX-ID-12345', 'USD');

-- Insert templates
INSERT OR REPLACE INTO templates (uuid, company_id, name, description, category, primary_color, secondary_color, is_default) VALUES 
('tmpl_minimal_001', 1, 'Minimalist Light', 'Clean and simple design perfect for freelancers', 'minimal', '#10b981', '#1e293b', 0),
('tmpl_modern_001', 1, 'Modern Professional', 'Sleek modern design with gradient accents', 'modern', '#3b82f6', '#1e293b', 1),
('tmpl_corporate_001', 1, 'Corporate Standard', 'Professional design for enterprises', 'corporate', '#1e40af', '#334155', 0),
('tmpl_creative_001', 1, 'Creative Studio', 'Bold design for creative agencies', 'creative', '#ec4899', '#4c1d95', 0);

-- Insert template fields for Minimalist (template_id 1)
INSERT OR REPLACE INTO template_fields (template_id, field_key, field_label, field_type, is_required, sort_order, width) VALUES
(1, 'invoice_number', 'Invoice Number', 'text', 1, 1, 50),
(1, 'issue_date', 'Issue Date', 'date', 1, 2, 25),
(1, 'due_date', 'Due Date', 'date', 1, 3, 25),
(1, 'client_name', 'Client Name', 'text', 1, 4, 100),
(1, 'items', 'Items', 'table', 1, 5, 100);

-- Insert template fields for Modern (template_id 2)
INSERT OR REPLACE INTO template_fields (template_id, field_key, field_label, field_type, is_required, sort_order, width) VALUES
(2, 'invoice_number', 'Invoice Number', 'text', 1, 1, 50),
(2, 'issue_date', 'Issue Date', 'date', 1, 2, 25),
(2, 'due_date', 'Due Date', 'date', 1, 3, 25),
(2, 'client_name', 'Client Name', 'text', 1, 4, 100),
(2, 'client_email', 'Client Email', 'email', 0, 5, 100),
(2, 'items', 'Items', 'table', 1, 6, 100),
(2, 'notes', 'Notes', 'textarea', 0, 7, 100);

-- Insert template fields for Corporate (template_id 3)
INSERT OR REPLACE INTO template_fields (template_id, field_key, field_label, field_type, is_required, sort_order, width) VALUES
(3, 'invoice_number', 'Invoice Number', 'text', 1, 1, 50),
(3, 'issue_date', 'Issue Date', 'date', 1, 2, 25),
(3, 'due_date', 'Due Date', 'date', 1, 3, 25),
(3, 'po_number', 'PO Number', 'text', 1, 4, 100),
(3, 'client_name', 'Client Name', 'text', 1, 5, 100),
(3, 'items', 'Items', 'table', 1, 6, 100),
(3, 'tax_rate', 'Tax Rate (%)', 'number', 1, 7, 100),
(3, 'terms', 'Terms & Conditions', 'textarea', 1, 8, 100);

-- Insert template fields for Creative (template_id 4)
INSERT OR REPLACE INTO template_fields (template_id, field_key, field_label, field_type, is_required, sort_order, width) VALUES
(4, 'invoice_number', 'Invoice Number', 'text', 1, 1, 50),
(4, 'issue_date', 'Issue Date', 'date', 1, 2, 25),
(4, 'due_date', 'Due Date', 'date', 1, 3, 25),
(4, 'project_name', 'Project Name', 'text', 1, 4, 100),
(4, 'client_name', 'Client Name', 'text', 1, 5, 100),
(4, 'items', 'Items', 'table', 1, 6, 100),
(4, 'creative_notes', 'Creative Notes', 'textarea', 0, 7, 100);

-- Insert sample customers
INSERT OR REPLACE INTO customers (uuid, company_id, name, email, phone, address) VALUES 
('cust_sample_001', 1, 'Acme Corporation', 'billing@acme.com', '+1 (555) 123-4567', '123 Corporate Blvd, Business City'),
('cust_sample_002', 1, 'TechStart Inc', 'accounts@techstart.com', '+1 (555) 234-5678', '456 Innovation Drive, Tech City'),
('cust_sample_003', 1, 'Creative Agency Co', 'finance@creativeagency.com', '+1 (555) 345-6789', '789 Design Avenue, Art District');

-- ==========================================
-- 3. ADD FOREIGN KEY CONSTRAINTS AFTER DATA
-- ==========================================

-- Now add foreign key constraints
PRAGMA foreign_keys = OFF;

-- Re-enable foreign keys
PRAGMA foreign_keys = ON;

-- ==========================================
-- 4. CREATE INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_templates_company ON templates(company_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);

-- ==========================================
-- 5. VERIFICATION
-- ==========================================

SELECT 'Database setup complete!' as status;
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
-- ==========================================
-- Complete Invoice System Database Schema
-- Cloudflare D1 Database
-- ==========================================

-- ==========================================
-- 1. CORE TABLES
-- ==========================================

-- Drop tables if they exist (clean setup)
DROP TABLE IF EXISTS invoice_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS template_fields;
DROP TABLE IF EXISTS templates;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS payment_records;

-- Companies table (main business entity)
CREATE TABLE companies (
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

-- Customers table
CREATE TABLE customers (
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
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Templates table (invoice templates)
CREATE TABLE templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    company_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'modern', -- minimal, modern, corporate, creative
    primary_color TEXT DEFAULT '#3b82f6',
    secondary_color TEXT DEFAULT '#1e293b',
    accent_color TEXT DEFAULT '#10b981',
    font_family TEXT DEFAULT 'Inter',
    is_default BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    usage_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Template fields table (dynamic fields for each template)
CREATE TABLE template_fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,
    field_key TEXT NOT NULL,
    field_label TEXT NOT NULL,
    field_type TEXT DEFAULT 'text', -- text, textarea, date, number, email, phone, table
    is_required BOOLEAN DEFAULT 0,
    default_value TEXT,
    placeholder TEXT,
    validation_rules TEXT, -- JSON string for validation
    sort_order INTEGER DEFAULT 0,
    width INTEGER DEFAULT 100, -- Width percentage (25, 50, 75, 100)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
);

-- Invoices table
CREATE TABLE invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    company_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    template_id INTEGER NOT NULL,
    invoice_number TEXT NOT NULL,
    po_number TEXT,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'draft', -- draft, sent, viewed, paid, overdue, cancelled
    subtotal DECIMAL(10,2) DEFAULT 0,
    discount_type TEXT DEFAULT 'fixed', -- fixed, percentage
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
    payment_status TEXT DEFAULT 'pending', -- pending, partial, paid
    sent_at DATETIME,
    viewed_at DATETIME,
    paid_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (template_id) REFERENCES templates(id)
);

-- Invoice items table
CREATE TABLE invoice_items (
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
    metadata TEXT, -- JSON for additional fields
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Payment records table
CREATE TABLE payment_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    invoice_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT, -- credit_card, bank_transfer, cash, check, crypto
    transaction_id TEXT,
    payment_date DATE NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Activity logs table (for tracking)
CREATE TABLE activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    company_id INTEGER NOT NULL,
    user_id TEXT,
    action TEXT NOT NULL,
    entity_type TEXT, -- invoice, customer, template
    entity_id INTEGER,
    details TEXT, -- JSON data
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- ==========================================
-- 2. INDEXES FOR PERFORMANCE
-- ==========================================

-- Companies indexes
CREATE INDEX idx_companies_uuid ON companies(uuid);

-- Customers indexes
CREATE INDEX idx_customers_company ON customers(company_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_created ON customers(created_at);

-- Invoices indexes
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_template ON invoices(template_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_dates ON invoices(issue_date, due_date);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX idx_invoices_created ON invoices(created_at);

-- Invoice items indexes
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_sort ON invoice_items(sort_order);

-- Templates indexes
CREATE INDEX idx_templates_company ON templates(company_id);
CREATE INDEX idx_templates_default ON templates(is_default);
CREATE INDEX idx_templates_category ON templates(category);

-- Template fields indexes
CREATE INDEX idx_template_fields_template ON template_fields(template_id);
CREATE INDEX idx_template_fields_sort ON template_fields(sort_order);

-- Payment records indexes
CREATE INDEX idx_payments_invoice ON payment_records(invoice_id);
CREATE INDEX idx_payments_date ON payment_records(payment_date);

-- Activity logs indexes
CREATE INDEX idx_activity_company ON activity_logs(company_id);
CREATE INDEX idx_activity_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_created ON activity_logs(created_at);

-- ==========================================
-- 3. TRIGGERS FOR AUTOMATIC UPDATES
-- ==========================================

-- Update customer totals when invoice is created/updated
CREATE TRIGGER update_customer_totals AFTER INSERT ON invoices
BEGIN
    UPDATE customers 
    SET total_invoices = (
        SELECT COUNT(*) FROM invoices WHERE customer_id = NEW.customer_id
    ),
    total_spent = (
        SELECT COALESCE(SUM(total), 0) FROM invoices 
        WHERE customer_id = NEW.customer_id AND status = 'paid'
    ),
    last_invoice_date = (
        SELECT MAX(issue_date) FROM invoices WHERE customer_id = NEW.customer_id
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.customer_id;
END;

-- Update template usage count
CREATE TRIGGER update_template_usage AFTER INSERT ON invoices
BEGIN
    UPDATE templates 
    SET usage_count = usage_count + 1,
    updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.template_id;
END;

-- Update invoice balance when payment is added
CREATE TRIGGER update_invoice_balance AFTER INSERT ON payment_records
BEGIN
    UPDATE invoices 
    SET amount_paid = (
        SELECT COALESCE(SUM(amount), 0) FROM payment_records WHERE invoice_id = NEW.invoice_id
    ),
    balance_due = total - (
        SELECT COALESCE(SUM(amount), 0) FROM payment_records WHERE invoice_id = NEW.invoice_id
    ),
    payment_status = CASE 
        WHEN total - (SELECT COALESCE(SUM(amount), 0) FROM payment_records WHERE invoice_id = NEW.invoice_id) <= 0 THEN 'paid'
        WHEN (SELECT COALESCE(SUM(amount), 0) FROM payment_records WHERE invoice_id = NEW.invoice_id) > 0 THEN 'partial'
        ELSE 'pending'
    END,
    status = CASE 
        WHEN total - (SELECT COALESCE(SUM(amount), 0) FROM payment_records WHERE invoice_id = NEW.invoice_id) <= 0 THEN 'paid'
        ELSE status
    END,
    paid_at = CASE 
        WHEN total - (SELECT COALESCE(SUM(amount), 0) FROM payment_records WHERE invoice_id = NEW.invoice_id) <= 0 THEN CURRENT_TIMESTAMP
        ELSE paid_at
    END,
    updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.invoice_id;
END;

-- ==========================================
-- 4. DEFAULT DATA
-- ==========================================

-- Insert default company
INSERT INTO companies (uuid, name, email, phone, address, tax_id, currency) VALUES 
('comp_default_001', 'Your Business Name', 'hello@yourbusiness.com', '+1 (555) 000-0000', '123 Business Street, Suite 100, City, State 12345', 'TAX-ID-12345', 'USD');

-- Insert modern templates
INSERT INTO templates (uuid, company_id, name, description, category, primary_color, secondary_color, is_default, is_active) VALUES 
('tmpl_minimal_001', 1, 'Minimalist Light', 'Clean and simple design perfect for freelancers and small businesses. Features a clean layout with subtle borders and ample white space.', 'minimal', '#10b981', '#1e293b', 0, 1),
('tmpl_modern_001', 1, 'Modern Professional', 'Sleek modern design with gradient accents and professional layout. Perfect for tech companies and modern businesses.', 'modern', '#3b82f6', '#1e293b', 1, 1),
('tmpl_corporate_001', 1, 'Corporate Standard', 'Professional design for enterprises and large organizations. Includes company branding and detailed invoice sections.', 'corporate', '#1e40af', '#334155', 0, 1),
('tmpl_creative_001', 1, 'Creative Studio', 'Bold design for creative agencies, artists, and designers. Features vibrant colors and artistic layout.', 'creative', '#ec4899', '#4c1d95', 0, 1);

-- Insert fields for Minimalist template (id 2)
INSERT INTO template_fields (template_id, field_key, field_label, field_type, is_required, sort_order, width) VALUES
(2, 'invoice_number', 'Invoice Number', 'text', 1, 1, 50),
(2, 'issue_date', 'Issue Date', 'date', 1, 2, 25),
(2, 'due_date', 'Due Date', 'date', 1, 3, 25),
(2, 'client_name', 'Client Name', 'text', 1, 4, 100),
(2, 'client_email', 'Client Email', 'email', 0, 5, 50),
(2, 'client_phone', 'Client Phone', 'phone', 0, 6, 50),
(2, 'items', 'Items', 'table', 1, 7, 100),
(2, 'notes', 'Notes', 'textarea', 0, 8, 100);

-- Insert fields for Modern template (id 3 - default)
INSERT INTO template_fields (template_id, field_key, field_label, field_type, is_required, sort_order, width) VALUES
(3, 'invoice_number', 'Invoice Number', 'text', 1, 1, 50),
(3, 'issue_date', 'Issue Date', 'date', 1, 2, 25),
(3, 'due_date', 'Due Date', 'date', 1, 3, 25),
(3, 'po_number', 'PO Number', 'text', 0, 4, 100),
(3, 'client_name', 'Client Name', 'text', 1, 5, 100),
(3, 'client_company', 'Client Company', 'text', 0, 6, 100),
(3, 'client_email', 'Client Email', 'email', 0, 7, 50),
(3, 'client_phone', 'Client Phone', 'phone', 0, 8, 50),
(3, 'client_address', 'Client Address', 'textarea', 0, 9, 100),
(3, 'items', 'Items', 'table', 1, 10, 100),
(3, 'subtotal', 'Subtotal', 'number', 1, 11, 100),
(3, 'discount', 'Discount', 'number', 0, 12, 50),
(3, 'tax_rate', 'Tax Rate (%)', 'number', 0, 13, 50),
(3, 'shipping', 'Shipping Cost', 'number', 0, 14, 100),
(3, 'notes', 'Notes', 'textarea', 0, 15, 100),
(3, 'terms', 'Terms & Conditions', 'textarea', 0, 16, 100);

-- Insert fields for Corporate template (id 4)
INSERT INTO template_fields (template_id, field_key, field_label, field_type, is_required, sort_order, width) VALUES
(4, 'invoice_number', 'Invoice Number', 'text', 1, 1, 50),
(4, 'issue_date', 'Issue Date', 'date', 1, 2, 25),
(4, 'due_date', 'Due Date', 'date', 1, 3, 25),
(4, 'po_number', 'PO Number', 'text', 1, 4, 100),
(4, 'client_name', 'Client Name', 'text', 1, 5, 100),
(4, 'client_tax_id', 'Client Tax ID/VAT', 'text', 0, 6, 50),
(4, 'client_email', 'Client Email', 'email', 0, 7, 50),
(4, 'project_name', 'Project Name', 'text', 0, 8, 100),
(4, 'items', 'Items', 'table', 1, 9, 100),
(4, 'subtotal', 'Subtotal', 'number', 1, 10, 100),
(4, 'discount', 'Discount', 'number', 0, 11, 50),
(4, 'tax_rate', 'Tax Rate (%)', 'number', 1, 12, 50),
(4, 'shipping', 'Shipping Cost', 'number', 0, 13, 100),
(4, 'notes', 'Notes', 'textarea', 0, 14, 100),
(4, 'terms', 'Terms & Conditions', 'textarea', 1, 15, 100),
(4, 'bank_details', 'Bank Account Details', 'textarea', 0, 16, 100);

-- Insert fields for Creative template (id 5)
INSERT INTO template_fields (template_id, field_key, field_label, field_type, is_required, sort_order, width) VALUES
(5, 'invoice_number', 'Invoice Number', 'text', 1, 1, 50),
(5, 'issue_date', 'Issue Date', 'date', 1, 2, 25),
(5, 'due_date', 'Due Date', 'date', 1, 3, 25),
(5, 'project_name', 'Project Name', 'text', 1, 4, 100),
(5, 'client_name', 'Client Name', 'text', 1, 5, 100),
(5, 'creative_director', 'Creative Director', 'text', 0, 6, 100),
(5, 'client_email', 'Client Email', 'email', 0, 7, 100),
(5, 'items', 'Items', 'table', 1, 8, 100),
(5, 'creative_notes', 'Creative Notes', 'textarea', 0, 9, 100),
(5, 'brand_guidelines', 'Brand Guidelines', 'textarea', 0, 10, 100),
(5, 'file_attachments', 'Attachments', 'text', 0, 11, 100),
(5, 'license_info', 'License Information', 'textarea', 0, 12, 100);

-- Insert sample customers
INSERT INTO customers (uuid, company_id, name, email, phone, address, notes) VALUES 
('cust_sample_001', 1, 'Acme Corporation', 'billing@acme.com', '+1 (555) 123-4567', '123 Corporate Blvd, Business City, BC 12345', 'Enterprise client - Net 30 terms'),
('cust_sample_002', 1, 'TechStart Inc', 'accounts@techstart.com', '+1 (555) 234-5678', '456 Innovation Drive, Tech City, TC 67890', 'Startup - Monthly retainer'),
('cust_sample_003', 1, 'Creative Agency Co', 'finance@creativeagency.com', '+1 (555) 345-6789', '789 Design Avenue, Art District, AD 13579', 'Agency - Project based');

-- Insert sample invoices
INSERT INTO invoices (uuid, company_id, customer_id, template_id, invoice_number, po_number, issue_date, due_date, status, subtotal, tax_rate, tax_amount, total, notes, terms) VALUES 
('inv_sample_001', 1, 1, 3, 'INV-2024-001', 'PO-12345', DATE('now', '-30 days'), DATE('now', '-16 days'), 'paid', 1500.00, 10.00, 150.00, 1650.00, 'Thank you for your business!', 'Net 15 payment terms'),
('inv_sample_002', 1, 2, 3, 'INV-2024-002', NULL, DATE('now', '-15 days'), DATE('now', '-1 days'), 'sent', 2500.00, 10.00, 250.00, 2750.00, 'Monthly retainer for January', 'Due upon receipt'),
('inv_sample_003', 1, 3, 5, 'INV-2024-003', 'PROJ-789', DATE('now', '-5 days'), DATE('now', '+10 days'), 'draft', 3200.00, 8.00, 256.00, 3456.00, 'Website redesign project', '50% upfront, 50% upon completion');

-- Insert sample invoice items
INSERT INTO invoice_items (uuid, invoice_id, description, quantity, unit_price, total, sort_order) VALUES
('item_001', 1, 'Web Development - Landing Page', 1, 800.00, 800.00, 1),
('item_002', 1, 'SEO Optimization - 3 months', 1, 700.00, 700.00, 2),
('item_003', 2, 'Monthly Maintenance Retainer', 1, 2500.00, 2500.00, 1),
('item_004', 3, 'UI/UX Design', 1, 1200.00, 1200.00, 1),
('item_005', 3, 'Frontend Development', 1, 1500.00, 1500.00, 2),
('item_006', 3, 'Backend Integration', 1, 500.00, 500.00, 3);

-- Insert sample payment records
INSERT INTO payment_records (uuid, invoice_id, amount, payment_method, transaction_id, payment_date, status) VALUES
('pay_001', 1, 1650.00, 'credit_card', 'txn_123456789', DATE('now', '-28 days'), 'completed');

-- ==========================================
-- 5. VIEWS FOR COMMON QUERIES
-- ==========================================

-- Invoice summary view
CREATE VIEW v_invoice_summary AS
SELECT 
    i.id,
    i.invoice_number,
    i.issue_date,
    i.due_date,
    i.status,
    i.total,
    i.amount_paid,
    i.balance_due,
    c.name as customer_name,
    c.email as customer_email,
    t.name as template_name,
    julianday(i.due_date) - julianday('now') as days_overdue
FROM invoices i
LEFT JOIN customers c ON i.customer_id = c.id
LEFT JOIN templates t ON i.template_id = t.id;

-- Monthly revenue view
CREATE VIEW v_monthly_revenue AS
SELECT 
    strftime('%Y-%m', paid_at) as month,
    COUNT(*) as invoice_count,
    SUM(amount) as total_amount
FROM payment_records pr
JOIN invoices i ON pr.invoice_id = i.id
WHERE pr.status = 'completed'
GROUP BY strftime('%Y-%m', paid_at)
ORDER BY month DESC;

-- Customer lifetime value view
CREATE VIEW v_customer_lifetime_value AS
SELECT 
    c.id,
    c.name,
    c.email,
    COUNT(i.id) as invoice_count,
    COALESCE(SUM(i.total), 0) as total_revenue,
    COALESCE(AVG(i.total), 0) as avg_invoice_value,
    MAX(i.issue_date) as last_invoice_date
FROM customers c
LEFT JOIN invoices i ON c.id = i.customer_id
GROUP BY c.id, c.name, c.email;

-- ==========================================
-- 6. MAINTENANCE FUNCTIONS
-- ==========================================

-- Update overdue invoices status
CREATE TRIGGER update_overdue_status
AFTER UPDATE OF due_date ON invoices
BEGIN
    UPDATE invoices 
    SET status = 'overdue' 
    WHERE due_date < DATE('now') 
    AND status NOT IN ('paid', 'cancelled');
END;

-- Auto-update updated_at timestamp
CREATE TRIGGER update_companies_timestamp 
AFTER UPDATE ON companies
BEGIN
    UPDATE companies SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_customers_timestamp 
AFTER UPDATE ON customers
BEGIN
    UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_invoices_timestamp 
AFTER UPDATE ON invoices
BEGIN
    UPDATE invoices SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_templates_timestamp 
AFTER UPDATE ON templates
BEGIN
    UPDATE templates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ==========================================
-- 7. DATABASE STATISTICS QUERY (for monitoring)
-- ==========================================

-- Run this to get database statistics:
-- SELECT 
--     (SELECT COUNT(*) FROM companies) as total_companies,
--     (SELECT COUNT(*) FROM customers) as total_customers,
--     (SELECT COUNT(*) FROM invoices) as total_invoices,
--     (SELECT COUNT(*) FROM invoice_items) as total_items,
--     (SELECT COUNT(*) FROM templates) as total_templates,
--     (SELECT COALESCE(SUM(total), 0) FROM invoices WHERE status = 'paid') as total_revenue,
--     (SELECT COALESCE(SUM(amount_paid), 0) FROM invoices) as total_collected;

-- ==========================================
-- END OF SCHEMA
-- ==========================================
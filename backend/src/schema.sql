-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS invoice_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS template_fields;
DROP TABLE IF EXISTS templates;
DROP TABLE IF EXISTS companies;

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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Templates table (invoice templates)
CREATE TABLE templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    company_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Template fields table (dynamic fields for each template)
CREATE TABLE template_fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,
    field_key TEXT NOT NULL,
    field_label TEXT NOT NULL,
    field_type TEXT DEFAULT 'text', -- text, textarea, date, number
    is_required BOOLEAN DEFAULT 0,
    default_value TEXT,
    sort_order INTEGER DEFAULT 0,
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
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'draft', -- draft, sent, paid, overdue
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    terms TEXT,
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
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_customers_company ON customers(company_id);
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_templates_company ON templates(company_id);

-- Insert default data
INSERT INTO companies (uuid, name, email, phone, address) VALUES 
('comp_default_001', 'Your Business Name', 'hello@yourbusiness.com', '+1 (555) 000-0000', '123 Business Street, City, State 12345');

INSERT INTO templates (uuid, company_id, name, description, is_default) VALUES 
('tmpl_default_001', 1, 'Standard Invoice', 'Professional standard invoice template', 1);

-- Insert default template fields
INSERT INTO template_fields (template_id, field_key, field_label, field_type, is_required, sort_order) VALUES
(1, 'company_name', 'Company Name', 'text', 1, 1),
(1, 'company_email', 'Company Email', 'text', 1, 2),
(1, 'company_phone', 'Company Phone', 'text', 0, 3),
(1, 'company_address', 'Company Address', 'textarea', 1, 4),
(1, 'client_name', 'Client Name', 'text', 1, 5),
(1, 'client_email', 'Client Email', 'text', 0, 6),
(1, 'client_address', 'Client Address', 'textarea', 1, 7),
(1, 'invoice_number', 'Invoice Number', 'text', 1, 8),
(1, 'issue_date', 'Issue Date', 'date', 1, 9),
(1, 'due_date', 'Due Date', 'date', 1, 10),
(1, 'notes', 'Notes', 'textarea', 0, 11),
(1, 'terms', 'Terms & Conditions', 'textarea', 0, 12);

-- Insert sample customer
INSERT INTO customers (uuid, company_id, name, email, phone, address) VALUES 
('cust_sample_001', 1, 'Sample Client', 'client@example.com', '+1 (555) 123-4567', '456 Client Ave, Sample City, ST 67890');
# create-invoice-generator.ps1
Write-Host "Creating Invoice App Structure..." -ForegroundColor Green

# Create root directories
New-Item -ItemType Directory -Path "invoice-" -Force
New-Item -ItemType Directory -Path "invoice-generator/backend" -Force
New-Item -ItemType Directory -Path "invoice-generator/backend/src" -Force
New-Item -ItemType Directory -Path "invoice-generator/backend/src/routes" -Force
New-Item -ItemType Directory -Path "invoice-generator/frontend" -Force
New-Item -ItemType Directory -Path "invoice-generator/frontend/css" -Force
New-Item -ItemType Directory -Path "invoice-generator/frontend/js" -Force
New-Item -ItemType Directory -Path "invoice-generator/frontend/pages" -Force

# Backend files
New-Item -ItemType File -Path "invoice-generator/backend/package.json" -Force
New-Item -ItemType File -Path "invoice-generator/backend/wrangler.toml" -Force
New-Item -ItemType File -Path "invoice-generator/backend/src/index.js" -Force
New-Item -ItemType File -Path "invoice-generator/backend/src/schema.sql" -Force
New-Item -ItemType File -Path "invoice-generator/backend/src/routes/invoices.js" -Force
New-Item -ItemType File -Path "invoice-generator/backend/src/routes/customers.js" -Force
New-Item -ItemType File -Path "invoice-generator/backend/src/routes/templates.js" -Force
New-Item -ItemType File -Path "invoice-generator/backend/.env.example" -Force

# Frontend files
New-Item -ItemType File -Path "invoice-generator/frontend/index.html" -Force
New-Item -ItemType File -Path "invoice-generator/frontend/css/styles.css" -Force
New-Item -ItemType File -Path "invoice-generator/frontend/js/app.js" -Force
New-Item -ItemType File -Path "invoice-generator/frontend/js/api.js" -Force
New-Item -ItemType File -Path "invoice-generator/frontend/pages/dashboard.html" -Force
New-Item -ItemType File -Path "invoice-generator/frontend/pages/invoice-builder.html" -Force
New-Item -ItemType File -Path "invoice-generator/frontend/pages/customers.html" -Force
New-Item -ItemType File -Path "invoice-generator/frontend/pages/templates.html" -Force
New-Item -ItemType File -Path "invoice-generator/frontend/netlify.toml" -Force

Write-Host "Folder structure created successfully!" -ForegroundColor Green
Write-Host "Location: $PWD\invoice-generator" -ForegroundColor Yellow





https://invoice-backend.atologbook.workers.dev
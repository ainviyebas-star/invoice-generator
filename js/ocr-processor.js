// frontend/js/ocr-processor.js - OCR Invoice Processing
import Tesseract from 'tesseract.js';
import * as PDFJS from 'pdfjs-dist';

// Configure PDF.js worker
PDFJS.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

// OCR Processing State
let currentProgress = 0;
let currentStatus = 'idle';

// Invoice data structure
class InvoiceData {
    constructor() {
        this.invoice_number = '';
        this.invoice_date = '';
        this.due_date = '';
        this.vendor_name = '';
        this.vendor_address = '';
        this.customer_name = '';
        this.customer_address = '';
        this.subtotal = 0;
        this.tax_rate = 0;
        this.tax_amount = 0;
        this.total = 0;
        this.currency = 'USD';
        this.items = [];
        this.po_number = '';
        this.notes = '';
    }
}

// Progress callback
function updateProgress(progress, status) {
    currentProgress = progress;
    currentStatus = status;
    
    const progressEvent = new CustomEvent('ocrProgress', {
        detail: { progress, status }
    });
    window.dispatchEvent(progressEvent);
}

// Extract text from image using Tesseract.js
async function extractTextFromImage(file) {
    updateProgress(10, 'Initializing OCR engine...');
    
    return new Promise((resolve, reject) => {
        Tesseract.recognize(
            file,
            'eng',  // Language - add '+chi_sim' for Chinese support
            {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        const progress = 10 + (m.progress * 80);
                        updateProgress(progress, `Processing: ${Math.round(m.progress * 100)}%`);
                    }
                }
            }
        )
        .then(({ data: { text } }) => {
            updateProgress(90, 'Extracting invoice data...');
            resolve(text);
        })
        .catch((err) => {
            console.error('OCR Error:', err);
            reject(err);
        });
    });
}

// Extract text from PDF (convert to images first)
async function extractTextFromPDF(file) {
    updateProgress(5, 'Loading PDF...');
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFJS.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    const numPages = pdf.numPages;
    
    for (let i = 1; i <= numPages; i++) {
        updateProgress(5 + (i / numPages * 10), `Processing page ${i}/${numPages}`);
        
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;
        
        // Convert canvas to image and run OCR
        const imageData = canvas.toDataURL('image/png');
        const blob = await (await fetch(imageData)).blob();
        
        const pageText = await extractTextFromImage(blob);
        fullText += pageText + '\n';
    }
    
    return fullText;
}

// Parse extracted text using regex patterns
function parseInvoiceText(text) {
    const invoice = new InvoiceData();
    
    // Common regex patterns for invoice extraction
    const patterns = {
        // Invoice Number patterns
        invoice_number: [
            /Invoice\s*(?:Number|No|#)?\s*[:\-]?\s*([A-Z0-9\-]{4,20})/i,
            /INV(?:-|\s)?([A-Z0-9\-]+)/i,
            /Invoice\s*ID\s*[:\-]?\s*([A-Z0-9\-]+)/i
        ],
        
        // Date patterns (various formats)
        invoice_date: [
            /Invoice\s*Date\s*[:\-]?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})/i,
            /Date\s*[:\-]?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})/i,
            /Issue\s*Date\s*[:\-]?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})/i,
            /(\d{4}-\d{2}-\d{2})/  // ISO format
        ],
        
        // Due Date
        due_date: [
            /Due\s*Date\s*[:\-]?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})/i,
            /Payment\s*Due\s*[:\-]?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})/i
        ],
        
        // Vendor/Business name
        vendor_name: [
            /(?:From|Vendor|Seller|Supplier|Company)\s*[:\-]?\s*([A-Za-z0-9\s&.,]+)(?:\n|$)/i,
            /^([A-Za-z0-9\s&.,]+)(?:\n|$)/  // First line often has business name
        ],
        
        // Total amount
        total: [
            /Total\s*(?:Amount|Due)?\s*[:\-]?\s*\$?\s*(\d+(?:\.\d{2})?)/i,
            /Grand\s*Total\s*[:\-]?\s*\$?\s*(\d+(?:\.\d{2})?)/i,
            /Amount\s*Due\s*[:\-]?\s*\$?\s*(\d+(?:\.\d{2})?)/i
        ],
        
        // Subtotal
        subtotal: [
            /Subtotal\s*[:\-]?\s*\$?\s*(\d+(?:\.\d{2})?)/i,
            /Sub\s*Total\s*[:\-]?\s*\$?\s*(\d+(?:\.\d{2})?)/i
        ],
        
        // Tax
        tax: [
            /(?:GST|VAT|HST|Tax)\s*(?:\([\d.]+%\))?\s*[:\-]?\s*\$?\s*(\d+(?:\.\d{2})?)/i,
            /Tax\s*Rate\s*[:\-]?\s*(\d+(?:\.\d+)?)%/i
        ],
        
        // PO Number
        po_number: [
            /PO\s*(?:Number|No|#)?\s*[:\-]?\s*([A-Z0-9\-]+)/i,
            /Purchase\s*Order\s*[:\-]?\s*([A-Z0-9\-]+)/i
        ],
        
        // Customer/Bill To
        customer_name: [
            /Bill\s*To\s*[:\-]?\s*([A-Za-z0-9\s&.,]+)(?:\n|$)/i,
            /Customer\s*[:\-]?\s*([A-Za-z0-9\s&.,]+)/i,
            /Client\s*[:\-]?\s*([A-Za-z0-9\s&.,]+)/i
        ]
    };
    
    // Apply all patterns
    for (const [field, patternList] of Object.entries(patterns)) {
        for (const pattern of patternList) {
            const match = text.match(pattern);
            if (match && match[1]) {
                let value = match[1].trim();
                
                // Clean and format based on field type
                if (field === 'total' || field === 'subtotal') {
                    value = parseFloat(value) || 0;
                } else if (field === 'tax_rate') {
                    value = parseFloat(value) || 0;
                } else if (field === 'invoice_date' || field === 'due_date') {
                    value = normalizeDate(value);
                }
                
                invoice[field] = value;
                break; // Stop after first match
            }
        }
    }
    
    // Extract line items (items with prices)
    invoice.items = extractLineItems(text);
    
    // Extract tax rate from percentage pattern
    const taxRateMatch = text.match(/Tax\s*Rate\s*[:\-]?\s*(\d+(?:\.\d+)?)%/i);
    if (taxRateMatch) {
        invoice.tax_rate = parseFloat(taxRateMatch[1]);
    }
    
    // Calculate tax amount if not extracted
    if (invoice.tax_amount === 0 && invoice.tax_rate > 0 && invoice.subtotal > 0) {
        invoice.tax_amount = (invoice.subtotal * invoice.tax_rate) / 100;
    }
    
    return invoice;
}

// Extract line items from invoice text
function extractLineItems(text) {
    const items = [];
    
    // Common patterns for line items
    // Format: Description Qty Price Total
    const linePatterns = [
        /([A-Za-z0-9\s]+?)\s+(\d+)\s+\$?(\d+(?:\.\d{2})?)\s+\$?(\d+(?:\.\d{2})?)/gi,
        /(.+?)\s+(\d+(?:\.\d+)?)\s+x\s+\$?(\d+(?:\.\d{2})?)/gi
    ];
    
    const lines = text.split('\n');
    
    for (const line of lines) {
        // Skip short lines
        if (line.length < 10) continue;
        
        for (const pattern of linePatterns) {
            const matches = line.matchAll(pattern);
            for (const match of matches) {
                items.push({
                    description: match[1].trim(),
                    quantity: parseFloat(match[2]) || 1,
                    unit_price: parseFloat(match[3]) || 0,
                    total: parseFloat(match[4]) || (parseFloat(match[2]) * parseFloat(match[3]))
                });
            }
        }
    }
    
    return items;
}

// Normalize date to YYYY-MM-DD format
function normalizeDate(dateStr) {
    // Handle MM/DD/YYYY or DD/MM/YYYY
    let parts;
    if (dateStr.includes('/')) {
        parts = dateStr.split('/');
        if (parts[0].length === 4) {
            // YYYY/MM/DD
            return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else {
            // Assume MM/DD/YYYY
            return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
    } else if (dateStr.includes('-')) {
        parts = dateStr.split('-');
        if (parts[0].length === 4) {
            return dateStr;
        }
    }
    return dateStr;
}

// Main OCR processing function
async function processInvoice(file, onProgress) {
    updateProgress(0, 'Starting OCR processing...');
    
    try {
        let extractedText;
        const fileType = file.type;
        
        // Handle different file types
        if (fileType === 'application/pdf') {
            extractedText = await extractTextFromPDF(file);
        } else if (fileType.startsWith('image/')) {
            extractedText = await extractTextFromImage(file);
        } else {
            throw new Error('Unsupported file type. Please upload PDF or image files.');
        }
        
        updateProgress(95, 'Parsing extracted data...');
        
        // Parse the extracted text
        const invoiceData = parseInvoiceText(extractedText);
        
        updateProgress(100, 'Processing complete!');
        
        return {
            success: true,
            extracted_text: extractedText,
            invoice_data: invoiceData,
            confidence: 85 // Placeholder confidence score
        };
        
    } catch (error) {
        console.error('OCR Processing Error:', error);
        updateProgress(0, 'Error: ' + error.message);
        
        return {
            success: false,
            error: error.message,
            invoice_data: null
        };
    }
}

// Create invoice from OCR data
async function createInvoiceFromOCR(ocrResult, customerId, templateId = 1) {
    const data = ocrResult.invoice_data;
    
    const invoiceData = {
        company_id: 1,
        customer_id: customerId,
        template_id: templateId,
        invoice_number: data.invoice_number || `OCR-${Date.now()}`,
        po_number: data.po_number || '',
        issue_date: data.invoice_date || new Date().toISOString().split('T')[0],
        due_date: data.due_date || '',
        status: 'draft',
        subtotal: data.subtotal,
        tax_rate: data.tax_rate,
        tax_name: 'GST',
        tax_enabled: data.tax_rate > 0 ? 1 : 0,
        tax_amount: data.tax_amount,
        total: data.total || data.subtotal + data.tax_amount,
        notes: data.notes || `Automatically extracted from uploaded invoice.\nOriginal vendor: ${data.vendor_name || 'Unknown'}`,
        terms: '',
        items: data.items.length > 0 ? data.items : [
            {
                description: 'Invoice items (OCR extracted)',
                quantity: 1,
                unit_price: data.total || 0,
                total: data.total || 0
            }
        ]
    };
    
    return invoiceData;
}

// Export functions
window.OCRProcessor = {
    processInvoice,
    createInvoiceFromOCR,
    parseInvoiceText,
    InvoiceData
};
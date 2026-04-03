// frontend/netlify/functions/api-proxy.js
const API_BASE = process.env.VITE_API_URL || 'https://invoice-backend.atologbook.workers.dev/api';

exports.handler = async (event, context) => {
    const path = event.path.replace('/.netlify/functions/api-proxy', '');
    const targetUrl = `${API_BASE}${path}`;
    
    try {
        const response = await fetch(targetUrl, {
            method: event.httpMethod,
            headers: {
                'Content-Type': 'application/json',
                ...event.headers
            },
            body: event.body
        });
        
        const data = await response.json();
        
        return {
            statusCode: response.status,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
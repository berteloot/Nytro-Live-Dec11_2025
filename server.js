// Secure Backend API for HubSpot Integration
// Deployed on Render - serves frontend and proxies HubSpot API calls

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// Set proper MIME types for specific files BEFORE static serving
app.use('/config.js', (req, res, next) => {
  res.setHeader('Content-Type', 'application/javascript');
  next();
});

// Serve static files (frontend) - AFTER specific routes
app.use(express.static(path.join(__dirname), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Serve index.html for root requests
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle favicon requests to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No content response
});

// HubSpot API Configuration (from environment variables)
const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY;
const HUBSPOT_BASE_URL = 'https://api.hubapi.com';

// Validate API key exists (warn but don't exit for testing)
if (!HUBSPOT_API_KEY) {
  console.warn('WARNING: HUBSPOT_API_KEY environment variable is not set. HubSpot integration will not work.');
}

// API Endpoints

// Create new contact
app.post('/api/hubspot/create-contact', async (req, res) => {
  try {
    const { email, notes } = req.body;

    console.log('Create contact request:', { email, notes });

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!HUBSPOT_API_KEY) {
      console.error('HubSpot API key not configured');
      return res.status(500).json({ error: 'HubSpot API key not configured' });
    }

    console.log('Making HubSpot API call with key:', HUBSPOT_API_KEY ? 'configured' : 'missing');

    const requestBody = {
      properties: {
        email: email,
        notes: notes || ''
      }
    };

    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HUBSPOT_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('HubSpot API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HubSpot API error response:', response.status, errorText);
      throw new Error(`HubSpot API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Contact created successfully:', data);
    res.json(data);
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Failed to create contact', details: error.message });
  }
});

// Update existing contact by email
app.post('/api/hubspot/update-contact', async (req, res) => {
  try {
    const { email, notes } = req.body;

    console.log('Update contact by email request:', { email, notes });

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!HUBSPOT_API_KEY) {
      return res.status(500).json({ error: 'HubSpot API key not configured' });
    }

    // First find the contact by email
    const searchResponse = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HUBSPOT_API_KEY}`
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{
            propertyName: 'email',
            operator: 'EQ',
            value: email
          }]
        }],
        properties: ['email']
      })
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Contact search failed:', searchResponse.status, errorText);
      return res.status(404).json({ error: 'Contact not found' });
    }

    const searchData = await searchResponse.json();
    if (!searchData.results || searchData.results.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const contactId = searchData.results[0].id;

    // Update the contact
    const updateResponse = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/${contactId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HUBSPOT_API_KEY}`
      },
      body: JSON.stringify({
        properties: {
          notes: notes || ''
        }
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('HubSpot update error:', updateResponse.status, errorText);
      throw new Error(`HubSpot API error: ${updateResponse.status} - ${errorText}`);
    }

    const data = await updateResponse.json();
    console.log('Contact updated successfully for email:', email);
    res.json(data);
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Failed to update contact', details: error.message });
  }
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve client configuration
app.get('/api/config', (req, res) => {
  res.json({
    ALLOWED_DOMAIN: 'nytromarketing.com',
    HUBSPOT_EMAIL_PROPERTY: 'email',
    HUBSPOT_FIRSTNAME_PROPERTY: 'firstname',
    HUBSPOT_LASTNAME_PROPERTY: 'lastname',
    HUBSPOT_COMPANY_PROPERTY: 'company',
    HUBSPOT_NOTES_PROPERTY: 'notes',
    BACKEND_API_URL: '/api/hubspot',
    BACKEND_API_ENDPOINTS: {
      CREATE_CONTACT: '/create-contact',
      UPDATE_CONTACT: '/update-contact'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    hubspotConfigured: !!HUBSPOT_API_KEY,
    version: '1.0.0',
    config: {
      backendUrl: '/api/hubspot',
      hubspotBaseUrl: HUBSPOT_BASE_URL
    }
  });
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    server: 'running',
    port: PORT,
    timestamp: new Date().toISOString(),
    hubspotConfigured: !!HUBSPOT_API_KEY,
    staticPath: path.join(__dirname)
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Secure HubSpot proxy server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

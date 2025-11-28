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

// Search for existing contact by email
app.post('/api/hubspot/search-contact', async (req, res) => {
  try {
    const { email } = req.body;

    console.log('Search contact request:', { email });

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!HUBSPOT_API_KEY) {
      return res.status(500).json({ error: 'HubSpot API key not configured' });
    }

    const response = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/search`, {
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
        properties: ['email', 'notes']
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HubSpot search error:', response.status, errorText);
      throw new Error(`HubSpot API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const contact = data.results && data.results.length > 0 ? data.results[0] : null;

    console.log('Search result:', { found: !!contact, contactId: contact?.id });

    res.json({ contact });
  } catch (error) {
    console.error('Search contact error:', error);
    res.status(500).json({ error: 'Failed to search contact', details: error.message });
  }
});

// Create new contact
app.post('/api/hubspot/create-contact', async (req, res) => {
  try {
    const { email, notes } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!HUBSPOT_API_KEY) {
      return res.status(500).json({ error: 'HubSpot API key not configured' });
    }

    const response = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HUBSPOT_API_KEY}`
      },
      body: JSON.stringify({
        properties: {
          email: email,
          notes: notes || ''
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HubSpot API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// Update existing contact
app.post('/api/hubspot/update-contact', async (req, res) => {
  try {
    const { contactId, notes } = req.body;

    console.log('Update contact request:', { contactId, notes });

    if (!contactId) {
      return res.status(400).json({ error: 'Contact ID is required' });
    }

    if (!HUBSPOT_API_KEY) {
      return res.status(500).json({ error: 'HubSpot API key not configured' });
    }

    // Validate contact exists first
    const checkResponse = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/${contactId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_API_KEY}`
      }
    });

    if (!checkResponse.ok) {
      console.error('Contact validation failed:', checkResponse.status, await checkResponse.text());
      return res.status(404).json({ error: 'Contact not found or invalid contact ID' });
    }

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
    console.log('Contact updated successfully:', contactId);
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
      SEARCH_CONTACT: '/search-contact',
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

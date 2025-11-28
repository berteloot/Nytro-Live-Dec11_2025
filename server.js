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

// Create new contact or update existing
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
        // TODO: Change this to your actual HubSpot property name
        // Options: 'notes', 'last_live_event', 'ai_live_dec11_registered', etc.
        ai_live_dec11_registered: true,
        last_live_event: notes || ''
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

    if (response.ok) {
      // Contact created successfully
      const data = await response.json();
      console.log('Contact created successfully:', data);
      return res.json({ ...data, action: 'created' });
    }

    if (response.status === 409) {
      // Contact already exists - update it instead
      console.log('Contact already exists, updating instead...');
      const errorText = await response.text();
      console.log('409 response:', errorText);

      // Extract existing contact ID if available
      const idMatch = errorText.match(/ID:\s*(\d+)/);
      const existingId = idMatch ? idMatch[1] : null;

      if (existingId) {
        // Update the existing contact
        return updateExistingContact(existingId, requestBody, res);
      } else {
        // Fallback: search by email and update
        return updateContactByEmail(email, requestBody, res);
      }
    }

    // Handle other errors
    const errorText = await response.text();
    console.error('HubSpot API error response:', response.status, errorText);
    throw new Error(`HubSpot API error: ${response.status} - ${errorText}`);

  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Failed to create contact', details: error.message });
  }
});

// Helper function to update existing contact by ID
async function updateExistingContact(contactId, properties, res) {
  try {
    console.log('Updating existing contact:', contactId);

    const response = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/${contactId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HUBSPOT_API_KEY}`
      },
      body: JSON.stringify({ properties })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update error:', response.status, errorText);
      throw new Error(`Update failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Contact updated successfully:', contactId);
    res.json({ ...data, action: 'updated' });

  } catch (error) {
    console.error('Update existing contact error:', error);
    res.status(500).json({ error: 'Failed to update contact', details: error.message });
  }
}

// Helper function to update contact by email
async function updateContactByEmail(email, properties, res) {
  try {
    console.log('Updating contact by email:', email);

    // First find the contact
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
      throw new Error(`Search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    if (!searchData.results || searchData.results.length === 0) {
      throw new Error('Contact not found for update');
    }

    const contactId = searchData.results[0].id;
    return updateExistingContact(contactId, properties, res);

  } catch (error) {
    console.error('Update by email error:', error);
    res.status(500).json({ error: 'Failed to update contact', details: error.message });
  }
}

// Update existing contact by email (fallback endpoint)
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

    const properties = {
      // TODO: Change this to your actual HubSpot property name
      ai_live_dec11_registered: true,
      last_live_event: notes || ''
    };

    return updateContactByEmail(email, properties, res);

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

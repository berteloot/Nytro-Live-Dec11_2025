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

// Create contact and add note engagement
app.post('/api/hubspot/create-contact', async (req, res) => {
  try {
    const { email, notes } = req.body;

    console.log('Create contact and note request:', { email, notes });

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!HUBSPOT_API_KEY) {
      console.error('HubSpot API key not configured');
      return res.status(500).json({ error: 'HubSpot API key not configured' });
    }

    const noteContent = notes || 'Live December 11, 2025 - Web';

    // Step 1: Ensure contact exists (create if needed)
    const contactResult = await ensureContactExists(email);

    // Step 2: Create an engagement (activity) associated with the contact
    const engagementResult = await createContactEngagement(contactResult.contactId, noteContent);

    console.log('Contact ensured and engagement created:', {
      contactId: contactResult.contactId,
      engagementId: engagementResult.engagement.id,
      action: contactResult.action
    });

    res.json({
      contactId: contactResult.contactId,
      engagementId: engagementResult.engagement.id,
      action: contactResult.action,
      engagementCreated: true
    });

  } catch (error) {
    console.error('Create contact and note error:', error);
    res.status(500).json({ error: 'Failed to create contact and note', details: error.message });
  }
});

// Helper function to ensure contact exists
async function ensureContactExists(email) {
  try {
    console.log('Ensuring contact exists for email:', email);

    // First try to create the contact
    const createResponse = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HUBSPOT_API_KEY}`
      },
      body: JSON.stringify({
        properties: {
          email: email
        }
      })
    });

    if (createResponse.ok) {
      const data = await createResponse.json();
      console.log('Contact created:', data.id);
      return { contactId: data.id, action: 'created' };
    }

    if (createResponse.status === 409) {
      // Contact exists, find it
      console.log('Contact already exists, finding ID...');
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

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.results && searchData.results.length > 0) {
          console.log('Contact found:', searchData.results[0].id);
          return { contactId: searchData.results[0].id, action: 'found' };
        }
      }
    }

    throw new Error(`Failed to ensure contact exists: ${createResponse.status}`);
  } catch (error) {
    console.error('Ensure contact exists error:', error);
    throw error;
  }
}

// Helper function to create an engagement (activity) for a contact
async function createContactEngagement(contactId, engagementContent) {
  try {
    console.log('Creating engagement for contact:', contactId, 'with content:', engagementContent);

    // Create an engagement (activity) using the legacy API
    // This automatically associates with the contact and appears in their timeline
    const engagementResponse = await fetch(`${HUBSPOT_BASE_URL}/engagements/v1/engagements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HUBSPOT_API_KEY}`
      },
      body: JSON.stringify({
        engagement: {
          active: true,
          type: 'NOTE',
          timestamp: new Date().getTime()
        },
        associations: {
          contactIds: [parseInt(contactId)],
          companyIds: [],
          dealIds: [],
          ownerIds: [],
          ticketIds: []
        },
        metadata: {
          body: engagementContent
        }
      })
    });

    if (!engagementResponse.ok) {
      const errorText = await engagementResponse.text();
      console.error('Engagement creation error:', engagementResponse.status, errorText);
      throw new Error(`Engagement creation failed: ${engagementResponse.status} - ${errorText}`);
    }

    const engagementData = await engagementResponse.json();
    console.log('Engagement created successfully:', engagementData.engagement.id);
    return engagementData;

  } catch (error) {
    console.error('Create contact engagement error:', error);
    throw error;
  }
}


// Update contact by adding note (simplified endpoint)
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

    const engagementContent = notes || 'Live December 11, 2025 - Web';

    // Find the contact and create an engagement
    const contactResult = await ensureContactExists(email);
    const engagementResult = await createContactEngagement(contactResult.contactId, engagementContent);

    console.log('Contact updated with engagement:', {
      contactId: contactResult.contactId,
      engagementId: engagementResult.engagement.id
    });

    res.json({
      contactId: contactResult.contactId,
      engagementId: engagementResult.engagement.id,
      action: 'engagement_added'
    });

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

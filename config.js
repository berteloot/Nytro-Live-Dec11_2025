// Configuration for HubSpot API and email overlay
// SECURITY NOTE: API keys should NEVER be exposed in client-side code!
// This configuration is for reference only. Implement server-side API calls.

const config = {
  // Email Domain for Bypass (client-safe)
  ALLOWED_DOMAIN: 'nytromarketing.com',

  // HubSpot Properties (standard HubSpot property names)
  HUBSPOT_EMAIL_PROPERTY: 'email',
  HUBSPOT_FIRSTNAME_PROPERTY: 'firstname',
  HUBSPOT_LASTNAME_PROPERTY: 'lastname',
  HUBSPOT_COMPANY_PROPERTY: 'company',
  HUBSPOT_NOTES_PROPERTY: 'notes',

  // Your backend API endpoint (AFTER DEPLOYING TO RENDER)
  // This should proxy requests to HubSpot to keep API keys secure
  BACKEND_API_URL: 'https://your-render-service-name.onrender.com/api/hubspot', // Replace with your Render URL
  BACKEND_API_ENDPOINTS: {
    CREATE_CONTACT: '/create-contact',
    SEARCH_CONTACT: '/search-contact',
    UPDATE_CONTACT: '/update-contact'
  }
};

// Export for Node.js environments, or make available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
} else {
  window.CONFIG = config;
}


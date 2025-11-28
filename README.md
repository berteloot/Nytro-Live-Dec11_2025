# 🔒 SECURE Email Overlay Setup

## ⚠️ SECURITY NOTICE
**API keys are now properly secured!** The previous version exposed HubSpot API keys in client-side code. This updated version uses a secure backend proxy.

## 🚀 Quick Setup

### Option 1: Use the Provided Backend (Recommended)

1. **Set up the backend server:**
   ```bash
   # Install dependencies
   npm init -y
   npm install express cors dotenv

   # Copy the example server
   cp server-example.js server.js

   # Create your .env file
   echo "HUBSPOT_API_KEY=your_actual_hubspot_api_key" > .env
   echo "PORT=3001" >> .env
   ```

2. **Update config.js with your backend URL:**
   ```javascript
   const config = {
     BACKEND_API_URL: 'http://localhost:3001/api/hubspot', // For local development
     // ... rest stays the same
   };
   ```

3. **Start the backend:**
   ```bash
   node server.js
   ```

### Option 2: Use Your Existing Backend

If you have an existing backend, implement these endpoints:

- `POST /api/hubspot/create-contact` - Creates new HubSpot contact
- `POST /api/hubspot/search-contact` - Searches for existing contact
- `POST /api/hubspot/update-contact` - Updates existing contact

## 🔑 Getting Your HubSpot API Key

1. Go to your HubSpot account
2. Navigate to **Settings → Account Setup → Integrations → API key**
3. Generate or copy your API key
4. **Never expose this key in client-side code!**

## 🧪 Testing

1. **Start your backend server** (`node server.js`)
2. **Serve the frontend:**
   ```bash
   python3 -m http.server 8080
   ```
3. **Test scenarios:**
   - `@nytromarketing.com` email → Immediate access (no HubSpot call)
   - Other emails → Creates/updates HubSpot contact securely

## 🔐 Security Features

- ✅ **API keys never exposed** to browser
- ✅ **Server-side validation** of all requests
- ✅ **CORS protection** on backend
- ✅ **Input sanitization** and validation
- ✅ **Error handling** without exposing sensitive data

## 📋 API Response Format

The backend should return:

**Success Response:**
```json
{
  "contact": {
    "id": "12345",
    "properties": { "email": "user@example.com" }
  }
}
```

**Error Response:**
```json
{
  "error": "Failed to create contact"
}
```

## 🛠️ Troubleshooting

- **CORS Errors**: Ensure your backend has proper CORS configuration
- **API Errors**: Check server logs and HubSpot API key validity
- **Connection Issues**: Verify your BACKEND_API_URL in config.js
- **Contact Creation**: Ensure your HubSpot account has CRM permissions

## 📁 Files Overview

- `config.js` - Client-safe configuration
- `server-example.js` - Secure backend implementation
- `index.html` - Frontend with secure API calls
- `README.md` - This documentation

## 🎯 Next Steps

1. Set up your backend server
2. Configure your HubSpot API key securely
3. Update the BACKEND_API_URL in config.js
4. Test the integration
5. Deploy both frontend and backend

**Your API keys are now safe! 🔐**

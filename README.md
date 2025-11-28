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

---

## 🚀 Deploy to Render

### **Step 1: Prepare Your Code**
1. Ensure you have `server.js` (renamed from `server-example.js`)
2. Your `package.json` should have the correct scripts
3. Create a `.env` file with your HubSpot API key (see `env-example.txt`)

### **Step 2: Push to GitHub**
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### **Step 3: Deploy on Render**

1. **Go to [render.com](https://render.com) and sign up/login**
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**
   - **Name**: `hubspot-email-overlay` (or your choice)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free tier is fine for testing

### **Step 4: Add Environment Variables**
In Render dashboard, go to your service → Environment:
```
HUBSPOT_API_KEY = your_actual_hubspot_api_key
```

### **Step 5: Deploy**
- Click "Create Web Service"
- Wait for deployment (usually 2-5 minutes)
- Your site will be live at: `https://your-service-name.onrender.com`

### **Step 6: Update Frontend Config**
Update `config.js` with your Render URL:
```javascript
BACKEND_API_URL: 'https://your-service-name.onrender.com/api/hubspot'
```

## 🔧 **Post-Deployment Checklist**

- [ ] Test email overlay functionality
- [ ] Verify HubSpot contact creation
- [ ] Check that `@nytromarketing.com` emails bypass HubSpot
- [ ] Ensure no API keys are exposed in browser console

## 🆘 **Troubleshooting Render**

- **Build fails**: Check your `package.json` dependencies
- **App crashes**: Check Render logs for error messages
- **CORS issues**: Ensure your backend CORS settings are correct
- **Environment variables**: Make sure HUBSPOT_API_KEY is set in Render dashboard

## 💰 **Render Costs**
- **Free tier**: 750 hours/month, sleeps after 15min inactivity
- **Paid plans**: From $7/month for always-on services

**Happy deploying! 🎉**

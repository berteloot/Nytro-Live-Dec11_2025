# 🚀 Single Web Service Deployment

## **Simple Setup: One Service Does Everything**

Your `server.js` serves the **frontend** AND handles **HubSpot API calls**. Perfect for a single deployment!

## 🔑 **Get Your HubSpot API Key**

1. Go to your HubSpot account
2. Navigate to **Settings → Account Setup → Integrations → API key**
3. Generate or copy your API key
4. **This stays secure on the server - never exposed to browsers!**

## 🚀 **Deploy to Render**

### **Step 1: Push Code to GitHub**
```bash
git add .
git commit -m "Ready for single web service deployment"
git push origin main
```

### **Step 2: Create Render Web Service**

1. **Go to [render.com](https://render.com)**
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure:**
   - **Name**: `nytro-live-dec11-2025`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free tier works perfectly

### **Step 3: Add Environment Variable**
- **Key**: `HUBSPOT_API_KEY`
- **Value**: Your HubSpot API key (from step above)

### **Step 4: Deploy**
Click **"Create Web Service"** and wait 2-5 minutes

### **Step 5: Update Config (if needed)**
Your `config.js` should automatically work since the frontend and backend are on the same domain:

```javascript
BACKEND_API_URL: '/api/hubspot' // Relative URL works!
```

## ✅ **What This Solves**

- ✅ **No CORS errors** - frontend and backend on same domain
- ✅ **Secure API keys** - stored server-side only
- ✅ **Single deployment** - everything in one service
- ✅ **Free hosting** - works on Render's free tier
- ✅ **Auto-scaling** - handles traffic spikes

## 🧪 **Test Your Deployment**

1. **Visit your site**: The Render URL you get after deployment
2. **Enter an email** - should work without CORS errors
3. **Check HubSpot** - new contacts created with "Live Dec 11 2025" notes
4. **Verify security** - no API keys visible in browser console

## 🔧 **Troubleshooting**

### **Build Fails**
- Check Render logs for dependency issues
- Ensure `package.json` has correct Node version

### **Runtime Errors**
- Check Render logs for server startup issues
- Verify HUBSPOT_API_KEY environment variable is set
- Make sure HubSpot API key is valid

### **Email Form Not Working**
- Check browser network tab for API calls
- Verify server is running and responding
- Check HubSpot API permissions

### **Free Tier Issues**
- Free tier sleeps after 15min inactivity
- First load may be slow due to cold start
- Consider paid plan for production use

## 📁 **Architecture**

```
Render Web Service (Node.js)
├── Frontend (HTML/CSS/JS) - Served statically
├── Backend API (/api/hubspot/*) - Server-side processing
└── HubSpot Integration - Secure API calls
```

## 🎯 **Success Checklist**

- [ ] Web service deployed successfully
- [ ] HUBSPOT_API_KEY set in environment
- [ ] Site loads and email overlay appears
- [ ] Email submissions work without CORS errors
- [ ] HubSpot contacts are created
- [ ] API keys not visible in browser

**Your secure email overlay is now live! 🎉**

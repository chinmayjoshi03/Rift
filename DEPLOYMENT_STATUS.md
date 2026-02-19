# Deployment Status & Fixes

## Current Issues

### 1. Backend 502 Bad Gateway ❌
**URL:** https://fraud-detection-backend-pvxj.onrender.com
**Status:** Service is down or not responding
**Cause:** Backend service needs to be redeployed with correct environment variables

### 2. CORS Errors ✅ (Fixed in code, needs redeploy)
**Status:** Code is correct, but backend needs to be redeployed
**Fix:** CORS configuration in `backend/src/server.js` already allows Vercel origins

## Required Actions

### Step 1: Backend Service on Render

1. **Go to Render Dashboard** → Your backend service
2. **Set Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   PYTHON_SERVICE_URL=https://your-python-service-url.onrender.com
   ```
   
3. **Verify Build Settings:**
   - Build Command: `npm install`
   - Start Command: `npm start`
   
4. **Manual Deploy:**
   - Click "Manual Deploy" → "Clear build cache & deploy"

### Step 2: Python Service on Render

1. **Go to Render Dashboard** → Your Python service
2. **Set Environment Variables:**
   ```
   PYTHON_VERSION=3.11.9
   PORT=10000
   ```
   
3. **Verify Build Settings:**
   - Build Command: `pip install --upgrade pip && pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   
4. **Manual Deploy:**
   - Click "Manual Deploy" → "Clear build cache & deploy"

### Step 3: Update Backend Environment Variable

After Python service is deployed:
1. Copy the Python service URL (e.g., `https://fraud-detection-model-xyz.onrender.com`)
2. Go back to Backend service
3. Update `PYTHON_SERVICE_URL` environment variable with the Python service URL
4. Redeploy backend

### Step 4: Verify Deployment

Test each service:

```bash
# Test Python service
curl https://your-python-service.onrender.com/health

# Test Backend service
curl https://fraud-detection-backend-pvxj.onrender.com/api/health

# Test CORS
curl -H "Origin: https://fintrace-eight.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://fraud-detection-backend-pvxj.onrender.com/api/analyze
```

## Alternative: Deploy Backend to Railway

If Render continues to have issues, you can deploy the backend to Railway:

1. **Create Railway Account:** https://railway.app
2. **New Project** → "Deploy from GitHub repo"
3. **Select Repository:** chinmayjoshi03/Rift
4. **Select Service:** backend
5. **Set Environment Variables:**
   ```
   NODE_ENV=production
   PYTHON_SERVICE_URL=https://your-python-service.onrender.com
   ```
6. **Deploy**

Railway will automatically:
- Detect Node.js project
- Install dependencies
- Start the server
- Provide a public URL

## Quick Fix: Use Railway for Backend

Railway is more reliable for Node.js services. Here's the fastest path:

1. Keep Python service on Render (it's working)
2. Move backend to Railway (better Node.js support)
3. Update frontend env variable to point to Railway backend URL

## Environment Variables Summary

### Frontend (Vercel)
```env
VITE_API_BASE_URL=https://your-backend-url.railway.app
# or
VITE_API_BASE_URL=https://fraud-detection-backend-pvxj.onrender.com
```

### Backend (Render/Railway)
```env
NODE_ENV=production
PORT=10000
PYTHON_SERVICE_URL=https://your-python-service.onrender.com
```

### Python Service (Render)
```env
PYTHON_VERSION=3.11.9
PORT=10000
```

## Troubleshooting

### Backend shows "Application failed to respond"
- Check logs in Render dashboard
- Verify PORT environment variable is set
- Ensure start command is `npm start`
- Check if service is sleeping (free tier sleeps after 15 min inactivity)

### Python service build fails
- Ensure Python version is 3.11.9 (not 3.14)
- Clear build cache and redeploy
- Check requirements.txt has compatible versions

### CORS errors persist
- Verify backend is actually running (not 502)
- Check backend logs for CORS-related errors
- Ensure frontend URL is in CORS origins list
- Clear browser cache

## Support Links

- [Render Docs](https://render.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)

## Status Checklist

- [ ] Python service deployed and responding to /health
- [ ] Backend service deployed and responding to /api/health
- [ ] Backend PYTHON_SERVICE_URL points to Python service
- [ ] Frontend VITE_API_BASE_URL points to backend
- [ ] No CORS errors in browser console
- [ ] File upload works
- [ ] Analysis completes successfully

# Render Deployment Fix Guide

## Issues Fixed

1. ✅ CORS policy blocking Vercel frontend
2. ✅ Python 3.14 compatibility issues
3. ✅ Pydantic-core Rust compilation errors

## Steps to Fix on Render

### 1. Set Python Version to 3.11

In your Render dashboard for the Python service:

1. Go to **Settings** → **Environment**
2. Add environment variable:
   ```
   PYTHON_VERSION=3.11.9
   ```

### 2. Update Build Command

In **Settings** → **Build & Deploy**:

**Build Command:**
```bash
pip install --upgrade pip && pip install -r requirements.txt
```

**Start Command:**
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### 3. Force Redeploy

1. Go to **Manual Deploy**
2. Click **Clear build cache & deploy**
3. Wait for deployment to complete

## Backend CORS Configuration

The backend now allows these origins:
- `http://localhost:5173` (local dev)
- `https://fintrace-eight.vercel.app` (your Vercel deployment)
- `https://fintrace.vercel.app` (custom domain)
- Any `*.vercel.app` subdomain

## Environment Variables Needed

### Python Service (Render)
```
PYTHON_VERSION=3.11.9
PYTHON_ENV=production
PORT=8000
```

### Backend Service (Render)
```
NODE_ENV=production
PORT=3001
PYTHON_SERVICE_URL=https://your-python-service.onrender.com
```

### Frontend (Vercel)
```
VITE_API_BASE_URL=https://fraud-detection-backend-pvxj.onrender.com
```

## Testing After Deployment

1. **Test Python Service:**
   ```bash
   curl https://your-python-service.onrender.com/health
   ```

2. **Test Backend:**
   ```bash
   curl https://fraud-detection-backend-pvxj.onrender.com/api/health
   ```

3. **Test CORS:**
   ```bash
   curl -H "Origin: https://fintrace-eight.vercel.app" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        https://fraud-detection-backend-pvxj.onrender.com/api/analyze
   ```

## Common Issues

### Issue: "502 Bad Gateway"
**Solution:** Python service is not running. Check logs and redeploy.

### Issue: "CORS policy" error
**Solution:** 
1. Verify backend CORS settings include your Vercel URL
2. Redeploy backend after changes
3. Clear browser cache

### Issue: "Build failed" with Rust errors
**Solution:**
1. Ensure Python 3.11 is set (not 3.14)
2. Use pinned pydantic versions (2.5.3 with pydantic-core 2.14.6)
3. Clear build cache and redeploy

## Files Updated

- ✅ `python-model/.python-version` - Forces Python 3.11.9
- ✅ `python-model/runtime.txt` - Render Python version
- ✅ `python-model/requirements.txt` - Compatible package versions
- ✅ `backend/src/server.js` - CORS configuration

## Quick Fix Commands

```bash
# Commit and push changes
git add .
git commit -m "Fix: CORS and Python version for deployment"
git push origin main

# Render will auto-deploy if connected to GitHub
# Or manually trigger deploy in Render dashboard
```

## Verification Checklist

- [ ] Python service deploys successfully
- [ ] Backend service deploys successfully
- [ ] Frontend can reach backend (no CORS errors)
- [ ] File upload works
- [ ] Analysis completes successfully
- [ ] Results display correctly

## Support

If issues persist:
1. Check Render logs for specific errors
2. Verify all environment variables are set
3. Ensure services are on free tier or paid plan (not suspended)
4. Check Render status page for outages

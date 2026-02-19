# 🚨 Quick Fix for Current Deployment Issues

## Problem Summary

1. ❌ Backend returning 502 Bad Gateway
2. ❌ CORS errors in browser console
3. ❌ Frontend cannot connect to backend

## Root Cause

The backend service on Render is either:
- Not running (service stopped/crashed)
- Sleeping (free tier sleeps after 15 min inactivity)
- Missing environment variables
- Build failed

## Immediate Fix Steps

### Option 1: Wake Up Render Service (If Sleeping)

```bash
# Test if backend is sleeping
curl https://fraud-detection-backend-pvxj.onrender.com/api/health

# If you get 502, the service is sleeping or down
# Go to Render dashboard and manually trigger a deploy
```

### Option 2: Redeploy Backend on Render

1. **Login to Render**: https://dashboard.render.com
2. **Find your backend service**: `fraud-detection-backend`
3. **Check Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   PYTHON_SERVICE_URL=https://your-python-service.onrender.com
   ```
4. **Manual Deploy**:
   - Click "Manual Deploy"
   - Select "Clear build cache & deploy"
   - Wait 2-3 minutes

### Option 3: Deploy Backend to Railway (Recommended)

Railway is more reliable for Node.js services:

1. **Go to Railway**: https://railway.app
2. **New Project** → "Deploy from GitHub repo"
3. **Select**: `chinmayjoshi03/Rift`
4. **Root Directory**: `/backend`
5. **Environment Variables**:
   ```
   NODE_ENV=production
   PYTHON_SERVICE_URL=https://your-python-service.onrender.com
   ```
6. **Deploy** (automatic)
7. **Copy the Railway URL** (e.g., `https://backend-production-xyz.up.railway.app`)

### Option 4: Update Frontend to Use Railway Backend

If you deployed backend to Railway:

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**: `fintrace-eight`
3. **Settings** → **Environment Variables**
4. **Update**:
   ```
   VITE_API_BASE_URL=https://your-backend.railway.app
   ```
5. **Redeploy** frontend

## Testing After Fix

```bash
# Run the test script
./test-deployment.sh

# Or manually test:
curl https://fraud-detection-backend-pvxj.onrender.com/api/health
# Should return: {"status":"healthy","service":"fraud-detection-backend"}

# Test CORS
curl -H "Origin: https://fintrace-eight.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://fraud-detection-backend-pvxj.onrender.com/api/analyze
# Should return 200 or 204
```

## Why Railway is Better for Backend

| Feature | Render Free | Railway Free |
|---------|-------------|--------------|
| Sleep after inactivity | ✅ Yes (15 min) | ❌ No |
| Cold start time | 30-60 seconds | 5-10 seconds |
| Build reliability | Medium | High |
| Node.js support | Good | Excellent |
| Free hours/month | 750 | 500 |

## Quick Railway Deployment

```bash
# 1. Install Railway CLI (optional)
npm install -g @railway/cli

# 2. Login
railway login

# 3. Deploy backend
cd backend
railway init
railway up

# 4. Set environment variables
railway variables set NODE_ENV=production
railway variables set PYTHON_SERVICE_URL=https://your-python-service.onrender.com

# 5. Get URL
railway domain
```

## Environment Variables Checklist

### ✅ Frontend (Vercel)
```env
VITE_API_BASE_URL=https://your-backend-url.com
```

### ✅ Backend (Render/Railway)
```env
NODE_ENV=production
PORT=10000
PYTHON_SERVICE_URL=https://your-python-service.onrender.com
```

### ✅ Python Service (Render)
```env
PYTHON_VERSION=3.11.9
PORT=10000
```

## Common Issues & Solutions

### Issue: "502 Bad Gateway"
**Solution**: Service is down. Redeploy or switch to Railway.

### Issue: "CORS policy" error
**Solution**: 
1. Ensure backend is running (not 502)
2. Backend CORS config already includes Vercel URL
3. Clear browser cache
4. Try incognito mode

### Issue: "Failed to fetch"
**Solution**: 
1. Check if backend URL is correct in frontend env
2. Verify backend is accessible: `curl https://your-backend/api/health`
3. Check browser console for exact error

### Issue: Backend keeps sleeping
**Solution**: 
1. Upgrade to Render paid plan ($7/month)
2. OR switch to Railway (better free tier)
3. OR add a cron job to ping backend every 10 minutes

## Ping Service to Prevent Sleep

Add this to your frontend to keep backend awake:

```javascript
// In frontend/src/App.jsx
useEffect(() => {
  // Ping backend every 10 minutes to prevent sleep
  const interval = setInterval(async () => {
    try {
      await fetch(`${API_BASE_URL}/api/health`);
    } catch (error) {
      console.log('Health check failed:', error);
    }
  }, 10 * 60 * 1000); // 10 minutes

  return () => clearInterval(interval);
}, []);
```

## Need Help?

1. Check logs in Render/Railway dashboard
2. Run `./test-deployment.sh` to diagnose issues
3. Review `DEPLOYMENT_STATUS.md` for detailed steps
4. Check `RENDER_FIX.md` for Python service issues

## Success Checklist

- [ ] Backend responds to `/api/health` with 200
- [ ] Python service responds to `/health` with 200
- [ ] Frontend loads without errors
- [ ] No CORS errors in browser console
- [ ] Can upload CSV file
- [ ] Analysis completes successfully
- [ ] Results display correctly

## Fastest Path to Working Deployment

1. ✅ Keep Python service on Render (it's working)
2. ✅ Deploy backend to Railway (more reliable)
3. ✅ Update frontend env variable to Railway URL
4. ✅ Redeploy frontend on Vercel
5. ✅ Test with `./test-deployment.sh`

**Estimated time**: 10-15 minutes

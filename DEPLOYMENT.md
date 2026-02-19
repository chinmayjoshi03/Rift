# Deployment Guide

## Overview

This system consists of two independent services:
1. **Python Model Service** (FastAPI) → Deploy to Render
2. **Node.js Backend** (Express) → Deploy to Railway

## Python Model Service - Render Deployment

### Step 1: Prepare Repository

Ensure these files exist in `python-model/`:
- `main.py` - FastAPI entry point
- `requirements.txt` - Python dependencies
- `render.yaml` - Render configuration (optional)

### Step 2: Create Render Web Service

1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `fraud-detection-model`
   - **Root Directory**: `python-model`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`
   - **Instance Type**: Free or Starter

### Step 3: Environment Variables

Add in Render dashboard:
```
PORT=8000
```

### Step 4: Deploy

- Click "Create Web Service"
- Wait for build and deployment (3-5 minutes)
- Note the service URL: `https://your-service.onrender.com`

### Step 5: Verify

```bash
curl https://your-service.onrender.com/health
```

Expected: `{"status":"healthy","service":"fraud-detection-model"}`

## Node.js Backend - Railway Deployment

### Step 1: Prepare Repository

Ensure these files exist in `backend/`:
- `src/server.js` - Express entry point
- `package.json` - Node.js dependencies
- `railway.json` - Railway configuration (optional)

### Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects Node.js

### Step 3: Configure Service

1. Click on the service
2. Go to "Settings"
3. Set **Root Directory**: `backend`
4. **Start Command**: `npm start` (auto-detected)

### Step 4: Environment Variables

Add in Railway dashboard:
```
PORT=3001
PYTHON_SERVICE_URL=https://your-model.onrender.com
```

Replace `your-model.onrender.com` with your actual Render URL from Step 1.

### Step 5: Deploy

- Railway automatically deploys on push
- Wait for deployment (2-3 minutes)
- Note the service URL: `https://your-app.railway.app`

### Step 6: Verify

```bash
curl https://your-app.railway.app/api/health
```

Expected: 
```json
{
  "status": "healthy",
  "service": "fraud-detection-backend",
  "pythonService": {
    "status": "healthy",
    "service": "fraud-detection-model"
  }
}
```

## Frontend Integration (Future)

When deploying the React frontend to Vercel:

### Environment Variable
```
VITE_API_URL=https://your-app.railway.app
```

## Architecture After Deployment

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   Vercel    │     │    Railway      │     │     Render       │
│             │     │                 │     │                  │
│  React App  │────▶│  Node.js API   │────▶│  Python FastAPI  │
│  (static)   │     │  Express.js     │     │  Detection Model │
│             │     │  Port 3001      │     │  Port 8000       │
└─────────────┘     └─────────────────┘     └──────────────────┘
```

## Testing Deployed Services

### Test Python Service

```bash
curl -X POST https://your-model.onrender.com/detect \
  -F "file=@sample_transactions.csv" \
  -s | python -m json.tool
```

### Test Node.js Backend

```bash
# Upload
curl -X POST https://your-app.railway.app/api/analyze \
  -F "file=@sample_transactions.csv"

# Get results (use jobId from above)
curl https://your-app.railway.app/api/results/YOUR_JOB_ID
```

## Monitoring

### Render
- Dashboard: https://dashboard.render.com
- Logs: Click service → "Logs" tab
- Metrics: CPU, Memory, Request count

### Railway
- Dashboard: https://railway.app/dashboard
- Logs: Click service → "Deployments" → View logs
- Metrics: CPU, Memory, Network

## Scaling Considerations

### Python Service (Render)
- **Free Tier**: Spins down after 15 min inactivity
- **Starter ($7/mo)**: Always on, 512MB RAM
- **Standard ($25/mo)**: 2GB RAM, better performance

Recommended: Starter for production

### Node.js Backend (Railway)
- **Free Tier**: $5 credit/month, then pay-as-you-go
- **Pro ($20/mo)**: More resources, priority support

Recommended: Free tier initially, upgrade based on usage

## Performance Optimization

### Python Service
1. Use Gunicorn for production:
   ```bash
   # Update start command in Render
   gunicorn main:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```

2. Add to requirements.txt:
   ```
   gunicorn==21.2.0
   ```

### Node.js Backend
1. Enable compression:
   ```javascript
   // In server.js
   import compression from 'compression';
   app.use(compression());
   ```

2. Add to package.json:
   ```json
   "compression": "^1.7.4"
   ```

## Security Best Practices

### Environment Variables
- Never commit `.env` files
- Use platform-specific secret management
- Rotate credentials regularly

### CORS Configuration
Update in production:

**Python (main.py)**:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend.vercel.app"],
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)
```

**Node.js (server.js)**:
```javascript
app.use(cors({
  origin: 'https://your-frontend.vercel.app',
  credentials: true
}));
```

### File Upload Limits
Already configured:
- Node.js: 50MB max
- Adjust based on expected CSV sizes

## Troubleshooting

### Render Issues

**Service won't start**
- Check logs in Render dashboard
- Verify Python version compatibility
- Ensure all dependencies in requirements.txt

**Slow cold starts**
- Upgrade from Free to Starter tier
- Implement health check pings

### Railway Issues

**Build fails**
- Check Node.js version in package.json
- Verify all dependencies installed
- Check build logs

**Can't connect to Python service**
- Verify PYTHON_SERVICE_URL is correct
- Check Python service is running
- Test Python health endpoint

### Common Errors

**"Module not found"**
- Missing dependency in requirements.txt or package.json
- Redeploy after adding

**"Port already in use"**
- Don't hardcode ports, use `process.env.PORT`
- Both services configured correctly

**"Connection timeout"**
- Increase timeout in pythonClient.js
- Check Python service logs
- Verify network connectivity

## Rollback Strategy

### Render
1. Go to service → "Deploys"
2. Find previous successful deploy
3. Click "Redeploy"

### Railway
1. Go to service → "Deployments"
2. Find previous deployment
3. Click "Redeploy"

## Cost Estimation

### Monthly Costs (Production)

**Render (Python)**
- Starter: $7/mo
- Includes: 512MB RAM, always on

**Railway (Node.js)**
- Free tier: $5 credit
- Overage: ~$0.000463/GB-hour
- Estimated: $5-15/mo depending on traffic

**Total**: ~$12-22/mo for backend infrastructure

### Free Tier Limits

**Render Free**
- Spins down after 15 min
- 750 hours/mo
- Good for: Development, demos

**Railway Free**
- $5 credit/mo
- Good for: Low traffic, testing

## CI/CD Setup

### Automatic Deployments

Both Render and Railway support automatic deployments:

1. **Push to main branch** → Auto-deploy
2. **Pull request** → Preview deployment (Railway Pro)
3. **Manual trigger** → Dashboard deploy button

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Trigger Render Deploy
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
      
      - name: Trigger Railway Deploy
        run: |
          curl -X POST ${{ secrets.RAILWAY_DEPLOY_HOOK }}
```

## Health Checks

Both platforms support health checks:

**Render**: Automatically pings `/health` every 5 minutes

**Railway**: Configure in dashboard:
- Path: `/api/health`
- Interval: 60 seconds
- Timeout: 10 seconds

## Backup Strategy

### Database (Future)
If adding persistent storage:
- Use managed PostgreSQL (Render or Railway)
- Enable automatic backups
- Export data regularly

### File Storage
For uploaded CSVs:
- Use S3 or similar object storage
- Clean up old files automatically
- Implement retention policy

## Support

### Render
- Docs: https://render.com/docs
- Community: https://community.render.com
- Support: support@render.com

### Railway
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- Support: team@railway.app

# Manual Render Deployment Instructions

Since automatic deployment isn't working, please follow these steps to manually deploy the backend:

## Step 1: Create New Render Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `ParthZanwar01/Space-Apps`

## Step 2: Configure Service

**Basic Settings:**
- **Name**: `space-apps-backend`
- **Environment**: `Python 3`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `backend`

**Build & Deploy:**
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python app.py`

**Environment Variables:**
- `FLASK_ENV` = `production`
- `PORT` = `10000`

## Step 3: Deploy

1. Click "Create Web Service"
2. Wait for build to complete (5-10 minutes)
3. Copy the service URL (e.g., `https://space-apps-backend.onrender.com`)

## Step 4: Update Frontend

Once deployed, the frontend will automatically use the new backend URL.

## Alternative: Fix Existing Service

If you prefer to fix the existing service:

1. Go to existing service in Render dashboard
2. Check "Settings" → "Build & Deploy"
3. Ensure "Auto-Deploy" is enabled
4. Check "Manual Deploy" → "Deploy latest commit"
5. Verify service name matches `space-apps-backend`

## Troubleshooting

- **Build fails**: Check logs for dependency issues
- **Service won't start**: Check start command and port configuration
- **502 errors**: Usually means service crashed, check logs
- **Environment variables**: Ensure all required vars are set

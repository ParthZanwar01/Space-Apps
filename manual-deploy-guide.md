# Manual Render Deployment Guide

## Current Issue
- Backend is running but serving old code
- Still returning localhost URLs instead of HTTPS URLs
- Auto-deploy is not working

## Solution: Manual Deploy

### Step 1: Access Render Dashboard
1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Log in to your account
3. Find your backend service (likely named `space-debris-backend` or `space-apps-backend`)

### Step 2: Manual Deploy
1. Click on your backend service
2. Look for "Manual Deploy" dropdown (usually in the top right)
3. Select "Deploy latest commit"
4. Wait for deployment to complete (5-10 minutes)

### Step 3: Alternative - Clear Cache Deploy
If regular deploy doesn't work:
1. Select "Clear build cache & deploy" from the Manual Deploy dropdown
2. This forces a complete rebuild

### Step 4: Verify Deployment
After deployment, test:
```bash
curl -s https://space-apps-backend.onrender.com/api/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-05T18:32:36.752906",
  "version": "1.0.0",
  "deployment_test": "2025-10-05-181200"
}
```

### Step 5: Test Image URLs
```bash
curl -s -X POST https://space-apps-backend.onrender.com/api/analyze -F "image=@public/logo192.png" | jq '.image_url'
```

Should return:
```
"https://space-apps-backend.onrender.com/uploads/..."
```

NOT:
```
"http://localhost:5001/uploads/..."
```

## If Manual Deploy Fails

### Create New Service
1. Go to Render Dashboard
2. Click "New +" → "Web Service"
3. Connect GitHub repo: `ParthZanwar01/Space-Apps`
4. Configure:
   - **Name**: `space-apps-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app.py`
   - **Root Directory**: `backend`
5. Add Environment Variables:
   - `FLASK_ENV` = `production`
   - `PORT` = `10000`

## Expected Result
Once deployed correctly:
- ✅ Backend returns HTTPS URLs
- ✅ Image overlays work in production
- ✅ Path visualization shows dots on images
- ✅ No more mixed content errors

# Deploy Backend to Render (Free)

## Quick Steps:

### 1. Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `Space-Apps-Backend`
3. Make it **PUBLIC**
4. **Don't** initialize with README
5. Click "Create repository"

### 2. Push Backend Code
Run these commands in terminal:

```bash
cd backend
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/Space-Apps-Backend.git
git push -u origin main
```

### 3. Deploy on Render
1. Go to https://render.com
2. Sign up/login with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Select "Space-Apps-Backend"
6. Settings:
   - **Name:** `space-debris-backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python app.py`
   - **Instance Type:** `Free`
7. Click "Create Web Service"

### 4. Get Your Backend URL
Copy the URL from Render (e.g., `https://space-debris-backend.onrender.com`)

### 5. Update Frontend
Update `public/src/services/api.js`:

```javascript
const API_BASE_URL = 'https://your-render-url.onrender.com';
```

### 6. Deploy Frontend
```bash
cd public
vercel --prod --yes
```

## Why Render?
- ✅ **Free tier:** 750 hours/month
- ✅ **Supports OpenCV:** Full computer vision capabilities
- ✅ **Auto-deploy:** From GitHub
- ✅ **Easy setup:** 5 minutes
- ✅ **Reliable:** Production-ready

## Features After Deployment:
- Real image analysis with OpenCV
- Advanced debris detection
- Material classification
- 3D path planning
- Interactive dashboard
# Manual Setup Instructions

## Step 1: Create GitHub Repository

**You need to create the GitHub repository first:**

1. Go to https://github.com/new
2. Repository name: `Space-Apps-Backend`
3. Make it **PUBLIC**
4. **Don't** initialize with README
5. Click "Create repository"

## Step 2: After Creating Repository

Once you've created the repository, tell me and I'll push the code automatically.

## Step 3: Deploy on Render

After the code is pushed to GitHub:

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

## Step 4: Get Backend URL

Copy the URL from Render (e.g., `https://space-debris-backend.onrender.com`)

## Step 5: Update Frontend

I'll update the frontend to use your backend URL.

## Step 6: Deploy Frontend

Deploy the updated frontend to Vercel.

---

**Current Status:**
- ✅ Backend code ready with OpenCV
- ⏳ Waiting for GitHub repository creation
- ⏳ Ready to push code
- ⏳ Ready to deploy to Render

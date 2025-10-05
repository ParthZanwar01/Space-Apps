#!/bin/bash

echo "🚀 Setting up Render deployment for Space Debris Backend"
echo "=================================================="

echo "📋 Step 1: Create GitHub Repository"
echo "1. Go to https://github.com/new"
echo "2. Repository name: Space-Apps-Backend"
echo "3. Make it PUBLIC"
echo "4. Don't initialize with README"
echo "5. Click 'Create repository'"
echo ""
read -p "Press Enter when you've created the GitHub repository..."

echo ""
echo "📤 Step 2: Push Backend Code to GitHub"
echo "Run these commands:"
echo "cd backend"
echo "git remote add origin https://github.com/YOUR_USERNAME/Space-Apps-Backend.git"
echo "git push -u origin main"
echo ""
read -p "Press Enter when you've pushed the code..."

echo ""
echo "🌐 Step 3: Deploy on Render"
echo "1. Go to https://render.com"
echo "2. Sign up/login with GitHub"
echo "3. Click 'New +' → 'Web Service'"
echo "4. Connect your GitHub repository"
echo "5. Select 'Space-Apps-Backend'"
echo "6. Settings:"
echo "   - Name: space-debris-backend"
echo "   - Environment: Python 3"
echo "   - Build Command: pip install -r requirements.txt"
echo "   - Start Command: python app.py"
echo "   - Instance Type: Free"
echo "7. Click 'Create Web Service'"
echo ""
read -p "Press Enter when deployment is complete..."

echo ""
echo "🔗 Step 4: Get Your Backend URL"
echo "Copy the URL from Render (e.g., https://space-debris-backend.onrender.com)"
read -p "Enter your backend URL: " BACKEND_URL

echo ""
echo "⚙️ Step 5: Update Frontend"
echo "Updating frontend to use your backend URL..."

# Update the API base URL
sed -i.bak "s|const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://space-debris-backend.onrender.com';|const API_BASE_URL = process.env.REACT_APP_API_URL || '$BACKEND_URL';|" public/src/services/api.js

echo "✅ Frontend updated!"
echo ""
echo "🚀 Step 6: Deploy Frontend"
echo "Run: vercel --prod --yes"
echo ""
echo "🎉 Your Space Debris Analyzer will be live with real OpenCV analysis!"

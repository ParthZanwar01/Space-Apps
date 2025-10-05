#!/bin/bash

# Space Debris Analyzer Deployment Script

echo "🚀 Deploying Space Debris Analyzer..."

# Build React frontend
echo "📦 Building React frontend..."
cd public
npm run build
cd ..

# Create deployment package
echo "📋 Creating deployment package..."
mkdir -p deploy
cp -r backend deploy/
cp -r public/build deploy/frontend
cp requirements.txt deploy/
cp Procfile deploy/
cp runtime.txt deploy/
cp Dockerfile deploy/

echo "✅ Deployment package created in 'deploy/' directory"
echo ""
echo "🌐 Deployment Options:"
echo "1. Vercel: vercel --prod"
echo "2. Heroku: cd deploy && git init && git add . && git commit -m 'Deploy' && git push heroku main"
echo "3. Railway: railway deploy"
echo "4. Docker: docker build -t space-debris-analyzer . && docker run -p 8000:8000 space-debris-analyzer"
echo ""
echo "📝 Make sure to:"
echo "- Set environment variables (FLASK_ENV=production)"
echo "- Configure CORS for your domain"
echo "- Set up file upload limits"
echo "- Configure static file serving"

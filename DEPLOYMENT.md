# 🚀 Space Debris Analyzer - Deployment Guide

## Quick Deploy Options

### 1. **Vercel (Recommended - Free)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 2. **Heroku (Free Tier Available)**
```bash
# Install Heroku CLI
# Create Heroku app
heroku create your-app-name

# Deploy
git init
git add .
git commit -m "Deploy Space Debris Analyzer"
git push heroku main
```

### 3. **Railway (Free Tier Available)**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up
```

### 4. **Docker + Any Cloud Provider**
```bash
# Build and run locally
docker build -t space-debris-analyzer .
docker run -p 8000:8000 space-debris-analyzer

# Push to Docker Hub
docker tag space-debris-analyzer yourusername/space-debris-analyzer
docker push yourusername/space-debris-analyzer
```

## Environment Variables

Set these in your deployment platform:

```env
FLASK_ENV=production
FLASK_APP=backend/app.py
PORT=8000
```

## File Structure for Deployment

```
/
├── backend/           # Flask API
├── public/           # React frontend
├── requirements.txt  # Python dependencies
├── Procfile         # Heroku/Railway config
├── Dockerfile       # Docker config
├── vercel.json      # Vercel config
└── deploy.sh        # Deployment script
```

## Pre-deployment Checklist

- [ ] Build React frontend: `cd public && npm run build`
- [ ] Test locally: `python backend/app.py`
- [ ] Set environment variables
- [ ] Configure CORS for your domain
- [ ] Set file upload limits
- [ ] Test image upload functionality

## Platform-Specific Notes

### Vercel
- Automatic deployments from GitHub
- Serverless functions for API
- Free tier: 100GB bandwidth

### Heroku
- Easy Git-based deployments
- Free tier: 550-1000 dyno hours
- Add-ons for databases

### Railway
- Modern deployment platform
- Free tier: $5 credit monthly
- Automatic deployments

### Docker
- Works on any cloud provider
- Consistent environment
- Easy scaling

## Troubleshooting

### Common Issues:
1. **CORS errors**: Update CORS settings in `backend/app.py`
2. **File upload limits**: Configure in your platform
3. **Python dependencies**: Ensure all packages in `requirements.txt`
4. **Static files**: Configure proper serving in production

### Support:
- Check platform documentation
- Review deployment logs
- Test locally first
- Use deployment script: `./deploy.sh`

## Cost Comparison

| Platform | Free Tier | Paid Plans |
|----------|-----------|------------|
| Vercel | ✅ 100GB | $20/month |
| Heroku | ✅ 550-1000h | $7/month |
| Railway | ✅ $5 credit | $5/month |
| Docker | ❌ | Varies |

Choose based on your needs and budget!

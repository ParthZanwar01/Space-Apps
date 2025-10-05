#!/bin/bash

# Deploy Backend to Render
echo "🚀 Deploying backend to Render..."

# Check if we have the latest code
echo "📋 Checking latest commits..."
git log --oneline -3

# Force a new commit to trigger deployment
echo "📝 Creating deployment trigger..."
echo "# Deployment trigger $(date)" >> backend/deployment_trigger.txt

# Commit and push
git add backend/deployment_trigger.txt
git commit -m "Trigger Render deployment - $(date)"
git push origin main

echo "✅ Code pushed to GitHub"
echo "⏳ Waiting for Render to deploy (this may take 5-10 minutes)..."

# Wait and check deployment
sleep 60
echo "🔍 Checking deployment status..."

# Check if new code is deployed
for i in {1..10}; do
    echo "Attempt $i/10: Checking deployment..."
    
    # Test the health endpoint
    response=$(curl -s https://space-apps-backend.onrender.com/api/health 2>/dev/null)
    
    if echo "$response" | grep -q "deployment_test.*181200"; then
        echo "✅ New code deployed successfully!"
        break
    elif echo "$response" | grep -q "deployment_test.*174500"; then
        echo "⏳ Old code still running, waiting..."
        sleep 30
    else
        echo "❌ Could not determine deployment status"
        sleep 30
    fi
done

echo "🎯 Testing image URL generation..."
# Test image analysis
result=$(curl -s -X POST https://space-apps-backend.onrender.com/api/analyze -F "image=@public/logo192.png" 2>/dev/null)
image_url=$(echo "$result" | jq -r '.image_url' 2>/dev/null)

if [[ "$image_url" == *"space-apps-backend.onrender.com"* ]]; then
    echo "✅ HTTPS URLs working correctly!"
    echo "🔗 Sample URL: $image_url"
else
    echo "❌ Still returning localhost URLs: $image_url"
    echo "💡 Manual deployment may be required"
fi

echo "🏁 Deployment check complete"

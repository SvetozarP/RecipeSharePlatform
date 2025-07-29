#!/bin/bash

echo "🚀 Building Recipe Sharing Platform for PRODUCTION..."
echo "======================================================"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm ci

# Build for production
echo "🔨 Building for production environment..."
npm run build:prod

# Verify production build
echo "✅ Production build complete!"
echo "📁 Output directory: dist/frontend/"
echo "🌐 Environment: PRODUCTION"
echo "🔗 API URL: https://recipe-api-dev98298.azurewebsites.net/api/v1"

if [ -d "dist/frontend" ]; then
    echo "✅ Build successful! Ready for deployment."
else
    echo "❌ Build failed! Check the errors above."
    exit 1
fi 
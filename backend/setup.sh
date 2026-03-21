#!/bin/bash

# Supabase Setup - Quick Commands
# Run these after setting up Supabase

echo "🚀 Road-Aware Backend - Supabase Setup Script"
echo "=============================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created!"
    echo ""
    echo "⚠️  IMPORTANT: Edit backend/.env and add your Supabase credentials:"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    echo "Get these from: Supabase Dashboard → Settings → API"
    echo ""
    read -p "Press Enter after you've updated .env..."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start the server
echo ""
echo "🎉 Starting the server..."
echo ""
npm run dev

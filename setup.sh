#!/bin/bash
# Quick Start Script for FedEx Clone

set -e

echo "================================"
echo "FedEx Clone - Quick Start Setup"
echo "================================"
echo ""

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js is installed ($(node --version))"

# Check Python installation (for alternative server)
if command -v python3 &> /dev/null; then
    echo "✅ Python3 is available"
    HAS_PYTHON=true
else
    HAS_PYTHON=false
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo "Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update .env with your Firebase credentials"
    echo "   Edit .env and add your Firebase configuration"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "================================"
echo "Setup Complete!"
echo "================================"
echo ""
echo "To start the application, run one of these commands:"
echo ""
echo "Option 1 (Node.js HTTP Server):"
echo "  npm start"
echo ""

if [ "$HAS_PYTHON" = true ]; then
    echo "Option 2 (Python HTTP Server):"
    echo "  python3 -m http.server 8000"
    echo ""
fi

echo "Then open your browser and navigate to:"
echo "  http://localhost:8000"
echo ""
echo "📚 Documentation:"
echo "  - Setup Guide: docs/SETUP.md"
echo "  - API Reference: docs/API.md"
echo "  - Project Summary: docs/PROJECT_SUMMARY.md"
echo ""
echo "🔧 Configuration:"
echo "  1. Create Firebase project at https://console.firebase.google.com"
echo "  2. Enable Authentication (Email & Google)"
echo "  3. Create Firestore database"
echo "  4. Update config/firebase.js with your credentials"
echo ""
echo "✨ Ready to go!"

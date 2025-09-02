#!/bin/bash

# Servers Control Panel Installation Script
# Run this on your Ubuntu server

set -e

echo "🚀 Installing Servers Control Panel..."

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root. Use: sudo $0"
   exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install Node.js if not present
if ! command_exists node; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install build dependencies
echo "📦 Installing build dependencies..."
apt-get update
apt-get install -y build-essential python3

# Create application directory
APP_DIR="/home/con-manage"
if [ ! -d "$APP_DIR" ]; then
    echo "📁 Creating application directory..."
    mkdir -p "$APP_DIR"
    chown www-data:www-data "$APP_DIR"
fi

# Install backend dependencies
echo "🔧 Installing backend dependencies..."
cd "$APP_DIR/backend"
if [ ! -f "package.json" ]; then
    echo "❌ Backend package.json not found. Please ensure the backend directory is properly set up."
    exit 1
fi
npm install --production

# Build frontend
echo "🔧 Building frontend..."
cd "$APP_DIR/frontend"
if [ ! -f "package.json" ]; then
    echo "❌ Frontend package.json not found. Please ensure the frontend directory is properly set up."
    exit 1
fi
npm install
npm run build

# Install frontend server dependencies
npm install express --save

# Create data directory for SQLite
mkdir -p "$APP_DIR/backend/data"
chown -R www-data:www-data "$APP_DIR/backend/data"

# Copy systemd service files
echo "⚙️ Installing systemd services..."
cp "$APP_DIR/systemd/servers-control-panel.service" /etc/systemd/system/
cp "$APP_DIR/systemd/servers-frontend.service" /etc/systemd/system/

# Reload systemd
systemctl daemon-reload

echo "✅ Installation completed!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your environment variables"
echo "2. Set up SSL certificates"
echo "3. Configure Nginx"
echo "4. Start the services"
echo ""
echo "Run: sudo ./configure.sh"
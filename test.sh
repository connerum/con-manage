#!/bin/bash

# Servers Control Panel Test Script

echo "🧪 Testing Servers Control Panel installation..."

# Check if services are running
echo "📊 Checking service status..."
if systemctl is-active --quiet servers-control-panel; then
    echo "✅ Backend service is running"
else
    echo "❌ Backend service is not running"
fi

if systemctl is-active --quiet servers-frontend; then
    echo "✅ Frontend service is running"
else
    echo "❌ Frontend service is not running"
fi

# Check if nginx configuration is valid
echo "🌐 Checking Nginx configuration..."
if nginx -t 2>/dev/null; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors"
fi

# Check if ports are listening
echo "🔌 Checking ports..."
if netstat -tln | grep -q ":3001 "; then
    echo "✅ Backend API port (3001) is listening"
else
    echo "❌ Backend API port (3001) is not listening"
fi

if netstat -tln | grep -q ":3000 "; then
    echo "✅ Frontend port (3000) is listening"
else
    echo "❌ Frontend port (3000) is not listening"
fi

# Test API endpoint
echo "🔗 Testing API endpoint..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/servers | grep -q "200"; then
    echo "✅ API endpoint is responding"
else
    echo "❌ API endpoint is not responding"
fi

# Check SSL certificate
echo "🔒 Checking SSL certificate..."
if certbot certificates | grep -q "servers.conbackend.com"; then
    echo "✅ SSL certificate is installed"
else
    echo "❌ SSL certificate is not installed"
fi

echo "🎉 Test completed!"
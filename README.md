# Servers Control Panel

A production-ready web dashboard for monitoring multiple Ubuntu servers with automatic SSL.

## Features

- **Real-time Monitoring**: Live server status with heartbeat monitoring
- **Systemd Services**: View service status, descriptions, and recent logs
- **Storage Monitoring**: Filesystem usage and disk information
- **Nginx Monitoring**: Service status, configured domains, and access/error logs
- **Push-based Updates**: Agents push data to main server (no inbound ports needed on managed servers)
- **On-demand Refresh**: Request fresh data from any server
- **Secure**: API key authentication and HTTPS
- **Systemd Integration**: Runs as system services on Ubuntu

## Architecture

- **Main Server**: Hosts the dashboard, receives data from agents
- **Agents**: Run on managed servers, collect data and push to main server
- **Database**: SQLite for storing server data
- **Frontend**: React dashboard served by Node.js/Express
- **Backend**: Node.js/Express API with WebSocket support
- **Web Server**: Nginx reverse proxy with SSL termination

## Quick Start

### Prerequisites

- Ubuntu 22.04+ server
- Root or sudo access
- Existing Nginx installation
- Existing Certbot installation
- Node.js will be installed automatically

### 1. Clone and Setup

```bash
cd /home
git clone <repository-url> con-manage
cd con-manage
```

### 2. Install Dependencies

```bash
sudo ./install.sh
```

This will:
- Install Node.js 18.x
- Install backend and frontend dependencies
- Build the React frontend
- Install systemd service files

### 3. Configure Services

```bash
sudo ./configure.sh
```

This will:
- Generate a secure API key
- Set up environment variables
- Configure SSL certificates with Certbot
- Set up Nginx configuration
- Start the services

### 4. Access Dashboard

- **Dashboard**: `https://servers.conbackend.com`
- **Direct API**: `http://localhost:3001/api` (for testing)

## Service Management

Use the management script to control services:

```bash
# Check status
sudo ./manage.sh status

# Start services
sudo ./manage.sh start

# Stop services
sudo ./manage.sh stop

# Restart services
sudo ./manage.sh restart

# View logs
sudo ./manage.sh logs servers-control-panel
sudo ./manage.sh logs servers-frontend
```

## Manual Service Control

You can also use systemctl directly:

```bash
# Backend service
sudo systemctl status servers-control-panel
sudo systemctl restart servers-control-panel

# Frontend service
sudo systemctl status servers-frontend
sudo systemctl restart servers-frontend
```

## Agent Installation

On each server you want to monitor:

### 1. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Copy Agent Files

```bash
# Copy agent directory to the server
scp -r /home/con-manage/agent user@server:/home/agent
```

### 3. Configure Agent

On the managed server:

```bash
cd /home/agent

# Create environment file
cat > .env << EOF
SERVER_URL=https://servers.conbackend.com
API_KEY=your-api-key-here
SERVER_NAME=your-server-name
EOF
```

### 4. Install Dependencies and Start

```bash
npm install

# Run manually for testing
npm start

# Or install as a service (optional)
sudo cp /home/con-manage/systemd/servers-agent.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable servers-agent
sudo systemctl start servers-agent
```

The agent will:
- Collect data every 5 minutes
- Push data to the main server
- Run continuously in the background

## API Endpoints

### Backend API (Port 3001)

- `GET /api/servers` - List all servers
- `GET /api/servers/:name` - Get specific server details
- `POST /api/servers/:name/data` - Agent data submission (requires API key)

### WebSocket (Port 3002)

- Real-time updates and refresh requests

## Directory Structure

```
/home/con-manage/
├── backend/           # Node.js/Express API server
├── frontend/          # React dashboard
├── agent/            # Data collection agent
├── systemd/          # Systemd service files
├── nginx/            # Nginx configuration
├── install.sh        # Installation script
├── configure.sh      # Configuration script
├── manage.sh         # Service management script
└── README.md         # This file
```

## Security

- **API Key Authentication**: All agent submissions require a valid API key
- **HTTPS Only**: All communication is encrypted
- **Rate Limiting**: Built-in rate limiting on API endpoints
- **Security Headers**: Helmet.js provides security headers
- **CORS**: Configured for secure cross-origin requests

## Troubleshooting

### Common Issues

1. **Services not starting**
   ```bash
   # Check service status
   sudo ./manage.sh status

   # View detailed logs
   sudo ./manage.sh logs servers-control-panel
   sudo journalctl -u servers-control-panel -f
   ```

2. **SSL Certificate Issues**
   ```bash
   # Check certificate status
   sudo certbot certificates

   # Renew certificates
   sudo certbot renew
   ```

3. **Nginx Configuration Issues**
   ```bash
   # Test nginx configuration
   sudo nginx -t

   # Reload nginx
   sudo systemctl reload nginx
   ```

4. **Permission Issues**
   ```bash
   # Ensure correct ownership
   sudo chown -R www-data:www-data /home/con-manage
   ```

5. **Port Conflicts**
   ```bash
   # Check what's using ports
   sudo netstat -tlnp | grep :300
   sudo lsof -i :3000
   ```

### Logs

```bash
# Backend logs
sudo journalctl -u servers-control-panel -f

# Frontend logs
sudo journalctl -u servers-frontend -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## SSL Certificate Renewal

SSL certificates from Let's Encrypt expire every 90 days. Set up automatic renewal:

```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab for automatic renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet --post-hook "systemctl reload nginx"
```

## Backup

Important files to backup:

```bash
# Database
cp /home/con-manage/backend/data/servers.db /path/to/backup/

# Configuration files
cp /home/con-manage/backend/.env /path/to/backup/
cp /etc/nginx/sites-available/servers-control-panel.conf /path/to/backup/

# SSL certificates (optional, can be reissued)
cp -r /etc/letsencrypt/ /path/to/backup/
```

This will:
- Install Certbot
- Obtain SSL certificate for `servers.conbackend.com`
- Copy certificates to the nginx/ssl directory

### 4. Deploy with Docker

```bash
# Set environment variable
export API_KEY=your-secure-api-key-here

# Start all services
docker-compose up -d
```

### 5. Access Dashboard

Open https://servers.conbackend.com in your browser.

## Agent Installation

On each server you want to monitor:

### 1. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Copy Agent Files

```bash
# Copy agent directory to the server
scp -r ./agent user@server:/path/to/agent
```

### 3. Configure Agent

On the managed server:

```bash
cd /path/to/agent

# Create environment file
echo "SERVER_URL=https://servers.conbackend.com" > .env
echo "API_KEY=your-secure-api-key-here" >> .env
echo "SERVER_NAME=your-server-name" >> .env
```

### 4. Install Dependencies and Start

```bash
npm install
npm start
```

The agent will:
- Collect data every 5 minutes
- Push data to the main server
- Run continuously in the background

## API Endpoints

### Backend API (Port 3001)

- `GET /api/servers` - List all servers
- `GET /api/servers/:name` - Get specific server details
- `POST /api/servers/:name/data` - Agent data submission (requires API key)

### WebSocket (Port 3002)

- Real-time updates and refresh requests

## Security

- **API Key Authentication**: All agent submissions require a valid API key
- **HTTPS Only**: All communication is encrypted
- **Rate Limiting**: Built-in rate limiting on API endpoints
- **Helmet Security**: Security headers and protections
- **CORS**: Configured for secure cross-origin requests

## Data Collected

### Systemd Services
- Service name and description
- Current status (active/failed/inactive)
- Last 200 log lines per service

### Storage
- Filesystem information (df command)
- Disk details (lsblk command)
- Usage percentages and mount points

### Nginx
- Service running status
- Configured domains from enabled sites
- Last 200 lines of error and access logs

### Heartbeat
- Server online status
- Last seen timestamp

## Development

### Local Development

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm start

# Agent (on test server)
cd agent
npm install
npm run dev
```

### Building for Production

```bash
# Build frontend
cd frontend
npm run build

# Build backend
cd backend
npm run build
```

## SSL Certificate Renewal

SSL certificates from Let's Encrypt expire every 90 days. Set up automatic renewal:

```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab for automatic renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## Troubleshooting

### Common Issues

1. **SSL Certificate Issues**
   - Ensure domain DNS points to 5.78.126.101
   - Check certificate validity: `sudo certbot certificates`

2. **Agent Connection Issues**
   - Verify API_KEY matches between agent and server
   - Check SERVER_URL in agent .env file
   - Ensure outbound HTTPS is allowed from managed servers

3. **Docker Issues**
   - Check container logs: `docker-compose logs`
   - Verify environment variables are set
   - Ensure ports 80, 443, 3001, 3002 are available

### Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs nginx
```

## License

MIT License
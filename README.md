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
- **Docker Deployment**: Easy containerized deployment

## Architecture

- **Main Server**: Hosts the dashboard, receives data from agents
- **Agents**: Run on managed servers, collect data and push to main server
- **Database**: SQLite for storing server data
- **Frontend**: React dashboard with real-time updates
- **Backend**: Node.js/Express API with WebSocket support

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd con-manage
```

### 2. Environment Setup

Create a `.env` file in the backend directory:

```bash
cd backend
echo "API_KEY=your-secure-api-key-here" > .env
echo "NODE_ENV=production" >> .env
```

### 3. SSL Certificate Setup

On your Ubuntu server (5.78.126.101):

```bash
# Make setup script executable and run it
chmod +x setup-ssl.sh
sudo ./setup-ssl.sh
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
const { execSync } = require('child_process');
const https = require('https');

const SERVER_URL = process.env.SERVER_URL || 'https://servers.conbackend.com';
const API_KEY = process.env.API_KEY;
const SERVER_NAME = process.env.SERVER_NAME || require('os').hostname();

function collectSystemdServices() {
  try {
    const output = execSync('systemctl list-units --type=service --all --no-pager --output=json', { encoding: 'utf8' });
    const services = JSON.parse(output);

    return services.map(service => ({
      name: service.unit,
      status: service.active,
      description: service.description
    }));
  } catch (error) {
    console.error('Error collecting systemd services:', error);
    return [];
  }
}

function collectServiceLogs(serviceName) {
  try {
    const output = execSync(`journalctl -u ${serviceName} -n 200 --no-pager`, { encoding: 'utf8' });
    return output.split('\n').filter(line => line.trim());
  } catch (error) {
    console.error(`Error collecting logs for ${serviceName}:`, error);
    return [];
  }
}

function collectStorageInfo() {
  try {
    // df command for filesystem usage
    const dfOutput = execSync('df -h --output=source,fstype,size,used,avail,pcent,target', { encoding: 'utf8' });
    const filesystems = dfOutput.split('\n').slice(1).filter(line => line.trim()).map(line => {
      const parts = line.split(/\s+/);
      return {
        filesystem: parts[0],
        type: parts[1],
        size: parts[2],
        used: parts[3],
        available: parts[4],
        usePercent: parts[5],
        mountPoint: parts[6]
      };
    });

    // lsblk command for disk info
    const lsblkOutput = execSync('lsblk -J', { encoding: 'utf8' });
    const disks = JSON.parse(lsblkOutput);

    return {
      filesystems,
      disks: disks.blockdevices
    };
  } catch (error) {
    console.error('Error collecting storage info:', error);
    return { filesystems: [], disks: [] };
  }
}

function collectNginxInfo() {
  try {
    // Check if nginx is running
    const statusOutput = execSync('systemctl is-active nginx', { encoding: 'utf8' }).trim();
    const isRunning = statusOutput === 'active';

    let domains = [];
    let errorLogs = [];
    let accessLogs = [];

    if (isRunning) {
      // Parse enabled site configs
      try {
        const sitesOutput = execSync('ls /etc/nginx/sites-enabled/', { encoding: 'utf8' });
        const siteFiles = sitesOutput.split('\n').filter(file => file.trim());

        for (const siteFile of siteFiles) {
          try {
            const configContent = execSync(`cat /etc/nginx/sites-enabled/${siteFile}`, { encoding: 'utf8' });
            const serverNameMatch = configContent.match(/server_name\s+([^;]+)/);
            if (serverNameMatch) {
              domains.push(...serverNameMatch[1].split(/\s+/).filter(domain => domain && domain !== '_'));
            }
          } catch (error) {
            console.error(`Error parsing site config ${siteFile}:`, error);
          }
        }
      } catch (error) {
        console.error('Error listing nginx sites:', error);
      }

      // Get nginx logs
      try {
        errorLogs = execSync('tail -n 200 /var/log/nginx/error.log 2>/dev/null || echo ""', { encoding: 'utf8' })
          .split('\n').filter(line => line.trim());
      } catch (error) {
        console.error('Error collecting nginx error logs:', error);
      }

      try {
        accessLogs = execSync('tail -n 200 /var/log/nginx/access.log 2>/dev/null || echo ""', { encoding: 'utf8' })
          .split('\n').filter(line => line.trim());
      } catch (error) {
        console.error('Error collecting nginx access logs:', error);
      }
    }

    return {
      isRunning,
      domains: [...new Set(domains)], // Remove duplicates
      errorLogs,
      accessLogs
    };
  } catch (error) {
    console.error('Error collecting nginx info:', error);
    return {
      isRunning: false,
      domains: [],
      errorLogs: [],
      accessLogs: []
    };
  }
}

function sendDataToServer(data) {
  const postData = JSON.stringify(data);

  const options = {
    hostname: SERVER_URL.replace('https://', ''),
    port: 443,
    path: `/api/servers/${SERVER_NAME}/data`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'x-api-key': API_KEY
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Data sent to server. Status: ${res.statusCode}`);
  });

  req.on('error', (error) => {
    console.error('Error sending data to server:', error);
  });

  req.write(postData);
  req.end();
}

function collectAndSendData() {
  console.log('Collecting server data...');

  const services = collectSystemdServices();
  const servicesWithLogs = services.map(service => ({
    ...service,
    logs: collectServiceLogs(service.name)
  }));

  const storage = collectStorageInfo();
  const nginx = collectNginxInfo();

  const data = {
    timestamp: new Date().toISOString(),
    services: servicesWithLogs,
    storage,
    nginx,
    heartbeat: true
  };

  sendDataToServer(data);
}

// Run collection immediately, then every 5 minutes
collectAndSendData();
setInterval(collectAndSendData, 5 * 60 * 1000);
const express = require('express');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database setup
const db = new sqlite3.Database('./servers.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    initDatabase();
  }
});

function initDatabase() {
  db.run(`CREATE TABLE IF NOT EXISTS servers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    ip TEXT,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    data TEXT
  )`);
}

// API Routes
app.post('/api/servers/:serverName/data', (req, res) => {
  const { serverName } = req.params;
  const serverData = req.body;

  // Validate API key (simplified - in production use proper auth)
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const data = JSON.stringify(serverData);
  const stmt = db.prepare('INSERT OR REPLACE INTO servers (name, ip, last_seen, data) VALUES (?, ?, datetime("now"), ?)');

  stmt.run(serverName, req.ip, data, (err) => {
    if (err) {
      console.error('Error inserting server data:', err);
      return res.status(500).json({ error: 'Failed to save server data' });
    }
    res.json({ success: true });
  });
  stmt.finalize();
});

app.get('/api/servers', (req, res) => {
  db.all('SELECT * FROM servers', [], (err, rows) => {
    if (err) {
      console.error('Error fetching servers:', err);
      return res.status(500).json({ error: 'Failed to fetch servers' });
    }
    res.json(rows.map(row => ({
      ...row,
      data: JSON.parse(row.data || '{}')
    })));
  });
});

app.get('/api/servers/:serverName', (req, res) => {
  const { serverName } = req.params;
  db.get('SELECT * FROM servers WHERE name = ?', [serverName], (err, row) => {
    if (err) {
      console.error('Error fetching server:', err);
      return res.status(500).json({ error: 'Failed to fetch server' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Server not found' });
    }
    res.json({
      ...row,
      data: JSON.parse(row.data || '{}')
    });
  });
});

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ port: 3002 });

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'refresh_request') {
        // Handle refresh request - in production, this would trigger agent refresh
        console.log('Refresh requested for server:', data.serverName);
        // Broadcast refresh to all clients
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'refresh_started',
              serverName: data.serverName
            }));
          }
        });
      }
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server running on port 3002`);
});
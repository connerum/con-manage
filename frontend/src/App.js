import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/servers`);
      setServers(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch servers');
      console.error('Error fetching servers:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'failed': return 'red';
      case 'inactive': return 'gray';
      default: return 'yellow';
    }
  };

  if (loading) {
    return <div className="loading">Loading servers...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Servers Control Panel</h1>
        <button onClick={fetchServers} className="refresh-btn">Refresh All</button>
      </header>

      <div className="main-content">
        <div className="server-list">
          <h2>Servers ({servers.length})</h2>
          {servers.map(server => (
            <div
              key={server.id}
              className={`server-item ${selectedServer?.id === server.id ? 'selected' : ''}`}
              onClick={() => setSelectedServer(server)}
            >
              <div className="server-name">{server.name}</div>
              <div className="server-status">
                <span className={`status-dot ${server.data?.heartbeat ? 'online' : 'offline'}`}></span>
                {server.data?.heartbeat ? 'Online' : 'Offline'}
              </div>
              <div className="last-seen">Last seen: {new Date(server.last_seen).toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div className="server-details">
          {selectedServer ? (
            <div className="details-content">
              <h2>{selectedServer.name}</h2>

              {/* Systemd Services */}
              <div className="section">
                <h3>Systemd Services</h3>
                <div className="services-grid">
                  {selectedServer.data?.services?.map((service, index) => (
                    <div key={index} className="service-card">
                      <div className="service-header">
                        <span className="service-name">{service.name}</span>
                        <span className={`service-status status-${getStatusColor(service.status)}`}>
                          {service.status}
                        </span>
                      </div>
                      <div className="service-description">{service.description}</div>
                      <div className="service-logs">
                        <h4>Last 200 Log Lines:</h4>
                        <pre className="logs-content">
                          {service.logs?.slice(-10).join('\n') || 'No logs available'}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Storage */}
              <div className="section">
                <h3>Storage</h3>
                <div className="storage-info">
                  <h4>Filesystems</h4>
                  <table className="storage-table">
                    <thead>
                      <tr>
                        <th>Filesystem</th>
                        <th>Type</th>
                        <th>Size</th>
                        <th>Used</th>
                        <th>Available</th>
                        <th>Use%</th>
                        <th>Mount Point</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedServer.data?.storage?.filesystems?.map((fs, index) => (
                        <tr key={index}>
                          <td>{fs.filesystem}</td>
                          <td>{fs.type}</td>
                          <td>{fs.size}</td>
                          <td>{fs.used}</td>
                          <td>{fs.available}</td>
                          <td>{fs.usePercent}</td>
                          <td>{fs.mountPoint}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Nginx */}
              <div className="section">
                <h3>Nginx</h3>
                <div className="nginx-info">
                  <div className="nginx-status">
                    <span>Status: </span>
                    <span className={`status-${selectedServer.data?.nginx?.isRunning ? 'green' : 'red'}`}>
                      {selectedServer.data?.nginx?.isRunning ? 'Running' : 'Not Running'}
                    </span>
                  </div>
                  <div className="nginx-domains">
                    <h4>Configured Domains:</h4>
                    <ul>
                      {selectedServer.data?.nginx?.domains?.map((domain, index) => (
                        <li key={index}>{domain}</li>
                      )) || <li>No domains configured</li>}
                    </ul>
                  </div>
                  <div className="nginx-logs">
                    <h4>Error Logs (Last 200 lines):</h4>
                    <pre className="logs-content">
                      {selectedServer.data?.nginx?.errorLogs?.slice(-10).join('\n') || 'No error logs'}
                    </pre>
                    <h4>Access Logs (Last 200 lines):</h4>
                    <pre className="logs-content">
                      {selectedServer.data?.nginx?.accessLogs?.slice(-10).join('\n') || 'No access logs'}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-selection">Select a server to view details</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

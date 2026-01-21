import { useState, useEffect } from 'react';

interface DebugStatus {
  isRunning: boolean;
  lastCheck: string | null;
  checkInterval: number;
  nextCheck: string | null;
  alerts: {
    total: number;
    active: number;
  };
  lastResults: {
    timestamp: string;
    website: {
      enabled: boolean;
      url?: string;
      success: boolean;
      conditionMet: boolean;
      message?: string;
      error?: string;
    };
    api: {
      enabled: boolean;
      success: boolean;
      conditionMet: boolean;
      slotsFound: number;
      message?: string;
      error?: string;
    };
  } | null;
}

export default function DebugConsole() {
  const [status, setStatus] = useState<DebugStatus | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/debug/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setError(null);
      } else {
        setError('Failed to fetch debug status');
      }
    } catch (err) {
      setError('Error fetching debug status');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  const getStatusColor = (isRunning: boolean) => {
    return isRunning ? '#22c55e' : '#ef4444';
  };

  const getStatusText = (isRunning: boolean) => {
    return isRunning ? 'RUNNING' : 'STOPPED';
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '0',
      left: '0',
      right: '0',
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
      borderTop: '1px solid #333',
      zIndex: 1000,
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      {/* Console Header */}
      <div
        style={{
          padding: '8px 16px',
          backgroundColor: '#2a2a2a',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontWeight: 'bold' }}>DEBUG CONSOLE</span>
          {status && (
            <span style={{
              color: getStatusColor(status.isRunning),
              fontWeight: 'bold'
            }}>
              ● {getStatusText(status.isRunning)}
            </span>
          )}
          {status?.alerts && (
            <span style={{ color: '#a3a3a3' }}>
              Alerts: {status.alerts.active}/{status.alerts.total} active
            </span>
          )}
          {error && (
            <span style={{ color: '#ef4444' }}>ERROR: {error}</span>
          )}
        </div>
        <span style={{ color: '#a3a3a3' }}>
          {isOpen ? '▼' : '▲'} Click to {isOpen ? 'hide' : 'show'}
        </span>
      </div>

      {/* Console Body */}
      {isOpen && (
        <div style={{
          padding: '16px',
          maxHeight: '300px',
          overflowY: 'auto',
          backgroundColor: '#1a1a1a'
        }}>
          {status ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* System Status */}
              <div>
                <h4 style={{ margin: '0 0 12px 0', color: '#60a5fa', borderBottom: '1px solid #374151', paddingBottom: '4px' }}>
                  System Status
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div>
                    <span style={{ color: '#a3a3a3' }}>Status:</span>{' '}
                    <span style={{ color: getStatusColor(status.isRunning), fontWeight: 'bold' }}>
                      {getStatusText(status.isRunning)}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#a3a3a3' }}>Check Interval:</span>{' '}
                    <span style={{ color: '#ffffff' }}>{(status.checkInterval / 1000).toFixed(0)}s</span>
                  </div>
                  <div>
                    <span style={{ color: '#a3a3a3' }}>Last Check:</span>{' '}
                    <span style={{ color: '#ffffff' }}>{formatTime(status.lastCheck)}</span>
                  </div>
                  <div>
                    <span style={{ color: '#a3a3a3' }}>Next Check:</span>{' '}
                    <span style={{ color: '#ffffff' }}>{formatTime(status.nextCheck)}</span>
                  </div>
                  <div>
                    <span style={{ color: '#a3a3a3' }}>Active Alerts:</span>{' '}
                    <span style={{ color: '#ffffff' }}>{status.alerts.active} / {status.alerts.total}</span>
                  </div>
                </div>
              </div>

              {/* Last Check Results */}
              <div>
                <h4 style={{ margin: '0 0 12px 0', color: '#60a5fa', borderBottom: '1px solid #374151', paddingBottom: '4px' }}>
                  Last Check Results
                </h4>
                {status.lastResults ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <span style={{ color: '#a3a3a3' }}>Timestamp:</span>{' '}
                      <span style={{ color: '#ffffff' }}>{formatTime(status.lastResults.timestamp)}</span>
                    </div>

                    {/* Website Check */}
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ color: '#fbbf24', fontWeight: 'bold', marginBottom: '4px' }}>Website Check:</div>
                      {status.lastResults.website.enabled ? (
                        <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div>
                            <span style={{ color: '#a3a3a3' }}>URL:</span>{' '}
                            <span style={{ color: '#ffffff' }}>{status.lastResults.website.url || 'N/A'}</span>
                          </div>
                          <div>
                            <span style={{ color: '#a3a3a3' }}>Success:</span>{' '}
                            <span style={{ color: status.lastResults.website.success ? '#22c55e' : '#ef4444' }}>
                              {status.lastResults.website.success ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: '#a3a3a3' }}>Condition Met:</span>{' '}
                            <span style={{ color: status.lastResults.website.conditionMet ? '#22c55e' : '#6b7280' }}>
                              {status.lastResults.website.conditionMet ? 'Yes' : 'No'}
                            </span>
                          </div>
                          {status.lastResults.website.error && (
                            <div>
                              <span style={{ color: '#a3a3a3' }}>Error:</span>{' '}
                              <span style={{ color: '#ef4444' }}>{status.lastResults.website.error}</span>
                            </div>
                          )}
                          {status.lastResults.website.message && (
                            <div>
                              <span style={{ color: '#a3a3a3' }}>Message:</span>{' '}
                              <span style={{ color: '#ffffff' }}>{status.lastResults.website.message}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ paddingLeft: '12px', color: '#6b7280' }}>Disabled</div>
                      )}
                    </div>

                    {/* API Check */}
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ color: '#fbbf24', fontWeight: 'bold', marginBottom: '4px' }}>Court API Check:</div>
                      {status.lastResults.api.enabled ? (
                        <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div>
                            <span style={{ color: '#a3a3a3' }}>Success:</span>{' '}
                            <span style={{ color: status.lastResults.api.success ? '#22c55e' : '#ef4444' }}>
                              {status.lastResults.api.success ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: '#a3a3a3' }}>Condition Met:</span>{' '}
                            <span style={{ color: status.lastResults.api.conditionMet ? '#22c55e' : '#6b7280' }}>
                              {status.lastResults.api.conditionMet ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: '#a3a3a3' }}>Slots Found:</span>{' '}
                            <span style={{ color: '#ffffff' }}>{status.lastResults.api.slotsFound}</span>
                          </div>
                          {status.lastResults.api.error && (
                            <div>
                              <span style={{ color: '#a3a3a3' }}>Error:</span>{' '}
                              <span style={{ color: '#ef4444' }}>{status.lastResults.api.error}</span>
                            </div>
                          )}
                          {status.lastResults.api.message && (
                            <div>
                              <span style={{ color: '#a3a3a3' }}>Message:</span>{' '}
                              <span style={{ color: '#ffffff' }}>{status.lastResults.api.message}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ paddingLeft: '12px', color: '#6b7280' }}>Disabled</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#6b7280' }}>No check results available</div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ color: '#6b7280' }}>Loading debug status...</div>
          )}
        </div>
      )}
    </div>
  );
}
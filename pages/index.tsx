import { useState, useEffect } from 'react';
import { Alert } from '@/lib/types';
import { formatTime, courts } from '@/lib/utils';
import AlertForm from '@/components/AlertForm';
import DebugConsole from '@/components/DebugConsole';

export default function Home() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const handleCreateAlert = () => {
    setEditingAlert(null);
    setShowForm(true);
  };

  const handleEditAlert = (alert: Alert) => {
    setEditingAlert(alert);
    setShowForm(true);
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;

    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await loadAlerts();
      }
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  const handleToggleAlert = async (alertId: string, active: boolean) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active }),
      });
      if (response.ok) {
        await loadAlerts();
      }
    } catch (error) {
      console.error('Failed to toggle alert:', error);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAlert(null);
    loadAlerts();
  };

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Squash Court Alerts</h1>
          <button className="btn" onClick={handleCreateAlert}>
            + Create Alert
          </button>
        </div>

        {alerts.length === 0 ? (
          <p>No alerts configured. Create your first alert to start monitoring court availability!</p>
        ) : (
          <div className="grid">
            {alerts.map((alert) => (
              <div key={alert.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3>{alert.name}</h3>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                      type="checkbox"
                      checked={alert.active}
                      onChange={(e) => handleToggleAlert(alert.id, e.target.checked)}
                    />
                    Active
                  </label>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <strong>Date:</strong> {alert.date}
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <strong>Time:</strong> {formatTime(alert.startTime)} - {formatTime(alert.endTime)}
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <strong>Courts:</strong> {alert.courts.map(courtId =>
                    courts.find(c => c.value === courtId)?.label || `Court ${courtId}`
                  ).join(', ')}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn"
                    onClick={() => handleEditAlert(alert)}
                    style={{ fontSize: '12px', padding: '5px 10px' }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeleteAlert(alert.id)}
                    style={{ fontSize: '12px', padding: '5px 10px' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <AlertForm
          alert={editingAlert}
          onClose={handleFormClose}
        />
      )}

      <DebugConsole />
    </div>
  );
}
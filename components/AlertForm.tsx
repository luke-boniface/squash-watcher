import { useState, useEffect } from 'react';
import { Alert } from '@/lib/types';
import { timeSlots, courts, generateId, parseTime } from '@/lib/utils';

interface AlertFormProps {
  alert?: Alert | null;
  onClose: () => void;
}

export default function AlertForm({ alert, onClose }: AlertFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    startTime: '',
    endTime: '',
    courts: [] as number[],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (alert) {
      setFormData({
        name: alert.name,
        date: alert.date,
        startTime: alert.startTime,
        endTime: alert.endTime,
        courts: alert.courts,
      });
    } else {
      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      setFormData({
        name: '',
        date: dateStr,
        startTime: '1830',
        endTime: '2045',
        courts: [1, 2, 3, 4],
      });
    }
  }, [alert]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Alert name is required');
      setLoading(false);
      return;
    }

    if (!formData.date) {
      setError('Date is required');
      setLoading(false);
      return;
    }

    if (formData.courts.length === 0) {
      setError('At least one court must be selected');
      setLoading(false);
      return;
    }

    if (formData.startTime >= formData.endTime) {
      setError('End time must be after start time');
      setLoading(false);
      return;
    }

    try {
      const alertData: Partial<Alert> = {
        ...formData,
        active: true,
        created: new Date().toISOString(),
      };

      if (!alert) {
        alertData.id = generateId();
      }

      const url = alert ? `/api/alerts/${alert.id}` : '/api/alerts';
      const method = alert ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      });

      if (response.ok) {
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save alert');
      }
    } catch (err) {
      setError('Failed to save alert');
    } finally {
      setLoading(false);
    }
  };

  const handleCourtToggle = (courtId: number) => {
    setFormData(prev => ({
      ...prev,
      courts: prev.courts.includes(courtId)
        ? prev.courts.filter(id => id !== courtId)
        : [...prev.courts, courtId].sort()
    }));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '30px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2>{alert ? 'Edit Alert' : 'Create Alert'}</h2>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Alert Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Evening Courts"
              required
            />
          </div>

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label>Start Time</label>
            <select
              value={formData.startTime}
              onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              required
            >
              {timeSlots.map(slot => (
                <option key={slot.value} value={slot.value}>
                  {slot.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>End Time</label>
            <select
              value={formData.endTime}
              onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
              required
            >
              {timeSlots.map(slot => (
                <option key={slot.value} value={slot.value}>
                  {slot.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Courts to Monitor</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '5px' }}>
              {courts.map(court => (
                <label key={court.value} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input
                    type="checkbox"
                    checked={formData.courts.includes(court.value)}
                    onChange={() => handleCourtToggle(court.value)}
                  />
                  {court.label}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{ background: '#6c757d' }}
              className="btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn"
            >
              {loading ? 'Saving...' : (alert ? 'Update Alert' : 'Create Alert')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
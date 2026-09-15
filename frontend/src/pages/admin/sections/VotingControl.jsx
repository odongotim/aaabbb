import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { api, ApiError } from '../../../api/api.js';
import ErrorMessage from '../../../components/ErrorMessage.jsx';

const TIMEZONES = ['Africa/Kampala', 'Africa/Nairobi', 'UTC'];

export default function VotingControl() {
  const { idToken } = useAuth();
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({ startDatetime: '', endDatetime: '', timezone: 'Africa/Kampala' });
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getPublicSettings().then((s) => {
      setSettings(s);
      setForm({
        startDatetime: s.startDatetime ? toLocalInput(s.startDatetime) : '',
        endDatetime: s.endDatetime ? toLocalInput(s.endDatetime) : '',
        timezone: s.timezone || 'Africa/Kampala'
      });
    });
  }, []);

  function toLocalInput(iso) {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!form.startDatetime || !form.endDatetime) {
      setError('Please provide both a start and end date and time.');
      return;
    }
    if (new Date(form.endDatetime) <= new Date(form.startDatetime)) {
      setError('The end date and time must be after the start date and time.');
      return;
    }
    setSaving(true);
    try {
      const updated = await api.adminUpdateVotingControl(idToken, {
        startDatetime: new Date(form.startDatetime).toISOString(),
        endDatetime: new Date(form.endDatetime).toISOString(),
        timezone: form.timezone
      });
      setSettings(updated);
      setMessage('Voting schedule updated.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update voting schedule.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1>Voting Control</h1>
      <p className="page-intro">
        Voting opens and closes automatically at the configured times — no manual start or stop is required.
      </p>

      {settings && (
        <p>
          Current status: <strong>{settings.votingStatus.replace('_', ' ')}</strong>
          {settings.currentVotingDay > 0 && ` · Day ${settings.currentVotingDay}`}
        </p>
      )}

      {error && <ErrorMessage title="Invalid configuration">{error}</ErrorMessage>}
      {message && <ErrorMessage title="Saved" tone="info">{message}</ErrorMessage>}

      <form className="card admin-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="start">Start date &amp; time</label>
          <input
            id="start"
            type="datetime-local"
            value={form.startDatetime}
            onChange={(e) => setForm({ ...form, startDatetime: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="end">End date &amp; time</label>
          <input
            id="end"
            type="datetime-local"
            value={form.endDatetime}
            onChange={(e) => setForm({ ...form, endDatetime: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="tz">Timezone</label>
          <select id="tz" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>
        <button className="btn btn--primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save Voting Schedule'}
        </button>
      </form>
    </div>
  );
}

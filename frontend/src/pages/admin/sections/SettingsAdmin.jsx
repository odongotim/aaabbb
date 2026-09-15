import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { api, ApiError } from '../../../api/api.js';
import ErrorMessage from '../../../components/ErrorMessage.jsx';

export default function SettingsAdmin() {
  const { idToken } = useAuth();
  const [form, setForm] = useState({ pageant_name: '', edition: '', theme: '' });
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getPublicSettings().then((s) => setForm({ pageant_name: s.pageantName, edition: s.edition, theme: s.theme || '' }));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api.adminUpdateSettings(idToken, form);
      setMessage('Settings saved.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1>Settings</h1>
      <p className="page-intro">Pageant identity shown on the public platform.</p>

      {error && <ErrorMessage title="Error">{error}</ErrorMessage>}
      {message && <ErrorMessage title="Saved" tone="info">{message}</ErrorMessage>}

      <form className="card admin-form" onSubmit={handleSubmit}>
        <div className="field">
          <label>Pageant name</label>
          <input type="text" value={form.pageant_name} onChange={(e) => setForm({ ...form, pageant_name: e.target.value })} />
        </div>
        <div className="field">
          <label>Edition</label>
          <input type="text" value={form.edition} onChange={(e) => setForm({ ...form, edition: e.target.value })} />
        </div>
        <div className="field">
          <label>Theme</label>
          <input type="text" value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} placeholder="Optional pageant theme" />
        </div>
        <button className="btn btn--primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</button>
      </form>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { api, ApiError } from '../../../api/api.js';
import ErrorMessage from '../../../components/ErrorMessage.jsx';

const EMPTY_FORM = { contestantId: null, contestantNumber: '', name: '', category: 'Female', biography: '', photoUrl: '' };

export default function ContestantsAdmin() {
  const { idToken } = useAuth();
  const [contestants, setContestants] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  function load() {
    api.adminListContestants(idToken).then(setContestants).catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load.'));
  }

  useEffect(load, [idToken]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.adminSaveContestant(idToken, form);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save contestant.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDisable(id) {
    try {
      await api.adminDisableContestant(idToken, id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to disable contestant.');
    }
  }

  return (
    <div>
      <h1>Contestants</h1>
      <p className="page-intro">Add new contestants or update existing ones. Disabling a contestant never deletes their historical votes.</p>

      {error && <ErrorMessage title="Error">{error}</ErrorMessage>}

      <form className="card admin-form" onSubmit={handleSubmit}>
        <p className="admin-form__title">{form.contestantId ? 'Edit contestant' : 'Add new contestant'}</p>
        <div className="admin-form__row">
          <div className="field">
            <label>Contestant number</label>
            <input type="number" value={form.contestantNumber} onChange={(e) => setForm({ ...form, contestantNumber: e.target.value })} required />
          </div>
          <div className="field">
            <label>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Name</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="field">
          <label>Photo URL</label>
          <input type="url" value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} placeholder="https://…" />
        </div>
        <div className="field">
          <label>Short biography</label>
          <textarea rows="3" value={form.biography} onChange={(e) => setForm({ ...form, biography: e.target.value })} />
        </div>
        <div className="admin-form__actions">
          <button className="btn btn--primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : form.contestantId ? 'Update Contestant' : 'Add Contestant'}
          </button>
          {form.contestantId && (
            <button type="button" className="btn btn--secondary" onClick={() => setForm(EMPTY_FORM)}>Cancel</button>
          )}
        </div>
      </form>

      <table className="results-table admin-table">
        <thead>
          <tr>
            <th scope="col">No.</th>
            <th scope="col">Name</th>
            <th scope="col">Category</th>
            <th scope="col">Status</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(contestants || []).map((c) => (
            <tr key={c.contestantId}>
              <td>{c.contestantNumber}</td>
              <td>{c.name}</td>
              <td>{c.category}</td>
              <td>{c.status}</td>
              <td>
                <button className="link-button" onClick={() => setForm({ ...c })}>Edit</button>
                {' · '}
                <button className="link-button" onClick={() => handleDisable(c.contestantId)} disabled={c.status === 'disabled'}>
                  Disable
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

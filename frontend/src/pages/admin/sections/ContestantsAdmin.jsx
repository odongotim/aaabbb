import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { api, ApiError } from '../../../api/api.js';
import ErrorMessage from '../../../components/ErrorMessage.jsx';

const EMPTY_FORM = {
  contestantId: null,
  contestantNumber: '',
  name: '',
  category: 'Female',
  age: '',
  faculty: '',
  tribe: '',
  clan: '',
  district: '',
  roleModel: '',
  hobbies: '',
  project: '',
  photoUrl: ''
};

// Turns a contestant record from the API into form state — any field
// that's null (not yet set) becomes '' so React inputs stay controlled.
function toFormState(c) {
  return {
    contestantId: c.contestantId,
    contestantNumber: c.contestantNumber ?? '',
    name: c.name ?? '',
    category: c.category ?? 'Female',
    age: c.age ?? '',
    faculty: c.faculty ?? '',
    tribe: c.tribe ?? '',
    clan: c.clan ?? '',
    district: c.district ?? '',
    roleModel: c.roleModel ?? '',
    hobbies: c.hobbies ?? '',
    project: c.project ?? '',
    photoUrl: c.photoUrl ?? ''
  };
}

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

  function field(key) {
    return { value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) };
  }

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
            <input type="number" {...field('contestantNumber')} required />
          </div>
          <div className="field">
            <label>Category</label>
            <select {...field('category')}>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>
          </div>
          <div className="field">
            <label>Age</label>
            <input type="number" min="16" max="60" {...field('age')} />
          </div>
        </div>

        <div className="field">
          <label>Name</label>
          <input type="text" {...field('name')} required />
        </div>

        <div className="admin-form__row">
          <div className="field">
            <label>Faculty</label>
            <input type="text" {...field('faculty')} placeholder="Faculty of…" />
          </div>
          <div className="field">
            <label>District</label>
            <input type="text" {...field('district')} />
          </div>
        </div>

        <div className="admin-form__row">
          <div className="field">
            <label>Tribe</label>
            <input type="text" {...field('tribe')} />
          </div>
          <div className="field">
            <label>Clan</label>
            <input type="text" {...field('clan')} />
          </div>
        </div>

        <div className="field">
          <label>Role model</label>
          <input type="text" {...field('roleModel')} />
        </div>
        <div className="field">
          <label>Hobbies</label>
          <input type="text" {...field('hobbies')} placeholder="Dancing, singing, acting…" />
        </div>
        <div className="field">
          <label>Project</label>
          <input type="text" {...field('project')} placeholder="e.g. Mental wellbeing" />
        </div>

        <div className="field">
          <label>Photo URL</label>
          <input type="url" {...field('photoUrl')} placeholder="https://…" />
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
            <th scope="col">Age</th>
            <th scope="col">Faculty</th>
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
              <td>{c.age ?? '—'}</td>
              <td>{c.faculty || '—'}</td>
              <td>{c.status}</td>
              <td>
                <button className="link-button" onClick={() => setForm(toFormState(c))}>Edit</button>
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

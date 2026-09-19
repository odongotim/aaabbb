import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { api, ApiError } from '../../../api/api.js';
import ErrorMessage from '../../../components/ErrorMessage.jsx';
import PhotoUploader from '../../../components/PhotoUploader.jsx';

const EMPTY_FORM = {
  contestantId: null,
  contestantNumber: '',
  name: '',
  category: 'Female',
  faculty: '',
  yearOfStudy: '',
  studyProgramme: '',
  passion: '',
  beliefs: '',
  platformIntention: '',
  personalStatement: '',
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
    faculty: c.faculty ?? '',
    yearOfStudy: c.yearOfStudy ?? '',
    studyProgramme: c.studyProgramme ?? '',
    passion: c.passion ?? '',
    beliefs: c.beliefs ?? '',
    platformIntention: c.platformIntention ?? '',
    personalStatement: c.personalStatement ?? '',
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
            <label>Year of Study</label>
            <input type="text" {...field('yearOfStudy')} placeholder="e.g. Year Two" />
          </div>
        </div>

        <div className="field">
          <label>Study Programme</label>
          <input type="text" {...field('studyProgramme')} placeholder="e.g. Bachelor of Software Engineering" />
        </div>

        <div className="field">
          <label>My Passion</label>
          <textarea rows={3} {...field('passion')} />
        </div>
        <div className="field">
          <label>What I Believe In</label>
          <textarea rows={3} {...field('beliefs')} />
        </div>
        <div className="field">
          <label>My Platform Intention</label>
          <textarea rows={3} {...field('platformIntention')} />
        </div>
        <div className="field">
          <label>Personal Statement</label>
          <textarea rows={4} {...field('personalStatement')} />
        </div>

        <div className="field">
          <label>Photo</label>
          <PhotoUploader value={form.photoUrl} onChange={(url) => setForm({ ...form, photoUrl: url })} />
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
            <th scope="col">Faculty</th>
            <th scope="col">Year</th>
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
              <td>{c.faculty || '—'}</td>
              <td>{c.yearOfStudy || '—'}</td>
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

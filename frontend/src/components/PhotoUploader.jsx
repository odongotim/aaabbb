import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { compressImage } from '../lib/imageCompression.js';

export default function PhotoUploader({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // lets the same file be picked again later if needed
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const path = `contestants/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('contestant-photos')
        .upload(path, compressed, { contentType: 'image/jpeg', upsert: false });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('contestant-photos').getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      setError(err?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="photo-uploader">
      {value ? (
        <div className="photo-uploader__preview">
          <img src={value} alt="Contestant preview" />
          <button type="button" className="link-button" onClick={() => onChange('')}>Remove photo</button>
        </div>
      ) : (
        <p className="photo-uploader__empty">No photo yet.</p>
      )}

      <label className="btn btn--secondary photo-uploader__button">
        {uploading ? 'Uploading…' : value ? 'Replace photo' : 'Upload photo'}
        <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} hidden />
      </label>

      {error && <p className="photo-uploader__error">{error}</p>}
    </div>
  );
}

'use client';

import { useEffect, useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';
import { GENRES, LANGUAGES } from '@/lib/constants';

interface Sample {
  id: string;
  title: string;
  genre: string;
  mood: string | null;
  occasion: string | null;
  language: string;
  audioUrl: string;
  duration: number;
  isActive: boolean;
  sortOrder: number;
}

const emptyForm = { title: '', genre: GENRES[0] || 'Pop', mood: '', occasion: '', language: 'en', description: '' };

// Read an audio file's duration (seconds) in the browser before upload.
function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(Number.isFinite(audio.duration) ? Math.round(audio.duration) : 0);
      };
      audio.onerror = () => { URL.revokeObjectURL(url); resolve(0); };
      audio.src = url;
    } catch {
      resolve(0);
    }
  });
}

export default function SamplesManager() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/samples');
      const data = await res.json();
      setSamples(data.samples || []);
    } catch {
      setSamples([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addSample = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) return;
    const file = fileRef.current?.files?.[0];
    if (!file) { setMsg({ text: 'Please choose an audio file.', ok: false }); return; }
    if (!form.title.trim() || !form.genre.trim()) {
      setMsg({ text: 'Title and genre are required.', ok: false });
      return;
    }
    setUploading(true);
    setMsg(null);
    try {
      const duration = await getAudioDuration(file);
      const blob = await upload(`samples/${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/samples/upload',
      });
      const res = await fetch('/api/admin/samples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, audioUrl: blob.url, duration }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ text: data.error || 'Could not save the sample.', ok: false });
        return;
      }
      setMsg({ text: 'Sample added.', ok: true });
      setForm(emptyForm);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err) {
      const m = err instanceof Error ? err.message : '';
      setMsg({ text: m ? `Upload failed: ${m}` : 'Upload failed. Please try again.', ok: false });
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (s: Sample) => {
    await fetch('/api/admin/samples', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, isActive: !s.isActive }),
    });
    load();
  };

  const remove = async (s: Sample) => {
    if (!confirm(`Delete sample "${s.title}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/samples?id=${s.id}`, { method: 'DELETE' });
    load();
  };

  const field: React.CSSProperties = {
    padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13,
    fontFamily: 'Fredoka, sans-serif', width: '100%', boxSizing: 'border-box',
  };
  const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4, display: 'block' };

  return (
    <div className="admin-table-wrap" style={{ padding: '0 40px 40px' }}>
      {/* Add form */}
      <form onSubmit={addSample} style={{ background: '#faf7f2', borderRadius: 14, padding: 20, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 14px', color: '#2a2418', fontSize: 18 }}>Add a sample</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div>
            <label style={label}>Title *</label>
            <input style={field} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Anniversary Serenade" />
          </div>
          <div>
            <label style={label}>Genre *</label>
            <select style={field} value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })}>
              {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Mood</label>
            <input style={field} value={form.mood} onChange={(e) => setForm({ ...form, mood: e.target.value })} placeholder="e.g. Heartfelt" />
          </div>
          <div>
            <label style={label}>Occasion</label>
            <input style={field} value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })} placeholder="e.g. Anniversary" />
          </div>
          <div>
            <label style={label}>Language</label>
            <select style={field} value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Audio file *</label>
            <input ref={fileRef} type="file" accept="audio/*" style={{ ...field, padding: 6 }} />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={label}>Short description</label>
          <input style={field} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="One line about this sample" />
        </div>
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            type="submit"
            disabled={uploading}
            style={{
              padding: '10px 22px', background: uploading ? '#c4b5fd' : '#7c3aed', color: '#fff',
              border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14,
              cursor: uploading ? 'default' : 'pointer', fontFamily: 'Fredoka, sans-serif',
            }}
          >
            {uploading ? 'Uploading…' : 'Add sample'}
          </button>
          {msg && (
            <span style={{ fontSize: 13, fontWeight: 600, color: msg.ok ? '#059669' : '#dc2626' }}>{msg.text}</span>
          )}
        </div>
      </form>

      {/* List */}
      {loading ? (
        <p className="admin-loading">Loading samples...</p>
      ) : samples.length === 0 ? (
        <p className="admin-empty">No samples yet. Add your first one above.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Genre</th>
              <th>Occasion</th>
              <th>Preview</th>
              <th>Visible</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {samples.map((s) => (
              <tr key={s.id}>
                <td style={{ fontWeight: 600 }}>{s.title}</td>
                <td>{s.genre}</td>
                <td>{s.occasion || '—'}</td>
                <td><audio controls preload="none" src={s.audioUrl} style={{ height: 32 }} /></td>
                <td>
                  <button
                    onClick={() => toggleActive(s)}
                    style={{
                      padding: '4px 12px', borderRadius: 8, border: 'none',
                      background: s.isActive ? '#10b981' : '#9ca3af', color: '#fff',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Fredoka, sans-serif',
                    }}
                  >
                    {s.isActive ? 'Live' : 'Hidden'}
                  </button>
                </td>
                <td>
                  <button
                    onClick={() => remove(s)}
                    style={{
                      padding: '4px 12px', borderRadius: 8, border: '1px solid #fca5a5',
                      background: 'transparent', color: '#dc2626',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Fredoka, sans-serif',
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api.js';
 
// ── Category colour map ───────────────────────────────────────────────────────
const CATEGORY_VARIANT = {
  GENERAL: 'primary',
  PORTER:  'secondary',
  ROOMS:   'warning',
  LOCKERS: 'muted',
  SOS:     'error',
  TRAIN:   'success',
};
 
const CATEGORIES = ['GENERAL', 'PORTER', 'ROOMS', 'LOCKERS', 'SOS', 'TRAIN'];
const LANGUAGES  = [{ value: 'en', label: 'English' }, { value: 'hi', label: 'Hindi' }, { value: 'gu', label: 'Gujarati' }];
 
// ── Small helper to format ISO timestamps ────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
 
// ════════════════════════════════════════════════════════════════════════════
// Main Component
// ════════════════════════════════════════════════════════════════════════════
export default function AiKnowledgeBasePage() {
 
  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    content: '', category: 'GENERAL', language: 'en', source: 'Manual',
  });
 
  // ── Table state ────────────────────────────────────────────────────────────
  const [entries,  setEntries]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filterCat, setFilterCat] = useState('ALL');
  const [filterLang, setFilterLang] = useState('all');
  const [search,   setSearch]   = useState('');
 
  // ── Action state ───────────────────────────────────────────────────────────
  const [ingesting,   setIngesting]   = useState(false);
  const [deletingId,  setDeletingId]  = useState(null);
  const [reIngestId,  setReIngestId]  = useState(null);
 
  // ── Feedback banners ───────────────────────────────────────────────────────
  const [banner, setBanner] = useState(null); // { type: 'success'|'error', msg }
 
  // ── Preview modal ──────────────────────────────────────────────────────────
  const [preview, setPreview] = useState(null); // entry object
 
  // ── Confirm delete modal ───────────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(null); // entry object
 
  // ── Stats ──────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState(null);
 
  // ── Load entries ───────────────────────────────────────────────────────────
  const loadEntries = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: 0, size: 200 });
    if (filterCat  !== 'ALL') params.set('category', filterCat);
    if (filterLang !== 'all') params.set('language', filterLang);
    api.get(`/api/ai/planner/knowledge?${params}`)
      .then(r => {
        const data = r.data || [];
        setEntries(data);
        // Compute quick stats from the returned data
        const byCategory = {};
        data.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + 1; });
        setStats({ total: data.length, byCategory });
      })
      .catch(() => setBanner({ type: 'error', msg: 'Failed to load knowledge base entries.' }))
      .finally(() => setLoading(false));
  }, [filterCat, filterLang]);
 
  useEffect(() => { loadEntries(); }, [loadEntries]);
 
  // ── Dismiss banner after 4 s ───────────────────────────────────────────────
  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 4000);
    return () => clearTimeout(t);
  }, [banner]);
 
  // ── Ingest ─────────────────────────────────────────────────────────────────
  const handleIngest = async () => {
    if (!form.content.trim()) return;
    setIngesting(true);
    try {
      await api.post('/api/ai/planner/knowledge', form);
      setForm(f => ({ ...f, content: '' }));
      setBanner({ type: 'success', msg: '✓ Document ingested and embedded into pgvector successfully.' });
      loadEntries();
    } catch (err) {
      setBanner({ type: 'error', msg: err?.response?.data?.message || 'Ingestion failed. Check the AI planner service logs.' });
    } finally {
      setIngesting(false);
    }
  };
 
  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (entry) => {
    setDeletingId(entry.id);
    try {
      await api.delete(`/api/ai/planner/knowledge/${entry.id}`);
      setBanner({ type: 'success', msg: `Entry "${entry.source}" deleted.` });
      setEntries(prev => prev.filter(e => e.id !== entry.id));
    } catch {
      setBanner({ type: 'error', msg: 'Delete failed. The entry may already be gone.' });
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };
 
  // ── Re-ingest ──────────────────────────────────────────────────────────────
  const handleReIngest = async (entry) => {
    setReIngestId(entry.id);
    try {
      await api.post(`/api/ai/planner/knowledge/${entry.id}/re-ingest`);
      setBanner({ type: 'success', msg: `Re-embedded "${entry.source}" with fresh vectors.` });
    } catch {
      setBanner({ type: 'error', msg: 'Re-ingest failed. Check the embedding model configuration.' });
    } finally {
      setReIngestId(null);
    }
  };
 
  // ── Client-side search filter ──────────────────────────────────────────────
  const visible = entries.filter(e => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.content?.toLowerCase().includes(q) ||
      e.source?.toLowerCase().includes(q) ||
      e.category?.toLowerCase().includes(q)
    );
  });
 
  // ════════════════════════════════════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
 
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="page-title">🧠 AI Knowledge Base</h1>
        <p className="page-subtitle">Manage RAG documents ingested into Spring AI + pgvector (text-embedding-3-small)</p>
      </div>
 
      {/* ── Global feedback banner ───────────────────────────────────────── */}
      {banner && (
        <div className={`alert alert-${banner.type}`} style={{ animation: 'slideUp 0.2s ease' }}>
          <span>{banner.msg}</span>
          <button
            onClick={() => setBanner(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: '1rem' }}
          >✕</button>
        </div>
      )}
 
      {/* ── Quick stats ──────────────────────────────────────────────────── */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">📄</div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Documents</div>
          </div>
          {CATEGORIES.filter(c => stats.byCategory[c]).map(c => (
            <div key={c} className="stat-card">
              <div className="stat-icon teal">🏷</div>
              <div className="stat-value">{stats.byCategory[c] || 0}</div>
              <div className="stat-label">{c}</div>
            </div>
          ))}
        </div>
      )}
 
      {/* ── Ingest form ──────────────────────────────────────────────────── */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h3 style={{ fontWeight: 700 }}>Ingest New Document</h3>
 
        <textarea
          className="form-input"
          rows={5}
          value={form.content}
          onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          placeholder="Paste text content to embed into the RAG knowledge base…"
          style={{ resize: 'vertical', lineHeight: 1.6 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
          <span style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)' }}>
            {form.content.length} chars
            {form.content.length > 8000 && (
              <span style={{ color: 'var(--color-warning)', marginLeft: 6 }}>
                ⚠ Large document — consider splitting into smaller chunks
              </span>
            )}
          </span>
        </div>
 
        <div className="grid-3" style={{ gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Language</label>
            <select className="form-select" value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Source / Label</label>
            <input
              className="form-input"
              value={form.source}
              onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
              placeholder="e.g. Station FAQ, Porter SOP v2"
            />
          </div>
        </div>
 
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn btn-primary"
            onClick={handleIngest}
            disabled={ingesting || !form.content.trim()}
          >
            {ingesting
              ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Embedding…</>
              : '+ Ingest Document'}
          </button>
          {form.content && (
            <button className="btn btn-ghost btn-sm" onClick={() => setForm(f => ({ ...f, content: '' }))}>
              Clear
            </button>
          )}
          <span style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
            Vectors stored in <code style={{ background: 'var(--color-surface-2)', padding: '1px 5px', borderRadius: 4 }}>ai_svc.knowledge_base</code>
          </span>
        </div>
      </div>
 
      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['ALL', ...CATEGORIES].map(c => (
            <button
              key={c}
              className={`chip ${filterCat === c ? 'active' : ''}`}
              onClick={() => setFilterCat(c)}
            >{c}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, borderLeft: '1px solid var(--color-border)', paddingLeft: 10 }}>
          {[{ value: 'all', label: '🌐 All' }, ...LANGUAGES.map(l => ({ value: l.value, label: l.label }))].map(l => (
            <button
              key={l.value}
              className={`chip ${filterLang === l.value ? 'active' : ''}`}
              onClick={() => setFilterLang(l.value)}
            >{l.label}</button>
          ))}
        </div>
        <input
          className="form-input"
          style={{ maxWidth: 220, padding: '6px 12px', marginLeft: 'auto' }}
          placeholder="🔍 Search…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          className="btn btn-outline btn-sm"
          onClick={loadEntries}
          title="Refresh"
        >↻ Refresh</button>
      </div>
 
      {/* ── Entries table ────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ borderRadius: 0 }}>
          <thead>
            <tr>
              <th style={{ width: 110 }}>Category</th>
              <th style={{ width: 72 }}>Lang</th>
              <th style={{ width: 160 }}>Source</th>
              <th>Content Preview</th>
              <th style={{ width: 150 }}>Ingested At</th>
              <th style={{ width: 130, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <div className="spinner spinner-lg" />
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.857rem' }}>Loading knowledge base…</span>
                  </div>
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-state-icon">🧠</div>
                    <div className="empty-state-title">
                      {search || filterCat !== 'ALL' || filterLang !== 'all'
                        ? 'No entries match your filters'
                        : 'Knowledge base is empty'}
                    </div>
                    <div className="empty-state-desc">
                      {search || filterCat !== 'ALL' || filterLang !== 'all'
                        ? 'Try clearing the filters above'
                        : 'Ingest your first document using the form above'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : visible.map(entry => (
              <tr key={entry.id}>
                <td>
                  <span className={`badge badge-${CATEGORY_VARIANT[entry.category] || 'muted'}`}>
                    {entry.category}
                  </span>
                </td>
                <td>
                  <span className="badge badge-muted" style={{ textTransform: 'lowercase' }}>
                    {entry.language}
                  </span>
                </td>
                <td style={{ fontSize: '0.814rem', fontWeight: 500 }}>
                  {entry.source}
                </td>
                <td
                  style={{
                    fontSize: '0.814rem',
                    color: 'var(--color-text-secondary)',
                    maxWidth: 340,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                  title="Click to preview full content"
                  onClick={() => setPreview(entry)}
                >
                  {entry.content?.substring(0, 120)}{entry.content?.length > 120 ? '…' : ''}
                </td>
                <td style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  {fmtDate(entry.created_at || entry.createdAt)}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    {/* Preview */}
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      title="Preview full content"
                      onClick={() => setPreview(entry)}
                    >👁</button>
                    {/* Re-ingest */}
                    <button
                      className="btn btn-outline btn-sm btn-icon"
                      title="Re-generate embedding"
                      disabled={reIngestId === entry.id}
                      onClick={() => handleReIngest(entry)}
                    >
                      {reIngestId === entry.id
                        ? <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                        : '↺'}
                    </button>
                    {/* Delete */}
                    <button
                      className="btn btn-danger btn-sm btn-icon"
                      title="Delete entry"
                      disabled={deletingId === entry.id}
                      onClick={() => setConfirmDelete(entry)}
                    >
                      {deletingId === entry.id
                        ? <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2, borderTopColor: '#fff' }} />
                        : '🗑'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
 
        {/* Row count footer */}
        {!loading && visible.length > 0 && (
          <div style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--color-border-light)',
            fontSize: '0.786rem',
            color: 'var(--color-text-muted)',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span>
              Showing <strong>{visible.length}</strong>
              {visible.length !== entries.length && ` of ${entries.length}`} entries
            </span>
            <span>Embedding model: <code>text-embedding-3-small (384-dim)</code></span>
          </div>
        )}
      </div>
 
      {/* ── Preview Modal ────────────────────────────────────────────────── */}
      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ marginBottom: 4 }}>📄 Document Preview</h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`badge badge-${CATEGORY_VARIANT[preview.category] || 'muted'}`}>{preview.category}</span>
                  <span className="badge badge-muted">{preview.language}</span>
                  <span style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)' }}>{preview.source}</span>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setPreview(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 8,
                padding: 16,
                fontSize: '0.857rem',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: 420,
                overflowY: 'auto',
                color: 'var(--color-text-primary)',
              }}>
                {preview.content}
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: '0.786rem', color: 'var(--color-text-muted)' }}>
                <span>ID: <code>{preview.id}</code></span>
                <span>Ingested: {fmtDate(preview.created_at || preview.createdAt)}</span>
                <span>Chars: {preview.content?.length ?? 0}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline btn-sm"
                disabled={reIngestId === preview.id}
                onClick={() => { handleReIngest(preview); setPreview(null); }}
              >↺ Re-ingest</button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => { setConfirmDelete(preview); setPreview(null); }}
              >🗑 Delete</button>
              <button className="btn btn-primary btn-sm" onClick={() => setPreview(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
 
      {/* ── Confirm Delete Modal ─────────────────────────────────────────── */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Entry?</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setConfirmDelete(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-error" style={{ marginBottom: 14 }}>
                ⚠ This will permanently remove the document and its embedding from pgvector. This cannot be undone.
              </div>
              <div style={{ fontSize: '0.857rem', color: 'var(--color-text-secondary)' }}>
                <strong>Source:</strong> {confirmDelete.source}<br />
                <strong>Category:</strong> {confirmDelete.category}<br />
                <strong>Preview:</strong> {confirmDelete.content?.substring(0, 80)}…
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button
                className="btn btn-danger"
                disabled={deletingId === confirmDelete.id}
                onClick={() => handleDelete(confirmDelete)}
              >
                {deletingId === confirmDelete.id
                  ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: '#fff' }} /> Deleting…</>
                  : '🗑 Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

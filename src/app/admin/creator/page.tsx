'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface OrderRow {
  id: string;
  orderNumber: string;
  status: string;
  packageId: string;
  totalPrice: number;
  buyerName: string;
  recName: string | null;
  occasion: string | null;
  mood: string | null;
  genres: string;
  language: string;
  vocal: string | null;
  createdAt: string;
  dueDate: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  paid: '#3b82f6',
  in_progress: '#8b5cf6',
  review: '#ec4899',
  revision: '#f97316',
  completed: '#10b981',
  delivered: '#059669',
};

export default function CreatorPortal() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) router.push('/admin/login');
        else if (d.user.role === 'admin') router.push('/admin');
        else setUser(d.user);
      });
  }, [router]);

  const loadOrders = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/orders?limit=50')
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (user) loadOrders(); }, [user, loadOrders]);

  const loadDetail = (id: string) => {
    fetch(`/api/admin/orders/${id}`)
      .then((r) => r.json())
      .then((d) => setSelected(d.order));
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    loadOrders();
    loadDetail(id);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#faf7f2', fontFamily: 'Fredoka, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', background: '#fff', borderBottom: '1px solid #e8e0d4' }}>
        <div>
          <span style={{ fontFamily: 'Modak, cursive', fontSize: 28, color: '#ec4899' }}>Cloudiezzz</span>
          <span style={{ marginLeft: 12, background: '#fce7f3', color: '#ec4899', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>Creator</span>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: '#8b7e6e' }}>{user.name}</span>
          <button onClick={handleLogout} style={{ padding: '6px 16px', border: '1px solid #e0d8ce', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: 'Fredoka, sans-serif' }}>Sign Out</button>
        </div>
      </header>

      <div style={{ padding: '24px 32px' }}>
        <h2 style={{ color: '#2a2418', fontSize: 22, marginBottom: 20 }}>My Assignments</h2>

        {loading ? (
          <p style={{ color: '#8b7e6e' }}>Loading...</p>
        ) : orders.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center' }}>
            <p style={{ color: '#8b7e6e', fontSize: 16 }}>No orders assigned yet. Check back soon!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {orders.map((order) => (
              <div key={order.id} onClick={() => loadDetail(order.id)} style={{
                background: '#fff', borderRadius: 16, padding: 20, cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)', borderLeft: `4px solid ${STATUS_COLORS[order.status] || '#e8e0d4'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <strong style={{ color: '#ec4899' }}>{order.orderNumber}</strong>
                  <span style={{ padding: '2px 10px', borderRadius: 12, background: STATUS_COLORS[order.status] || '#6b7280', color: '#fff', fontSize: 12, fontWeight: 600 }}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
                <p style={{ fontSize: 14, color: '#5d5346', margin: '4px 0' }}>
                  {order.packageId} for <strong>{order.recName || 'N/A'}</strong>
                  {order.occasion ? ` (${order.occasion})` : ''}
                </p>
                <p style={{ fontSize: 13, color: '#8b7e6e', margin: '4px 0' }}>
                  {order.mood} / {order.genres ? JSON.parse(order.genres).join(', ') : '—'} / {order.language}
                </p>
                {order.dueDate && (
                  <p style={{ fontSize: 12, color: '#f59e0b', marginTop: 4 }}>Due: {order.dueDate}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={() => setSelected(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 700, width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>X</button>
            <h2 style={{ fontFamily: 'Modak, cursive', color: '#ec4899', fontSize: 24, margin: '0 0 20px' }}>
              {selected.orderNumber}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, fontSize: 14, color: '#5d5346' }}>
              <div>
                <h4 style={{ color: '#ec4899', fontSize: 13, textTransform: 'uppercase', marginBottom: 8 }}>Recipient</h4>
                <p>{selected.recName}{selected.recAge ? `, ${selected.recAge}` : ''}</p>
                <p>{selected.relationship} / {selected.occasion}</p>
              </div>
              <div>
                <h4 style={{ color: '#ec4899', fontSize: 13, textTransform: 'uppercase', marginBottom: 8 }}>Sound</h4>
                <p>Mood: {selected.mood}</p>
                <p>Genres: {selected.genres ? JSON.parse(selected.genres).join(', ') : '—'}</p>
                <p>Vocal: {selected.vocal} / {selected.language}</p>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <h4 style={{ color: '#ec4899', fontSize: 13, textTransform: 'uppercase', marginBottom: 8 }}>Story</h4>
                {selected.howMet && <p><strong>How met:</strong> {selected.howMet}</p>}
                {selected.memories && <p><strong>Memories:</strong> {selected.memories}</p>}
                {selected.loveAbout && <p><strong>Love about:</strong> {selected.loveAbout}</p>}
                {selected.feeling && <p><strong>Feeling:</strong> {selected.feeling}</p>}
                {selected.oneLine && <p><strong>Key line:</strong> &ldquo;{selected.oneLine}&rdquo;</p>}
                {selected.avoid && <p style={{ color: '#dc2626' }}><strong>Avoid:</strong> {selected.avoid}</p>}
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <h4 style={{ color: '#ec4899', fontSize: 13, textTransform: 'uppercase', marginBottom: 8 }}>Lyrics</h4>
                {selected.mustInclude && <p><strong>Must include:</strong> {selected.mustInclude}</p>}
                {selected.lyricTone && <p>Tone: {selected.lyricTone}</p>}
                {selected.contentRating && <p>Rating: {selected.contentRating}</p>}
                {selected.approveFirst && <p>Approval: {selected.approveFirst}</p>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
              {['in_progress', 'review', 'completed'].map((st) => (
                <button key={st} onClick={() => updateStatus(selected.id, st)} disabled={selected.status === st}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    fontFamily: 'Fredoka, sans-serif',
                    background: selected.status === st ? '#e8e0d4' : STATUS_COLORS[st] || '#ec4899',
                    color: selected.status === st ? '#8b7e6e' : '#fff',
                  }}>
                  Mark {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

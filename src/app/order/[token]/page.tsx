'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

interface OrderData {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  packageId: string;
  totalPrice: number;
  recName: string | null;
  occasion: string | null;
  mood: string | null;
  genres: string[];
  language: string;
  createdAt: string;
  deliveredAt: string | null;
  giftPageSlug: string | null;
  statusUpdates: { status: string; note: string | null; date: string }[];
  files: { type: string; name: string; url: string }[];
  messages: { from: string; content: string; date: string }[];
}

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: '1' },
  { key: 'paid', label: 'Payment Received', icon: '2' },
  { key: 'in_progress', label: 'In Production', icon: '3' },
  { key: 'review', label: 'Under Review', icon: '4' },
  { key: 'completed', label: 'Completed', icon: '5' },
  { key: 'delivered', label: 'Delivered', icon: '6' },
];

const STATUS_INDEX: Record<string, number> = {};
STATUS_STEPS.forEach((s, i) => { STATUS_INDEX[s.key] = i; });

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<div style={s.page}><div style={s.card}><p style={s.loading}>Loading...</p></div></div>}>
      <OrderTracking />
    </Suspense>
  );
}

function OrderTracking() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const [order, setOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);

  const justPaid = searchParams.get('paid') === 'true';
  const wasCancelled = searchParams.get('cancelled') === 'true';

  useEffect(() => {
    fetch(`/api/order/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then((data) => {
        setOrder(data);
        // Mark messages as read on load
        fetch(`/api/order/${token}/messages/read`, { method: 'POST' }).catch(() => {});
      })
      .catch(() => setError('Order not found. Please check your link.'))
      .finally(() => setLoading(false));
  }, [token]);

  // Poll for updates every 30 seconds
  useEffect(() => {
    if (!order) return;
    const interval = setInterval(() => {
      fetch(`/api/order/${token}`)
        .then((r) => {
          if (!r.ok) return;
          return r.json();
        })
        .then((data) => {
          if (data) setOrder(data);
        })
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [token, order]);

  const sendMessage = async () => {
    const content = msgInput.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/order/${token}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const now = new Date().toISOString();
        setOrder((prev) =>
          prev ? { ...prev, messages: [...prev.messages, { from: 'customer', content, date: now }] } : prev
        );
        setMsgInput('');
      }
    } catch {
      // silently fail
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.card}><p style={s.loading}>Loading your order...</p></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <h1 style={s.logo}>Cloudiezzz</h1>
          <p style={s.error}>{error}</p>
          <a href="/" style={s.link}>Back to home</a>
        </div>
      </div>
    );
  }

  const currentStep = STATUS_INDEX[order.status] ?? -1;
  const isSpecialStatus = ['revision', 'refunded', 'cancelled'].includes(order.status);

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.logo}>Cloudiezzz</h1>
        <p style={s.orderNum}>{order.orderNumber}</p>

        {justPaid && (
          <div style={s.successBanner}>
            Payment successful! Your song is now in the queue.
          </div>
        )}
        {wasCancelled && (
          <div style={s.warnBanner}>
            Payment was cancelled. You can try again when you&apos;re ready.
          </div>
        )}

        {/* Song summary */}
        <div style={s.summary}>
          <p><strong>{order.packageId}</strong> package{order.recName ? ` for ${order.recName}` : ''}</p>
          {order.occasion && <p>Occasion: {order.occasion}</p>}
          {order.mood && <p>Mood: {order.mood} {order.genres.length > 0 ? `/ ${order.genres.join(', ')}` : ''}</p>}
          <p style={s.price}>Total: ${(order.totalPrice / 100).toFixed(2)}</p>
        </div>

        {/* Progress tracker */}
        {!isSpecialStatus ? (
          <div style={s.tracker}>
            {STATUS_STEPS.map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <div key={step.key} style={s.trackerStep}>
                  <div style={{
                    ...s.trackerDot,
                    background: done ? '#ec4899' : '#e8e0d4',
                    transform: active ? 'scale(1.3)' : 'scale(1)',
                    boxShadow: active ? '0 0 0 4px rgba(236,72,153,0.2)' : 'none',
                  }}>
                    {done ? '\u2713' : step.icon}
                  </div>
                  <span style={{
                    ...s.trackerLabel,
                    color: done ? '#2a2418' : '#b5aa9a',
                    fontWeight: active ? 600 : 400,
                  }}>
                    {step.label}
                  </span>
                  {i < STATUS_STEPS.length - 1 && (
                    <div style={{ ...s.trackerLine, background: i < currentStep ? '#ec4899' : '#e8e0d4' }} />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={s.specialStatus}>
            <span style={{
              ...s.statusBadge,
              background: order.status === 'revision' ? '#f97316' : '#ef4444',
            }}>
              {order.status}
            </span>
          </div>
        )}

        {/* Unpaid — show pay button */}
        {order.paymentStatus === 'unpaid' && order.status === 'pending' && (
          <div style={s.paySection}>
            <p style={s.payText}>Complete payment to start production:</p>
            <PayButton token={token} />
          </div>
        )}

        {/* Delivered files */}
        {order.files.length > 0 && (
          <div style={s.section}>
            <h3 style={s.sectionTitle}>Your Song</h3>
            {order.files.map((f, i) => (
              <a key={i} href={f.url} style={s.fileLink} download>
                {f.type === 'lyric_video' ? 'Lyric Video' : 'Download Song'} — {f.name}
              </a>
            ))}
            {order.giftPageSlug && (
              <p style={{ fontSize: 13, color: '#8b7e6e', marginTop: 12 }}>
                Share with your loved one:{' '}
                <a href={`/gift/${order.giftPageSlug}`} style={{ color: '#ec4899' }}>
                  {typeof window !== 'undefined' && `${window.location.origin}/gift/${order.giftPageSlug}`}
                </a>
              </p>
            )}
          </div>
        )}

        {/* Status timeline */}
        {order.statusUpdates.length > 0 && (
          <div style={s.section}>
            <h3 style={s.sectionTitle}>Timeline</h3>
            {order.statusUpdates.map((u, i) => (
              <div key={i} style={s.timelineItem}>
                <span style={s.timelineDot} />
                <div>
                  <span style={{
                    ...s.statusBadge,
                    background: u.status === 'delivered' ? '#059669' : u.status === 'paid' ? '#3b82f6' : '#ec4899',
                    fontSize: 11,
                  }}>
                    {u.status.replace('_', ' ')}
                  </span>
                  {u.note && <span style={s.timelineNote}> {u.note}</span>}
                  <div style={s.timelineDate}>{new Date(u.date).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Messages */}
        <div style={s.section}>
          <h3 style={s.sectionTitle}>Messages</h3>
          <div style={s.messagesContainer}>
            {order.messages.map((m, i) => (
              <div key={i} style={{
                ...s.message,
                alignSelf: m.from === 'customer' ? 'flex-end' : 'flex-start',
                background: m.from === 'customer' ? '#fce7f3' : '#f8f4ef',
              }}>
                <span style={s.msgFrom}>{m.from === 'customer' ? 'You' : 'Cloudiezzz'}</span>
                <p style={s.msgText}>{m.content}</p>
                <span style={s.msgDate}>{new Date(m.date).toLocaleString()}</span>
              </div>
            ))}
            {order.messages.length === 0 && (
              <p style={s.noMessages}>No messages yet. Send a message below!</p>
            )}
          </div>
          <div style={s.msgInputRow}>
            <input
              type="text"
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
              placeholder="Type a message..."
              style={s.msgInput}
            />
            <button onClick={sendMessage} disabled={sending || !msgInput.trim()} style={s.msgSendBtn}>
              {sending ? '...' : 'Send'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <a href="/" style={s.link}>Back to Cloudiezzz</a>
        </div>
      </div>
    </div>
  );
}

function PayButton({ token }: { token: string }) {
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    setPaying(true);
    try {
      // First get the order ID from the token
      const orderRes = await fetch(`/api/order/${token}`);
      const orderData = await orderRes.json();
      // We need the actual order ID — let's use a dedicated endpoint
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert('Payment error. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <button onClick={handlePay} disabled={paying} style={s.payBtn}>
      {paying ? 'Redirecting...' : 'Pay Now'}
    </button>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#faf7f2', fontFamily: 'Fredoka, sans-serif', display: 'flex', justifyContent: 'center', padding: '40px 16px' },
  card: { background: '#fff', borderRadius: 20, padding: '40px 32px', maxWidth: 600, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', alignSelf: 'flex-start' },
  logo: { fontFamily: 'Modak, cursive', fontSize: 36, color: '#ec4899', textAlign: 'center' as const, margin: 0 },
  orderNum: { textAlign: 'center' as const, color: '#8b7e6e', fontSize: 14, marginTop: 4, marginBottom: 24 },
  loading: { textAlign: 'center' as const, color: '#8b7e6e', padding: 40 },
  error: { textAlign: 'center' as const, color: '#dc2626', padding: 20 },
  link: { display: 'block', textAlign: 'center' as const, color: '#ec4899', fontSize: 14, textDecoration: 'none' },
  successBanner: { background: '#ecfdf5', color: '#059669', padding: '12px 16px', borderRadius: 12, textAlign: 'center' as const, fontSize: 14, fontWeight: 600, marginBottom: 20 },
  warnBanner: { background: '#fffbeb', color: '#d97706', padding: '12px 16px', borderRadius: 12, textAlign: 'center' as const, fontSize: 14, marginBottom: 20 },
  summary: { background: '#f8f4ef', borderRadius: 12, padding: '16px 20px', marginBottom: 24, fontSize: 14, color: '#5d5346', lineHeight: 1.6 },
  price: { fontWeight: 700, fontSize: 18, color: '#2a2418', marginTop: 8 },
  tracker: { display: 'flex', justifyContent: 'space-between', padding: '20px 0', marginBottom: 24, position: 'relative' as const },
  trackerStep: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', flex: 1, position: 'relative' as const },
  trackerDot: { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, transition: 'all 0.3s', zIndex: 1 },
  trackerLabel: { fontSize: 11, marginTop: 6, textAlign: 'center' as const, maxWidth: 70 },
  trackerLine: { position: 'absolute' as const, top: 16, left: '50%', right: '-50%', height: 2 },
  specialStatus: { textAlign: 'center' as const, padding: '20px 0' },
  statusBadge: { display: 'inline-block', padding: '3px 12px', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 600, textTransform: 'capitalize' as const },
  paySection: { textAlign: 'center' as const, padding: '16px 0', borderTop: '1px solid #f0ebe4', marginTop: 16 },
  payText: { fontSize: 14, color: '#5d5346', marginBottom: 12 },
  payBtn: { padding: '12px 32px', background: '#ec4899', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'Fredoka, sans-serif' },
  section: { borderTop: '1px solid #f0ebe4', paddingTop: 20, marginTop: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 600, color: '#ec4899', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 12 },
  fileLink: { display: 'block', padding: '10px 16px', background: '#fce7f3', borderRadius: 10, color: '#ec4899', textDecoration: 'none', fontSize: 14, fontWeight: 600, marginBottom: 8 },
  timelineItem: { display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  timelineDot: { width: 8, height: 8, borderRadius: '50%', background: '#ec4899', marginTop: 6, flexShrink: 0 },
  timelineNote: { fontSize: 13, color: '#5d5346' },
  timelineDate: { fontSize: 11, color: '#b5aa9a', marginTop: 2 },
  messagesContainer: { display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 12 },
  message: { padding: '10px 14px', borderRadius: 12, marginBottom: 0, maxWidth: '80%' },
  msgFrom: { fontSize: 11, fontWeight: 600, color: '#8b7e6e' },
  msgText: { fontSize: 14, color: '#2a2418', margin: '4px 0' },
  msgDate: { fontSize: 11, color: '#b5aa9a' },
  noMessages: { fontSize: 13, color: '#b5aa9a', textAlign: 'center' as const, padding: '12px 0' },
  msgInputRow: { display: 'flex', gap: 8, marginTop: 4 },
  msgInput: { flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #e8e0d4', fontSize: 14, fontFamily: 'Fredoka, sans-serif', outline: 'none', background: '#faf7f2' },
  msgSendBtn: { padding: '10px 20px', background: '#ec4899', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Fredoka, sans-serif' },
};

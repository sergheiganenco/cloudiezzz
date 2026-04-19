'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface OrderRow {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  packageId: string;
  totalPrice: number;
  buyerName: string;
  buyerEmail: string;
  recName: string | null;
  occasion: string | null;
  createdAt: string;
  customer: { name: string; email: string };
  creator: { name: string; email: string } | null;
}

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  chartData: { week: string; revenue: number; orders: number }[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  paid: '#3b82f6',
  in_progress: '#8b5cf6',
  review: '#ec4899',
  revision: '#f97316',
  completed: '#10b981',
  delivered: '#059669',
  refunded: '#ef4444',
  cancelled: '#6b7280',
};

const STATUS_OPTIONS = [
  'pending', 'paid', 'in_progress', 'review', 'revision', 'completed', 'delivered', 'refunded', 'cancelled',
];

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adminMsg, setAdminMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [creators, setCreators] = useState<{ id: string; name: string; email: string }[]>([]);
  const [uploadFileType, setUploadFileType] = useState('draft');
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'leads' | 'reviews'>('orders');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [leads, setLeads] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [adminReviews, setAdminReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    confirmColor: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) router.push('/admin/login');
        else setUser(d.user);
      })
      .catch(() => router.push('/admin/login'));
  }, [router]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  }, [user]);

  const loadOrders = useCallback(() => {
    if (!user) return;
    setLoading(true);
    const params = new URLSearchParams({ status: filter, page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    fetch(`/api/admin/orders?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders || []);
        setTotalPages(d.pagination?.pages || 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, filter, page, search, dateFrom, dateTo]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // Poll for new orders every 60 seconds
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      loadOrders();
    }, 60000);
    return () => clearInterval(interval);
  }, [user, loadOrders]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/admin/creators')
      .then((r) => r.json())
      .then((d) => setCreators(d.creators || []))
      .catch(console.error);
  }, [user]);

  useEffect(() => {
    if (!user || activeTab !== 'leads') return;
    setLeadsLoading(true);
    fetch('/api/leads')
      .then((r) => r.json())
      .then((d) => setLeads(d.leads || []))
      .catch(console.error)
      .finally(() => setLeadsLoading(false));
  }, [user, activeTab]);

  const loadAdminReviews = useCallback(() => {
    if (!user) return;
    setReviewsLoading(true);
    fetch('/api/admin/reviews')
      .then((r) => r.json())
      .then((d) => setAdminReviews(d.reviews || []))
      .catch(console.error)
      .finally(() => setReviewsLoading(false));
  }, [user]);

  useEffect(() => {
    if (activeTab === 'reviews') loadAdminReviews();
  }, [activeTab, loadAdminReviews]);

  const refreshOrderDetail = useCallback(() => {
    if (!selectedOrder) return;
    fetch(`/api/admin/orders/${selectedOrder}`)
      .then((r) => r.json())
      .then((d) => setOrderDetail(d.order))
      .catch(console.error);
  }, [selectedOrder]);

  useEffect(() => {
    if (!selectedOrder) { setOrderDetail(null); return; }
    refreshOrderDetail();
  }, [selectedOrder, refreshOrderDetail]);

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedOrder || uploading) return;
    const form = e.currentTarget;
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', uploadFileType);
      await fetch(`/api/admin/orders/${selectedOrder}/files`, {
        method: 'POST',
        body: formData,
      });
      fileInput.value = '';
      refreshOrderDetail();
    } catch {
      // silently fail
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = (fileId: string) => {
    if (!selectedOrder) return;
    setConfirmAction({
      title: 'Delete File',
      message: 'Are you sure you want to delete this file? This action cannot be undone.',
      confirmLabel: 'Yes, Delete',
      confirmColor: '#ef4444',
      onConfirm: async () => {
        setConfirmAction(null);
        try {
          await fetch(`/api/admin/orders/${selectedOrder}/files?fileId=${fileId}`, {
            method: 'DELETE',
          });
          refreshOrderDetail();
        } catch {
          // silently fail
        }
      },
    });
  };

  const handleCreatorChange = async (creatorId: string) => {
    if (!selectedOrder) return;
    await fetch(`/api/admin/orders/${selectedOrder}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creatorId: creatorId || null }),
    });
    loadOrders();
    refreshOrderDetail();
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    loadOrders();
    // Refresh modal if this order is open
    if (selectedOrder === orderId) {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      const d = await res.json();
      setOrderDetail(d.order);
    }
  };

  const sendAdminMessage = async () => {
    const content = adminMsg.trim();
    if (!content || sendingMsg || !selectedOrder) return;
    setSendingMsg(true);
    try {
      await fetch(`/api/admin/orders/${selectedOrder}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      setAdminMsg('');
      // Refresh order detail to show new message
      const res = await fetch(`/api/admin/orders/${selectedOrder}`);
      const d = await res.json();
      setOrderDetail(d.order);
    } catch {
      // silently fail
    } finally {
      setSendingMsg(false);
    }
  };

  const unreadCount = orderDetail?.messages?.filter(
    (m: any) => m.senderType === 'customer' && !m.isRead
  ).length || 0;

  const [reviewRequested, setReviewRequested] = useState<Set<string>>(new Set());

  const requestReview = async (orderId: string) => {
    try {
      const res = await fetch('/api/admin/reviews/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.success) {
        setReviewRequested((prev) => new Set(prev).add(orderId));
      } else {
        alert(data.error || 'Failed to send review request');
      }
    } catch {
      alert('Failed to send review request');
    }
  };

  const toggleReviewFlag = async (reviewId: string, field: string, value: boolean) => {
    await fetch('/api/admin/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId, [field]: value }),
    });
    setAdminReviews((prev) =>
      prev.map((r: any) => (r.id === reviewId ? { ...r, [field]: value } : r))
    );
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (!user) return null;

  return (
    <div className="admin-page">
      {/* Header */}
      <header className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="brand-mark" style={{ fontSize: 28 }}>
            Cloudie<span>zzz</span>
          </span>
          <span className="admin-badge">{user.role}</span>
        </div>
        <div className="admin-header-right">
          <span className="admin-user">{user.name}</span>
          <button onClick={handleLogout} className="admin-logout">Sign Out</button>
        </div>
      </header>

      {/* Stats */}
      {stats && user.role === 'admin' && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.totalOrders}</div>
              <div className="stat-label">Total Orders</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.pendingOrders}</div>
              <div className="stat-label">Awaiting Payment</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.paidOrders}</div>
              <div className="stat-label">Paid</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.inProgressOrders}</div>
              <div className="stat-label">In Progress</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.completedOrders}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.totalCustomers}</div>
              <div className="stat-label">Customers</div>
            </div>
          </div>

          {/* Revenue Cards */}
          <div className="stats-grid" style={{ paddingTop: 0 }}>
            <div className="stat-card revenue-card">
              <div className="stat-value" style={{ color: '#10b981' }}>${(stats.revenueToday / 100).toFixed(2)}</div>
              <div className="stat-label">Today</div>
            </div>
            <div className="stat-card revenue-card">
              <div className="stat-value" style={{ color: '#3b82f6' }}>${(stats.revenueWeek / 100).toFixed(2)}</div>
              <div className="stat-label">This Week</div>
            </div>
            <div className="stat-card revenue-card">
              <div className="stat-value" style={{ color: '#8b5cf6' }}>${(stats.revenueMonth / 100).toFixed(2)}</div>
              <div className="stat-label">This Month</div>
            </div>
            <div className="stat-card revenue-card">
              <div className="stat-value" style={{ color: 'var(--pink)' }}>${(stats.totalRevenue / 100).toFixed(2)}</div>
              <div className="stat-label">All Time</div>
            </div>
          </div>

          {/* Revenue Chart */}
          {stats.chartData && stats.chartData.length > 0 && (
            <div className="chart-card">
              <h3 className="chart-title">Revenue (last 12 weeks)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: 'var(--ink-mute)' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--ink-mute)' }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--yellow-soft)', border: '2px solid var(--ink)',
                      borderRadius: 12, fontFamily: 'Fredoka, sans-serif', fontSize: 14,
                    }}
                    formatter={(value: any, name: any) => [
                      name === 'revenue' ? `$${Number(value).toFixed(2)}` : value,
                      name === 'revenue' ? 'Revenue' : 'Orders',
                    ]}
                  />
                  <Bar dataKey="revenue" fill="var(--pink)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="orders" fill="var(--ink)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* Tab Toggle */}
      <div style={{ display: 'flex', gap: 10, padding: '0 40px 16px' }}>
        {(['orders', 'leads', 'reviews'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              background: activeTab === tab ? '#7c3aed' : '#f3f4f6',
              color: activeTab === tab ? '#fff' : '#6b7280',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Leads Table */}
      {activeTab === 'leads' && (
        <div className="admin-table-wrap">
          {leadsLoading ? (
            <p className="admin-loading">Loading leads...</p>
          ) : leads.length === 0 ? (
            <p className="admin-empty">No leads captured yet.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Step</th>
                  <th>Reminders</th>
                  <th>Last Activity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead: any) => (
                  <tr key={lead.id || lead.email}>
                    <td>{lead.email}</td>
                    <td>{lead.name || '—'}</td>
                    <td>{lead.phone || '—'}</td>
                    <td>{lead.formStep ?? lead.step ?? '—'}</td>
                    <td>{lead.remindersSent ?? 0}</td>
                    <td>{lead.lastActivity ? new Date(lead.lastActivity).toLocaleString() : lead.updatedAt ? new Date(lead.updatedAt).toLocaleString() : '—'}</td>
                    <td>
                      <span className="status-badge" style={{ background: lead.status === 'converted' ? '#10b981' : lead.status === 'abandoned' ? '#f59e0b' : '#3b82f6' }}>
                        {lead.status || 'active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Reviews Management */}
      {activeTab === 'reviews' && (
        <div className="admin-table-wrap">
          {reviewsLoading ? (
            <p className="admin-loading">Loading reviews...</p>
          ) : adminReviews.length === 0 ? (
            <p className="admin-empty">No reviews yet.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Author</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>Occasion</th>
                  <th>Date</th>
                  <th>Approved</th>
                  <th>Public</th>
                  <th>Featured</th>
                </tr>
              </thead>
              <tbody>
                {adminReviews.map((rev: any) => (
                  <tr key={rev.id}>
                    <td>{rev.orderNumber}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{rev.author}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{rev.authorEmail}</div>
                    </td>
                    <td style={{ color: '#fbbf24', letterSpacing: 1 }}>{'★'.repeat(rev.rating)}</td>
                    <td style={{ maxWidth: 300, fontSize: 13, lineHeight: 1.4 }}>
                      {rev.title && <strong>{rev.title}: </strong>}
                      {rev.content.length > 120 ? rev.content.slice(0, 120) + '...' : rev.content}
                    </td>
                    <td>{rev.occasion || '—'}</td>
                    <td>{new Date(rev.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => toggleReviewFlag(rev.id, 'isApproved', !rev.isApproved)}
                        style={{
                          padding: '4px 12px', borderRadius: 8, border: 'none',
                          background: rev.isApproved ? '#10b981' : '#ef4444', color: '#fff',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Fredoka, sans-serif',
                        }}
                      >
                        {rev.isApproved ? 'Yes' : 'No'}
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleReviewFlag(rev.id, 'isPublic', !rev.isPublic)}
                        style={{
                          padding: '4px 12px', borderRadius: 8, border: 'none',
                          background: rev.isPublic ? '#10b981' : '#ef4444', color: '#fff',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Fredoka, sans-serif',
                        }}
                      >
                        {rev.isPublic ? 'Yes' : 'No'}
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleReviewFlag(rev.id, 'isFeatured', !rev.isFeatured)}
                        style={{
                          padding: '4px 12px', borderRadius: 8, border: 'none',
                          background: rev.isFeatured ? '#7c3aed' : '#d1d5db', color: rev.isFeatured ? '#fff' : '#374151',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Fredoka, sans-serif',
                        }}
                      >
                        {rev.isFeatured ? '★ Yes' : 'No'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Search + Date Filter */}
      {activeTab === 'orders' && (
        <div className="admin-search-bar">
          <div className="search-input-wrap">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search orders, customers, recipients..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
            />
            {(search || searchInput) && (
              <button className="search-clear" onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}>&#x2715;</button>
            )}
          </div>
          <div className="date-filter-wrap">
            <label className="date-label">
              From
              <input type="date" className="date-input" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
            </label>
            <label className="date-label">
              To
              <input type="date" className="date-input" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
            </label>
            {(dateFrom || dateTo) && (
              <button className="search-clear" onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}>Clear dates</button>
            )}
          </div>
        </div>
      )}

      {/* Status Filters */}
      {activeTab === 'orders' && <div className="admin-filters">
        {['all', ...STATUS_OPTIONS].map((st) => (
          <button
            key={st}
            onClick={() => { setFilter(st); setPage(1); }}
            className={`filter-btn${filter === st ? ' active' : ''}`}
          >
            {st === 'all' ? 'All' : st.replace('_', ' ')}
          </button>
        ))}
      </div>}

      {/* Orders Table */}
      {activeTab === 'orders' && <div className="admin-table-wrap">
        {loading ? (
          <p className="admin-loading">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="admin-empty">No {filter !== 'all' ? `"${filter.replace('_', ' ')}"` : ''} orders found ✿</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>For</th>
                <th>Package</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <button onClick={() => setSelectedOrder(order.id)} className="order-link">
                      {order.orderNumber}
                    </button>
                  </td>
                  <td>{order.buyerName}</td>
                  <td>{order.recName || '—'}</td>
                  <td>{order.packageId}</td>
                  <td>${(order.totalPrice / 100).toFixed(2)}</td>
                  <td>
                    <span className="status-badge" style={{ background: STATUS_COLORS[order.status] || '#6b7280' }}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className="status-badge" style={{ background: order.paymentStatus === 'paid' ? '#10b981' : '#f59e0b' }}>
                      {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>
                    {(WORKFLOW_STEPS[order.status] || []).slice(0, 1)
                      .filter((a) => !(a.next === '__request_review' && reviewRequested.has(order.id)))
                      .map((a) => (
                      <button
                        key={a.next}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (a.next === '__request_review') {
                            requestReview(order.id);
                          } else {
                            updateStatus(order.id, a.next);
                          }
                        }}
                        style={{
                          padding: '5px 12px', background: a.color, color: '#fff',
                          border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'Fredoka, sans-serif',
                        }}
                      >
                        {a.icon} {a.label}
                      </button>
                    ))}
                    {order.status === 'delivered' && reviewRequested.has(order.id) && (
                      <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>Review requested</span>
                    )}
                    {(!WORKFLOW_STEPS[order.status] || WORKFLOW_STEPS[order.status].length === 0) && (
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="admin-pagination">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="page-btn">Prev</button>
            <span className="page-info">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="page-btn">Next</button>
          </div>
        )}
      </div>}

      {/* Order Detail Modal */}
      {selectedOrder && orderDetail && (
        <div className="admin-modal" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedOrder(null)}>X</button>
            <h2 className="modal-title">{orderDetail.orderNumber}</h2>
            <div className="detail-grid">
              <div>
                <h3 className="detail-title">Buyer</h3>
                <div className="detail-body">
                  <p><strong>{orderDetail.buyerName}</strong> ({orderDetail.buyerEmail})</p>
                  {orderDetail.buyerPhone && <p>Phone: {orderDetail.buyerPhone}</p>}
                </div>
              </div>
              <div>
                <h3 className="detail-title">Recipient</h3>
                <div className="detail-body">
                  <p>{orderDetail.recName || '—'}{orderDetail.recAge ? `, age ${orderDetail.recAge}` : ''}</p>
                  {orderDetail.relationship && <p>Relationship: {orderDetail.relationship}</p>}
                  {orderDetail.occasion && <p>Occasion: {orderDetail.occasion}</p>}
                </div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <h3 className="detail-title">Story</h3>
                <div className="detail-body">
                  {orderDetail.howMet && <p><strong>How met:</strong> {orderDetail.howMet}</p>}
                  {orderDetail.memories && <p><strong>Memories:</strong> {orderDetail.memories}</p>}
                  {orderDetail.loveAbout && <p><strong>Love about:</strong> {orderDetail.loveAbout}</p>}
                  {orderDetail.feeling && <p><strong>Feeling:</strong> {orderDetail.feeling}</p>}
                  {orderDetail.oneLine && <p><strong>Key line:</strong> {orderDetail.oneLine}</p>}
                  {orderDetail.avoid && <p><strong>Avoid:</strong> {orderDetail.avoid}</p>}
                </div>
              </div>
              <div>
                <h3 className="detail-title">Sound</h3>
                <div className="detail-body">
                  {orderDetail.mood && <p>Mood: {orderDetail.mood}</p>}
                  {orderDetail.genres && <p>Genres: {JSON.parse(orderDetail.genres).join(', ')}</p>}
                  <p>Language: {orderDetail.language}</p>
                  {orderDetail.vocal && <p>Vocal: {orderDetail.vocal}</p>}
                </div>
              </div>
              <div>
                <h3 className="detail-title">Pricing</h3>
                <div className="detail-body">
                  <p>Package: {orderDetail.packageId} (${(orderDetail.packagePrice / 100).toFixed(2)})</p>
                  {orderDetail.addonTotal > 0 && <p>Add-ons: ${(orderDetail.addonTotal / 100).toFixed(2)}</p>}
                  {orderDetail.rushFee > 0 && <p>Rush fee: ${(orderDetail.rushFee / 100).toFixed(2)}</p>}
                  {orderDetail.discountAmount > 0 && (
                    <p>Discount: -${(orderDetail.discountAmount / 100).toFixed(2)} ({orderDetail.couponCode})</p>
                  )}
                  <p><strong>Total: ${(orderDetail.totalPrice / 100).toFixed(2)}</strong></p>
                </div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <h3 className="detail-title">Creator</h3>
                <div className="detail-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <select
                      value={orderDetail.creator?.id || ''}
                      onChange={(e) => handleCreatorChange(e.target.value)}
                      className="admin-select"
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13 }}
                    >
                      <option value="">Unassigned</option>
                      {creators.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                      ))}
                    </select>
                    {orderDetail.creator && (
                      <span style={{ fontSize: 13, color: '#5d5346' }}>
                        Currently: <strong>{orderDetail.creator.name}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {/* Workflow Actions */}
              <div style={{ gridColumn: 'span 2' }}>
                <h3 className="detail-title">Workflow</h3>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
                  <WorkflowActions
                    status={orderDetail.status}
                    paymentStatus={orderDetail.paymentStatus}
                    hasFiles={orderDetail.files?.length > 0}
                    onAction={(newStatus) => {
                      updateStatus(orderDetail.id, newStatus);
                      refreshOrderDetail();
                    }}
                    onRequestConfirm={setConfirmAction}
                  />
                </div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <h3 className="detail-title">Files</h3>
                <div className="detail-body">
                  {orderDetail.files?.length > 0 ? (
                    <div style={{ marginBottom: 16 }}>
                      {orderDetail.files.map((f: any) => (
                        <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="status-badge" style={{ background: '#7c3aed', fontSize: 11 }}>
                              {f.fileType.replace('_', ' ')}
                            </span>
                            <a href={f.fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#3b82f6', textDecoration: 'underline' }}>
                              {f.fileName}
                            </a>
                            {f.fileSize && (
                              <span style={{ fontSize: 11, color: '#9ca3af' }}>
                                ({(f.fileSize / 1024).toFixed(0)} KB)
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteFile(f.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>No files uploaded yet.</p>
                  )}
                  <form onSubmit={handleFileUpload} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const }}>
                    <input type="file" required style={{ fontSize: 13, flex: 1, minWidth: 150 }} />
                    <select
                      value={uploadFileType}
                      onChange={(e) => setUploadFileType(e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13 }}
                    >
                      <option value="draft">Draft</option>
                      <option value="final">Final</option>
                      <option value="stem">Stem</option>
                      <option value="lyric_video">Lyric Video</option>
                      <option value="lyric_card">Lyric Card</option>
                    </select>
                    <button
                      type="submit"
                      disabled={uploading}
                      style={{
                        padding: '6px 16px',
                        background: '#7c3aed',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        opacity: uploading ? 0.5 : 1,
                      }}
                    >
                      {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                  </form>
                </div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <h3 className="detail-title">Status History</h3>
                <div className="detail-body">
                  {orderDetail.statusUpdates?.map((u: any) => (
                    <p key={u.id} style={{ fontSize: 13, margin: '6px 0' }}>
                      <span className="status-badge" style={{ background: STATUS_COLORS[u.toStatus] || '#6b7280', fontSize: 11 }}>
                        {u.toStatus.replace('_', ' ')}
                      </span>{' '}
                      {u.note} — {new Date(u.createdAt).toLocaleString()}
                    </p>
                  ))}
                </div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <h3 className="detail-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  Messages
                  {unreadCount > 0 && (
                    <span style={{
                      background: '#ef4444',
                      color: '#fff',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </h3>
                <div className="detail-body">
                  <div style={{ maxHeight: 300, overflowY: 'auto' as const, marginBottom: 12, display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                    {orderDetail.messages?.length > 0 ? (
                      orderDetail.messages.map((m: any) => (
                        <div
                          key={m.id}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 10,
                            maxWidth: '80%',
                            alignSelf: m.senderType === 'admin' ? 'flex-end' : 'flex-start',
                            background: m.senderType === 'admin' ? '#ede9fe' : '#f3f4f6',
                          }}
                        >
                          <div style={{ fontSize: 11, fontWeight: 600, color: m.senderType === 'admin' ? '#7c3aed' : '#6b7280', marginBottom: 2 }}>
                            {m.senderType === 'admin' ? 'You' : 'Customer'}
                            {m.senderType === 'customer' && !m.isRead && (
                              <span style={{ marginLeft: 6, color: '#ef4444', fontSize: 10, fontWeight: 700 }}>NEW</span>
                            )}
                          </div>
                          <div style={{ fontSize: 13, color: '#1f2937' }}>{m.content}</div>
                          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                            {new Date(m.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center' as const, padding: '8px 0' }}>No messages yet.</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={adminMsg}
                      onChange={(e) => setAdminMsg(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') sendAdminMessage(); }}
                      placeholder="Type a message to customer..."
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid #d1d5db',
                        fontSize: 13,
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={sendAdminMessage}
                      disabled={sendingMsg || !adminMsg.trim()}
                      style={{
                        padding: '8px 16px',
                        background: '#7c3aed',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        opacity: sendingMsg || !adminMsg.trim() ? 0.5 : 1,
                      }}
                    >
                      {sendingMsg ? '...' : 'Send'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div
          onClick={() => setConfirmAction(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fffdf5',
              borderRadius: 20,
              border: '2px solid #5d5346',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              padding: '32px 28px 24px',
              maxWidth: 400,
              width: '90%',
              textAlign: 'center' as const,
            }}
          >
            <h3
              style={{
                fontFamily: 'Modak, cursive',
                fontSize: 24,
                color: '#e75480',
                WebkitTextStroke: '0.5px #5d5346',
                margin: '0 0 12px',
              }}
            >
              {confirmAction.title}
            </h3>
            <p
              style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 15,
                color: '#5d5346',
                lineHeight: 1.5,
                margin: '0 0 24px',
              }}
            >
              {confirmAction.message}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmAction(null)}
                style={{
                  padding: '10px 24px',
                  background: 'transparent',
                  color: '#6b7280',
                  border: '2px solid #d1d5db',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Fredoka, sans-serif',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmAction.onConfirm}
                style={{
                  padding: '10px 24px',
                  background: confirmAction.confirmColor,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'Fredoka, sans-serif',
                  boxShadow: `0 3px 0 ${confirmAction.confirmColor}88`,
                }}
              >
                {confirmAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Workflow Action Buttons ===== */
const WORKFLOW_STEPS: Record<string, { label: string; next: string; color: string; icon: string }[]> = {
  pending: [
    { label: 'Mark as Paid', next: 'paid', color: '#3b82f6', icon: '💳' },
  ],
  paid: [
    { label: 'Start Production', next: 'in_progress', color: '#8b5cf6', icon: '🎵' },
  ],
  in_progress: [
    { label: 'Send for Review', next: 'review', color: '#ec4899', icon: '👀' },
  ],
  review: [
    { label: 'Mark Complete', next: 'completed', color: '#10b981', icon: '✅' },
    { label: 'Needs Revision', next: 'revision', color: '#f97316', icon: '✏️' },
  ],
  revision: [
    { label: 'Send for Review', next: 'review', color: '#ec4899', icon: '👀' },
  ],
  completed: [
    { label: 'Deliver to Customer', next: 'delivered', color: '#059669', icon: '📦' },
  ],
  delivered: [
    { label: 'Request Review', next: '__request_review', color: '#f59e0b', icon: '⭐' },
  ],
  refunded: [],
  cancelled: [],
};

function WorkflowActions({ status, paymentStatus, hasFiles, onAction, onRequestConfirm }: {
  status: string;
  paymentStatus: string;
  hasFiles: boolean;
  onAction: (newStatus: string) => void;
  onRequestConfirm: (action: { title: string; message: string; confirmLabel: string; confirmColor: string; onConfirm: () => void }) => void;
}) {
  const actions = WORKFLOW_STEPS[status] || [];
  const needsFiles = ['review', 'completed'].includes(status) && !hasFiles;
  const canRefund = !['refunded', 'cancelled', 'pending'].includes(status);
  const canCancel = !['refunded', 'cancelled', 'delivered'].includes(status);

  const btnStyle = (color: string) => ({
    padding: '10px 20px',
    background: color,
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 700 as const,
    cursor: 'pointer',
    fontFamily: 'Fredoka, sans-serif',
    display: 'inline-flex',
    alignItems: 'center' as const,
    gap: 8,
    boxShadow: `0 3px 0 ${color}88`,
    transition: 'transform .15s',
  });

  const smallBtnStyle = {
    padding: '6px 14px',
    background: 'transparent',
    color: '#6b7280',
    border: '2px solid #e5e7eb',
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 600 as const,
    cursor: 'pointer',
    fontFamily: 'Fredoka, sans-serif',
  };

  if (status === 'delivered') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14, color: '#059669', fontWeight: 600 }}>✅ Delivered — order complete!</span>
        {canRefund && (
          <button onClick={() => onRequestConfirm({
            title: 'Issue Refund',
            message: 'Are you sure you want to refund this order? This action cannot be undone.',
            confirmLabel: 'Yes, Refund',
            confirmColor: '#f59e0b',
            onConfirm: () => { onAction('refunded'); },
          })} style={smallBtnStyle}>
            Refund
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {/* Warning: no files uploaded */}
      {needsFiles && (
        <div style={{
          width: '100%', padding: '10px 16px', background: '#fef2f2',
          border: '2px solid #fca5a5', borderRadius: 12, marginBottom: 8,
          fontSize: 14, fontWeight: 600, color: '#dc2626', fontFamily: 'Fredoka, sans-serif',
        }}>
          ⚠ Upload a song file before marking as complete or delivering
        </div>
      )}

      {/* Main workflow buttons */}
      {actions.map((a) => {
        const blocked = !hasFiles && ['completed', 'delivered'].includes(a.next);
        return (
          <button
            key={a.next}
            onClick={() => {
              if (blocked) {
                onRequestConfirm({
                  title: 'Upload Required',
                  message: 'Please upload the song file first before completing this order. Go to the Files section above to upload.',
                  confirmLabel: 'OK',
                  confirmColor: '#6b7280',
                  onConfirm: () => {},
                });
                return;
              }
              onAction(a.next);
            }}
            style={{
              ...btnStyle(blocked ? '#9ca3af' : a.color),
              opacity: blocked ? 0.5 : 1,
              cursor: blocked ? 'not-allowed' : 'pointer',
            }}
            onMouseOver={(e) => !blocked && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'none')}
          >
            {a.icon} {a.label}
          </button>
        );
      })}

      {/* Secondary actions */}
      {canCancel && (
        <button onClick={() => onRequestConfirm({
          title: 'Cancel Order',
          message: 'Are you sure you want to cancel this order? The customer will be notified.',
          confirmLabel: 'Yes, Cancel',
          confirmColor: '#ef4444',
          onConfirm: () => { onAction('cancelled'); },
        })} style={smallBtnStyle}>
          Cancel Order
        </button>
      )}
      {canRefund && (
        <button onClick={() => onRequestConfirm({
          title: 'Issue Refund',
          message: 'Are you sure you want to refund this order? This action cannot be undone.',
          confirmLabel: 'Yes, Refund',
          confirmColor: '#f59e0b',
          onConfirm: () => { onAction('refunded'); },
        })} style={smallBtnStyle}>
          Refund
        </button>
      )}

      {/* Current status indicator */}
      <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 'auto' }}>
        Current: {status.replace('_', ' ')}
        {paymentStatus === 'unpaid' && status === 'pending' && ' (awaiting payment)'}
      </span>
    </div>
  );
}

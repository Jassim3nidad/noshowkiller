// src/pages/AdminPage.jsx
// Admin dashboard — view, filter, and manage all appointments.
// In production, protect this route with JWT authentication.

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const SERVICES = [
  'all','Haircut','Haircut & Beard','Beard Trim',
  'Hair Color','Highlights','Kids Haircut','Shave','Consultation',
];

const formatTime = (t) => {
  const [h, m] = t.split(':').map(Number);
  return `${((h+11)%12)+1}:${m===0?'00':m} ${h>=12?'PM':'AM'}`;
};

const STATUS_COLORS = {
  confirmed:  'badge-confirmed',
  completed:  'badge-completed',
  cancelled:  'badge-cancelled',
  pending:    'badge-pending',
};

// Stat card sub-component
function StatCard({ label, value, color }) {
  return (
    <div className="card">
      <div className="text-2xl font-bold mb-1" style={{ color }}>
        {value ?? '—'}
      </div>
      <div className="text-sm text-brand-500">{label}</div>
    </div>
  );
}

export default function AdminPage() {
  // Stats
  const [stats,   setStats]   = useState(null);

  // Appointments list
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // Filters
  const [filterStatus,  setFilterStatus]  = useState('all');
  const [filterDate,    setFilterDate]    = useState('');
  const [filterService, setFilterService] = useState('all');

  // Action feedback
  const [updating, setUpdating] = useState(null); // appointmentId being updated

  // ── Load stats ──
  const loadStats = async () => {
    try {
      const res = await api.get('/appointments/stats');
      setStats(res.data.data);
    } catch {
      // Non-critical, stats can fail silently
    }
  };

  // ── Load appointments with current filters ──
  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterStatus  !== 'all') params.append('status',  filterStatus);
      if (filterDate)               params.append('date',    filterDate);
      if (filterService !== 'all') params.append('service', filterService);

      const res = await api.get(`/appointments?${params.toString()}`);
      setAppointments(res.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterDate, filterService]);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // ── Update appointment status ──
  const handleStatusChange = async (id, newStatus) => {
    setUpdating(id);
    try {
      await api.patch(`/appointments/${id}/status`, { status: newStatus });
      setAppointments((prev) =>
        prev.map((a) => a._id === id ? { ...a, status: newStatus } : a)
      );
      loadStats(); // Refresh stats after status change
    } catch (err) {
      alert(`Failed to update: ${err.message}`);
    } finally {
      setUpdating(null);
    }
  };

  // ── Delete appointment ──
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this appointment? This cannot be undone.')) return;
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments((prev) => prev.filter((a) => a._id !== id));
      loadStats();
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-brand-50">
      {/* Header */}
      <header className="bg-white border-b border-brand-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold">✂ CutHouse</span>
            <span className="bg-brand-900 text-white text-xs px-2 py-0.5 rounded-full font-medium">
              Admin
            </span>
          </div>
          <Link to="/" className="btn-secondary text-xs px-3 py-2">
            ← View Booking Page
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Stats grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Bookings"    value={stats?.total}     color="#18181b" />
            <StatCard label="Upcoming"          value={stats?.upcoming}  color="#1d4ed8" />
            <StatCard label="Completed"         value={stats?.completed} color="#15803d" />
            <StatCard label="Cancelled"         value={stats?.cancelled} color="#b91c1c" />
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <h3 className="font-medium mb-4">Filter Appointments</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Status</label>
              <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Service</label>
              <select className="input" value={filterService} onChange={(e) => setFilterService(e.target.value)}>
                {SERVICES.map((s) => (
                  <option key={s} value={s}>{s === 'all' ? 'All Services' : s}</option>
                ))}
              </select>
            </div>
          </div>
          {(filterStatus !== 'all' || filterDate || filterService !== 'all') && (
            <button
              className="mt-3 text-xs text-brand-500 hover:text-brand-900 underline"
              onClick={() => { setFilterStatus('all'); setFilterDate(''); setFilterService('all'); }}
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Appointments table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Appointments
              {!loading && (
                <span className="ml-2 text-brand-400 text-sm font-normal">
                  ({appointments.length})
                </span>
              )}
            </h2>
            <button onClick={loadAppointments} className="btn-secondary text-xs px-3 py-2">
              ↻ Refresh
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          {/* Loading skeleton */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-white rounded-xl border border-brand-200 animate-pulse" />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="card text-center py-12 text-brand-400">
              <p className="text-4xl mb-3">📭</p>
              <p className="font-medium text-brand-600">No appointments found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            /* Table — scrollable on mobile */
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-brand-50 border-b border-brand-200">
                      <th className="px-4 py-3 text-left font-medium text-brand-600">Client</th>
                      <th className="px-4 py-3 text-left font-medium text-brand-600">Service</th>
                      <th className="px-4 py-3 text-left font-medium text-brand-600">Date & Time</th>
                      <th className="px-4 py-3 text-left font-medium text-brand-600">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-brand-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-100">
                    {appointments.map((appt) => (
                      <tr key={appt._id} className="hover:bg-brand-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-brand-900">{appt.client_name}</div>
                          <div className="text-xs text-brand-400">{appt.email}</div>
                          <div className="text-xs text-brand-400">{appt.phone}</div>
                        </td>
                        <td className="px-4 py-3 text-brand-700">{appt.service}</td>
                        <td className="px-4 py-3">
                          <div className="text-brand-900">
                            {new Date(appt.appointment_date + 'T00:00:00').toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}
                          </div>
                          <div className="text-xs text-brand-400">{formatTime(appt.appointment_time)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${STATUS_COLORS[appt.status] || 'badge-pending'}`}>
                            {appt.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {/* Status dropdown */}
                            <select
                              className="text-xs border border-brand-200 rounded-lg px-2 py-1 bg-white text-brand-700
                                         focus:outline-none focus:ring-1 focus:ring-brand-900"
                              value={appt.status}
                              disabled={updating === appt._id}
                              onChange={(e) => handleStatusChange(appt._id, e.target.value)}
                            >
                              <option value="confirmed">Confirmed</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="pending">Pending</option>
                            </select>

                            {/* Loading spinner */}
                            {updating === appt._id && (
                              <span className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(appt._id)}
                              className="text-red-400 hover:text-red-600 transition-colors text-xs"
                              title="Delete appointment"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

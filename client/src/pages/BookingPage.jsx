// src/pages/BookingPage.jsx
// The main booking page clients see.
// Multi-step form: Step 1 = service + date/time, Step 2 = personal info.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

// ─── Constants ──────────────────────────────
const SERVICES = [
  { name: 'Haircut',         duration: '30 min', price: '$25' },
  { name: 'Haircut & Beard', duration: '45 min', price: '$40' },
  { name: 'Beard Trim',      duration: '20 min', price: '$15' },
  { name: 'Hair Color',      duration: '90 min', price: '$80' },
  { name: 'Highlights',      duration: '120 min', price: '$120' },
  { name: 'Kids Haircut',    duration: '20 min', price: '$18' },
  { name: 'Shave',           duration: '30 min', price: '$22' },
  { name: 'Consultation',    duration: '15 min', price: 'Free' },
];

// All possible time slots (9 AM – 6 PM, every 30 min)
const ALL_TIMES = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30',
];

// Format "14:30" → "2:30 PM"
const formatTime = (t) => {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${m === 0 ? '00' : m} ${period}`;
};

// Minimum selectable date = today (no past bookings)
const todayStr = () => new Date().toISOString().split('T')[0];

// ─── Component ──────────────────────────────
export default function BookingPage() {
  const navigate = useNavigate();

  // Step 1 state
  const [step,       setStep]       = useState(1);
  const [service,    setService]    = useState('');
  const [date,       setDate]       = useState('');
  const [time,       setTime]       = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Step 2 state
  const [form, setForm] = useState({ client_name: '', email: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // ── Fetch booked slots when date changes ──
  useEffect(() => {
    if (!date) return;
    setTime(''); // Reset selected time
    setLoadingSlots(true);
    api.get(`/appointments/available-slots?date=${date}`)
      .then((res) => setBookedSlots(res.data.bookedTimes || []))
      .catch(() => setBookedSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [date]);

  // ── Step 1 validation ──
  const validateStep1 = () => {
    if (!service) { alert('Please select a service'); return false; }
    if (!date)    { alert('Please select a date');    return false; }
    if (!time)    { alert('Please select a time slot'); return false; }
    return true;
  };

  // ── Step 2 form validation ──
  const validateStep2 = () => {
    const e = {};
    if (!form.client_name.trim())         e.client_name = 'Full name is required';
    if (!form.email.trim())               e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.phone.trim())               e.phone = 'Phone number is required';
    else if (!/^[\d\s\+\-\(\)]{7,20}$/.test(form.phone)) e.phone = 'Enter a valid phone';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit booking ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    setApiError('');

    try {
      const res = await api.post('/appointments', {
        ...form,
        service,
        appointment_date: date,
        appointment_time: time,
      });

      // Navigate to confirmation page, passing appointment data via state
      navigate('/confirmation', { state: { appointment: res.data.data } });
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──
  return (
    <div className="min-h-screen bg-brand-50">
      {/* Header */}
      <header className="bg-white border-b border-brand-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">✂ CutHouse</span>
          </div>
          <span className="text-sm text-brand-500">Book an Appointment</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress indicator */}
        <div className="flex items-center gap-3 mb-8">
          {[1, 2].map((s) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 ${step >= s ? 'text-brand-900' : 'text-brand-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors
                  ${step >= s ? 'bg-brand-900 text-white' : 'bg-brand-200 text-brand-500'}`}>
                  {s}
                </div>
                <span className="text-sm font-medium hidden sm:block">
                  {s === 1 ? 'Service & Time' : 'Your Details'}
                </span>
              </div>
              {s < 2 && <div className={`flex-1 h-px ${step > s ? 'bg-brand-900' : 'bg-brand-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* ── STEP 1: Service & Date/Time ── */}
        {step === 1 && (
          <div className="animate-slide-up space-y-6">
            {/* Service selection */}
            <div>
              <h2 className="text-xl font-semibold mb-1">Choose a Service</h2>
              <p className="text-brand-500 text-sm mb-4">Select the service you'd like to book</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SERVICES.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => setService(s.name)}
                    className={`text-left p-4 rounded-xl border-2 transition-all duration-150
                      ${service === s.name
                        ? 'border-brand-900 bg-brand-950 text-white'
                        : 'border-brand-200 bg-white hover:border-brand-400'}`}
                  >
                    <div className="font-medium text-sm">{s.name}</div>
                    <div className={`text-xs mt-0.5 ${service === s.name ? 'text-brand-300' : 'text-brand-400'}`}>
                      {s.duration} · {s.price}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date picker */}
            <div>
              <h2 className="text-xl font-semibold mb-1">Pick a Date</h2>
              <p className="text-brand-500 text-sm mb-4">We're open Monday – Saturday</p>
              <input
                type="date"
                className="input"
                min={todayStr()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Time slot picker */}
            {date && (
              <div>
                <h2 className="text-xl font-semibold mb-1">Pick a Time</h2>
                <p className="text-brand-500 text-sm mb-4">
                  {loadingSlots ? 'Loading availability…' : 'Select an available slot'}
                </p>
                {loadingSlots ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="h-10 bg-brand-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {ALL_TIMES.map((t) => {
                      const isBooked = bookedSlots.includes(t);
                      return (
                        <button
                          key={t}
                          disabled={isBooked}
                          onClick={() => setTime(t)}
                          className={`py-2.5 rounded-xl text-xs font-medium transition-all border
                            ${isBooked
                              ? 'bg-brand-100 text-brand-300 border-brand-100 cursor-not-allowed line-through'
                              : time === t
                                ? 'bg-brand-900 text-white border-brand-900'
                                : 'bg-white text-brand-700 border-brand-200 hover:border-brand-500'}`}
                        >
                          {formatTime(t)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <button
              className="btn-primary w-full"
              onClick={() => validateStep1() && setStep(2)}
            >
              Continue →
            </button>
          </div>
        )}

        {/* ── STEP 2: Personal Info ── */}
        {step === 2 && (
          <div className="animate-slide-up">
            {/* Booking summary */}
            <div className="card mb-6 bg-brand-950 text-white border-0">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-brand-400 mb-1">Your appointment</div>
                  <div className="font-semibold text-lg">{service}</div>
                  <div className="text-brand-300 text-sm mt-1">
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                    })}
                    {' · '}{formatTime(time)}
                  </div>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-brand-400 hover:text-white text-xs underline mt-1 transition"
                >
                  Change
                </button>
              </div>
            </div>

            <h2 className="text-xl font-semibold mb-1">Your Details</h2>
            <p className="text-brand-500 text-sm mb-6">
              We'll send your confirmation and reminders here
            </p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Full Name */}
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  className={`input ${errors.client_name ? 'input-error' : ''}`}
                  placeholder="Alex Johnson"
                  value={form.client_name}
                  onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                />
                {errors.client_name && <p className="field-error">{errors.client_name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  placeholder="alex@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {errors.email && <p className="field-error">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="label">Phone Number</label>
                <input
                  type="tel"
                  className={`input ${errors.phone ? 'input-error' : ''}`}
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                {errors.phone && <p className="field-error">{errors.phone}</p>}
                <p className="text-xs text-brand-400 mt-1">
                  📱 You'll receive an SMS reminder 24 hours before your appointment
                </p>
              </div>

              {/* API error */}
              {apiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {apiError}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="btn-secondary flex-1"
                  onClick={() => setStep(1)}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Booking…
                    </span>
                  ) : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

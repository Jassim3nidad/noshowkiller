// src/pages/ConfirmationPage.jsx
// Shown after a successful booking.
// Receives appointment data from BookingPage via React Router state.

import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const formatTime = (t) => {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${m === 0 ? '00' : m} ${period}`;
};

export default function ConfirmationPage() {
  const { state }  = useLocation();
  const navigate   = useNavigate();
  const appointment = state?.appointment;

  // If someone navigates here directly with no data, send them back
  if (!appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50 px-4">
        <div className="text-center">
          <p className="text-brand-500 mb-4">No booking found.</p>
          <Link to="/" className="btn-primary">Book an Appointment</Link>
        </div>
      </div>
    );
  }

  const readableDate = new Date(appointment.appointment_date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-brand-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full animate-slide-up">
        {/* Success icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-1">You're booked! 🎉</h1>
        <p className="text-brand-500 text-center text-sm mb-8">
          A confirmation email has been sent to <strong>{appointment.email}</strong>
        </p>

        {/* Appointment card */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-brand-100">
            <span className="text-sm text-brand-500">Booking ID</span>
            <span className="font-mono text-sm font-medium bg-brand-100 px-2 py-0.5 rounded">
              {appointment.appointmentId}
            </span>
          </div>

          <div className="space-y-3">
            <Row label="Service"  value={appointment.service} />
            <Row label="Date"     value={readableDate} />
            <Row label="Time"     value={formatTime(appointment.appointment_time)} />
            <Row label="Name"     value={appointment.client_name} />
            <Row label="Phone"    value={appointment.phone} />
          </div>
        </div>

        {/* Reminders info */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm">
          <p className="font-medium text-blue-800 mb-1">📱 Reminders are set</p>
          <p className="text-blue-600">
            We'll send you an SMS reminder 24 hours before your appointment.
            No-shows waste everyone's time — we're counting on you! 💇
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/')}
            className="btn-secondary flex-1"
          >
            Book Another
          </button>
          <a
            href={`https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(
              `${appointment.service} at CutHouse`
            )}&dates=${appointment.appointment_date.replace(/-/g, '')}T${
              appointment.appointment_time.replace(':', '')
            }00/${appointment.appointment_date.replace(/-/g, '')}T${
              (parseInt(appointment.appointment_time.split(':')[0]) + 1).toString().padStart(2, '0')
            }${appointment.appointment_time.split(':')[1]}00`}
            target="_blank"
            rel="noreferrer"
            className="btn-primary flex-1 text-center"
          >
            Add to Calendar
          </a>
        </div>
      </div>
    </div>
  );
}

// Small helper row component
function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-brand-500">{label}</span>
      <span className="text-sm font-medium text-brand-900">{value}</span>
    </div>
  );
}

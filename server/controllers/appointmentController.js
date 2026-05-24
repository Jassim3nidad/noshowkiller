// controllers/appointmentController.js
// All business logic for appointment operations.
// Controllers receive the request, interact with the model, and send a response.

const Appointment = require('../models/Appointment');
const axios = require('axios');

// ─────────────────────────────────────────────
// HELPER: Fire Zapier webhook (non-blocking)
// Called after a new appointment is saved.
// ─────────────────────────────────────────────
const triggerZapierWebhook = async (appointment) => {
  const zapierUrl = process.env.ZAPIER_WEBHOOK_URL;
  if (!zapierUrl) {
    console.warn('⚠️  ZAPIER_WEBHOOK_URL not set. Skipping automation.');
    return;
  }

  try {
    // Format a readable datetime for use in emails and calendar events
    const [year, month, day] = appointment.appointment_date.split('-');
    const readableDate = new Date(year, month - 1, day).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Convert 24h time to 12h for display
    const [h, m] = appointment.appointment_time.split(':');
    const hour12 = ((parseInt(h) + 11) % 12) + 1;
    const ampm = parseInt(h) >= 12 ? 'PM' : 'AM';
    const readableTime = `${hour12}:${m} ${ampm}`;

    // Payload sent to Zapier — maps to Gmail, Calendar, and Twilio fields
    const payload = {
      appointment_id: appointment.appointmentId,
      client_name:    appointment.client_name,
      email:          appointment.email,
      phone:          appointment.phone,
      service:        appointment.service,
      appointment_date: appointment.appointment_date,   // YYYY-MM-DD (for Calendar)
      appointment_time: appointment.appointment_time,   // HH:MM (for Calendar)
      readable_date:  readableDate,                     // "Monday, June 3, 2025"
      readable_time:  readableTime,                     // "2:30 PM"
      // ISO datetime needed by Google Calendar event start/end
      event_start: `${appointment.appointment_date}T${appointment.appointment_time}:00`,
      event_end:   `${appointment.appointment_date}T${String(parseInt(h) + 1).padStart(2,'0')}:${m}:00`,
    };

    await axios.post(zapierUrl, payload, { timeout: 8000 });
    console.log(`📤 Zapier webhook sent for appointment ${appointment.appointmentId}`);
  } catch (err) {
    // Webhook failure should NOT fail the booking — log and continue
    console.error('❌ Zapier webhook failed:', err.message);
  }
};

// ─────────────────────────────────────────────
// POST /api/appointments
// Create a new appointment
// ─────────────────────────────────────────────
exports.createAppointment = async (req, res) => {
  try {
    const { client_name, email, phone, service, appointment_date, appointment_time } = req.body;

    // Check for double-booking before saving
    const existing = await Appointment.findOne({
      appointment_date,
      appointment_time,
      status: { $nin: ['cancelled'] },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked. Please choose a different time.',
      });
    }

    // Save appointment to MongoDB
    const appointment = await Appointment.create({
      client_name,
      email,
      phone,
      service,
      appointment_date,
      appointment_time,
    });

    // Fire Zapier webhook asynchronously (don't await — keeps response fast)
    triggerZapierWebhook(appointment);

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully!',
      data: appointment,
    });
  } catch (error) {
    // Handle Mongoose duplicate key error (race condition on double-booking)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This time slot was just taken. Please choose another time.',
      });
    }
    console.error('createAppointment error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────────
// GET /api/appointments/available-slots
// Returns booked slots for a given date so the
// frontend can disable them in the time picker.
// ─────────────────────────────────────────────
exports.getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date query param is required.' });
    }

    // Find all non-cancelled appointments for this date
    const booked = await Appointment.find({
      appointment_date: date,
      status: { $nin: ['cancelled'] },
    }).select('appointment_time -_id');

    const bookedTimes = booked.map((a) => a.appointment_time);

    res.json({ success: true, bookedTimes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────
// GET /api/appointments
// Admin: get all appointments with filters
// Query params: status, date, service
// ─────────────────────────────────────────────
exports.getAllAppointments = async (req, res) => {
  try {
    const { status, date, service } = req.query;
    const filter = {};

    if (status && status !== 'all') filter.status = status;
    if (date)    filter.appointment_date = date;
    if (service && service !== 'all') filter.service = service;

    const appointments = await Appointment.find(filter)
      .sort({ appointment_date: 1, appointment_time: 1 });

    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────
// GET /api/appointments/stats
// Admin dashboard summary statistics
// ─────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

    const [total, upcoming, completed, cancelled] = await Promise.all([
      Appointment.countDocuments(),
      Appointment.countDocuments({ appointment_date: { $gte: today }, status: 'confirmed' }),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
    ]);

    res.json({ success: true, data: { total, upcoming, completed, cancelled } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/appointments/:id/status
// Admin: update appointment status
// Body: { status: "completed" | "cancelled" | "confirmed" }
// ─────────────────────────────────────────────
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    res.json({ success: true, message: `Status updated to ${status}`, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/appointments/:id
// Admin: hard delete an appointment
// ─────────────────────────────────────────────
exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }
    res.json({ success: true, message: 'Appointment deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

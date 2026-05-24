// routes/appointments.js
// Defines all REST API endpoints for appointments.
// Validation runs before the controller — invalid requests are rejected early.

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const ctrl = require('../controllers/appointmentController');

// ─────────────────────────────────────────────
// Validation rules for creating an appointment
// ─────────────────────────────────────────────
const bookingValidation = [
  body('client_name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name is too long'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address'),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[\d\s\+\-\(\)]{7,20}$/).withMessage('Please enter a valid phone number'),

  body('service')
    .notEmpty().withMessage('Please select a service')
    .isIn([
      'Haircut', 'Haircut & Beard', 'Beard Trim',
      'Hair Color', 'Highlights', 'Kids Haircut', 'Shave', 'Consultation',
    ]).withMessage('Invalid service selected'),

  body('appointment_date')
    .notEmpty().withMessage('Please select a date')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format')
    .custom((value) => {
      const today = new Date().toISOString().split('T')[0];
      if (value < today) throw new Error('Appointment date cannot be in the past');
      return true;
    }),

  body('appointment_time')
    .notEmpty().withMessage('Please select a time')
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Time must be in HH:MM format'),

  // Middleware: if validation failed, return 422 with all error messages
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }
    next();
  },
];

// ─────────────────────────────────────────────
// CLIENT ROUTES
// ─────────────────────────────────────────────

// GET  /api/appointments/available-slots?date=YYYY-MM-DD
// Returns array of booked time strings for a date
router.get('/available-slots', ctrl.getAvailableSlots);

// POST /api/appointments
// Create a new booking (with full validation)
router.post('/', bookingValidation, ctrl.createAppointment);

// ─────────────────────────────────────────────
// ADMIN ROUTES
// In production: protect these with JWT middleware
// ─────────────────────────────────────────────

// GET  /api/appointments?status=confirmed&date=2025-06-01&service=Haircut
router.get('/', ctrl.getAllAppointments);

// GET  /api/appointments/stats
router.get('/stats', ctrl.getStats);

// PATCH /api/appointments/:id/status
// Body: { "status": "completed" }
router.patch('/:id/status', [
  body('status')
    .isIn(['pending', 'confirmed', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });
    next();
  },
], ctrl.updateStatus);

// DELETE /api/appointments/:id
router.delete('/:id', ctrl.deleteAppointment);

module.exports = router;

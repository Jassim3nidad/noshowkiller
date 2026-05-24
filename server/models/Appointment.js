// models/Appointment.js
// Defines the MongoDB schema for an appointment.
// Mongoose validates data shape before saving to the database.

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const AppointmentSchema = new mongoose.Schema(
  {
    // Unique human-readable appointment ID (e.g. "NSK-a1b2c3d4")
    appointmentId: {
      type: String,
      unique: true,
      default: () => `NSK-${uuidv4().split('-')[0].toUpperCase()}`,
    },

    // Client information
    client_name: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[\d\s\+\-\(\)]{7,20}$/, 'Please provide a valid phone number'],
    },

    // Service selected by the client
    service: {
      type: String,
      required: [true, 'Service is required'],
      enum: {
        values: [
          'Haircut',
          'Haircut & Beard',
          'Beard Trim',
          'Hair Color',
          'Highlights',
          'Kids Haircut',
          'Shave',
          'Consultation',
        ],
        message: '{VALUE} is not a valid service',
      },
    },

    // Appointment scheduling
    appointment_date: {
      type: String, // Stored as "YYYY-MM-DD" string for easy filtering
      required: [true, 'Appointment date is required'],
    },
    appointment_time: {
      type: String, // Stored as "HH:MM" (24h) string e.g. "14:30"
      required: [true, 'Appointment time is required'],
    },

    // Booking status lifecycle
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'confirmed',
    },

    // Optional: notes from admin
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    // Automatically adds createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// Compound index: prevents double-booking the same date+time slot
AppointmentSchema.index(
  { appointment_date: 1, appointment_time: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $nin: ['cancelled'] } },
    // Only enforce uniqueness for non-cancelled appointments
  }
);

// Index for fast admin dashboard queries
AppointmentSchema.index({ status: 1, appointment_date: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);

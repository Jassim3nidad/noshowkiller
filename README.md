# No-Show Killer Booking Engine

A full-stack appointment booking system for barbershops, salons, and service businesses.
Reduces no-shows via automated reminders, Google Calendar sync, and SMS/email confirmations.

---

## Quick Start

### 1. Clone & Install
```bash
# Install backend
cd server && npm install

# Install frontend
cd ../client && npm install
```

### 2. Set Environment Variables
Copy `.env.example` to `.env` in both `/server` and `/client`

### 3. Start Development
```bash
# Terminal 1 — backend (port 5000)
cd server && npm run dev

# Terminal 2 — frontend (port 3000)
cd client && npm start
```

---

## Project Structure
```
noshowkiller/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route-level pages
│   │   ├── hooks/           # Custom React hooks
│   │   └── utils/           # Axios config, helpers
│   └── package.json
├── server/                  # Express.js backend
│   ├── routes/              # API route definitions
│   ├── controllers/         # Business logic
│   ├── models/              # Mongoose schemas
│   ├── middleware/          # Validation, error handling
│   ├── config/              # DB connection, env
│   └── package.json
└── README.md
```

---

## Tech Stack
- **Frontend**: React, Tailwind CSS, Axios, React Router v6
- **Backend**: Express.js, Node.js, Mongoose
- **Database**: MongoDB Atlas
- **Automation**: Zapier, Gmail, Twilio, Google Calendar
- **Deployment**: Vercel (frontend), Render (backend), MongoDB Atlas (DB)

# ✂ No-Show Killer Booking Engine

> A full-stack automated appointment booking system designed to eliminate no-shows for barbershops, salons, and service businesses through smart reminders, calendar sync, and email automation.

**🌐 Live Demo:** [noshowkiller.vercel.app](https://noshowkiller.vercel.app)
**⚙️ Admin Dashboard:** [noshowkiller.vercel.app/admin](https://noshowkiller.vercel.app/admin)
**📡 API Health:** [noshowkiller-server.onrender.com/api/health](https://noshowkiller-server.onrender.com/api/health)

---

## 📸 Screenshots

| Booking Page | Confirmation | Admin Dashboard |
|---|---|---|
| Service selection, date & time picker | Booking ID, details, Add to Calendar | Stats, filters, status management |

---

## 🚀 Features

### Client-Facing
- ✅ Modern 2-step booking form
- ✅ Service selection with pricing and duration
- ✅ Real-time date picker (no past dates)
- ✅ Live time slot availability (booked slots disabled automatically)
- ✅ Client information form with validation
- ✅ Booking confirmation page with unique Booking ID
- ✅ "Add to Google Calendar" button
- ✅ Mobile-responsive design

### Admin Dashboard
- ✅ Live appointment statistics (Total, Upcoming, Completed, Cancelled)
- ✅ Filter appointments by Status, Date, and Service
- ✅ Update appointment status (Confirmed → Completed / Cancelled)
- ✅ Delete appointments
- ✅ Real-time refresh

### Backend & Database
- ✅ REST API with full CRUD operations
- ✅ Double-booking prevention (compound index on date + time)
- ✅ Input validation on all fields
- ✅ Unique Booking ID generation (e.g. `NSK-8B2A410E`)
- ✅ MongoDB Atlas cloud database
- ✅ Global error handling

---

## ⚡ Automation Pipeline (Zapier)

Every time a booking is confirmed, the system automatically triggers a **Zapier webhook** that runs the following workflow:

```
New Booking Created
       │
       ▼
┌─────────────────────┐
│  Zapier Webhook     │  ← Receives booking data from Express backend
│  (Catch Hook)       │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Google Calendar    │  ← Creates appointment event automatically
│  Create Event       │     with client name, service, start/end time
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Gmail              │  ← Sends HTML confirmation email to client
│  Send Email         │     with booking details and reminder notice
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Formatter          │  ← Converts +639XXXXXXXXX → 09XXXXXXXXX
│  (Text Replace)     │     for Philippine SMS format compatibility
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Semaphore SMS      │  ← Sends SMS confirmation to client's phone
│  (PH SMS API)       │     Works with Philippine mobile numbers
└─────────────────────┘
```

### Automation Details

| Trigger | Action | Tool |
|---|---|---|
| New booking created | Create calendar event | Google Calendar |
| New booking created | Send confirmation email | Gmail |
| New booking created | Send SMS confirmation | Semaphore (PH) |
| 24h before appointment | Send reminder SMS | Semaphore + Delay |

### Webhook Payload
The backend sends this data to Zapier on every new booking:
```json
{
  "appointment_id":   "NSK-8B2A410E",
  "client_name":      "Jassim Trinidad",
  "email":            "client@example.com",
  "phone":            "+639951057523",
  "service":          "Haircut & Beard",
  "appointment_date": "2026-05-25",
  "appointment_time": "13:00",
  "readable_date":    "Monday, May 25, 2026",
  "readable_time":    "1:00 PM",
  "event_start":      "2026-05-25T13:00:00",
  "event_end":        "2026-05-25T14:00:00"
}
```

---

## 🛠 Tech Stack

### Frontend
| Tech | Purpose |
|---|---|
| React 18 | UI framework |
| Tailwind CSS v3 | Styling |
| React Router v6 | Client-side routing |
| Axios | HTTP requests to backend |

### Backend
| Tech | Purpose |
|---|---|
| Node.js | Runtime |
| Express.js | REST API framework |
| Mongoose | MongoDB ODM |
| express-validator | Input validation |
| uuid | Unique booking ID generation |
| axios | Zapier webhook calls |

### Database
| Tech | Purpose |
|---|---|
| MongoDB Atlas | Cloud database (M0 free tier) |

### Automation
| Tech | Purpose |
|---|---|
| Zapier | Workflow automation |
| Google Calendar API | Appointment scheduling |
| Gmail | Confirmation emails |
| Semaphore | Philippine SMS reminders |

### Deployment
| Tech | Purpose |
|---|---|
| Vercel | Frontend hosting |
| Render | Backend hosting |
| MongoDB Atlas | Database hosting |

---

## 📁 Project Structure

```
noshowkiller/
├── client/                         # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── pages/
│   │   │   ├── BookingPage.jsx     # 2-step booking form
│   │   │   ├── ConfirmationPage.jsx # Success page
│   │   │   └── AdminPage.jsx       # Admin dashboard
│   │   ├── utils/
│   │   │   └── api.js              # Axios configuration
│   │   ├── App.js                  # Router setup
│   │   └── index.css               # Tailwind + custom styles
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                         # Express backend
│   ├── config/
│   │   └── db.js                   # MongoDB connection
│   ├── models/
│   │   └── Appointment.js          # Mongoose schema
│   ├── controllers/
│   │   └── appointmentController.js # Business logic + Zapier webhook
│   ├── routes/
│   │   └── appointments.js         # API routes + validation
│   ├── server.js                   # Entry point
│   └── package.json
│
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/appointments` | Create new booking |
| `GET` | `/api/appointments` | Get all appointments (with filters) |
| `GET` | `/api/appointments/stats` | Dashboard statistics |
| `GET` | `/api/appointments/available-slots?date=` | Get booked time slots |
| `PATCH` | `/api/appointments/:id/status` | Update appointment status |
| `DELETE` | `/api/appointments/:id` | Delete appointment |

---

## ⚙️ Local Development Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free)
- Zapier account (free)

### 1. Clone the repository
```bash
git clone https://github.com/Jassim3nidad/noshowkiller.git
cd noshowkiller
```

### 2. Backend setup
```bash
cd server
cp .env.example .env
# Fill in your MONGODB_URI and ZAPIER_WEBHOOK_URL in .env
npm install
npm run dev
# Runs on http://localhost:5000
```

### 3. Frontend setup
```bash
cd client
cp .env.example .env
# Set REACT_APP_API_URL=http://localhost:5000/api
npm install
npm start
# Runs on http://localhost:3000
```

### 4. Environment Variables

**server/.env**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_atlas_connection_string
ZAPIER_WEBHOOK_URL=your_zapier_webhook_url
CLIENT_URL=http://localhost:3000
```

**client/.env**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🚀 Deployment

| Service | Platform | Config |
|---|---|---|
| Frontend | Vercel | Root: `client`, Framework: Create React App |
| Backend | Render | Root: `server`, Start: `node server.js` |
| Database | MongoDB Atlas | M0 Free Tier, IP: `0.0.0.0/0` |

---

## 🔮 Planned Improvements

- [ ] JWT Authentication for admin dashboard
- [ ] Stripe payment integration (deposit to reduce no-shows)
- [ ] AI no-show prediction based on client history
- [ ] Analytics dashboard with Recharts
- [ ] Multi-staff scheduling
- [ ] Rescheduling flow via email link
- [ ] WhatsApp reminders via Twilio
- [ ] Dark mode toggle

---

## 👨‍💻 Developer

**Jassim Trinidad**
BS Computer Science
- GitHub: [@Jassim3nidad](https://github.com/Jassim3nidad)

---

## 📄 License

MIT License — feel free to use this project as a reference or template.

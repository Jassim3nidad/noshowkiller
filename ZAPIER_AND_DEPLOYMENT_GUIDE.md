# Zapier Automation + Deployment Guide
## No-Show Killer Booking Engine

---

## STEP 12 & 13 — Zapier Webhook + Automation Workflow

### What Zapier does in this system
Every time a client books an appointment, your backend sends a POST request to a
Zapier webhook URL. Zapier then automatically:
1. Creates a Google Calendar event
2. Sends a Gmail confirmation email
3. Sends a Twilio SMS confirmation
4. Schedules a Twilio SMS reminder 24 hours before the appointment

---

### How to create the Zapier workflow

#### A) Create the Webhook Trigger

1. Go to https://zapier.com → "Create Zap"
2. Trigger → search "Webhooks by Zapier" → select "Catch Hook"
3. Copy the webhook URL (looks like `https://hooks.zapier.com/hooks/catch/XXXXXXX/XXXXXXX/`)
4. Paste this URL into your server `.env` file as `ZAPIER_WEBHOOK_URL`
5. To test: run your booking form once and Zapier will catch the payload

---

#### B) Action 1 — Google Calendar Event

1. Add Action → search "Google Calendar"
2. Event: "Create Detailed Event"
3. Connect your Google account
4. Map fields:
   - Summary:        `{{appointment.service}} - {{appointment.client_name}}`
   - Start Date/Time: `{{appointment.event_start}}`  (format: `2025-06-01T14:30:00`)
   - End Date/Time:   `{{appointment.event_end}}`
   - Description:
     ```
     Appointment Details:
     Client: {{appointment.client_name}}
     Phone: {{appointment.phone}}
     Email: {{appointment.email}}
     Booking ID: {{appointment.appointment_id}}
     ```
   - Calendar: choose your shop's calendar

---

#### C) Action 2 — Gmail Confirmation Email

1. Add Action → "Gmail" → "Send Email"
2. Map fields:
   - To:      `{{appointment.email}}`
   - Subject: `Booking Confirmed — {{appointment.service}} on {{appointment.readable_date}}`
   - Body (HTML):

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="font-size: 24px; color: #18181b;">You're booked! ✂</h1>
  <p>Hi {{appointment.client_name}},</p>
  <p>Your appointment has been confirmed. Here are your details:</p>

  <div style="background: #f4f4f5; padding: 20px; border-radius: 12px; margin: 20px 0;">
    <p><strong>Service:</strong> {{appointment.service}}</p>
    <p><strong>Date:</strong> {{appointment.readable_date}}</p>
    <p><strong>Time:</strong> {{appointment.readable_time}}</p>
    <p><strong>Booking ID:</strong> {{appointment.appointment_id}}</p>
  </div>

  <p>📱 You'll also receive an SMS reminder 24 hours before your appointment.</p>
  <p>If you need to cancel, please call us at least 24 hours in advance.</p>

  <p>See you soon!<br><strong>CutHouse Team</strong></p>
</body>
</html>
```

---

#### D) Action 3 — Twilio SMS Confirmation (Immediate)

1. Add Action → "Twilio" → "Send SMS"
2. Connect your Twilio account
   - Get Account SID and Auth Token from https://console.twilio.com
   - Get a Twilio phone number (free trial available)
3. Map fields:
   - From Number: your Twilio phone number
   - To Number:   `{{appointment.phone}}`
   - Message:
     ```
     Hi {{appointment.client_name}}! Your {{appointment.service}} is confirmed for
     {{appointment.readable_date}} at {{appointment.readable_time}}.
     Booking ID: {{appointment.appointment_id}}
     — CutHouse
     ```

---

#### E) Action 4 — Twilio SMS Reminder (24 hours before)

Zapier's "Delay" step makes this easy:

1. After the Twilio confirmation step, add a "Delay by Zapier" action
2. Set it to delay until 24 hours before `{{appointment.event_start}}`
   - Action: "Delay Until"
   - Date/Time: `{{appointment.event_start}}` minus 1 day
   - Zapier will calculate this automatically with date math
3. Then add another Twilio "Send SMS" step:
   - Message:
     ```
     Reminder: You have a {{appointment.service}} appointment TOMORROW at
     {{appointment.readable_time}}. See you then! — CutHouse
     Reply CANCEL to cancel (24h notice required).
     ```

---

### Zapier Payload Reference

Your backend sends this JSON to Zapier on every new booking:

```json
{
  "appointment_id":   "NSK-A1B2C3D4",
  "client_name":      "Alex Johnson",
  "email":            "alex@example.com",
  "phone":            "+1 555 000 0000",
  "service":          "Haircut",
  "appointment_date": "2025-06-01",
  "appointment_time": "14:30",
  "readable_date":    "Sunday, June 1, 2025",
  "readable_time":    "2:30 PM",
  "event_start":      "2025-06-01T14:30:00",
  "event_end":        "2025-06-01T15:30:00"
}
```

---

## STEP 14 — Testing the Full System

### 1. Test the backend alone (using curl or Postman)

```bash
# Health check
curl http://localhost:5000/api/health

# Create a test booking
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Test User",
    "email": "test@example.com",
    "phone": "+15550001234",
    "service": "Haircut",
    "appointment_date": "2025-07-01",
    "appointment_time": "10:00"
  }'

# Get all appointments
curl http://localhost:5000/api/appointments

# Get stats
curl http://localhost:5000/api/appointments/stats

# Get available slots for a date
curl http://localhost:5000/api/appointments/available-slots?date=2025-07-01

# Update appointment status
curl -X PATCH http://localhost:5000/api/appointments/<ID>/status \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

### 2. Test double-booking prevention

```bash
# Book the same slot twice — second should return 409
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{"client_name":"A","email":"a@a.com","phone":"1234567","service":"Haircut","appointment_date":"2025-07-01","appointment_time":"10:00"}'

# This should return: 409 - "This time slot is already booked"
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{"client_name":"B","email":"b@b.com","phone":"1234567","service":"Haircut","appointment_date":"2025-07-01","appointment_time":"10:00"}'
```

### 3. Test validation errors (expect 422)

```bash
# Missing fields
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{"client_name":"No Email"}'

# Past date
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{"client_name":"A","email":"a@a.com","phone":"1234567","service":"Haircut","appointment_date":"2020-01-01","appointment_time":"10:00"}'
```

---

## STEP 15 — Deployment

### A) Deploy Frontend to Vercel

1. Push your project to GitHub
2. Go to https://vercel.com → "Add New Project"
3. Import your GitHub repository
4. Set Root Directory to `client`
5. Add environment variable:
   - `REACT_APP_API_URL` = `https://your-backend.onrender.com/api`
6. Click Deploy

```bash
# Or deploy via CLI
npm install -g vercel
cd client
vercel --prod
```

---

### B) Deploy Backend to Render

1. Go to https://render.com → "New Web Service"
2. Connect GitHub repo
3. Set:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add environment variables:
   - `MONGODB_URI`          = your MongoDB Atlas connection string
   - `ZAPIER_WEBHOOK_URL`   = your Zapier webhook URL
   - `CLIENT_URL`           = your Vercel frontend URL
   - `NODE_ENV`             = `production`
   - `PORT`                 = `5000`

---

### C) Set Up MongoDB Atlas (free tier)

1. Go to https://cloud.mongodb.com → Create account
2. Create a free M0 cluster
3. Create a database user (username + password)
4. Whitelist all IPs: `0.0.0.0/0` (for Render compatibility)
5. Click "Connect" → "Drivers" → copy the connection string
6. Replace `<password>` with your database user password
7. Paste into `MONGODB_URI` environment variable

---

## STEP 16 — Future Improvements

### 1. Authentication (JWT)
Protect the `/admin` route with login:
```
npm install jsonwebtoken bcryptjs
```
- Add a `User` model with hashed passwords
- Create `POST /api/auth/login` that returns a JWT
- Add `verifyToken` middleware to all admin routes
- Store JWT in React's `localStorage`, send in `Authorization: Bearer <token>` header

### 2. Stripe Payment Integration
Collect payment at booking time:
```
npm install @stripe/stripe-js @stripe/react-stripe-js stripe
```
- Add `PaymentElement` to BookingPage Step 2
- Create `POST /api/create-payment-intent` on backend
- Only confirm booking after payment succeeds

### 3. AI No-Show Prediction
Use a simple heuristic or call an AI API:
- Track client history (previous no-shows, late cancellations)
- Assign each new booking a "risk score"
- Auto-send extra reminders for high-risk bookings

### 4. Analytics Dashboard
Add charts to AdminPage using Recharts:
```
npm install recharts
```
- Bookings per day line chart
- Revenue by service bar chart
- No-show rate over time
- Peak hours heatmap

### 5. WhatsApp Reminders
Replace or supplement Twilio SMS with WhatsApp via Twilio's WhatsApp API:
- More open rates than SMS
- Supports rich media (images, buttons)
- Template messages for reminders

### 6. Multi-Staff Scheduling
- Add a `Staff` model and assign appointments to staff members
- Staff-specific time slot availability
- Admin can view per-staff calendars

### 7. Rescheduling Flow
- Send a rescheduling link in confirmation email
- Client can pick a new slot without calling
- Old slot becomes available again automatically

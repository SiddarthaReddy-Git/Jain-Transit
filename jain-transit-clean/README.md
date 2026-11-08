# Jain Transit — Campus Transit & Telemetry System

A modern, full-stack campus transit and telemetry platform built for **Jain University (Faculty of Engineering and Technology, Harohalli, Kanakapura Road, Bengaluru)**.

Featuring live driver GPS telemetry, stop-by-stop route checklists, occupancy meters, bay departure announcements, public BMTC/KSRTC gate departure timetables, Firebase Authentication, and an AI Transit Copilot powered by **Gemini 3.8 Flash with Google Maps Grounding**.

---

## Features

- **Google Maps Platform Integration (`@vis.gl/react-google-maps`)**:
  - Live real-time telemetry for all 5 university shuttle buses (`JT-01` through `JT-05`) with Advanced Markers, bearing indicators, and custom status popups.
  - Interactive bus selection, camera focus, street & satellite layer toggles, and student GPS location marker.
- **Role-Based Portals**:
  - **Student Lounge**: Real-time bay departures, seat reservation, boarding passes, SOS emergency requests, and city buses timetable.
  - **Driver Terminal**: Stop-by-stop route progression, in-cab walk-in passenger occupancy counters, and live GPS broadcasting.
  - **Transport Admin Control Center**: Fleet telemetry, adding and removing shuttles, dispatch triage, and booking manifests.
- **Jain University Gate City Bus Schedule (BMTC / KSRTC)**:
  - Complete 14 daily scheduled departure slots directly from Jain University Gate along the Kanakapura highway corridor.
  - Next departure countdown & live indicator.
  - Filter by operator (BMTC / KSRTC) and time periods.
  - Interactive viewer for the official gate notice sheet.
- **Firebase Authentication & Firestore Persistence**:
  - Google Sign-In popup authentication (`signInWithPopup`).
  - Real-time Firestore synchronization for seat bookings and emergency SOS dispatch alerts.
- **Gemini 3.8 Flash AI Copilot with Google Maps Grounding**:
  - Full-stack Express API proxy (`/api/chat`).
  - Google Maps grounding retrieval tool with coordinates centered around the campus and student's location.
  - Renders clickable Google Maps place cards and review snippets in a floating chat UI.

---

## Project Structure

```
├── .env.example              # Environment variables template
├── firebase-applet-config.json # Firebase configuration
├── firebase-blueprint.json   # Intermediate representation data schema
├── firestore.rules           # Security rules for Firestore
├── server.ts                 # Full-stack Express backend with Gemini API
├── public/
│   └── assets/aistudio/      # Static assets & gate timetable notice
├── src/
│   ├── components/           # Google Maps, Chatbot, Bay Boards, Checklists
│   ├── context/              # TransitContext (Firebase Auth, Firestore sync)
│   ├── pages/                # Student, Driver, Admin, and Auth pages
│   └── types/                # TypeScript interface definitions
├── package.json
└── vite.config.ts
```

---

## Getting Started Locally

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/jain-transit.git
cd jain-transit
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
PORT=3000
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## Deployment (Render / Railway / Cloud Run)

### Option A: Render (Recommended for Express + Vite)
1. Push this repository to your GitHub account.
2. Go to [Render Dashboard](https://dashboard.render.com/) and create a **New Web Service**.
3. Link your GitHub repository.
4. Set:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add `GEMINI_API_KEY`.
6. Click **Deploy Web Service**.

### Option B: Railway
1. Open [Railway](https://railway.app/) and select **New Project > Deploy from GitHub repo**.
2. Select this repository. Railway automatically detects `package.json`, runs `npm run build`, and starts `npm start`.
3. Add `GEMINI_API_KEY` under the **Variables** tab.

---

## License

Licensed under the Apache License, Version 2.0.

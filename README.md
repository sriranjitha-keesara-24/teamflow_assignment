# TeamFlow — Phase 1: Authentication & User Management

MERN stack project management + RCA tool. This is **Phase 1 of the phased build** — full authentication system, backend and frontend, no Tailwind (plain CSS).

## Structure

```
teamflow/
├── server/          # Express backend (no /src — controllers, models, routes directly)
│   ├── config/
│   ├── models/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── validators/
│   ├── app.js
│   └── server.js
└── client/           # React (Vite) frontend, plain CSS
    └── src/
        ├── components/auth/
        ├── context/
        ├── hooks/
        ├── pages/
        ├── services/
        ├── styles/
        └── utils/
```

## Setup

### Backend
```bash
cd server
npm install
cp .env.example .env   # fill in MongoDB URI, JWT secrets, email credentials
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:5000`.

## What's included in Phase 1

- Register with email verification
- Login with JWT access token (15 min) + refresh token (7 days, httpOnly cookie, rotated on use)
- Auto-refresh on token expiry (frontend axios interceptor)
- Forgot password / reset password via email
- Logout + logout from all devices
- Role-based access control (Admin, Manager, Developer) — middleware ready, applied per-route in later phases
- Rate limiting on auth endpoints
- Centralized error handling
- Clean, responsive login/register UI (plain CSS, no framework)

## Next phases

- **Phase 2**: Project Management (CRUD, members, dashboard)
- **Phase 3**: Task Management (Kanban, list, calendar views)
- **Phase 4**: Task Dependencies
- **Phase 5**: Comments, Activity Log, File Attachments
- **Phase 6**: RCA + Review Workflow
- **Phase 7**: Notifications (Socket.io + email)
- **Phase 8**: Reports & Analytics + Admin Panel
- **Phase 9**: Polish (dark mode, global search, empty states) + Security hardening

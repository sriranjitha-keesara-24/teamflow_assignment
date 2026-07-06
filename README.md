# TeamFlow

A full-stack project management and Root Cause Analysis (RCA) tool built with the MERN stack. TeamFlow enables teams to plan projects, track tasks across multiple views, run structured incident reviews, and stay aligned with real-time notifications — all from a single workspace.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Features Implemented](#features-implemented)
- [Assumptions Made During Implementation](#assumptions-made-during-implementation)
- [Known Limitations](#known-limitations)
- [API Reference](#api-reference)
- [Documentation](#documentation)

---

## Project Overview

TeamFlow is a collaborative project management platform designed for software engineering teams. It combines task tracking, dependency management, root cause analysis workflows, and analytics reporting into a unified interface. The application follows a client–server architecture with a React frontend communicating with a Node.js/Express backend, backed by MongoDB for data persistence.

**Key highlights:**

- Multi-view task management (Kanban board, list view, calendar view, dependency graph)
- Structured RCA workflow with multi-stage review lifecycle
- Real-time notifications via Socket.IO
- Role-based access control (Admin, Manager, Developer)
- Project-level analytics dashboards with CSV export
- Responsive dark-themed UI built with vanilla CSS (no CSS framework)

---

## Tech Stack

| Layer       | Technology                                                    |
| ----------- | ------------------------------------------------------------- |
| Frontend    | React 18, Vite, React Router v6, Axios, Socket.IO Client     |
| Backend     | Node.js, Express 4, Mongoose 8, Socket.IO                    |
| Database    | MongoDB (Atlas or local)                                      |
| Auth        | JWT (access + refresh tokens), bcryptjs, httpOnly cookies     |
| File Upload | Cloudinary, Multer                                            |
| Email       | Nodemailer (SMTP)                                             |
| Scheduling  | node-cron (deadline reminder jobs)                            |
| Security    | Helmet, CORS, express-rate-limit, express-validator, Joi      |
| DevOps      | Docker Compose                                                |
| Styling     | Vanilla CSS (custom design system with CSS variables)         |

---

## Project Structure

```
teamflow/
├── client/                     # React (Vite) frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/          # User management panel
│   │   │   ├── analytics/      # Report charts & export
│   │   │   ├── attachments/    # File upload components
│   │   │   ├── auth/           # Login, Register, Protected Route
│   │   │   ├── common/         # Shared UI components
│   │   │   ├── layout/         # App shell, sidebar, header
│   │   │   ├── notifications/  # Real-time notification UI
│   │   │   ├── projects/       # Project cards, modals, members
│   │   │   ├── rca/            # RCA forms, details, modals
│   │   │   ├── reviews/        # Review panel
│   │   │   ├── search/         # Global search
│   │   │   └── task/           # Kanban, list, calendar, dependencies
│   │   ├── context/            # AuthContext (React Context API)
│   │   ├── hooks/              # Custom hooks (useAuth, etc.)
│   │   ├── pages/              # Route-level page components
│   │   ├── services/           # Axios API service modules
│   │   ├── styles/             # Global CSS, variables, page styles
│   │   └── utils/              # Validators, helpers
│   ├── .env                    # Frontend environment config
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Express backend
│   ├── config/                 # DB connection, env loader, Cloudinary
│   ├── controllers/            # Route handlers
│   ├── middleware/              # Auth, RBAC, error handling, rate limit
│   ├── models/                 # Mongoose schemas (11 models)
│   ├── routes/                 # Express route definitions
│   ├── Services/               # Business logic services
│   ├── sockets/                # Socket.IO notification server
│   ├── jobs/                   # Cron job schedulers
│   ├── utils/                  # Email sender, helpers
│   ├── validators/             # Request validation schemas
│   ├── public/uploads/         # Local file uploads directory
│   ├── app.js                  # Express app configuration
│   ├── server.js               # Entry point (starts server + cron)
│   ├── .env.example            # Environment variable template
│   └── package.json
│
├── docs/                       # Project documentation
│   ├── ERD.png                 # Entity Relationship Diagram
│   ├── architecture-diagram.png
│   ├── api-overview.md
│   ├── business-rules.md
│   └── design-decision-log.md
│
├── docker-compose.yml          # Multi-container deployment
└── README.md
```

---

## Setup Instructions

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) cloud cluster
- **Cloudinary** account (for file/image uploads)
- **SMTP email credentials** (e.g., Gmail App Password) for verification and password reset emails

### 1. Clone the Repository

```bash
git clone <repository-url>
cd teamflow
```

### 2. Backend Setup

```bash
cd server
npm install
cp .env.example .env
```

Open `.env` and fill in all required values (see [Environment Variables](#environment-variables) below).

```bash
npm run dev        # Starts server with nodemon on port 5000
```

### 3. Frontend Setup

```bash
cd client
npm install
```

Create a `.env` file if it does not exist:

```
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

```bash
npm run dev        # Starts Vite dev server on port 5173
```

### 4. Docker Deployment (Optional)

To run the entire stack (MongoDB + Server + Client) using Docker:

```bash
docker-compose up --build
```

This spins up three containers on a shared `teamflow-network` bridge:

| Service  | Container              | Port  |
| -------- | ---------------------- | ----- |
| MongoDB  | `teamflow-mongodb`     | 27017 |
| Server   | `teamflow-server`      | 5000  |
| Client   | `teamflow-client`      | 5173  |

---

## Environment Variables

### Server (`server/.env`)

| Variable             | Description                                       | Example                                  |
| -------------------- | ------------------------------------------------- | ---------------------------------------- |
| `NODE_ENV`           | Environment mode                                  | `development`                            |
| `PORT`               | Server port                                       | `5000`                                   |
| `MONGO_URI`          | MongoDB connection string                         | `mongodb://127.0.0.1:27017/teamflow`     |
| `JWT_ACCESS_SECRET`  | Secret key for signing access tokens              | `your_access_secret_key`                 |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens             | `your_refresh_secret_key`                |
| `JWT_ACCESS_EXPIRES` | Access token expiry duration                      | `15m`                                    |
| `JWT_REFRESH_EXPIRES`| Refresh token expiry duration                     | `7d`                                     |
| `CLIENT_URL`         | Allowed frontend origin for CORS                  | `http://localhost:5173`                  |
| `EMAIL_HOST`         | SMTP mail server host                             | `smtp.gmail.com`                         |
| `EMAIL_PORT`         | SMTP mail server port                             | `587`                                    |
| `EMAIL_USER`         | SMTP login email                                  | `your_email@gmail.com`                   |
| `EMAIL_PASS`         | SMTP login password (App Password for Gmail)      | `your_app_password`                      |
| `EMAIL_FROM`         | Sender display name and address                   | `TeamFlow <no-reply@teamflow.com>`       |

### Client (`client/.env`)

| Variable              | Description                    | Example                                  |
| --------------------- | ------------------------------ | ---------------------------------------- |
| `VITE_API_BASE_URL`   | Backend API base URL           | `http://localhost:5000/api/v1`           |

---

## Features Implemented

### Authentication & User Management
- User registration with email verification (token-based)
- Login with JWT access token (15 min) + refresh token (7 days) stored in httpOnly cookies
- Automatic token refresh via Axios interceptors on 401 responses
- Forgot password and reset password via email link
- Logout and logout from all devices (invalidates all refresh tokens)
- User profile management (avatar, bio, phone, skills)
- Role-based access control — Admin, Manager, Developer

### Project Management
- Create, update, delete, and archive projects
- Project members with roles (Lead, Member, Viewer)
- Add/remove members from projects
- Project status tracking (Active, On Hold, Completed, Archived)
- Priority levels (Low, Medium, High, Critical)

### Task Management
- Full CRUD operations for tasks within projects
- **Kanban Board** — drag-and-drop cards between status columns
- **List View** — sortable, filterable task table
- **Calendar View** — tasks plotted by due date
- **Dependency Graph** — visual predecessor/successor mapping
- Subtask checklists with toggle completion
- Task assignment to multiple team members
- Task status workflow: Todo → In Progress → Review → Completed
- Task reordering (drag-and-drop within columns)
- Task templates for reusable task blueprints
- Time logging with start/stop timer
- Recurrence settings (None, Daily, Weekly, Monthly)
- Status history tracking

### Task Dependencies
- Predecessor/successor relationship management
- Blocking rule enforcement — tasks cannot be completed if predecessors are incomplete
- Dependency visualization in graph view

### Comments & Collaboration
- Threaded comments on tasks
- @mention users in comments
- Edit and delete comments
- Comment mention notifications

### File Attachments
- Upload files to tasks and RCAs
- Cloudinary integration for cloud file storage
- File metadata tracking (type, size, uploader)

### Root Cause Analysis (RCA)
- Create RCA reports linked to projects and optionally to tasks
- Multi-stage review workflow: Draft → Submitted → Under Review → Approved / Rejected / Needs Revision
- Reviewer assignment and reassignment
- RCA escalation to managers
- Self-review prevention — submitter cannot review their own RCA
- Status locking — submitted RCAs are read-only until revision is requested
- Mandatory reviewer comments on rejection

### Reviews
- Formal review records for each RCA decision
- Review history with timestamps

### Notifications
- Real-time notifications via Socket.IO WebSocket
- Notification types: task assigned, status changed, comment mention, RCA submitted, review outcome, deadline approaching, project invite
- Mark as read / mark all as read
- Notification preferences per user (toggle individual notification types)

### Reports & Analytics
- Project dashboard with aggregated analytics
- Task status distribution
- Project health indicators
- Trend analysis over time
- CSV export for tasks and RCA data

### Admin Panel
- System-wide user list (Admin only)
- Activate / deactivate user accounts
- Activity audit log viewer
- Admin cannot deactivate their own account

### Scheduled Jobs
- Daily deadline reminder cron job (runs at 8:00 AM)
- Scans for approaching deadlines and sends notifications

### UI & Design
- Dark-themed responsive interface
- Custom CSS design system with CSS variables (no Tailwind or CSS frameworks)
- Custom SVG charts (zero charting library dependencies)
- Animated transitions and micro-interactions
- Global search across projects and tasks
- Empty states and loading indicators

---

## Assumptions Made During Implementation

1. **Single-tenant deployment** — The application is designed for a single organization. There is no multi-tenancy or organization-level isolation.

2. **MongoDB as primary database** — All data is stored in MongoDB using Mongoose ODM. No SQL database or caching layer (e.g., Redis) is used.

3. **Email service availability** — A working SMTP server (e.g., Gmail with App Passwords) is required for email verification and password reset functionality. If email is not configured, these features will fail silently or throw errors.

4. **Cloudinary for file storage** — File uploads depend on Cloudinary credentials. Local file storage (`public/uploads/`) is used as a fallback for development, but Cloudinary is the intended production storage.

5. **Single server deployment** — The application assumes a single server instance. Socket.IO is not configured with a Redis adapter, so WebSocket connections are not distributed across multiple server instances.

6. **Browser-based access only** — The frontend is built as a single-page web application. There are no native mobile apps or dedicated API documentation endpoints (e.g., Swagger).

7. **Trusted network for development** — CORS is configured to allow `localhost` origins in development. Production deployments should restrict `CLIENT_URL` to the actual domain.

8. **No automated testing** — The codebase does not include unit tests, integration tests, or end-to-end tests. Manual testing was used during development.

9. **JWT in cookies** — Authentication tokens are stored in httpOnly cookies rather than localStorage, assuming the browser automatically sends cookies with each request (requires `credentials: true` in CORS).

10. **User roles are static** — Roles (Admin, Manager, Developer) are assigned at registration or by an Admin. There is no self-service role upgrade mechanism.

11. **Time zone handling** — All dates and timestamps use the server's default time zone (UTC via MongoDB). No explicit time zone conversion is performed for the frontend display.

---

## Known Limitations

1. **No automated test suite** — There are no unit, integration, or E2E tests. All testing was done manually.

2. **No Redis or caching** — Frequently accessed data (e.g., notifications, project lists) is always fetched from MongoDB. There is no caching layer to optimize repeated queries.

3. **Socket.IO not horizontally scalable** — WebSocket connections are handled by a single server process. Scaling to multiple server instances would require a Socket.IO Redis adapter.

4. **No rate limiting on all endpoints** — Rate limiting is applied to authentication endpoints only. Other API endpoints are not rate-limited.

5. **No pagination on some endpoints** — Certain list endpoints (e.g., notifications, activity logs) return all records without server-side pagination, which could cause performance issues at scale.

6. **File upload size not strictly enforced** — While Multer is used for file uploads, there is no global file size limit or virus scanning on uploaded files.

7. **No audit trail for all actions** — Activity logging covers major actions but may not capture every field-level change on all entities.

8. **No OAuth / SSO** — Authentication supports only email-password login. Social logins (Google, GitHub, etc.) and enterprise SSO (SAML, OIDC) are not implemented.

9. **No email queue** — Emails (verification, password reset, notifications) are sent synchronously within request handlers. High email volume could slow down API responses.

10. **Limited search capabilities** — Global search uses MongoDB text indexes. It does not support fuzzy matching, typo tolerance, or relevance ranking (e.g., Elasticsearch).

11. **No data backup or migration tooling** — There are no automated database backup scripts or schema migration tools included.

12. **CSV export only** — Report exports are limited to CSV format. PDF, Excel, or chart image exports are not supported.

13. **No PWA / offline support** — The application requires an active internet connection. There is no service worker or offline caching.

---

## API Reference

For a complete list of all REST API endpoints, see [`docs/api-overview.md`](docs/api-overview.md).

Base URL: `/api/v1`

| Module          | Base Route                              |
| --------------- | --------------------------------------- |
| Authentication  | `/api/v1/auth`                          |
| Users / Admin   | `/api/v1/users`                         |
| Projects        | `/api/v1/projects`                      |
| Tasks           | `/api/v1/projects/:projectId/tasks`     |
| Comments        | `/api/v1/tasks/:taskId/comments`        |
| Attachments     | `/api/v1/attachments`                   |
| RCA             | `/api/v1/rca`, `/api/v1/projects/:projectId/rca` |
| Notifications   | `/api/v1/notifications`                 |
| Reports         | `/api/v1/projects/:projectId/reports`   |
| Search          | `/api/v1/search`                        |
| Task Templates  | `/api/v1/projects/:projectId/templates` |

---

## Documentation

| Document                                                       | Description                                     |
| -------------------------------------------------------------- | ----------------------------------------------- |
| [`docs/api-overview.md`](docs/api-overview.md)                 | Complete REST API endpoint reference             |
| [`docs/business-rules.md`](docs/business-rules.md)             | Core operational and business rules              |
| [`docs/design-decision-log.md`](docs/design-decision-log.md)   | Architectural and technical design decisions      |
| [`docs/ERD.png`](docs/ERD.png)                                 | Entity Relationship Diagram (11 collections)     |
| [`docs/architecture-diagram.png`](docs/architecture-diagram.png) | System Architecture Diagram                    |

---

## License

This project was built as an academic / assignment project. No license is specified.

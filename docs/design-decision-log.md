# TeamFlow Design Decision Log

This document lists the architectural and technical design decisions made during the development of TeamFlow.

---

## 1. Custom SVG Charting (Frontend)

- **Decision**: Render graphics directly using custom SVG React elements rather than installing heavy dependencies like Recharts or Chart.js.
- **Rationale**:
  - Zero package footprint and fast page load times.
  - 100% responsive and styling matches existing CSS parameters exactly.
  - Bypasses Node/Vite dependency resolving problems in offline test settings.

---

## 2. Cookie-based JWT Session Management

- **Decision**: Token storage in `httpOnly` secure cookies.
- **Rationale**:
  - Defends session tokens from Cross-Site Scripting (XSS) client-side reads.
  - Browser automatically appends cookies to requests, streamlining network handling.

---

## 3. Root Cause Analysis (RCA) Review Flow

- **Decision**: Multi-stage review statuses: `Draft` -> `Submitted` -> `Under Review` -> (`Approved` | `Rejected` | `Needs Revision`).
- **Rationale**:
  - Implements operational safeguards ensuring incident review verification prior to closing out work.
  - Reviewer constraints stop changes after submission to preserve historical records.

---

## 4. Node-Cron for Task Deadline Reminders

- **Decision**: Backend task scheduler scanning database records every day at 8 AM.
- **Rationale**:
  - Moves heavy processing of deadline evaluations from request cycles.
  - Asynchronously sends real-time dashboard socket alerts and emails.

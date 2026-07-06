# TeamFlow API Overview

This document provides a summary of the backend REST endpoints available in the TeamFlow application.

All requests should be sent to the base URL: `/api/v1`

---

## Authentication Endpoints (`/auth`)

- **POST `/auth/register`**: Registers a new user.
- **POST `/auth/login`**: Authenticates user and returns JWT token in cookie.
- **POST `/auth/logout`**: Invalidates user token.
- **POST `/auth/forgot-password`**: Sends reset-password link via email.
- **POST `/auth/reset-password/:token`**: Resets password using token.
- **POST `/auth/verify-email/:token`**: Verifies user email.

---

## Project Endpoints (`/projects`)

- **GET `/projects`**: Fetch all projects the user is a member/owner of.
- **POST `/projects`**: Create a new project.
- **GET `/projects/:id`**: Get single project details (including members).
- **PUT `/projects/:id`**: Update project details.
- **DELETE `/projects/:id`**: Delete a project.
- **PUT `/projects/:id/archive`**: Toggles archive status of a project.

---

## Task Endpoints (`/projects/:projectId/tasks`)

- **GET `/projects/:projectId/tasks`**: Retrieve all tasks inside a project.
- **POST `/projects/:projectId/tasks`**: Create a task inside a project.
- **GET `/projects/:projectId/tasks/:id`**: Fetch a single task.
- **PUT `/projects/:projectId/tasks/:id`**: Update task fields.
- **DELETE `/projects/:projectId/tasks/:id`**: Delete a task.
- **PATCH `/projects/:projectId/tasks/:id/status`**: Quickly update task status.
- **PUT `/projects/:projectId/tasks/reorder`**: Reorder tasks for drag-and-drop.
- **POST `/projects/:projectId/tasks/:id/subtasks`**: Add subtask checklist item.
- **PATCH `/projects/:projectId/tasks/:id/subtasks/:subtaskId/toggle`**: Toggle subtask completed status.
- **POST `/projects/:projectId/tasks/dependencies`**: Add successor/predecessor task relation.
- **GET `/projects/:projectId/tasks/dependencies`**: Fetch the dependency mapping chart nodes.

---

## Root Cause Analysis Endpoints (`/rca`)

- **GET `/rca`**: Fetch all RCAs across user projects.
- **GET `/projects/:projectId/rca`**: Fetch RCAs for a specific project.
- **POST `/projects/:projectId/rca`**: Create a new RCA report.
- **GET `/rca/:id`**: Get a single RCA details.
- **PUT `/rca/:id`**: Update an RCA (Draft or Needs Revision states only).
- **PUT `/rca/:id/submit`**: Submit RCA for assignee review.
- **PUT `/rca/:id/review`**: Decision RCA (Approve/Reject/Needs Revision) - Reviewer only.
- **PUT `/rca/:id/reassign`**: Reassign review responsibility.
- **PUT `/rca/:id/escalate`**: Escalate review to Manager/Lead.

---

## Analytics & Reporting Endpoints (`/projects/:projectId/reports`)

- **GET `/projects/:projectId/reports/dashboard`**: Fetch analytics aggregates (status distribution, health indicator, trend array).
- **GET `/projects/:projectId/reports/export?type=tasks|rca`**: Export project items as CSV file downloads.

---

## Admin Endpoints (`/users/admin`)

- **GET `/users/admin/list`**: Fetch list of all registered users (Admin only).
- **GET `/users/admin/audit-logs`**: Fetch activity log array (`ActivityLog`) for system monitoring (Admin only).
- **PUT `/users/:id/status`**: Toggle user account active status (Admin only).

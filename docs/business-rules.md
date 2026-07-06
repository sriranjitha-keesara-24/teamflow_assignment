# TeamFlow Business Rules Reference

This document summarizes the core operational regulations enforced by the application's client and server.

---

## 1. Task Dependency & Blocking Rules

- **Predecessor Blocking**: A task containing predecessor dependencies cannot be marked as `Completed` or dragged to the `Completed` column if its predecessors are not in the `Completed` state.
- **Rule Enforcement**: Evaluated on backend PUT/PATCH requests by querying the `TaskRelation` model. Violations return a `400 Bad Request` block message: *"Cannot complete task. Predecessor task is still incomplete."*

---

## 2. Root Cause Analysis (RCA) Review Rules

- **Role Limitation**: Only the designated reviewer (or a system Admin) can review a submitted RCA.
- **Self-Review Prevention**: Submitter of an RCA cannot assign themselves as the reviewer.
- **Status Locking**: When an RCA is submitted, it is locked (cannot be edited) unless its status changes back to `Needs Revision`.
- **Decision Feedback**: If a reviewer decisions an RCA as `Rejected` or `Needs Revision`, they **must** fill in comments explaining the decision.

---

## 3. User Administration Rules

- **Deactivation Restriction**: Admins cannot deactivate their own active user profile.
- **Role Assignment**: Only an existing Admin can view the system user database and toggle activation flags.

---

## 4. Project Life Cycle & Archive Status

- **Read-Only Archive**: Archiving a project pauses all modifications. No tasks can be created, updated, or reordered within an archived project.

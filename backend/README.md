# Online test API

The backend uses Express and MySQL. It provides authentication, role authorization, active test assignment, one-time attempts, server-side scoring, feedback, and admin management.

## MySQL setup

1. Copy `.env.example` to `.env`.
2. Set `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, and a strong `JWT_SECRET`.
3. Install dependencies and initialize the schema:

```bash
npm install
npm run db:seed
npm run dev
```

`db:seed` creates the `online_test` database/tables and inserts local development accounts and one assigned assessment.

If you already created the previous JSON/MySQL schema, run `sql/migrate-existing.sql` once before `npm run db:seed`.

## Development accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@quizly.test` | `Admin123!` |
| Learner | `learner@quizly.test` | `Learner123!` |

Change these credentials before using the application outside local development.

## Routes

### Authentication

- `POST /api/auth/login`
- `GET /api/auth/me`

Login returns an 8-hour JWT. Protected routes require `Authorization: Bearer <token>`.

### Learner

- `GET /api/learner/active-test`
- `POST /api/attempts/:testId`
- `POST /api/feedback`
- `POST /api/attempts/:testId/events`

Learners never receive answer keys or scores. Each learner/test pair has a unique database constraint, so a test can only be submitted once.
The browser records tab visibility changes, window blur, fullscreen exits, copy, paste, and context-menu attempts as exam events. These controls are detection and audit signals, not a way to guarantee prevention of operating-system-level app switching.

### Admin

- `GET /api/admin/dashboard`
- `GET /api/admin/learners`
- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `PATCH /api/admin/categories/:categoryId`
- `DELETE /api/admin/categories/:categoryId`
- `GET /api/admin/tests`
- `POST /api/admin/tests`
- `POST /api/admin/tests/:testId/questions`
- `POST /api/admin/tests/:testId/questions/manual`
- `PATCH /api/admin/tests/:testId`
- `DELETE /api/admin/tests/:testId`
- `GET /api/admin/results`
- `GET /api/admin/monitoring`
- `GET /api/admin/feedback`

Only one test can be active at a time. Tests can be assigned to specific learner IDs.

# Online test API

The backend uses Express and MySQL. It provides authentication, role authorization, active test assignment, one-time attempts, server-side scoring, feedback, and admin management.

## MySQL setup

1. Set `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, and a strong `JWT_SECRET` in `.env.production`.
3. Install dependencies and initialize the schema:

```bash
npm install
npm run db:seed
npm run dev
```

`db:seed` reads the four Excel workbooks in the repository root, creates the Med 10+1, Med 10+2, Non-Med 10+1, and Non-Med 10+2 categories/tests, and imports each question with its section, options A-D, and answer key. Learners select their class/stream during registration and are assigned only the matching active test.

The importer accepts a question sheet with `Section`, `Question`, `Option A`, `Option B`, `Option C`, `Option D`, and an answer-key column. It skips title/notes rows and supports separate worksheets when a workbook includes them.

If you already created the previous JSON/MySQL schema, run `sql/migrate-existing.sql` once before `npm run db:seed`.

## Development accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@quizly.test` | `Admin123!` |
| Learner | Register through the learner page | — |

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

Tests can be active independently per class/stream category and can be assigned to specific learner IDs.

The browser disables text selection, copying, pasting, and context menus while an exam is running and records attempted violations. Browser code cannot guarantee prevention of operating-system screenshots or photographs; preventing those requires a managed exam device or proctoring software.

# Quizly frontend

The frontend is a React + Vite dashboard for an online testing platform. It currently uses local mock data so the UI can be completed independently of the backend.

## Run locally

```bash
npm install
npm run dev
```

Production checks:

```bash
npm run lint
npm run build
```

## Structure

- `src/pages/` - page-level compositions such as `DashboardPage`
- `src/components/` - reusable UI components
- `src/hooks/` - reusable state and filtering logic
- `src/data/` - temporary mock data, ready to be replaced by API services

Tailwind CSS v4 is already configured through `@tailwindcss/vite` in `vite.config.js` and imported in `src/index.css`.

# FikrNot frontend

React and Vite client for the existing FikrNot API. The backend remains the source of truth for authentication, report data, claims, recovery, hostels and analytics.

## Run locally

1. Start the backend on `http://localhost:5000`.
2. Copy `.env.example` to `.env` if the API is hosted elsewhere and set `VITE_API_URL`.
3. Run `npm install` and `npm run dev`.

Vite uses port `3000` to match the backend's configured CORS origin. Production build: `npm run build`.

## Structure

- `src/api/` holds all Axios calls and endpoint paths.
- `src/components/` contains shared UI and item/claim components.
- `src/context/` restores the authenticated user session.
- `src/App.jsx` currently contains page compositions and the route tree.
- `src/routes/` contains role and session guards.
- `src/styles/` contains the shared visual system and responsive rules.

## Known backend dependencies

- `GET /api/hostels` currently requires authentication (`401` without a token), which prevents an unauthenticated student from selecting a hostel during registration.
- The backend has no Rector claims-list endpoint, so the UI cannot load a review queue or offer claim-specific review actions in the Rector dashboard.
- Lost and found list services do not filter by location area. Browse supports category, status, hostel, item name and date range; location-area filtering requires a backend query contract.

These are recorded as backend dependencies; no backend or backup frontend files were changed.

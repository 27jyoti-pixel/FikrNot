# FikrNot frontend

React and Vite client for the existing FikrNot API. The backend remains the source of truth for authentication, report data, claims, recovery, hostels and analytics.

## Run locally

1. Start the backend on `http://localhost:5000`.
2. Copy `.env.example` to `.env` when configuring a custom API origin. `VITE_API_URL` is the backend origin without `/api`; the client adds `/api` and avoids duplicating it if supplied.
3. Run `npm install` and `npm run dev`.

Vite uses port `3000` to match the backend's configured CORS origin. Production build: `npm run build`.

For the Render frontend service, set `VITE_API_URL=https://fikrnot-4xsa.onrender.com`. Rebuild and redeploy the frontend after changing this value. If it is unset, development uses `http://localhost:5000`; production uses the deployed backend URL.

The Rector sign-in page displays the intentionally public demo credentials `rector@gmail.com` / `rector123` with copy controls. It marks access ready and enables **Explore Rector Demo** only after the backend confirms that the reserved account is provisioned and its password hash matches. The quick-demo action creates a session through the normal backend authentication flow. See the backend README for Render environment variables and isolated demo-hostel provisioning steps.

## Structure

- `src/api/` holds all Axios calls and endpoint paths.
- `src/components/` contains shared UI and item/claim components.
- `src/context/` restores the authenticated user session.
- `src/App.jsx` currently contains page compositions and the route tree.
- `src/routes/` contains role and session guards.
- `src/styles/` contains the shared visual system and responsive rules.

## Known backend dependencies

- `GET /api/hostels` is public and returns active hostels in the standard `{ data: [...] }` response envelope used by registration.
- The backend has no Rector claims-list endpoint, so the UI cannot load a review queue or offer claim-specific review actions in the Rector dashboard.
- Lost and found list services do not filter by location area. Browse supports category, status, hostel, item name and date range; location-area filtering requires a backend query contract.

These notes describe separate functionality outside the API URL and CORS fixes.

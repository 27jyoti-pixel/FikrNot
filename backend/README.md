# FikrNot — Backend Documentation

**FikrNot** is a Hostel Lost & Found Smart Item Recovery Platform built for hostel residents and campus students.

---

## 1. Architecture Overview

```
Client / HTTP Request
         │
         ▼
  Express Router
         │
         ▼
Middlewares (JWT Auth, Role Check, Hostel Authorization, Express-Validator, Upload)
         │
         ▼
    Controller (HTTP handling only, thin layer)
         │
         ▼
 Service Layer (Business logic, status transitions, notifications, matching calls)
         │
         ▼
 Mongoose Models (User, Hostel, LostReport, FoundReport, Match, Claim, Notification)
         │
         ▼
    MongoDB
```

---

## 2. Backend Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── cloudinary.js
│   │   ├── db.js
│   │   └── env.js
│   ├── controllers/
│   │   ├── analyticsController.js
│   │   ├── authController.js
│   │   ├── claimController.js
│   │   ├── foundController.js
│   │   ├── hostelController.js
│   │   ├── lostController.js
│   │   ├── matchController.js
│   │   ├── moderationController.js
│   │   ├── notificationController.js
│   │   ├── recoveryController.js
│   │   └── userController.js
│   ├── docs/
│   │   └── api.md
│   ├── middlewares/
│   │   ├── authMiddleware.js
│   │   ├── errorMiddleware.js
│   │   ├── roleMiddleware.js
│   │   ├── uploadMiddleware.js
│   │   └── validationMiddleware.js
│   ├── models/
│   │   ├── Claim.js
│   │   ├── FoundReport.js
│   │   ├── Hostel.js
│   │   ├── LostReport.js
│   │   ├── Match.js
│   │   ├── Notification.js
│   │   └── User.js
│   ├── routes/
│   │   ├── analyticsRoutes.js
│   │   ├── authRoutes.js
│   │   ├── claimRoutes.js
│   │   ├── foundRoutes.js
│   │   ├── hostelRoutes.js
│   │   ├── lostRoutes.js
│   │   ├── matchRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── recoveryRoutes.js
│   │   └── userRoutes.js
│   ├── seed/
│   │   └── seed.js
│   ├── services/
│   │   ├── analytics/
│   │   │   └── analyticsService.js
│   │   ├── auth/
│   │   │   └── authService.js
│   │   ├── claims/
│   │   │   └── claimService.js
│   │   ├── found/
│   │   │   └── foundService.js
│   │   ├── lost/
│   │   │   └── lostService.js
│   │   ├── matching/
│   │   │   └── matchingEngine.js
│   │   ├── moderation/
│   │   │   └── moderationService.js
│   │   ├── notifications/
│   │   │   └── notificationService.js
│   │   └── recovery/
│   │       └── recoveryService.js
│   ├── uploads/
│   ├── utils/
│   │   ├── apiResponse.js
│   │   ├── asyncWrapper.js
│   │   ├── statusTransitions.js
│   │   └── validators.js
│   └── app.js
├── server.js
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 3. Setup & Installation

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB instance running locally on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI

### Installation
```bash
cd backend
npm install
```

### Environment Variables (.env)
Create a `.env` file in `backend/` using `.env.example`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/fikrnot
JWT_SECRET=fikrnot_super_secret_jwt_key_2026_change_in_production
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=demo_cloud
CLOUDINARY_API_KEY=1234567890
CLOUDINARY_API_SECRET=demo_secret
CLIENT_URL=https://fikrnot-1.onrender.com
```

`CLIENT_URL` may contain comma-separated additional origins. CORS always permits the deployed FikrNot frontend and local Vite development origins (`http://localhost:3000` and `http://localhost:5173`). On Render, set `CLIENT_URL=https://fikrnot-1.onrender.com`.

### Demo Rector access

On the backend Render service, set `DEMO_RECTOR_EMAIL`, `DEMO_RECTOR_PASSWORD`, and `DEMO_HOSTEL_NAME`. Choose `DEMO_HOSTEL_NAME` from a hostel that already exists in the target database, is active, has no Rector assignment, and has no users or lost/found reports; copy its exact name from Atlas. Do not use the inactive legacy `Shivaji Hostel` or `Tagore Hostel`, and do not activate or rename a real hostel for the demo. Keep database credentials and JWT secrets only in the backend service environment; never add them to frontend variables.

To provision against MongoDB Atlas, first confirm the backend Render service's `MONGODB_URI` points to the intended Atlas cluster and database, and that its network access list allows the command's execution environment. Set the three demo variables on that same backend service. After those settings are saved, open the backend service shell in Render and run:

```sh
npm run provision:demo-rector
```

The command uses the backend service's configured `MONGODB_URI`. For a new account, it requires the exact configured hostel to exist, be active and unassigned, and contain no users or lost/found reports. It creates or updates only the reserved Demo Rector account and uses the User model's normal save hook to store a bcrypt hash. It never creates or activates hostels, prints the password, or modifies unrelated accounts. Re-running it is safe. It refuses an email collision, a conflicting reserved employee ID, a different existing Rector assignment, or a missing/inactive/mismatched/occupied hostel.

The public Rector login page displays the dedicated public demo email and password with copy controls. The page separately calls `GET /api/auth/demo-credentials`; it marks demo access ready only after the endpoint verifies that the account is active, has the reserved `DEMO-RECTOR` marker, belongs to the configured demo hostel, and that its stored password hash matches the configured password. Until then, the credentials remain visible but the quick-demo button stays disabled and the page reports that setup is unverified. The endpoint never returns credentials for another Rector.

The **Explore Rector Demo** button calls `POST /api/auth/demo-rector`. The backend verifies the same account through the normal password comparison and issues the usual JWT only after the role, marker, and hostel checks pass. Normal Rector sign-in continues to use `POST /api/auth/login`.

Render deployment and verification:

1. Set `DEMO_RECTOR_EMAIL`, `DEMO_RECTOR_PASSWORD`, and the exact active `DEMO_HOSTEL_NAME` on the backend Render service. Confirm `MONGODB_URI` targets the intended Atlas database. Save the changes and trigger a backend redeploy/restart so the running process receives them.
2. From the backend service shell, run `npm run provision:demo-rector`. Success reports the active hostel name, without printing the email, password, or database URI.
3. Verify `GET https://fikrnot-4xsa.onrender.com/api/auth/demo-credentials` returns HTTP 200 and the configured demo email. This endpoint intentionally returns the demo password only after database checks; do not paste its response into logs or public channels. Verify `POST /api/auth/demo-rector` returns HTTP 200 with a Rector user and token. The frontend's Explore Rector Demo action uses this same login endpoint.
4. If `GET /api/auth/demo-credentials` returns `DEMO_RECTOR_CONFIG_MISSING`, check that all variables are on the backend service (not the frontend/static site), save, and restart/redeploy the backend. `DEMO_RECTOR_ACCOUNT_NOT_PROVISIONED` means configuration was loaded but step 2 has not succeeded; hostel and password mismatch diagnostic codes indicate the provisioned record needs investigation.
5. Set `CLIENT_URL=https://fikrnot-1.onrender.com` on the backend. Set `VITE_API_URL=https://fikrnot-4xsa.onrender.com` on the frontend and rebuild/redeploy it so the production bundle uses the backend origin.

---

## 4. Running the Backend & Seeding Data

### Seed Development Data
```bash
npm run seed
```

### Start Server (Development mode with nodemon)
```bash
npm run dev
```

### Start Server (Production mode)
```bash
npm start
```

---

## 5. Core Business Workflows

### Authentication & Roles
- **STUDENT**: Self-registration, item reporting, campus-wide browsing, claim submission, recovery confirmation.
- **RECTOR**: Hostel-scoped management, physical item receipt, claim review (Approve/Reject/Request Info), student activation/deactivation in assigned hostel.

### Matching Engine (`natural` Jaro-Winkler)
1. **Category Gate**: If categories differ, score = 0.
2. **Item Name Gate**: Jaro-Winkler similarity must be >= 0.45, else score = 0.
3. **Weighted Scoring**: Name (35), Brand (15), Color (10), Location (20), Time Proximity (20).
4. **Dynamic Normalization**: Excludes missing optional fields from available max and normalizes score to 0–100 scale.
5. **Threshold**: Score >= 70 creates an `ACTIVE` Match and notifies users.

### Status Lifecycles & Validation
- **Lost Report**: `ACTIVE` → `MATCH_FOUND` → `CLAIM_IN_PROGRESS` → `RECOVERED` → `CLOSED`
- **Found Report**: `REPORTED` → `AWAITING_HANDOVER` → `WITH_RECTOR` → `CLAIM_IN_PROGRESS` → `RETURNED` → `CLOSED`
- **Claim**: `SUBMITTED` → `UNDER_VERIFICATION` → `APPROVED` or `REJECTED`
- **Match**: `ACTIVE` → `INVALIDATED` or `RESOLVED`

---

## 6. Demo Accounts (from Seed Script)

| Role | Email | Password | Assigned Hostel |
|---|---|---|---|
| **Rector** | `rector.shivaji@fikrnot.edu` | `Rector123!` | Shivaji Hostel |
| **Rector** | `rector.tagore@fikrnot.edu` | `Rector123!` | Tagore Hostel |
| **Student** | `rahul.sharma@fikrnot.edu` | `Student123!` | Shivaji Hostel |
| **Student** | `priya.patel@fikrnot.edu` | `Student123!` | Shivaji Hostel |
| **Student** | `amit.kumar@fikrnot.edu` | `Student123!` | Tagore Hostel |

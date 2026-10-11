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

On the backend Render service, configure `DEMO_RECTOR_EMAIL=rector@gmail.com` and `DEMO_RECTOR_PASSWORD=rector123`. These are intentionally public demo-only credentials; keep them on the backend service and never add database or JWT secrets to frontend variables. `DEMO_HOSTEL_NAME` defaults to `FikrNot Demo Hostel`; keep that reserved name consistent if overriding it. The provisioner uses the User model's password hashing and login validation, and refuses to take over an email or reserved marker assigned to another account.

Provision the designated account and its isolated sample data from the backend service shell after setting the environment variables:

```sh
npm run provision:demo-rector
```

The command connects using the configured `MONGODB_URI`, creates the `DEMO-RECTOR` account and an inactive (not publicly selectable) demo hostel, and creates clearly prefixed sample records. It is idempotent. Re-running it resets only those named demo sample records to their initial states; it refuses to take over an account, hostel, or sample identifier that belongs to another account. It does not clear collections or alter real hostels or records. The demo Rector can access and modify data only in its separately assigned demo hostel under the existing Rector authorization and hostel filters.

The public Rector login page displays the dedicated public demo email and password with copy controls. The page separately calls `GET /api/auth/demo-credentials`; it marks demo access ready only after the endpoint verifies that the account is active, has the reserved `DEMO-RECTOR` marker, belongs to the configured demo hostel, and that its stored password hash matches the configured password. Until then, the credentials remain visible but the quick-demo button stays disabled and the page reports that setup is unverified. The endpoint never returns credentials for another Rector.

The **Explore Rector Demo** button calls `POST /api/auth/demo-rector`. The backend verifies the same account through the normal password comparison and issues the usual JWT only after the role, marker, and hostel checks pass. Normal Rector sign-in continues to use `POST /api/auth/login`.

For Render, configure `CLIENT_URL=https://fikrnot-1.onrender.com` and `DEMO_RECTOR_EMAIL`, `DEMO_RECTOR_PASSWORD`; deploy the backend, run the provisioning command once in its shell, then deploy the frontend. The frontend service must also have `VITE_API_URL=https://fikrnot-4xsa.onrender.com` and be rebuilt/redeployed so its production bundle uses the backend origin.

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

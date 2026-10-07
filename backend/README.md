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
CLIENT_URL=http://localhost:3000
```

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

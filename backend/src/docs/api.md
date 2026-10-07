# FikrNot REST API Documentation

Base URL: `/api`

---

## Auth Endpoints

### 1. Register Student
`POST /api/auth/register`
- **Access**: Public (Student registration only)
- **Body**:
```json
{
  "name": "Rahul Sharma",
  "email": "rahul.sharma@fikrnot.edu",
  "password": "Student123!",
  "phone": "9123456781",
  "studentId": "STU-2024-001",
  "hostelId": "660c1f5e8f1b2c001a8d4e11",
  "course": "B.Tech",
  "department": "Computer Science",
  "year": 3,
  "semester": 5,
  "roomNumber": "A-204"
}
```
- **Response**: `201 Created`

### 2. Login
`POST /api/auth/login`
- **Access**: Public
- **Body**:
```json
{
  "email": "rahul.sharma@fikrnot.edu",
  "password": "Student123!"
}
```
- **Response**: `200 OK`

### 3. Get Current User Profile
`GET /api/auth/me`
- **Access**: Protected (Bearer Token)

### 4. Logout
`POST /api/auth/logout`
- **Access**: Protected

---

## Lost Reports Endpoints

### 1. Create Lost Report
`POST /api/lost`
- **Access**: Protected (Student only)
- **Headers**: `Content-Type: multipart/form-data`
- **Body**: `category`, `itemName`, `brand`, `color`, `description`, `location[coordinates][0]`, `location[coordinates][1]`, `location[area]`, `lostAt`, `images` (files)

### 2. Get All Lost Reports
`GET /api/lost?page=1&limit=10&category=Electronics&search=dell`
- **Access**: Protected

### 3. Get Lost Report by ID
`GET /api/lost/:id`

### 4. Update Lost Report
`PUT /api/lost/:id` (Owner only)

### 5. Cancel Lost Report
`PUT /api/lost/:id/cancel` (Owner only)

### 6. Moderate Lost Report
`PUT /api/lost/:id/moderate` (Rector assigned hostel only)

---

## Found Reports Endpoints

### 1. Create Found Report
`POST /api/found`

### 2. Get All Found Reports
`GET /api/found`

### 3. Confirm Physical Item Receipt
`PUT /api/found/:id/receive` (Rector assigned hostel only)

### 4. Update Found Item Status
`PUT /api/found/:id/status` (Rector assigned hostel only)

---

## Claims Endpoints

### 1. Submit Ownership Claim
`POST /api/claims` (Student only)

### 2. Review Claim (Approve/Reject)
`PUT /api/claims/:id/review` (Rector assigned hostel only)

### 3. Request Additional Evidence
`PUT /api/claims/:id/request-information` (Rector assigned hostel only)

---

## Recovery Endpoints

### 1. Confirm Recovery by Student
`PUT /api/recovery/:claimId/confirm` (Approved Claimant only)

### 2. Complete Recovery by Rector
`PUT /api/recovery/:claimId/complete` (Rector assigned hostel only)

---

## Notifications & Analytics

### 1. Get Notifications
`GET /api/notifications?isRead=false`

### 2. Student Campus Analytics
`GET /api/analytics/student`

### 3. Rector Hostel Analytics
`GET /api/analytics/rector`

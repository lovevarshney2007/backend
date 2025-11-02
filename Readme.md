# 🌾 Smart AgriTech Backend — Frontend Understanding Guide

This guide helps **frontend developers** understand how to interact with backend **API routes** of the Smart AgriTech System.

---

## 🔐 Authentication Routes (`/api/auth`)

These routes handle **user registration, login, and token-based authentication.**

### 1️⃣ POST `/api/auth/register`

**Purpose:** Register a new user.

```json
{
  "name": "Love Varshney",
  "email": "love@example.com",
  "password": "123456",
  "confirmPassword": "123456"
}
```

✅ Response: New user info + Access & Refresh tokens.

---

### 2️⃣ POST `/api/auth/login`

**Purpose:** Authenticate and return tokens.

```json
{
  "email": "love@example.com",
  "password": "123456"
}
```

✅ Response Example:

```json
{
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "user": { "name": "Love", "email": "love@example.com" }
}
```

---

### 3️⃣ POST `/api/auth/logout`

**Purpose:** Logout the user.

* Requires header: `Authorization: Bearer <access_token>`
  ✅ Response: { message: "User logged out successfully" }

---

### 4️⃣ POST `/api/auth/refresh-token`

**Purpose:** Generate a new access token using the refresh token.

```json
{ "refreshToken": "your_refresh_token" }
```

---

### 5️⃣ POST `/api/auth/forgot-password`

**Purpose:** Send password reset email.

```json
{ "email": "love@example.com" }
```

---

### 6️⃣ POST `/api/auth/reset-password/:token`

**Purpose:** Reset password using token.

```json
{ "password": "newPassword", "confirmPassword": "newPassword" }
```

---

## 🌾 Farm Routes (`/api/farms`)

Used for creating and managing farm data.

### 1️⃣ POST `/api/farms/`

**Purpose:** Add a new farm.

```json
{
  "farm_name": "Green Valley Farm",
  "location": "Agra, India",
  "crops": ["Wheat", "Rice"]
}
```

✅ Response: Created farm data.

### 2️⃣ GET `/api/farms/`

**Purpose:** Get all farms for the logged-in user.
✅ Response: Array of farms.

### 3️⃣ PUT `/api/farms/:id`

**Purpose:** Update a specific farm.

### 4️⃣ DELETE `/api/farms/:id`

**Purpose:** Delete a farm by ID.

All farm routes require JWT in header:

```
Authorization: Bearer <access_token>
```

---

## 🤖 Inference Routes (`/api/inference`)

These routes are for uploading crop images and checking AI inference results.

### 1️⃣ POST `/api/inference/submit`

**Purpose:** Upload an image for disease detection or yield forecasting.

```multipart/form-data
Field name: crop_image → (File)
```

✅ Response: `{ imageId: "123abc", status: "PENDING" }`

### 2️⃣ GET `/api/inference/status/:imageId`

**Purpose:** Check processing status of the uploaded image.
✅ Response Example:

```json
{
  "status": "COMPLETED",
  "result": {
    "disease": "Potato Blight",
    "confidence": 0.93
  }
}
```

---

## 📊 Data & Analytics Routes (`/api/data`)

Provide analytical results and insights for farms.

### 1️⃣ GET `/api/data/disease-detection/:imageId`

Get detailed disease detection data.

### 2️⃣ GET `/api/data/yield-forecast`

Get yield prediction chart or summary.

### 3️⃣ GET `/api/data/analytics/summary`

Get dashboard summary such as:

```json
{
  "totalFarms": 5,
  "healthyCrops": 80,
  "diseasedCrops": 20
}
```

---

## 🧾 Summary Table for Frontend

| Endpoint                         | Method | Description       | Auth Required | Body Type |
| -------------------------------- | ------ | ----------------- | ------------- | --------- |
| `/api/auth/register`             | POST   | Register new user | ❌             | JSON      |
| `/api/auth/login`                | POST   | Login user        | ❌             | JSON      |
| `/api/auth/logout`               | POST   | Logout user       | ✅             | None      |
| `/api/farms`                     | POST   | Create new farm   | ✅             | JSON      |
| `/api/farms`                     | GET    | Get all farms     | ✅             | None      |
| `/api/inference/submit`          | POST   | Upload crop image | ✅             | Form Data |
| `/api/inference/status/:imageId` | GET    | Check job status  | ✅             | None      |
| `/api/data/analytics/summary`    | GET    | Get analytics     | ✅             | None      |

---

### 💡 Frontend Developer Notes

* Always send `Authorization: Bearer <token>` header for protected routes.
* Use `FormData` for image uploads.
* Show progress indicators for jobs in `PROCESSING` state.
* Handle token expiry by calling `/api/auth/refresh-token`.

---

> 🧠 This guide ensures frontend developers can easily integrate APIs for login, farm management, and AI crop analysis in the Smart AgriTech System.

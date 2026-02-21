# JWT Authentication Test Guide

## How to Test JWT Authentication

### 1. Login (Get JWT Token)
```bash
curl -X POST http://localhost:8888/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'
```

Expected response:
```json
{
  "message": "Login erfolgreich",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Use JWT Token for Protected Endpoints
Copy the token from the login response and use it in the Authorization header:

```bash
curl -X GET http://localhost:8888/api/check-login \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

Expected response:
```json
{
  "message": "Eingeloggt",
  "username": "your_username"
}
```

### 3. Test Protected Profile Endpoint
```bash
curl -X GET http://localhost:8888/api/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 4. Logout (Client-side)
```bash
curl -X POST http://localhost:8888/api/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Key Changes Made

1. **Replaced session-based auth with JWT**
   - Removed `SessionHandler` and `LocalSessionStore`
   - Added `JWTAuth` with HS256 symmetric key
   - Tokens expire after 24 hours

2. **Updated all protected endpoints**
   - All endpoints now extract username from JWT token
   - Authorization header format: `Bearer <token>`

3. **CORS Configuration**
   - Added `Authorization` header to allowed headers

4. **Login Response**
   - Returns JWT token instead of setting session cookie
   - Client must store and send token in Authorization header

5. **Logout**
   - Now handled client-side by removing the token
   - Server just confirms logout is successful

## Security Notes

- Change the secret key in production: `"your-secret-key-here-change-in-production"`
- JWT tokens are signed but not encrypted (don't store sensitive data)
- Tokens expire after 24 hours for security
- Client should store tokens securely (httpOnly cookies or secure storage)

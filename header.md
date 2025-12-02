# Welcome to Cleaning Service API

This documentation provides comprehensive information about all available API endpoints.

## Base URLs
- **Development**: `http://localhost:3000`
- **Production**: `https://yourdomain.com`

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## How to Get Token
1. Register an account: `POST /api/auth/register`
2. Login: `POST /api/auth/login`
3. Use the returned token in subsequent requests

## Response Format
All API responses follow this standard structure:
```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // Response data here
  }
}
```

## Error Handling
Error responses include:
- `success`: false
- `message`: Error description
- `errors`: Array of validation errors (if applicable)

## Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---
# Google Auth + Paystack API

A backend API implementing Google OAuth 2.0 authentication and Paystack payment integration.

## Features

- **Google OAuth 2.0** - Server-side authentication flow
- **JWT Authentication** - Access & refresh token management
- **Paystack Integration** - Payment initialization, verification & webhooks
- **Request Logging** - All requests logged with Winston
- **Rate Limiting** - Protection against abuse
- **Input Validation** - Express-validator for all endpoints
- **Swagger Documentation** - Interactive API docs
- **Idempotency** - Prevent duplicate payment operations

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **Authentication:** JWT, Google OAuth 2.0
- **Payments:** Paystack
- **Documentation:** Swagger/OpenAPI
- **Logging:** Winston

## Prerequisites

- Node.js 18+
- MongoDB instance
- Google Cloud project with OAuth credentials
- Paystack account

## Installation

```bash
# Clone the repository
git clone https://github.com/Peliah/google-auth-paystack.git
cd google-auth-paystack

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=3040
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/

# JWT
JWT_ACCESS_SECRET=your-access-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
ACCESS_TOKEN_EXPIRY=10d
REFRESH_TOKEN_EXPIRY=10d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3040/api/v1/auth/google/callback

# Paystack
PAYSTACK_SECRET_KEY=sk_test_xxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
```

## API Endpoints

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server & database health status |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login with email/password |
| GET | `/api/v1/auth/google` | Initiate Google OAuth |
| GET | `/api/v1/auth/google/callback` | Google OAuth callback |
| GET | `/api/v1/auth/me` | Get current user |
| POST | `/api/v1/auth/refresh-token` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout user |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/payments/initiate` | Initialize payment |
| GET | `/api/v1/payments/verify/:reference` | Verify payment status |
| POST | `/api/v1/payments/webhook` | Paystack webhook |

## Usage

### Google OAuth Flow

1. Redirect user to:
   ```
   GET http://localhost:3040/api/v1/auth/google
   ```

2. User authenticates with Google

3. Callback returns:
   ```json
   {
     "message": "Google authentication successful",
     "user": { ... },
     "accessToken": "eyJhbG..."
   }
   ```

### Payment Flow

1. **Initialize payment:**
   ```bash
   POST /api/v1/payments/initiate
   Authorization: Bearer <token>
   
   {
     "email": "user@example.com",
     "amount": 5000
   }
   ```

2. **Response:**
   ```json
   {
     "message": "Payment initialized successfully",
     "data": {
       "reference": "txn_abc123",
       "authorization_url": "https://checkout.paystack.com/xyz"
     }
   }
   ```

3. **Redirect user to `authorization_url`**

4. **After payment, verify:**
   ```bash
   GET /api/v1/payments/verify/txn_abc123
   ```

### Webhook Setup

1. Expose local server with ngrok:
   ```bash
   ngrok http 3040
   ```

2. Configure webhook URL in [Paystack Dashboard](https://dashboard.paystack.com):
   ```
   https://your-ngrok-url.ngrok.io/api/v1/payments/webhook
   ```

## API Documentation

Interactive Swagger documentation available at:
```
http://localhost:3040/api-docs
```

## Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm start        # Start production server
```

## Project Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Route handlers
│   └── v1/
│       ├── auth/     # Authentication controllers
│       └── payments/ # Payment controllers
├── lib/              # Utilities (jwt, winston, mongoose)
├── middleware/       # Express middleware
├── models/           # Mongoose schemas
├── routes/           # Route definitions
│   └── v1/
└── server.ts         # Application entry point
```

## Error Handling

All errors follow a consistent format:

```json
{
  "code": "ErrorCode",
  "message": "Human readable message"
}
```

Common error codes:
- `ValidationError` - Invalid input
- `AuthenticationError` - Invalid/expired token
- `NotFound` - Resource not found
- `ServerError` - Internal server error

## Security Features

- Helmet.js for secure HTTP headers
- CORS with whitelist
- Rate limiting (60 requests/minute)
- JWT token authentication
- Webhook signature verification
- Password hashing with bcrypt
- Input sanitization

## License

ISC


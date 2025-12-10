# Google Auth + Paystack - Technical Documentation

A comprehensive guide to understanding the architecture, flow, and implementation of this backend API.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Authentication Flow](#authentication-flow)
4. [Payment Flow](#payment-flow)
5. [Database Schema](#database-schema)
6. [Middleware Pipeline](#middleware-pipeline)
7. [Security Implementation](#security-implementation)
8. [Error Handling](#error-handling)
9. [API Endpoints](#api-endpoints)
10. [Key Terminology](#key-terminology)

---

## System Architecture

### High-Level Overview

```mermaid
graph TB
    subgraph Client
        A[Web/Mobile App]
    end

    subgraph "Your Backend Server"
        B[Express.js API]
        C[(MongoDB)]
    end

    subgraph "External Services"
        D[Google OAuth]
        E[Paystack API]
    end

    A -->|HTTP Requests| B
    B -->|Store/Query| C
    B -->|OAuth Flow| D
    B -->|Payment API| E
    D -->|Callback| B
    E -->|Webhook| B
```

### Detailed Architecture

```mermaid
graph LR
    subgraph "Client Layer"
        CL[Client Application]
    end

    subgraph "API Gateway Layer"
        RL[Rate Limiter]
        CORS[CORS]
        HELMET[Helmet Security]
    end

    subgraph "Middleware Layer"
        AUTH[Authentication]
        VAL[Validation]
        LOG[Request Logger]
    end

    subgraph "Business Logic Layer"
        AC[Auth Controller]
        PC[Payment Controller]
        UC[User Controller]
    end

    subgraph "Data Access Layer"
        UM[User Model]
        TM[Transaction Model]
        TKM[Token Model]
    end

    subgraph "Database"
        DB[(MongoDB)]
    end

    CL --> RL --> CORS --> HELMET --> LOG --> AUTH --> VAL
    VAL --> AC & PC & UC
    AC & PC & UC --> UM & TM & TKM
    UM & TM & TKM --> DB
```

### Folder Structure

```
src/
├── config/              # Configuration & environment
│   ├── index.ts         # Environment variables
│   └── swagger.ts       # API documentation config
│
├── controllers/         # Request handlers (Business Logic)
│   └── v1/
│       ├── auth/        # Authentication handlers
│       │   ├── google.ts
│       │   ├── login.ts
│       │   ├── register.ts
│       │   ├── logout.ts
│       │   ├── refresh_token.ts
│       │   └── me.ts
│       └── payments/    # Payment handlers
│           ├── initiate.ts
│           ├── verify.ts
│           └── webhook.ts
│
├── middleware/          # Express middleware
│   ├── authenticate.ts  # JWT verification
│   ├── authorize.ts     # Role-based access
│   ├── validationError.ts
│   ├── errorHandler.ts  # Global error handler
│   ├── requestLogger.ts # Request logging
│   ├── notFound.ts      # 404 handler
│   └── idempotency.ts   # Duplicate prevention
│
├── models/              # Database schemas
│   ├── user.ts
│   ├── token.ts
│   ├── transaction.ts
│   └── idempotency.ts
│
├── routes/              # Route definitions
│   ├── health.ts
│   └── v1/
│       ├── index.ts
│       ├── auth.ts
│       ├── user.ts
│       └── payments.ts
│
├── lib/                 # Utilities
│   ├── jwt.ts           # Token generation/verification
│   ├── winston.ts       # Logger configuration
│   ├── mongoose.ts      # Database connection
│   └── express_rate_limit.ts
│
└── server.ts            # Application entry point
```

---

## Technology Stack

### Core Technologies

| Technology | Purpose | Why We Use It |
|------------|---------|---------------|
| **Node.js** | Runtime | Event-driven, non-blocking I/O perfect for API servers |
| **TypeScript** | Language | Type safety catches errors at compile time, better IDE support |
| **Express.js** | Framework | Minimal, flexible, widely adopted HTTP framework |
| **MongoDB** | Database | Document-based, flexible schema, scales horizontally |
| **Mongoose** | ODM | Schema validation, middleware hooks, TypeScript support |

### Security & Middleware

| Library | Purpose |
|---------|---------|
| **Helmet** | Sets secure HTTP headers (XSS protection, content security policy) |
| **CORS** | Controls which domains can access the API |
| **express-rate-limit** | Prevents brute-force attacks by limiting requests per IP |
| **bcrypt** | Securely hashes passwords with salt |
| **jsonwebtoken** | Creates and verifies JWT tokens for authentication |

### External Services

| Service | Purpose |
|---------|---------|
| **Google OAuth 2.0** | Allows users to sign in with their Google account |
| **Paystack** | Nigerian payment gateway for processing transactions |

### Development Tools

| Tool | Purpose |
|------|---------|
| **Winston** | Structured logging with multiple output levels |
| **Swagger** | Auto-generated interactive API documentation |
| **ts-node** | Run TypeScript directly without compilation |
| **nodemon** | Auto-restart server on file changes |
| **tsconfig-paths** | Enable `@/` import aliases at runtime |

---

## Authentication Flow

### Traditional Login Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant DB as Database

    C->>S: POST /auth/register {email, password, phone}
    S->>S: Validate input
    S->>S: Hash password (bcrypt)
    S->>DB: Save user
    DB-->>S: User created
    S-->>C: 201 Created

    C->>S: POST /auth/login {email, password}
    S->>DB: Find user by email
    DB-->>S: User data
    S->>S: Compare password hash
    S->>S: Generate Access Token (15min)
    S->>S: Generate Refresh Token (7d)
    S->>DB: Store refresh token
    S-->>C: {user, accessToken} + Set-Cookie: refreshToken
```

### Google OAuth 2.0 Flow

```mermaid
sequenceDiagram
    participant U as User Browser
    participant S as Your Server
    participant G as Google

    U->>S: GET /auth/google
    S->>U: Redirect to Google OAuth URL
    U->>G: User sees Google consent screen
    G->>U: User grants permission
    G->>S: GET /auth/google/callback?code=xxx
    S->>G: Exchange code for tokens
    G-->>S: {access_token, id_token}
    S->>G: GET /userinfo (with access_token)
    G-->>S: {email, name, picture, google_id}
    S->>S: Find or create user in DB
    S->>S: Generate JWT tokens
    S-->>U: {user, accessToken} + Set-Cookie
```

### JWT Token Lifecycle

```mermaid
graph TD
    A[User Logs In] --> B[Server generates Access Token]
    B --> C[Server generates Refresh Token]
    C --> D[Access Token stored in memory/localStorage]
    C --> E[Refresh Token stored in HTTP-only cookie]
    
    D --> F{Access Token Expired?}
    F -->|No| G[Use Access Token for API calls]
    F -->|Yes| H[POST /auth/refresh-token]
    H --> I[Server verifies Refresh Token]
    I -->|Valid| J[New Access Token issued]
    I -->|Invalid| K[User must login again]
    J --> D
```

### Token Structure

**Access Token (JWT):**
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "64a1b2c3d4e5f6789",
    "role": "user",
    "iat": 1702000000,
    "exp": 1702086400
  },
  "signature": "HMACSHA256(header + payload, secret)"
}
```

---

## Payment Flow

### Complete Payment Journey

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Your Server
    participant P as Paystack
    participant B as User's Bank

    Note over C,B: Step 1: Initialize Payment
    C->>S: POST /payments/initiate {email, amount}
    S->>S: Generate unique reference
    S->>P: Initialize transaction
    P-->>S: {authorization_url, reference}
    S->>S: Save transaction (status: pending)
    S-->>C: {authorization_url, reference}

    Note over C,B: Step 2: User Pays
    C->>P: Open authorization_url
    P->>C: Show checkout page
    C->>P: Enter card details
    P->>B: Process payment
    B-->>P: Payment approved
    P->>C: Redirect to callback URL

    Note over C,B: Step 3: Webhook Notification
    P->>S: POST /payments/webhook {event: charge.success}
    S->>S: Verify signature
    S->>S: Update transaction (status: success)
    S-->>P: 200 OK

    Note over C,B: Step 4: Verify Payment
    C->>S: GET /payments/verify/:reference
    S->>S: Check DB (already updated by webhook)
    S-->>C: {status: success, amount, paidAt}
```

### Payment States

```mermaid
stateDiagram-v2
    [*] --> Pending: Payment Initialized
    Pending --> Success: Webhook charge.success
    Pending --> Failed: Webhook charge.failed
    Pending --> Abandoned: User closed checkout
    Success --> [*]
    Failed --> [*]
    Abandoned --> Pending: User retries
```

### Webhook Security

```mermaid
graph LR
    A[Paystack sends webhook] --> B[Include x-paystack-signature header]
    B --> C[Your server receives request]
    C --> D[Create HMAC-SHA512 hash of body]
    D --> E{Hash matches signature?}
    E -->|Yes| F[Process webhook]
    E -->|No| G[Reject - not from Paystack]
```

**Signature Verification Code:**
```typescript
const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest('hex');

if (hash !== req.headers['x-paystack-signature']) {
    // Reject! Not from Paystack
}
```

---

## Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ TRANSACTION : makes
    USER ||--o{ TOKEN : has

    USER {
        ObjectId _id PK
        string username UK
        string email UK
        string password
        string role
        string phone UK
        string googleId UK
        string authProvider
        string firstName
        string lastName
        string profilePicture
        datetime createdAt
        datetime updatedAt
    }

    TRANSACTION {
        ObjectId _id PK
        ObjectId userId FK
        string reference UK
        number amount
        string email
        string status
        string currency
        string paymentChannel
        datetime paidAt
        object metadata
        datetime createdAt
        datetime updatedAt
    }

    TOKEN {
        ObjectId _id PK
        ObjectId userId FK
        string token UK
        datetime createdAt
        datetime updatedAt
    }

    IDEMPOTENCY_KEY {
        ObjectId _id PK
        string key
        string userId
        object response
        number statusCode
        datetime expiresAt
    }
```

### User Model

```typescript
interface IUser {
    username: string;          // Unique username
    email: string;             // Unique email
    password?: string;         // Hashed (optional for OAuth users)
    role: 'user' | 'admin';    // Authorization level
    phone?: string;            // Optional phone number
    googleId?: string;         // Google OAuth identifier
    authProvider: 'local' | 'google';  // How user signed up
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
}
```

### Transaction Model

```typescript
interface ITransaction {
    userId: ObjectId;          // Reference to User
    reference: string;         // Unique Paystack reference
    amount: number;            // Amount in Naira
    email: string;             // Customer email
    status: 'pending' | 'success' | 'failed' | 'abandoned';
    currency: string;          // Default: NGN
    paymentChannel?: string;   // card, bank, ussd, etc.
    paidAt?: Date;             // When payment was confirmed
    metadata?: object;         // Additional data
}
```

---

## Middleware Pipeline

### Request Flow Through Middleware

```mermaid
graph TD
    A[Incoming Request] --> B[CORS]
    B --> C[Request Logger]
    C --> D[Body Parser]
    D --> E[Cookie Parser]
    E --> F[Compression]
    F --> G[Helmet Security]
    G --> H[Rate Limiter]
    H --> I{Route Exists?}
    I -->|Yes| J[Route Handler]
    I -->|No| K[404 Not Found]
    J --> L[Authentication?]
    L -->|Required| M[Verify JWT]
    M -->|Valid| N[Validation]
    M -->|Invalid| O[401 Unauthorized]
    N -->|Valid| P[Controller]
    N -->|Invalid| Q[400 Bad Request]
    P --> R[Response]
    K --> S[Error Handler]
    O --> S
    Q --> S
    S --> R
```

### Middleware Execution Order

```typescript
// server.ts - Order matters!

app.use(cors(corsOptions));        // 1. Allow cross-origin requests
app.use(requestLogger);            // 2. Log all incoming requests
app.use(express.json());           // 3. Parse JSON bodies
app.use(express.urlencoded());     // 4. Parse URL-encoded bodies
app.use(cookieParser());           // 5. Parse cookies
app.use(compression());            // 6. Compress responses
app.use(helmet());                 // 7. Set security headers
app.use(limiter);                  // 8. Rate limiting

// Routes go here...

app.use(notFound);                 // 9. Handle 404s
app.use(errorHandler);             // 10. Global error handler (must be last)
```

---

## Security Implementation

### Defense in Depth

```mermaid
graph TB
    subgraph "Layer 1: Network"
        A[Rate Limiting<br/>60 req/min per IP]
    end

    subgraph "Layer 2: Transport"
        B[HTTPS<br/>TLS Encryption]
    end

    subgraph "Layer 3: Application"
        C[Helmet<br/>Security Headers]
        D[CORS<br/>Origin Whitelist]
        E[Input Validation<br/>express-validator]
    end

    subgraph "Layer 4: Authentication"
        F[JWT Tokens<br/>Short-lived Access]
        G[HTTP-Only Cookies<br/>Refresh Tokens]
    end

    subgraph "Layer 5: Data"
        H[Bcrypt<br/>Password Hashing]
        I[Mongoose Validation<br/>Schema Enforcement]
    end

    A --> B --> C --> D --> E --> F --> G --> H --> I
```

### Security Headers (Helmet)

| Header | Protection Against |
|--------|-------------------|
| `X-Content-Type-Options: nosniff` | MIME type sniffing |
| `X-Frame-Options: DENY` | Clickjacking |
| `X-XSS-Protection: 1; mode=block` | Cross-site scripting |
| `Strict-Transport-Security` | Protocol downgrade attacks |
| `Content-Security-Policy` | Code injection |

### Password Security

```mermaid
graph LR
    A[Plain Password] --> B[Add Salt]
    B --> C[Bcrypt Hash<br/>10 rounds]
    C --> D[Store in DB]
    
    E[Login Attempt] --> F[Retrieve Hash]
    F --> G[Bcrypt Compare]
    G -->|Match| H[Allow Login]
    G -->|No Match| I[Reject]
```

---

## Error Handling

### Error Response Format

All errors follow a consistent structure:

```json
{
    "code": "ErrorCode",
    "message": "Human-readable description",
    "stack": "..." // Only in development
}
```

### Error Types & HTTP Status Codes

```mermaid
graph TD
    A[Error Occurs] --> B{Error Type}
    
    B -->|Validation| C[400 Bad Request]
    B -->|Authentication| D[401 Unauthorized]
    B -->|Authorization| E[403 Forbidden]
    B -->|Not Found| F[404 Not Found]
    B -->|Duplicate| G[409 Conflict]
    B -->|Rate Limit| H[429 Too Many Requests]
    B -->|Server| I[500 Internal Server Error]
```

### Custom Error Class

```typescript
class AppError extends Error {
    statusCode: number;
    code: string;
    isOperational: boolean;

    constructor(message: string, statusCode: number, code: string) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true; // Distinguishes from programming errors
    }
}

// Usage
throw new AppError('User not found', 404, 'UserNotFound');
```

---

## API Endpoints

### Complete Endpoint Map

```mermaid
graph LR
    subgraph "Health"
        H1[GET /health]
    end

    subgraph "Authentication"
        A1[POST /api/v1/auth/register]
        A2[POST /api/v1/auth/login]
        A3[GET /api/v1/auth/google]
        A4[GET /api/v1/auth/google/callback]
        A5[GET /api/v1/auth/me]
        A6[POST /api/v1/auth/refresh-token]
        A7[POST /api/v1/auth/logout]
    end

    subgraph "Payments"
        P1[POST /api/v1/payments/initiate]
        P2[GET /api/v1/payments/verify/:ref]
        P3[POST /api/v1/payments/webhook]
    end

    subgraph "Documentation"
        D1[GET /api-docs]
        D2[GET /swagger.json]
    end
```

### Endpoint Details

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/health` | GET | No | Server health check |
| `/api/v1/auth/register` | POST | No | Create new account |
| `/api/v1/auth/login` | POST | No | Login with email/password |
| `/api/v1/auth/google` | GET | No | Start Google OAuth |
| `/api/v1/auth/google/callback` | GET | No | Google OAuth callback |
| `/api/v1/auth/me` | GET | Yes | Get current user |
| `/api/v1/auth/refresh-token` | POST | Cookie | Refresh access token |
| `/api/v1/auth/logout` | POST | Yes | Invalidate tokens |
| `/api/v1/payments/initiate` | POST | Yes | Start payment |
| `/api/v1/payments/verify/:ref` | GET | No | Check payment status |
| `/api/v1/payments/webhook` | POST | Signature | Paystack notifications |

---

## Key Terminology

### Authentication Terms

| Term | Definition |
|------|------------|
| **JWT (JSON Web Token)** | Compact, self-contained token for securely transmitting information between parties as a JSON object |
| **Access Token** | Short-lived token (usually 15min-1day) used to authenticate API requests |
| **Refresh Token** | Long-lived token used to obtain new access tokens without re-login |
| **OAuth 2.0** | Authorization framework that enables third-party applications to obtain limited access to user accounts |
| **Bearer Token** | Type of access token that grants access to whoever "bears" it |

### Payment Terms

| Term | Definition |
|------|------------|
| **Payment Gateway** | Service that authorizes and processes payments (e.g., Paystack) |
| **Transaction Reference** | Unique identifier for each payment transaction |
| **Webhook** | HTTP callback triggered by an event (e.g., successful payment) |
| **Kobo** | Smallest unit of Nigerian Naira (100 kobo = 1 Naira) |
| **Idempotency** | Property ensuring an operation produces the same result regardless of how many times it's executed |

### Architecture Terms

| Term | Definition |
|------|------------|
| **Middleware** | Functions that have access to request/response objects and can modify them or end the request-response cycle |
| **Controller** | Function that handles business logic for a specific route |
| **Model** | Data structure representing a database collection/table |
| **ODM (Object Document Mapper)** | Library that maps objects to database documents (Mongoose for MongoDB) |
| **REST API** | Architectural style for designing networked applications using HTTP methods |

### Security Terms

| Term | Definition |
|------|------------|
| **CORS** | Cross-Origin Resource Sharing - mechanism that allows restricted resources to be requested from another domain |
| **HMAC** | Hash-based Message Authentication Code - used to verify data integrity and authenticity |
| **Salt** | Random data added to password before hashing to prevent rainbow table attacks |
| **Rate Limiting** | Controlling the rate of requests to prevent abuse |

---

## Interview Talking Points

### Why These Architectural Decisions?

1. **Why MongoDB over SQL?**
   - Flexible schema for evolving user profiles
   - JSON-like documents match JavaScript objects
   - Horizontal scaling for future growth

2. **Why JWT over Sessions?**
   - Stateless - no server-side session storage
   - Scalable - works across multiple servers
   - Self-contained - carries user info in token

3. **Why HTTP-only cookies for refresh tokens?**
   - Cannot be accessed by JavaScript (XSS protection)
   - Automatically sent with requests
   - More secure than localStorage

4. **Why separate access and refresh tokens?**
   - Short-lived access tokens limit damage if stolen
   - Long-lived refresh tokens provide convenience
   - Can revoke refresh tokens without affecting all sessions

5. **Why webhooks for payments?**
   - Guarantees server knows about payments
   - Handles network failures and browser closures
   - Paystack retries failed webhook deliveries

---

## Testing the API

### Demo Script

```bash
# 1. Health Check
curl http://localhost:3040/health

# 2. Register User
curl -X POST http://localhost:3040/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@test.com","password":"password123","phone":"123456789"}'

# 3. Login
curl -X POST http://localhost:3040/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@test.com","password":"password123"}'

# 4. Google OAuth (open in browser)
open http://localhost:3040/api/v1/auth/google

# 5. Initiate Payment (use token from login)
curl -X POST http://localhost:3040/api/v1/payments/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"email":"demo@test.com","amount":5000}'

# 6. Verify Payment
curl http://localhost:3040/api/v1/payments/verify/REFERENCE
```

---

*This documentation provides a comprehensive overview of the Google Auth + Paystack API project architecture, flows, and implementation details.*





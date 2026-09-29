# Production Lottery Platform Backend

A secure, high-concurrency, enterprise-grade lottery platform backend built with Node.js, TypeScript (strict mode, ES modules), Express.js, PostgreSQL (Prisma ORM), Redis, and BullMQ.

Designed to serve as the unified API backend for:
* Telegram Bot
* Telegram Mini App
* React Native Mobile App
* Admin Dashboard

---

## 1. System Architecture & Tech Stack

* **Runtime & Language**: Node.js 20+ LTS, TypeScript (strict mode, ES Modules)
* **Web Framework**: Express.js with Helmet, CORS, and Rate Limiting
* **Database & ORM**: PostgreSQL 16+, Prisma ORM 6
* **Cache & Asynchronous Queues**: Redis 7+, BullMQ (exponential backoff, non-blocking workers)
* **Validation**: Zod schema validation for request params, queries, and bodies
* **Authentication & Authorization**:
  * Dual-token JWT (Access Token + Refresh Token family rotation with reuse detection)
  * Telegram Mini App WebAppData HMAC-SHA256 signature verification
  * Fine-grained Role-Based Access Control (RBAC with roles & permissions)
* **Logging & Observability**: Pino structured JSON logger, Request-ID tracing, HTTP request logging
* **Documentation**: Swagger / OpenAPI 3.0 interactive docs at `/api/docs`
* **Containerization & CI/CD**: Multi-stage Dockerfile, Docker Compose, GitHub Actions pipeline

---

## 2. Core Security & Fairness Guarantees

### Provably Fair Draw Engine
* **No `Math.random()`**: Uses `crypto.randomBytes` / `crypto.randomInt` and Fisher-Yates cryptographically secure shuffle.
* **Commitment Scheme**:
  * Before the draw, a `seedHash` ($SHA-256(serverSeed)$) is committed and recorded.
  * During draw execution, the unhashed `serverSeed` and client seed are published alongside the resulting winning numbers as verifiable `randomnessProof`.
  * Anyone can verify: `SHA-256(serverSeed) === committed seedHash`.

### Double-Entry Immutable Ledger
* **Wallet Consistency**: The user's wallet `balance` is strictly mirrored by immutable `WalletTransaction` entries.
* **Ledger Auditing**: Self-healing mathematical integrity check (`balance == sum(ledger transactions)`) available via `/api/v1/wallet/consistency`.
* **Atomic Financial Operations**: Ticket purchases, prize distributions, and payment credits occur strictly within isolated database transactions.
* **Locked Funds**: Withdrawal requests immediately place funds into `lockedBalance` without deleting history, preventing double-spending.

### Telegram Mini App Verification
* Parses `init_data` query string, validates the `auth_date` age (< 24 hours), computes secret key using `HMAC-SHA256("WebAppData", botToken)`, and verifies `data_check_string` against the provided `hash`.

### Idempotency & Webhooks
* Payment deposits and external webhooks support `Idempotency-Key` headers and HMAC signature verification to prevent duplicate credits.

---

## 3. Directory Layout

```text
lottery_app/
├── .github/
│   └── workflows/
│       └── ci.yml               # Automated lint, typecheck, test, build CI pipeline
├── backend/
│   ├── docker-compose.yml       # PostgreSQL 16 + Redis 7 services
│   ├── Dockerfile               # Multi-stage production container build
│   ├── eslint.config.js         # ESLint v9 Flat Config
│   ├── package.json             # NPM dependencies & scripts
│   ├── prisma/
│   │   ├── schema.prisma        # Complete database schema
│   │   └── seed.ts              # RBAC roles, permissions & super-admin seed
│   ├── scripts/
│   │   └── backup.sh            # Automated PostgreSQL backup & rotation script
│   ├── src/
│   │   ├── app.ts               # Express application initialization & middleware
│   │   ├── server.ts            # Server entrypoint & graceful shutdown handlers
│   │   ├── config/              # Environment (Zod-parsed), Prisma, Redis, Swagger
│   │   ├── jobs/                # BullMQ queues & background worker processors
│   │   ├── middleware/          # Auth, RBAC, Validation, Error Handling, Rate Limiter
│   │   ├── modules/
│   │   │   ├── admin/           # Admin reporting & audit log explorer
│   │   │   ├── auth/            # JWT authentication, refresh rotation, passwords
│   │   │   ├── draw/            # CSPRNG draw execution & winner calculations
│   │   │   ├── lottery/         # Lottery lifecycle state machine
│   │   │   ├── notification/    # Notifications & unread counters
│   │   │   ├── payment/         # Pluggable payment providers & webhooks
│   │   │   ├── telegram/        # Telegram Mini App cryptographic auth
│   │   │   ├── ticket/          # Atomic ticket purchase transaction
│   │   │   ├── user/            # User profile, history, admin user management
│   │   │   ├── wallet/          # Ledger accounting & prize claim
│   │   │   ├── winner/          # Prize tiers & winner queries
│   │   │   └── withdrawal/      # Withdrawal requests & approval workflow
│   │   └── utils/               # Errors, token, cryptoRandom, logger, pagination
│   └── tests/
│       ├── integration/         # Health, auth, validation & security tests
│       └── unit/                # CSPRNG randomness, lottery states, ledger tests
└── README.md
```

---

## 4. API Endpoints Overview

Explore the interactive OpenAPI documentation by running the backend and visiting:
`http://localhost:5000/api/docs`

### Authentication & Users
* `POST /api/v1/auth/register` - Register a new user
* `POST /api/v1/auth/login` - Login with email and password
* `POST /api/v1/auth/refresh-token` - Rotate refresh token & receive new access token
* `POST /api/v1/auth/logout` - Invalidate refresh token family
* `POST /api/v1/auth/telegram` - Authenticate via Telegram Mini App `initData`
* `GET  /api/v1/users/me` - Get current user profile
* `PATCH /api/v1/users/me` - Update current user profile
* `GET  /api/v1/users/me/tickets` - Paginated user ticket history
* `GET  /api/v1/users/me/transactions` - Paginated wallet ledger history
* `GET  /api/v1/users/me/winnings` - Paginated user prizes won
* `GET  /api/v1/admin/users` - Admin user list
* `PATCH /api/v1/admin/users/:id/status` - Admin user status lock/suspend

### Lotteries & Tickets
* `GET  /api/v1/lotteries` - Browse active and upcoming lotteries
* `GET  /api/v1/lotteries/:id` - Detailed lottery configuration and rules
* `POST /api/v1/lotteries` - Create new lottery (Admin/Operator)
* `PATCH /api/v1/lotteries/:id` - Update lottery details (Draft state only)
* `POST /api/v1/lotteries/:id/open` - Transition lottery to OPEN
* `POST /api/v1/lotteries/:id/close` - Transition lottery to CLOSED
* `POST /api/v1/lotteries/:id/cancel` - Cancel lottery and refund participants
* `POST /api/v1/lotteries/:id/tickets` - Atomic ticket purchase with balance check
* `GET  /api/v1/tickets` - List purchased tickets
* `GET  /api/v1/tickets/:id` - View individual ticket and selected numbers

### Draws & Winners
* `POST /api/v1/draws/:id/execute` - Provably fair draw execution (Operator/Admin)
* `GET  /api/v1/draws` - List all draws and statuses
* `GET  /api/v1/draws/:id` - View draw details and commitment hashes
* `GET  /api/v1/draws/:id/results` - View winning numbers and prize breakdowns
* `GET  /api/v1/winners` - List winners and payout status
* `GET  /api/v1/winners/:id` - View winning record

### Wallet, Payments & Withdrawals
* `GET  /api/v1/wallet` - View balance, locked balance, and currency
* `GET  /api/v1/wallet/transactions` - Full double-entry ledger statement
* `POST /api/v1/wallet/claim-prize/:winnerId` - Claim winning prize to wallet
* `GET  /api/v1/wallet/consistency` - Audit ledger vs balance integrity
* `POST /api/v1/payments` - Initiate deposit
* `GET  /api/v1/payments/:id` - Check payment status
* `POST /api/v1/payments/webhook` - Provider webhook handler (HMAC signature protected)
* `POST /api/v1/withdrawals` - Request withdrawal (locks funds)
* `GET  /api/v1/withdrawals` - User withdrawal history
* `GET  /api/v1/admin/withdrawals` - Admin withdrawal queue
* `POST /api/v1/admin/withdrawals/:id/approve` - Approve withdrawal & finalize funds
* `POST /api/v1/admin/withdrawals/:id/reject` - Reject withdrawal & unlock funds

### Notifications & Admin
* `GET  /api/v1/notifications` - Paginated user notifications
* `PATCH /api/v1/notifications/:id/read` - Mark notification as read
* `POST /api/v1/notifications/read-all` - Mark all notifications as read
* `GET  /api/v1/admin/reports` - Platform analytics (gross sales, prizes, payouts, users)
* `GET  /api/v1/admin/audit-logs` - Immutable audit log stream

---

## 5. Getting Started & Local Development

### Prerequisites
* Node.js 20+
* Docker and Docker Compose

### 1. Clone repository and install dependencies
```bash
git clone <repository_url>
cd lottery_app/backend
npm install
```

### 2. Configure environment variables
```bash
cp .env.example .env
```
Ensure database credentials, Redis configuration, and JWT secret keys are defined.

### 3. Start Database and Redis services
```bash
docker-compose up -d
```

### 4. Run Prisma Migrations and Seed RBAC data
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 5. Start Development Server & Background Worker
```bash
# Terminal 1: API Server
npm run dev

# Terminal 2: BullMQ Queue Worker
npm run worker:dev
```

The API will be available at `http://localhost:5000`.
Swagger documentation: `http://localhost:5000/api/docs`.

---

## 6. Running Tests & Quality Checks

```bash
# Run unit and integration tests
npm test

# Run ESLint validation
npm run lint

# Run TypeScript strict type-check
npm run typecheck

# Build production TypeScript bundle
npm run build
```

---

## 7. Production Deployment & DevOps

### Multi-Stage Docker Build
Build and run the production image:
```bash
docker build -t lottery-backend:latest .
docker run -p 5000:5000 --env-file .env lottery-backend:latest
```

### Automated Database Backups
A scheduled backup script is provided at `backend/scripts/backup.sh`. It performs compressed PostgreSQL backups using `pg_dump` and automatically purges dumps older than the configured retention threshold (default: 14 days).

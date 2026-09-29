export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Lottery Platform Backend API',
    version: '1.0.0',
    description:
      'Production-grade lottery platform backend providing secure REST APIs for Telegram Mini Apps, mobile applications, and administrative dashboards.',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Base Endpoint',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide your JWT access token with the format: Bearer <token>',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' },
        },
      },
      ApiError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Invalid credentials' },
          code: { type: 'string', example: 'INVALID_CREDENTIALS' },
          details: { type: 'array', items: { type: 'object' } },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 100 },
          totalPages: { type: 'integer', example: 5 },
          hasNextPage: { type: 'boolean', example: true },
          hasPrevPage: { type: 'boolean', example: false },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'player@lottery.com' },
          password: { type: 'string', format: 'password', example: 'SecurePassword123!' },
          firstName: { type: 'string', example: 'Alex' },
          lastName: { type: 'string', example: 'Hunter' },
          phone: { type: 'string', example: '+1234567890' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'player@lottery.com' },
          password: { type: 'string', format: 'password', example: 'SecurePassword123!' },
        },
      },
      TelegramAuthRequest: {
        type: 'object',
        required: ['initData'],
        properties: {
          initData: {
            type: 'string',
            description: 'Raw Telegram WebApp.initData string sent by Mini App',
            example: 'query_id=AA...&user=%7B...%7D&auth_date=1620000000&hash=d7...',
          },
        },
      },
      CreateLotteryRequest: {
        type: 'object',
        required: ['name', 'slug', 'ticketPrice', 'salesStart', 'salesEnd', 'drawDate', 'rules', 'prizes'],
        properties: {
          name: { type: 'string', example: 'Mega Millions 6/49' },
          slug: { type: 'string', example: 'mega-millions-649' },
          description: { type: 'string', example: 'Weekly jackpot lottery draw' },
          ticketPrice: { type: 'number', example: 2.5 },
          currency: { type: 'string', example: 'USD' },
          maxTickets: { type: 'integer', example: 100000 },
          salesStart: { type: 'string', format: 'date-time' },
          salesEnd: { type: 'string', format: 'date-time' },
          drawDate: { type: 'string', format: 'date-time' },
          rules: {
            type: 'object',
            properties: {
              minNumbers: { type: 'integer', example: 6 },
              maxNumbers: { type: 'integer', example: 6 },
              numberRangeMin: { type: 'integer', example: 1 },
              numberRangeMax: { type: 'integer', example: 49 },
              bonusNumbersCount: { type: 'integer', example: 1 },
              bonusRangeMin: { type: 'integer', example: 1 },
              bonusRangeMax: { type: 'integer', example: 10 },
            },
          },
          prizes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                tier: { type: 'integer', example: 1 },
                name: { type: 'string', example: 'Jackpot' },
                matchCount: { type: 'integer', example: 6 },
                matchBonus: { type: 'boolean', example: false },
                prizeType: { type: 'string', example: 'FIXED' },
                amount: { type: 'number', example: 1000000 },
              },
            },
          },
        },
      },
      PurchaseTicketsRequest: {
        type: 'object',
        required: ['tickets'],
        properties: {
          tickets: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                selectedNumbers: { type: 'array', items: { type: 'integer' }, example: [7, 14, 21, 28, 35, 42] },
                bonusNumbers: { type: 'array', items: { type: 'integer' }, example: [3] },
              },
            },
          },
          idempotencyKey: { type: 'string', example: 'idemp-purchase-key-123' },
        },
      },
      CreatePaymentRequest: {
        type: 'object',
        required: ['amount'],
        properties: {
          amount: { type: 'number', example: 50.0 },
          currency: { type: 'string', example: 'USD' },
          provider: { type: 'string', example: 'mock' },
          idempotencyKey: { type: 'string', example: 'dep-key-9988' },
        },
      },
      CreateWithdrawalRequest: {
        type: 'object',
        required: ['amount', 'destinationType', 'destinationDetails'],
        properties: {
          amount: { type: 'number', example: 100.0 },
          currency: { type: 'string', example: 'USD' },
          destinationType: { type: 'string', enum: ['BANK_TRANSFER', 'CRYPTO', 'TELEGRAM_WALLET'] },
          destinationDetails: { type: 'object', example: { walletAddress: 'UQ...' } },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Platform Health Check',
        tags: ['Health'],
        responses: {
          '200': { description: 'Server operational', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register new user account',
        tags: ['Authentication'],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } } },
        responses: {
          '201': { description: 'User successfully created' },
          '409': { description: 'Duplicate email or phone' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate user and issue JWT token pair',
        tags: ['Authentication'],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
        responses: {
          '200': { description: 'Authenticated successfully' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/telegram': {
      post: {
        summary: 'Cryptographically authenticate Telegram Mini App initData',
        tags: ['Authentication'],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/TelegramAuthRequest' } } } },
        responses: {
          '200': { description: 'Telegram session established' },
          '401': { description: 'Invalid signature or expired initData' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Rotate refresh token and issue new token pair',
        tags: ['Authentication'],
        responses: {
          '200': { description: 'Tokens rotated successfully' },
          '401': { description: 'Token expired or reused (family revoked)' },
        },
      },
    },
    '/lotteries': {
      get: {
        summary: 'List available lotteries',
        tags: ['Lotteries'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Paginated list of lotteries' } },
      },
      post: {
        summary: 'Create a new lottery (Operator/Admin)',
        tags: ['Lotteries'],
        security: [{ BearerAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateLotteryRequest' } } } },
        responses: { '201': { description: 'Lottery created' } },
      },
    },
    '/lotteries/{id}/tickets': {
      post: {
        summary: 'Purchase lottery tickets atomically with wallet balance',
        tags: ['Tickets'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/PurchaseTicketsRequest' } } } },
        responses: {
          '201': { description: 'Tickets purchased successfully' },
          '400': { description: 'Insufficient funds or sales window closed' },
        },
      },
    },
    '/draws/{id}/execute': {
      post: {
        summary: 'Execute cryptographically secure draw (Operator)',
        tags: ['Draws'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Draw executed and winners calculated' } },
      },
    },
    '/wallet': {
      get: {
        summary: 'Get player wallet balance and ledger consistency check',
        tags: ['Wallet'],
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Wallet details' } },
      },
    },
    '/wallet/transactions': {
      get: {
        summary: 'Get immutable wallet transaction ledger history',
        tags: ['Wallet'],
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Paginated ledger transactions' } },
      },
    },
    '/payments': {
      post: {
        summary: 'Initiate deposit payment',
        tags: ['Payments'],
        security: [{ BearerAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/CreatePaymentRequest' } } } },
        responses: { '201': { description: 'Payment initialized' } },
      },
    },
    '/payments/webhook': {
      post: {
        summary: 'Process server-to-server payment gateway webhook',
        tags: ['Payments'],
        responses: { '200': { description: 'Webhook processed idempotently' } },
      },
    },
    '/withdrawals': {
      post: {
        summary: 'Request funds withdrawal with automatic wallet hold',
        tags: ['Withdrawals'],
        security: [{ BearerAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateWithdrawalRequest' } } } },
        responses: { '201': { description: 'Withdrawal created and funds locked' } },
      },
    },
    '/admin/reports': {
      get: {
        summary: 'Get platform-wide financial and operational report',
        tags: ['Admin'],
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'System report data' } },
      },
    },
    '/admin/audit-logs': {
      get: {
        summary: 'Query immutable audit logs',
        tags: ['Admin'],
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Audit trail records' } },
      },
    },
  },
};

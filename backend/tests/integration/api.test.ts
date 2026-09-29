import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('API Integration & Security Tests', () => {
  it('GET /health should return 200 UP status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('UP');
    expect(res.body.uptime).toBeDefined();
  });

  it('GET /api/v1/health should return 200 UP status with environment info', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('UP');
  });

  it('GET /api/docs/ should serve Swagger documentation UI', async () => {
    const res = await request(app).get('/api/docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Swagger UI');
  });

  it('GET /non-existent-route should return 404 with standard ApiError format', async () => {
    const res = await request(app).get('/api/v1/unknown-endpoint-404');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('ROUTE_NOT_FOUND');
  });

  it('POST /api/v1/auth/register should reject invalid email and weak password with 422', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'not-an-email',
      password: 'weak',
    });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.details).toBeInstanceOf(Array);
  });

  it('POST /api/v1/auth/telegram should reject missing or invalid initData', async () => {
    const res = await request(app).post('/api/v1/auth/telegram').send({
      initData: 'invalid_data_without_hash',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/users/me should reject unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('AUTH_TOKEN_MISSING');
  });

  it('GET /api/v1/wallet should reject unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/v1/wallet');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/lotteries should reject unauthenticated request with 401', async () => {
    const res = await request(app).post('/api/v1/lotteries').send({});
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

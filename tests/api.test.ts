import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';

describe('Part 1: API Integration Tests', () => {
  it('should create a user', async () => {
    const response = await request(app)
      .post('/users')
      .send({
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test User');
    expect(response.body.email).toContain('@example.com');
  });

  it('should reject ticket creation without X-User-Id', async () => {
    const response = await request(app).post('/tickets').send({
      title: 'Test ticket',
      description: 'Test description',
    });

    expect(response.status).toBe(401);
  });

  it('should reject ticket creation with and invalid X-User-Id', async () => {
    const response = await request(app)
      .post('/tickets')
      .set('X-User-Id', 'not-a-number')
      .send({
        title: 'Test ticket',
        description: 'Test description',
      });

    expect(response.status).toBe(401);
  });

  it('should create a user and ticket', async () => {
    const userResponse = await request(app)
      .post('/users')
      .send({
        name: 'Ticket Creator',
        email: `creator-${Date.now()}@example.com`,
      });

    expect(userResponse.status).toBe(201);

    const userId = userResponse.body.id;

    const ticketResponse = await request(app)
      .post('/tickets')
      .set('X-User-Id', String(userId))
      .send({
        title: 'Test ticket',
        description: 'A test ticket description',
      });

    expect(ticketResponse.status).toBe(201);
    expect(ticketResponse.body).toHaveProperty('id');
    expect(ticketResponse.body.title).toBe('Test ticket');
    expect(ticketResponse.body.creator_id).toBe(userId);
  });

  it('should return 404 for a non-existent user', async () => {
    const response = await request(app).get('/users/999999999');

    expect(response.status).toBe(404);
  });

  it('should return 404 for a non-existent ticket', async () => {
    const response = await request(app).get('/tickets/999999999');

    expect(response.status).toBe(404);
  });

  it('should support ticket pagination', async () => {
    const firstPage = await request(app).get('/tickets').query({
      limit: 1,
      offset: 0,
    });

    expect(firstPage.status).toBe(200);
    expect(Array.isArray(firstPage.body)).toBe(true);
    expect(firstPage.body.length).toBeLessThanOrEqual(1);

    const secondPage = await request(app).get('/tickets').query({
      limit: 1,
      offset: 1,
    });

    expect(secondPage.status).toBe(200);
    expect(Array.isArray(secondPage.body)).toBe(true);
    expect(secondPage.body.length).toBeLessThanOrEqual(1);

    if (firstPage.body.length === 1 && secondPage.body.length === 1) {
      expect(firstPage.body[0].id).not.toBe(secondPage.body[0].id);
    }
  });

  it('should support ticket status filtering', async () => {
    const response = await request(app).get('/tickets').query({
      status: 'TODO',
    });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    for (const ticket of response.body) {
      expect(ticket.status).toBe('TODO');
    }
  });
});

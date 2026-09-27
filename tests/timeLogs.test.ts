import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';

describe('Part 2: Time Logs Tests', () => {
  it('should aggregate multiple time logs for a ticket', async () => {
    const userResponse = await request(app)
      .post('/users')
      .send({
        name: `Time Test User ${Date.now()}`,
        email: `time-${Date.now()}@example.com`,
      });

    expect(userResponse.status).toBe(201);

    const userId = userResponse.body.id;

    const ticketResponse = await request(app)
      .post('/tickets')
      .set('X-User-Id', String(userId))
      .send({
        title: 'Time tracking test',
        description: 'Testing time log aggregation',
      });

    expect(ticketResponse.status).toBe(201);

    const ticketId = ticketResponse.body.id;

    const firstLog = await request(app)
      .post(`/tickets/${ticketId}/time`)
      .set('X-User-Id', String(userId))
      .send({
        hours: 1.5,
      });

    expect(firstLog.status).toBe(201);

    const secondLog = await request(app)
      .post(`/tickets/${ticketId}/time`)
      .set('X-User-Id', String(userId))
      .send({
        hours: 2.25,
      });

    expect(secondLog.status).toBe(201);

    const thirdLog = await request(app)
      .post(`/tickets/${ticketId}/time`)
      .set('X-User-Id', String(userId))
      .send({
        hours: 3,
      });

    expect(thirdLog.status).toBe(201);

    const totalResponse = await request(app).get(`/tickets/${ticketId}/time`);

    expect(totalResponse.status).toBe(200);
    expect(totalResponse.body).toEqual({
      ticket_id: ticketId,
      total_hours: 6.75,
    });
  });

  it('should return zero hours for a ticket with no time logs', async () => {
    const userResponse = await request(app)
      .post('/users')
      .send({
        name: `Zero Time User ${Date.now()}`,
        email: `zero-time-${Date.now()}@example.com`,
      });

    expect(userResponse.status).toBe(201);

    const userId = userResponse.body.id;

    const ticketResponse = await request(app)
      .post('/tickets')
      .set('X-User-Id', String(userId))
      .send({
        title: 'No time logs',
        description: 'No time should be logged',
      });

    expect(ticketResponse.status).toBe(201);

    const ticketId = ticketResponse.body.id;

    const response = await request(app).get(`/tickets/${ticketId}/time`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ticket_id: ticketId,
      total_hours: 0,
    });
  });

  it('should reject time logging without authentication', async () => {
    const response = await request(app).post('/tickets/1/time').send({
      hours: 2,
    });

    expect(response.status).toBe(401);
  });

  it('should reject invalid hours', async () => {
    const userResponse = await request(app)
      .post('/users')
      .send({
        name: `Invalid Hours User ${Date.now()}`,
        email: `invalid-hours-${Date.now()}@example.com`,
      });

    expect(userResponse.status).toBe(201);

    const userId = userResponse.body.id;

    const ticketResponse = await request(app)
      .post('/tickets')
      .set('X-User-Id', String(userId))
      .send({
        title: 'Invalid hours test',
        description: 'Testing validation',
      });

    expect(ticketResponse.status).toBe(201);

    const ticketId = ticketResponse.body.id;

    const response = await request(app)
      .post(`/tickets/${ticketId}/time`)
      .set('X-User-Id', String(userId))
      .send({
        hours: -2,
      });

    expect(response.status).toBe(400);
  });
});

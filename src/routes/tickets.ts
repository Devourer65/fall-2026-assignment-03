import { Router, Request, Response } from 'express';
import {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicketStatus,
} from '../dal/tickets.js';
import { insertTimeLog, getTotalHoursForTicket } from '../dal/timeLogs.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const { limit, offset, status } = req.query;

  let parsedLimit: number | undefined;
  let parsedOffset: number | undefined;

  if (limit !== undefined) {
    if (
      typeof limit !== 'string' ||
      !/^\d+$/.test(limit) ||
      !Number.isSafeInteger(Number(limit))
    ) {
      res.status(400).json({ error: 'Invalid limit' });
      return;
    }

    parsedLimit = Number(limit);
  }

  if (offset !== undefined) {
    if (
      typeof offset !== 'string' ||
      !/^\d+$/.test(offset) ||
      !Number.isSafeInteger(Number(offset))
    ) {
      res.status(400).json({ error: 'Invalid offset' });
      return;
    }

    parsedOffset = Number(offset);
  }

  if (status !== undefined && typeof status !== 'string') {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  try {
    const tickets = await getAllTickets({
      limit: parsedLimit,
      offset: parsedOffset,
      status: status as string | undefined,
    });

    res.status(200).json(tickets);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  const { title, description } = req.body ?? {};
  const creatorId = res.locals.userId;

  if (
    typeof title !== 'string' ||
    title.trim() === '' ||
    typeof description !== 'string'
  ) {
    res.status(400).json({
      error: 'title and description are required',
    });
    return;
  }

  try {
    const ticket = await createTicket({
      creator_id: creatorId,
      title,
      description,
    });

    res.status(201).json(ticket);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post(
  '/:id/time',
  authMiddleware,
  async (req: Request, res: Response) => {
    const ticketId = Number(req.params.id);
    const { hours } = req.body ?? {};
    const userId = res.locals.userId;

    if (!Number.isSafeInteger(ticketId) || ticketId <= 0) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    if (typeof hours !== 'number' || !Number.isFinite(hours) || hours <= 0) {
      res.status(400).json({
        error: 'hours must be a positive number',
      });
      return;
    }

    try {
      const ticket = await getTicketById(ticketId);

      if (!ticket) {
        res.status(404).json({ error: 'Ticket not found' });
        return;
      }

      const timeLog = await insertTimeLog(ticketId, userId, hours);

      res.status(201).json(timeLog);
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

router.get('/:id/time', async (req: Request, res: Response) => {
  const ticketId = Number(req.params.id);

  if (!Number.isSafeInteger(ticketId) || ticketId <= 0) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  try {
    const ticket = await getTicketById(ticketId);

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    const totalHours = await getTotalHoursForTicket(ticketId);
    res.status(200).json({
      ticket_id: ticketId,
      total_hours: totalHours,
    });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  try {
    const ticket = await getTicketById(id);

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    res.status(200).json(ticket);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch(
  '/:id/status',
  authMiddleware,
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { status } = req.body ?? {};

    if (!Number.isSafeInteger(id) || id <= 0) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    if (typeof status !== 'string' || status.trim() === '') {
      res.status(400).json({ error: 'status is required' });
      return;
    }

    try {
      const ticket = await updateTicketStatus(id, status);

      if (!ticket) {
        res.status(404).json({ error: 'Ticket not found' });
        return;
      }

      res.status(200).json(ticket);
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

export default router;

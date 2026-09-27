import { Router, Request, Response } from 'express';
import { getAllUsers, getUserById, createUser } from '../dal/users.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    res.status(200).json(users);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  try {
    const user = await getUserById(id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json(user);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  const { name, email } = req.body ?? {};

  if (
    typeof name !== 'string' ||
    name.trim() === '' ||
    typeof email !== 'string' ||
    email.trim() === ''
  ) {
    res.status(400).json({
      error: 'name and email are required strings',
    });
    return;
  }

  try {
    const user = await createUser({
      name,
      email,
    });

    res.status(201).json(user);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

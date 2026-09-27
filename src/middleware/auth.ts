import { Request, Response, NextFunction } from 'express';

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const userIdHeader = req.header('X-User-Id');

  if (
    userIdHeader === undefined ||
    userIdHeader.trim() === '' ||
    !/^\d+$/.test(userIdHeader.trim())
  ) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const userId = Number(userIdHeader);

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  res.locals.userId = userId;
  next();
}

export default authMiddleware;

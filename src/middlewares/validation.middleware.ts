import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const videoInputSchema = z.object({
  youtubeUrl: z.string().url(),
});

export const validateVideoInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    videoInputSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
      return;
    }
    next(error);
  }
}; 
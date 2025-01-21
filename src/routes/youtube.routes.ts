import { Router } from 'express';
import { YouTubeController } from '../controllers/youtube.controller';
import { validateVideoInput } from '../middlewares/validation.middleware';

const router = Router();

router.post('/transcript', validateVideoInput, YouTubeController.extractTranscript);

export default router; 
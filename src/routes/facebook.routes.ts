import { Router } from 'express';
import { FacebookController } from '../controllers/facebook.controller';

const router = Router();

router.post('/generate/:videoId', FacebookController.generatePost);
router.post('/publish/:postId', FacebookController.createPost);
router.post('/generate-and-publish/:videoId', FacebookController.generateAndPublishPost);

export default router; 
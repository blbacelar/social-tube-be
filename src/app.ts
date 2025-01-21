import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import env from './config/environment';
import youtubeRoutes from './routes/youtube.routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
});
app.use(limiter);

// Routes
app.use('/api/youtube', youtubeRoutes);

// Routes will be added here
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default app; 
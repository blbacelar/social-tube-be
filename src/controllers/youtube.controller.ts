import { Request, Response } from 'express';
import { YouTubeService } from '../services/youtube.service';
import { VideoInput } from '../types/models';
import { prisma } from '../services/prisma.service';

export class YouTubeController {
  public static async extractTranscript(req: Request, res: Response): Promise<void> {
    try {
      const videoInput: VideoInput = req.body;

      if (!videoInput.youtubeUrl) {
        res.status(400).json({ error: 'YouTube URL is required' });
        return;
      }

      const transcript = await YouTubeService.getTranscript(videoInput);
      
      // Get the latest video data including summary
      const video = await prisma.video.findFirst({
        where: { youtubeUrl: videoInput.youtubeUrl },
        orderBy: { createdAt: 'desc' },
        select: { 
          transcript: true, 
          summary: true,
          generatedImage: true 
        },
      });

      res.status(200).json({ 
        transcript,
        summary: video?.summary,
        imageUrl: video?.generatedImage
      });
    } catch (error) {
      console.error('Controller error:', error);
      res.status(500).json({ 
        error: 'Failed to process video',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 
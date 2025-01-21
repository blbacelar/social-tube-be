import { Request, Response } from 'express';
import { FacebookService } from '../services/facebook.service';

export class FacebookController {
  public static async generatePost(req: Request, res: Response): Promise<void> {
    try {
      const { videoId } = req.params;
      const { caption, postId } = await FacebookService.generateCaption(videoId);
      res.status(200).json({ caption, postId });
    } catch (error) {
      console.error('Facebook controller error:', error);
      res.status(500).json({ 
        error: 'Failed to generate Facebook post',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  public static async createPost(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      await FacebookService.createPost(postId);
      res.status(200).json({ message: 'Post created successfully' });
    } catch (error) {
      console.error('Facebook controller error:', error);
      res.status(500).json({ 
        error: 'Failed to create Facebook post',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  public static async generateAndPublishPost(req: Request, res: Response): Promise<void> {
    try {
      const { videoId } = req.params;
      
      // First generate the post
      const { caption, postId } = await FacebookService.generateCaption(videoId);
      
      // Then publish it
      await FacebookService.createPost(postId);

      res.status(200).json({ 
        message: 'Post generated and published successfully',
        caption,
        postId
      });
    } catch (error) {
      console.error('Facebook controller error:', error);
      res.status(500).json({ 
        error: 'Failed to generate and publish Facebook post',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 
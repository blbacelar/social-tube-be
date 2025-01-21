import { YoutubeTranscript } from 'youtube-transcript';
import { prisma } from './prisma.service';
import { VideoInput } from '../types/models';
import { OpenAIService } from './openai.service';

export class YouTubeService {
  private static extractVideoId(url: string): string {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[7].length === 11) {
      return match[7];
    }
    throw new Error('Invalid YouTube URL');
  }

  public static async getVideoTitle(videoId: string): Promise<string> {
    try {
      const response = await fetch(`https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${videoId}&format=json`);
      const data = await response.json() as { title: string };
      return data.title;
    } catch (error) {
      console.error('Error fetching video title:', error);
      throw new Error('Failed to fetch video title');
    }
  }

  public static async getTranscript(videoInput: VideoInput): Promise<string> {
    try {
      const videoId = this.extractVideoId(videoInput.youtubeUrl);
      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
      
      // Combine all transcript parts into a single string
      const fullTranscript = transcriptItems
        .map(item => item.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Get video title
      const title = await this.getVideoTitle(videoId);

      // Save to database
      const video = await prisma.video.create({
        data: {
          youtubeUrl: videoInput.youtubeUrl,
          title,
          transcript: fullTranscript,
          summary: '', // Will be filled by OpenAI service
          captionPrompt: videoInput.captionPrompt,
        },
      });

      // Generate summary
      await OpenAIService.generateSummary(video.id);
      
      // Generate image
      await OpenAIService.generateImage(video.id);

      return fullTranscript;
    } catch (error) {
      console.error('Error extracting transcript:', error);
      throw new Error('Failed to extract transcript from video');
    }
  }
} 
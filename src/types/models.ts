import { Platform, PostStatus } from '@prisma/client';

export interface VideoInput {
  youtubeUrl: string;
  captionPrompt?: string;
}

export interface VideoOutput {
  id: string;
  youtubeUrl: string;
  title?: string | null;
  transcript: string;
  summary: string;
  captionPrompt?: string | null;
  generatedImage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialPostInput {
  platform: Platform;
  content: string;
  imageUrl?: string;
  videoId: string;
}

export interface SocialPostOutput {
  id: string;
  platform: Platform;
  content: string;
  imageUrl?: string | null;
  status: PostStatus;
  videoId: string;
  createdAt: Date;
  updatedAt: Date;
  postedAt?: Date | null;
  error?: string | null;
} 
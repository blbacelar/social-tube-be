import axios from 'axios';
import OpenAI from 'openai';
import env from '../config/environment';
import { prisma } from './prisma.service';
import { AxiosError } from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

export class FacebookService {
  private static instance: OpenAI;

  private static getInstance(): OpenAI {
    if (!this.instance) {
      this.instance = new OpenAI({
        apiKey: env.openAiApiKey,
      });
    }
    return this.instance;
  }

  public static async generateCaption(videoId: string): Promise<{ caption: string; postId: string }> {
    try {
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        select: { 
          summary: true, 
          transcript: true,
          generatedImage: true,
          imagePrompt: true
        },
      });

      if (!video) {
        throw new Error('Video not found');
      }

      const openai = this.getInstance();
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `Context:
You are a social media content specialist with a decade of experience creating high-engagement Facebook posts for leading brands. Your task is to write captivating, human-like posts that match the provided tone of voice guidelines.

You must write in a way that feels genuine, relatable, and conversational. Do not include any technical terms like "CTA" or "keywords" in the output itself. Your response must only include the final post, formatted naturally, without explanations or instructions.

Instructions:

For image input: Describe the emotions it conveys, the story it tells, or any unique details that could inspire the caption.
For text input: Highlight key points, themes, or messages that resonate with the audience.
Guidelines for Captions:

Start with a strong hook that grabs attention in the first 125 characters.
Structure the post with:
Hook: Draw people in with curiosity, emotion, or bold statements.
Context: Provide background or set the scene.
Details/Story: Share meaningful or interesting information.
Lesson/Insight: Leave readers with something valuable or thought-provoking.
Engagement Question: End with a natural question to spark responses.
Use emojis sparingly and only at the end of sentences to add personality. Avoid placing two emojis next to each other.
Include 5-15 relevant hashtags that mix branded, niche, and trending topics. Position key hashtags early in the caption for visibility.
Keep paragraphs short (up to 21 words) and use line breaks for readability.
Avoid overusing slang, colloquialisms, or idioms that may not resonate across cultures.
Tone of Voice:

Clear, concise, and approachable. Avoid jargon.
Positive, inclusive, and transparent. Use active voice.
Provide value and celebrate success without overhyping or being overly promotional.
Natural and conversational while maintaining professionalism.
Additional Requirements:

Ensure spelling and grammar accuracy.
Do not include technical terms like "CTA" or "keywords" in the post text itself.
Posts must feel organic, not robotic or scripted.`
          },
          {
            role: "user",
            content: `Summary: ${video.summary}
Transcript: ${video.transcript}
Image Description: ${video.imagePrompt}`,
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const caption = response.choices[0]?.message?.content?.trim() || '';

      // Save the caption and postId to the database
      const socialPost = await prisma.socialPost.create({
        data: {
          platform: 'FACEBOOK',
          content: caption,
          imageUrl: video.generatedImage,
          videoId: videoId,
          status: 'PENDING',
        },
      });

      return {
        caption,
        postId: socialPost.id
      };
    } catch (error) {
      console.error('Error generating Facebook caption:', error);
      throw new Error('Failed to generate Facebook caption');
    }
  }

  public static async createPost(postId: string): Promise<void> {
    try {
      const post = await prisma.socialPost.findUnique({
        where: { id: postId },
        include: { video: true },
      });

      if (!post?.imageUrl) {
        throw new Error('No image URL found for post');
      }

      console.log('Attempting to upload image:', post.imageUrl);

      // Create form data with the image URL
      const formData = new FormData();
      formData.append('url', post.imageUrl);
      formData.append('published', 'false');

      // Upload image to Facebook
      console.log('Uploading image to Facebook...');
      const uploadResponse = await axios.post(
        `https://graph.facebook.com/v18.0/me/photos`,
        formData,
        {
          params: {
            access_token: env.facebook.accessToken,
          },
          headers: formData.getHeaders(),
        }
      );
      console.log('Upload response:', uploadResponse.data);

      if (!uploadResponse.data.id) {
        throw new Error('Failed to upload image to Facebook - no image ID returned');
      }

      // Create post with uploaded image
      console.log('Creating Facebook post...');
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/me/feed`,
        {
          message: post.content,
          attached_media: [{ media_fbid: uploadResponse.data.id }],
        },
        {
          params: {
            access_token: env.facebook.accessToken,
          },
        }
      );
      console.log('Post creation response:', response.data);

      if (response.data.id) {
        await prisma.socialPost.update({
          where: { 
            id: postId,
            status: 'PENDING'
          },
          data: {
            status: 'POSTED',
            postedAt: new Date(),
            postId: response.data.id
          },
        });
      }

    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error('Facebook service error:', {
          error: error.toJSON(),
          response: error.response?.data,
          stack: error.stack
        });
      } else {
        console.error('Unknown error:', error);
      }
      
      // Check if post exists before trying to update
      const post = await prisma.socialPost.findUnique({
        where: { id: postId }
      });

      if (post) {
        await prisma.socialPost.update({
          where: { id: postId },
          data: {
            status: 'FAILED',
            error: error instanceof AxiosError 
              ? error.response?.data?.error?.message || error.message 
              : 'Unknown error',
          },
        });
      }
      
      throw new Error(`Failed to post to Facebook: ${error instanceof AxiosError ? error.response?.data?.error?.message || error.message : 'Unknown error'}`);
    }
  }
} 
import OpenAI from 'openai';
import env from '../config/environment';
import { prisma } from './prisma.service';

export class OpenAIService {
  private static instance: OpenAI;

  private static getInstance(): OpenAI {
    if (!this.instance) {
      this.instance = new OpenAI({
        apiKey: env.openAiApiKey,
      });
    }
    return this.instance;
  }

  public static async generateSummary(videoId: string): Promise<string> {
    try {
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        select: { transcript: true },
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
            content: `You will be provided with an video transcript. Your task is to carefully read and comprehend the content of the article. After analysing the article, generate a concise summary of the key points and main ideas discussed in the article. The summary should be informative, helpful, and to the point, with a maximum length of 35 words.

When creating the summary, focus on the following aspects:
- Identify the core message of the video.
- Highlight the most important facts, statistics, or examples that support the main points.
- If applicable, briefly mention any significant conclusions or recommendations made in the video.

Avoid using unnecessary fluff or filler phrases, and do not include introductory phrases like "this video is about." Instead, concentrate on directly communicating the essential information in a clear and efficient manner.`
          },
          {
            role: "user",
            content: video.transcript,
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      const summary = response.choices[0]?.message?.content?.trim() || '';

      // Update the video with the summary
      await prisma.video.update({
        where: { id: videoId },
        data: { summary },
      });

      return summary;
    } catch (error) {
      console.error('Error generating summary:', error);
      throw new Error('Failed to generate summary');
    }
  }

  public static async generateImage(videoId: string): Promise<string> {
    try {
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        select: { 
          summary: true,
          transcript: true 
        },
      });

      if (!video) {
        throw new Error('Video not found');
      }

      const openai = this.getInstance();
      
      // First, generate the image prompt using GPT
      const promptResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `1-You will receive text data about a topic or post. Analyze this text to identify key elements such as the subject, action, setting, and additional details.
2-Use the information extracted from the text to fill in the following Mid-journey prompt template:

[subject], [action], [setting], [additional details], [anatomical details if human]. The image must be natural, realistic, in 2018, style raw, 8K, taken on iPhone, --ar 16:9

[subject] should be the main focus of the image, like a person, object, creature, or concept. Be as specific as possible.
[action] should describe what the subject is doing using active, descriptive verbs.
[setting] should paint a vivid picture of the location, background, or environment surrounding the subject.
[additional details] can include extra elements to enhance the image, such as clothing, colors, lighting, composition, or artistic references.
[anatomical details if human] must include "with anatomically correct features, complete set of fingers and toes, proper proportions, detailed facial features"


3-Always end the generated prompt with the exact phrase: "The image must be natural, realistic, in 2018, style raw, 8K, taken on iPhone, --ar 16:9"
4-Ensure that the final prompt is well-formatted and includes all the necessary components. Avoid incomplete or poorly structured prompts.
5-Output the complete Mid-journey prompt, ready for use.

Example input text:
"A young woman practicing yoga on a peaceful beach at sunset"
Example output prompt:
A young woman with anatomically correct features, complete set of fingers and toes, proper proportions, detailed facial features, performing a graceful yoga pose on a serene beach, golden sunset casting warm light across the shoreline, gentle waves lapping at the sand, wearing flowing athletic wear in earth tones, ocean breeze gently moving her hair. The image must be natural, realistic, in 2018, style raw, 8K, taken on iPhone, --ar 16:9
Original example remains valid for non-human subjects:
"In the heart of a dense forest, a majestic stag stands alert, its antlers glistening in the dappled sunlight filtering through the canopy. The rich earthy hues of the foliage create a vivid backdrop for the striking creature."
Example output prompt (non-human):
A majestic stag standing alert in the heart of a dense forest, antlers glistening in dappled sunlight, rich earthy hues of foliage creating a vivid backdrop. The image must be natural, realistic, in 2018, style raw, 8K, taken on iPhone, --ar 16:9`
          },
          {
            role: "user",
            content: `Summary: ${video.summary}
Transcript: ${video.transcript}`,
          }
        ],
        temperature: 0.8,
        max_tokens: 200,
      });

      const imagePrompt = promptResponse.choices[0]?.message?.content?.trim() || '';

      // Generate the image using DALL-E
      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1792x1024",
        quality: "hd",
        style: "natural"
      });

      const imageUrl = imageResponse.data[0]?.url;
      if (!imageUrl) {
        throw new Error('Failed to generate image');
      }

      // Update the video with the generated image URL
      await prisma.video.update({
        where: { id: videoId },
        data: { generatedImage: imageUrl },
      });

      return imageUrl;
    } catch (error) {
      console.error('Error generating image:', error);
      throw new Error('Failed to generate image');
    }
  }
} 
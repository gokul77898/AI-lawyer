'use server';
/**
 * @fileOverview A flow that generates a spoken greeting in a selected language.
 *
 * - generateGreeting - A function that returns a spoken greeting.
 * - GreetingInput - The input type for the generateGreeting function.
 * - GreetingOutput - The return type for the generateGreeting function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import wav from 'wav';

const GreetingInputSchema = z.object({
  language: z
    .string()
    .describe('The language for the greeting (e.g., "en-US", "hi-IN").'),
});
export type GreetingInput = z.infer<typeof GreetingInputSchema>;

const GreetingOutputSchema = z.object({
  media: z.string().describe('The greeting audio as a data URI.'),
});
export type GreetingOutput = z.infer<typeof GreetingOutputSchema>;

export async function generateGreeting(
  input: GreetingInput
): Promise<GreetingOutput> {
  return greetingFlow(input);
}

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const greetingFlow = ai.defineFlow(
  {
    name: 'greetingFlow',
    inputSchema: GreetingInputSchema,
    outputSchema: GreetingOutputSchema,
  },
  async ({language}) => {
    const greetings = {
      'en-US':
        "Hi, I'm your legal adviser and personal lawyer. May I know your name?",
      'hi-IN':
        'नमस्ते, मैं आपका कानूनी सलाहकार और व्यक्तिगत वकील हूँ। क्या मैं आपका नाम जान सकता हूँ?',
      'kn-IN':
        'ನಮಸ್ಕಾರ, ನಾನು ನಿಮ್ಮ ಕಾನೂನು ಸಲಹೆಗಾರ ಮತ್ತು ವೈಯಕ್ತಿಕ ವಕೀಲ. ನಾನು ನಿಮ್ಮ ಹೆಸರನ್ನು ತಿಳಿಯಬಹುದೇ?',
    };

    const promptText =
      greetings[language as keyof typeof greetings] || greetings['en-US'];

    const {media} = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: 'Algenib'},
          },
        },
      },
      prompt: promptText,
    });

    if (!media) {
      throw new Error('No media was returned from the TTS model.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wavBase64 = await toWav(audioBuffer);

    return {
      media: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);

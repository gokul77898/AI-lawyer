'use server';
/**
 * @fileOverview A flow that generates a spoken greeting.
 *
 * - generateGreeting - A function that returns a spoken greeting.
 * - GreetingOutput - The return type for the generateGreeting function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import wav from 'wav';

const GreetingOutputSchema = z.object({
  media: z.string().describe('The greeting audio as a data URI.'),
});
export type GreetingOutput = z.infer<typeof GreetingOutputSchema>;

export async function generateGreeting(): Promise<GreetingOutput> {
  return greetingFlow();
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
    inputSchema: z.void(),
    outputSchema: GreetingOutputSchema,
  },
  async () => {
    const {media} = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: 'Vega'},
          },
        },
      },
      prompt:
        "Hello! I'm LexMate, your AI legal assistant. How can I help you today?",
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

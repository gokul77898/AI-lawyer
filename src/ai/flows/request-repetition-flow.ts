'use server';
/**
 * @fileOverview A flow that generates a spoken request for the user to repeat themselves.
 *
 * - requestRepetition - A function that returns a spoken message asking the user to repeat.
 * - RepetitionRequestInput - The input type for the requestRepetition function.
 * - RepetitionRequestOutput - The return type for the requestRepetition function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import wav from 'wav';

const RepetitionRequestInputSchema = z.object({
  language: z
    .string()
    .describe('The language for the message (e.g., "en-US", "hi-IN").'),
});
export type RepetitionRequestInput = z.infer<
  typeof RepetitionRequestInputSchema
>;

const RepetitionRequestOutputSchema = z.object({
  media: z.string().describe('The audio message as a data URI.'),
});
export type RepetitionRequestOutput = z.infer<
  typeof RepetitionRequestOutputSchema
>;

export async function requestRepetition(
  input: RepetitionRequestInput
): Promise<RepetitionRequestOutput> {
  return requestRepetitionFlow(input);
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

const requestRepetitionFlow = ai.defineFlow(
  {
    name: 'requestRepetitionFlow',
    inputSchema: RepetitionRequestInputSchema,
    outputSchema: RepetitionRequestOutputSchema,
  },
  async ({language}) => {
    const phrases = {
      'en-US':
        "I'm sorry sir, I didn't quite catch that. Could you please repeat the sentence?",
      'hi-IN':
        'माफ़ कीजिये सर, मुझे सुनाई नहीं दिया। क्या आप कृपया वाक्य दोहरा सकते हैं?',
      'kn-IN':
        'ಕ್ಷಮಿಸಿ ಸರ್, ನನಗೆ ಸರಿಯಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ವಾಕ್ಯವನ್ನು ಪುನರಾವರ್ತಿಸಬಹುದೇ?',
    };

    const promptText =
      phrases[language as keyof typeof phrases] || phrases['en-US'];

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

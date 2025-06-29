'use server';
/**
 * @fileOverview A flow that simulates a live legal consultation.
 *
 * - liveLegalConsultation - A function that handles the conversational turn.
 * - LiveConsultationInput - The input type for the liveLegalConsultation function.
 * - LiveConsultationOutput - The return type for the liveLegalConsultation function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import wav from 'wav';

// Define the structure for a single message in the conversation history
const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const LiveConsultationInputSchema = z.object({
  query: z.string().describe('The latest message from the user.'),
  history: z.array(MessageSchema).describe('The conversation history.'),
});
export type LiveConsultationInput = z.infer<typeof LiveConsultationInputSchema>;

const LiveConsultationOutputSchema = z.object({
  media: z.string().describe('The spoken response from the AI as a data URI.'),
  text: z.string().describe('The text content of the response.'),
});
export type LiveConsultationOutput = z.infer<
  typeof LiveConsultationOutputSchema
>;

export async function liveLegalConsultation(
  input: LiveConsultationInput
): Promise<LiveConsultationOutput> {
  return liveConsultationFlow(input);
}

// Helper function to convert PCM audio buffer to WAV base64 string
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
    writer.on('data', d => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

    writer.write(pcmData);
    writer.end();
  });
}

// Define the main flow for the live consultation
const liveConsultationFlow = ai.defineFlow(
  {
    name: 'liveConsultationFlow',
    inputSchema: LiveConsultationInputSchema,
    outputSchema: LiveConsultationOutputSchema,
  },
  async ({query, history}) => {
    const modelHistory = history.map(msg => ({
      role: msg.role,
      parts: [{text: msg.content}],
    }));

    // Generate the text response from the language model
    const llmResponse = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      system: `You are LexMate, an AI legal assistant. Your role is to conduct a professional, empathetic, and helpful initial consultation. You are not a human lawyer and must not provide definitive legal advice. Your goal is to understand the user's situation, ask clarifying questions, explain general legal concepts, and suggest when it is appropriate to consult with a qualified human lawyer. Maintain a natural, conversational, and reassuring tone throughout the interaction.`,
      history: modelHistory,
      prompt: query,
      config: {
        temperature: 0.7,
      },
    });
    const responseText = llmResponse.text;

    if (!responseText) {
      throw new Error('No text was returned from the language model.');
    }

    // Generate the spoken response using the TTS model
    const {media: ttsMedia} = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: 'Vega'},
          },
        },
      },
      prompt: responseText,
    });

    if (!ttsMedia) {
      throw new Error('No media was returned from the TTS model.');
    }

    const audioBuffer = Buffer.from(
      ttsMedia.url.substring(ttsMedia.url.indexOf(',') + 1),
      'base64'
    );

    const wavBase64 = await toWav(audioBuffer);

    return {
      media: 'data:audio/wav;base64,' + wavBase64,
      text: responseText,
    };
  }
);

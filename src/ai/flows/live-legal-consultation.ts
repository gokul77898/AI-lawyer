'use server';
/**
 * @fileOverview A flow that simulates a live legal consultation with document analysis.
 *
 * - liveLegalConsultation - A function that handles the conversational turn.
 * - LiveConsultationInput - The input type for the liveLegalConsultation function.
 * - LiveConsultationOutput - The return type for the liveLegalConsultation function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import wav from 'wav';

// Define the tool for the AI to request a document
const requestDocumentTool = ai.defineTool(
  {
    name: 'requestDocumentTool',
    description:
      'Use this tool to ask the user to upload a relevant legal document when you determine it is necessary for the consultation.',
    inputSchema: z.object({
      reason: z
        .string()
        .describe('A brief explanation of why the document is needed.'),
    }),
    outputSchema: z.void(),
  },
  async () => {
    // This tool is a signal to the front-end; no server-side action needed here.
  }
);

// Define the structure for a single message in the conversation history
const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const LiveConsultationInputSchema = z.object({
  query: z.string().describe('The latest message from the user.'),
  history: z.array(MessageSchema).describe('The conversation history.'),
  documentDataUri: z
    .string()
    .optional()
    .describe(
      "A legal document provided by the user as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type LiveConsultationInput = z.infer<typeof LiveConsultationInputSchema>;

const LiveConsultationOutputSchema = z.object({
  media: z.string().describe('The spoken response from the AI as a data URI.'),
  text: z.string().describe('The text content of the response.'),
  documentRequest: z
    .boolean()
    .describe('True if the AI is requesting a document from the user.'),
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
  async ({query, history, documentDataUri}) => {
    const modelHistory = history.map(msg => ({
      role: msg.role,
      parts: [{text: msg.content}],
    }));

    // Construct the prompt, including the document if it exists
    const promptParts: any[] = [{text: query}];
    if (documentDataUri) {
      promptParts.push({media: {url: documentDataUri}});
    }

    // Generate the text response from the language model
    const llmResponse = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      system: `You are LexMate, an AI legal assistant. Your role is to conduct a professional, empathetic, and helpful initial consultation. You are not a human lawyer and must not provide definitive legal advice. Your goal is to understand the user's situation, ask clarifying questions, explain general legal concepts, and suggest when it is appropriate to consult with a qualified human lawyer. Maintain a natural, conversational, and reassuring tone. Use the conversation history to maintain context. If you believe reviewing a document (like a contract, lease, or notice) is necessary to provide a more accurate and helpful response, use the 'requestDocumentTool' to ask the user to upload it. Phrase your request naturally, for example: 'To understand this better, it would be very helpful if you could upload a copy of your rental agreement.' After the tool is used, the user will have an opportunity to upload. If they provide a document, analyze its content in the next turn and continue the conversation. If they decline or say they don't have it, continue the conversation gracefully without the document.`,
      history: modelHistory,
      prompt: promptParts,
      tools: [requestDocumentTool],
      config: {
        temperature: 0.7,
      },
    });
    const responseText = llmResponse.text;

    if (!responseText) {
      throw new Error('No text was returned from the language model.');
    }

    // Check if the AI requested a document
    const documentRequest = llmResponse.toolCalls.some(
      call => call.tool === 'requestDocumentTool'
    );

    // Generate the spoken response using the TTS model
    const {media: ttsMedia} = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: 'Algenib'},
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
      documentRequest,
    };
  }
);

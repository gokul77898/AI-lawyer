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
  language: z
    .string()
    .describe('The language for the conversation (e.g., "en-US", "hi-IN").'),
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
  async ({query, history, documentDataUri, language}) => {
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
      system: `You must conduct the entire conversation in the specified language: ${language}. You are a professional AI legal adviser and personal lawyer. Your primary role is to conduct a highly formal, helpful, and clear initial consultation.

**Communication Rules:**
1.  **Simplicity is Key:** Always use simple, day-to-day conversational words and sentences. You must avoid complex legal jargon. This applies to all languages.
2.  **Explain Complexities:** If a legal concept is unavoidable, you must first state it and then immediately explain it in the simplest possible terms. For example: "This pertains to 'estoppel', which basically means you can't go back on your word if someone has acted on it."
3.  **Check for Understanding:** After explaining a complex point, you must check if the user has understood. For example, ask "Does that make sense, sir?" or "Sir, are you with me so far?".
4.  **Handle Confusion Gracefully:** If the user's response is not a clear "yes" or they express confusion, you must not press the issue. Instead, say something like: "Okay sir, that's no problem. We can revisit this later if needed." Then, smoothly move on to the next question or topic.

**Consultation Flow:**
Your goal is to understand the user's situation by asking clarifying questions. Use the full conversation history to maintain context. After your initial greeting where you ask for the user's name, the user will provide it. Address the user formally throughout the rest of the conversation, using titles such as 'sir' or their name.

**Document Analysis:**
If you determine that reviewing a document (like a contract, lease, or notice) is necessary, use the 'requestDocumentTool'. Phrase your request formally: 'To better assist you, sir, it would be helpful if you could upload a copy of the document.' After they upload it, analyze its contents and integrate that information into the consultation.

**Important:** You must not provide definitive legal advice. Your role is to clarify, gather information, and identify when to recommend a qualified human lawyer.`,
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
    const documentRequest =
      llmResponse.toolCalls?.some(
        call => call.tool === 'requestDocumentTool'
      ) || false;

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

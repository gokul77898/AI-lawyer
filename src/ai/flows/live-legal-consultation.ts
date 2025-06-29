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
      system: `You are an AI legal adviser conducting a formal consultation in ${language}. Your role is to be helpful, clear, and professional.

**Your Persona:**
- Address the user formally and respectfully (e.g., 'sir', or by name if provided).
- Your primary goal is to understand the user's situation and answer their questions directly.
- Use simple, everyday language. Avoid complex legal jargon whenever possible.

**Conversation Rules:**
- **Answer Directly:** Always focus on answering the user's most recent question or statement.
- **Explain Simply:** If a legal term is necessary, you must explain it in simple terms immediately after using it. For example, "'Estoppel' means you can't go back on your word if someone has already acted on it."
- **Check for Understanding:** After explaining a complex topic, gently check if the user is following along (e.g., "Does that make sense, sir?").
- **Handle Confusion:** If the user indicates they are confused or does not provide a clear "yes" response, say "That's no problem, sir. We can revisit this." and move on to the next part of the conversation. Do not get stuck.
- **Document Requests:** If a document is essential for the consultation, use the 'requestDocumentTool' to ask for it politely. For example: "Sir, to assist you better, could you please upload the relevant document?"
`,
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

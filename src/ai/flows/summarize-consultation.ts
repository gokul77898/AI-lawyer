'use server';
/**
 * @fileOverview A flow that summarizes a legal consultation.
 *
 * - summarizeConsultation - A function that generates a summary of the conversation.
 * - SummarizeConsultationInput - The input type for the summarizeConsultation function.
 * - SummarizeConsultationOutput - The return type for the summarizeConsultation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const SummarizeConsultationInputSchema = z.object({
  history: z.array(MessageSchema).describe('The full conversation history.'),
});
export type SummarizeConsultationInput = z.infer<
  typeof SummarizeConsultationInputSchema
>;

const SummarizeConsultationOutputSchema = z.object({
  summary: z.string().describe('A structured summary of the consultation.'),
});
export type SummarizeConsultationOutput = z.infer<
  typeof SummarizeConsultationOutputSchema
>;

export async function summarizeConsultation(
  input: SummarizeConsultationInput
): Promise<SummarizeConsultationOutput> {
  return summarizeConsultationFlow(input);
}

const summarizeConsultationFlow = ai.defineFlow(
  {
    name: 'summarizeConsultationFlow',
    inputSchema: SummarizeConsultationInputSchema,
    outputSchema: SummarizeConsultationOutputSchema,
  },
  async ({history}) => {
    if (history.length === 0) {
      return {summary: 'No conversation to summarize.'};
    }

    const llmResponse = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: `You are an expert legal assistant. Based on the following conversation transcript, generate a clear and concise summary. The summary should be well-structured, easy to read, and include the following sections:

1.  **Key Points Discussed:** A bulleted list of the main topics and facts covered.
2.  **Advice Given:** A summary of any advice or suggestions provided by the legal adviser.
3.  **Action Items:** A list of any next steps or actions the user should take.

Here is the conversation transcript:
${history
  .map(m => `${m.role === 'user' ? 'Client' : 'Adviser'}: ${m.content}`)
  .join('\n\n')}
`,
      config: {
        temperature: 0.3,
      },
    });

    return {
      summary: llmResponse.text || 'Could not generate a summary.',
    };
  }
);

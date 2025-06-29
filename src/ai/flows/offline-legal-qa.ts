// This is an offline legal Q&A flow that allows users to access basic legal Q&A functionality even when offline.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OfflineLegalQAInputSchema = z.object({
  query: z.string().describe('The legal question from the user.'),
});

export type OfflineLegalQAInput = z.infer<typeof OfflineLegalQAInputSchema>;

const OfflineLegalQAOutputSchema = z.object({
  answer: z.string().describe('The answer to the legal question.'),
});

export type OfflineLegalQAOutput = z.infer<typeof OfflineLegalQAOutputSchema>;

export async function offlineLegalQA(input: OfflineLegalQAInput): Promise<OfflineLegalQAOutput> {
  return offlineLegalQAFlow(input);
}

const offlineLegalQAPrompt = ai.definePrompt({
  name: 'offlineLegalQAPrompt',
  input: {schema: OfflineLegalQAInputSchema},
  output: {schema: OfflineLegalQAOutputSchema},
  prompt: `You are a helpful legal assistant that can answer basic legal questions even when offline.

  Question: {{{query}}}

  Answer: `,
});

const offlineLegalQAFlow = ai.defineFlow(
  {
    name: 'offlineLegalQAFlow',
    inputSchema: OfflineLegalQAInputSchema,
    outputSchema: OfflineLegalQAOutputSchema,
  },
  async input => {
    const {output} = await offlineLegalQAPrompt(input);
    return output!;
  }
);

'use server';
/**
 * @fileOverview A live legal consultation AI agent.
 *
 * - liveLegalConsultation - A function that handles the legal consultation process.
 * - LiveLegalConsultationInput - The input type for the liveLegalConsultation function.
 * - LiveLegalConsultationOutput - The return type for the liveLegalConsultation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LiveLegalConsultationInputSchema = z.object({
  query: z.string().describe('The user query related to legal information.'),
});
export type LiveLegalConsultationInput = z.infer<typeof LiveLegalConsultationInputSchema>;

const LiveLegalConsultationOutputSchema = z.object({
  response: z.string().describe('The AI assistant response to the user query.'),
});
export type LiveLegalConsultationOutput = z.infer<typeof LiveLegalConsultationOutputSchema>;

export async function liveLegalConsultation(input: LiveLegalConsultationInput): Promise<LiveLegalConsultationOutput> {
  return liveLegalConsultationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'liveLegalConsultationPrompt',
  input: {schema: LiveLegalConsultationInputSchema},
  output: {schema: LiveLegalConsultationOutputSchema},
  prompt: `You are a helpful AI legal assistant. Respond to the user query with relevant legal information and guidance in a conversational manner.\n\nUser Query: {{{query}}}`,
});

const liveLegalConsultationFlow = ai.defineFlow(
  {
    name: 'liveLegalConsultationFlow',
    inputSchema: LiveLegalConsultationInputSchema,
    outputSchema: LiveLegalConsultationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

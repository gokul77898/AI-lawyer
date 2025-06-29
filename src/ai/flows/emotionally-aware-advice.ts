// Emotionally-aware legal advice flow to tailor explanations based on user's emotional state.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EmotionallyAwareAdviceInputSchema = z.object({
  legalQuery: z.string().describe('The user\'s legal question.'),
  emotion: z.string().describe('The user\'s current emotional state (e.g., stressed, anxious, calm).'),
});
export type EmotionallyAwareAdviceInput = z.infer<typeof EmotionallyAwareAdviceInputSchema>;

const EmotionallyAwareAdviceOutputSchema = z.object({
  adaptedExplanation: z.string().describe('A legal explanation tailored to the user\'s emotional state.'),
});
export type EmotionallyAwareAdviceOutput = z.infer<typeof EmotionallyAwareAdviceOutputSchema>;

export async function getEmotionallyAwareAdvice(input: EmotionallyAwareAdviceInput): Promise<EmotionallyAwareAdviceOutput> {
  return emotionallyAwareAdviceFlow(input);
}

const emotionallyAwareAdvicePrompt = ai.definePrompt({
  name: 'emotionallyAwareAdvicePrompt',
  input: {schema: EmotionallyAwareAdviceInputSchema},
  output: {schema: EmotionallyAwareAdviceOutputSchema},
  prompt: `You are an AI legal assistant. A user has asked a legal question and is feeling {{{emotion}}}.\n\nLegal Question: {{{legalQuery}}}\n\nProvide a legal explanation that is tailored to the user\'s emotional state. Explain the information in a calm and supportive way if they are stressed or anxious, or provide more direct guidance if they are calm. Focus on being understanding and helpful.`,
});

const emotionallyAwareAdviceFlow = ai.defineFlow(
  {
    name: 'emotionallyAwareAdviceFlow',
    inputSchema: EmotionallyAwareAdviceInputSchema,
    outputSchema: EmotionallyAwareAdviceOutputSchema,
  },
  async input => {
    const {output} = await emotionallyAwareAdvicePrompt(input);
    return output!;
  }
);

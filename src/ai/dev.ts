import { config } from 'dotenv';
config();

import '@/ai/flows/live-legal-consultation.ts';
import '@/ai/flows/offline-legal-qa.ts';
import '@/ai/flows/emotionally-aware-advice.ts';
import '@/ai/flows/summarize-legal-documents.ts';
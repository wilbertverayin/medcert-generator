// src/ai/flows/extract-medical-entities.ts
'use server';

/**
 * @fileOverview Extracts medical entities and diagnoses from doctor's remarks.
 *
 * - extractMedicalEntities - A function that handles the extraction process.
 * - ExtractMedicalEntitiesInput - The input type for the extractMedicalEntities function.
 * - ExtractMedicalEntitiesOutput - The return type for the extractMedicalEntities function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractMedicalEntitiesInputSchema = z.object({
  remarks: z.string().describe("Doctor's remarks or patient's History of Present Illness (HPI) to extract from."),
});
export type ExtractMedicalEntitiesInput = z.infer<typeof ExtractMedicalEntitiesInputSchema>;

const ExtractMedicalEntitiesOutputSchema = z.object({
  medicalEntities: z.array(z.string()).describe('List of extracted medical entities.'),
  diagnosis: z.string().describe('Extracted diagnosis from the provided text.'),
  summaryForCertificate: z.string().describe('A brief summary of the patient condition suitable for the "Remarks" section of a medical certificate.'),
});
export type ExtractMedicalEntitiesOutput = z.infer<typeof ExtractMedicalEntitiesOutputSchema>;

export async function extractMedicalEntities(input: ExtractMedicalEntitiesInput): Promise<ExtractMedicalEntitiesOutput> {
  return extractMedicalEntitiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractMedicalEntitiesPrompt',
  model: 'googleai/gemini-2.0-flash',
  input: {schema: ExtractMedicalEntitiesInputSchema},
  output: {schema: ExtractMedicalEntitiesOutputSchema},
  prompt: `You are an AI assistant specialized in processing medical information for certificates.

Given the following text (which could be doctor's notes or a patient's History of Present Illness), perform the following tasks:
1.  Extract the relevant medical entities.
2.  Determine the most likely diagnosis.
3.  Write a brief, professional summary suitable for the "Remarks" section of a medical certificate.

Text: {{{remarks}}}

- medicalEntities: List out the medical entities that you have extracted.
- diagnosis: Provide the final diagnosis based on the text.
- summaryForCertificate: Provide a concise summary for the certificate's remarks section.

Ensure that the response is structured and accurate.
`,
});

const extractMedicalEntitiesFlow = ai.defineFlow(
  {
    name: 'extractMedicalEntitiesFlow',
    inputSchema: ExtractMedicalEntitiesInputSchema,
    outputSchema: ExtractMedicalEntitiesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

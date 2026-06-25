'use server';

import { extractMedicalEntities } from '@/ai/flows/extract-medical-entities';

export async function handleExtract(remarks: string) {
  if (!remarks) {
    return { error: 'Remarks cannot be empty.' };
  }
  try {
    const result = await extractMedicalEntities({ remarks });
    return { data: result };
  } catch (e) {
    console.error(e);
    // This is a more generic error message for the user.
    // The specific error is logged on the server.
    return { error: 'An unexpected error occurred while processing the request.' };
  }
}

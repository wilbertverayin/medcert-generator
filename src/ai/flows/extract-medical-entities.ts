// AI features disabled for static build

/**
 * @fileOverview Extracts medical entities and diagnoses from doctor's remarks.
 *
 * - extractMedicalEntities - A function that handles the extraction process.
 * - ExtractMedicalEntitiesInput - The input type for the extractMedicalEntities function.
 * - ExtractMedicalEntitiesOutput - The return type for the extractMedicalEntities function.
 */

export type ExtractMedicalEntitiesInput = {
  remarks: string;
};

export type ExtractMedicalEntitiesOutput = {
  medicalEntities: string[];
  diagnosis: string;
  summaryForCertificate: string;
};

export async function extractMedicalEntities(
  _input: ExtractMedicalEntitiesInput
): Promise<ExtractMedicalEntitiesOutput> {
  return {
    medicalEntities: [],
    diagnosis: '',
    summaryForCertificate: '',
  };
}

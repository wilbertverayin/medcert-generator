
export type CertificateData = {
  id: string;
  patientName: string;
  age: number;
  sex: 'Male' | 'Female' | undefined;
  dateOfConsultation: Date | undefined;
  diagnosis: string;
  purpose: string;
  workStatus: 'Not fit' | 'Fit';
  durationOfLeave?: string;
  remarks: string;
  notFitToWorkMessage?: string;
  fitToWorkMessage?: string;
};

export type ProfileData = {
  doctorName: string;
  prcNumber: string;
  clinicName: string;
  address?: string;
  clinicLogo: string;
  digitalSignature: string;
};

    
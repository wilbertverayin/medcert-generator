
'use client';

import Image from 'next/image';
import { format } from 'date-fns';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import type { CertificateData, ProfileData } from '@/lib/types';
import { defaultProfile } from '@/lib/constants';

// A helper to replace spaces for better PDF rendering with html2canvas
const withNbsp = (text: string | undefined): string => {
    return text ? text.replace(/ /g, '\u00A0') : '';
};

export function CertificateDisplay({ certificate, profile, qrCodeUrlOverride }: { certificate: CertificateData; profile: ProfileData, qrCodeUrlOverride?: string }) {

    const verificationUrl = certificate.id ? `https://medcertgen.visibleclinic.com/verify/${certificate.id}` : '';
    const defaultQrCodeUrl = verificationUrl
        ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(verificationUrl)}`
        : "https://placehold.co/150x150.png";
    
    const qrCodeUrl = qrCodeUrlOverride || defaultQrCodeUrl;


    const pronoun = certificate.sex === 'Male' ? 'He' : certificate.sex === 'Female' ? 'She' : 'He/She';
    const possessivePronoun = certificate.sex === 'Male' ? 'his' : certificate.sex === 'Female' ? 'her' : 'his/her';
    const defaultNotFitToWorkMessage = `${pronoun} is advised to take a leave for a period of`;
    const defaultFitToWorkMessage = `${pronoun} is deemed fit and may resume ${possessivePronoun} duties.`;


    return (
        <Card className="shadow-lg print:shadow-none print:border-none">
            <CardHeader className="bg-muted/50 p-4 border-b">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                         <Image src={profile.clinicLogo || "https://placehold.co/64x64.png"} alt="Clinic Logo" width={50} height={50} className="rounded-md object-contain" data-ai-hint="clinic logo"/>
                        <div>
                            <p className="font-headline font-bold text-lg">{profile.clinicName || profile.doctorName || 'Your Clinic Name'}</p>
                            {profile.address && <p className="text-xs text-muted-foreground">{profile.address}</p>}
                        </div>
                    </div>
                    <div className="text-right">
                       <h2 className="font-headline text-2xl tracking-tight">Medical Certificate</h2>
                       <p className="text-xs text-muted-foreground font-mono">ID: {certificate.id || 'XXXXXX'}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 text-sm space-y-6 leading-relaxed break-all">
                <div className="flex justify-end">
                    <p>{certificate.dateOfConsultation ? format(new Date(certificate.dateOfConsultation), 'MMMM d, yyyy') : '____________'}</p>
                </div>

                <div className="space-y-4 pt-4">
                    <div className="leading-loose text-base break-words">
                        This is to certify that <span className="font-bold underline decoration-dashed px-1">{withNbsp(certificate.patientName) || '_____________________'}</span>
                        , a <span className="font-bold underline decoration-dashed px-1">{certificate.age || '__'}</span> year-old <span className="font-bold underline decoration-dashed px-1">{withNbsp(certificate.sex) || '__________'}</span>
                        , was seen and examined on the date specified and is diagnosed with the following condition:
                    </div>
                    
                    <p className="font-bold text-base text-center py-2 break-words whitespace-pre-line">{withNbsp(certificate.diagnosis) || '_____________________'}</p>
                    
                    <p className="break-words">This certificate is issued for the purpose of: <span className="font-semibold">{withNbsp(certificate.purpose)}</span></p>
                    
                    <p className="text-xs text-muted-foreground italic">
                        Note: This medical certificate is not valid for medico-legal purposes.
                    </p>
                </div>
                
                <p className="pt-4 text-base break-words">
                    {(certificate.workStatus === 'Fit') ? (
                        <span>{withNbsp(certificate.fitToWorkMessage || defaultFitToWorkMessage)}</span>
                    ) : (
                        <span>{withNbsp(certificate.notFitToWorkMessage || defaultNotFitToWorkMessage)} <span className="font-bold underline decoration-dashed">{withNbsp(certificate.durationOfLeave) || '_____'}</span>.</span>
                    )}
                </p>

                {certificate.remarks && (
                    <div className="pt-2">
                        <p className="font-semibold text-muted-foreground">Remarks:</p>
                        <p className="text-sm italic bg-muted/50 p-2 rounded-md break-words">{withNbsp(certificate.remarks)}</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-4 border-t flex justify-between items-end">
                 <div>
                    <div className="bg-white p-1 rounded-none border-4 border-white">
                       <Image src={qrCodeUrl} width={120} height={120} alt="QR Code for verification" className="rounded-none"/>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-center w-[128px]">Scan to verify</p>
                </div>
                <div className="text-center">
                     <Image src={profile.digitalSignature || defaultProfile.digitalSignature} alt="Doctor's Signature" width={150} height={75} className="object-contain mx-auto" data-ai-hint="signature"/>
                    <p className="border-t mt-1 pt-1 font-bold w-[150px]">{profile.doctorName || 'Doctor Name'}</p>
                    <p className="text-xs text-muted-foreground w-[150px]">PRC No. {profile.prcNumber || 'XXXXXXX'}</p>
                </div>
            </CardFooter>
        </Card>
    );
}

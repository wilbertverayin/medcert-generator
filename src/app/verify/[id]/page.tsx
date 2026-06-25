'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { CertificateDisplay } from '@/components/CertificateDisplay';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { CertificateData, ProfileData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { defaultProfile } from '@/lib/constants';

export default function VerificationPage() {
    const params = useParams();
    const { id } = params;
    
    const [certificates] = useLocalStorage<Record<string, CertificateData>>('certificates', {});
    const [profile] = useLocalStorage<ProfileData>('profile', defaultProfile);
    
    const [certificate, setCertificate] = useState<CertificateData | null | undefined>(undefined);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient && id && Object.keys(certificates).length > 0) {
            const foundCertificate = certificates[id as string];
            setCertificate(foundCertificate || null);
        } else if (isClient) {
            setCertificate(null);
        }
    }, [id, certificates, isClient]);

    if (!isClient || certificate === undefined) {
        return (
            <main className="container py-8 flex justify-center">
                <div className="w-full max-w-4xl space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-[700px] w-full" />
                </div>
            </main>
        );
    }

    return (
        <main className="container py-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {certificate ? (
                    <>
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
                            <ShieldCheck className="w-10 h-10 text-primary" />
                            <div>
                                <CardTitle className="text-primary font-headline">Certificate Verified</CardTitle>
                                <p className="text-muted-foreground">This medical certificate is valid.</p>
                            </div>
                        </CardHeader>
                    </Card>
                    <CertificateDisplay certificate={certificate} profile={profile} />
                    </>
                ) : (
                    <Card className="border-destructive bg-destructive/10">
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
                             <ShieldAlert className="w-10 h-10 text-destructive" />
                            <div>
                                <CardTitle className="text-destructive font-headline">Verification Failed</CardTitle>
                                <p className="text-destructive/80">This medical certificate could not be found or is invalid.</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="text-sm text-destructive/90">Please check the certificate ID or the QR code and try again.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </main>
    )
}

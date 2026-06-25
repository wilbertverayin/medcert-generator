
'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { ProfileData } from '@/lib/types';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Separator } from '@/components/ui/separator';
import { defaultProfile } from '@/lib/constants';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  doctorName: z.string().min(1, 'Doctor name is required'),
  prcNumber: z.string().min(1, 'PRC number is required'),
  clinicName: z.string().min(1, 'Clinic name is required'),
  address: z.string().optional(),
  clinicLogo: z.string(),
  digitalSignature: z.string(),
});

export default function ProfilePage() {
  const { toast } = useToast();
  const [profile, setProfile] = useLocalStorage<ProfileData>('profile', defaultProfile);
  const [isClient, setIsClient] = useState(false);

  const {
    register,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile,
    mode: 'onBlur',
  });
  
  const watchedValues = watch();
  const watchedLogo = watch('clinicLogo');
  const watchedSignature = watch('digitalSignature');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    reset(profile);
  }, [profile, reset]);

  useEffect(() => {
    const isProfileDefault = 
      profile.doctorName === defaultProfile.doctorName &&
      profile.prcNumber === defaultProfile.prcNumber &&
      profile.clinicName === defaultProfile.clinicName;

    if (isProfileDefault) {
        toast({
            title: 'Setup your Profile',
            description: "Update your information to personalize your certificates.",
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const autoSaveChanges = (data: ProfileData) => {
    setProfile(data);
    reset(data);
    toast({
      variant: 'info',
      title: 'Profile Updated',
      description: 'Your changes have been automatically saved.',
    });
  };

  const handleBlur = () => {
    if (isDirty) {
      autoSaveChanges(getValues());
    }
  };

  const handleFileSelect = (file: File | null, field: 'clinicLogo' | 'digitalSignature') => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast({
            variant: 'destructive',
            title: 'Invalid File Type',
            description: 'Please upload an image file (e.g., PNG, JPG).',
        });
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        const dataUrl = reader.result as string;
        const currentValues = getValues();
        const newValues = { ...currentValues, [field]: dataUrl };
        setValue(field, dataUrl, { shouldDirty: true, shouldValidate: true });
        autoSaveChanges(newValues);
    };
    reader.onerror = () => {
        toast({
            variant: 'destructive',
            title: 'File Read Error',
            description: 'Could not read the selected file.',
        });
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="container py-8">
      <form onSubmit={(e) => e.preventDefault()}>
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Profile Settings</CardTitle>
            <CardDescription>
              Manage your professional information, clinic logo, and digital signature. Changes are saved automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
              <div className="space-y-4">
                <h3 className="font-headline text-lg">Professional Information</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline">
                        <Label htmlFor="doctorName">Doctor's Full Name</Label>
                        {errors.doctorName && <p className="text-xs text-destructive">{errors.doctorName.message}</p>}
                      </div>
                      <Input 
                        id="doctorName" 
                        {...register('doctorName')} 
                        placeholder="e.g., Dr. Maria Santos"
                        onBlur={handleBlur}
                        className={cn(
                          errors.doctorName && "border-destructive focus-visible:ring-destructive",
                          isClient && watchedValues.doctorName === defaultProfile.doctorName && "border-primary/50"
                        )}
                      />
                  </div>
                  <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline">
                        <Label htmlFor="prcNumber">PRC License Number</Label>
                        {errors.prcNumber && <p className="text-xs text-destructive">{errors.prcNumber.message}</p>}
                      </div>
                      <Input 
                        id="prcNumber" 
                        {...register('prcNumber')} 
                        placeholder="e.g., 0123456" 
                        onBlur={handleBlur}
                        className={cn(
                          errors.prcNumber && "border-destructive focus-visible:ring-destructive",
                          isClient && watchedValues.prcNumber === defaultProfile.prcNumber && "border-primary/50"
                        )}
                      />
                  </div>
                </div>
                 <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline">
                        <Label htmlFor="clinicName">Clinic Name</Label>
                        {errors.clinicName && <p className="text-xs text-destructive">{errors.clinicName.message}</p>}
                    </div>
                    <Input 
                        id="clinicName" 
                        {...register('clinicName')} 
                        placeholder="e.g., The Health Hub" 
                        onBlur={handleBlur}
                        className={cn(
                          errors.clinicName && "border-destructive focus-visible:ring-destructive",
                          isClient && watchedValues.clinicName === defaultProfile.clinicName && "border-primary/50"
                        )}
                    />
                </div>
                 <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline">
                        <Label htmlFor="address">Clinic Address (Optional)</Label>
                        {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
                    </div>
                    <Input 
                        id="address" 
                        {...register('address')} 
                        placeholder="e.g., 123 Health St, Wellness City" 
                        onBlur={handleBlur}
                        className={cn(
                          errors.address && "border-destructive focus-visible:ring-destructive",
                          isClient && watchedValues.address === defaultProfile.address && "border-primary/50"
                        )}
                    />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                 <h3 className="font-headline text-lg">Assets</h3>
                 <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <Label>Clinic Logo</Label>
                         <input
                            type="file"
                            ref={logoInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e.target.files?.[0] || null, 'clinicLogo')}
                        />
                         <div
                            onClick={() => logoInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                handleFileSelect(e.dataTransfer.files[0], 'clinicLogo');
                            }}
                            className="p-4 border-dashed border-2 rounded-lg mt-2 min-h-[120px] flex justify-center items-center bg-muted/50 hover:border-primary transition-colors cursor-pointer"
                        >
                            <Image 
                                key={watchedLogo}
                                src={watchedLogo || "/medcert-icon.svg"}
                                alt="Clinic Logo Preview" 
                                width={200}
                                height={200}
                                className="object-contain rounded-md"
                                data-ai-hint="clinic logo"
                                onError={(e) => e.currentTarget.src = '/medcert-icon.svg'}
                            />
                        </div>
                        <p className="text-sm text-muted-foreground text-center">Click or drag & drop image</p>
                        {errors.clinicLogo && <p className="text-sm text-destructive mt-1 text-center">{errors.clinicLogo.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Digital Signature</Label>
                        <input
                            type="file"
                            ref={signatureInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e.target.files?.[0] || null, 'digitalSignature')}
                        />
                         <div
                            onClick={() => signatureInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                handleFileSelect(e.dataTransfer.files[0], 'digitalSignature');
                            }}
                            className="p-4 border-dashed border-2 rounded-lg mt-2 min-h-[120px] flex justify-center items-center bg-muted/50 hover:border-primary transition-colors cursor-pointer"
                        >
                             <Image 
                                key={watchedSignature}
                                src={watchedSignature || defaultProfile.digitalSignature}
                                alt="Signature Preview" 
                                width={200}
                                height={100}
                                className="object-contain"
                                data-ai-hint="signature"
                                onError={(e) => { e.currentTarget.src = defaultProfile.digitalSignature; }}
                            />
                        </div>
                        <p className="text-sm text-muted-foreground text-center">Click or drag & drop image</p>
                        {errors.digitalSignature && <p className="text-sm text-destructive mt-1 text-center">{errors.digitalSignature.message}</p>}
                    </div>
                 </div>
              </div>
          </CardContent>
        </Card>
      </form>
    </main>
  );
}

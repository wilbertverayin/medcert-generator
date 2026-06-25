
'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Wand2, Copy, Check, ChevronsUpDown, FilePlus2, Save } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import useLocalStorage from '@/hooks/useLocalStorage';
import { handleExtract } from '@/lib/actions';
import type { CertificateData, ProfileData } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { CertificateDisplay } from '@/components/CertificateDisplay';
import { defaultProfile } from '@/lib/constants';

const certificateSchema = z.object({
  patientName: z.string().min(1, 'Patient name is required'),
  age: z.string().min(1, 'Age is required'),
  sex: z.enum(['Male', 'Female'], { required_error: 'Sex is required.'}),
  dateOfConsultation: z.date({ required_error: 'Date of consultation is required.' }),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  purpose: z.string().min(1, 'Purpose is required'),
  workStatus: z.enum(['Not fit', 'Fit'], { required_error: 'Please select a work status.'}),
  durationOfLeave: z.string().optional(),
  remarks: z.string().optional(),
  notFitToWorkMessage: z.string().optional(),
  fitToWorkMessage: z.string().optional(),
}).refine((data) => {
    if (data.workStatus === 'Not fit') {
        return !!data.durationOfLeave && data.durationOfLeave.trim() !== '';
    }
    return true;
}, {
    message: 'Duration of leave is required when status is "Not fit".',
    path: ['durationOfLeave'],
});

const defaultCertificateValues: Omit<z.infer<typeof certificateSchema>, 'dateOfConsultation'> & { dateOfConsultation: Date | undefined } = {
    patientName: '',
    age: '',
    sex: undefined,
    dateOfConsultation: new Date(),
    diagnosis: '',
    purpose: '',
    workStatus: 'Not fit',
    durationOfLeave: '',
    remarks: '',
    notFitToWorkMessage: 'He is advised to take a leave for a period of',
    fitToWorkMessage: 'He is deemed fit and may resume his duties.',
};

export default function HomePage() {
  const { toast } = useToast();
  const [profile] = useLocalStorage<ProfileData>('profile', defaultProfile);
  const [certificates, setCertificates] = useLocalStorage<Record<string, CertificateData>>('certificates', {});
  const [draft, setDraft] = useLocalStorage<z.infer<typeof certificateSchema>>('certificateDraft', defaultCertificateValues);
  
  const [isClient, setIsClient] = useState(false);
  const [certificateId, setCertificateId] = useLocalStorage('currentCertificateId', '');
  const [hasCopied, setHasCopied] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAgePopoverOpen, setIsAgePopoverOpen] = useState(false);
  const [isNewCertConfirmOpen, setIsNewCertConfirmOpen] = useState(false);
  
  const [hpi, setHpi] = useState('');
  const [isExtractingHpi, setIsExtractingHpi] = useState(false);
  const [isHighlightingRemarks, setIsHighlightingRemarks] = useState(false);
  const [isHighlightingNew, setIsHighlightingNew] = useState(false);
  const [isHpiModalOpen, setIsHpiModalOpen] = useState(false);
  const [qrCodeDataUri, setQrCodeDataUri] = useState<string>('');
  
  const remarksRef = useRef<HTMLTextAreaElement>(null);
  const hpiTextareaRef = useRef<HTMLTextAreaElement>(null);
  const notFitToWorkTextareaRef = useRef<HTMLTextAreaElement>(null);
  const fitToWorkTextareaRef = useRef<HTMLTextAreaElement>(null);
  const diagnosisTextareaRef = useRef<HTMLTextAreaElement>(null);

  const form = useForm<z.infer<typeof certificateSchema>>({
    resolver: zodResolver(certificateSchema),
    defaultValues: defaultCertificateValues
  });
  
  useEffect(() => {
    if (isClient && draft) {
        const draftWithDate = {
            ...draft,
            dateOfConsultation: draft.dateOfConsultation ? new Date(draft.dateOfConsultation) : new Date(),
        }
        form.reset(draftWithDate);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]);

  const watchedValues = form.watch();
  const watchWorkStatus = form.watch('workStatus');
  const watchSex = form.watch('sex');
  const watchedNotFitToWorkMessage = form.watch('notFitToWorkMessage');
  const watchedFitToWorkMessage = form.watch('fitToWorkMessage');
  const watchedDiagnosis = form.watch('diagnosis');
  
  // Save form data to local storage on change
  useEffect(() => {
    const subscription = form.watch((value) => {
      setDraft(value as z.infer<typeof certificateSchema>);
    });
    return () => subscription.unsubscribe();
  }, [form, setDraft]);


  useEffect(() => {
    setIsClient(true);
  }, []);

  // Generate ID on initial load if one doesn't exist
  useEffect(() => {
    if (isClient && !certificateId) {
        generateNewId(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]);

  useEffect(() => {
    const pronoun = watchSex === 'Male' ? 'He' : watchSex === 'Female' ? 'She' : 'He/She';
    const possessivePronoun = watchSex === 'Male' ? 'his' : watchSex === 'Female' ? 'her' : 'his/her';

    const currentNotFit = form.getValues('notFitToWorkMessage') || '';
    const newNotFit = currentNotFit.replace(/^(He\/She|He|She)/, pronoun);
    if (currentNotFit !== newNotFit) {
        form.setValue('notFitToWorkMessage', newNotFit, { shouldDirty: true });
    }

    const currentFit = form.getValues('fitToWorkMessage') || '';
    let newFit = currentFit.replace(/^(He\/She|He|She)/, pronoun);
    newFit = newFit.replace(/\b(his\/her|his|her)\b/g, possessivePronoun);
    if (currentFit !== newFit) {
        form.setValue('fitToWorkMessage', newFit, { shouldDirty: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchSex]);

  useEffect(() => {
    const textarea = hpiTextareaRef.current;
    if (isHpiModalOpen && textarea) {
        setTimeout(() => {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }, 0)
    }
  }, [hpi, isHpiModalOpen]);
  
  useEffect(() => {
      const textarea = notFitToWorkTextareaRef.current;
      if (textarea) {
          textarea.style.height = 'auto';
          textarea.style.height = `${textarea.scrollHeight}px`;
      }
  }, [watchedNotFitToWorkMessage]);

  useEffect(() => {
      const textarea = fitToWorkTextareaRef.current;
      if (textarea) {
          textarea.style.height = 'auto';
          textarea.style.height = `${textarea.scrollHeight}px`;
      }
  }, [watchedFitToWorkMessage]);
  
  useEffect(() => {
    const textarea = diagnosisTextareaRef.current;
    if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [watchedDiagnosis]);

  const verificationUrl = certificateId ? `https://medcertgen.visibleclinic.com/verify/${certificateId}` : '';

  useEffect(() => {
    const qrCodeApiUrl = verificationUrl
        ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(verificationUrl)}`
        : "";

    if (!qrCodeApiUrl) {
      setQrCodeDataUri("https://placehold.co/150x150.png");
      return;
    };

    const fetchQrCode = async () => {
      try {
        const response = await fetch(qrCodeApiUrl);
        if (!response.ok) throw new Error('QR code fetch failed');
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setQrCodeDataUri(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error('Failed to fetch QR code:', error);
        setQrCodeDataUri("https://placehold.co/150x150.png");
      }
    };

    fetchQrCode();
  }, [verificationUrl]);

  const certificatePreviewData: CertificateData = {
      id: certificateId,
      patientName: watchedValues.patientName || '',
      age: Number(watchedValues.age) || 0,
      sex: watchedValues.sex,
      dateOfConsultation: watchedValues.dateOfConsultation,
      diagnosis: watchedValues.diagnosis || '',
      purpose: watchedValues.purpose || '',
      workStatus: watchedValues.workStatus,
      durationOfLeave: watchedValues.durationOfLeave,
      remarks: watchedValues.remarks || '',
      notFitToWorkMessage: watchedValues.notFitToWorkMessage,
      fitToWorkMessage: watchedValues.fitToWorkMessage,
  };


  const generateNewId = (showToast = true) => {
    const firstPartOfUuid = crypto.randomUUID().split('-')[0];
    const asInt = BigInt('0x' + firstPartOfUuid);
    
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const base = BigInt(alphabet.length);
    
    let shortId = '';
    let num = asInt;
    
    if (num === 0n) {
        shortId = alphabet[0];
    } else {
        while (num > 0n) {
            shortId = alphabet[Number(num % base)] + shortId;
            num = num / base;
        }
    }

    const newId = shortId.padStart(6, '0');

    setCertificateId(newId);
    if(showToast) {
        toast({ variant: "info", title: "New Certificate ID Generated", description: `ID: ${newId}` });
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('text/')) {
      const reader = new FileReader();
      reader.onload = (readEvent) => {
        setHpi(readEvent.target?.result as string);
        toast({ variant: "info", title: 'File loaded successfully.' });
      };
      reader.readAsText(file);
    } else {
      toast({ variant: 'destructive', title: 'Invalid File', description: 'Please drop a valid text file.' });
    }
  };

  const handleExtractFromHpi = async () => {
    if (!hpi) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please provide an HPI to extract from.' });
      return;
    }
    setIsExtractingHpi(true);
    const result = await handleExtract(hpi);
    if (result.error) {
      toast({ variant: 'destructive', title: 'Extraction Failed', description: result.error });
    } else if (result.data) {
      form.setValue('diagnosis', result.data.diagnosis, { shouldValidate: true });
      form.setValue('remarks', result.data.summaryForCertificate, { shouldValidate: true });
      toast({ variant: "info", title: 'Extraction Successful', description: 'Diagnosis and Remarks have been populated.' });
      setIsHpiModalOpen(false);
      
      setTimeout(() => {
        remarksRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setIsHighlightingRemarks(true);
        setTimeout(() => setIsHighlightingRemarks(false), 2000); // Highlight for 2 seconds
      }, 100);

    }
    setIsExtractingHpi(false);
  };

  const onSubmit = async (data: z.infer<typeof certificateSchema>) => {
    const isProfileDefault = 
        profile.doctorName === defaultProfile.doctorName &&
        profile.prcNumber === defaultProfile.prcNumber &&
        profile.clinicName === defaultProfile.clinicName;

    if (isProfileDefault) {
        toast({
            variant: 'destructive',
            title: 'Update Your Profile',
            description: "Please update your professional details before saving a certificate.",
            action: (
                <Button asChild variant="secondary" size="sm">
                    <Link href="/profile">Go to Profile</Link>
                </Button>
            )
        });
        return;
    }

    if (!certificateId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please generate a certificate ID.' });
        return;
    }
    
    setIsPreviewOpen(true);
  };

  const handleSaveAndDownload = async () => {
    const html2pdf = (await import('html2pdf.js')).default;

    if (!certificateId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please generate a certificate ID.' });
        return;
    }
    
    const newCertificate: CertificateData = certificatePreviewData;
    setCertificates(prev => ({...prev, [certificateId]: newCertificate}));
    
    toast({
        variant: "info",
        title: 'Certificate Saved!',
        description: `Certificate ${certificateId} is now available for verification.`,
        action: (
            <Button asChild variant="secondary" size="sm">
                <Link href={`/verify/${certificateId}`} target="_blank">View</Link>
            </Button>
        )
    });
    
    const certificateElement = document.querySelector<HTMLElement>('#certificate-preview-content');
    if (certificateElement) {
        try {
            const opt = {
                margin:       0.5,
                filename:     `Medical-Certificate-${newCertificate.patientName.replace(/\s/g, '_')}-${certificateId}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, logging: false },
                jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
            };
            
            const images = Array.from(certificateElement.getElementsByTagName('img'));
            const imagePromises = images.map(img => {
                if (img.complete) {
                    return Promise.resolve();
                }
                return new Promise<void>(resolve => {
                    img.onload = () => resolve();
                    img.onerror = () => resolve(); // Don't block PDF generation on image error
                });
            });
            await Promise.all(imagePromises);

            html2pdf().from(certificateElement).set(opt).save();
        } catch (error) {
            console.error("Failed to generate PDF", error);
            toast({ variant: 'destructive', title: 'PDF Generation Failed', description: 'Could not generate the PDF file.' });
        }
    }

    setIsPreviewOpen(false);

    setIsHighlightingNew(true);
    setTimeout(() => {
        setIsHighlightingNew(false);
    }, 2000);
  };
  
  const onInvalid = (errors: any) => {
    const firstError = Object.keys(errors)[0];
    const firstErrorMessage = errors[firstError]?.message;

    toast({
        variant: "destructive",
        title: "Validation Error",
        description: firstErrorMessage || "Please fill in all required fields correctly.",
    });
  };

  const resetCertificate = () => {
    form.reset(defaultCertificateValues);
    setDraft(defaultCertificateValues as z.infer<typeof certificateSchema>);
    setHpi('');
    generateNewId(true);
  };

  const handleCreateNew = () => {
    const values = form.getValues();
    const isDirty = values.patientName || 
                    (values.age && values.age !== '') || 
                    values.diagnosis || 
                    values.purpose || 
                    values.remarks || 
                    values.durationOfLeave;

    if (isDirty) {
        setIsNewCertConfirmOpen(true);
    } else {
        resetCertificate();
    }
  };
  
  const copyToClipboard = () => {
    if (!verificationUrl) return;
    navigator.clipboard.writeText(verificationUrl);
    setHasCopied(true);
    toast({ variant: "info", title: "Copied to clipboard!", description: "Verification link is ready to be shared."})
    setTimeout(() => setHasCopied(false), 2000);
  };

  const qrCodeForDisplay = qrCodeDataUri || "https://placehold.co/150x150.png";

  if (!isClient) {
    return (
        <main className="container max-w-4xl mx-auto py-8">
            <div className="space-y-4">
                <Skeleton className="h-[700px] w-full" />
            </div>
        </main>
    );
  }

  return (
    <main className="container max-w-4xl mx-auto py-8">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-4">
                <Card className="shadow-lg">
                    <CardHeader className="bg-muted/50 p-4 border-b">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Image src={profile.clinicLogo || "/medcert-icon.svg"} alt="Clinic Logo" width={50} height={50} className="rounded-md object-contain" data-ai-hint="clinic logo"/>
                                <div>
                                    <p className="font-headline font-bold text-lg">{profile.clinicName || profile.doctorName || 'Your Clinic Name'}</p>
                                    {profile.address && <p className="text-xs text-muted-foreground">{profile.address}</p>}
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="font-headline text-2xl tracking-tight">Medical Certificate</h2>
                                <div className="flex items-center gap-1 justify-end mt-1">
                                    <p className="text-xs text-muted-foreground font-mono">ID: {certificateId || 'XXXXXX'}</p>
                                    <Button variant="ghost" size="icon" type="button" className="h-6 w-6" onClick={copyToClipboard}>
                                        {hasCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 text-sm space-y-6 leading-relaxed">
                        <div className="flex justify-end">
                            <FormField
                                control={form.control}
                                name="dateOfConsultation"
                                render={({ field }) => (
                                <FormItem className="w-56">
                                    <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                        <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? format(field.value, 'MMMM d, yyyy') : <span>Pick a date</span>}
                                        </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                    </PopoverContent>
                                    </Popover>
                                    <FormMessage className="hidden" />
                                </FormItem>
                                )}
                            />
                        </div>

                        <div className="pt-4 space-y-4">
                            <div className="leading-loose text-base">
                                This is to certify that 
                                <FormField
                                    control={form.control}
                                    name="patientName"
                                    render={({ field, fieldState: { error } }) => (
                                    <FormItem className="inline-block mx-1">
                                        <FormControl>
                                            <Input className={cn("w-48 h-8 align-baseline", error && "border-destructive")} placeholder="Patient's Name" {...field} />
                                        </FormControl>
                                        <FormMessage className="hidden" />
                                    </FormItem>
                                    )}
                                />, a
                                <FormField
                                    control={form.control}
                                    name="age"
                                    render={({ field, fieldState: { error } }) => (
                                        <FormItem className="inline-block mx-1">
                                            <Popover open={isAgePopoverOpen} onOpenChange={setIsAgePopoverOpen}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button variant="outline" role="combobox" className={cn("w-24 h-8 align-baseline justify-between", error && "border-destructive")}>
                                                            {field.value || "Age"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[300px] p-0">
                                                    <div className="p-2 border-b">
                                                        <Input
                                                            placeholder="Type age manually"
                                                            {...field}
                                                            onChange={e => {
                                                                const value = e.target.value;
                                                                if (/^\d*$/.test(value)) {
                                                                    field.onChange(value);
                                                                }
                                                            }}
                                                            className={cn(error && "border-destructive")}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-10 gap-1 p-2">
                                                        {Array.from({ length: 100 }, (_, i) => i + 1).map((ageNum) => (
                                                            <Button
                                                                key={ageNum}
                                                                type="button"
                                                                variant="ghost"
                                                                className={cn(
                                                                    "h-7 w-7 p-0",
                                                                    String(field.value) === String(ageNum) && "bg-accent"
                                                                )}
                                                                onClick={() => {
                                                                    field.onChange(String(ageNum));
                                                                    setIsAgePopoverOpen(false);
                                                                }}
                                                            >
                                                                {ageNum}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage className="hidden" />
                                        </FormItem>
                                    )}
                                /> year-old
                                <FormField
                                    control={form.control}
                                    name="sex"
                                    render={({ field, fieldState: { error } }) => (
                                    <FormItem className="inline-block mx-1">
                                        <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className={cn("w-28 h-8 align-baseline", error && "border-destructive")}><SelectValue placeholder="Sex" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                        </SelectContent>
                                        </Select>
                                        <FormMessage className="hidden" />
                                    </FormItem>
                                    )}
                                />, was seen and examined on the date specified and is diagnosed with the following condition:
                            </div>
                            <FormField
                                control={form.control}
                                name="diagnosis"
                                render={({ field, fieldState: { error } }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea
                                            id="diagnosis"
                                            {...field}
                                            ref={(e) => {
                                                field.ref(e);
                                                diagnosisTextareaRef.current = e;
                                            }}
                                            rows={1}
                                            placeholder="e.g. Acute Viral Nasopharyngitis"
                                            className={cn("font-bold resize-none overflow-y-hidden", error && "border-destructive")} />
                                    </FormControl>
                                    <FormMessage className="hidden" />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="purpose"
                                render={({ field, fieldState: { error } }) => (
                                <FormItem>
                                     <FormLabel>This certificate is issued for the purpose of:</FormLabel>
                                    <FormControl>
                                    <Input id="purpose" {...field} placeholder="e.g., For school excuse, for work from home setup" className={cn(error && "border-destructive")} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <p className="text-xs text-muted-foreground italic">
                                Note: This medical certificate is not valid for medico-legal purposes.
                            </p>
                        </div>
                        
                        <FormField
                            control={form.control}
                            name="workStatus"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormLabel className="font-semibold text-muted-foreground">Recommendation:</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    value={field.value}
                                    className="flex items-center space-x-4"
                                    >
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="Not fit" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Not Fit</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="Fit" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Fit</FormLabel>
                                    </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                </FormItem>
                            )}
                        />

                        {watchWorkStatus === 'Not fit' ? (
                             <div className="flex items-baseline gap-2 flex-wrap">
                                 <FormField
                                     control={form.control}
                                     name="notFitToWorkMessage"
                                     render={({ field, fieldState: { error } }) => (
                                         <FormItem className="flex-grow">
                                            <FormControl>
                                            <Textarea
                                                {...field}
                                                ref={(e) => {
                                                    field.ref(e);
                                                    notFitToWorkTextareaRef.current = e;
                                                }}
                                                rows={1}
                                                className={cn("w-full resize-none overflow-y-hidden", error && "border-destructive")}
                                            />
                                            </FormControl>
                                             <FormMessage className="hidden" />
                                         </FormItem>
                                     )}
                                 />
                                 <FormField
                                     control={form.control}
                                     name="durationOfLeave"
                                     render={({ field, fieldState: { error } }) => (
                                         <FormItem className="min-w-[120px]">
                                             <FormControl>
                                             <Input className={cn("font-bold", error && "border-destructive")} id="durationOfLeave" {...field} placeholder="e.g., 3 days" />
                                             </FormControl>
                                             <FormMessage className="hidden" />
                                         </FormItem>
                                     )}
                                 />.
                             </div>
                        ) : (
                             <FormField
                                 control={form.control}
                                 name="fitToWorkMessage"
                                 render={({ field, fieldState: { error } }) => (
                                     <FormItem>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                ref={(e) => {
                                                    field.ref(e);
                                                    fitToWorkTextareaRef.current = e;
                                                }}
                                                rows={2}
                                                className={cn("w-full resize-none overflow-y-hidden", error && "border-destructive")}
                                            />
                                        </FormControl>
                                        <FormMessage className="hidden" />
                                     </FormItem>
                                 )}
                             />
                        )}
                        
                        
                        <FormField
                            control={form.control}
                            name="remarks"
                            render={({ field, fieldState: { error } }) => (
                            <FormItem>
                                <div className='flex justify-between items-center mb-2'>
                                <FormLabel className="font-semibold text-muted-foreground">Remarks:</FormLabel>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setIsHpiModalOpen(true)} className="border-primary text-primary hover:bg-primary/5 hover:text-primary">
                                        <Wand2 className="h-4 w-4 mr-2" />
                                        <span>Generate from HPI</span>
                                    </Button>
                                </div>
                                <FormControl>
                                    <Textarea 
                                        id="remarks" 
                                        rows={3} 
                                        placeholder="e.g., Patient presented with fever and cough... (Optional)" 
                                        {...field}
                                        ref={(e) => {
                                            field.ref(e);
                                            remarksRef.current = e;
                                        }}
                                        className={cn(isHighlightingRemarks && 'ring-2 ring-primary ring-offset-2 transition-all duration-1000 ease-out', error && "border-destructive")}
                                    />
                                </FormControl>
                                <FormMessage className="hidden" />
                            </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="p-4 border-t flex justify-between items-end">
                        <div>
                            <div className="bg-white p-1 rounded-none border-4 border-white">
                                <Image src={qrCodeForDisplay} width={120} height={120} alt="QR Code for verification" className="rounded-none"/>
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

                <div className="flex flex-col sm:flex-row gap-4 !mt-8">
                    <Button type="button" variant="outline" size="sm" className={cn("w-full transition-all", isHighlightingNew && "ring-2 ring-primary ring-offset-2")} onClick={handleCreateNew}>
                        <FilePlus2 />
                        New Certificate
                    </Button>
                    <Button type="submit" size="sm" className="w-full">
                        <Save />
                        Generate &amp; Save Certificate
                    </Button>
                </div>
            </form>
        </Form>
        
        <Dialog open={isHpiModalOpen} onOpenChange={setIsHpiModalOpen}>
            <DialogContent className="max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Extract from HPI</DialogTitle>
                    <DialogDescription>
                        Paste the History of Present Illness below to automatically generate the diagnosis and remarks.
                    </DialogDescription>
                </DialogHeader>
                <div 
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="p-4 border-2 border-dashed rounded-md bg-muted/50 hover:border-primary transition-colors flex-grow min-h-0 overflow-y-auto"
                >
                    <Textarea 
                        ref={hpiTextareaRef}
                        placeholder="Patient presents with..."
                        value={hpi}
                        onChange={(e) => setHpi(e.target.value)}
                        rows={1}
                        className="bg-background resize-none w-full min-h-full overflow-hidden"
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsHpiModalOpen(false)}>Cancel</Button>
                    <Button type="button" onClick={handleExtractFromHpi} disabled={isExtractingHpi || !hpi}>
                        <Wand2 className={cn("mr-2 h-4 w-4", isExtractingHpi && "animate-spin")}/>
                        {isExtractingHpi ? 'Generating...' : 'Generate'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

         <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogContent className="max-w-4xl p-0" id="certificate-preview-dialog" showCloseButton={false}>
                <DialogHeader className="p-4 sr-only">
                    <DialogTitle>Certificate Preview</DialogTitle>
                    <DialogDescription>
                        This is a preview of the medical certificate.
                    </DialogDescription>
                </DialogHeader>
                <div className="overflow-y-auto bg-muted/30 p-8 max-h-[90vh] print:p-0 print:bg-transparent print:overflow-visible">
                    <div id="certificate-preview-content" className="mx-auto w-full max-w-[800px] bg-background shadow-xl print:shadow-none">
                        <CertificateDisplay certificate={certificatePreviewData} profile={profile} qrCodeUrlOverride={qrCodeDataUri} />
                    </div>
                </div>
                <DialogFooter className="p-4 border-t bg-background print:hidden">
                    <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveAndDownload}>Save &amp; Download</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        <AlertDialog open={isNewCertConfirmOpen} onOpenChange={setIsNewCertConfirmOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will clear the current form and create a new certificate. Your unsaved changes will be lost.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                        resetCertificate();
                        setIsNewCertConfirmOpen(false);
                    }}>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </main>
  );
}
    

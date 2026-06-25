"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import useLocalStorage from "@/hooks/useLocalStorage";
import type { ProfileData } from "@/lib/types";
import { defaultProfile } from "@/lib/constants";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

const Header = () => {
  const pathname = usePathname();
  const [profile] = useLocalStorage<ProfileData>('profile', defaultProfile);
  const [showProfileNotification, setShowProfileNotification] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after hydration
    const isProfileDefault = 
      profile.doctorName === defaultProfile.doctorName &&
      profile.prcNumber === defaultProfile.prcNumber &&
      profile.clinicName === defaultProfile.clinicName;
    
    setShowProfileNotification(isProfileDefault && pathname !== '/profile');
  }, [profile, pathname]);

  const navLinks = [
    { href: "/profile", label: "Profile", icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Image src="/medcert-icon.svg" alt="MedCertGen Icon" width={32} height={32} />
          <div className="relative">
            <span className="font-body text-xl font-bold text-primary">MedCertGen</span>
            <Badge variant="default" className="absolute -bottom-2 -right-7 text-[9px] font-light px-1 py-0 rounded-md">BETA</Badge>
          </div>
        </Link>
        <nav className="flex flex-1 items-center justify-end gap-2">
          {navLinks.map((link) => (
            <Button 
              key={link.href} 
              variant="ghost" 
              asChild 
              className={cn(
                "relative text-muted-foreground",
                pathname === link.href && "text-foreground",
                showProfileNotification && "text-primary hover:text-primary/90"
              )}
            >
               <Link
                href={link.href}
                className="flex items-center gap-1.5"
               >
                {link.icon}
                {link.label}
                 {showProfileNotification && (
                  <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-primary ring-1 ring-background" aria-hidden="true" />
                )}
              </Link>
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;

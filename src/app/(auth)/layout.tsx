
import React from 'react';
import { Logo } from '@/components/icons/Logo';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-muted/50 p-4">
       <div className="absolute top-8">
        <Link href="/" className="flex items-center space-x-2">
            <Logo className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">BCHAT</span>
        </Link>
       </div>
      {children}
    </main>
  );
}

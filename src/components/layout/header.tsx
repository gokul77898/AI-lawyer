"use client";

import Link from 'next/link';
import { Scale, MessageSquare, FileText, Users, Headphones, ShieldAlert, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PanicModal } from '@/components/panic-modal';
import { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function AppHeader() {
  const [isPanicModalOpen, setPanicModalOpen] = useState(false);

  return (
    <>
      <header className="bg-card shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
              <Scale className="w-8 h-8" />
              <span className="font-headline">LexMate</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              <Button variant="ghost" asChild>
                <Link href="/"><MessageSquare className="mr-2 h-4 w-4" /> Live Chat</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/summarize"><FileText className="mr-2 h-4 w-4" /> Summarize</Link>
              </Button>
               <Button variant="ghost" asChild>
                <Link href="/advice"><Headphones className="mr-2 h-4 w-4" /> Get Advice</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/lawyers"><Users className="mr-2 h-4 w-4" /> Find a Lawyer</Link>
              </Button>
            </nav>
            <div className="flex items-center gap-2">
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Languages className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Select Language</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>English</DropdownMenuItem>
                  <DropdownMenuItem disabled>हिन्दी (Hindi)</DropdownMenuItem>
                  <DropdownMenuItem disabled>ಕನ್ನಡ (Kannada)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="destructive" onClick={() => setPanicModalOpen(true)}>
                <ShieldAlert className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Panic Mode</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      <PanicModal open={isPanicModalOpen} onOpenChange={setPanicModalOpen} />
    </>
  );
}

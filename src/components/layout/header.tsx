"use client";

import Link from 'next/link';
import { Scale, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AppHeader() {
  return (
    <>
      <header className="bg-card shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
              <Scale className="w-8 h-8" />
              <span className="font-headline">LexMate</span>
            </Link>
            <nav>
              <Button variant="ghost" asChild>
                <Link href="/"><MessageSquare className="mr-2 h-4 w-4" /> Live Consultation</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}

"use client";

import Link from 'next/link';
import { Scale } from 'lucide-react';

export function AppHeader() {
  return (
    <>
      <header className="bg-card shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-start h-20">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
              <Scale className="w-8 h-8" />
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}

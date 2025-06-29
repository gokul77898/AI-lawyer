import { Info } from 'lucide-react';

export function Disclaimer() {
  return (
    <div className="mt-6 p-4 bg-card border-l-4 border-primary rounded-r-lg flex items-start gap-3 text-sm shadow-md">
      <Info className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
      <div>
        <p className="font-bold font-headline">Disclaimer</p>
        <p className="text-muted-foreground">
          LexMate provides AI-powered assistance and is not a substitute for professional legal advice from a qualified human lawyer. We are not a law firm and do not provide legal representation.
        </p>
      </div>
    </div>
  );
}

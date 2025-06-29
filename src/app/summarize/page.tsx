import { SummarizeForm } from "@/components/summarize-form";
import { FileText } from "lucide-react";

export default function SummarizePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center">
        <FileText className="mx-auto h-12 w-12 text-primary" />
        <h1 className="text-3xl font-bold mt-4 font-headline">Summarize Legal Documents</h1>
        <p className="mt-2 text-muted-foreground">
          Upload a legal document (FIR, petition, case law) to get a concise summary.
        </p>
      </div>
      <SummarizeForm />
    </div>
  );
}

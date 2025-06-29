'use client';

import { useState, useTransition } from 'react';
import { summarizeLegalDocument } from '@/ai/flows/summarize-legal-documents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, FileText } from 'lucide-react';
import { Label } from '@/components/ui/label';

export function SummarizeForm() {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState('');
  const [isPending, startTransition] = useTransition();
  const [fileName, setFileName] = useState('');
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setSummary(''); // Clear previous summary
    }
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select a document to summarize.",
      });
      return;
    }

    setSummary('');
    startTransition(async () => {
      try {
        const dataUri = await fileToDataUri(file);
        const result = await summarizeLegalDocument({ documentDataUri: dataUri });
        if (result?.summary) {
          setSummary(result.summary);
        } else {
          throw new Error("The summarization result was empty.");
        }
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Summarization Failed",
          description: "Could not summarize the document. Please try again with a different file.",
        });
      }
    });
  };

  return (
    <Card className="mt-8 shadow-lg">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload Document</Label>
            <div className="flex items-center gap-4">
              <Input id="file-upload" type="file" onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx,.txt"/>
              <label htmlFor="file-upload" className="flex-grow cursor-pointer">
                  <div className="flex items-center justify-center w-full h-10 px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background text-muted-foreground hover:bg-secondary">
                    <UploadCloud className="w-5 h-5 mr-2" />
                    <span className="truncate">{fileName || "Choose a file..."}</span>
                  </div>
              </label>
              <Button type="submit" disabled={!file || isPending} className="whitespace-nowrap">
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                Summarize
              </Button>
            </div>
          </div>
        </form>
        {isPending && (
          <div className="mt-6 flex flex-col items-center justify-center text-muted-foreground p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-center">Summarizing your document, please wait...</p>
          </div>
        )}
        {summary && (
          <Card className="mt-6 bg-secondary">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-foreground/90">{summary}</p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

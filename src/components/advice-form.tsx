'use client';

import { useState, useTransition } from 'react';
import { getEmotionallyAwareAdvice } from '@/ai/flows/emotionally-aware-advice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AdviceForm() {
  const [legalQuery, setLegalQuery] = useState('');
  const [emotion, setEmotion] = useState('');
  const [advice, setAdvice] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalQuery || !emotion) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter your legal query and select your current emotional state.",
      });
      return;
    }

    setAdvice('');
    startTransition(async () => {
      try {
        const result = await getEmotionallyAwareAdvice({ legalQuery, emotion });
        if (result?.adaptedExplanation) {
          setAdvice(result.adaptedExplanation);
        } else {
          throw new Error("The advice result was empty.");
        }
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Failed to Get Advice",
          description: "Could not get advice at this time. Please try again later.",
        });
      }
    });
  };

  return (
    <Card className="mt-8 shadow-lg">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="legal-query">Your Legal Question</Label>
              <Textarea
                id="legal-query"
                value={legalQuery}
                onChange={(e) => setLegalQuery(e.target.value)}
                placeholder="Describe your legal situation..."
                rows={5}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emotion">How are you feeling?</Label>
              <Select value={emotion} onValueChange={setEmotion} disabled={isPending}>
                <SelectTrigger id="emotion">
                  <SelectValue placeholder="Select emotion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calm">Calm</SelectItem>
                  <SelectItem value="stressed">Stressed</SelectItem>
                  <SelectItem value="anxious">Anxious</SelectItem>
                  <SelectItem value="confused">Confused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" disabled={!legalQuery || !emotion || isPending} className="w-full">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Get Adapted Advice
          </Button>
        </form>
        {isPending && (
          <div className="mt-6 flex flex-col items-center justify-center text-muted-foreground p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4">Tailoring your advice...</p>
          </div>
        )}
        {advice && (
          <Card className="mt-6 bg-secondary">
            <CardHeader>
              <CardTitle>Your Tailored Advice</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-foreground/90">{advice}</p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

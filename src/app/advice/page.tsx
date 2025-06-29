import { AdviceForm } from "@/components/advice-form";
import { Headphones } from "lucide-react";

export default function AdvicePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center">
        <Headphones className="mx-auto h-12 w-12 text-primary" />
        <h1 className="text-3xl font-bold mt-4 font-headline">Emotionally-Aware Advice</h1>
        <p className="mt-2 text-muted-foreground">
          Get legal explanations tailored to your emotional state for better understanding.
        </p>
      </div>
      <AdviceForm />
    </div>
  );
}

import { ChatInterface } from "@/components/chat-interface";
import { Disclaimer } from "@/components/disclaimer";

export default function Home() {
  return (
    <div className="flex flex-col h-full">
      <h1 className="text-3xl font-bold text-center mb-2 font-headline">Live Legal Consultation</h1>
      <p className="text-center text-muted-foreground mb-6">
        Chat with our AI assistant for real-time legal information and guidance.
      </p>
      <div className="flex-grow flex flex-col justify-end bg-card p-4 sm:p-6 rounded-lg shadow-lg">
        <ChatInterface />
      </div>
       <Disclaimer />
    </div>
  );
}

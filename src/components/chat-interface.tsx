'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { liveLegalConsultation } from '@/ai/flows/live-legal-consultation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, User, Bot, Loader2, Save } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const initialMessage: Message = {
    role: 'assistant',
    content: "Hello! I am LexMate, your AI legal assistant. How can I help you today? You can ask me about Indian or international law.",
};

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const scrollAreaVp = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (scrollAreaVp.current) {
        scrollAreaVp.current.scrollTop = scrollAreaVp.current.scrollHeight;
      }
  }, [messages, isPending]);

  const handleSaveHistory = () => {
    try {
      const chatHistory = JSON.stringify(messages);
      localStorage.setItem('lexmate-chat-history', chatHistory);
      toast({
        title: "Chat History Saved",
        description: "Your conversation has been saved to your browser's local storage.",
      });
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Failed to Save History",
        description: "Could not save chat history. Your browser might not support local storage or it is full.",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    startTransition(async () => {
      const result = await liveLegalConsultation({ query: input });
      if (result?.response) {
        const assistantMessage: Message = { role: 'assistant', content: result.response };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
         const errorMessage: Message = { role: 'assistant', content: "I'm sorry, I encountered an error and couldn't process your request." };
         setMessages(prev => [...prev, errorMessage]);
      }
    });
  };

  return (
    <div className="flex flex-col h-[65vh] w-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-lg font-semibold font-headline">Conversation</h2>
        <Button variant="outline" size="sm" onClick={handleSaveHistory}>
          <Save className="mr-2 h-4 w-4" /> Save Chat
        </Button>
      </div>
      <ScrollArea className="flex-grow mb-4 pr-4 -mr-4" viewportRef={scrollAreaVp}>
        <div className="space-y-6 pr-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex items-start gap-3 sm:gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground"><Bot /></AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[85%] p-3 rounded-lg shadow-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === 'user' && (
                 <Avatar className="h-8 w-8 flex-shrink-0">
                   <AvatarFallback><User /></AvatarFallback>
                 </Avatar>
              )}
            </div>
          ))}
          {isPending && (
             <div className="flex items-start gap-4">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground"><Bot /></AvatarFallback>
                </Avatar>
                <div className="max-w-[80%] p-3 rounded-lg bg-secondary flex items-center shadow-sm">
                   <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <form onSubmit={handleSubmit} className="flex items-center gap-2 sm:gap-4 mt-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your legal question here..."
          className="flex-grow resize-none"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
            }
          }}
          disabled={isPending}
        />
        <Button type="submit" size="icon" className="flex-shrink-0" disabled={!input.trim() || isPending}>
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
}

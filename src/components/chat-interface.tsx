'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Video, VideoOff, Scale, Loader2, Sparkles, PhoneOff, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generateGreeting } from '@/ai/flows/greeting-flow';
import { liveLegalConsultation, LiveConsultationInput } from '@/ai/flows/live-legal-consultation';

// Define message type for conversation history
type Message = {
  role: 'user' | 'model';
  content: string;
};

// Define AI status types
type AiStatus = 'idle' | 'listening' | 'processing' | 'speaking';

export function VideoConsultation() {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For initial start
  
  const [aiStatus, setAiStatus] = useState<AiStatus>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAwaitingDocument, setIsAwaitingDocument] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Core function to handle conversation turns with the AI
  const continueConsultation = useCallback(async (query: string, documentDataUri?: string) => {
    setAiStatus('processing');
    setIsAwaitingDocument(false); // Stop waiting for a doc once we send a new request
    
    const historyForAi: LiveConsultationInput['history'] = messages.map(m => ({ role: m.role, content: m.content }));
    
    const input: LiveConsultationInput = { query, history: historyForAi };
    if (documentDataUri) {
      input.documentDataUri = documentDataUri;
    }

    try {
      const result = await liveLegalConsultation(input);
      
      if (result.media && result.text) {
        setMessages(prev => [
          ...prev, 
          { role: 'user', content: query },
          { role: 'model', content: result.text }
        ]);

        if (result.documentRequest) {
          setIsAwaitingDocument(true);
        }

        setAiStatus('speaking');
        if(audioRef.current) {
            audioRef.current.src = result.media;
            audioRef.current.play();
        }
      } else {
        throw new Error('No audio/text received from consultation flow.');
      }
    } catch (error) {
      console.error('Error during consultation:', error);
      toast({
        variant: 'destructive',
        title: 'Consultation Error',
        description: 'Sorry, I encountered an issue. Please try again.',
      });
      setAiStatus('listening');
    }
  }, [messages, toast]);
  
  // Setup Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        variant: 'destructive',
        title: 'Browser Not Supported',
        description: 'Speech recognition is not supported in your browser.',
      });
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        continueConsultation(transcript);
      }
    };
    
    recognition.onerror = (event) => {
       if (aiStatus === 'listening' && event.error !== 'no-speech' && event.error !== 'aborted') {
         console.error('Speech recognition error:', event.error);
         toast({
          variant: 'destructive',
          title: 'Mic Error',
          description: 'Could not understand audio. Please check your microphone.',
        });
      }
    };

    recognition.onend = () => {
      if (aiStatus === 'listening') {
        try { recognition.start(); } catch(e) { console.error("Could not restart recognition", e); }
      }
    };
    
    recognitionRef.current = recognition;

  }, [toast, aiStatus, continueConsultation]);
  
  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (aiStatus === 'listening' && isMicOn) {
      try { recognition.start(); } catch (e) { /* May fail if already started */ }
    } else {
       try { recognition.stop(); } catch (e) { /* May fail if already stopped */ }
    }
  }, [aiStatus, isMicOn]);

  useEffect(() => {
    if (!isCameraOn || !isStarted) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }

    let stream: MediaStream | null = null;
    const getCameraPermission = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        setIsCameraOn(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOn, isStarted, toast]);

  const toggleCamera = () => {
      setIsCameraOn(prev => !prev);
  }

  const handleStartConsultation = async () => {
    setIsLoading(true);
    setMessages([]);
    try {
      const result = await generateGreeting();
      if (result.media && audioRef.current) {
        setIsStarted(true);
        setAiStatus('speaking');
        audioRef.current.src = result.media;
        audioRef.current.play();
      } else {
        throw new Error('No greeting audio received.');
      }
    } catch (error) {
      console.error('Error starting consultation:', error);
      toast({
        variant: 'destructive',
        title: 'Consultation Error',
        description: 'Could not start the consultation. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndConsultation = () => {
    setIsStarted(false);
    setAiStatus('idle');
    setMessages([]);
    setIsAwaitingDocument(false);
    if (audioRef.current) audioRef.current.src = '';
    setIsCameraOn(false);
  };
  
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    const onEnded = () => {
        if (isStarted) { setAiStatus('listening'); }
    };
    audioEl.addEventListener('ended', onEnded);
    return () => audioEl.removeEventListener('ended', onEnded);
  }, [isStarted]);
  
  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAiStatus('processing');
    try {
      const dataUri = await fileToDataUri(file);
      continueConsultation("I've uploaded the document you requested.", dataUri);
    } catch (error) {
      console.error("Error reading file:", error);
      toast({
        variant: "destructive",
        title: "File Read Error",
        description: "Could not read the selected file."
      });
      setAiStatus('listening');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  const getAiStatusText = () => {
    switch(aiStatus) {
      case 'listening': return isAwaitingDocument ? 'Awaiting document or your response...' : 'Listening...';
      case 'processing': return 'Thinking...';
      case 'speaking': return 'Speaking...';
      default: return 'Ready for consultation';
    }
  };

  return (
    <div className="w-full h-[75vh] flex flex-col items-center justify-center">
        <Card className="w-full h-full overflow-hidden shadow-2xl">
            <CardContent className="p-0 h-full bg-black">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              {!isStarted ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center text-white">
                  <Scale className="h-24 w-24 text-white/80" />
                  <h2 className="mt-4 text-4xl font-bold">AI Lawyer</h2>
                  <p className="mt-2 text-lg text-white/70">
                    {getAiStatusText()}
                  </p>
                  <Button onClick={handleStartConsultation} disabled={isLoading} className="mt-8" size="lg">
                      {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                      Start Consultation
                  </Button>
                </div>
              ) : (
                <div className="relative w-full h-full">
                  <div className="w-full h-full flex flex-col items-center justify-center text-center bg-black">
                      <div className="relative">
                          <Scale className={`h-24 w-24 text-white/80 transition-opacity duration-300 ${aiStatus === 'listening' ? 'opacity-100' : 'opacity-50'}`} />
                          {aiStatus === 'listening' && <div className="absolute inset-0 rounded-full bg-green-500/50 animate-ping"></div>}
                          {aiStatus === 'processing' && <Loader2 className="absolute inset-0 m-auto h-12 w-12 text-white/90 animate-spin" />}
                      </div>
                      <h2 className="mt-4 text-4xl font-bold text-white opacity-50">AI Lawyer</h2>
                      <p className="mt-2 text-lg text-white/70">{getAiStatusText()}</p>
                  </div>
                  
                  <div className="absolute top-4 right-4 w-48 h-36 z-10 bg-black rounded-md">
                     <video ref={videoRef} className="w-full h-full rounded-md object-cover" autoPlay muted playsInline />
                     {!isCameraOn && (
                         <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
                             <VideoOff className="text-white" />
                         </div>
                     )}
                  </div>

                  {hasCameraPermission === false && (
                      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md z-10 px-4">
                          <Alert variant="destructive">
                              <AlertTitle>Camera Error</AlertTitle>
                              <AlertDescription>Camera access was denied. Please enable it in your browser settings.</AlertDescription>
                          </Alert>
                      </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50 z-20">
                      <div className="flex justify-center items-center gap-4">
                          <Button
                              variant={isMicOn ? 'secondary' : 'destructive'}
                              size="icon"
                              className="rounded-full h-14 w-14"
                              onClick={() => setIsMicOn(prev => !prev)}
                              disabled={aiStatus !== 'listening' && aiStatus !== 'idle'}
                          >
                              {isMicOn ? <Mic size={28}/> : <MicOff size={28} />}
                          </Button>
                          <Button
                              variant={isCameraOn ? 'secondary' : 'destructive'}
                              size="icon"
                              className="rounded-full h-14 w-14"
                              onClick={toggleCamera}
                          >
                              {isCameraOn ? <Video size={28}/> : <VideoOff size={28}/>}
                          </Button>
                          {isAwaitingDocument && (
                            <Button
                                variant='secondary'
                                size="icon"
                                className="rounded-full h-14 w-14 bg-blue-600 hover:bg-blue-700"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={aiStatus !== 'listening'}
                            >
                                <Upload size={28}/>
                            </Button>
                          )}
                           <Button
                              variant='destructive'
                              size="icon"
                              className="rounded-full h-14 w-14"
                              onClick={handleEndConsultation}
                          >
                              <PhoneOff size={28}/>
                          </Button>
                      </div>
                  </div>
                </div>
              )}
              <audio ref={audioRef} />
            </CardContent>
        </Card>
    </div>
  );
}

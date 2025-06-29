'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Video, VideoOff, Scale, Loader2, Sparkles, PhoneOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generateGreeting } from '@/ai/flows/greeting-flow';
import { liveLegalConsultation } from '@/ai/flows/live-legal-consultation';

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
  const { toast } = useToast();

  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For initial start
  
  const [aiStatus, setAiStatus] = useState<AiStatus>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Function to handle the AI response and start listening again
  const handleAiResponse = useCallback(async (query: string) => {
    setAiStatus('processing');
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    
    try {
      const result = await liveLegalConsultation({ query, history });
      
      if (result.media && result.text) {
        setMessages(prev => [
          ...prev, 
          { role: 'user', content: query },
          { role: 'model', content: result.text }
        ]);
        setAiStatus('speaking');
        if(audioRef.current) {
            audioRef.current.src = result.media;
            audioRef.current.play();
        }
      } else {
        throw new Error('No audio received from consultation flow.');
      }
    } catch (error) {
      console.error('Error during consultation:', error);
      toast({
        variant: 'destructive',
        title: 'Consultation Error',
        description: 'Sorry, I encountered an issue. Please try again.',
      });
      setAiStatus('listening'); // Go back to listening on error
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
        handleAiResponse(transcript);
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
       if (aiStatus === 'listening' && event.error !== 'no-speech' && event.error !== 'aborted') {
         toast({
          variant: 'destructive',
          title: 'Mic Error',
          description: 'Could not understand audio. Please check your microphone.',
        });
      }
    };

    recognition.onend = () => {
      // Automatically restart recognition if we are in listening mode
      if (aiStatus === 'listening') {
        try {
          recognition.start();
        } catch(e) {
          console.error("Could not restart recognition", e);
        }
      }
    };
    
    recognitionRef.current = recognition;

  }, [toast, aiStatus, handleAiResponse]);
  
  // Controls listening state based on AI status and mic toggle
  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (aiStatus === 'listening' && isMicOn) {
      try {
        recognition.start();
      } catch (e) {
        // May fail if already started, which is fine.
      }
    } else {
       try {
        recognition.stop();
      } catch (e) {
        // May fail if already stopped
      }
    }
  }, [aiStatus, isMicOn]);

  // Handle camera permission and stream
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
        setAiStatus('speaking'); // Initial state is AI speaking the greeting
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
    if (audioRef.current) audioRef.current.src = '';
    setIsCameraOn(false);
  };
  
  // When AI finishes speaking, switch to listening
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    
    const onEnded = () => {
        if (isStarted) {
            setAiStatus('listening');
        }
    };
    
    audioEl.addEventListener('ended', onEnded);
    return () => audioEl.removeEventListener('ended', onEnded);
  }, [isStarted]);


  const getAiStatusText = () => {
    switch(aiStatus) {
      case 'listening': return 'Listening...';
      case 'processing': return 'Thinking...';
      case 'speaking': return 'Speaking...';
      default: return 'Ready for consultation';
    }
  };


  return (
    <div className="w-full h-[75vh] flex flex-col items-center justify-center">
        <Card className="w-full h-full overflow-hidden shadow-2xl">
            <CardContent className="p-0 h-full bg-black">
              {!isStarted ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center text-white">
                  <Scale className="h-24 w-24 text-white/80" />
                  <h2 className="mt-4 text-4xl font-bold">AI Lawyer</h2>
                  <p className="mt-2 text-lg text-white/70">
                    {getAiStatusText()}
                  </p>
                  <Button onClick={handleStartConsultation} disabled={isLoading} className="mt-8" size="lg">
                      {isLoading ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                          <Sparkles className="mr-2 h-5 w-5" />
                      )}
                      Start Consultation
                  </Button>
                </div>
              ) : (
                <div className="relative w-full h-full">
                  <div className="w-full h-full flex flex-col items-center justify-center text-center bg-black">
                      <div className="relative">
                          <Scale className={`h-24 w-24 text-white/80 transition-opacity duration-300 ${aiStatus === 'listening' ? 'opacity-100' : 'opacity-50'}`} />
                          {aiStatus === 'listening' && (
                              <div className="absolute inset-0 rounded-full bg-green-500/50 animate-ping"></div>
                          )}
                          {aiStatus === 'processing' && (
                              <Loader2 className="absolute inset-0 m-auto h-12 w-12 text-white/90 animate-spin" />
                          )}
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
                              <AlertDescription>
                                  Camera access was denied. Please enable it in your browser settings.
                              </AlertDescription>
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

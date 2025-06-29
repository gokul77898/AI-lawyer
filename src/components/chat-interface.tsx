'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Video, VideoOff, Scale, Loader2, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generateGreeting } from '@/ai/flows/greeting-flow';

export function VideoConsultation() {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);

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
    try {
      const result = await generateGreeting();
      if (result.media) {
        setAudioSrc(result.media);
        setIsStarted(true);
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


  return (
    <div className="w-full h-[75vh] flex flex-col items-center justify-center">
        <Card className="w-full h-full overflow-hidden shadow-2xl">
            <CardContent className="p-0 h-full bg-black">
              {!isStarted ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center text-white">
                  <Scale className="h-24 w-24 text-white/80" />
                  <h2 className="mt-4 text-4xl font-bold">AI Lawyer</h2>
                  <p className="mt-2 text-lg text-white/70">
                    Ready for consultation
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
                      <Scale className="h-24 w-24 text-white/80 opacity-50" />
                      <h2 className="mt-4 text-4xl font-bold text-white opacity-50">AI Lawyer</h2>
                      <p className="mt-2 text-lg text-white/70">Listening...</p>
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
                      </div>
                  </div>
                </div>
              )}
              {audioSrc && <audio src={audioSrc} autoPlay />}
            </CardContent>
        </Card>
    </div>
  );
}

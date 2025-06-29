'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Video, Mic, VideoOff, MicOff, User, Bot } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';

export function ChatInterface() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Media Access Denied',
          description: 'Please enable camera and microphone permissions in your browser settings.',
        });
      }
    };

    getCameraPermission();

    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [toast]);

  useEffect(() => {
    if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getAudioTracks().forEach(track => track.enabled = !isAudioMuted);
        stream.getVideoTracks().forEach(track => track.enabled = !isVideoOff);
    }
  }, [isAudioMuted, isVideoOff]);


  return (
    <div className="w-full h-full flex items-center justify-center">
        <Card className="w-full max-w-4xl shadow-2xl">
            <CardContent className="p-4 md:p-6 grid md:grid-cols-2 gap-4">
                <div className="relative w-full aspect-video bg-secondary rounded-lg overflow-hidden border flex flex-col items-center justify-center">
                    <video ref={videoRef} className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`} autoPlay muted />
                     { isVideoOff && (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Avatar className="h-24 w-24">
                               <AvatarFallback><User size={48}/></AvatarFallback>
                            </Avatar>
                            <p>Your camera is off</p>
                        </div>
                    )}
                    { hasCameraPermission === false && (
                         <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4">
                            <Alert variant="destructive">
                                <AlertTitle>Camera Access Required</AlertTitle>
                                <AlertDescription>
                                    Please allow camera access.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 text-sm rounded-md">You</div>
                </div>
                 <div className="relative w-full aspect-video bg-secondary rounded-lg overflow-hidden border flex flex-col items-center justify-center text-muted-foreground">
                    <Avatar className="h-24 w-24">
                        <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={48}/></AvatarFallback>
                    </Avatar>
                    <p className="mt-4">Connecting to LexMate...</p>
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 text-sm rounded-md">AI Assistant</div>
                </div>
            </CardContent>
             <div className="flex justify-center gap-4 p-4 border-t">
                <Button size="icon" variant={isAudioMuted ? 'destructive' : 'secondary'} className="rounded-full h-12 w-12" onClick={() => setIsAudioMuted(p => !p)}>
                    {isAudioMuted ? <MicOff /> : <Mic />}
                </Button>
                <Button size="icon" variant={isVideoOff ? 'destructive' : 'secondary'} className="rounded-full h-12 w-12" onClick={() => setIsVideoOff(p => !p)}>
                    {isVideoOff ? <VideoOff /> : <Video />}
                </Button>
            </div>
        </Card>
    </div>
  );
}

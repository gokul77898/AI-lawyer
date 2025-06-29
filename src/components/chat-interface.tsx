'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function VideoConsultation() {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isCameraOn) {
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
  }, [isCameraOn, toast]);

  const toggleCamera = () => {
      setIsCameraOn(prev => !prev);
  }

  return (
    <div className="w-full h-[75vh] flex flex-col items-center justify-center">
        <Card className="w-full h-full relative overflow-hidden shadow-2xl">
            <CardContent className="p-0 h-full">
                
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
            </CardContent>
        </Card>
    </div>
  );
}

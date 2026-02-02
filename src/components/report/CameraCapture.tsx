import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Camera, X, RotateCcw, Check, Settings2, Zap, ZapOff, SwitchCamera } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (imageData: string, quality: number) => void;
  onClose: () => void;
  isOpen: boolean;
}

const CameraCapture = ({ onCapture, onClose, isOpen }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [compressionQuality, setCompressionQuality] = useState(80);
  const [showSettings, setShowSettings] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    try {
      // Stop existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      streamRef.current = stream;
      
      // Check if flash/torch is available
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
      setHasFlash(capabilities?.torch === true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        };
      }
    } catch (error) {
      console.error("Camera access denied:", error);
    }
  };

  const toggleFlash = async () => {
    if (streamRef.current && hasFlash) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      const newFlashState = !isFlashOn;
      try {
        await videoTrack.applyConstraints({
          advanced: [{ torch: newFlashState } as MediaTrackConstraintSet]
        });
        setIsFlashOn(newFlashState);
      } catch (error) {
        console.error("Flash toggle failed:", error);
      }
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
    setIsFlashOn(false);
    setIsCameraReady(false);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraReady(false);
    setCapturedImage(null);
    setIsFlashOn(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0);
      
      const quality = compressionQuality / 100;
      const imageData = canvas.toDataURL("image/jpeg", quality);
      
      // Calculate estimated file size
      const base64Length = imageData.length - "data:image/jpeg;base64,".length;
      const sizeInBytes = (base64Length * 3) / 4;
      const sizeInKB = (sizeInBytes / 1024).toFixed(1);
      setEstimatedSize(`${sizeInKB} KB`);
      
      setCapturedImage(imageData);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setEstimatedSize("");
  };

  const confirmCapture = () => {
    if (capturedImage) {
      onCapture(capturedImage, compressionQuality);
      stopCamera();
      onClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const getQualityLabel = (value: number) => {
    if (value >= 80) return "High Quality";
    if (value >= 50) return "Balanced";
    return "Small File";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Capture Photo
            </span>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          {/* Camera Preview / Captured Image */}
        <div className="relative aspect-[4/3] bg-black">
            {capturedImage ? (
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="w-full h-full object-contain"
              />
            ) : (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-contain ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
              />
            )}
            
            {/* Camera loading overlay */}
            {!isCameraReady && !capturedImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center text-white">
                  <Camera className="h-12 w-12 mx-auto mb-2 animate-pulse" />
                  <p>Starting camera...</p>
                </div>
              </div>
            )}

            {/* Camera controls overlay */}
            {isCameraReady && !capturedImage && (
              <div className="absolute top-3 left-3 right-3 flex justify-between">
                {/* Flash toggle */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={toggleFlash}
                  disabled={!hasFlash}
                  className={`bg-black/50 hover:bg-black/70 text-white ${!hasFlash ? "opacity-50" : ""}`}
                  title={hasFlash ? (isFlashOn ? "Turn off flash" : "Turn on flash") : "Flash not available"}
                >
                  {isFlashOn ? <Zap className="h-5 w-5 text-yellow-400" /> : <ZapOff className="h-5 w-5" />}
                </Button>

                {/* Camera switch */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={switchCamera}
                  className="bg-black/50 hover:bg-black/70 text-white"
                  title="Switch camera"
                >
                  <SwitchCamera className="h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Estimated size badge */}
            {estimatedSize && capturedImage && (
              <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                {estimatedSize}
              </div>
            )}
          </div>

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Compression Settings */}
          {showSettings && (
            <div className="p-4 border-t bg-muted/50">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Image Quality</Label>
                  <span className="text-sm text-muted-foreground">
                    {compressionQuality}% - {getQualityLabel(compressionQuality)}
                  </span>
                </div>
                <Slider
                  value={[compressionQuality]}
                  onValueChange={(value) => setCompressionQuality(value[0])}
                  min={20}
                  max={100}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Smaller file</span>
                  <span>Higher quality</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="p-4 bg-background border-t">
            <div className="flex items-center justify-between gap-3">
              {/* Settings Toggle */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
                className={showSettings ? "text-primary" : "text-muted-foreground"}
              >
                <Settings2 className="h-5 w-5" />
              </Button>

              {/* Main Actions */}
              <div className="flex items-center gap-3">
                {capturedImage ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={retakePhoto}
                      className="gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Retake
                    </Button>
                    <Button
                      type="button"
                      onClick={confirmCapture}
                      className="gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Use Photo
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    size="lg"
                    onClick={capturePhoto}
                    disabled={!isCameraReady}
                    className="px-8"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Capture
                  </Button>
                )}
              </div>

              {/* Spacer for alignment */}
              <div className="w-10" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CameraCapture;

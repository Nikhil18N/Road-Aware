import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resolveComplaint } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, X, Loader2 } from "lucide-react";

interface ResolveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complaintId: string;
  onSuccess: () => void;
}

export function ResolveDialog({
  open,
  onOpenChange,
  complaintId,
  onSuccess,
}: ResolveDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleClearImage = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!file || !complaintId) return;

    setIsSubmitting(true);
    try {
      const result = await resolveComplaint(complaintId, file);
      
      if (result.success) {
        toast({
          title: "Task Resolved",
          description: "Resolution photo uploaded successfully.",
        });
        onSuccess();
        onOpenChange(false);
        handleClearImage();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to resolve task.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete Task</DialogTitle>
          <DialogDescription>
            Upload a photo to show the road damage has been repaired.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {!previewUrl ? (
            <div 
              className="flex flex-col items-center justify-center border-2 border-dashed border-primary/30 rounded-lg p-8 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-10 w-10 text-primary mb-2 opacity-80" />
              <p className="text-sm font-medium">Click to capture or upload</p>
              <p className="text-xs text-muted-foreground mt-1">
                Take a photo of the completed repair
              </p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                capture="environment"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden border">
              <img 
                src={previewUrl} 
                alt="Resolution Preview" 
                className="w-full h-48 object-cover"
              />
              <Button 
                variant="destructive" 
                size="icon" 
                className="absolute top-2 right-2 h-8 w-8 rounded-full"
                onClick={handleClearImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!file || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Proof & Resolve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

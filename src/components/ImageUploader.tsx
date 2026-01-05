import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Loader2, 
  Trash2, 
  GripVertical,
  ZoomIn,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface UploadedImage {
  id: string;
  url: string;
  name: string;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  contentId?: string;
  maxImages?: number;
}

export const ImageUploader = ({ 
  images, 
  onImagesChange, 
  contentId,
  maxImages = 10 
}: ImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateFileName = (originalName: string) => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = originalName.split('.').pop();
    return `${contentId || 'temp'}_${timestamp}_${randomStr}.${ext}`;
  };

  const uploadImage = async (file: File): Promise<UploadedImage | null> => {
    try {
      const fileName = generateFileName(file.name);
      const filePath = `content/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('content-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('content-images')
        .getPublicUrl(filePath);

      return {
        id: fileName,
        url: publicUrl,
        name: file.name
      };
    } catch (error: any) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast({ 
        title: "Giới hạn ảnh", 
        description: `Chỉ được tải tối đa ${maxImages} ảnh`, 
        variant: "destructive" 
      });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    const validFiles = filesToUpload.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({ title: "Lỗi", description: `${file.name} không phải file ảnh`, variant: "destructive" });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Lỗi", description: `${file.name} vượt quá 5MB`, variant: "destructive" });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    const newImages: UploadedImage[] = [];
    let completed = 0;

    for (const file of validFiles) {
      try {
        const uploadedImage = await uploadImage(file);
        if (uploadedImage) {
          newImages.push(uploadedImage);
        }
        completed++;
        setUploadProgress(Math.round((completed / validFiles.length) * 100));
      } catch (error: any) {
        toast({ 
          title: "Lỗi upload", 
          description: `Không thể tải ${file.name}: ${error.message}`, 
          variant: "destructive" 
        });
      }
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
      toast({ 
        title: "Thành công", 
        description: `Đã tải lên ${newImages.length} ảnh` 
      });
    }

    setIsUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemoveImage = async (imageToRemove: UploadedImage) => {
    try {
      // Delete from storage
      const filePath = `content/${imageToRemove.id}`;
      await supabase.storage.from('content-images').remove([filePath]);
      
      // Update local state
      onImagesChange(images.filter(img => img.id !== imageToRemove.id));
      toast({ title: "Đã xóa", description: "Ảnh đã được xóa" });
    } catch (error: any) {
      toast({ title: "Lỗi", description: "Không thể xóa ảnh", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer",
          "hover:border-primary/50 hover:bg-primary/5",
          dragOver ? "border-primary bg-primary/10" : "border-border",
          isUploading && "pointer-events-none opacity-60"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />

        <div className="flex flex-col items-center gap-3 text-center">
          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Đang tải lên... {uploadProgress}%</p>
                <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="p-3 rounded-full bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Kéo thả ảnh vào đây hoặc <span className="text-primary">chọn file</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WEBP (tối đa 5MB mỗi ảnh, tối đa {maxImages} ảnh)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Image Preview Grid */}
      <AnimatePresence>
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
          >
            {images.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-muted"
              >
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="secondary" className="h-8 w-8">
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                      />
                    </DialogContent>
                  </Dialog>

                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(image.url, '_blank');
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>

                  <Button 
                    size="icon" 
                    variant="destructive" 
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(image);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Image number badge */}
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                  {index + 1}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image count info */}
      {images.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {images.length}/{maxImages} ảnh đã tải lên
        </p>
      )}
    </div>
  );
};

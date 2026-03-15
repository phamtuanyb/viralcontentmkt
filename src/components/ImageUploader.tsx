import { useState, useRef, useEffect } from "react";
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
  ZoomIn,
  Download,
  FolderOpen,
  Check,
  Search,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UploadedImage {
  id: string;
  url: string;
  name: string;
}

interface StorageFile {
  name: string;
  url: string;
  created_at: string;
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
  
  // Library state
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryImages, setLibraryImages] = useState<StorageFile[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");
  const [selectedLibraryImages, setSelectedLibraryImages] = useState<Set<string>>(new Set());

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
      const filePath = `content/${imageToRemove.id}`;
      await supabase.storage.from('content-images').remove([filePath]);
      onImagesChange(images.filter(img => img.id !== imageToRemove.id));
      toast({ title: "Đã xóa", description: "Ảnh đã được xóa" });
    } catch (error: any) {
      toast({ title: "Lỗi", description: "Không thể xóa ảnh", variant: "destructive" });
    }
  };

  // Load library images from storage bucket
  const loadLibraryImages = async () => {
    setLibraryLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('content-images')
        .list('content', {
          limit: 200,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      const files: StorageFile[] = (data || [])
        .filter(file => file.name && !file.name.startsWith('.'))
        .map(file => {
          const { data: { publicUrl } } = supabase.storage
            .from('content-images')
            .getPublicUrl(`content/${file.name}`);
          return {
            name: file.name,
            url: publicUrl,
            created_at: file.created_at || ''
          };
        });

      setLibraryImages(files);
    } catch (error: any) {
      console.error('Error loading library:', error);
      toast({ title: "Lỗi", description: "Không thể tải thư viện ảnh", variant: "destructive" });
    } finally {
      setLibraryLoading(false);
    }
  };

  const toggleLibraryImage = (file: StorageFile) => {
    setSelectedLibraryImages(prev => {
      const next = new Set(prev);
      if (next.has(file.url)) {
        next.delete(file.url);
      } else {
        next.add(file.url);
      }
      return next;
    });
  };

  const handleAddFromLibrary = () => {
    const remainingSlots = maxImages - images.length;
    const selected = Array.from(selectedLibraryImages).slice(0, remainingSlots);
    
    const newImages: UploadedImage[] = selected
      .filter(url => !images.some(img => img.url === url))
      .map(url => {
        const file = libraryImages.find(f => f.url === url);
        return {
          id: file?.name || Date.now().toString(),
          url,
          name: file?.name || 'Library image'
        };
      });

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
      toast({ title: "Thành công", description: `Đã thêm ${newImages.length} ảnh từ thư viện` });
    }
    
    setSelectedLibraryImages(new Set());
    setLibraryOpen(false);
  };

  const filteredLibrary = libraryImages.filter(file =>
    file.name.toLowerCase().includes(librarySearch.toLowerCase())
  );

  // Already-used URLs for highlighting
  const usedUrls = new Set(images.map(img => img.url));

  return (
    <div className="space-y-4">
      {/* Upload Area & Library Button */}
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-9">
          <TabsTrigger value="upload" className="text-xs gap-1.5">
            <Upload className="h-3.5 w-3.5" />
            Tải lên
          </TabsTrigger>
          <TabsTrigger 
            value="library" 
            className="text-xs gap-1.5"
            onClick={() => {
              if (libraryImages.length === 0) loadLibraryImages();
            }}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Thư viện
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-3">
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
                      PNG, JPG, WEBP (tối đa 5MB, tối đa {maxImages} ảnh)
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="library" className="mt-3">
          <div
            className="border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all border-border"
            onClick={() => {
              if (libraryImages.length === 0) loadLibraryImages();
              setLibraryOpen(true);
            }}
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="p-3 rounded-full bg-primary/10">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Bấm để mở <span className="text-primary">Thư viện ảnh</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Chọn lại ảnh đã tải lên trước đó để tái sử dụng
                </p>
              </div>
            </div>
          </div>

          {/* Library Dialog */}
          <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-primary" />
                  Thư viện ảnh
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                {/* Search & Refresh */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={librarySearch}
                      onChange={(e) => setLibrarySearch(e.target.value)}
                      placeholder="Tìm kiếm ảnh..."
                      className="pl-9"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={loadLibraryImages}
                    disabled={libraryLoading}
                  >
                    <RefreshCw className={cn("h-4 w-4", libraryLoading && "animate-spin")} />
                  </Button>
                </div>

                {/* Library Grid */}
                {libraryLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredLibrary.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>{librarySearch ? "Không tìm thấy ảnh" : "Chưa có ảnh trong thư viện"}</p>
                  </div>
                ) : (
                  <ScrollArea className="flex-1 min-h-0">
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 pr-3 pb-2">
                      {filteredLibrary.map((file) => {
                        const isSelected = selectedLibraryImages.has(file.url);
                        const isUsed = usedUrls.has(file.url);
                        return (
                          <button
                            key={file.name}
                            onClick={() => !isUsed && toggleLibraryImage(file)}
                            className={cn(
                              "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                              isUsed 
                                ? "border-muted opacity-50 cursor-not-allowed"
                                : isSelected
                                  ? "border-primary ring-2 ring-primary/20 scale-95"
                                  : "border-border hover:border-primary/50 hover:scale-[1.02]"
                            )}
                          >
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                                <div className="bg-primary rounded-full p-1.5 shadow-lg">
                                  <Check className="h-4 w-4 text-primary-foreground" />
                                </div>
                              </div>
                            )}
                            {isUsed && (
                              <div className="absolute bottom-1 left-1 bg-background/90 text-[10px] px-1.5 py-0.5 rounded font-medium">
                                Đã dùng
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    {filteredLibrary.length} ảnh trong thư viện
                    {selectedLibraryImages.size > 0 && (
                      <span className="text-primary font-medium ml-2">
                        • {selectedLibraryImages.size} đã chọn
                      </span>
                    )}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setSelectedLibraryImages(new Set());
                      setLibraryOpen(false);
                    }}>
                      Hủy
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddFromLibrary}
                      disabled={selectedLibraryImages.size === 0}
                      className="gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Thêm {selectedLibraryImages.size > 0 ? `${selectedLibraryImages.size} ảnh` : 'ảnh đã chọn'}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

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

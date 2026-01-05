import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ContentImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number | null;
}

interface ImageGalleryProps {
  images: ContentImage[];
  thumbnailUrl?: string | null;
  title: string;
}

export const ImageGallery = ({ images, thumbnailUrl, title }: ImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // Combine thumbnail with content images
  const allImages: ContentImage[] = [
    ...(thumbnailUrl ? [{ id: "thumbnail", image_url: thumbnailUrl, alt_text: title, sort_order: -1 }] : []),
    ...images,
  ];

  if (allImages.length === 0) return null;

  const currentImage = allImages[selectedIndex];

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || "image.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      {/* Gallery Container */}
      <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
        {/* Main Image */}
        <div className="relative aspect-video bg-muted">
          <img
            src={currentImage.image_url}
            alt={currentImage.alt_text || title}
            className="w-full h-full object-contain cursor-zoom-in"
            onClick={() => setIsZoomed(true)}
          />
          
          {/* Zoom indicator */}
          <button
            onClick={() => setIsZoomed(true)}
            className="absolute top-3 right-3 p-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background transition-colors"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          {/* Navigation arrows for multiple images */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails & Actions */}
        <div className="p-3 border-t border-border/50">
          <div className="flex items-center justify-between gap-3">
            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-1">
                {allImages.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedIndex(index)}
                    className={cn(
                      "shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all",
                      selectedIndex === index
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border/50 hover:border-primary/50"
                    )}
                  >
                    <img
                      src={img.image_url}
                      alt={img.alt_text || `Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Download button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownload(currentImage.image_url, `${title}-${selectedIndex + 1}.jpg`)}
              className="shrink-0 gap-2"
            >
              <Download className="h-4 w-4" />
              Tải ảnh
            </Button>
          </div>
        </div>
      </div>

      {/* Zoom Modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsZoomed(false)}
          >
            {/* Close button */}
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Navigation */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-lg bg-card border border-border hover:bg-accent transition-colors z-10"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-lg bg-card border border-border hover:bg-accent transition-colors z-10"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Image */}
            <motion.img
              key={currentImage.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={currentImage.image_url}
              alt={currentImage.alt_text || title}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Bottom controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 p-3 rounded-xl bg-card/90 backdrop-blur-sm border border-border">
              <span className="text-sm text-muted-foreground">
                {selectedIndex + 1} / {allImages.length}
              </span>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(currentImage.image_url, `${title}-${selectedIndex + 1}.jpg`);
                }}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Tải ảnh về máy
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

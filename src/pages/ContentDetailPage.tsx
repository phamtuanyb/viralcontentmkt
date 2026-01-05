import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { contentApi, type ContentWithTopic } from "@/api/content.api";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ROUTES } from "@/constants";
import { ArrowLeft, Copy, Download, Tag, Calendar, CheckCircle, Lock } from "lucide-react";
import { format } from "date-fns";

interface ContentImage {
  id: string;
  image_url: string;
  alt_text: string | null;
}

const ContentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuthStore();
  const [content, setContent] = useState<ContentWithTopic | null>(null);
  const [images, setImages] = useState<ContentImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedText, setCopiedText] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      if (!id) return;
      
      setIsLoading(true);
      const [contentRes, imagesRes] = await Promise.all([
        contentApi.getById(id),
        contentApi.getImages(id),
      ]);
      
      if (contentRes.data) setContent(contentRes.data);
      if (imagesRes.data) setImages(imagesRes.data);
      setIsLoading(false);
    };

    fetchContent();
  }, [id]);

  const handleCopyText = async () => {
    if (!user) {
      toast({ title: "Yêu cầu đăng nhập", description: "Vui lòng đăng nhập để copy nội dung", variant: "destructive" });
      return;
    }

    if (!content) return;

    let textToCopy = content.body;

    // Append hotline if user has phone number
    if (profile?.phone_number) {
      textToCopy += `\n\nLiên hệ ngay hotline: ${profile.phone_number}`;
    }

    // Append signature if exists
    if (profile?.signature_text) {
      textToCopy += `\n\n${profile.signature_text}`;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
      
      // Log the copy action
      await contentApi.logCopy(user.id, content.id, "copy_text");
      
      toast({ title: "Đã copy!", description: "Nội dung đã được copy vào clipboard" });
    } catch {
      toast({ title: "Lỗi", description: "Không thể copy nội dung", variant: "destructive" });
    }
  };

  const handleDownloadImage = async (imageUrl: string, index: number) => {
    if (!user) {
      toast({ title: "Yêu cầu đăng nhập", description: "Vui lòng đăng nhập để tải ảnh", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `content-image-${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Log the download action
      if (content) {
        await contentApi.logCopy(user.id, content.id, "download_image");
      }

      toast({ title: "Đã tải!", description: "Ảnh đã được tải xuống" });
    } catch {
      toast({ title: "Lỗi", description: "Không thể tải ảnh", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto animate-pulse">
          <div className="h-4 bg-muted rounded w-24 mb-8" />
          <div className="h-8 bg-muted rounded w-3/4 mb-4" />
          <div className="h-4 bg-muted rounded w-1/4 mb-8" />
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Không tìm thấy nội dung</h2>
        <Link to={ROUTES.CONTENT_LIBRARY}>
          <Button variant="secondary">Quay lại thư viện</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* Back button */}
        <Link 
          to={ROUTES.CONTENT_LIBRARY}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại thư viện
        </Link>

        {/* Content Header */}
        <div className="mb-8">
          {content.topics && (
            <Badge variant="secondary" className="mb-4">
              <Tag className="h-3 w-3 mr-1" />
              {content.topics.name}
            </Badge>
          )}
          <h1 className="text-3xl font-bold mb-4">{content.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(content.created_at), "dd/MM/yyyy")}
            </span>
          </div>
        </div>

        {/* Thumbnail */}
        {content.thumbnail_url && (
          <div className="rounded-xl overflow-hidden mb-8">
            <img
              src={content.thumbnail_url}
              alt={content.title}
              className="w-full object-cover"
            />
          </div>
        )}

        {/* Content Body */}
        <div className="glass rounded-xl p-6 mb-6">
          <div className="prose prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-foreground leading-relaxed">
              {content.body}
            </p>
          </div>

          {/* Copy Button */}
          <div className="mt-6 pt-6 border-t border-border">
            <Button
              onClick={handleCopyText}
              disabled={!user}
              className={`w-full gap-2 ${user ? "bg-primary hover:bg-primary/90" : "bg-muted"}`}
            >
              {!user ? (
                <>
                  <Lock className="h-4 w-4" />
                  Đăng nhập để copy
                </>
              ) : copiedText ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Đã copy!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy nội dung
                </>
              )}
            </Button>
            {user && profile?.phone_number && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Hotline và chữ ký sẽ được tự động thêm vào khi copy
              </p>
            )}
          </div>
        </div>

        {/* Content Images */}
        {images.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Hình ảnh đính kèm</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {images.map((image, index) => (
                <div key={image.id} className="glass rounded-xl overflow-hidden group relative">
                  <img
                    src={image.image_url}
                    alt={image.alt_text || `Image ${index + 1}`}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      onClick={() => handleDownloadImage(image.image_url, index)}
                      disabled={!user}
                      className="gap-2"
                    >
                      {user ? (
                        <>
                          <Download className="h-4 w-4" />
                          Tải xuống
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          Đăng nhập để tải
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ContentDetailPage;

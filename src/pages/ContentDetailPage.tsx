import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DOMPurify from "dompurify";
import { contentApi, type ContentWithTopic } from "@/api/content.api";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { ROUTES } from "@/constants";
import { extractIdFromSlug } from "@/lib/slug";
import { SuggestedArticles } from "@/components/SuggestedArticles";
import { ContentComments } from "@/components/content/ContentComments";
import { StarRating } from "@/components/content/StarRating";
import { ImageGallery } from "@/components/content/ImageGallery";
import { AdBannerDisplay } from "@/components/AdBannerDisplay";
import { AIContentRewrite } from "@/components/content/AIContentRewrite";
import { 
  ArrowLeft, 
  Copy, 
  Download, 
  Tag, 
  Calendar, 
  CheckCircle, 
  Lock,
  Share2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface ContentImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number | null;
}

const ContentDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, profile } = useAuthStore();
  const [content, setContent] = useState<ContentWithTopic | null>(null);
  const [images, setImages] = useState<ContentImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedText, setCopiedText] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      if (!slug) return;
      
      // Scroll to top when navigating to new article
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      setIsLoading(true);
      setContent(null);
      setImages([]);
      
      // Extract short ID from slug
      const shortId = extractIdFromSlug(slug);
      
      const contentRes = await contentApi.getByShortId(shortId);
      
      if (contentRes.data) {
        setContent(contentRes.data);
        const imagesRes = await contentApi.getImages(contentRes.data.id);
        if (imagesRes.data) setImages(imagesRes.data);
      }
      setIsLoading(false);
    };

    fetchContent();
  }, [slug]);

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: content?.title,
          text: content?.body.substring(0, 100),
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Đã copy link", description: "Link đã được copy vào clipboard" });
    }
  };

  const renderFormattedContent = (text: string) => {
    const html = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/^# (.*$)/gm, "<h2 class='text-2xl font-bold mt-6 mb-3'>$1</h2>")
      .replace(/^## (.*$)/gm, "<h3 class='text-xl font-semibold mt-5 mb-2'>$1</h3>")
      .replace(/^> (.*$)/gm, "<blockquote class='border-l-4 border-primary/50 pl-4 my-4 italic text-muted-foreground'>$1</blockquote>")
      .replace(/`(.*?)`/g, "<code class='bg-muted px-1.5 py-0.5 rounded text-sm font-mono'>$1</code>")
      .replace(/\n/g, "<br />");
    
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      ALLOWED_TAGS: ['strong', 'em', 'h2', 'h3', 'blockquote', 'code', 'br', 'p', 'span'],
      ALLOWED_ATTR: ['class']
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Skeleton */}
            <div className="animate-pulse space-y-6">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-10 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-64 bg-muted rounded-xl" />
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Tag className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold">Không tìm thấy nội dung</h2>
          <p className="text-muted-foreground">Nội dung này có thể đã bị xóa hoặc không tồn tại.</p>
          <Link to={ROUTES.CONTENT_LIBRARY}>
            <Button>Quay lại thư viện</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with Thumbnail */}
      {content.thumbnail_url && (
        <div className="relative h-[40vh] min-h-[300px] max-h-[500px] overflow-hidden">
          <img
            src={content.thumbnail_url}
            alt={content.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="container mx-auto max-w-4xl">
              <Link 
                to={ROUTES.CONTENT_LIBRARY}
                className="inline-flex items-center gap-2 text-foreground/80 hover:text-foreground mb-4 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại thư viện
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8 max-w-7xl mx-auto">
          {/* Main Content */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 max-w-4xl"
        >
          {/* Back button if no thumbnail */}
          {!content.thumbnail_url && (
            <Link 
              to={ROUTES.CONTENT_LIBRARY}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại thư viện
            </Link>
          )}

          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {content.topics && (
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0 gap-1.5">
                  <Tag className="h-3 w-3" />
                  {content.topics.name}
                </Badge>
              )}
              {content.is_published ? (
                <Badge variant="secondary" className="gap-1.5">
                  <CheckCircle className="h-3 w-3 text-success" />
                  Đã xuất bản
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1.5">
                  <Clock className="h-3 w-3" />
                  Bản nháp
                </Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {content.title}
            </h1>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(content.created_at), "dd MMMM, yyyy", { locale: vi })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {Math.ceil(content.body.split(/\s+/).length / 200)} phút đọc
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Ad Banner */}
          <AdBannerDisplay placement="content_detail" className="mb-8" />

          <Separator className="my-8" />

          {/* Content Body */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-6 md:p-8 mb-8"
          >
            <div 
              className="prose prose-lg dark:prose-invert max-w-none leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderFormattedContent(content.body) }}
            />

            {/* Copy & AI Content Buttons */}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleCopyText}
                  disabled={!user}
                  className="flex-1 gap-2 h-12 text-base"
                  size="lg"
                >
                  {!user ? (
                    <>
                      <Lock className="h-5 w-5" />
                      Đăng nhập để copy nội dung
                    </>
                  ) : copiedText ? (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Đã copy thành công!
                    </>
                  ) : (
                    <>
                      <Copy className="h-5 w-5" />
                      Copy nội dung
                    </>
                  )}
                </Button>
                
                <AIContentRewrite originalContent={content.body} />
              </div>
              
              {user && profile?.phone_number && (
                <p className="text-sm text-muted-foreground mt-3 text-center">
                  💡 Hotline và chữ ký của bạn sẽ được tự động thêm vào khi copy
                </p>
              )}
            </div>
          </motion.div>

          {/* Content Images Gallery */}
          {(images.length > 0 || content.thumbnail_url) && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                Hình ảnh ({images.length + (content.thumbnail_url ? 1 : 0)})
              </h2>

              <ImageGallery
                images={images}
                thumbnailUrl={content.thumbnail_url}
                title={content.title}
              />
            </motion.section>
          )}

          {/* Star Rating Section */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-6 mb-8"
          >
            <h3 className="text-lg font-semibold mb-4">Đánh giá bài viết</h3>
            <StarRating contentId={content.id} />
          </motion.section>

          {/* Comments Section */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-6 mb-8"
          >
            <ContentComments contentId={content.id} />
          </motion.section>

          {/* Related Content Placeholder */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-2xl p-6 text-center"
          >
            <p className="text-muted-foreground mb-4">
              Bạn thấy nội dung này hữu ích?
            </p>
            <Link to={ROUTES.CONTENT_LIBRARY}>
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Khám phá thêm nội dung
              </Button>
            </Link>
          </motion.section>
        </motion.article>

          {/* Suggested Articles Sidebar */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <SuggestedArticles 
              currentContentId={content.id} 
              currentTopicId={content.topic_id} 
            />
          </aside>
        </div>
      </div>

    </div>
  );
};

export default ContentDetailPage;

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DOMPurify from "dompurify";
import { contentApi, type ContentWithTopic } from "@/api/content.api";
import { topicsApi, type Topic } from "@/api/topics.api";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ROUTES } from "@/constants";
import {
  ArrowLeft,
  Save,
  Eye,
  Edit3,
  Image as ImageIcon,
  FileText,
  Loader2,
  CheckCircle,
  Clock,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Heading1,
  Heading2,
  Quote,
  Code,
  Undo,
  Redo,
  Copy,
  Sparkles,
  Images,
} from "lucide-react";
import { format } from "date-fns";
import { ImageUploader } from "@/components/ImageUploader";
import { supabase } from "@/integrations/supabase/client";

interface UploadedImage {
  id: string;
  url: string;
  name: string;
}

const AdminContentEditorPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    topic_id: "",
    thumbnail_url: "",
    is_published: false,
  });

  const isEditMode = !!id;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      const topicsRes = await topicsApi.getAll();
      if (topicsRes.data) setTopics(topicsRes.data);

      if (id) {
        const [contentRes, imagesRes] = await Promise.all([
          contentApi.getById(id),
          contentApi.getImages(id)
        ]);
        
        if (contentRes.data) {
          setFormData({
            title: contentRes.data.title,
            body: contentRes.data.body,
            topic_id: contentRes.data.topic_id || "",
            thumbnail_url: contentRes.data.thumbnail_url || "",
            is_published: contentRes.data.is_published,
          });
        }

        if (imagesRes.data) {
          setUploadedImages(imagesRes.data.map(img => ({
            id: img.id,
            url: img.image_url,
            name: img.alt_text || 'Image'
          })));
        }
      }
      
      setIsLoading(false);
    };

    fetchData();
  }, [id]);

  const updateFormData = useCallback((updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  const insertTextAtCursor = (prefix: string, suffix: string = "") => {
    const textarea = document.querySelector("textarea[name='body']") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.body.substring(start, end);
    const newText = formData.body.substring(0, start) + prefix + selectedText + suffix + formData.body.substring(end);
    
    updateFormData({ body: newText });
    
    // Re-focus and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selectedText.length + suffix.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  const handleToolbarAction = (action: string) => {
    switch (action) {
      case "bold":
        insertTextAtCursor("**", "**");
        break;
      case "italic":
        insertTextAtCursor("*", "*");
        break;
      case "h1":
        insertTextAtCursor("# ");
        break;
      case "h2":
        insertTextAtCursor("## ");
        break;
      case "list":
        insertTextAtCursor("- ");
        break;
      case "ordered-list":
        insertTextAtCursor("1. ");
        break;
      case "quote":
        insertTextAtCursor("> ");
        break;
      case "code":
        insertTextAtCursor("`", "`");
        break;
      case "link":
        insertTextAtCursor("[", "](url)");
        break;
    }
  };

  const saveImagesToDatabase = async (contentId: string, images: UploadedImage[]) => {
    // First, delete existing images for this content
    await supabase
      .from("content_images")
      .delete()
      .eq("content_id", contentId);

    // Then insert new images
    if (images.length > 0) {
      const imageRecords = images.map((img, index) => ({
        content_id: contentId,
        image_url: img.url,
        alt_text: img.name,
        sort_order: index
      }));

      await supabase
        .from("content_images")
        .insert(imageRecords);
    }
  };

  const handleSave = async (publish = false) => {
    if (!formData.title.trim()) {
      toast({ title: "Lỗi", description: "Vui lòng nhập tiêu đề", variant: "destructive" });
      return;
    }

    if (!formData.body.trim()) {
      toast({ title: "Lỗi", description: "Vui lòng nhập nội dung", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    const contentData = {
      ...formData,
      topic_id: formData.topic_id || undefined,
      is_published: publish ? true : formData.is_published,
      created_by: user?.id,
    };

    try {
      let savedContentId = id;
      
      if (isEditMode && id) {
        const { error } = await contentApi.update(id, contentData);
        if (error) throw error;
      } else {
        const { data, error } = await contentApi.create(contentData);
        if (error) throw error;
        savedContentId = data?.id;
      }

      // Save images to database
      if (savedContentId) {
        await saveImagesToDatabase(savedContentId, uploadedImages);
      }
      
      toast({ title: "Thành công", description: isEditMode ? "Đã cập nhật nội dung" : "Đã tạo nội dung mới" });
      setHasChanges(false);
      navigate(ROUTES.ADMIN_CONTENTS);
    } catch (error: any) {
      toast({ title: "Lỗi", description: error?.message || "Có lỗi xảy ra", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImagesChange = (images: UploadedImage[]) => {
    setUploadedImages(images);
    setHasChanges(true);
  };

  const handleCopyContent = async () => {
    await navigator.clipboard.writeText(formData.body);
    toast({ title: "Đã copy", description: "Nội dung đã được copy vào clipboard" });
  };

  const renderPreview = () => {
    // Simple markdown-like preview
    const html = formData.body
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/^# (.*$)/gm, "<h1 class='text-2xl font-bold mb-3'>$1</h1>")
      .replace(/^## (.*$)/gm, "<h2 class='text-xl font-semibold mb-2'>$1</h2>")
      .replace(/^> (.*$)/gm, "<blockquote class='border-l-4 border-primary pl-4 italic text-muted-foreground'>$1</blockquote>")
      .replace(/`(.*?)`/g, "<code class='bg-muted px-1.5 py-0.5 rounded text-sm'>$1</code>")
      .replace(/\n/g, "<br />");

    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      ALLOWED_TAGS: ['strong', 'em', 'h1', 'h2', 'blockquote', 'code', 'br', 'p', 'span'],
      ALLOWED_ATTR: ['class']
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const wordCount = formData.body.trim().split(/\s+/).filter(Boolean).length;
  const charCount = formData.body.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-strong border-b border-border">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(ROUTES.ADMIN_CONTENTS)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {isEditMode ? "Chỉnh sửa nội dung" : "Tạo nội dung mới"}
              </span>
            </div>
            {hasChanges && (
              <Badge variant="secondary" className="text-xs">
                Chưa lưu
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyContent}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Lưu nháp
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Xuất bản
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Main Editor */}
        <div className="flex-1 max-w-4xl mx-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Title Input */}
            <div>
              <Input
                value={formData.title}
                onChange={(e) => updateFormData({ title: e.target.value })}
                placeholder="Nhập tiêu đề bài viết..."
                className="text-3xl font-bold h-auto py-4 px-0 border-0 border-b rounded-none focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/50"
              />
            </div>

            {/* Editor Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")}>
              <div className="flex items-center justify-between">
                <TabsList className="grid w-[200px] grid-cols-2">
                  <TabsTrigger value="edit" className="gap-2">
                    <Edit3 className="h-4 w-4" />
                    Soạn thảo
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="gap-2">
                    <Eye className="h-4 w-4" />
                    Xem trước
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{wordCount} từ</span>
                  <span>{charCount} ký tự</span>
                </div>
              </div>

              <TabsContent value="edit" className="mt-4">
                {/* Toolbar */}
                <div className="flex items-center gap-1 p-2 rounded-t-lg bg-muted/50 border border-b-0 border-border flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleToolbarAction("bold")}
                    title="Đậm (Ctrl+B)"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleToolbarAction("italic")}
                    title="Nghiêng (Ctrl+I)"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <div className="h-6 w-px bg-border mx-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleToolbarAction("h1")}
                    title="Tiêu đề 1"
                  >
                    <Heading1 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleToolbarAction("h2")}
                    title="Tiêu đề 2"
                  >
                    <Heading2 className="h-4 w-4" />
                  </Button>
                  <div className="h-6 w-px bg-border mx-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleToolbarAction("list")}
                    title="Danh sách"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleToolbarAction("ordered-list")}
                    title="Danh sách có số"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                  <div className="h-6 w-px bg-border mx-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleToolbarAction("quote")}
                    title="Trích dẫn"
                  >
                    <Quote className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleToolbarAction("code")}
                    title="Code"
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleToolbarAction("link")}
                    title="Liên kết"
                  >
                    <Link2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Text Area */}
                <Textarea
                  name="body"
                  value={formData.body}
                  onChange={(e) => updateFormData({ body: e.target.value })}
                  placeholder="Bắt đầu viết nội dung của bạn...

Sử dụng markdown để định dạng:
- **văn bản đậm**
- *văn bản nghiêng*
- # Tiêu đề 1
- ## Tiêu đề 2
- > Trích dẫn
- `code`"
                  className="min-h-[500px] rounded-t-none border-t-0 resize-none font-mono text-base leading-relaxed"
                />
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <div className="glass rounded-lg p-6 min-h-[500px]">
                  {formData.thumbnail_url && (
                    <div className="mb-6 rounded-lg overflow-hidden">
                      <img
                        src={formData.thumbnail_url}
                        alt={formData.title}
                        className="w-full h-64 object-cover"
                      />
                    </div>
                  )}
                  <h1 className="text-3xl font-bold mb-6">
                    {formData.title || "Tiêu đề bài viết"}
                  </h1>
                  <div 
                    className="prose prose-lg dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: renderPreview() || "<p class='text-muted-foreground'>Nội dung xem trước sẽ hiển thị ở đây...</p>" }}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>

        {/* Sidebar */}
        <aside className="w-80 border-l border-border p-6 space-y-6 bg-muted/20">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Status */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Trạng thái</Label>
              <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                <div className="flex items-center gap-2">
                  {formData.is_published ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">Đã xuất bản</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Nháp</span>
                    </>
                  )}
                </div>
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={(checked) => updateFormData({ is_published: checked })}
                />
              </div>
            </div>

            {/* Topic */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Chủ đề</Label>
              <Select
                value={formData.topic_id}
                onValueChange={(value) => updateFormData({ topic_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn chủ đề" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Thumbnail */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Ảnh đại diện</Label>
              <div className="space-y-2">
                <Input
                  value={formData.thumbnail_url}
                  onChange={(e) => updateFormData({ thumbnail_url: e.target.value })}
                  placeholder="Nhập URL ảnh..."
                />
                {formData.thumbnail_url && (
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <img
                      src={formData.thumbnail_url}
                      alt="Thumbnail preview"
                      className="w-full h-40 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Content Images */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Images className="h-4 w-4" />
                Ảnh trong bài viết
              </Label>
              <ImageUploader
                images={uploadedImages}
                onImagesChange={handleImagesChange}
                contentId={id}
                maxImages={10}
              />
            </div>

            {/* Tips */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Mẹo viết hay</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Tiêu đề ngắn gọn, thu hút</li>
                <li>• Sử dụng emoji để tăng tương tác</li>
                <li>• Chia nhỏ nội dung thành đoạn</li>
                <li>• Thêm CTA (call-to-action) cuối bài</li>
                <li>• Thêm ảnh chất lượng cao</li>
              </ul>
            </div>
          </motion.div>
        </aside>
      </div>
    </div>
  );
};

export default AdminContentEditorPage;

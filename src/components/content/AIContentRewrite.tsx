import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Sparkles, Copy, X, Loader2, FileText, RefreshCw, CheckCircle } from "lucide-react";

interface AIContentRewriteProps {
  originalContent: string;
}

export const AIContentRewrite = ({ originalContent }: AIContentRewriteProps) => {
  const { user, profile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [rewrittenContent, setRewrittenContent] = useState("");

  const handleAIContent = async () => {
    if (!user) return;

    // Check if user has configured Gemini API key
    if (!profile?.gemini_api_key) {
      toast({
        title: "Chưa cấu hình API Key",
        description: "Vui lòng vào trang Cá nhân để nhập Gemini API Key trước khi sử dụng tính năng AI.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-rewrite", {
        body: {
          content: originalContent,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setRewrittenContent(data.rewrittenContent);
      setShowResultDialog(true);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể viết lại nội dung. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyRewrittenContent = async () => {
    try {
      let textToCopy = rewrittenContent;

      // Append hotline if user has phone number
      if (profile?.phone_number) {
        textToCopy += `\n\nLiên hệ ngay hotline: ${profile.phone_number}`;
      }

      // Append signature if exists
      if (profile?.signature_text) {
        textToCopy += `\n\n${profile.signature_text}`;
      }

      await navigator.clipboard.writeText(textToCopy);
      toast({
        title: "Đã copy!",
        description: "Nội dung AI đã được copy vào clipboard",
      });
      setShowResultDialog(false);
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể copy nội dung",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <>
      <Button
        onClick={handleAIContent}
        disabled={isLoading}
        variant="secondary"
        className="flex-1 gap-2 h-12 text-base"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Đang viết lại...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            AI Content
          </>
        )}
      </Button>

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Nội dung AI đã viết lại
            </DialogTitle>
          </DialogHeader>
          
          {/* Content section with icon */}
          <div className="flex-1 overflow-y-auto bg-muted/50 rounded-lg p-4 my-4">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Nội dung đã được viết lại</span>
              <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {rewrittenContent}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={handleAIContent} 
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Viết lại
            </Button>
            <Button variant="outline" onClick={() => setShowResultDialog(false)} className="gap-2">
              <X className="h-4 w-4" />
              Đóng
            </Button>
            <Button onClick={handleCopyRewrittenContent} className="gap-2">
              <Copy className="h-4 w-4" />
              Copy nội dung AI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};


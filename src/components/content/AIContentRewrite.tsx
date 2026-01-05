import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { ROUTES } from "@/constants";
import { Sparkles, Copy, X, Loader2, AlertCircle, Settings } from "lucide-react";

interface AIContentRewriteProps {
  originalContent: string;
}

export const AIContentRewrite = ({ originalContent }: AIContentRewriteProps) => {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showNoKeyDialog, setShowNoKeyDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [rewrittenContent, setRewrittenContent] = useState("");

  const handleAIContent = async () => {
    if (!user) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để sử dụng tính năng AI Content",
        variant: "destructive",
      });
      return;
    }

    // Check if user has Gemini API key
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("gemini_api_key")
      .eq("user_id", user.id)
      .single();

    if (!userProfile?.gemini_api_key) {
      setShowNoKeyDialog(true);
      return;
    }

    // Call AI rewrite
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-rewrite", {
        body: {
          content: originalContent,
          geminiApiKey: userProfile.gemini_api_key,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

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

  const handleGoToSettings = () => {
    setShowNoKeyDialog(false);
    navigate(ROUTES.PROFILE);
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

      {/* No API Key Dialog */}
      <Dialog open={showNoKeyDialog} onOpenChange={setShowNoKeyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Chưa có Gemini API Key
            </DialogTitle>
            <DialogDescription>
              Bạn chưa cấu hình Gemini API Key. Vui lòng thêm API Key để sử dụng tính năng AI Content.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowNoKeyDialog(false)}>
              Đóng
            </Button>
            <Button onClick={handleGoToSettings} className="gap-2">
              <Settings className="h-4 w-4" />
              Cài đặt Gemini API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Nội dung AI đã viết lại
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-muted/50 rounded-lg p-4 my-4">
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {rewrittenContent}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
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

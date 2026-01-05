import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Key, Save, Loader2, Eye, EyeOff, ExternalLink } from "lucide-react";

interface GeminiApiKeyEditorProps {
  userId: string;
}

export const GeminiApiKeyEditor = ({ userId }: GeminiApiKeyEditorProps) => {
  const [apiKey, setApiKey] = useState("");
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const fetchApiKey = async () => {
      setIsFetching(true);
      const { data } = await supabase
        .from("user_profiles")
        .select("gemini_api_key")
        .eq("user_id", userId)
        .single();

      if (data?.gemini_api_key) {
        setHasExistingKey(true);
        // Show masked version
        setApiKey("••••••••••••••••••••••••••••••••");
      }
      setIsFetching(false);
    };

    fetchApiKey();
  }, [userId]);

  const handleSave = async () => {
    if (!apiKey || apiKey.startsWith("••••")) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập API Key mới",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ gemini_api_key: apiKey })
        .eq("user_id", userId);

      if (error) throw error;

      setHasExistingKey(true);
      setApiKey("••••••••••••••••••••••••••••••••");
      setShowKey(false);
      toast({
        title: "Thành công",
        description: "Đã lưu Gemini API Key",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể lưu API Key",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setApiKey("");
    setShowKey(true);
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="gemini-api-key" className="flex items-center gap-2">
          <Key className="h-4 w-4" />
          Gemini API Key
        </Label>
        <div className="relative">
          <Input
            id="gemini-api-key"
            type={showKey ? "text" : "password"}
            placeholder="AIza..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="bg-background/50 pr-20"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          API Key được sử dụng cho tính năng AI Content Rewrite. 
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1 ml-1"
          >
            Lấy API Key tại đây <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </div>

      <div className="flex gap-2">
        {hasExistingKey && (
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            className="gap-2"
          >
            Thay đổi Key
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={isLoading || !apiKey || apiKey.startsWith("••••")}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Lưu API Key
        </Button>
      </div>
    </div>
  );
};

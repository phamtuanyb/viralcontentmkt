import { useState, useEffect } from "react";
import { Facebook, Instagram, Youtube, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { socialLinksApi, SocialLink } from "@/api/social-links.api";
import { toast } from "@/hooks/use-toast";

const PLATFORMS = [
  { value: "facebook", label: "Facebook", icon: Facebook },
  { value: "zalo", label: "Zalo", icon: null },
  { value: "tiktok", label: "TikTok", icon: null },
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "youtube", label: "YouTube", icon: Youtube },
  { value: "twitter", label: "Twitter/X", icon: null },
];

interface SocialLinksEditorProps {
  userId: string;
}

export const SocialLinksEditor = ({ userId }: SocialLinksEditorProps) => {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newPlatform, setNewPlatform] = useState("");
  const [newUrl, setNewUrl] = useState("");

  useEffect(() => {
    loadLinks();
  }, [userId]);

  const loadLinks = async () => {
    setIsLoading(true);
    const { data, error } = await socialLinksApi.getByUserId(userId);
    if (data) setLinks(data);
    setIsLoading(false);
  };

  const handleAddLink = async () => {
    if (!newPlatform || !newUrl) {
      toast({ title: "Lỗi", description: "Vui lòng chọn nền tảng và nhập URL", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const { data, error } = await socialLinksApi.upsert(userId, newPlatform, newUrl);
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else if (data) {
      setLinks((prev) => [...prev.filter(l => l.platform !== newPlatform), data]);
      setNewPlatform("");
      setNewUrl("");
      toast({ title: "Thành công", description: "Đã thêm liên kết!" });
    }
    setIsSaving(false);
  };

  const handleDeleteLink = async (link: SocialLink) => {
    const { error } = await socialLinksApi.delete(link.id);
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      setLinks((prev) => prev.filter((l) => l.id !== link.id));
      toast({ title: "Thành công", description: "Đã xóa liên kết!" });
    }
  };

  const getPlatformLabel = (value: string) => {
    return PLATFORMS.find((p) => p.value === value)?.label || value;
  };

  const availablePlatforms = PLATFORMS.filter(
    (p) => !links.some((l) => l.platform === p.value)
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Liên kết mạng xã hội</Label>
      
      {/* Existing links */}
      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((link) => (
            <div key={link.id} className="flex items-center gap-2 bg-background/50 rounded-lg p-3">
              <span className="text-sm font-medium min-w-[80px]">
                {getPlatformLabel(link.platform)}
              </span>
              <span className="text-sm text-muted-foreground truncate flex-1">
                {link.url}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteLink(link)}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add new link */}
      {availablePlatforms.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={newPlatform} onValueChange={setNewPlatform}>
            <SelectTrigger className="w-full sm:w-[140px] bg-background/50">
              <SelectValue placeholder="Nền tảng" />
            </SelectTrigger>
            <SelectContent>
              {availablePlatforms.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="URL liên kết"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="flex-1 bg-background/50"
          />
          <Button
            onClick={handleAddLink}
            disabled={isSaving || !newPlatform || !newUrl}
            className="gap-2"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Thêm
          </Button>
        </div>
      )}

      {links.length === 0 && availablePlatforms.length === PLATFORMS.length && (
        <p className="text-sm text-muted-foreground">Chưa có liên kết mạng xã hội nào</p>
      )}
    </div>
  );
};

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { MessageCircle, Send, Trash2, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { commentsApi, Comment } from "@/api/comments.api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/hooks/use-toast";

interface ContentCommentsProps {
  contentId: string;
}

export const ContentComments = ({ contentId }: ContentCommentsProps) => {
  const { user, profile, isActive } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [contentId]);

  const loadComments = async () => {
    setIsLoading(true);
    const { data } = await commentsApi.getByContentId(contentId);
    if (data) setComments(data);
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    const { data, error } = await commentsApi.create(contentId, user.id, newComment.trim());
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else if (data) {
      setComments((prev) => [data, ...prev]);
      setNewComment("");
      toast({ title: "Thành công", description: "Đã thêm bình luận!" });
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await commentsApi.delete(commentId);
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast({ title: "Thành công", description: "Đã xóa bình luận!" });
    }
  };

  const getInitials = (name: string | null) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Bình luận ({comments.length})</h3>
      </div>

      {/* Comment form */}
      {user && isActive() ? (
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Viết bình luận của bạn..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] bg-background/50"
            />
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !newComment.trim()}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Gửi bình luận
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {user ? "Tài khoản của bạn chưa được kích hoạt để bình luận" : "Đăng nhập để bình luận"}
        </p>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <Avatar className="h-10 w-10">
                <AvatarImage src={comment.user?.avatar_url || undefined} />
                <AvatarFallback>{getInitials(comment.user?.full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {comment.user?.full_name || "Người dùng"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                  </span>
                  {user?.id === comment.user_id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                      onClick={() => handleDelete(comment.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-foreground mt-1">{comment.comment}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">Chưa có bình luận nào</p>
      )}
    </div>
  );
};

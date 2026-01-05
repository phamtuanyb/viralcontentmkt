import { useState, useEffect } from "react";
import { Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ratingsApi, ContentRatingStats } from "@/api/ratings.api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/hooks/use-toast";

interface StarRatingProps {
  contentId: string;
  className?: string;
}

export const StarRating = ({ contentId, className }: StarRatingProps) => {
  const { user, isActive } = useAuthStore();
  const [stats, setStats] = useState<ContentRatingStats>({ average: 0, count: 0 });
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadStats();
  }, [contentId, user?.id]);

  const loadStats = async () => {
    setIsLoading(true);
    const data = await ratingsApi.getStats(contentId, user?.id);
    setStats(data);
    setIsLoading(false);
  };

  const handleRate = async (rating: number) => {
    if (!user) {
      toast({ title: "Thông báo", description: "Vui lòng đăng nhập để đánh giá" });
      return;
    }

    if (!isActive()) {
      toast({ title: "Thông báo", description: "Tài khoản của bạn chưa được kích hoạt" });
      return;
    }

    setIsSubmitting(true);
    const { error } = await ratingsApi.upsert(contentId, user.id, rating);
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      await loadStats();
      toast({ title: "Thành công", description: "Đã ghi nhận đánh giá của bạn!" });
    }
    setIsSubmitting(false);
  };

  const displayRating = hoveredStar || stats.userRating || 0;

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={isSubmitting}
              className="p-0.5 focus:outline-none disabled:cursor-not-allowed"
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => handleRate(star)}
            >
              <Star
                className={cn(
                  "h-5 w-5 transition-colors",
                  star <= displayRating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/30"
                )}
              />
            </button>
          ))}
        </div>
        <span className="text-sm font-medium">{stats.average.toFixed(1)}</span>
        <span className="text-sm text-muted-foreground">({stats.count} đánh giá)</span>
      </div>
      {stats.userRating && (
        <p className="text-xs text-muted-foreground">
          Bạn đã đánh giá {stats.userRating} sao
        </p>
      )}
    </div>
  );
};

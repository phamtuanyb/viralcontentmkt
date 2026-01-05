import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { contentApi, type ContentWithTopic } from "@/api/content.api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag, Clock, Eye, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface SuggestedArticlesProps {
  currentContentId: string;
  currentTopicId?: string | null;
}

export const SuggestedArticles = ({ currentContentId, currentTopicId }: SuggestedArticlesProps) => {
  const [suggestions, setSuggestions] = useState<ContentWithTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true);
      
      let relatedArticles: ContentWithTopic[] = [];
      
      // First, try to get articles from the same topic
      if (currentTopicId) {
        const { data: topicArticles } = await contentApi.getByTopic(currentTopicId);
        if (topicArticles) {
          relatedArticles = topicArticles.filter(article => article.id !== currentContentId);
        }
      }
      
      // If not enough articles from same topic, get popular articles
      if (relatedArticles.length < 5) {
        const { data: popularArticles } = await contentApi.getPublished("popular");
        if (popularArticles) {
          const additionalArticles = popularArticles
            .filter(article => 
              article.id !== currentContentId && 
              !relatedArticles.some(r => r.id === article.id)
            );
          relatedArticles = [...relatedArticles, ...additionalArticles];
        }
      }
      
      // Limit to 5 suggestions
      setSuggestions(relatedArticles.slice(0, 5));
      setIsLoading(false);
    };

    fetchSuggestions();
  }, [currentContentId, currentTopicId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Bài viết gợi ý</h3>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-24">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Bài viết gợi ý</h3>
      </div>
      
      <div className="space-y-4">
        {suggestions.map((article, index) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={`/content/${article.id}`}
              className="block group"
            >
              <div className="glass rounded-lg p-3 hover:bg-muted/50 transition-all duration-200 border border-transparent hover:border-primary/20">
                {article.thumbnail_url && (
                  <div className="relative w-full h-24 mb-3 rounded-md overflow-hidden">
                    <img
                      src={article.thumbnail_url}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                
                <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors mb-2">
                  {article.title}
                </h4>
                
                <div className="flex items-center gap-2 flex-wrap">
                  {article.topics && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5 gap-1">
                      <Tag className="h-2.5 w-2.5" />
                      {article.topics.name}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(article.created_at), "dd/MM", { locale: vi })}
                  </span>
                  {article.view_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {article.view_count}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

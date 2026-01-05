import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { contentApi, type ContentWithTopic } from "@/api/content.api";
import { topicsApi, type Topic } from "@/api/topics.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants";
import { Search, Filter, FileText, Calendar, Tag } from "lucide-react";
import { format } from "date-fns";

const ContentLibraryPage = () => {
  const [contents, setContents] = useState<ContentWithTopic[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [contentsRes, topicsRes] = await Promise.all([
        contentApi.getPublished(),
        topicsApi.getActive(),
      ]);
      
      if (contentsRes.data) setContents(contentsRes.data);
      if (topicsRes.data) setTopics(topicsRes.data);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const filteredContents = contents.filter((content) => {
    const matchesTopic = !selectedTopic || content.topic_id === selectedTopic;
    const matchesSearch = !searchQuery || 
      content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.body.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTopic && matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">
          Thư viện <span className="gradient-text">Nội dung</span>
        </h1>
        <p className="text-muted-foreground">
          Khám phá và sử dụng các mẫu nội dung viral
        </p>
      </motion.div>

      {/* Search & Filter */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col md:flex-row gap-4 mb-8"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm nội dung..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card/50"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Button
            variant={selectedTopic === null ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSelectedTopic(null)}
            className="shrink-0"
          >
            Tất cả
          </Button>
          {topics.map((topic) => (
            <Button
              key={topic.id}
              variant={selectedTopic === topic.id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedTopic(topic.id)}
              className="shrink-0"
            >
              {topic.name}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-4" />
              <div className="h-3 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredContents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Chưa có nội dung</h3>
          <p className="text-muted-foreground">
            {searchQuery || selectedTopic 
              ? "Không tìm thấy nội dung phù hợp với bộ lọc" 
              : "Nội dung sẽ được cập nhật sớm"}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContents.map((content, index) => (
            <motion.div
              key={content.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/library/${content.id}`}>
                <div className="glass rounded-xl overflow-hidden card-hover h-full">
                  {content.thumbnail_url && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={content.thumbnail_url}
                        alt={content.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    {content.topics && (
                      <Badge variant="secondary" className="mb-3">
                        <Tag className="h-3 w-3 mr-1" />
                        {content.topics.name}
                      </Badge>
                    )}
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {content.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {content.body}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(content.created_at), "dd/MM/yyyy")}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentLibraryPage;

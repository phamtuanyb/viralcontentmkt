import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { contentApi, type ContentWithTopic } from "@/api/content.api";
import { topicsApi, type Topic } from "@/api/topics.api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants";
import { Search, FileText, Calendar, Tag, Folder, FolderOpen, ChevronRight, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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

  const getTopicContentCount = (topicId: string) => {
    return contents.filter(c => c.topic_id === topicId).length;
  };

  const selectedTopicData = topics.find(t => t.id === selectedTopic);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Left Sidebar - Featured Topics */}
      <motion.aside
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-72 shrink-0 border-r border-border/50 bg-card/30 backdrop-blur-sm hidden lg:block"
      >
        <div className="sticky top-16 p-4">
          {/* Topics Header */}
          <div className="flex items-center gap-2 mb-4 px-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-sm uppercase tracking-wide">Chủ đề nổi bật</h2>
              <p className="text-xs text-muted-foreground">{topics.length} chủ đề</p>
            </div>
          </div>

          {/* Topics List */}
          <nav className="space-y-1">
            <button
              onClick={() => setSelectedTopic(null)}
              className={cn(
                "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                "hover:bg-accent/50",
                selectedTopic === null 
                  ? "bg-primary/10 text-primary font-medium border border-primary/20" 
                  : "text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-1.5 rounded-md transition-colors",
                  selectedTopic === null ? "bg-primary/20" : "bg-muted"
                )}>
                  <FolderOpen className="h-4 w-4" />
                </div>
                <span>Tất cả nội dung</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {contents.length}
              </Badge>
            </button>

            <div className="pt-2 pb-1 px-3">
              <div className="h-px bg-border/50" />
            </div>

            {topics.map((topic, index) => (
              <motion.button
                key={topic.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedTopic(topic.id)}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                  "hover:bg-accent/50 group",
                  selectedTopic === topic.id 
                    ? "bg-primary/10 text-primary font-medium border border-primary/20" 
                    : "text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-1.5 rounded-md transition-colors",
                    selectedTopic === topic.id ? "bg-primary/20" : "bg-muted group-hover:bg-muted/80"
                  )}>
                    {selectedTopic === topic.id ? (
                      <FolderOpen className="h-4 w-4" />
                    ) : (
                      <Folder className="h-4 w-4" />
                    )}
                  </div>
                  <span className="truncate">{topic.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {getTopicContentCount(topic.id)}
                  </Badge>
                  <ChevronRight className={cn(
                    "h-3 w-3 transition-transform",
                    selectedTopic === topic.id ? "text-primary" : "text-muted-foreground opacity-0 group-hover:opacity-100"
                  )} />
                </div>
              </motion.button>
            ))}
          </nav>

          {/* Topics Footer */}
          <div className="mt-6 p-3 rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5 border border-border/30">
            <p className="text-xs text-muted-foreground text-center">
              💡 Chọn chủ đề để lọc nội dung phù hợp
            </p>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto px-4 py-6">
          {/* Header with Search */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
          >
            <div>
              <h1 className="text-2xl font-bold">
                {selectedTopicData ? (
                  <>
                    <span className="text-muted-foreground">Chủ đề:</span>{" "}
                    <span className="gradient-text">{selectedTopicData.name}</span>
                  </>
                ) : (
                  <>
                    Thư viện <span className="gradient-text">Nội dung</span>
                  </>
                )}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredContents.length} nội dung{selectedTopicData ? ` trong chủ đề này` : ""}
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm nội dung..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card/50 border-border/50"
              />
            </div>
          </motion.div>

          {/* Mobile Topics Filter */}
          <div className="lg:hidden mb-6 overflow-x-auto pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedTopic(null)}
                className={cn(
                  "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all",
                  selectedTopic === null 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                Tất cả
              </button>
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className={cn(
                    "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all",
                    selectedTopic === topic.id 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {topic.name}
                </button>
              ))}
            </div>
          </div>

          {/* Content Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredContents.map((content, index) => (
                <motion.div
                  key={content.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Link to={`/library/${content.id}`}>
                    <div className="glass rounded-xl overflow-hidden card-hover h-full group">
                      {content.thumbnail_url && (
                        <div className="aspect-video overflow-hidden bg-muted">
                          <img
                            src={content.thumbnail_url}
                            alt={content.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>
                      )}
                      <div className="p-5">
                        {content.topics && (
                          <Badge variant="secondary" className="mb-3 bg-primary/10 text-primary border-0">
                            <Tag className="h-3 w-3 mr-1" />
                            {content.topics.name}
                          </Badge>
                        )}
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
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
      </div>
    </div>
  );
};

export default ContentLibraryPage;

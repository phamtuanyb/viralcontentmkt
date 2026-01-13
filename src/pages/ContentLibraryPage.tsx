import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { contentApi, type ContentWithTopic, type SortOption } from "@/api/content.api";
import { topicsApi, type Topic } from "@/api/topics.api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { createContentUrl } from "@/lib/slug";
import { Search, FileText, Calendar, Tag, Folder, FolderOpen, ChevronRight, Sparkles, ArrowUpDown, Clock, Eye, TrendingUp, Gift, Copy, Check } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ImageGallery } from "@/components/content/ImageGallery";
import { AdBannerDisplay } from "@/components/AdBannerDisplay";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MonthCountdown from "@/components/MonthCountdown";

interface ContentImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number | null;
}

const sortOptions = [
  { value: "newest" as SortOption, label: "Mới nhất", icon: Clock },
  { value: "oldest" as SortOption, label: "Cũ nhất", icon: Clock },
  { value: "views" as SortOption, label: "Lượt xem", icon: Eye },
  { value: "popular" as SortOption, label: "Phổ biến", icon: TrendingUp },
];

const ContentLibraryPage = () => {
  const [contents, setContents] = useState<ContentWithTopic[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [copiedDaily, setCopiedDaily] = useState(false);
  const [dailyContentImages, setDailyContentImages] = useState<ContentImage[]>([]);
  const [showDailyContent, setShowDailyContent] = useState(false);
  const { profile } = useAuthStore();

  // Get root topics (level = 0, parent_id = null) for sidebar
  const rootTopics = topics.filter(t => t.parent_id === null);
  
  // Get child topics of selected parent
  const childTopics = selectedTopic 
    ? topics.filter(t => t.parent_id === selectedTopic).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    : [];
  
  // Get content count for a topic including its children
  const getTopicContentCount = (topicId: string) => {
    const childIds = topics.filter(t => t.parent_id === topicId).map(t => t.id);
    return contents.filter(c => c.topic_id === topicId || childIds.includes(c.topic_id || "")).length;
  };

  // Get today's date for display
  const today = new Date();
  const todayString = format(today, "dd/MM/yyyy");

  // State for random daily content
  const [dailyContent, setDailyContent] = useState<ContentWithTopic | null>(null);
  
  // Generate unique session seed on component mount (different for each page load)
  const [sessionSeed] = useState(() => Math.random());

  // Select random content each time page loads (excluding promotional content)
  // Each user and each session gets different random content
  useEffect(() => {
    const nonPromoContents = contents.filter(c => {
      const topicName = c.topics?.name?.toLowerCase() || "";
      return !topicName.includes("khuyến mãi") && !topicName.includes("khuyen mai") && !topicName.includes("promotion");
    });
    
    if (nonPromoContents.length === 0) {
      setDailyContent(null);
      return;
    }
    
    // Combine session seed with user ID for unique randomization per user per session
    const userSeed = profile?.id ? profile.id.charCodeAt(0) / 100 : 0;
    const combinedSeed = (sessionSeed + userSeed) % 1;
    const randomIndex = Math.floor(combinedSeed * nonPromoContents.length);
    
    setDailyContent(nonPromoContents[randomIndex]);
  }, [contents, sessionSeed, profile?.id]);

  // Fetch images for daily content
  useEffect(() => {
    const fetchDailyImages = async () => {
      if (dailyContent) {
        const { data } = await contentApi.getImages(dailyContent.id);
        if (data) {
          setDailyContentImages(data as ContentImage[]);
        }
      }
    };
    fetchDailyImages();
  }, [dailyContent]);

  const handleCopyDailyContent = async () => {
    if (!dailyContent) return;
    
    try {
      await navigator.clipboard.writeText(dailyContent.body);
      setCopiedDaily(true);
      toast.success("Đã sao chép nội dung!");
      setTimeout(() => setCopiedDaily(false), 2000);
    } catch {
      toast.error("Không thể sao chép nội dung");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [contentsRes, topicsRes] = await Promise.all([
        contentApi.getPublished(sortBy),
        topicsApi.getActiveWithVisibleParent(),
      ]);
      
      if (contentsRes.data) setContents(contentsRes.data);
      if (topicsRes.data) setTopics(topicsRes.data);
      setIsLoading(false);
    };

    fetchData();
  }, [sortBy]);

  // When a parent topic is selected, include content from child topics too
  const filteredContents = contents.filter((content) => {
    let matchesTopic = !selectedTopic;
    if (selectedTopic) {
      const childIds = topics.filter(t => t.parent_id === selectedTopic).map(t => t.id);
      matchesTopic = content.topic_id === selectedTopic || childIds.includes(content.topic_id || "");
    }
    const matchesSearch = !searchQuery || 
      content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.body.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTopic && matchesSearch;
  });

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
              <p className="text-xs text-muted-foreground">{rootTopics.length} chủ đề</p>
            </div>
          </div>

          {/* Topics List */}
          <nav className="space-y-1">
            <button
              onClick={() => {
                setSelectedTopic(null);
                setShowDailyContent(false);
              }}
              className={cn(
                "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                "hover:bg-accent/50",
                selectedTopic === null && !showDailyContent
                  ? "bg-primary/10 text-primary font-medium border border-primary/20" 
                  : "text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-1.5 rounded-md transition-colors",
                  selectedTopic === null && !showDailyContent ? "bg-primary/20" : "bg-muted"
                )}>
                  <FolderOpen className="h-4 w-4" />
                </div>
                <span>Tất cả nội dung</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {contents.length}
              </Badge>
            </button>

            {/* Content Theo Ngày Menu Item */}
            {dailyContent && (
              <button
                onClick={() => {
                  setShowDailyContent(true);
                  setSelectedTopic(null);
                }}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                  "hover:bg-accent/50",
                  showDailyContent 
                    ? "bg-gradient-to-r from-primary/20 to-secondary/20 text-primary font-medium border border-primary/20" 
                    : "text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-1.5 rounded-md transition-colors",
                    showDailyContent ? "bg-primary/20" : "bg-gradient-to-br from-primary/10 to-secondary/10"
                  )}>
                    <Gift className="h-4 w-4 text-primary" />
                  </div>
                  <span>Content Theo Ngày</span>
                </div>
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                  Mới
                </Badge>
              </button>
            )}

            <div className="pt-2 pb-1 px-3">
              <div className="h-px bg-border/50" />
            </div>

            {rootTopics.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)).map((topic, index) => (
              <motion.button
                key={topic.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  setSelectedTopic(topic.id);
                  setShowDailyContent(false);
                }}
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

          {/* Month Countdown */}
          <div className="mt-4">
            <MonthCountdown />
          </div>

          {/* Topics Footer */}
          <div className="mt-4 p-3 rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5 border border-border/30">
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

            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 bg-card/50 border-border/50">
                    <ArrowUpDown className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {sortOptions.find(o => o.value === sortBy)?.label}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {sortOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setSortBy(option.value)}
                      className={cn(
                        "gap-2 cursor-pointer",
                        sortBy === option.value && "bg-primary/10 text-primary"
                      )}
                    >
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Search */}
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card/50 border-border/50"
                />
              </div>
            </div>
          </motion.div>

          {/* Mobile Topics Filter - Root topics only */}
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
              {rootTopics.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)).map((topic) => (
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

          {/* Child Topics Section - shown when parent topic is selected */}
          {selectedTopic && childTopics.length > 0 && !showDailyContent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="p-4 rounded-xl bg-card/50 border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Folder className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Chủ đề con</span>
                  <Badge variant="secondary" className="text-xs">{childTopics.length}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {childTopics.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedTopic(child.id)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-muted hover:bg-accent/50 transition-colors flex items-center gap-2"
                    >
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      {child.name}
                      <Badge variant="outline" className="text-xs ml-1">
                        {contents.filter(c => c.topic_id === child.id).length}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Content Theo Ngày - Daily Random Content */}
          {showDailyContent && dailyContent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border border-primary/20 p-6">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-primary/20 text-primary">
                      <Gift className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Content Theo Ngày</h3>
                      <p className="text-xs text-muted-foreground">Nội dung được chọn ngẫu nhiên mỗi ngày</p>
                    </div>
                  </div>

                  {/* Greeting */}
                  <div className="mb-4 p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border/30">
                    <p className="text-foreground">
                      Xin Chào, <span className="font-semibold text-primary">{profile?.full_name || profile?.email?.split("@")[0] || "Bạn"}</span>! 👋
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Hôm nay là ngày <span className="font-medium text-foreground">{todayString}</span>
                    </p>
                    <p className="text-sm mt-2">
                      Hãy dùng content này để đăng bài bán hàng nha! Chúc bạn thành công và sớm về bờ. 🚀
                    </p>
                  </div>

                  {/* Image Gallery Box */}
                  {(dailyContent.thumbnail_url || dailyContentImages.length > 0) && (
                    <div className="mb-4">
                      <ImageGallery
                        images={dailyContentImages}
                        thumbnailUrl={dailyContent.thumbnail_url}
                        title={dailyContent.title}
                      />
                    </div>
                  )}

                  {/* Daily Content Card */}
                  <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        {dailyContent.topics && (
                          <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary border-0 text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {dailyContent.topics.name}
                          </Badge>
                        )}
                        <h4 className="font-semibold text-base mb-2">
                          {dailyContent.title}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {dailyContent.body}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        size="sm"
                        onClick={handleCopyDailyContent}
                        className="gap-2"
                      >
                        {copiedDaily ? (
                          <>
                            <Check className="h-4 w-4" />
                            Đã sao chép
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Sao chép nội dung
                          </>
                        )}
                      </Button>
                      <Link to={createContentUrl(dailyContent.id, dailyContent.title)}>
                        <Button variant="outline" size="sm">
                          Xem chi tiết
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Ad Banner */}
          <AdBannerDisplay placement="library" className="mb-6" />

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
                  <Link to={createContentUrl(content.id, content.title)}>
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

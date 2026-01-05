import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { contentApi, type ContentWithTopic } from "@/api/content.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { ROUTES } from "@/constants";
import { topicsApi, type Topic } from "@/api/topics.api";
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  CheckCircle, 
  Clock,
  Search,
  Eye,
  Filter,
} from "lucide-react";
import { format } from "date-fns";

const AdminContentsPage = () => {
  const navigate = useNavigate();
  const [contents, setContents] = useState<ContentWithTopic[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTopic, setFilterTopic] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    const [contentsRes, topicsRes] = await Promise.all([
      contentApi.getAll(),
      topicsApi.getAll(),
    ]);
    if (contentsRes.data) setContents(contentsRes.data);
    if (topicsRes.data) setTopics(topicsRes.data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    
    const { error } = await contentApi.delete(deleteId);
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Thành công", description: "Đã xóa nội dung" });
      setContents(contents.filter((c) => c.id !== deleteId));
    }
    setDeleteId(null);
  };

  const filteredContents = contents.filter((content) => {
    const matchesSearch = content.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = filterTopic === "all" || content.topic_id === filterTopic;
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "published" && content.is_published) ||
      (filterStatus === "draft" && !content.is_published);
    
    return matchesSearch && matchesTopic && matchesStatus;
  });

  const stats = {
    total: contents.length,
    published: contents.filter(c => c.is_published).length,
    draft: contents.filter(c => !c.is_published).length,
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Quản lý nội dung</h1>
          </div>
          <p className="text-muted-foreground">
            Tạo và quản lý các nội dung viral
          </p>
        </div>
        <Button 
          onClick={() => navigate(ROUTES.ADMIN_CONTENT_NEW)} 
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Tạo nội dung mới
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Tổng nội dung</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-success/10">
            <CheckCircle className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.published}</p>
            <p className="text-sm text-muted-foreground">Đã xuất bản</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-muted">
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.draft}</p>
            <p className="text-sm text-muted-foreground">Bản nháp</p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tiêu đề..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterTopic} onValueChange={setFilterTopic}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Chủ đề" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả chủ đề</SelectItem>
            {topics.map((topic) => (
              <SelectItem key={topic.id} value={topic.id}>
                {topic.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="published">Đã xuất bản</SelectItem>
            <SelectItem value="draft">Bản nháp</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Content Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass rounded-xl overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          </div>
        ) : filteredContents.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery || filterTopic !== "all" || filterStatus !== "all" 
              ? "Không tìm thấy nội dung phù hợp" 
              : "Chưa có nội dung nào"}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[40%]">Tiêu đề</TableHead>
                <TableHead>Chủ đề</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContents.map((content, index) => (
                <motion.tr
                  key={content.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-border hover:bg-muted/50 group"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {content.thumbnail_url ? (
                        <img
                          src={content.thumbnail_url}
                          alt={content.title}
                          className="h-12 w-16 rounded object-cover"
                        />
                      ) : (
                        <div className="h-12 w-16 rounded bg-muted flex items-center justify-center">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="max-w-xs">
                        <p className="font-medium truncate">{content.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {content.body.substring(0, 60)}...
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {content.topics ? (
                      <Badge variant="secondary">{content.topics.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {content.is_published ? (
                      <Badge className="bg-success/20 text-success border-0 gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Đã xuất bản
                      </Badge>
                    ) : (
                      <Badge className="bg-muted text-muted-foreground border-0 gap-1">
                        <Clock className="h-3 w-3" />
                        Nháp
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(content.created_at), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`/library/${content.id}`, "_blank")}
                        title="Xem"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/admin/contents/${content.id}/edit`)}
                        title="Chỉnh sửa"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(content.id)}
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa nội dung này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminContentsPage;

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { contentApi, type ContentWithTopic } from "@/api/content.api";
import { topicsApi, type Topic } from "@/api/topics.api";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { FileText, Plus, Edit, Trash2, Loader2, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";

const AdminContentsPage = () => {
  const { user } = useAuthStore();
  const [contents, setContents] = useState<ContentWithTopic[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentWithTopic | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    topic_id: "",
    thumbnail_url: "",
    is_published: false,
  });

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

  const handleOpenDialog = (content?: ContentWithTopic) => {
    if (content) {
      setEditingContent(content);
      setFormData({
        title: content.title,
        body: content.body,
        topic_id: content.topic_id || "",
        thumbnail_url: content.thumbnail_url || "",
        is_published: content.is_published,
      });
    } else {
      setEditingContent(null);
      setFormData({ title: "", body: "", topic_id: "", thumbnail_url: "", is_published: false });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.body) {
      toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin", variant: "destructive" });
      return;
    }

    const contentData = {
      ...formData,
      topic_id: formData.topic_id || undefined,
      created_by: user?.id,
    };

    if (editingContent) {
      const { error } = await contentApi.update(editingContent.id, contentData);
      if (error) {
        toast({ title: "Lỗi", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Thành công", description: "Đã cập nhật nội dung" });
        fetchData();
      }
    } else {
      const { error } = await contentApi.create(contentData);
      if (error) {
        toast({ title: "Lỗi", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Thành công", description: "Đã tạo nội dung mới" });
        fetchData();
      }
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa nội dung này?")) return;
    
    const { error } = await contentApi.delete(id);
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Thành công", description: "Đã xóa nội dung" });
      setContents(contents.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between"
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
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm nội dung
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-xl overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          </div>
        ) : contents.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Chưa có nội dung nào
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Chủ đề</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contents.map((content) => (
                <TableRow key={content.id} className="border-border">
                  <TableCell>
                    <div className="max-w-xs truncate font-medium">{content.title}</div>
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
                      <Badge className="bg-success/20 text-success border-0">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Đã xuất bản
                      </Badge>
                    ) : (
                      <Badge className="bg-muted text-muted-foreground border-0">
                        <Clock className="h-3 w-3 mr-1" />
                        Nháp
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(content.created_at), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(content)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(content.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass-strong max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingContent ? "Chỉnh sửa nội dung" : "Thêm nội dung mới"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Tiêu đề</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nhập tiêu đề nội dung"
              />
            </div>
            <div className="space-y-2">
              <Label>Chủ đề</Label>
              <Select
                value={formData.topic_id}
                onValueChange={(value) => setFormData({ ...formData, topic_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn chủ đề" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>{topic.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nội dung</Label>
              <Textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Nhập nội dung..."
                rows={8}
              />
            </div>
            <div className="space-y-2">
              <Label>URL Thumbnail</Label>
              <Input
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Xuất bản</Label>
              <Switch
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminContentsPage;

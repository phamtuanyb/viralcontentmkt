import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { topicsApi, type Topic } from "@/api/topics.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "@/hooks/use-toast";
import { Tags, Plus, Edit, Trash2, Loader2, Eye, EyeOff } from "lucide-react";

const AdminTopicsPage = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    status: "active" as "active" | "hidden",
  });

  const fetchTopics = async () => {
    setIsLoading(true);
    const { data } = await topicsApi.getAll();
    if (data) setTopics(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleOpenDialog = (topic?: Topic) => {
    if (topic) {
      setEditingTopic(topic);
      setFormData({
        name: topic.name,
        slug: topic.slug,
        description: topic.description || "",
        status: topic.status,
      });
    } else {
      setEditingTopic(null);
      setFormData({ name: "", slug: "", description: "", status: "active" });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.slug) {
      toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin", variant: "destructive" });
      return;
    }

    if (editingTopic) {
      const { error } = await topicsApi.update(editingTopic.id, formData);
      if (error) {
        toast({ title: "Lỗi", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Thành công", description: "Đã cập nhật chủ đề" });
        fetchTopics();
      }
    } else {
      const { error } = await topicsApi.create(formData);
      if (error) {
        toast({ title: "Lỗi", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Thành công", description: "Đã tạo chủ đề mới" });
        fetchTopics();
      }
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa chủ đề này?")) return;
    
    const { error } = await topicsApi.delete(id);
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Thành công", description: "Đã xóa chủ đề" });
      setTopics(topics.filter((t) => t.id !== id));
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
            <Tags className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Quản lý chủ đề</h1>
          </div>
          <p className="text-muted-foreground">
            Tạo và quản lý các chủ đề nội dung
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm chủ đề
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
        ) : topics.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Chưa có chủ đề nào
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Tên chủ đề</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topics.map((topic) => (
                <TableRow key={topic.id} className="border-border">
                  <TableCell className="font-medium">{topic.name}</TableCell>
                  <TableCell className="text-muted-foreground">{topic.slug}</TableCell>
                  <TableCell>
                    {topic.status === "active" ? (
                      <Badge className="bg-success/20 text-success border-0">
                        <Eye className="h-3 w-3 mr-1" />
                        Hiển thị
                      </Badge>
                    ) : (
                      <Badge className="bg-muted text-muted-foreground border-0">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Ẩn
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(topic)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(topic.id)}>
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
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle>{editingTopic ? "Chỉnh sửa chủ đề" : "Thêm chủ đề mới"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tên chủ đề</Label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: editingTopic ? formData.slug : generateSlug(e.target.value),
                  });
                }}
                placeholder="VD: Marketing Online"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="marketing-online"
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả ngắn về chủ đề"
              />
            </div>
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as "active" | "hidden" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hiển thị</SelectItem>
                  <SelectItem value="hidden">Ẩn</SelectItem>
                </SelectContent>
              </Select>
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

export default AdminTopicsPage;

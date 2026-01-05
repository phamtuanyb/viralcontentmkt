import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { topicsApi, type Topic, type TopicWithChildren } from "@/api/topics.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { 
  Tags, Plus, Edit, Trash2, Loader2, Eye, EyeOff, 
  ChevronRight, ChevronDown, GripVertical, FolderPlus,
  ArrowUp, ArrowDown, CornerDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const AdminTopicsPage = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicTree, setTopicTree] = useState<TopicWithChildren[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    status: "active" as "active" | "hidden",
    parent_id: null as string | null,
  });

  const fetchTopics = async () => {
    setIsLoading(true);
    const { data } = await topicsApi.getAll();
    if (data) {
      setTopics(data);
      setTopicTree(topicsApi.buildTree(data));
      // Expand all by default
      setExpandedIds(new Set(data.map(t => t.id)));
    }
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

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleOpenDialog = (topic?: Topic, parentId?: string | null) => {
    if (topic) {
      setEditingTopic(topic);
      setFormData({
        name: topic.name,
        slug: topic.slug,
        description: topic.description || "",
        status: topic.status,
        parent_id: topic.parent_id,
      });
    } else {
      setEditingTopic(null);
      setFormData({ 
        name: "", 
        slug: "", 
        description: "", 
        status: "active",
        parent_id: parentId ?? null,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.slug) {
      toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin", variant: "destructive" });
      return;
    }

    // Validate depth
    if (formData.parent_id) {
      const parent = topics.find(t => t.id === formData.parent_id);
      if (parent && parent.level >= 2) {
        toast({ 
          title: "Lỗi", 
          description: "Không thể tạo chủ đề con ở cấp sâu hơn (tối đa 3 cấp)", 
          variant: "destructive" 
        });
        return;
      }
    }

    if (editingTopic) {
      // Check for circular reference when changing parent
      if (formData.parent_id !== editingTopic.parent_id) {
        if (!topicsApi.canMoveToParent(topics, editingTopic.id, formData.parent_id)) {
          toast({ 
            title: "Lỗi", 
            description: "Không thể di chuyển: tham chiếu vòng hoặc vượt quá độ sâu cho phép", 
            variant: "destructive" 
          });
          return;
        }
      }

      const { error } = await topicsApi.update(editingTopic.id, {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        status: formData.status,
        parent_id: formData.parent_id,
      });
      if (error) {
        toast({ title: "Lỗi", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Thành công", description: "Đã cập nhật chủ đề" });
        fetchTopics();
      }
    } else {
      const { error } = await topicsApi.create({
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        status: formData.status,
        parent_id: formData.parent_id,
      });
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
    const hasChildren = topics.some(t => t.parent_id === id);
    if (hasChildren) {
      toast({ 
        title: "Không thể xóa", 
        description: "Chủ đề này có chủ đề con. Vui lòng xóa các chủ đề con trước.", 
        variant: "destructive" 
      });
      return;
    }

    if (!confirm("Bạn có chắc muốn xóa chủ đề này?")) return;
    
    const { error } = await topicsApi.delete(id);
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Thành công", description: "Đã xóa chủ đề" });
      setTopics(topics.filter((t) => t.id !== id));
      setTopicTree(topicsApi.buildTree(topics.filter((t) => t.id !== id)));
    }
  };

  const handleMoveUp = async (topic: Topic) => {
    const siblings = topicsApi.getSiblings(topics, topic.parent_id);
    const currentIndex = siblings.findIndex(t => t.id === topic.id);
    if (currentIndex <= 0) return;

    const prevTopic = siblings[currentIndex - 1];
    
    // Swap order_index values
    await topicsApi.update(topic.id, { order_index: prevTopic.order_index });
    await topicsApi.update(prevTopic.id, { order_index: topic.order_index });
    
    fetchTopics();
    toast({ title: "Thành công", description: "Đã di chuyển chủ đề lên" });
  };

  const handleMoveDown = async (topic: Topic) => {
    const siblings = topicsApi.getSiblings(topics, topic.parent_id);
    const currentIndex = siblings.findIndex(t => t.id === topic.id);
    if (currentIndex >= siblings.length - 1) return;

    const nextTopic = siblings[currentIndex + 1];
    
    // Swap order_index values
    await topicsApi.update(topic.id, { order_index: nextTopic.order_index });
    await topicsApi.update(nextTopic.id, { order_index: topic.order_index });
    
    fetchTopics();
    toast({ title: "Thành công", description: "Đã di chuyển chủ đề xuống" });
  };

  // Get available parents for select (exclude self and descendants)
  const getAvailableParents = (excludeId?: string): Topic[] => {
    if (!excludeId) {
      return topics.filter(t => t.level < 2);
    }

    const excludeIds = new Set<string>();
    excludeIds.add(excludeId);

    // Find all descendants
    const findDescendants = (parentId: string) => {
      topics.forEach(t => {
        if (t.parent_id === parentId) {
          excludeIds.add(t.id);
          findDescendants(t.id);
        }
      });
    };
    findDescendants(excludeId);

    return topics.filter(t => !excludeIds.has(t.id) && t.level < 2);
  };

  const renderTopicRow = (topic: TopicWithChildren, depth: number = 0) => {
    const hasChildren = topic.children && topic.children.length > 0;
    const isExpanded = expandedIds.has(topic.id);
    const siblings = topicsApi.getSiblings(topics, topic.parent_id);
    const currentIndex = siblings.findIndex(t => t.id === topic.id);
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === siblings.length - 1;

    return (
      <div key={topic.id}>
        <div 
          className={cn(
            "flex items-center gap-2 py-3 px-4 border-b border-border hover:bg-muted/30 transition-colors",
            depth > 0 && "bg-muted/10"
          )}
        >
          {/* Indent and expand toggle */}
          <div className="flex items-center gap-1" style={{ marginLeft: depth * 24 }}>
            {hasChildren ? (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => toggleExpand(topic.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div className="w-6 h-6 flex items-center justify-center">
                {depth > 0 && <CornerDownRight className="h-3 w-3 text-muted-foreground" />}
              </div>
            )}
          </div>

          {/* Topic info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{topic.name}</span>
              <Badge variant="outline" className="text-xs">
                Cấp {topic.level}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground truncate">{topic.slug}</div>
          </div>

          {/* Status */}
          <div className="flex-shrink-0">
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
          </div>

          {/* Order controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => handleMoveUp(topic)}
              disabled={isFirst}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => handleMoveDown(topic)}
              disabled={isLast}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {topic.level < 2 && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => handleOpenDialog(undefined, topic.id)}
                title="Thêm chủ đề con"
              >
                <FolderPlus className="h-4 w-4 text-primary" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => handleOpenDialog(topic)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => handleDelete(topic.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        {/* Render children */}
        {hasChildren && isExpanded && (
          <div>
            {topic.children!.map(child => renderTopicRow(child, depth + 1))}
          </div>
        )}
      </div>
    );
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
            Tạo và quản lý các chủ đề nội dung theo cấp bậc (tối đa 3 cấp)
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm chủ đề gốc
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
          <div>
            {/* Header */}
            <div className="flex items-center gap-2 py-3 px-4 border-b border-border bg-muted/50 font-medium text-sm">
              <div className="flex-1">Tên chủ đề</div>
              <div className="w-24 text-center">Trạng thái</div>
              <div className="w-20 text-center">Thứ tự</div>
              <div className="w-32 text-center">Hành động</div>
            </div>
            {/* Topic tree */}
            {topicTree.map(topic => renderTopicRow(topic))}
          </div>
        )}
      </motion.div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass-strong max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTopic ? "Chỉnh sửa chủ đề" : formData.parent_id ? "Thêm chủ đề con" : "Thêm chủ đề gốc"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Chủ đề cha</Label>
              <Select
                value={formData.parent_id || "root"}
                onValueChange={(value) => setFormData({ 
                  ...formData, 
                  parent_id: value === "root" ? null : value 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn chủ đề cha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">
                    <span className="font-medium">— Không có (chủ đề gốc) —</span>
                  </SelectItem>
                  {getAvailableParents(editingTopic?.id).map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      <span style={{ marginLeft: t.level * 12 }}>
                        {t.level > 0 && "└ "}{t.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { bannersApi, type ProgramBanner } from "@/api/banners.api";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Megaphone, Plus, Edit, Trash2, Loader2, Eye, EyeOff } from "lucide-react";

const AdminProgramBannersPage = () => {
  const [banners, setBanners] = useState<ProgramBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<ProgramBanner | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    link_url: "",
    is_active: true,
    sort_order: 0,
  });

  const fetchBanners = async () => {
    setIsLoading(true);
    const { data } = await bannersApi.getAllProgramBanners();
    if (data) setBanners(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenDialog = (banner?: ProgramBanner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title,
        subtitle: banner.subtitle || "",
        image_url: banner.image_url,
        link_url: banner.link_url || "",
        is_active: banner.is_active,
        sort_order: banner.sort_order,
      });
    } else {
      setEditingBanner(null);
      setFormData({ title: "", subtitle: "", image_url: "", link_url: "", is_active: true, sort_order: 0 });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.image_url) {
      toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin", variant: "destructive" });
      return;
    }

    if (editingBanner) {
      const { error } = await bannersApi.updateProgramBanner(editingBanner.id, formData);
      if (error) {
        toast({ title: "Lỗi", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Thành công", description: "Đã cập nhật banner" });
        fetchBanners();
      }
    } else {
      const { error } = await bannersApi.createProgramBanner(formData);
      if (error) {
        toast({ title: "Lỗi", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Thành công", description: "Đã tạo banner mới" });
        fetchBanners();
      }
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa banner này?")) return;
    
    const { error } = await bannersApi.deleteProgramBanner(id);
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Thành công", description: "Đã xóa banner" });
      setBanners(banners.filter((b) => b.id !== id));
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
            <Megaphone className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Banner chương trình</h1>
          </div>
          <p className="text-muted-foreground">
            Quản lý banner các chương trình/campaign
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm banner
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
        ) : banners.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Chưa có banner nào
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Preview</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Phụ đề</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map((banner) => (
                <TableRow key={banner.id} className="border-border">
                  <TableCell>
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-24 h-14 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{banner.title}</TableCell>
                  <TableCell className="text-muted-foreground">{banner.subtitle || "-"}</TableCell>
                  <TableCell>
                    {banner.is_active ? (
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
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(banner)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(banner.id)}>
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
            <DialogTitle>{editingBanner ? "Chỉnh sửa banner" : "Thêm banner mới"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tiêu đề</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nhập tiêu đề banner"
              />
            </div>
            <div className="space-y-2">
              <Label>Phụ đề</Label>
              <Input
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Nhập phụ đề (tùy chọn)"
              />
            </div>
            <div className="space-y-2">
              <Label>URL Hình ảnh</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/banner.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label>URL Liên kết</Label>
              <Input
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                placeholder="https://example.com/page"
              />
            </div>
            <div className="space-y-2">
              <Label>Thứ tự hiển thị</Label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Hiển thị</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
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

export default AdminProgramBannersPage;

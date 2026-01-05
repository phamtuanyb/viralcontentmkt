import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { adBannersApi, type AdBanner, type AdBannerPlacement, type AdBannerStatus } from "@/api/ad-banners.api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Megaphone, Plus, Edit, Trash2, Loader2, Eye, EyeOff, Library, FileText } from "lucide-react";

const placementLabels: Record<AdBannerPlacement, string> = {
  library: "Thư Viện",
  content_detail: "Chi Tiết Bài Viết",
};

const placementIcons: Record<AdBannerPlacement, React.ElementType> = {
  library: Library,
  content_detail: FileText,
};

const AdminAdBannersPage = () => {
  const [banners, setBanners] = useState<AdBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<AdBanner | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    image_url: "",
    target_url: "",
    placement_type: "library" as AdBannerPlacement,
    status: "active" as AdBannerStatus,
    sort_order: 0,
  });

  const fetchBanners = async () => {
    setIsLoading(true);
    const { data } = await adBannersApi.getAll();
    if (data) setBanners(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenDialog = (banner?: AdBanner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title,
        image_url: banner.image_url,
        target_url: banner.target_url || "",
        placement_type: banner.placement_type,
        status: banner.status,
        sort_order: banner.sort_order,
      });
    } else {
      setEditingBanner(null);
      setFormData({
        title: "",
        image_url: "",
        target_url: "",
        placement_type: "library",
        status: "active",
        sort_order: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.image_url) {
      toast({ title: "Lỗi", description: "Vui lòng điền tiêu đề và URL hình ảnh", variant: "destructive" });
      return;
    }

    if (editingBanner) {
      const { error } = await adBannersApi.update(editingBanner.id, formData);
      if (error) {
        toast({ title: "Lỗi", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Thành công", description: "Đã cập nhật banner quảng cáo" });
        fetchBanners();
      }
    } else {
      const { error } = await adBannersApi.create(formData);
      if (error) {
        toast({ title: "Lỗi", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Thành công", description: "Đã tạo banner quảng cáo mới" });
        fetchBanners();
      }
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa banner này?")) return;
    
    const { error } = await adBannersApi.delete(id);
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Thành công", description: "Đã xóa banner" });
      setBanners(banners.filter((b) => b.id !== id));
    }
  };

  const handleToggleStatus = async (banner: AdBanner) => {
    const newStatus: AdBannerStatus = banner.status === "active" ? "hidden" : "active";
    const { error } = await adBannersApi.update(banner.id, { status: newStatus });
    
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Thành công", description: `Đã ${newStatus === "active" ? "bật" : "tắt"} banner` });
      fetchBanners();
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
            <h1 className="text-3xl font-bold">Banner Quảng Cáo</h1>
          </div>
          <p className="text-muted-foreground">
            Quản lý banner quảng cáo hiển thị trên trang Thư Viện và Chi Tiết Bài Viết
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
            <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có banner quảng cáo nào</p>
            <p className="text-sm mt-1">Nhấn "Thêm banner" để tạo mới</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Preview</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Vị trí</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thứ tự</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map((banner) => {
                const PlacementIcon = placementIcons[banner.placement_type];
                return (
                  <TableRow key={banner.id} className="border-border">
                    <TableCell>
                      <img
                        src={banner.image_url}
                        alt={banner.title}
                        className="w-32 h-16 object-cover rounded border border-border/50"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{banner.title}</p>
                        {banner.target_url && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {banner.target_url}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1.5">
                        <PlacementIcon className="h-3 w-3" />
                        {placementLabels[banner.placement_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(banner)}
                        className="gap-1.5"
                      >
                        {banner.status === "active" ? (
                          <Badge className="bg-success/20 text-success border-0 gap-1">
                            <Eye className="h-3 w-3" />
                            Hiển thị
                          </Badge>
                        ) : (
                          <Badge className="bg-muted text-muted-foreground border-0 gap-1">
                            <EyeOff className="h-3 w-3" />
                            Ẩn
                          </Badge>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>{banner.sort_order}</TableCell>
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
                );
              })}
            </TableBody>
          </Table>
        )}
      </motion.div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass-strong max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBanner ? "Chỉnh sửa banner" : "Thêm banner mới"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tiêu đề *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nhập tiêu đề banner"
              />
            </div>

            <div className="space-y-2">
              <Label>URL Hình ảnh *</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/banner.jpg"
              />
              {formData.image_url && (
                <div className="mt-2 rounded-lg overflow-hidden border border-border/50">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-auto max-h-[150px] object-cover"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>URL Liên kết (tùy chọn)</Label>
              <Input
                value={formData.target_url}
                onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                placeholder="https://example.com/landing-page"
              />
              <p className="text-xs text-muted-foreground">
                Người dùng click vào banner sẽ được chuyển đến URL này
              </p>
            </div>

            <div className="space-y-2">
              <Label>Vị trí hiển thị *</Label>
              <Select
                value={formData.placement_type}
                onValueChange={(value) => setFormData({ ...formData, placement_type: value as AdBannerPlacement })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="library">
                    <div className="flex items-center gap-2">
                      <Library className="h-4 w-4" />
                      Banner Thư Viện
                    </div>
                  </SelectItem>
                  <SelectItem value="content_detail">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Banner Trong Bài Viết
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as AdBannerStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-success" />
                        Hiển thị
                      </div>
                    </SelectItem>
                    <SelectItem value="hidden">
                      <div className="flex items-center gap-2">
                        <EyeOff className="h-4 w-4" />
                        Ẩn
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Thứ tự hiển thị</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
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

export default AdminAdBannersPage;

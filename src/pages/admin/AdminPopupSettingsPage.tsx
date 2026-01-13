import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Plus, Pencil, Trash2, Save, X, Clock, PartyPopper, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { popupSettingsApi, type PopupSetting } from "@/api/popup-settings.api";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

const AdminPopupSettingsPage = () => {
  const [popups, setPopups] = useState<PopupSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPopup, setSelectedPopup] = useState<PopupSetting | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    popup_type: "countdown" as "countdown" | "new_month",
    days_before_end: 5,
    is_active: true,
  });
  const { user } = useAuthStore();

  const fetchPopups = async () => {
    setIsLoading(true);
    const { data, error } = await popupSettingsApi.getAll();
    if (data) setPopups(data);
    if (error) toast.error("Không thể tải cài đặt popup");
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPopups();
  }, []);

  const handleOpenCreate = () => {
    setSelectedPopup(null);
    setFormData({
      title: "",
      message: "",
      popup_type: "countdown",
      days_before_end: 5,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (popup: PopupSetting) => {
    setSelectedPopup(popup);
    setFormData({
      title: popup.title,
      message: popup.message,
      popup_type: popup.popup_type,
      days_before_end: popup.days_before_end,
      is_active: popup.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (popup: PopupSetting) => {
    setSelectedPopup(popup);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.message) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (selectedPopup) {
      // Update
      const { error } = await popupSettingsApi.update(selectedPopup.id, formData);
      if (error) {
        toast.error("Không thể cập nhật popup");
        return;
      }
      toast.success("Đã cập nhật popup thành công");
    } else {
      // Create
      const { error } = await popupSettingsApi.create({
        ...formData,
        created_by: user?.id || null,
      });
      if (error) {
        toast.error("Không thể tạo popup");
        return;
      }
      toast.success("Đã tạo popup thành công");
    }

    setIsDialogOpen(false);
    fetchPopups();
  };

  const handleDelete = async () => {
    if (!selectedPopup) return;

    const { error } = await popupSettingsApi.delete(selectedPopup.id);
    if (error) {
      toast.error("Không thể xóa popup");
      return;
    }

    toast.success("Đã xóa popup thành công");
    setIsDeleteDialogOpen(false);
    fetchPopups();
  };

  const handleToggleActive = async (popup: PopupSetting) => {
    const { error } = await popupSettingsApi.update(popup.id, {
      is_active: !popup.is_active,
    });
    if (error) {
      toast.error("Không thể cập nhật trạng thái");
      return;
    }
    fetchPopups();
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Quản lý Popup Thông báo
          </h1>
          <p className="text-muted-foreground mt-1">
            Cấu hình thông báo popup cho người dùng
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm Popup
        </Button>
      </motion.div>

      {/* Variable Guide */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Hướng dẫn biến cá nhân hóa
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3 text-sm">
            <Badge variant="outline" className="font-mono">{"{name}"} = Tên người dùng</Badge>
            <Badge variant="outline" className="font-mono">{"{month}"} = Tháng hiện tại</Badge>
            <Badge variant="outline" className="font-mono">{"{days}"} = Số ngày còn lại</Badge>
            <Badge variant="outline" className="font-mono">{"{year}"} = Năm hiện tại</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Popup List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
        ) : popups.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Chưa có popup nào được cấu hình</p>
              <Button onClick={handleOpenCreate} variant="outline" className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Thêm popup đầu tiên
              </Button>
            </CardContent>
          </Card>
        ) : (
          popups.map((popup, index) => (
            <motion.div
              key={popup.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`${!popup.is_active ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        popup.popup_type === 'countdown' 
                          ? 'bg-orange-100 dark:bg-orange-900/30' 
                          : 'bg-green-100 dark:bg-green-900/30'
                      }`}>
                        {popup.popup_type === 'countdown' ? (
                          <Clock className={`h-5 w-5 ${
                            popup.popup_type === 'countdown' ? 'text-orange-600' : 'text-green-600'
                          }`} />
                        ) : (
                          <PartyPopper className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-base">{popup.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Badge variant={popup.popup_type === 'countdown' ? 'default' : 'secondary'}>
                            {popup.popup_type === 'countdown' ? 'Đếm ngược' : 'Tháng mới'}
                          </Badge>
                          {popup.popup_type === 'countdown' && (
                            <span className="text-xs">
                              Hiển thị khi còn {popup.days_before_end} ngày
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={popup.is_active}
                        onCheckedChange={() => handleToggleActive(popup)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(popup)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDelete(popup)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-2">
                    {popup.message}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedPopup ? "Chỉnh sửa Popup" : "Thêm Popup mới"}
            </DialogTitle>
            <DialogDescription>
              Cấu hình nội dung và điều kiện hiển thị popup
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="popup_type">Loại Popup</Label>
              <Select
                value={formData.popup_type}
                onValueChange={(value: "countdown" | "new_month") =>
                  setFormData({ ...formData, popup_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="countdown">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      Đếm ngược cuối tháng
                    </div>
                  </SelectItem>
                  <SelectItem value="new_month">
                    <div className="flex items-center gap-2">
                      <PartyPopper className="h-4 w-4 text-green-500" />
                      Chúc mừng tháng mới
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.popup_type === 'countdown' && (
              <div className="space-y-2">
                <Label htmlFor="days_before_end">Số ngày trước khi hết tháng</Label>
                <Input
                  id="days_before_end"
                  type="number"
                  min={1}
                  max={15}
                  value={formData.days_before_end}
                  onChange={(e) =>
                    setFormData({ ...formData, days_before_end: parseInt(e.target.value) || 5 })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Popup sẽ hiển thị khi còn {formData.days_before_end} ngày nữa là hết tháng
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="VD: Sắp hết tháng rồi!"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Nội dung thông báo</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="VD: Chào {name}! Chỉ còn {days} ngày nữa là hết tháng {month}..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Sử dụng {"{name}"}, {"{month}"}, {"{days}"}, {"{year}"} để cá nhân hóa
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label htmlFor="is_active">Kích hoạt popup</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              {selectedPopup ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa popup "{selectedPopup?.title}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPopupSettingsPage;

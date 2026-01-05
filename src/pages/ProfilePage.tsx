import { useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { profileApi } from "@/api/profile.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { User, Phone, FileSignature, Save, Loader2 } from "lucide-react";

const ProfilePage = () => {
  const { profile, setProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone_number: profile?.phone_number || "",
    signature_text: profile?.signature_text || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsLoading(true);
    try {
      const { data, error } = await profileApi.updateProfile(profile.id, formData);
      if (error) {
        toast({ title: "Lỗi", description: error.message, variant: "destructive" });
      } else {
        setProfile({
          ...profile,
          phone_number: formData.phone_number,
          signature_text: formData.signature_text,
        });
        toast({ title: "Thành công", description: "Đã cập nhật hồ sơ!" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Hồ sơ cá nhân</h1>
          <p className="text-muted-foreground">
            Quản lý thông tin cá nhân của bạn
          </p>
        </div>

        {/* Profile Info Card */}
        <div className="glass rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 rounded-full bg-primary/10">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{profile?.full_name || "Người dùng"}</h2>
              <p className="text-muted-foreground">{profile?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Số điện thoại (Hotline)
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0912 345 678"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="bg-background/50"
              />
              <p className="text-xs text-muted-foreground">
                Số điện thoại sẽ được tự động thêm vào cuối nội dung khi bạn copy
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signature" className="flex items-center gap-2">
                <FileSignature className="h-4 w-4" />
                Chữ ký
              </Label>
              <Textarea
                id="signature"
                placeholder="VD: --- Nguyễn Văn A - Chuyên viên tư vấn"
                value={formData.signature_text}
                onChange={(e) => setFormData({ ...formData, signature_text: e.target.value })}
                rows={3}
                className="bg-background/50"
              />
              <p className="text-xs text-muted-foreground">
                Chữ ký sẽ được tự động thêm vào cuối nội dung khi bạn copy
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Preview */}
        <div className="glass rounded-xl p-6">
          <h3 className="font-semibold mb-4">Xem trước khi copy</h3>
          <div className="bg-background/50 rounded-lg p-4 text-sm">
            <p className="text-muted-foreground mb-2">[Nội dung sẽ ở đây]</p>
            {formData.phone_number && (
              <p className="text-foreground">
                Liên hệ ngay hotline: {formData.phone_number}
              </p>
            )}
            {formData.signature_text && (
              <p className="text-foreground mt-2 whitespace-pre-wrap">
                {formData.signature_text}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;

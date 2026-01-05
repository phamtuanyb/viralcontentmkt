import { useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { profileApi } from "@/api/profile.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Phone, FileSignature, Save, Loader2, Link2 } from "lucide-react";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { SocialLinksEditor } from "@/components/profile/SocialLinksEditor";
import { Leaderboard } from "@/components/Leaderboard";

const ProfilePage = () => {
  const { user, profile, setProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone_number: profile?.phone_number || "",
    signature_text: profile?.signature_text || "",
  });

  const handleAvatarChange = (url: string) => {
    if (profile) {
      setProfile({
        ...profile,
        avatar_url: url,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    setIsLoading(true);
    try {
      const { data, error } = await profileApi.updateProfile(user.id, formData);
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

  if (!user || !profile) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Vui lòng đăng nhập để xem hồ sơ</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Hồ sơ cá nhân</h1>
          <p className="text-muted-foreground">
            Quản lý thông tin cá nhân của bạn
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <div className="glass rounded-xl p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
                <AvatarUploader
                  currentAvatarUrl={profile.avatar_url}
                  userName={profile.full_name}
                  userId={user.id}
                  onAvatarChange={handleAvatarChange}
                />
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl font-semibold">{profile.full_name || "Người dùng"}</h2>
                  <p className="text-muted-foreground">{profile.email}</p>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      profile.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : profile.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {profile.status === 'active' ? 'Đã kích hoạt' : profile.status === 'pending' ? 'Chờ duyệt' : 'Đã khóa'}
                    </span>
                  </div>
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
                  className="w-full gap-2"
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

            {/* Social Links */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Link2 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Liên kết mạng xã hội</h3>
              </div>
              <SocialLinksEditor userId={user.id} />
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
          </div>

          {/* Right Column - Leaderboard */}
          <div className="lg:col-span-1">
            <Leaderboard />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;

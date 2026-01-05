import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { HeroBannerSlider } from "@/components/HeroBannerSlider";
import { ProgramBannerBox } from "@/components/ProgramBannerBox";
import { Button } from "@/components/ui/button";
import { bannersApi, type HomepageBanner, type ProgramBanner } from "@/api/banners.api";
import { ROUTES } from "@/constants";
import { ArrowRight, Zap, Shield, Rocket } from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();
  const [homepageBanners, setHomepageBanners] = useState<HomepageBanner[]>([]);
  const [programBanners, setProgramBanners] = useState<ProgramBanner[]>([]);

  useEffect(() => {
    const fetchBanners = async () => {
      const [homepage, program] = await Promise.all([
        bannersApi.getActiveHomepageBanners(),
        bannersApi.getActiveProgramBanners(),
      ]);
      
      if (homepage.data) setHomepageBanners(homepage.data);
      if (program.data) setProgramBanners(program.data);
    };

    fetchBanners();
  }, []);

  const features = [
    {
      icon: Zap,
      title: "Nội dung Viral",
      description: "Thư viện nội dung được cập nhật liên tục với các mẫu content viral nhất",
    },
    {
      icon: Shield,
      title: "Bảo mật",
      description: "Hệ thống phân quyền chặt chẽ, bảo vệ nội dung của bạn",
    },
    {
      icon: Rocket,
      title: "Hiệu quả",
      description: "Copy nhanh, chia sẻ dễ dàng với hotline và chữ ký tự động",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Banner Slider */}
      <HeroBannerSlider banners={homepageBanners} />

      {/* CTA Section */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/50 to-background" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Truy cập <span className="gradient-text">Thư viện Nội dung</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Đăng nhập để sử dụng toàn bộ nội dung viral, copy và chia sẻ ngay
            </p>
            <Button
              size="lg"
              onClick={() => navigate(ROUTES.AUTH)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Bắt đầu ngay
              <ArrowRight className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-xl p-6 card-hover"
              >
                <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Program Banners */}
      <ProgramBannerBox banners={programBanners} />
    </div>
  );
};

export default LandingPage;

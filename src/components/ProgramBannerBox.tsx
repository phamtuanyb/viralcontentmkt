import { motion } from "framer-motion";
import type { ProgramBanner } from "@/api/banners.api";

interface ProgramBannerBoxProps {
  banners: ProgramBanner[];
}

export const ProgramBannerBox = ({ banners }: ProgramBannerBoxProps) => {
  if (banners.length === 0) return null;

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold mb-8 text-center"
        >
          Chương trình <span className="gradient-text">nổi bật</span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner, index) => (
            <motion.a
              key={banner.id}
              href={banner.link_url || "#"}
              target={banner.link_url ? "_blank" : undefined}
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-xl glass card-hover"
            >
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-lg font-semibold mb-1">{banner.title}</h3>
                {banner.subtitle && (
                  <p className="text-sm text-muted-foreground">{banner.subtitle}</p>
                )}
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

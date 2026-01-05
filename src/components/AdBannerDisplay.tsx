import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { adBannersApi, type AdBanner, type AdBannerPlacement } from "@/api/ad-banners.api";
import { cn } from "@/lib/utils";

interface AdBannerDisplayProps {
  placement: AdBannerPlacement;
  className?: string;
}

export const AdBannerDisplay = ({ placement, className }: AdBannerDisplayProps) => {
  const [banners, setBanners] = useState<AdBanner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      setIsLoading(true);
      const { data } = await adBannersApi.getActiveByPlacement(placement);
      if (data) setBanners(data);
      setIsLoading(false);
    };

    fetchBanners();
  }, [placement]);

  // Auto rotate banners if there are multiple
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  if (isLoading || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  const handleClick = () => {
    if (currentBanner.target_url) {
      window.open(currentBanner.target_url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative w-full overflow-hidden rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm",
        className
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden",
          currentBanner.target_url && "cursor-pointer"
        )}
        onClick={handleClick}
        style={{ maxHeight: "200px" }}
      >
        <img
          src={currentBanner.image_url}
          alt={currentBanner.title}
          className="w-full h-auto object-cover object-center"
          style={{ maxHeight: "200px" }}
        />
        
        {/* Subtle overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
        
        {/* Ad label */}
        <div className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-black/40 text-white/80 rounded backdrop-blur-sm">
          Quảng cáo
        </div>
      </div>

      {/* Dots indicator for multiple banners */}
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                index === currentIndex
                  ? "bg-white w-4"
                  : "bg-white/50 hover:bg-white/70"
              )}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Camera, Expand, X, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import SmartLink from "@/components/SmartLink";
import { useHomeContent } from "@/components/home/HomeContentProvider";

interface GalleryImage {
  id: string;
  title: string;
  category: string;
  image_url: string;
}

const GallerySection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [isAnimating, setIsAnimating] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const content = useHomeContent();

  useEffect(() => {
    fetchGalleryImages();
  }, []);

  const fetchGalleryImages = async () => {
    try {
      const data = await api.get<GalleryImage[]>("/api/gallery/preview");
      if (data.length > 0) {
        setGalleryImages(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const nextSlide = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection("right");
    setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating, galleryImages.length]);

  const prevSlide = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection("left");
    setCurrentIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating, galleryImages.length]);

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentIndex) return;
    setIsAnimating(true);
    setDirection(index > currentIndex ? "right" : "left");
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    setIsAutoPlaying(false);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
  };

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxOpen) {
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") setLightboxIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
        if (e.key === "ArrowRight") setLightboxIndex((prev) => (prev + 1) % galleryImages.length);
      } else {
        if (e.key === "ArrowLeft") prevSlide();
        if (e.key === "ArrowRight") nextSlide();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, nextSlide, prevSlide]);

  const getVisibleImages = () => {
    const indices = [];
    for (let i = -2; i <= 2; i++) {
      indices.push((currentIndex + i + galleryImages.length) % galleryImages.length);
    }
    return indices;
  };

  // Don't render if no images
  if (isLoading || galleryImages.length === 0) {
    return null;
  }

  return (
    <>
      <section className="relative bg-foreground py-20 md:py-32 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-20">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Camera className="w-5 h-5 text-background/60" />
                <span className="text-xs uppercase tracking-widest text-background/60">
                  {content.gallery.eyebrow}
                </span>
              </div>
              <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl text-background leading-none">
                {content.gallery.title}
              </h2>
            </div>
            <div className="flex flex-col items-start md:items-end gap-4">
              <p className="text-sm text-background/60 max-w-sm leading-relaxed">
                {content.gallery.description}
              </p>
              <SmartLink 
                href={content.gallery.ctaHref}
                className="group inline-flex items-center gap-2 text-sm font-medium text-background hover:text-background/80 transition-colors"
              >
                {content.gallery.ctaLabel}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </SmartLink>
            </div>
          </div>

          {/* Main Carousel */}
          <div 
            className="relative"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            {/* Cards Container */}
            <div className="relative h-[400px] md:h-[500px] flex items-center justify-center perspective-1000">
              {getVisibleImages().map((imageIndex, i) => {
                const offset = i - 2; // -2, -1, 0, 1, 2
                const image = galleryImages[imageIndex];
                const isCenter = offset === 0;
                
                return (
                  <div
                    key={`${image.id}-${i}`}
                    className={cn(
                      "absolute transition-all duration-500 ease-out cursor-pointer",
                      isCenter ? "z-20" : offset === -1 || offset === 1 ? "z-10" : "z-0"
                    )}
                    style={{
                      transform: `
                        translateX(${offset * (window.innerWidth < 768 ? 60 : 120)}%) 
                        scale(${isCenter ? 1 : offset === -1 || offset === 1 ? 0.85 : 0.7})
                        rotateY(${offset * -5}deg)
                      `,
                      opacity: Math.abs(offset) <= 1 ? 1 : 0.4,
                      filter: isCenter ? 'none' : 'brightness(0.7)',
                    }}
                    onClick={() => isCenter && openLightbox(imageIndex)}
                  >
                    <div className={cn(
                      "relative overflow-hidden rounded-2xl md:rounded-3xl shadow-2xl group",
                      "w-[280px] md:w-[400px] lg:w-[500px]",
                      "aspect-[4/3]"
                    )}>
                      <img
                        src={image.image_url}
                        alt={image.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      
                      {/* Overlay */}
                      <div className={cn(
                        "absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent",
                        "transition-opacity duration-300",
                        isCenter ? "opacity-100" : "opacity-0"
                      )} />
                      
                      {/* Content */}
                      <div className={cn(
                        "absolute bottom-0 left-0 right-0 p-4 md:p-6",
                        "transition-all duration-500",
                        isCenter ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                      )}>
                        <span className="inline-block px-3 py-1 text-[10px] md:text-xs uppercase tracking-wider bg-background/20 backdrop-blur-sm text-background rounded-full mb-2 md:mb-3">
                          {image.category}
                        </span>
                        <h3 className="font-serif text-lg md:text-2xl text-background">
                          {image.title}
                        </h3>
                      </div>

                      {/* Expand Icon */}
                      <div className={cn(
                        "absolute top-4 right-4 w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm",
                        "flex items-center justify-center",
                        "transition-all duration-300",
                        isCenter ? "opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100" : "opacity-0"
                      )}>
                        <Expand className="w-5 h-5 text-background" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className={cn(
                "absolute left-2 md:left-8 top-1/2 -translate-y-1/2 z-30",
                "w-12 h-12 md:w-14 md:h-14 rounded-full",
                "bg-background/10 backdrop-blur-sm border border-background/20",
                "flex items-center justify-center",
                "transition-all duration-300 hover:bg-background/20 hover:scale-110",
                "text-background"
              )}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              className={cn(
                "absolute right-2 md:right-8 top-1/2 -translate-y-1/2 z-30",
                "w-12 h-12 md:w-14 md:h-14 rounded-full",
                "bg-background/10 backdrop-blur-sm border border-background/20",
                "flex items-center justify-center",
                "transition-all duration-300 hover:bg-background/20 hover:scale-110",
                "text-background"
              )}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-2 mt-8 md:mt-12">
            {galleryImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  "transition-all duration-300 rounded-full",
                  currentIndex === index 
                    ? "w-8 h-2 bg-background" 
                    : "w-2 h-2 bg-background/30 hover:bg-background/50"
                )}
              />
            ))}
          </div>

          {/* Counter */}
          <div className="flex items-center justify-center mt-6">
            <span className="font-mono text-sm text-background/50">
              {String(currentIndex + 1).padStart(2, '0')} / {String(galleryImages.length).padStart(2, '0')}
            </span>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-foreground/95 backdrop-blur-xl flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-background/10 backdrop-blur-sm flex items-center justify-center text-background hover:bg-background/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
            }}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-background/10 backdrop-blur-sm flex items-center justify-center text-background hover:bg-background/20 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((prev) => (prev + 1) % galleryImages.length);
            }}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-background/10 backdrop-blur-sm flex items-center justify-center text-background hover:bg-background/20 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Image */}
          <div 
            className="relative max-w-[90vw] max-h-[85vh] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={galleryImages[lightboxIndex].image_url}
              alt={galleryImages[lightboxIndex].title}
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-foreground/80 to-transparent rounded-b-xl">
              <span className="inline-block px-3 py-1 text-xs uppercase tracking-wider bg-background/20 backdrop-blur-sm text-background rounded-full mb-2">
                {galleryImages[lightboxIndex].category}
              </span>
              <h3 className="font-serif text-2xl text-background">
                {galleryImages[lightboxIndex].title}
              </h3>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-3 bg-background/10 backdrop-blur-sm rounded-full">
            {galleryImages.map((image, index) => (
              <button
                key={image.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(index);
                }}
                className={cn(
                  "w-12 h-8 rounded overflow-hidden transition-all duration-300",
                  lightboxIndex === index 
                    ? "ring-2 ring-background scale-110" 
                    : "opacity-50 hover:opacity-100"
                )}
              >
                <img
                  src={image.image_url}
                  alt={image.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default GallerySection;

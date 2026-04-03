import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Camera, Expand, X, Grid3X3, LayoutGrid, ArrowLeft, Loader2, ImageOff, Images } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getOptimizedImageUrl } from "@/lib/images";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { format } from "date-fns";
import { api } from "@/lib/api";

interface GalleryImage {
  id: string;
  title: string;
  description: string | null;
  category: string;
  image_url: string;
  event_date: string | null;
  is_featured: boolean;
  album_id: string | null;
}

interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  event_date: string | null;
  is_featured: boolean;
  image_count?: number;
}

const Gallery = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const albumIdParam = searchParams.get("album");
  
  const [view, setView] = useState<"carousel" | "grid">("grid");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumImages, setAlbumImages] = useState<GalleryImage[]>([]);

  useEffect(() => {
    fetchAlbums();
  }, []);

  useEffect(() => {
    if (albumIdParam && albums.length > 0) {
      const album = albums.find(a => a.id === albumIdParam);
      if (album) {
        setSelectedAlbum(album);
        fetchAlbumImages(albumIdParam);
      }
    } else {
      setSelectedAlbum(null);
      setAlbumImages([]);
    }
  }, [albumIdParam, albums]);

  const fetchAlbums = async () => {
    setIsLoading(true);
    try {
      const albumsData = await api.get<Album[]>("/api/gallery/albums");
      setAlbums(albumsData);
    } catch (error) {
      console.error("Failed to fetch albums:", error);
      setAlbums([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAlbumImages = async (albumId: string) => {
    setIsLoading(true);
    try {
      const data = await api.get<GalleryImage[]>(`/api/gallery/albums/${albumId}/images`);
      setAlbumImages(data);
    } catch (error) {
      console.error("Failed to fetch album images:", error);
      setAlbumImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openAlbum = (album: Album) => {
    setSearchParams({ album: album.id });
  };

  const closeAlbum = () => {
    setSearchParams({});
    setSelectedAlbum(null);
    setAlbumImages([]);
  };

  const nextSlide = useCallback(() => {
    if (isAnimating || albumImages.length === 0) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % albumImages.length);
    setTimeout(() => setIsAnimating(false), 600);
  }, [isAnimating, albumImages.length]);

  const prevSlide = useCallback(() => {
    if (isAnimating || albumImages.length === 0) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + albumImages.length) % albumImages.length);
    setTimeout(() => setIsAnimating(false), 600);
  }, [isAnimating, albumImages.length]);

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentIndex) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 600);
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

  // Auto-play for carousel
  useEffect(() => {
    if (!isAutoPlaying || view !== "carousel" || albumImages.length === 0) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide, view, albumImages.length]);

  // Reset index when album changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedAlbum]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxOpen && albumImages.length > 0) {
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") setLightboxIndex((prev) => (prev - 1 + albumImages.length) % albumImages.length);
        if (e.key === "ArrowRight") setLightboxIndex((prev) => (prev + 1) % albumImages.length);
      } else if (view === "carousel" && selectedAlbum) {
        if (e.key === "ArrowLeft") prevSlide();
        if (e.key === "ArrowRight") nextSlide();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, nextSlide, prevSlide, view, albumImages.length, selectedAlbum]);

  const getVisibleImages = () => {
    if (albumImages.length === 0) return [];
    const indices = [];
    for (let i = -2; i <= 2; i++) {
      const idx = (currentIndex + i + albumImages.length) % albumImages.length;
      indices.push(idx);
    }
    return indices;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-8">
          {selectedAlbum ? (
            <button 
              onClick={closeAlbum}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Albums
            </button>
          ) : (
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          )}

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Camera className="w-5 h-5 text-accent" />
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  {selectedAlbum ? "Album" : "Event Albums"}
                </span>
              </div>
              <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-foreground leading-none">
                {selectedAlbum ? selectedAlbum.title : "Gallery"}
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                {selectedAlbum 
                  ? selectedAlbum.description || `${albumImages.length} photos from this event`
                  : "Explore our event albums and relive the memories from workshops, hackathons, and community gatherings."
                }
              </p>
            </div>

            {selectedAlbum && albumImages.length > 0 && (
              <div className="flex items-center gap-1 bg-muted p-1 rounded-full">
                <button
                  onClick={() => setView("carousel")}
                  className={cn(
                    "p-2 rounded-full transition-all duration-300",
                    view === "carousel" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView("grid")}
                  className={cn(
                    "p-2 rounded-full transition-all duration-300",
                    view === "grid" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      {isLoading ? (
        <section className="py-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </section>
      ) : selectedAlbum ? (
        // Album Images View
        albumImages.length === 0 ? (
          <section className="py-20">
            <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
              <ImageOff className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-serif text-2xl text-muted-foreground mb-2">No Photos Yet</h3>
              <p className="text-muted-foreground/70">This album doesn't have any photos yet.</p>
            </div>
          </section>
        ) : view === "carousel" ? (
          /* Carousel View */
          <section className="relative bg-foreground py-16 md:py-24 overflow-hidden">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                backgroundSize: '40px 40px',
              }} />
            </div>

            <div 
              className="relative max-w-7xl mx-auto px-4 md:px-8"
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
            >
              <div className="relative h-[450px] md:h-[550px] lg:h-[600px] flex items-center justify-center">
                {getVisibleImages().map((imageIndex, i) => {
                  const offset = i - 2;
                  const image = albumImages[imageIndex];
                  const isCenter = offset === 0;
                  
                  return (
                    <div
                      key={`${image.id}-${i}`}
                      className={cn(
                        "absolute transition-all duration-700 ease-out cursor-pointer",
                        isCenter ? "z-20" : Math.abs(offset) === 1 ? "z-10" : "z-0"
                      )}
                      style={{
                        transform: `
                          translateX(${offset * (typeof window !== 'undefined' && window.innerWidth < 768 ? 55 : 100)}%) 
                          scale(${isCenter ? 1 : Math.abs(offset) === 1 ? 0.8 : 0.65})
                          rotateY(${offset * -8}deg)
                        `,
                        opacity: Math.abs(offset) <= 1 ? 1 : 0.3,
                        filter: isCenter ? 'none' : 'brightness(0.6)',
                      }}
                      onClick={() => isCenter && openLightbox(imageIndex)}
                    >
                      <div className={cn(
                        "relative overflow-hidden rounded-2xl md:rounded-3xl shadow-2xl group",
                        "w-[300px] md:w-[450px] lg:w-[600px]",
                        "aspect-[16/10]"
                      )}>
                        <img
                          src={getOptimizedImageUrl(image.image_url, {
                            width: isCenter ? 1200 : 640,
                            quality: isCenter ? 78 : 66,
                          })}
                          alt={image.title}
                          loading={isCenter ? "eager" : "lazy"}
                          decoding="async"
                          fetchPriority={isCenter ? "high" : "low"}
                          sizes={isCenter ? "(min-width: 1024px) 600px, (min-width: 768px) 450px, 300px" : "(min-width: 1024px) 400px, 240px"}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        
                        <div className={cn(
                          "absolute inset-0 bg-gradient-to-t from-foreground via-foreground/30 to-transparent",
                          "transition-opacity duration-500",
                          isCenter ? "opacity-80" : "opacity-0"
                        )} />
                        
                        <div className={cn(
                          "absolute bottom-0 left-0 right-0 p-6 md:p-8",
                          "transition-all duration-700",
                          isCenter ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                        )}>
                          <h3 className="font-serif text-2xl md:text-3xl lg:text-4xl text-background mb-2">
                            {image.title}
                          </h3>
                        </div>

                        <div className={cn(
                          "absolute top-4 right-4 w-12 h-12 rounded-full bg-background/20 backdrop-blur-sm",
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

                <button
                  onClick={prevSlide}
                  className={cn(
                    "absolute left-2 md:left-8 top-1/2 -translate-y-1/2 z-30",
                    "w-14 h-14 md:w-16 md:h-16 rounded-full",
                    "bg-background/10 backdrop-blur-md border border-background/20",
                    "flex items-center justify-center",
                    "transition-all duration-300 hover:bg-background/20 hover:scale-110",
                    "text-background"
                  )}
                >
                  <ChevronLeft className="w-6 h-6 md:w-7 md:h-7" />
                </button>
                <button
                  onClick={nextSlide}
                  className={cn(
                    "absolute right-2 md:right-8 top-1/2 -translate-y-1/2 z-30",
                    "w-14 h-14 md:w-16 md:h-16 rounded-full",
                    "bg-background/10 backdrop-blur-md border border-background/20",
                    "flex items-center justify-center",
                    "transition-all duration-300 hover:bg-background/20 hover:scale-110",
                    "text-background"
                  )}
                >
                  <ChevronRight className="w-6 h-6 md:w-7 md:h-7" />
                </button>
              </div>

              <div className="flex flex-col items-center gap-6 mt-8">
                <div className="w-full max-w-md h-1 bg-background/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-background rounded-full transition-all duration-500"
                    style={{ width: `${((currentIndex + 1) / albumImages.length) * 100}%` }}
                  />
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    {albumImages.slice(0, 10).map((_, index) => (
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
                    {albumImages.length > 10 && (
                      <span className="text-xs text-background/50">+{albumImages.length - 10}</span>
                    )}
                  </div>
                  <span className="font-mono text-sm text-background/50">
                    {String(currentIndex + 1).padStart(2, '0')} / {String(albumImages.length).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* Grid View */
          <section className="py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {albumImages.map((image, index) => (
                  <div
                    key={image.id}
                    className="group relative aspect-square overflow-hidden rounded-xl cursor-pointer"
                    onClick={() => openLightbox(index)}
                  >
                    <img
                      src={getOptimizedImageUrl(image.image_url, { width: 720, quality: 64 })}
                      alt={image.title}
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <h3 className="text-background font-medium text-sm truncate">{image.title}</h3>
                    </div>
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Expand className="w-4 h-4 text-background" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )
      ) : (
        // Albums List View
        albums.length === 0 ? (
          <section className="py-20">
            <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
              <Images className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-serif text-2xl text-muted-foreground mb-2">No Albums Yet</h3>
              <p className="text-muted-foreground/70">Check back later for event photos.</p>
            </div>
          </section>
        ) : (
          <section className="py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {albums.map((album) => (
                  <div
                    key={album.id}
                    className="group cursor-pointer"
                    onClick={() => openAlbum(album)}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted mb-4">
                      {album.cover_image_url ? (
                        <img
                          src={getOptimizedImageUrl(album.cover_image_url, { width: 900, quality: 68 })}
                          alt={album.title}
                          loading="lazy"
                          decoding="async"
                          fetchPriority="low"
                          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Images className="w-16 h-16 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <span className="text-background text-sm">View Album →</span>
                      </div>
                    </div>
                    <h3 className="font-serif text-xl text-foreground group-hover:text-accent transition-colors">
                      {album.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span>{album.image_count || 0} photos</span>
                      {album.event_date && (
                        <>
                          <span>•</span>
                          <span>{format(new Date(album.event_date), "MMMM yyyy")}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )
      )}

      {/* Lightbox */}
      {lightboxOpen && albumImages.length > 0 && (
        <div 
          className="fixed inset-0 z-50 bg-foreground/95 backdrop-blur-xl flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-background/10 backdrop-blur-sm flex items-center justify-center text-background hover:bg-background/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((prev) => (prev - 1 + albumImages.length) % albumImages.length);
            }}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-background/10 backdrop-blur-sm flex items-center justify-center text-background hover:bg-background/20 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((prev) => (prev + 1) % albumImages.length);
            }}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-background/10 backdrop-blur-sm flex items-center justify-center text-background hover:bg-background/20 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div 
            className="relative max-w-[90vw] max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getOptimizedImageUrl(albumImages[lightboxIndex].image_url, { width: 1800, quality: 82 })}
              alt={albumImages[lightboxIndex].title}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-foreground/80 to-transparent rounded-b-xl">
              <h3 className="font-serif text-2xl text-background">
                {albumImages[lightboxIndex].title}
              </h3>
              <p className="text-sm text-background/70 mt-1">
                {lightboxIndex + 1} of {albumImages.length}
              </p>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-3 bg-background/10 backdrop-blur-sm rounded-full max-w-[90vw] overflow-x-auto">
            {albumImages.slice(0, 12).map((image, index) => (
              <button
                key={image.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(index);
                }}
                className={cn(
                  "w-12 h-8 rounded overflow-hidden transition-all duration-300 flex-shrink-0",
                  lightboxIndex === index 
                    ? "ring-2 ring-background scale-110" 
                    : "opacity-50 hover:opacity-100"
                )}
              >
                <img
                  src={getOptimizedImageUrl(image.image_url, { width: 160, height: 120, fit: 'cover', quality: 58 })}
                  alt={image.title}
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
            {albumImages.length > 12 && (
              <span className="flex items-center text-xs text-background/50 px-2">+{albumImages.length - 12}</span>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Gallery;
